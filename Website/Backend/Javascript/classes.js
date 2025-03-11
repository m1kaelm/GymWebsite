const express = require('express');
const db = require('./database_setup');

const router = express.Router();

// Create Class
router.post('/add', (req, res) => {
    const { name, schedule, trainer_id } = req.body;
    db.run(`INSERT INTO classes (name, schedule, trainer_id) VALUES (?, ?, ?)`, 
           [name, schedule, trainer_id], function(err) {
        if (err) return res.status(400).json({ error: err.message });
        res.json({ message: "Class added successfully", id: this.lastID });
    });
});

// Get All Classes
router.get('/', (req, res) => {
    db.all("SELECT * FROM classes", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

module.exports = router;
