# API Reference

## 1. Member Management

### Register a Member
**Endpoint:** `POST /api/members/register`

**Request Body:**
```json
{
  "first_name": "John",
  "last_name": "Doe",
  "email": "john.doe@email.com",
  "password": "securepassword",
  "phone_number": "1234567890"
}
```

**Response:**
```json
{
  "message": "User registered successfully",
  "id": 1
}
```

### Get Member Profile
**Endpoint:** `GET /api/members/{searchValue}`

**Example Requests:**
```
GET /api/members/1
GET /api/members/john.doe@email.com
GET /api/members/John
```

**Response:**
```json
{
  "id": 1,
  "first_name": "John",
  "last_name": "Doe",
  "email": "john.doe@email.com",
  "phone_number": "1234567890",
  "status": "active"
}
```

### Update Member Profile
**Endpoint:** `PUT /api/members/{id}/update`

**Request Body:**
```json
{
  "first_name": "Jonathan",
  "email": "jonathan.doe@email.com"
}
```

**Response:**
```json
{
  "message": "Profile updated successfully"
}
```

### Search Member by Specific Column
**Endpoint:** `GET /api/members/search?column={column}&value={searchValue}`

**Example Requests:**
```
GET /api/members/search?column=email&value=john.doe@email.com
GET /api/members/search?column=first_name&value=John
```

**Response:**
```json
[
  {
    "id": 1,
    "first_name": "John",
    "last_name": "Doe",
    "email": "john.doe@email.com"
  }
]
```

### Member Login
**Endpoint:** `POST /api/members/login`

**Request Body:**
```json
{
  "email": "john.doe@email.com",
  "password": "securepassword"
}
```

**Response:**
```json
{
  "message": "Login successful",
  "memberId": 1,
  "name": "John"
}
```

## 2. Membership Plans

### View Membership Subscription
**Endpoint:** `GET /api/members/{id}/subscription`

**Response:**
```json
{
  "member_id": 1,
  "plan": "Gold",
  "end_date": "2025-04-13"
}
```

### Renew Membership
**Endpoint:** `POST /api/members/{id}/renew`

**Response:**
```json
{
  "message": "Membership renewed successfully"
}
```

## 3. Class Management

### Add a New Class
**Endpoint:** `POST /api/classes/add`

**Request Body:**
```json
{
  "name": "Yoga",
  "description": "Relaxing yoga class",
  "capacity": 20,
  "duration_minutes": 60
}
```

**Response:**
```json
{
  "message": "Class added successfully",
  "id": 1
}
```

### View All Classes
**Endpoint:** `GET /api/classes`

**Response:**
```json
[
  {
    "id": 1,
    "name": "Yoga",
    "description": "Relaxing yoga class"
  }
]
```

### Schedule a Class
**Endpoint:** `POST /api/class-schedule/add`

**Request Body:**
```json
{
  "class_id": 1,
  "trainer_id": 2,
  "start_time": "2025-04-15 10:00",
  "end_time": "2025-04-15 11:00",
  "room_number": "A1"
}
```

**Response:**
```json
{
  "message": "Class session scheduled successfully",
  "id": 3
}
```

### View Class Schedule
**Endpoint:** `GET /api/class-schedule`

**Response:**
```json
[
  {
    "class_id": 1,
    "trainer_id": 2,
    "start_time": "2025-04-15 10:00",
    "end_time": "2025-04-15 11:00",
    "room_number": "A1"
  }
]
```

## 4. Trainer Management

### Assign Trainer to Class
**Endpoint:** `POST /api/trainers/assign`

**Request Body:**
```json
{
  "class_id": 1,
  "trainer_id": 2
}
```

**Response:**
```json
{
  "message": "Trainer assigned successfully"
}
```

### Track Trainer Hours
**Endpoint:** `POST /api/trainers/track-hours`

**Request Body:**
```json
{
  "trainer_id": 2,
  "date": "2025-04-15",
  "hours_worked": 4,
  "notes": "Yoga session"
}
```

**Response:**
```json
{
  "message": "Trainer hours logged successfully"
}
```

## 5. Class Registration

### Register a Member for a Class
**Endpoint:** `POST /api/class-register`

**Request Body:**
```json
{
  "schedule_id": 3,
  "member_id": 1
}
```

**Response:**
```json
{
  "message": "Member registered for class successfully"
}
```

### View Registered Members for a Class
**Endpoint:** `GET /api/class-registrations/{schedule_id}`

**Example:** `GET /api/class-registrations/3`

**Response:**
```json
[
  {
    "schedule_id": 3,
    "member_id": 1
  }
]
```

### Cancel Class Registration
**Endpoint:** `POST /api/class-register/cancel`

**Request Body:**
```json
{
  "schedule_id": 3,
  "member_id": 1
}
```

**Response:**
```json
{
  "message": "Class registration canceled successfully"
}
```

## 6. Database Table Explorer

### Fetch Any Table Data
**Endpoint:** `GET /api/database/{table}`

**Example Requests:**
```
GET /api/database/members
GET /api/database/classes
```

**Response:**
```json
[
  {
    "id": 1,
    "first_name": "John",
    "email": "john.doe@email.com"
  }
]
```
