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


    db.all(query, searchParams, (err, rows) => {
        if (err) {
            
            return res.status(500).json({ error: err.message });
        }
        
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

    

    // Ensure only valid column names are allowed to prevent SQL injection
    const allowedColumns = ["id", "first_name", "last_name", "email", "phone_number"];
    if (!allowedColumns.includes(column)) {
        console.error(" [VERBOSE] Invalid Column Requested:", column);
        return res.status(400).json({ error: "Invalid column name" });
    }

    // Use LIKE for partial matches (except for ID)
    let query = column === "id"
        ? `SELECT * FROM members WHERE ${column} = ?`  // Exact match for ID
        : `SELECT * FROM members WHERE LOWER(${column}) LIKE LOWER(?)`; // Case-insensitive for names, emails, phones

    let searchValue = column === "id" ? value.trim() : `%${value.trim()}%`;

    

    db.all(query, [searchValue], (err, rows) => {
        if (err) {
            console.error(" [VERBOSE] Database Error:", err);
            return res.status(500).json({ error: err.message });
        }
        
        res.json(rows.length ? rows : { error: "Member not found" });
    });
});








// ====== MEMBER SUBSCRIPTIONS API ======


// Get Subscription Details
router.get('/members/:id/subscription', (req, res) => {
    db.get(`
        SELECT ms.*, mp.name as plan_name, mp.description as plan_description, mp.price
        FROM member_subscriptions ms
        JOIN membership_plans mp ON ms.plan_id = mp.id
        WHERE ms.member_id = ?
    `, [req.params.id], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        row ? res.json(row) : res.status(404).json({ error: "Subscription not found" });
    });
});

// Renew Membership Plan
router.post('/members/:id/renew', (req, res) => {
    db.run(`UPDATE member_subscriptions 
            SET end_date = DATE('now', '+30 days'), 
                payment_status = 'active',
                start_date = CURRENT_DATE
            WHERE member_id = ?`, 
           [req.params.id], function(err) {
        if (err) return res.status(400).json({ error: err.message });
        // Also update member status to active
        db.run("UPDATE members SET status = 'active' WHERE id = ?", [req.params.id], function(err2) {
            if (err2) return res.status(400).json({ error: err2.message });
            res.json({ message: "Membership renewed successfully" });
        });
    });
});

