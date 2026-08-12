const express = require('express');
const { Pool } = require('pg');
const redis = require('redis');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// PostgreSQL setup
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'ticket-postgres',
  database: process.env.DB_NAME || 'support_db',
  password: process.env.DB_PASSWORD || 'password',
  port: process.env.DB_PORT || 5432,
});

// Redis setup
const redisClient = redis.createClient({
  url: process.env.REDIS_URL || 'redis://ticket-redis:6379'
});

redisClient.on('error', (err) => console.log('Redis Client Error', err));

// Connect to Redis
async function connectRedis() {
  try {
    await redisClient.connect();
    console.log('Connected to Redis');
  } catch (err) {
    console.error('Failed to connect to Redis', err);
  }
}
connectRedis();

// API Endpoints

// 1. Get all tickets (with Redis caching)
app.get('/api/tickets', async (req, res) => {
  try {
    const cachedTickets = await redisClient.get('active_tickets');
    if (cachedTickets) {
      console.log('Serving from Redis cache');
      return res.json(JSON.parse(cachedTickets));
    }

    const result = await pool.query('SELECT * FROM tickets ORDER BY created_at DESC');
    const tickets = result.rows;

    // Cache for 60 seconds
    await redisClient.setEx('active_tickets', 60, JSON.stringify(tickets));
    console.log('Serving from Database');
    res.json(tickets);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 2. Create a new ticket
app.post('/api/tickets', async (req, res) => {
  const { title, description } = req.body;
  if (!title || !description) {
    return res.status(400).json({ error: 'Title and description are required' });
  }

  try {
    const result = await pool.query(
      'INSERT INTO tickets (title, description, status) VALUES ($1, $2, $3) RETURNING *',
      [title, description, 'open']
    );
    // Invalidate cache
    await redisClient.del('active_tickets');
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 3. Resolve a ticket
app.put('/api/tickets/:id/resolve', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      'UPDATE tickets SET status = $1 WHERE id = $2 RETURNING *',
      ['resolved', id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Ticket not found' });
    }
    // Invalidate cache
    await redisClient.del('active_tickets');
    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 4. Healthcheck
app.get('/health', (req, res) => {
  res.json({ status: 'OK' });
});

app.listen(port, () => {
  console.log(`Backend server running on port ${port}`);
});
