require('dotenv').config();
const express = require('express');
const path = require('path');

const cors = require('cors');
const session = require('express-session');

const app = express();
app.use(express.json()); //enables parsing of JSON bodies



// Middleware
app.use(cors({
    origin: 'http://localhost:3000', // Specify exact origin
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
  

// Add session handling
app.use(session({
    secret: process.env.SESSION_SECRET || 'secret-key',
    resave: true,
    saveUninitialized: true,
    cookie: {
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        sameSite: 'lax',
        secure: false, // Set to true in production with HTTPS
        httpOnly: true
    }
}));

app.use('/html', express.static(path.join(__dirname, '../../Frontend/html')));
app.use('/Javascript', express.static(path.join(__dirname, '../../Frontend/Javascript')));
app.use('/Css', express.static(path.join(__dirname, '../../Frontend/Css')));
app.use('/media', express.static(path.join(__dirname, '../../media')));


// Import the API calls module
const API_calls = require('./API_calls');
app.use('/api', API_calls);

// Add this before your "Start server" section
app.get('/api/config', (req, res) => {
  const port = process.env.PORT || 3000;
  res.json({ apiBaseUrl: `http://localhost:${port}` });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
    console.log(`Access the website at http://localhost:${PORT}/html/index.html`);
});
