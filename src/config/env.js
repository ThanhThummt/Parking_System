require('dotenv').config();

// Determine if the app should run in mock mode.  Set USE_MOCK=true in .env.
const USE_MOCK = process.env.USE_MOCK === 'true';

// Only enforce DB credentials when NOT in mock mode.
if (!USE_MOCK) {
  const required = [
    'DB_HOST',
    'DB_USER',
    'DB_PASSWORD',
    'DB_NAME',
    'SESSION_SECRET',
  ];
  required.forEach(key => {
    if (!process.env[key]) {
      console.error(`Missing required environment variable ${key}`);
      process.exit(1);
    }
  });
}

module.exports = {
  USE_MOCK,
  DB_HOST: process.env.DB_HOST,
  DB_USER: process.env.DB_USER,
  DB_PASSWORD: process.env.DB_PASSWORD,
  DB_NAME: process.env.DB_NAME,
  SESSION_SECRET: process.env.SESSION_SECRET,
  PORT: process.env.PORT || 3000,
};

const required = [
  'DB_HOST',
  'DB_USER',
  'DB_PASSWORD',
  'DB_NAME',
  'SESSION_SECRET',
];

if (!module.exports.USE_MOCK) {
  required.forEach(key => {
    if (!process.env[key]) {
      console.error(`Missing required environment variable ${key}`);
      process.exit(1);
    }
  });
}

  if (!process.env[key]) {
    console.error(`Missing required environment variable ${key}`);
    process.exit(1);
  }
});

module.exports = {
  USE_MOCK: process.env.USE_MOCK === 'true',
  DB_HOST: process.env.DB_HOST,
  DB_USER: process.env.DB_USER,
  DB_PASSWORD: process.env.DB_PASSWORD,
  DB_NAME: process.env.DB_NAME,
  SESSION_SECRET: process.env.SESSION_SECRET,
  PORT: process.env.PORT || 3000,
};
