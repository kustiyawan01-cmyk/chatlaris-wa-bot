require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function run() {
  try {
    const res = await pool.query('SELECT * FROM antrean_chat ORDER BY id ASC');
    let currentCustomer = 'Unknown';
    for (const row of res.rows) {
      if (row.dari !== 'AI' && row.dari !== 'Agen' && row.dari !== 'Tester') {
        currentCustomer = row.dari;
      }
      if (!row.nomor_pelanggan) {
        await pool.query('UPDATE antrean_chat SET nomor_pelanggan = $1 WHERE id = $2', [currentCustomer, row.id]);
      }
    }
    console.log('Selesai memperbaiki data lama!');
  } catch (err) {
    console.error(err);
  } finally {
    pool.end();
  }
}

run();
