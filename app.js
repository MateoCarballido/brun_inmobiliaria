var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var session = require('express-session');
require('dotenv').config({ quiet: true });
var db = require('./database/models');
var SequelizeStore = require('connect-session-sequelize')(session.Store);
var seoUtils = require('./lib/seo');

var indexRouter = require('./routes/index');
var propertiesRouter = require('./routes/properties');
var usersRouter = require('./routes/users');

var app = express();
var isProduction = process.env.NODE_ENV === 'production';
var cookieSecret = process.env.COOKIE_SECRET || 'change-me-cookie-secret';
var sessionSecret = process.env.SESSION_SECRET || 'change-me-session-secret';
var sessionMaxAgeMs = Number(process.env.SESSION_MAX_AGE_MS || 1000 * 60 * 60 * 24 * 7);
var forceSecureCookie = process.env.SESSION_SECURE === 'true';
var sessionStore = new SequelizeStore({
  db: db.sequelize,
  tableName: 'sessions',
  expiration: sessionMaxAgeMs,
  checkExpirationInterval: 15 * 60 * 1000
});

if (isProduction && (cookieSecret === 'change-me-cookie-secret' || sessionSecret === 'change-me-session-secret')) {
  throw new Error('Faltan COOKIE_SECRET/SESSION_SECRET en produccion.');
}

if (isProduction) {
  app.set('trust proxy', 1);
}

sessionStore.sync().catch(function(error) {
  console.error('No se pudo inicializar la tabla de sesiones:', error.message);
});

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser(cookieSecret));
app.use(express.static(path.join(__dirname, 'public')));

app.use(function(req, res, next) {
  var siteUrl = seoUtils.normalizeSiteUrl(process.env.SITE_URL);
  res.locals.siteUrl = siteUrl;
  res.locals.seo = seoUtils.buildSeo({
    siteUrl: siteUrl,
    canonicalPath: req.path,
    title: 'Brun Propiedades',
    description: 'Brun Propiedades, inmobiliaria en Buenos Aires con propiedades en venta y alquiler.'
  });
  return next();
});

app.use(function(req, res, next) {
  req.currentUser = null;
  return next();
});

app.use(session({
  store: sessionStore,
  secret: sessionSecret,
  name: process.env.SESSION_COOKIE_NAME || 'brun.sid',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: sessionMaxAgeMs,
    httpOnly: true,
    sameSite: 'lax',
    secure: isProduction || forceSecureCookie
  }
}));

app.use(function(req, res, next) {
  if (req.session.user !== undefined) {
    req.currentUser = req.session.user;
    res.locals.currentUser = req.session.user;
  }
  return next();
});

app.use(function(req, res, next) {
  if (req.signedCookies.user !== undefined && req.session.user === undefined) {
    try {
      const cookieUser = JSON.parse(req.signedCookies.user);
      req.session.user = cookieUser;
      req.currentUser = cookieUser;
      res.locals.currentUser = cookieUser;
    } catch (error) {
      res.clearCookie('user');
    }
  }

  if (req.currentUser === null) {
    res.locals.currentUser = null;
  }

  return next();
});

app.use('/', indexRouter);
app.use('/propiedades', propertiesRouter);
app.use('/users', usersRouter);

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
