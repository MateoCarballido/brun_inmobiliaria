require('dotenv').config({ quiet: true });

function toBoolean(value) {
  return String(value).toLowerCase() === 'true';
}

const baseConfig = {
  username: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'root',
  database: process.env.DB_NAME || 'brun_db',
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT || 3306),
  dialect: process.env.DB_DIALECT || 'mysql',
  logging: false
};

if (toBoolean(process.env.DB_SSL)) {
  baseConfig.dialectOptions = {
    ssl: {
      require: true,
      rejectUnauthorized: false
    }
  };
}

module.exports = {
  development: baseConfig,
  test: baseConfig,
  production: baseConfig
};
