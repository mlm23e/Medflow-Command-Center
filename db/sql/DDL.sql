CREATE TYPE region AS ENUM (
    'us-south',
    'us-west',
    'us-northeast',
    'us-midwest'
);

CREATE TYPE user_role AS ENUM (
    'Administrator',
    'Technician',
    'Auditor'
);

CREATE TYPE equip_status AS ENUM (
    'Available',
    'In-Use',
    'Offline',
    'Maintenance'
);

CREATE TYPE order_priority AS ENUM (
    'Low',
    'Medium',
    'Critical'
);

CREATE TYPE order_status AS ENUM (
    'Pending',
    'Completed',
    'Failed',
    'In-Progress'
);

 -- User table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(150) NOT NULL,
    hashed_password TEXT NOT NULL,
    first_name VARCHAR(150) NOT NULL,
    last_name VARCHAR(150) NOT NULL,
    role user_role NOT NULL,
    facility_id INTEGER
);

-- Hospital table
CREATE TABLE hospitals (
    id SERIAL PRIMARY KEY,
    name VARCHAR(250) NOT NULL,
    location_region region NOT NULL,
    capacity INTEGER NOT NULL CHECK(capacity >= 0),
    supervisor_id INTEGER REFERENCES users(id)
);

ALTER TABLE users
ADD CONSTRAINT fk_user_facility
FOREIGN KEY (facility_id) 
REFERENCES hospitals(id) 
ON DELETE SET NULL;


CREATE TABLE equipment (
    id SERIAL PRIMARY KEY,
    serial_number VARCHAR(100) NOT NULL UNIQUE,
    model VARCHAR(100) NOT NULL,
    status equip_status NOT NULL DEFAULT 'Available',
    charge_level NUMERIC(5,2) NOT NULL DEFAULT 100.00 CHECK(charge_level BETWEEN 0 AND 100),
    facility_id INTEGER NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE
);

CREATE TABLE work_orders (
    id SERIAL PRIMARY KEY, 
    title TEXT NOT NULL, 
    priority order_priority NOT NULL,
    status order_status NOT NULL DEFAULT 'Pending', 
    equipment_id INTEGER NOT NULL REFERENCES equipment(id) ON DELETE CASCADE, 
    technician_id INTEGER REFERENCES users(id),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    started_at TIMESTAMP,
    completed_at TIMESTAMP CHECK (
            completed_at IS NULL
            OR started_at IS NULL
            OR completed_at >= started_at
        )
);

CREATE TABLE reports (
    id SERIAL PRIMARY KEY,
    work_order_id INTEGER NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
    file_url TEXT NOT NULL,
    notes TEXT,
    timestamp TIMESTAMP NOT NULL DEFAULT NOW()
);