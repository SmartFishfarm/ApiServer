
var express = require('express'),
    routes = express.Router();
var jwt = require('jsonwebtoken');
var Config = require('../config/config');
var Orm =  require('../orm');
var crypto = require('crypto');
var async = require('async');
var moment = require('moment');

const Sequelize = require('sequelize');
const Op = Sequelize.Op;
const nodemailer = require('nodemailer');
const smtpPool = require('nodemailer-smtp-pool');
var bcrypt = require('bcrypt');
var passport = require('passport');


  routes.post('/login', (req, res, next) => {
    passport.authenticate('local-login', {session: false}, (err, user, info) => {
      if (err || !user) {
	return res.status(400).json({
	  message: info ? info.message : 'Login failed',
	  user : user
	});
      }
      req.logIn(user, {session: false}, (err) => {
	if (err) {
	  res.send(err);
	} 
        const token = jwt.sign({ id: user.username }, Config.jwt_secret);
	//return res.json({user, token});
	return res.json({
          "user_id": user.id,
	  "company_id": user.company_id,
	  "token": token
	});

      });
    })(req, res, next);
  });


  routes.post('/signup', (req, res, next)  => {
    passport.authenticate('local-signup', function(err, user, info) {

      if (err) {
        console.log("passport err", err);
        return next(err); // will generate a 500 error
      }
      if (!user) {
        console.log("user error", user);
        //return res.send({ success : false, message : 'authentication failed' });
        return res.send({ success : false, message : info.message});
      }
      
      req.logIn(user, {session: false}, (loginErr) => {
        if (loginErr) {
          console.log("loginerr", loginerr);
          return next(loginErr);
        }
        return res.json({ success : true, message: 'Succesfully created user' });

	});      
    
    })(req, res, next);
  });

  routes.put('/password/:id', (req, res, next) => {
    Orm.Users.findOne({
      where: {
          id: req.params.id
      },
    }).then(user => {
      if (!user.validPassword(req.body.oldpass)) {
        res.json({message: '기존 패스워드가 일치하지 않습니다.'});
      } else {
	Orm.Users.update({password: Orm.Users.generateHash(req.body.newpass)},
	 {where: {username: user.username}, returning: true}).then(function(result) {
            res.status(200).send({
              message: '비밀번호가 변경되었습니다.',
            });
	 }).catch(function(err) {
	      console.log(err);
	 });

      }
    });
  });
 
  routes.post('/forgot', (req, res, next) => {
    
    if(req.body.email == '') {
      req.json('email required');
    }
    Orm.Users.findOne({
      where: {
	email: req.body.email,
      },
    }).then(user => {
	if(user == null) {
	  console.log('email not in database');
	  res.json('email not in db');
	} else {
	  const token = crypto.randomBytes(20).toString('hex');
	  user.update({
	    resetPasswordToken: token,
	    //resetPasswordExpires: Date.now() + 3600000,
	});

	  const transporter = nodemailer.createTransport(smtpPool({
	    service: 'Gmail',
	    auth: {
	      user: Config.mail_user,
	      pass: Config.mail_pass,
	    },
	    maxConnections: 5,
	  }));

	  const mailOptions = {
	    from: '어테크',
	    to: `${user.email}`,
	    subject: '비밀번호 재설정',
	    text : '귀하 (또는 다른 사람)가 귀하의 계정에 대한 비밀번호 재설정을 요청했기 때문에 메일을 수신 받았습니다.\n\n' +
	  '프로세스를 완료하려면 다음 링크를 클릭하거나 브라우저에 붙여 넣으십시오:\n\n' +
          'http://' + req.headers.host + ':8000/reset/' + token + '\n\n' +
	  '요청하지 않은 경우이 이메일을 무시하십시오. 비밀번호는 변경되지 않습니다.\n'
	};

	transporter.sendMail(mailOptions, (err, response) => {
	  if(err) {
	    console.error('there was an error: ', err);
	  } else {
	    console.log('here is the res: ', response);
	    res.status(200).json('recovery email sent');
	  }
	});
      }
    });
  });


    routes.post('/reset/:token', function(req, res) {
	async.waterfall([
    	  function(done) {
    	    Orm.Users.findOne({
      	      where: {
		resetPasswordToken : req.params.token,
		//resetPasswordExpires: { $gt: Date.now() }
      	      },
    	    }).then(user => {

	    if (!user) {
              return res.send('Password reset token is invalid or has expired.');
            } 
	    if (req.body.newpass != req.body.passchk) {
	      return res.send('new password and confirm password does not match');
	    }

            user.password = Orm.Users.generateHash(req.body.newpass);
            user.resetPasswordToken = undefined;
            user.resetPasswordExpires = undefined;

	    user.save().then(() => {
              req.logIn(user, function(err) {
		res.json('Success! Your password has been changed.');
                done(err, user);
              });
	    });

    	    });

        }
      ], function(err) {
	  console.log(err);
      });
  });


  routes.put('/updatePassword', (req, res, next) => {
    passport.authenticate('jwt', { session: false }, (err, user, info) => {
      if (err) {
        console.log(err);
      }
      if (info != undefined) {
        res.send(info.message);
      } else {
        Orm.Users.findOne({
          where: {
            username: user.username,
          },
        }).then(user => {
          if (user != null) {
            console.log('user found in db');
            bcrypt
              .hash(req.body.password, 10)
              .then(hashedPassword => {
                user.update({
                  password: hashedPassword,
                });
              })
              .then(() => {
                console.log('password updated');
                res
                  .status(200)
                  .send({ auth: true, message: 'password updated' });
              });
          } else {
            console.log('no user exists in db to update');
            res.status(404).json('no user exists in db to update');
          }
        });
      }
    })(req, res, next);
  });


module.exports = routes;


