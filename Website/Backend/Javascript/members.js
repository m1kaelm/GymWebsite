const express = require('express');
const db = require('./database_setup');

const router = express.Router();

// Register Member
router.post('/register', (req, res) => {
    const { name, email, password } = req.body;
    db.run(`INSERT INTO members (name, email, password) VALUES (?, ?, ?)`, 
           [name, email, password], function(err) {
        if (err) return res.status(400).json({ error: "Email already exists" });
        res.json({ message: "User registered successfully", id: this.lastID });
    });
});

// Get Member Profile
router.get('/:id', (req, res) => {
    db.get("SELECT * FROM members WHERE id = ?", [req.params.id], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        row ? res.json(row) : res.status(404).json({ error: "Member not found" });
    });
});


// Get Subscription Details
router.get('/:id/subscription', (req, res) => {
    db.get("SELECT membership_plan FROM members WHERE id = ?", [req.params.id], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        row ? res.json(row) : res.status(404).json({ error: "Subscription not found" });
    });
});

// Renew Membership Plan
router.post('/:id/renew', (req, res) => {
    db.run("UPDATE members SET membership_plan = ?, renewal_date = DATE('now', '+30 days') WHERE id = ?", 
           [req.body.plan, req.params.id], function(err) {
        if (err) return res.status(400).json({ error: err.message });
        res.json({ message: "Membership renewed successfully" });
    });
});


module.exports = router;