// Upgrade Membership Plan
router.post('/members/:id/upgrade', (req, res) => {
    const memberId = req.params.id;
    const { plan_id } = req.body;

    if (!plan_id) {
        return res.status(400).json({ error: "Plan ID is required" });
    }

    // First get the new plan details
    db.get("SELECT * FROM membership_plans WHERE id = ?", [plan_id], (err, plan) => {
        if (err) {
            console.error("Database error:", err);
            return res.status(500).json({ error: "Database error occurred" });
        }
        if (!plan) {
            return res.status(404).json({ error: "Plan not found" });
        }

        // Get current subscription
        db.get("SELECT * FROM member_subscriptions WHERE member_id = ?", [memberId], (err, currentSub) => {
            if (err) {
                console.error("Database error:", err);
                return res.status(500).json({ error: "Database error occurred" });
            }
            if (!currentSub) {
                return res.status(404).json({ error: "No subscription found" });
            }

            // Update the member's subscription
            db.run(`UPDATE member_subscriptions 
                    SET plan_id = ?, 
                        start_date = CURRENT_DATE,
                        end_date = DATE('now', '+' || ? || ' months'),
                        payment_status = 'active'
                    WHERE member_id = ?`,
                [plan_id, plan.duration_months, memberId],
                function(err) {
                    if (err) {
                        console.error("Database error:", err);
                        return res.status(500).json({ error: "Failed to update subscription" });
                    }
                    // Also update member status to active
                    db.run("UPDATE members SET status = 'active' WHERE id = ?", [memberId], function(err2) {
                        if (err2) {
                            console.error("Database error:", err2);
                            return res.status(500).json({ error: "Failed to update member status" });
                        }
                        res.json({ 
                            message: "Membership upgraded successfully",
                            newPlan: plan.name,
                            endDate: new Date(Date.now() + plan.duration_months * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
                        });
                    });
                }
            );
        });
    });
});

// Cancel Membership
router.post('/members/:id/cancel-membership', (req, res) => {
    const memberId = req.params.id;
    db.run(`UPDATE member_subscriptions 
            SET payment_status = 'cancelled'
            WHERE member_id = ?`,
        [memberId],
        function(err) {
            if (err) return res.status(400).json({ error: err.message });
            // Also update member status to inactive
            db.run("UPDATE members SET status = 'inactive' WHERE id = ?", [memberId], function(err2) {
                if (err2) return res.status(400).json({ error: err2.message });
                res.json({ message: "Membership cancelled successfully" });
            });
        }
    );
});

// Confirm payment for a member's subscription
router.post('/members/:id/confirm-payment', (req, res) => {
    const memberId = req.params.id;
    db.run(`UPDATE member_subscriptions SET payment_status = 'active' WHERE member_id = ? AND payment_status = 'pending'`,
        [memberId],
        function(err) {
            if (err) return res.status(400).json({ error: err.message });
            if (this.changes === 0) return res.json({ message: "No pending payment to confirm." });
            res.json({ message: "Payment confirmed and membership activated!" });
        }
    );
});

// ====== CLASSES API ======
// Create a class type
router.post('/class-types/add', (req, res) => {
    const { name, description } = req.body;
    db.run(`INSERT INTO class_types (name, description) VALUES (?, ?)`, 
           [name, description], function(err) {
        if (err) return res.status(400).json({ error: err.message });
        res.json({ message: "Class type added successfully", id: this.lastID });
    });
});

// Get all class types
router.get('/class-types', (req, res) => {
    db.all("SELECT * FROM class_types", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// ====== CLASS SCHEDULE API ======

// Get a single class schedule
router.get('/class-schedule/:id', (req, res) => {
    const scheduleId = req.params.id;
    db.get(`
        SELECT 
            cs.id as schedule_id,
            cs.class_type_id,
            cs.trainer_id,
            cs.room_number,
            cs.start_time,
            cs.end_time,
            ct.name as class_name,
            t.first_name || ' ' || t.last_name AS trainer_name
        FROM class_schedule cs
        LEFT JOIN class_types ct ON cs.class_type_id = ct.id
        LEFT JOIN trainers t ON cs.trainer_id = t.id
        WHERE cs.id = ?
    `, [scheduleId], (err, row) => {
        if (err) {
            console.error('Error fetching schedule:', err);
            return res.status(500).json({ error: err.message });
        }
        if (!row) return res.status(404).json({ error: "Schedule not found" });
        res.json(row);
    });
});

// Get all scheduled classes with type and trainer info
router.get('/class-schedule', (req, res) => {
    db.all(`
        SELECT 
            cs.id as schedule_id,
            cs.class_type_id,
            cs.trainer_id,
            ct.name as class_name,
            cs.room_number,
            cs.start_time,
            cs.end_time,
            t.first_name || ' ' || t.last_name AS trainer_name
        FROM class_schedule cs
        LEFT JOIN class_types ct ON cs.class_type_id = ct.id
        LEFT JOIN trainers t ON cs.trainer_id = t.id
    `, [], (err, rows) => {
        if (err) {
            console.error('Error fetching schedules:', err);
            return res.status(500).json({ error: err.message });
        }
        res.json(rows);
    });
});

// Add a new class schedule
router.post('/class-schedule/add', (req, res) => {
    const { class_type_id, trainer_id, start_time, end_time, room_number } = req.body;
    db.run(`INSERT INTO class_schedule (class_type_id, trainer_id, start_time, end_time, room_number) 
            VALUES (?, ?, ?, ?, ?)`, 
           [class_type_id, trainer_id, start_time, end_time, room_number], function(err) {
        if (err) {
            console.error('Error adding schedule:', err);
            return res.status(400).json({ error: err.message });
        }
        res.json({ message: "Class session scheduled successfully", id: this.lastID });
    });
});

// Edit a class schedule
router.put('/class-schedule/:id', (req, res) => {
    const scheduleId = req.params.id;
    const { class_type_id, trainer_id, start_time, end_time, room_number } = req.body;
    
    db.run(`UPDATE class_schedule 
            SET class_type_id = ?, 
                trainer_id = ?, 
                start_time = ?, 
                end_time = ?, 
                room_number = ?
            WHERE id = ?`,
        [class_type_id, trainer_id, start_time, end_time, room_number, scheduleId],
        function(err) {
            if (err) {
                console.error('Error updating schedule:', err);
                return res.status(400).json({ error: err.message });
            }
            if (this.changes === 0) return res.status(404).json({ error: "Schedule not found" });
            res.json({ message: "Schedule updated successfully" });
        }
    );
});

// Delete a class schedule
router.delete('/class-schedule/:id', (req, res) => {
    const scheduleId = req.params.id;
    db.run(`DELETE FROM class_schedule WHERE id = ?`, [scheduleId], function(err) {
        if (err) {
            console.error('Error deleting schedule:', err);
            return res.status(400).json({ error: err.message });
        }
        if (this.changes === 0) return res.status(404).json({ error: "Schedule not found" });
        res.json({ message: "Schedule deleted successfully" });
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

// Get registered classes for a member with type info
router.get('/class-registrations/:member_id', (req, res) => {
    db.all(`
        SELECT 
            cr.schedule_id,
            ct.name as class_name,
            cs.room_number,
            cs.start_time,
            cr.registration_date
        FROM class_registrations cr
        JOIN class_schedule cs ON cr.schedule_id = cs.id
        JOIN class_types ct ON cs.class_type_id = ct.id
        WHERE cr.member_id = ?
    `, [req.params.member_id], (err, rows) => {
        if (err) {
            console.error('Error in /class-registrations/:member_id:', err);
            return res.status(500).json({ error: err.message });
        }
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
        "class_registrations", "trainer_hours", "staff"
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
        console.log(" Login attempt failed: Missing email or password");
        return res.status(400).json({ error: "Email and password required" });
      }
      const { email, password } = req.body;
      
    console.log(`👤 Login attempt for email: ${email}`);

    const roles = [
        { table: "admins", role: "admin", idField: "id", nameField: "first_name" },
        { table: "trainers", role: "trainer", idField: "id", nameField: "first_name" },
        { table: "staff", role: "staff", idField: "id", nameField: "first_name" },
        { table: "members", role: "member", idField: "id", nameField: "first_name" }
    ];

    const tryNext = (index) => {
        if (index >= roles.length) {
            console.log(` Login failed: No matching credentials found for ${email}`);
            return res.status(401).json({ error: "Invalid email or password" });
        }

        const { table, role, idField, nameField } = roles[index];
        console.log(` Checking ${table} table for user...`);
        
        db.get(`SELECT * FROM ${table} WHERE email = ?`, [email], (err, user) => {
            if (err) {
                console.error(` Database error while checking ${table}:`, err);
                return res.status(500).json({ error: "Database error" });
            }

            if (!user || user.password !== password) {
                console.log(` No match found in ${table}, trying next role...`);
                return tryNext(index + 1); // Try next role
            }

            console.log(` Login successful for ${user[nameField]} (${role})`);

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
       
        return res.status(401).json({ error: "Not logged in" });
    }

    res.json({ user: req.session.user });
});

// Create staff
router.post('/staff/register', (req, res) => {
    const { first_name, last_name, email, password, phone_number, position } = req.body;
    db.run(`INSERT INTO staff (first_name, last_name, email, password, phone_number, position) VALUES (?, ?, ?, ?, ?, ?)`,
        [first_name, last_name, email, password, phone_number, position], function(err) {
            if (err) return res.status(400).json({ error: "Email already exists" });
            res.json({ message: "Staff registered successfully", id: this.lastID });
        });
});

// Update staff
router.put('/staff/:id/update', (req, res) => {
    const staffId = req.params.id;
    const { first_name, last_name, email, phone_number, password, position } = req.body;
    db.run(`UPDATE staff SET first_name = COALESCE(?, first_name), last_name = COALESCE(?, last_name), email = COALESCE(?, email), phone_number = COALESCE(?, phone_number), password = COALESCE(?, password), position = COALESCE(?, position) WHERE id = ?`,
        [first_name || null, last_name || null, email || null, phone_number || null, password || null, position || null, staffId],
        function(err) {
            if (err) return res.status(400).json({ error: err.message });
            res.json({ message: "Staff updated successfully" });
        }
    );
});

// Delete staff
router.delete('/staff/:id', (req, res) => {
    db.run(`DELETE FROM staff WHERE id = ?`, [req.params.id], function(err) {
        if (err) return res.status(400).json({ error: err.message });
        res.json({ message: "Staff deleted successfully" });
    });
});

// Create trainer
router.post('/trainers/register', (req, res) => {
    const { first_name, last_name, email, password, phone_number, specialisation, status } = req.body;
    
    // Validate required fields
    if (!first_name || !last_name || !email || !password) {
        return res.status(400).json({ error: "Missing required fields" });
    }

    // Check if email already exists
    db.get("SELECT id FROM trainers WHERE email = ?", [email], (err, row) => {
        if (err) {
            console.error("Database error:", err);
            return res.status(500).json({ error: "Database error occurred" });
        }
        if (row) {
            return res.status(400).json({ error: "Email already exists" });
        }

        // Insert new trainer
        db.run(`INSERT INTO trainers (
            first_name, 
            last_name, 
            email, 
            password, 
            phone_number, 
            specialisation, 
            status
        ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
            first_name, 
            last_name, 
            email, 
            password, 
            phone_number || null, 
            specialisation || null, 
            status || 'active'
        ], 
        function(err) {
            if (err) {
                console.error("Error creating trainer:", err);
                return res.status(500).json({ error: "Failed to create trainer" });
            }
            res.json({ 
                message: "Trainer registered successfully", 
                id: this.lastID 
            });
        });
    });
});

// Update trainer
router.put('/trainers/:id/update', (req, res) => {
    const trainerId = req.params.id;
    const { first_name, last_name, email, phone_number, specialisation } = req.body;
    db.run(`UPDATE trainers SET first_name = COALESCE(?, first_name), last_name = COALESCE(?, last_name), email = COALESCE(?, email), phone_number = COALESCE(?, phone_number), specialisation = COALESCE(?, specialisation) WHERE id = ?`,
        [first_name || null, last_name || null, email || null, phone_number || null, specialisation || null, trainerId],
        function(err) {
            if (err) return res.status(400).json({ error: err.message });
            res.json({ message: "Trainer updated successfully" });
        }
    );
});

// Delete trainer
router.delete('/trainers/:id', (req, res) => {
    db.run(`DELETE FROM trainers WHERE id = ?`, [req.params.id], function(err) {
        if (err) return res.status(400).json({ error: err.message });
        res.json({ message: "Trainer deleted successfully" });
    });
});

function deleteStaff(id) {
  if (confirm("Are you sure you want to delete this staff member?")) {
    waitForApiBaseUrl().then(apiBaseUrl => {
      fetch(`${apiBaseUrl}/api/staff/${id}`, {
        method: "DELETE"
      })
        .then(res => res.json())
        .then(data => {
          alert(data.message || "Staff deleted.");
          loadStaff();
        })
        .catch(err => {
          console.error("Failed to delete staff:", err);
          alert("Failed to delete staff.");
        });
    });
  }
}

// ====== MEMBERSHIP PLANS API ======

// List all plans
router.get('/membership_plans', (req, res) => {
    db.all("SELECT * FROM membership_plans", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// Add plan
router.post('/membership_plans', (req, res) => {
    const { name, description, duration_months, price, status } = req.body;
    db.run(`INSERT INTO membership_plans (name, description, duration_months, price, status) VALUES (?, ?, ?, ?, ?)`,
        [name, description, duration_months, price, status || 'active'], function(err) {
            if (err) return res.status(400).json({ error: err.message });
            res.json({ message: "Plan added", id: this.lastID });
        });
});

// Update plan
router.put('/membership_plans/:id', (req, res) => {
    const { name, description, duration_months, price, status } = req.body;
    db.run(`UPDATE membership_plans SET name=?, description=?, duration_months=?, price=?, status=? WHERE id=?`,
        [name, description, duration_months, price, status, req.params.id],
        function(err) {
            if (err) return res.status(400).json({ error: err.message });
            res.json({ message: "Plan updated" });
        });
});

// Delete plan
router.delete('/membership_plans/:id', (req, res) => {
    db.run(`DELETE FROM membership_plans WHERE id=?`, [req.params.id], function(err) {
        if (err) return res.status(400).json({ error: err.message });
        res.json({ message: "Plan deleted" });
    });
});



// Get clock in/out history for a trainer (for calendar)
router.get('/trainers/:id/clock-history', (req, res) => {
    const trainerId = req.params.id;
    db.all(
        `SELECT 
            id, 
            assigned_start, 
            assigned_end, 
            clock_in, 
            clock_out, 
            notes 
         FROM trainer_hours 
         WHERE trainer_id = ? 
         ORDER BY clock_in DESC`,
        [trainerId],
        (err, rows) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json(rows);
        }
    );
});

// Create a class type
router.post('/class-types/add', (req, res) => {
    const { name, description } = req.body;
    db.run(`INSERT INTO class_types (name, description) VALUES (?, ?)`, 
           [name, description], function(err) {
        if (err) return res.status(400).json({ error: err.message });
        res.json({ message: "Class type added successfully", id: this.lastID });
    });
});

// Get all class types
router.get('/class-types', (req, res) => {
    db.all("SELECT * FROM class_types", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// Edit a class schedule
router.put('/class-schedule/:id', (req, res) => {
    const scheduleId = req.params.id;
    const { class_type_id, trainer_id, start_time, end_time, room_number } = req.body;
    
    db.run(`UPDATE class_schedule 
            SET class_type_id = ?, 
                trainer_id = ?, 
                start_time = ?, 
                end_time = ?, 
                room_number = ?
            WHERE id = ?`,
        [class_type_id, trainer_id, start_time, end_time, room_number, scheduleId],
        function(err) {
            if (err) return res.status(400).json({ error: err.message });
            if (this.changes === 0) return res.status(404).json({ error: "Schedule not found" });
            res.json({ message: "Schedule updated successfully" });
        }
    );
});

// Delete a class schedule
router.delete('/class-schedule/:id', (req, res) => {
    const scheduleId = req.params.id;
    db.run(`DELETE FROM class_schedule WHERE id = ?`, [scheduleId], function(err) {
        if (err) return res.status(400).json({ error: err.message });
        if (this.changes === 0) return res.status(404).json({ error: "Schedule not found" });
        res.json({ message: "Schedule deleted successfully" });
    });
});

// Get all trainers
router.get('/trainers', (req, res) => {
    db.all("SELECT id, first_name, last_name FROM trainers WHERE status = 'active'", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// Get a single class schedule
router.get('/class-schedule/:id', (req, res) => {
    const scheduleId = req.params.id;
    db.get(`
        SELECT 
            cs.id as schedule_id,
            cs.class_type_id,
            cs.trainer_id,
            cs.room_number,
            cs.start_time,
            cs.end_time,
            ct.name as class_name,
            t.first_name || ' ' || t.last_name AS trainer_name
        FROM class_schedule cs
        LEFT JOIN class_types ct ON cs.class_type_id = ct.id
        LEFT JOIN trainers t ON cs.trainer_id = t.id
        WHERE cs.id = ?
    `, [scheduleId], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!row) return res.status(404).json({ error: "Schedule not found" });
        res.json(row);
    });
});

// ====== TRAINER CLOCK IN/OUT API ======

// Get trainer's schedule status for today
router.get('/trainers/:id/clock-status', (req, res) => {
    const trainerId = req.params.id;
    const today = new Date().toISOString().split('T')[0];
    
    // Get today's assigned classes
    db.all(`
        SELECT 
            cs.id as schedule_id,
            cs.start_time as assigned_start,
            cs.end_time as assigned_end,
            ct.name as class_name,
            cs.room_number
        FROM class_schedule cs
        LEFT JOIN class_types ct ON cs.class_type_id = ct.id
        WHERE cs.trainer_id = ? 
        AND date(cs.start_time) = date('now')
        ORDER BY cs.start_time
    `, [trainerId], (err, assignedClasses) => {
        if (err) {
            console.error('Error fetching assigned classes:', err);
            return res.status(500).json({ error: err.message });
        }

        // Calculate assigned hours
        let assignedHours = 0;
        assignedClasses.forEach(cls => {
            const duration = (new Date(cls.assigned_end) - new Date(cls.assigned_start)) / (1000 * 60 * 60);
            assignedHours += duration;
        });

        res.json({
            assignedHours: assignedHours,
            assignedClasses: assignedClasses
        });
    });
});