const express = require('express');
const db = require('./database_setup');

const router = express.Router();

// ====== MEMBERS API ======

// Register a new member
router.post('/members/register', (req, res) => {
    const { first_name, last_name, email, password, phone_number } = req.body;
    db.run(`INSERT INTO members (first_name, last_name, email, password, phone_number) VALUES (?, ?, ?, ?, ?)`, 
           [first_name, last_name, email, password, phone_number], function(err) {
        if (err) return res.status(400).json({ error: "Email already exists" });
        res.json({ message: "User registered successfully", id: this.lastID });
    });
});

// Get Member Profile
router.get('/members/:searchValue', (req, res) => {
    const searchValue = req.params.searchValue.trim();

    console.log(`🔍 [VERBOSE] API Route Reached: /members/:searchValue`);
    console.log(`🔍 [VERBOSE] Received Search Request for Value: "${searchValue}"`);

    // Search for the member in multiple columns
    let query = `
        SELECT * FROM members 
        WHERE id = ? OR 
              LOWER(first_name) LIKE LOWER(?) OR 
              LOWER(last_name) LIKE LOWER(?) OR 
              LOWER(email) LIKE LOWER(?) OR 
              phone_number LIKE ?`;

    let searchParams = [
        searchValue,          // Exact match for ID
        `%${searchValue}%`,   // Partial match for first_name
        `%${searchValue}%`,   // Partial match for last_name
        `%${searchValue}%`,   // Partial match for email
        `%${searchValue}%`    // Partial match for phone_number
    ];

    console.log(`🔍 [VERBOSE] Executing SQL: ${query} | Value Sent: '${searchValue}'`);

    db.all(query, searchParams, (err, rows) => {
        if (err) {
            console.error("❌ [VERBOSE] Database Error:", err);
            return res.status(500).json({ error: err.message });
        }
        console.log("✅ [VERBOSE] Query Result:", rows);
        res.json(rows.length ? rows : { error: "Member not found" });
    });
});


// ====== UPDATE MEMBER PROFILE ======
router.put('/members/:id/update', (req, res) => {
    const memberId = req.params.id;
    const { first_name, last_name, email, phone_number, password } = req.body;

    db.run(`UPDATE members 
            SET first_name = COALESCE(?, first_name), 
                last_name = COALESCE(?, last_name), 
                email = COALESCE(?, email), 
                phone_number = COALESCE(?, phone_number), 
                password = COALESCE(?, password)
            WHERE id = ?`,
        [first_name || null, last_name || null, email || null, phone_number || null, password || null, memberId],
        function(err) {
            if (err) return res.status(400).json({ error: err.message });
            res.json({ message: "Profile updated successfully" });
        }
    );
});


router.get('/members/search', (req, res) => {
    const { column, value } = req.query;

    console.log(`🔍 [VERBOSE] API Route Reached: /members/search`);
    console.log(`🔍 [VERBOSE] Received Search Request | Column: "${column}" | Value: "${value}"`);

    // Ensure only valid column names are allowed to prevent SQL injection
    const allowedColumns = ["id", "first_name", "last_name", "email", "phone_number"];
    if (!allowedColumns.includes(column)) {
        console.error("❌ [VERBOSE] Invalid Column Requested:", column);
        return res.status(400).json({ error: "Invalid column name" });
    }

    // Use LIKE for partial matches (except for ID)
    let query = column === "id"
        ? `SELECT * FROM members WHERE ${column} = ?`  // Exact match for ID
        : `SELECT * FROM members WHERE LOWER(${column}) LIKE LOWER(?)`; // Case-insensitive for names, emails, phones

    let searchValue = column === "id" ? value.trim() : `%${value.trim()}%`;

    console.log(`🔍 [VERBOSE] Executing SQL: ${query} | Value Sent: '${searchValue}'`);

    db.all(query, [searchValue], (err, rows) => {
        if (err) {
            console.error("❌ [VERBOSE] Database Error:", err);
            return res.status(500).json({ error: err.message });
        }
        console.log("✅ [VERBOSE] Query Result:", rows);
        res.json(rows.length ? rows : { error: "Member not found" });
    });
});








// ====== MEMBER SUBSCRIPTIONS API ======


// Get Subscription Details
router.get('/members/:id/subscription', (req, res) => {
    db.get("SELECT * FROM member_subscriptions WHERE member_id = ?", [req.params.id], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        row ? res.json(row) : res.status(404).json({ error: "Subscription not found" });
    });
});

// Renew Membership Plan
router.post('/members/:id/renew', (req, res) => {
    db.run("UPDATE member_subscriptions SET end_date = DATE('now', '+30 days') WHERE member_id = ?", 
           [req.params.id], function(err) {
        if (err) return res.status(400).json({ error: err.message });
        res.json({ message: "Membership renewed successfully" });
    });
});

// ====== CLASSES API ======

// Create a class
router.post('/classes/add', (req, res) => {
    const { name, description, capacity, duration_minutes } = req.body;
    db.run(`INSERT INTO classes (name, description, capacity, duration_minutes) VALUES (?, ?, ?, ?)`, 
           [name, description, capacity, duration_minutes], function(err) {
        if (err) return res.status(400).json({ error: err.message });
        res.json({ message: "Class added successfully", id: this.lastID });
    });
});

