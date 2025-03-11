const express = require('express');
const db = require('./database_setup.js');
const router = express.Router();

// Assign Trainer
router.post('/assign', (req, res) => {
    const { class_id, trainer_id } = req.body;
    db.run(`UPDATE classes SET trainer_id = ? WHERE id = ?`, [trainer_id, class_id], function(err) {
        if (err) return res.status(400).json({ error: err.message });
        res.json({ message: "Trainer assigned successfully" });
    });
});

// Track Trainer Hours
router.post('/track-hours', (req, res) => {
    const { trainer_id, hours } = req.body;
    db.run(`UPDATE trainers SET hours_worked = hours_worked + ? WHERE id = ?`, [hours, trainer_id], function(err) {
        if (err) return res.status(400).json({ error: err.message });
        res.json({ message: "Hours updated successfully" });
    });
});

module.exports = router;
