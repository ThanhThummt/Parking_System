const express = require('express');
const session = require('express-session');
const path = require('path');
const env = require('./config/env');
const csrfProtection = require('./middlewares/csrf.middleware');
const errorHandler = require('./middlewares/error-handler.middleware');

const app = express();

// View engine
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, '..', 'public')));

// Session (simple memory store for development)
app.use(session({
  secret: env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 2 * 60 * 60 * 1000 } // 2h
}));

// CSRF protection
app.use(csrfProtection);

// Make current user and CSRF token available to views
app.use((req, res, next) => {
  res.locals.currentUser = req.session && req.session.user ? req.session.user : null;
  // csurf adds a req.csrfToken() function
  res.locals.csrfToken = req.csrfToken ? req.csrfToken() : '';
  next();
});

const homeRoutes = require('./routes/home.routes');

const customersRoutes = require('./routes/customers.routes');
const vehiclesRoutes = require('./routes/vehicles.routes');
const profileRoutes = require('./routes/profile.routes');


app.use('/', homeRoutes);
app.use('/', customersRoutes);
app.use('/', vehiclesRoutes);
app.use('/', profileRoutes);





// Error handling – must be after all routes
app.use(errorHandler);

module.exports = app;
