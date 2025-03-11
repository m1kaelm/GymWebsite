require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Import routes
const memberRoutes = require('./members');
const classRoutes = require('./classes');
const trainerRoutes = require('./trainers');


// Use routes
app.use('/api/members', memberRoutes);
app.use('/api/classes', classRoutes);
app.use('/api/trainers', trainerRoutes);

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
