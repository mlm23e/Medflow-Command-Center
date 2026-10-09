BEGIN;

INSERT INTO hospitals (name, location_region, capacity, supervisor_id)
SELECT seed.name, seed.location_region::region, seed.capacity, users.id
FROM (VALUES
    ('Ascension - Florida - Pensacola', 'us-south', 5, 'admin'),
    ('Cedars - New York - Poughkeepsie', 'us-northeast', 10, 'admin_carrie'),
    ('Shriners - Wisconsin - Madison', 'us-midwest', 7, 'admin_john'),
    ('Community Health - Montana - Great Falls', 'us-west', 3, 'admin_parmy')
) AS seed(name, location_region, capacity, supervisor_username)
JOIN users ON users.username = seed.supervisor_username
WHERE NOT EXISTS (SELECT 1 FROM hospitals WHERE hospitals.name = seed.name);

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

INSERT INTO equipment (serial_number, model, facility_id, charge_level, status)
SELECT seed.serial_number, seed.model, hospitals.id, seed.charge_level, seed.status::equip_status
FROM (VALUES
    ('RXA-7821', 'Halo II', 'Ascension - Florida - Pensacola', 100.00, 'Available'),
    ('FJ1-3420', 'Force', 'Ascension - Florida - Pensacola', 45.34, 'In-Use'),
    ('FJ1-3421', 'Force', 'Cedars - New York - Poughkeepsie', 12.33, 'Available'),
    ('FJ1-3422', 'Force', 'Cedars - New York - Poughkeepsie', 19.23, 'In-Use'),
    ('FJ1-5643', 'Force', 'Cedars - New York - Poughkeepsie', 20.00, 'Available'),
    ('FJ1-4564', 'Force', 'Shriners - Wisconsin - Madison', 72.73, 'Available'),
    ('RXA-1234', 'Halo II', 'Shriners - Wisconsin - Madison', 65.00, 'Maintenance'),
    ('RXA-3421', 'Halo II', 'Community Health - Montana - Great Falls', 34.00, 'Available'),
    ('FJ1-2341', 'Force', 'Community Health - Montana - Great Falls', 32.22, 'Available')
) AS seed(serial_number, model, hospital_name, charge_level, status)
JOIN hospitals ON hospitals.name = seed.hospital_name
ON CONFLICT (serial_number) DO UPDATE SET
    model = EXCLUDED.model,
    facility_id = EXCLUDED.facility_id,
    charge_level = EXCLUDED.charge_level,
    status = EXCLUDED.status;

INSERT INTO work_orders (title, priority, status, equipment_id, technician_id)
SELECT seed.title, seed.priority::order_priority, seed.status::order_status, equipment.id, users.id
FROM (VALUES
    ('Broken Battery', 'Critical', 'In-Progress', 'FJ1-3420', 'technician'),
    ('Need New Defibralator', 'Critical', 'Completed', 'FJ1-3421', 'technician_carrie'),
    ('Sensors Malfunctioning', 'Medium', 'Pending', 'FJ1-2341', 'technician_james'),
    ('Partially Damaged Screen', 'Low', 'Failed', 'RXA-7821', 'technician'),
    ('Vandalized Console', 'Medium', 'In-Progress', 'RXA-3421', 'technician_paul'),
    ('Force Calibration Failure', 'Medium', 'Failed', 'FJ1-3420', 'technician'),
    ('Halo II Inspection Complete', 'Low', 'Completed', 'RXA-3421', 'technician_paul')
) AS seed(title, priority, status, serial_number, technician_username)
JOIN equipment ON equipment.serial_number = seed.serial_number
JOIN users ON users.username = seed.technician_username
WHERE NOT EXISTS (SELECT 1 FROM work_orders WHERE work_orders.title = seed.title);

INSERT INTO reports (work_order_id, file_url, notes)
SELECT work_orders.id, 's3://medflow-diagnostics/FJ1-3421-001.txt', 'Defib Replaced'
FROM work_orders
WHERE work_orders.title = 'Need New Defibralator'
  AND NOT EXISTS (
      SELECT 1 FROM reports
      WHERE reports.file_url = 's3://medflow-diagnostics/FJ1-3421-001.txt'
  );

COMMIT;

