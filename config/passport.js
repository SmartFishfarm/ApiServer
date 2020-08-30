//load all the things we need
var LocalStrategy = require('passport-local').Strategy;
var bcrypt = require('bcrypt');
var Config = require('./config');
var Sequelize = require('sequelize');
const JwtStrategy = require('passport-jwt').Strategy,
  ExtractJwt = require('passport-jwt').ExtractJwt,
  Orm = require('../orm'), 
  Op = Sequelize.Op;


module.exports = function(passport) {

 /**
  * 앱 접근권한
  */
  passport.use('local-login', new LocalStrategy({
    usernameField: 'username',
    passwordField: 'password',
    session: false,
  }, (username, password, done) => {


	var isValidPassword = function(password, hash) {
            return bcrypt.compareSync(password, hash);
        }
	
        Orm.Users.findOne({
	  where: {
	    username: username,
	  },
        }).then(user => {
  	  if (!user) {
	    return done(null, false, { message: '해당되는 아이디가 없습니다.' });
	  } 
	  //console.log(isValidPassword(password, user.password));
	  //if (!isValidPassword(password, user.password)) {
	  
	  if (!user.validPassword(password)) {
            return done(null, false, {
              message: '비밀번호가 일치하지 않습니다.'
            });
          }

          Orm.Users.findOne({
	    where: {
	      username: username,
	      verify: 1,
	    },
          }).then(user => { 
	    if(!user) {
		return done(null, false, {message: '관리자 승인이 되지 않았습니다.'});
	    }
	    var userinfo = user.get();
	    return done(null, userinfo);
	  });
	
  	
        }).catch(function(err) {
            console.log("Error:", err);
 
            return done(null, false, {
                message: '로그인 에러발생'
            });
 
        });
    },
    ),
  );


  passport.use('local-signup', new LocalStrategy(
    {
      usernameField: 'username',
      passwordField: 'password',
      passReqToCallback: true,
      session: false,
    },
    (req, username, password, done) => {
      try {
        Orm.Users.findOne({
          where: {
            [Op.or]: [
              {
                username: username,
              },
              { email: req.body.email },
            ],
          },
        }).then(user => {
          if (user != null) {
            return done(null, false, {
              message: '아이디 또는 이메일이 이미 사용중입니다.',
            });
          } else {
              Orm.Company.findOne({
		where: { company: req.body.company }
	      }).then((company) => {
                if (company == null) {
		  return done(null, false, {
		    message: '해당 양어장이 존재하지 않습니다.',
		  });
		} else {
                    Orm.Users.create({
                      username,
                      password: Orm.Users.generateHash(password),
                      email: req.body.email,
		      company_id: company.id,
   		      verify: 0,
                    }).then(user => {
                      return done(null, user);
                    }).catch(function(err) {
		      console.log(err);
	            });
                }
	      });
          }
        });
      } catch (err) {
        done(err);
      }
    },
  ),
);

  const opts = {
    jwtFromRequest: ExtractJwt.fromAuthHeaderWithScheme('bearer'),
    secretOrKey: Config.jwt_secret,
  };


  passport.use('jwt',
    new JwtStrategy(opts, (jwt_payload, done) => {
      try {
        Orm.Users.findOne({
	  where: {
	    username: jwt_payload.id,
	 },
	}).then(user => {
	  if (user) {
	    done(null, user);
	  } else if (!user.verify) {
	    console.log('user not verified');
	    done(null, false);
	  } else {
	    console.log('user not found in db');
	    done(null, false);
	  }
        });
      } catch (err) {
	done(err);
      }
    }),  
  );


 /**
  * 관리자 접근권한
  */

  passport.use('admin-login', new LocalStrategy({
    usernameField: 'username',
    passwordField: 'password',
    session: false,
  }, (username, password, done) => {

	var isValidPassword = function(password, hash) {
            return bcrypt.compareSync(password, hash);
        }
	
        Orm.Admins.findOne({
	  where: {
	    username: username,
	    verify: 1
	  },
        }).then(user => {
  	  if (!user) {
	    return done(null, false, { message: '해당되는 아이디가 없습니다.' });
	  } 
	  //console.log(isValidPassword(password, user.password));
	  //if (!isValidPassword(password, user.password)) {
	  
	  if (!user.validPassword(password)) {
            return done(null, false, {
              message: '비밀번호가 일치하지 않습니다.'
            });
          }
	  
	  var userinfo = user.get();
	  return done(null, userinfo);

        }).catch(function(err) {
            return done(null, false, {
                message: '로그인 문제가 발생했습니다.'
            });
 
        });
    },
    ),
  );

  passport.use('admin-signup', new LocalStrategy(
    {
      usernameField: 'username',
      passwordField: 'password',
      passReqToCallback: true,
      session: false,
    },
    (req, username, password, done) => {
      try {
        Orm.Admins.findOne({
          where: {
            [Op.or]: [
              {
                username: username,
              },
              { email: req.body.email },
            ],
          },
        }).then(user => {
          if (user != null) {
            return done(null, false, {
              message: '아이디 또는 이메일이 이미 사용중입니다.',
            });
          } else {
              Orm.Admins.create({
                username,
                password: Orm.Admins.generateHash(password),
                email: req.body.email,
   	        verify: 0,
              }).then(user => {
                return done(null, user);
              }).catch(function(err) {
		console.log(err);
	      });
          }
        });
      } catch (err) {
        done(err);
      }
    },
  ),
);


  passport.use('jwt-admin',
    new JwtStrategy(opts, (jwt_payload, done) => {
      try {
        Orm.Admins.findOne({
	  where: {
	    username: jwt_payload.id,
	 },
	}).then(user => {
	  if (user) {
	    done(null, user);
	  } else {
	    console.log('You are not an administrator.');
	    done(null, false);
	  }
        });
      } catch (err) {
	done(err);
      }
    }),  
  );


};


