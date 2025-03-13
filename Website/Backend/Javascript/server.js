require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Import the API calls module
const API_calls = require('./API_calls');
app.use('/api', API_calls);

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
console.log("🚀 Server has started successfully!");

app._router.stack.forEach((route) => {
    if (route.route) {
        console.log(`📌 [VERBOSE] Registered Route: ${Object.keys(route.route.methods)[0].toUpperCase()} ${route.route.path}`);
    }
});
