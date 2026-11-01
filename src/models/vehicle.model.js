const pool = require('../config/db');

async function findByPlate(conn, licensePlate) {
  const [rows] = await conn.execute(`SELECT id FROM vehicles WHERE license_plate = ? LIMIT 1`, [licensePlate]);
  return rows[0] || null;
}

async function findActiveCustomer(conn, customerId) {
  const [rows] = await conn.execute(
    `SELECT id FROM customers WHERE id = ? AND deleted_at IS NULL LIMIT 1`,
    [customerId]
  );
  return rows[0] || null;
}

async function insertVehicle(conn, vehicle) {
  const [result] = await conn.execute(
    `INSERT INTO vehicles (customer_id, license_plate, vehicle_name, brand, vehicle_type)
     VALUES (?, ?, ?, ?, ?)`,
    [vehicle.customerId, vehicle.licensePlate, vehicle.vehicleName, vehicle.brand || null, vehicle.vehicleType]
  );
  return result.insertId;
}

module.exports = { pool, findByPlate, findActiveCustomer, insertVehicle };
