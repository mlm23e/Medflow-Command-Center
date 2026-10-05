INSERT INTO hospitals (name, location_region, capacity, supervisor_id) VALUES
    ('Ascension - Florida - Pensacola', 'us-south', 5, (SELECT id FROM users WHERE username = 'admin')),
    ('Cedars - New York - Poughkeepsie', 'us-northeast', 10, (SELECT id FROM users WHERE username = 'admin_carrie')),
    ('Shriners - Wisconsin - Madison', 'us-midwest', 7, (SELECT id FROM users WHERE username = 'admin_john')),
    ('Community Health - Montana - Great Falls', 'us-west', 3, (SELECT id FROM users WHERE username = 'admin_parmy'));

UPDATE users
SET facility_id = CASE username
    WHEN 'admin' THEN (SELECT id FROM hospitals WHERE name = 'Ascension - Florida - Pensacola')
    WHEN 'technician' THEN (SELECT id FROM hospitals WHERE name = 'Ascension - Florida - Pensacola')
    WHEN 'auditor' THEN (SELECT id FROM hospitals WHERE name = 'Ascension - Florida - Pensacola')
    WHEN 'admin_carrie' THEN (SELECT id FROM hospitals WHERE name = 'Cedars - New York - Poughkeepsie')
    WHEN 'technician_carrie' THEN (SELECT id FROM hospitals WHERE name = 'Cedars - New York - Poughkeepsie')
    WHEN 'auditor_mike' THEN (SELECT id FROM hospitals WHERE name = 'Cedars - New York - Poughkeepsie')
    WHEN 'admin_john' THEN (SELECT id FROM hospitals WHERE name = 'Shriners - Wisconsin - Madison')
    WHEN 'technician_james' THEN (SELECT id FROM hospitals WHERE name = 'Shriners - Wisconsin - Madison')
    WHEN 'auditor_jamie' THEN (SELECT id FROM hospitals WHERE name = 'Shriners - Wisconsin - Madison')
    WHEN 'admin_parmy' THEN (SELECT id FROM hospitals WHERE name = 'Community Health - Montana - Great Falls')
    WHEN 'technician_paul' THEN (SELECT id FROM hospitals WHERE name = 'Community Health - Montana - Great Falls')
    WHEN 'auditor_paul' THEN (SELECT id FROM hospitals WHERE name = 'Community Health - Montana - Great Falls')
END
WHERE username IN (
    'admin',
    'technician',
    'auditor',
    'admin_carrie',
    'technician_carrie',
    'auditor_mike',
    'admin_john',
    'technician_james',
    'auditor_jamie',
    'admin_parmy',
    'technician_paul',
    'auditor_paul'
);

INSERT INTO equipment (serial_number, model, facility_id, charge_level) VALUES
    ('RXA-7821', 'Halo II', (SELECT id FROM hospitals WHERE name = 'Ascension - Florida - Pensacola'), 100.00),
    ('FJ1-3420', 'Force', (SELECT id FROM hospitals WHERE name = 'Ascension - Florida - Pensacola'), 45.34),
    ('FJ1-3421', 'Force', (SELECT id FROM hospitals WHERE name = 'Cedars - New York - Poughkeepsie'), 12.33),
    ('FJ1-3422', 'Force', (SELECT id FROM hospitals WHERE name = 'Cedars - New York - Poughkeepsie'), 19.23),
    ('FJ1-5643', 'Force', (SELECT id FROM hospitals WHERE name = 'Cedars - New York - Poughkeepsie'), 20),
    ('FJ1-4564', 'Force', (SELECT id FROM hospitals WHERE name = 'Shriners - Wisconsin - Madison'), 72.73),
    ('RXA-1234', 'Halo II', (SELECT id FROM hospitals WHERE name = 'Shriners - Wisconsin - Madison'), 65),
    ('RXA-3421', 'Halo II', (SELECT id FROM hospitals WHERE name = 'Community Health - Montana - Great Falls'), 34),
    ('FJ1-2341', 'Force', (SELECT id FROM hospitals WHERE name = 'Community Health - Montana - Great Falls'), 32.22);

INSERT INTO work_orders (title, priority, status, equipment_id, technician_id) VALUES
    ('Broken Battery', 'Critical', 'In-Progress', (SELECT id FROM equipment WHERE serial_number = 'FJ1-3420'), (SELECT id FROM users WHERE username = 'technician')),
    ('Need New Defibralator', 'Critical', 'Completed', (SELECT id FROM equipment WHERE serial_number = 'FJ1-3421'), (SELECT id FROM users WHERE username = 'technician_carrie')),
    ('Sensors Malfunctioning', 'Medium', 'Pending', (SELECT id FROM equipment WHERE serial_number = 'FJ1-2341'), (SELECT id FROM users WHERE username = 'technician_james')),
    ('Partially Damaged Screen', 'Low', 'Failed', (SELECT id FROM equipment WHERE serial_number = 'RXA-7821'), (SELECT id FROM users WHERE username = 'technician')),
    ('Vandalized Console', 'Medium', 'In-Progress', (SELECT id FROM equipment WHERE serial_number = 'RXA-3421'), (SELECT id FROM users WHERE username = 'technician_paul'));

INSERT INTO reports (work_order_id, file_url, notes) VALUES
    ((SELECT id FROM work_orders WHERE title = 'Need New Defibralator'), 's3://medflow-diagnostics/FJ1-3421-001.txt', 'Defib Replaced');

