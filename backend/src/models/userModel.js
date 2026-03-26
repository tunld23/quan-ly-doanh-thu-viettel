import sql from "mssql/msnodesqlv8.js";
import { getDb } from "../config/db.js";

export const findUserByUsernameOrEmail = async (username, email) => {
  const db = await getDb();
  const result = await db.request()
    .input('username', sql.NVarChar, username)
    .input('email', sql.NVarChar, email)
    .query('SELECT * FROM users WHERE username = @username OR email = @email');
  return result.recordset[0] || null;
};

export const findUserByUsername = async (username) => {
  const db = await getDb();
  const result = await db.request()
    .input('username', sql.NVarChar, username)
    .query('SELECT * FROM users WHERE username = @username');
  return result.recordset[0] || null;
};

export const findUserByRefreshToken = async (token) => {
  const db = await getDb();
  const result = await db.request()
    .input('token', sql.NVarChar, token)
    .query('SELECT * FROM users WHERE refresh_token = @token');
  return result.recordset[0] || null;
};

export const findUserByIdAndRefreshToken = async (id, token) => {
  const db = await getDb();
  const result = await db.request()
    .input('id', sql.NVarChar, id)
    .input('token', sql.NVarChar, token)
    .query('SELECT * FROM users WHERE id = @id AND refresh_token = @token');
  return result.recordset[0] || null;
};

export const createUser = async (user) => {
  const db = await getDb();
  await db.request()
    .input('id', sql.NVarChar, user.id)
    .input('username', sql.NVarChar, user.username)
    .input('email', sql.NVarChar, user.email)
    .input('password', sql.NVarChar, user.password)
    .input('role', sql.NVarChar, user.role)
    .query('INSERT INTO users (id, username, email, password, role) VALUES (@id, @username, @email, @password, @role)');
};

export const updateRefreshToken = async (id, token) => {
  const db = await getDb();
  await db.request()
    .input('id', sql.NVarChar, id)
    .input('token', sql.NVarChar, token)
    .query('UPDATE users SET refresh_token = @token WHERE id = @id');
};

export const removeRefreshToken = async (token) => {
  const db = await getDb();
  await db.request()
    .input('token', sql.NVarChar, token)
    .query('UPDATE users SET refresh_token = NULL WHERE refresh_token = @token');
};
