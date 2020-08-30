
var express = require('express'),
    routes = express.Router();
var jwt = require('jsonwebtoken');
var Config = require('../config/config');
var crypto = require('crypto');
const Sequelize = require('sequelize');
const Op = Sequelize.Op;
const nodemailer = require('nodemailer');
const smtpPool = require('nodemailer-smtp-pool');
var bcrypt = require('bcrypt');
var passport = require('passport');

  routes.post('/login', (req, res, next) => {
    passport.authenticate('admin-login', {session: false}, (err, user, info) => {

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
	
	return res.json({user, token});
      });
    })(req, res, next);
  });

  routes.post('/signup', (req, res, next)  => {
    passport.authenticate('admin-signup', function(err, user, info) {

      if (err) {
        console.log("passport err", err);
        return next(err); // will generate a 500 error
      }
      if (!user) {
        console.log("user error", user);
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

module.exports = routes;


