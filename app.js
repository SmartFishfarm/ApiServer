//require('console-stamp')(console, 'yyyy/mm/dd HH:MM:ss.l');

var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var crypto = require('crypto');
var cors = require('cors');

var indexRouter = require('./routes/index');

var passport = require('passport');
var LocalStrategy  = require('passport-local').Strategy;

require('./config/passport')(passport);

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use(cors());
app.use(passport.initialize());

app.use(function(req, res, next) {
   res.header("Access-Control-Allow-Origin", "*");
   res.header('Access-Control-Allow-Methods', 'POST, GET, DELETE, PUT');
   res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
   //res.header("Content-Type", "application/json; charset=utf-8");
   res.header("Content-Type", "application/x-www-form-urlencoded; charset=utf-8");
   next();
});

var authRouter = require('./routes/auth.js');
var appGetRouter = require('./routes/app-get.js');
var appPostRouter = require('./routes/app-post.js');

var adminGetRouter = require('./routes/admin-get.js');
var adminPostRouter = require('./routes/admin-post.js');
var adminAuthRouter = require('./routes/admin-auth.js');

app.use('/', indexRouter);

app.use('/api/auth', authRouter);
app.use('/api', appGetRouter);
app.use('/api', appPostRouter);

app.use('/admin', adminGetRouter);
app.use('/admin', adminPostRouter);
app.use('/admin', adminAuthRouter);


// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
