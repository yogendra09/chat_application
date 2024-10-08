var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const mongoStore = require('connect-mongo');
require('dotenv').config();
var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
const userModel = require('./Model/user')

const passport = require('passport')
const ExpressSession = require('express-session')

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');


app.use(
  ExpressSession({
    resave: false,
    saveUninitialized: false,
    secret: 'sara',
    cookie:{maxAge:1000*60*60*2},
    store:mongoStore.create({
      mongoUrl:process.env.MONGO_URL,
      autoRemove:'disabled'
    })
  })
);
app.use(passport.initialize());
app.use(passport.session());
passport.serializeUser(userModel.serializeUser());
passport.deserializeUser(userModel.deserializeUser());


app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});



async function clearSockets() {
  var allUser = await userModel.find({})
  await Promise.all(
    allUser.map(async user => {
      user.socketId = ''
      await user.save()
    })
  )
}
clearSockets()



// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
