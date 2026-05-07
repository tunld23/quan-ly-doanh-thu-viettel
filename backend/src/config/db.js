import sql from "mssql/msnodesqlv8.js";
import dotenv from "dotenv";

dotenv.config();

const config = {
  driver: "msnodesqlv8",
  connectionString: `Driver={ODBC Driver 17 for SQL Server};Server=${process.env.DB_SERVER || "localhost"};Database=${process.env.DB_NAME || "ThongKeDoanhThu"};Trusted_Connection=yes;`,
  requestTimeout: 300000,
  connectionTimeout: 300000,
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
  },
};

if (process.env.DB_USER && process.env.DB_PASSWORD) {
  delete config.connectionString;
  config.user = process.env.DB_USER;
  config.password = process.env.DB_PASSWORD;
  config.server = process.env.DB_SERVER || "localhost";
  config.database = process.env.DB_NAME || "ThongKeDoanhThu";
  config.port = parseInt(process.env.DB_PORT) || 1433;
  config.options = {
    enableArithAbort: true,
    encrypt: false,
    trustedConnection: false,
  };
}

async function initDb(db) {
  const schema = `
    IF OBJECT_ID('product', 'U') IS NULL
    BEGIN
      CREATE TABLE product (
        tr_day NVARCHAR(2) NOT NULL DEFAULT '01',
        tr_year INT NOT NULL,
        tr_month NVARCHAR(2) NOT NULL,
        ma_hang NVARCHAR(255) NOT NULL,
        mat_hang NVARCHAR(255) NOT NULL,
        nhan_vien NVARCHAR(255) NOT NULL DEFAULT 'Không rõ',
        source_type NVARCHAR(50) NOT NULL DEFAULT 'dealer',
        with_vat FLOAT,
        without_vat FLOAT,
        vat FLOAT,
        product_group NVARCHAR(255),
        PRIMARY KEY (tr_day, tr_year, tr_month, ma_hang, mat_hang, nhan_vien)
      );
    END

    IF OBJECT_ID('detail', 'U') IS NULL
    BEGIN
      CREATE TABLE detail (
        tr_day NVARCHAR(2) NOT NULL DEFAULT '01',
        tr_year INT NOT NULL,
        tr_month NVARCHAR(2) NOT NULL,
        nhan_vien NVARCHAR(255) NOT NULL,
        ma_hang NVARCHAR(255) NOT NULL,
        mat_hang NVARCHAR(255) NOT NULL,
        amount FLOAT,
        product_group NVARCHAR(255),
        source_type NVARCHAR(50),
        extra_data NVARCHAR(MAX)
      );
    END

    IF OBJECT_ID('staff_service_count', 'U') IS NULL
    BEGIN
      CREATE TABLE staff_service_count (
        tr_day NVARCHAR(2),
        tr_year INT,
        tr_month NVARCHAR(2),
        nhan_vien NVARCHAR(255),
        product_group NVARCHAR(255),
        source_type NVARCHAR(50),
        service_count INT
      );
    END

    IF OBJECT_ID('summary_report', 'U') IS NULL
    BEGIN
      CREATE TABLE summary_report (
        tr_day NVARCHAR(2),
        tr_year INT,
        tr_month NVARCHAR(2),
        nhan_vien NVARCHAR(255),
        product_group NVARCHAR(255),
        source_type NVARCHAR(50),
        total_amount FLOAT
      );
    END

    IF OBJECT_ID('tendoo_expired_ids', 'U') IS NULL
    BEGIN
      CREATE TABLE tendoo_expired_ids (
        id_cua_hang NVARCHAR(255) PRIMARY KEY,
        imported_at DATETIME DEFAULT GETDATE()
      );
    END

    IF OBJECT_ID('mysign_vas_prices', 'U') IS NULL
    BEGIN
      CREATE TABLE mysign_vas_prices (
        package_name NVARCHAR(255),
        price FLOAT,
        imported_at DATETIME DEFAULT GETDATE()
      );
    END

    IF OBJECT_ID('mysign_expired_subscribers', 'U') IS NULL
    BEGIN
      CREATE TABLE mysign_expired_subscribers (
        cccd NVARCHAR(20),
        expired_time NVARCHAR(20),
        imported_at DATETIME DEFAULT GETDATE()
      );
    END

    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('detail') AND name = 'extra_data')
      ALTER TABLE detail ADD extra_data NVARCHAR(MAX) NULL;

    -- Update unified naming
    UPDATE detail SET product_group = 'Tendoo' WHERE product_group = 'TB Tendoo' OR product_group = N'TB Tendoo';
    UPDATE product SET product_group = 'Tendoo' WHERE product_group = 'DTDV Tendoo' OR product_group = N'DTDV Tendoo';

    -- Ensure Audit log table
    IF OBJECT_ID('audit_logs', 'U') IS NULL
    BEGIN
      CREATE TABLE audit_logs (
        id INT IDENTITY PRIMARY KEY,
        user_id NVARCHAR(255),
        username NVARCHAR(255),
        action NVARCHAR(255),
        table_name NVARCHAR(255),
        details NVARCHAR(MAX),
        created_at DATETIME DEFAULT GETDATE()
      );
    END
  `;
  try {
    await db.request().query(schema);
    console.log("Database initialized and Tendoo recalibrated accurately.");
  } catch (err) {
    console.error("Schema initialization failed:", err.message);
  }
}

let poolPromise = null;

export async function getDb() {
  if (!poolPromise) {
    try {
      const pool = await sql.connect(config);
      poolPromise = pool;
      await initDb(pool);
    } catch (err) {
      console.error("DB Connection Error:", err.message);
      poolPromise = null;
      throw err;
    }
  }
  return poolPromise;
}

export async function clearData(tableName) {
  try {
    const pool = await getDb();
    await pool.request().query(`TRUNCATE TABLE ${tableName}`);
    return true;
  } catch (err) {
    console.error(`Clear error for ${tableName}:`, err.message);
    throw err;
  }
}

export async function logActivity(user, action, tableName, details = null) {
  try {
    const pool = await getDb();
    const request = pool.request();
    request.input("userId", sql.NVarChar, user?.id || "system");
    request.input("username", sql.NVarChar, user?.username || "system");
    request.input("action", sql.NVarChar, action);
    request.input("tableName", sql.NVarChar, tableName);
    request.input("details", sql.NVarChar, JSON.stringify(details || {}));
    await request.query(
      "INSERT INTO audit_logs (user_id, username, action, table_name, details) VALUES (@userId, @username, @action, @tableName, @details)",
    );
  } catch (err) {
    console.error("Audit LOG Error:", err.message);
  }
}
