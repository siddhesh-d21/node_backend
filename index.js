const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const { Pool } = require('pg');
const jwt = require('jsonwebtoken');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);
const cors = require('cors');
app.use(cors());


const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'postgres',
  password: 'rootuser',
  port: 5432,
});


io.on('connection', (socket) => {
  console.log('Client connected');

  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

app.get('/search', async (req, res) => {
  const searchTerm = req.query.term;
  const query = `
  SELECT
    p.product_name
FROM
    products p
JOIN
    category c ON p.category_id = c.category_id
WHERE
    p.product_name ILIKE $1 
    OR p.product_info ILIKE $1 
    OR c.category3 ILIKE $1
    OR c.category2 ILIKE $1 
	  OR c.category1 ILIKE $1
    limit 5;
  `;
  
  try {
    const result = await pool.query(query, [`%${searchTerm}%`]);
    io.emit('searchResults', result.rows); // Emit search results to all connected clients
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/previous-orders/:user_id', async (req, res) => {
  //const token = req.headers.authorization.split(' ')[1]; Assuming JWT token is sent in the 'Authorization' header
  //const decodedToken = jwt.verify(token, 'your-secret-key');  Replace with your actual secret key
  const user_id = req.params.user_id;

  const query = `
  SELECT p.product_name,o.o_date,o.status 
  from products as p, orders as o 
  where o.user_id = $1 and p.product_id=o.product_id
  order by o.o_date desc;
  `;

  try {
    const result = await pool.query(query,[user_id]);
    res.json(result.rows);
    console.log(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
