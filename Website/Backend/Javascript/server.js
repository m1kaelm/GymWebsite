require('dotenv').config();
const express = require('express');
const path = require('path');

const cors = require('cors');
const session = require('express-session');

const app = express();
app.use(express.json()); //enables parsing of JSON bodies



// Middleware
app.use(cors({
    origin: "http://localhost:3000",
    credentials: true
  }));
  

// Add session handling
app.use(session({
  secret: process.env.SESSION_SECRET || 'secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 30 * 60 * 1000, // 30 minutes
    sameSite: 'lax'
  }
}));

app.use('/html', express.static(path.join(__dirname, '../../Frontend/html')));
app.use('/Javascript', express.static(path.join(__dirname, '../../Frontend/Javascript')));
app.use('/Css', express.static(path.join(__dirname, '../../Frontend/Css')));


// Import the API calls module
const API_calls = require('./API_calls');
app.use('/api', API_calls);

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
