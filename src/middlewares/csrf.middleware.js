const csurf = require('csurf');

// Use csurf without cookies; token stored in session.
module.exports = csurf({ cookie: false });
