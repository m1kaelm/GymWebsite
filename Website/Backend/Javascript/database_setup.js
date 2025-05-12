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
        password TEXT NOT NULL,
        phone_number TEXT,
        specialisation TEXT,
        status TEXT DEFAULT 'active'
    )`);

    

    // Class schedule table
    db.run(`CREATE TABLE IF NOT EXISTS class_schedule (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        class_type_id INTEGER NOT NULL,
        trainer_id INTEGER NOT NULL,
        start_time TIMESTAMP NOT NULL,
        end_time TIMESTAMP NOT NULL,
        room_number TEXT,
        status TEXT DEFAULT 'scheduled',
        FOREIGN KEY (class_type_id) REFERENCES class_types(id),
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
        assigned_start DATETIME,      -- When staff assigns the shift start
        assigned_end DATETIME,        -- When staff assigns the shift end
        assigned_by INTEGER,          -- Staff ID who assigned the shift
        clock_in DATETIME,            -- When trainer actually clocks in
        clock_out DATETIME,           -- When trainer actually clocks out
        notes TEXT,
        FOREIGN KEY (trainer_id) REFERENCES trainers(id),
        FOREIGN KEY (assigned_by) REFERENCES staff(id)
    )`);

    // Staff table
    db.run(`CREATE TABLE IF NOT EXISTS staff (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        first_name TEXT NOT NULL,
        last_name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        phone_number TEXT,
        position TEXT,
        status TEXT DEFAULT 'active'
    )`);

    // Admins table
    db.run(`CREATE TABLE IF NOT EXISTS admins (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        first_name TEXT NOT NULL,
        last_name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL
    )`);

    // Class types table
    db.run(`CREATE TABLE IF NOT EXISTS class_types (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT
    )`);

});

// Create indexes for better performance
db.serialize(() => {
    db.run('CREATE INDEX IF NOT EXISTS idx_member_email ON members(email)');
    db.run('CREATE INDEX IF NOT EXISTS idx_class_schedule_date ON class_schedule(start_time)');
    db.run('CREATE INDEX IF NOT EXISTS idx_trainer_hours_clock_in ON trainer_hours(clock_in)');
});


// Add test data
db.serialize(() => {
    // Insert test staff if not exists
    db.run(`INSERT OR IGNORE INTO staff (first_name, last_name, email, password, phone_number, position)
        VALUES ('Emily', 'Brown', 'staff@gym.com', 'staff123', '555-9999', 'Manager')`);

    // Insert test admin if not exists
    db.run(`INSERT OR IGNORE INTO admins (first_name, last_name, email, password)
        VALUES ('Super', 'Admin', 'admin@gym.com', 'admin123')`);

    // Insert test membership plans if not exists
    db.run(`INSERT OR IGNORE INTO membership_plans (name, description, duration_months, price)
        VALUES ('Basic Plan', 'Gym Access (Weekdays), Free Locker Usage, Email Support', 1, 20)`);
    
    db.run(`INSERT OR IGNORE INTO membership_plans (name, description, duration_months, price)
        VALUES ('Standard Plan', 'Unlimited Gym Access, Free Locker & Shower, 2 Group Classes per Week, Priority Email Support', 1, 35)`);
    
    db.run(`INSERT OR IGNORE INTO membership_plans (name, description, duration_months, price)
        VALUES ('Premium Plan', 'Unlimited Gym & Classes, Personal Trainer (2 sessions/month), Sauna & Spa Access, Priority Phone & Email Support', 1, 50)`);

    // Insert test member if not exists
    db.run(`INSERT OR IGNORE INTO members (first_name, last_name, email, password, phone_number)
        VALUES ('John', 'Smith', 'member@email.com', 'member123', '01234567891')`);

    // Insert test trainer if not exists
    db.run(`INSERT OR IGNORE INTO trainers (first_name, last_name, email, password, phone_number, specialisation)
        VALUES ('Sarah', 'Johnson', 'sarah.j@gym.com', 'trainer123', '555-0124', 'Yoga Expert')`);

    // Insert test class types if not exists
    db.run(`INSERT OR IGNORE INTO class_types (id, name, description)
        VALUES (1, 'Yoga', 'Beginner friendly yoga class')`);
    db.run(`INSERT OR IGNORE INTO class_types (id, name, description)
        VALUES (2, 'Spin', 'High intensity spin class')`);
    db.run(`INSERT OR IGNORE INTO class_types (id, name, description)
        VALUES (3, 'Weights', 'Strength and resistance training class')`);
    db.run(`INSERT OR IGNORE INTO class_types (id, name, description)
        VALUES (4, 'Karate', 'Martial arts and self-defense class')`);

    // Insert test class schedule if not exists
    db.run(`INSERT OR IGNORE INTO class_schedule (id, class_type_id, trainer_id, start_time, end_time, room_number)
        VALUES (1, 1, 1, '2025-05-11 09:00:00', '2025-05-11 10:00:00', 'Studio A')`);
    db.run(`INSERT OR IGNORE INTO class_schedule (id, class_type_id, trainer_id, start_time, end_time, room_number)
        VALUES (2, 2, 1, '2025-05-11 11:00:00', '2025-05-11 12:00:00', 'Studio B')`);

    // Insert test subscription if not exists
    db.run(`INSERT OR IGNORE INTO member_subscriptions (member_id, plan_id, start_date, end_date)
        VALUES (1, 1, '2025-01-01', '2025-02-31')`);

    // Insert test class registration if not exists
    db.run(`INSERT OR IGNORE INTO class_registrations (schedule_id, member_id)
        VALUES (1, 1)`);
    db.run(`INSERT OR IGNORE INTO class_registrations (schedule_id, member_id)
        VALUES (2, 1)`);

    // Insert test trainer hours with assigned and actual times
    db.run(`INSERT OR IGNORE INTO trainer_hours 
        (trainer_id, assigned_start, assigned_end, assigned_by, clock_in, clock_out, notes)
        VALUES 
        (1, '2025-05-15 08:00:00', '2025-05-15 16:00:00', 1, '2025-05-15 08:05:00', '2025-05-15 16:01:00', 'Morning shift'),
        (1, '2025-05-16 10:00:00', '2025-05-16 18:00:00', 1, '2025-05-16 10:02:00', '2025-05-16 17:55:00', 'Weekend shift')`);
});

module.exports = db;
