/**
 * @fileoverview MySQL Database Connection Pool Configuration
 * Creates and exports a MySQL connection pool for the Capstone Hub application
 * Handles connection pooling, automatic reconnection, and connection validation
 * 
 * @requires mysql2/promise
 * @requires dotenv
 * 
 * @module db
 * 
 * @description
 * This module establishes a MySQL connection pool using mysql2/promise.
 * The pool is created at module load time and tested immediately.
 * Connection pool settings:
 * - connectionLimit: 10 concurrent connections
 * - waitForConnections: true (queue requests when pool is full)
 * - queueLimit: 0 (unlimited queue)
 * 
 * Environment variables required:
 * - DB_HOST: MySQL server hostname (default: localhost)
 * - DB_USER: MySQL username (default: root)
 * - DB_PASSWORD: MySQL password (default: empty string)
 * - DB_NAME: Database name (default: capstone_hub)
 * 
 * @example
 * // Import the database pool
 * import db from './db.js';
 * 
 * // Execute a query
 * const [rows] = await db.query('SELECT * FROM users WHERE id = ?', [userId]);
 * 
 * @example
 * // Use a transaction
 * const connection = await db.getConnection();
 * try {
 *   await connection.beginTransaction();
 *   await connection.query('INSERT INTO...');
 *   await connection.query('UPDATE...');
 *   await connection.commit();
 * } catch (err) {
 *   await connection.rollback();
 *   throw err;
 * } finally {
 *   connection.release();
 * }
 */

import mysql from "mysql2/promise";
import dotenv from "dotenv";
dotenv.config();

/**
 * MySQL Connection Pool
 * 
 * @type {mysql.Pool}
 * @constant
 * 
 * @property {string} host - MySQL server hostname from DB_HOST env variable
 * @property {string} user - MySQL username from DB_USER env variable
 * @property {string} password - MySQL password from DB_PASSWORD env variable
 * @property {string} database - Database name from DB_NAME env variable
 * @property {boolean} waitForConnections - Wait for available connection when pool is full
 * @property {number} connectionLimit - Maximum number of connections in pool (10)
 * @property {number} queueLimit - Maximum queued connection requests (0 = unlimited)
 * 
 * @description
 * Connection pool for all database operations in the application.
 * Uses environment variables for configuration with sensible defaults.
 * The pool automatically manages connections, reconnections, and queuing.
 * 
 * Pool Configuration:
 * - 10 concurrent connections maximum
 * - Unlimited queue for pending requests
 * - Automatic connection reuse
 * - Connection health checks
 * 
 * @example
 * // Simple query
 * const [users] = await db.query('SELECT * FROM users');
 * 
 * @example
 * // Query with parameters (prevents SQL injection)
 * const [user] = await db.query(
 *   'SELECT * FROM users WHERE email = ?',
 *   [email]
 * );
 */
const db = await mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "capstone_hub",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

/**
 * Database Connection Test
 * 
 * @description
 * Tests the database connection immediately when the module loads.
 * Attempts to get a connection from the pool and releases it.
 * Logs success or failure to the console.
 * 
 * Success: Logs "✅ MySQL connection successful!"
 * Failure: Logs "❌ MySQL connection failed: [error message]"
 * 
 * Note: This is an initialization check only. Individual queries
 * will still need their own error handling.
 * 
 * @throws {Error} Does not throw - catches and logs errors instead
 */
try {
  const connection = await db.getConnection();
  console.log("✅ MySQL connection successful!");
  connection.release();
} catch (err) {
  console.error("❌ MySQL connection failed:", err.message);
}

export default db;