// Get all classes
router.get('/classes', (req, res) => {
    db.all("SELECT * FROM classes", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// Class Schedule - Add a session
router.post('/class-schedule/add', (req, res) => {
    const { class_id, trainer_id, start_time, end_time, room_number } = req.body;
    db.run(`INSERT INTO class_schedule (class_id, trainer_id, start_time, end_time, room_number) 
            VALUES (?, ?, ?, ?, ?)`, 
           [class_id, trainer_id, start_time, end_time, room_number], function(err) {
        if (err) return res.status(400).json({ error: err.message });
        res.json({ message: "Class session scheduled successfully", id: this.lastID });
    });
});

// Get Class Schedule
router.get('/class-schedule', (req, res) => {
    db.all(`
        SELECT cs.*, t.first_name || ' ' || t.last_name AS trainer_name
        FROM class_schedule cs
        LEFT JOIN trainers t ON cs.trainer_id = t.id
      `, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
      });
});
// ====== TRAINERS API ======

// Assign a trainer to a class
router.post('/trainers/assign', (req, res) => {
    const { class_id, trainer_id } = req.body;
    db.run(`UPDATE class_schedule SET trainer_id = ? WHERE class_id = ?`, [trainer_id, class_id], function(err) {
        if (err) return res.status(400).json({ error: err.message });
        res.json({ message: "Trainer assigned successfully" });
    });
});

// Track trainer working hours
router.post('/trainers/track-hours', (req, res) => {
    const { trainer_id, date, hours_worked, notes } = req.body;
    db.run(`INSERT INTO trainer_hours (trainer_id, date, hours_worked, notes) VALUES (?, ?, ?, ?)`, 
           [trainer_id, date, hours_worked, notes], function(err) {
        if (err) return res.status(400).json({ error: err.message });
        res.json({ message: "Trainer hours logged successfully" });
    });
});

// Get Trainer Hours
router.get('/trainers/:id/hours', (req, res) => {
    db.all("SELECT * FROM trainer_hours WHERE trainer_id = ?", [req.params.id], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// ====== CLASS REGISTRATION API ======

// Register a Member for a Class
router.post('/class-register', (req, res) => {
    const { schedule_id, member_id } = req.body;
    db.run(`INSERT INTO class_registrations (schedule_id, member_id) VALUES (?, ?)`, 
           [schedule_id, member_id], function(err) {
        if (err) return res.status(400).json({ error: err.message });
        res.json({ message: "Member registered for class successfully" });
    });
});

// Get Registered Members for a Class
router.get('/class-registrations/:schedule_id', (req, res) => {
    db.all("SELECT * FROM class_registrations WHERE schedule_id = ?", [req.params.schedule_id], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// Cancel a Class Registration
router.post('/class-register/cancel', (req, res) => {
    const { schedule_id, member_id } = req.body;
    db.run(`DELETE FROM class_registrations WHERE schedule_id = ? AND member_id = ?`, 
           [schedule_id, member_id], function(err) {
        if (err) return res.status(400).json({ error: err.message });
        res.json({ message: "Class registration canceled successfully" });
    });
});

module.exports = router;









// ====== DATABASE TABLE EXPLORER API ======

// Fetch data from any table dynamically
router.get('/database/:table', (req, res) => {
    const tableName = req.params.table;
    
    // Prevent SQL Injection by allowing only predefined tables
    const allowedTables = [
        "members", "membership_plans", "member_subscriptions", 
        "trainers", "classes", "class_schedule", 
        "class_registrations", "trainer_hours"
    ];

    if (!allowedTables.includes(tableName)) {
        return res.status(400).json({ error: "Invalid table name" });
    }

    db.all(`SELECT * FROM ${tableName}`, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});







// ====== LOGIN ======
router.post('/login', (req, res) => {
    if (!req.body || !req.body.email || !req.body.password) {
        return res.status(400).json({ error: "Email and password required" });
      }
      const { email, password } = req.body;
      

    const roles = [
        { table: "admins", role: "admin", idField: "id", nameField: "first_name" },
        { table: "trainers", role: "trainer", idField: "id", nameField: "first_name" },
        { table: "staff", role: "staff", idField: "id", nameField: "first_name" },
        { table: "members", role: "member", idField: "id", nameField: "first_name" }
    ];

    const tryNext = (index) => {
        if (index >= roles.length) {
            return res.status(401).json({ error: "Invalid email or password" });
        }

        const { table, role, idField, nameField } = roles[index];
        db.get(`SELECT * FROM ${table} WHERE email = ?`, [email], (err, user) => {
            if (err) return res.status(500).json({ error: "Database error" });

            if (!user || user.password !== password) {
                return tryNext(index + 1); // Try next role
            }

            req.session.user = {
                id: user[idField],
                name: user[nameField],
                role: role
            };
            
            return res.json({
                message: "Login successful",
                userId: user[idField],
                name: user[nameField],
                role: role
            });
            
        });
    };

    tryNext(0);
});


router.post('/logout', (req, res) => {
    req.session.destroy(() => {
        res.clearCookie('connect.sid');
        res.json({ message: 'Logged out' });
    });
});


// ====== SESSION MANAGEMENT ======
router.get('/session', (req, res) => {
    if (!req.session.user) {
        console.log("Session error: User not logged in");
        return res.status(401).json({ error: "Not logged in" });
    }

    res.json({ user: req.session.user });
});
