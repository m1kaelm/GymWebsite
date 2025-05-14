require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');
const session = require('express-session');

const app = express();


// Middleware
app.use(express.json()); // enables parsing of JSON bodies
app.use(express.urlencoded({ extended: true })); // enables parsing of URL-encoded bodies

// CORS configuration
app.use(cors({
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
}));

// Session configuration
app.use(session({
    secret: process.env.SESSION_SECRET || 'secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        sameSite: 'lax',
        secure: false, //
        httpOnly: true
    }
}));

// Serve static files
app.use(express.static(path.join(__dirname, '../../Frontend')));

// Import the API calls module
const API_calls = require('./API_calls');
app.use('/api', API_calls);

// API configuration endpoint
app.get('/api/config', (req, res) => {
    const port = process.env.PORT || 3000;
    res.json({ 
        apiBaseUrl: `http://localhost:${port}`,
        environment: process.env.NODE_ENV || 'development'
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ 
        error: 'Something went wrong!',
        message: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
    console.log(`Access the website at http://localhost:${PORT}/html/index.html`);
});
