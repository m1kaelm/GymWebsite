const sqlite3 = require('sqlite3').verbose();

// Connect to database (or create if not exists)
const db = new sqlite3.Database('./gym_database.db', sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
    if (err) console.error(err.message);
    else console.log("Connected to SQLite database.");
});

// Create tables if they don't exist
db.serialize(() => {
    // Members table with extended profile information
    db.run(`CREATE TABLE IF NOT EXISTS members (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        first_name TEXT NOT NULL,
        last_name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        phone_number TEXT,
        date_of_birth DATE,
        join_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        status TEXT DEFAULT 'active'
    )`);

    // Membership plans table
    db.run(`CREATE TABLE IF NOT EXISTS membership_plans (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        duration_months INTEGER NOT NULL,
        price REAL NOT NULL,
        status TEXT DEFAULT 'active'
    )`);

    // Member subscriptions table
    db.run(`CREATE TABLE IF NOT EXISTS member_subscriptions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        member_id INTEGER NOT NULL,
        plan_id INTEGER NOT NULL,
        start_date DATE NOT NULL,
        end_date DATE NOT NULL,
        payment_status TEXT DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (member_id) REFERENCES members(id),
        FOREIGN KEY (plan_id) REFERENCES membership_plans(id)
    )`);

    // Trainers table with extended information
    db.run(`CREATE TABLE IF NOT EXISTS trainers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        first_name TEXT NOT NULL,
        last_name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        phone_number TEXT,
        specialisation TEXT,
        status TEXT DEFAULT 'active'
    )`);

    // Classes table with enhanced details
    db.run(`CREATE TABLE IF NOT EXISTS classes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        capacity INTEGER NOT NULL,
        duration_minutes INTEGER NOT NULL,
        status TEXT DEFAULT 'active'
    )`);

    // Class schedule table
    db.run(`CREATE TABLE IF NOT EXISTS class_schedule (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        class_id INTEGER NOT NULL,
        trainer_id INTEGER NOT NULL,
        start_time TIMESTAMP NOT NULL,
        end_time TIMESTAMP NOT NULL,
        room_number TEXT,
        status TEXT DEFAULT 'scheduled',
        FOREIGN KEY (class_id) REFERENCES classes(id),
        FOREIGN KEY (trainer_id) REFERENCES trainers(id)
    )`);

    // Class registrations table
    db.run(`CREATE TABLE IF NOT EXISTS class_registrations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        schedule_id INTEGER NOT NULL,
        member_id INTEGER NOT NULL,
        registration_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        status TEXT DEFAULT 'registered',
        FOREIGN KEY (schedule_id) REFERENCES class_schedule(id),
        FOREIGN KEY (member_id) REFERENCES members(id)
    )`);

    // Trainer hours table
    db.run(`CREATE TABLE IF NOT EXISTS trainer_hours (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        trainer_id INTEGER NOT NULL,
        date DATE NOT NULL,
        hours_worked REAL NOT NULL,
        notes TEXT,
        FOREIGN KEY (trainer_id) REFERENCES trainers(id)
    )`);
});

// Create indexes for better performance
db.serialize(() => {
    db.run('CREATE INDEX IF NOT EXISTS idx_member_email ON members(email)');
    db.run('CREATE INDEX IF NOT EXISTS idx_class_schedule_date ON class_schedule(start_time)');
    db.run('CREATE INDEX IF NOT EXISTS idx_trainer_hours_date ON trainer_hours(date)');
});



// Add test data
db.serialize(() => {
    // Insert test membership plan
    db.run(`INSERT OR IGNORE INTO membership_plans (name, description, duration_months, price) 
        VALUES ('Premium Plan', 'Full access to all facilities', 1, 15.99)`);

    // Insert test member
    db.run(`INSERT OR IGNORE INTO members (first_name, last_name, email, password, phone_number) 
        VALUES ('John', 'Smith', 'john.smith@email.com', 'hashedpassword123', '01234567891')`);

    // Insert test trainer
    db.run(`INSERT OR IGNORE INTO trainers (first_name, last_name, email, phone_number, specialisation) 
        VALUES ('Sarah', 'Johnson', 'sarah.j@gym.com', '555-0124', 'Yoga Expert')`);

    // Insert test class
    db.run(`INSERT OR IGNORE INTO classes (name, description, capacity, duration_minutes) 
        VALUES ('Morning Yoga', 'Beginner friendly yoga class', 20, 60)`);

    // Insert test class schedule
    db.run(`INSERT OR IGNORE INTO class_schedule (class_id, trainer_id, start_time, end_time, room_number) 
        VALUES (1, 1, '2024-01-20 09:00:00', '2024-01-20 10:00:00', 'Studio A')`);

    // Insert test subscription
    db.run(`INSERT OR IGNORE INTO member_subscriptions (member_id, plan_id, start_date, end_date) 
        VALUES (1, 1, '2024-01-01', '2024-12-31')`);

    // Insert test class registration
    db.run(`INSERT OR IGNORE INTO class_registrations (schedule_id, member_id) 
        VALUES (1, 1)`);

    // Insert test trainer hours
    db.run(`INSERT OR IGNORE INTO trainer_hours (trainer_id, date, hours_worked, notes) 
        VALUES (1, '2024-01-20', 8, 'Morning shift + evening classes')`);
});

module.exports = db;
