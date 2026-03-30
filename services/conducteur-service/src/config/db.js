const { Pool } = require('pg');

const pool = process.env.DATABASE_URL
   ? new Pool({ connectionString: process.env.DATABASE_URL })
   : new Pool({
      host: process.env.POSTGRES_HOST || 'localhost',
      port: Number(process.env.POSTGRES_PORT || 5432),
      database: process.env.POSTGRES_DB || 'fleet',
      user: process.env.POSTGRES_USER || 'postgres',
      password: process.env.POSTGRES_PASSWORD || 'postgres',
   });

module.exports = pool;