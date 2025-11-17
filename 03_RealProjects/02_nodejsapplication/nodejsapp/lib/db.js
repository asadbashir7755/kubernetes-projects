import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();
console.log(process.env.DB_USER, process.env.DB_HOST); // check values

const DB_RETRY_INTERVAL = parseInt(process.env.DB_RETRY_INTERVAL || "10000", 10);

let pool = null;
let dbConnected = false;

// helps store in-memory todos until DB is ready
global.__IN_MEMORY_TODOS = global.__IN_MEMORY_TODOS || [];

export function isDbConnected() {
  return dbConnected;
}

async function createTablesIfNeeded() {
  const create = `
    CREATE TABLE IF NOT EXISTS todos (
      id BIGINT PRIMARY KEY AUTO_INCREMENT,
      text VARCHAR(1024) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB;
  `;
  await pool.query(create);
}

// try to connect and initialize
export async function tryConnectAndInit() {
  const host = process.env.DB_HOST;
  const port = process.env.DB_PORT || 3306;
  const user = process.env.DB_USER;
  const password = process.env.DB_PASSWORD;
  const database = process.env.DB_NAME;

  if (dbConnected) return;

  try {
    pool = mysql.createPool({
      host, port,
      user, password, database,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });

    // quick test query
    await pool.query("SELECT 1");
    console.log("Connected to MySQL at", host + ":" + port);
    dbConnected = true;

    // create table if not exists
    await createTablesIfNeeded();

    // flush pending in-memory todos
    await flushPendingToDb();
  } catch (err) {
    dbConnected = false;
    pool = null;
    console.warn("MySQL not available yet:", err.message);
    // retry after interval
    setTimeout(tryConnectAndInit, DB_RETRY_INTERVAL);
  }
}

export async function getAllTodos() {
  if (!dbConnected || !pool) throw new Error("DB not connected");
  const [rows] = await pool.query("SELECT id, text, created_at FROM todos ORDER BY created_at DESC");
  return rows;
}

export async function insertTodo(text) {
  if (!dbConnected || !pool) throw new Error("DB not connected");
  const [res] = await pool.query("INSERT INTO todos (text) VALUES (?)", [text]);
  return res.insertId;
}

export async function flushPendingToDb() {
  if (!dbConnected || !pool) throw new Error("DB not connected");
  const pending = global.__IN_MEMORY_TODOS || [];
  if (!pending.length) return;
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    for (const t of pending) {
      await conn.query("INSERT INTO todos (text) VALUES (?)", [t.text]);
    }
    await conn.commit();
    // clear memory
    global.__IN_MEMORY_TODOS = [];
    console.log("Flushed pending todos to DB.");
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}
