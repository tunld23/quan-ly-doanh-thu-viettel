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
    idleTimeoutMillis: 30000
  }
};

// SQL Authentication fallback
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
  config.requestTimeout = 300000; // 5 minutes
  config.connectionTimeout = 300000; // 5 minutes
}

/**
 * Initialize core database tables if they don't exist
 */
async function initDb(db) {
  const schema = `
    -- Note: We use NVARCHAR(255) for mat_hang to support it in Primary Key
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
    ELSE
    BEGIN
       -- Ensure columns are NOT NULL for PK
       UPDATE product SET nhan_vien = 'Không rõ' WHERE nhan_vien IS NULL;
       UPDATE product SET tr_day = '01' WHERE tr_day IS NULL;
       
       IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('product') AND name = 'tr_day')
       BEGIN
          -- Step mapping for adding tr_day to PK
          -- 1. Drop existing PK
          DECLARE @pk_name NVARCHAR(255);
          SELECT TOP 1 @pk_name = name FROM sys.key_constraints WHERE type = 'PK' AND parent_object_id = OBJECT_ID('product');
          IF @pk_name IS NOT NULL EXEC('ALTER TABLE product DROP CONSTRAINT ' + @pk_name);
          
          -- 2. Add column
          ALTER TABLE product ADD tr_day NVARCHAR(2) NOT NULL DEFAULT '01';
          
          -- 3. Add new PK
          ALTER TABLE product ADD CONSTRAINT PK_product PRIMARY KEY (tr_year, tr_month, tr_day, ma_hang, mat_hang, nhan_vien);
       END

       ALTER TABLE product ALTER COLUMN tr_year INT NOT NULL;
       ALTER TABLE product ALTER COLUMN tr_month NVARCHAR(2) NOT NULL;
       ALTER TABLE product ALTER COLUMN tr_day NVARCHAR(2) NOT NULL;
       ALTER TABLE product ALTER COLUMN ma_hang NVARCHAR(255) NOT NULL;
       ALTER TABLE product ALTER COLUMN mat_hang NVARCHAR(255) NOT NULL;
       ALTER TABLE product ALTER COLUMN nhan_vien NVARCHAR(255) NOT NULL;

       -- Ensure ID column is REMOVED if it exists (at user request)
       IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('product') AND name = 'id')
       BEGIN
          DECLARE @pk_name_id NVARCHAR(255);
          SELECT @pk_name_id = name FROM sys.key_constraints WHERE type = 'PK' AND parent_object_id = OBJECT_ID('product');
          IF @pk_name_id IS NOT NULL EXEC('ALTER TABLE product DROP CONSTRAINT ' + @pk_name_id);
          ALTER TABLE product DROP COLUMN id;
       END

       -- Deduplicate data to allow adding the new composite PK if needed
       IF OBJECT_ID('temp_dedup_product', 'U') IS NOT NULL DROP TABLE temp_dedup_product;
       WITH CTE AS (
          SELECT *, ROW_NUMBER() OVER (PARTITION BY tr_year, tr_month, tr_day, ma_hang, mat_hang, nhan_vien ORDER BY (SELECT NULL)) as RN
          FROM product
       )
       DELETE FROM CTE WHERE RN > 1;

       -- Re-add PK if it was dropped or doesn't exist
       IF NOT EXISTS (SELECT * FROM sys.key_constraints WHERE type = 'PK' AND parent_object_id = OBJECT_ID('product'))
       BEGIN
          ALTER TABLE product ADD CONSTRAINT PK_product PRIMARY KEY (tr_year, tr_month, tr_day, ma_hang, mat_hang, nhan_vien);
       END

       -- Remove product_line if it exists
       IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('product') AND name = 'product_line')
       BEGIN
          ALTER TABLE product DROP COLUMN product_line;
       END

       -- Add product_group to product
       IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('product') AND name = 'product_group')
       BEGIN
          ALTER TABLE product ADD product_group NVARCHAR(255) NULL;
       END
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
        source_type NVARCHAR(50)
      );
    END
    ELSE
    BEGIN
      IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('detail') AND name = 'tr_day')
      BEGIN
        ALTER TABLE detail ADD tr_day NVARCHAR(2) NOT NULL DEFAULT '01';
      END
      IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('detail') AND name = 'product_group')
      BEGIN
        ALTER TABLE detail ADD product_group NVARCHAR(255) NULL;
      END
      IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('detail') AND name = 'source_type')
      BEGIN
        ALTER TABLE detail ADD source_type NVARCHAR(50) NULL;
      END
      IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('detail') AND name = 'product_line')
      BEGIN
        ALTER TABLE detail DROP COLUMN product_line;
      END
    END

    -- New table for staff service counts
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
    ELSE 
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('staff_service_count') AND name = 'tr_day')
    BEGIN
      ALTER TABLE staff_service_count ADD tr_day NVARCHAR(2) NULL;
    END

    -- Product Type table with Hierarchy
    IF OBJECT_ID('product_type', 'U') IS NOT NULL AND NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('product_type') AND name = 'product_hierarchy')
    BEGIN
       DROP TABLE product_type;
    END

    IF OBJECT_ID('product_type', 'U') IS NULL
    BEGIN
      CREATE TABLE product_type (
        product_group NVARCHAR(255) NOT NULL,
        product_hierarchy NVARCHAR(255) NOT NULL
      );
    END

    -- Seed product_type data (wrapped in EXEC to avoid compilation error for new columns)
    IF OBJECT_ID('product_type', 'U') IS NOT NULL
    BEGIN
      DECLARE @count INT;
      DECLARE @sql NVARCHAR(MAX) = 'IF (SELECT COUNT(*) FROM product_type) = 0
      BEGIN
        INSERT INTO product_type (product_group, product_hierarchy) VALUES 
        (''CA'', ''118111710121''), (''CA'', ''118111810121''), (''CA'', ''118111710124''),
        (''BHXH'', ''118113310121''),
        (''HDDT'', ''118112210124''), (''HDDT'', ''118112210729''), (''HDDT'', ''118112410729''),
        (''VTRACKING'', ''118114310121''),
        (''CAM10(DTDV)'', ''118111910121''),
        (''Easybook'', ''118124010121''),
        (''Tendoo'', ''118125910121''),
        (''vContract'', ''118112510121''), (''vContract'', ''129120110806''),
        (''Mysign'', ''118112010121''),
        (''SIP TRUNK'', ''118112110121'');
      END';
      EXEC sp_executesql @sql;
    END

    IF OBJECT_ID('adjustments', 'U') IS NULL
    BEGIN
      CREATE TABLE adjustments (
        tr_day NVARCHAR(2) DEFAULT '01',
        tr_year INT,
        tr_month NVARCHAR(2),
        nhan_vien NVARCHAR(255),
        product_group NVARCHAR(255),
        source_type NVARCHAR(50) DEFAULT 'manual',
        adj_quantity INT,
        adj_amount FLOAT,
        note NVARCHAR(MAX),
        created_at DATETIME PRIMARY KEY DEFAULT GETDATE()
      );
    END
    ELSE
    BEGIN
       IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('adjustments') AND name = 'tr_day')
       BEGIN
         ALTER TABLE adjustments ADD tr_day NVARCHAR(2) DEFAULT '01';
       END

       IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('adjustments') AND name = 'id')
       BEGIN
          DECLARE @pk_name_adj NVARCHAR(255);
          SELECT @pk_name_adj = name FROM sys.key_constraints WHERE type = 'PK' AND parent_object_id = OBJECT_ID('adjustments');
          IF @pk_name_adj IS NOT NULL EXEC('ALTER TABLE adjustments DROP CONSTRAINT ' + @pk_name_adj);
          ALTER TABLE adjustments DROP COLUMN id;
          ALTER TABLE adjustments ALTER COLUMN created_at DATETIME NOT NULL;
          ALTER TABLE adjustments ADD CONSTRAINT PK_adjustments_created PRIMARY KEY (created_at);
       END

       IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('adjustments') AND name = 'source_type')
       BEGIN
         ALTER TABLE adjustments ADD source_type NVARCHAR(50) DEFAULT 'manual';
       END
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
    ELSE
    BEGIN
      IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('summary_report') AND name = 'tr_day')
      BEGIN
        ALTER TABLE summary_report ADD tr_day NVARCHAR(2) NULL;
      END
      IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('summary_report') AND name = 'source_type')
      BEGIN
        ALTER TABLE summary_report ADD source_type NVARCHAR(50) NULL;
      END
      -- Remove redundant service_count column as requested
      IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('summary_report') AND name = 'service_count')
      BEGIN
        ALTER TABLE summary_report DROP COLUMN service_count;
      END
    END

    IF OBJECT_ID('targets', 'U') IS NULL
    BEGIN
      CREATE TABLE targets (
        tr_day NVARCHAR(2) NOT NULL DEFAULT '01',
        tr_year INT NOT NULL,
        tr_month NVARCHAR(2) NOT NULL,
        product_group NVARCHAR(255) NOT NULL,
        type NVARCHAR(50) NOT NULL,
        amount FLOAT NOT NULL,
        created_at DATETIME DEFAULT GETDATE(),
        PRIMARY KEY (tr_day, tr_year, tr_month, product_group, type)
      );
    END
    ELSE
    BEGIN
      IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('targets') AND name = 'tr_day')
      BEGIN
        -- 1. Drop PK
        DECLARE @pkt_name NVARCHAR(255);
        SELECT TOP 1 @pkt_name = name FROM sys.key_constraints WHERE type = 'PK' AND parent_object_id = OBJECT_ID('targets');
        IF @pkt_name IS NOT NULL EXEC('ALTER TABLE targets DROP CONSTRAINT ' + @pkt_name);
        
        -- 2. Add column
        ALTER TABLE targets ADD tr_day NVARCHAR(2) NOT NULL DEFAULT '01';
        
        -- 3. Add PK back
        ALTER TABLE targets ADD CONSTRAINT PK_targets PRIMARY KEY (tr_year, tr_month, tr_day, product_group, type);
      END

      IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('targets') AND name = 'type')
        AND EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('targets') AND name = 'target_type')
      BEGIN
        EXEC sp_rename 'targets.target_type', 'type', 'COLUMN';
      END
        
      IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('targets') AND name = 'created_at')
        ALTER TABLE targets ADD created_at DATETIME DEFAULT GETDATE();

      IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('targets') AND name = 'target_type')
        ALTER TABLE targets DROP COLUMN target_type;
        
      IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('targets') AND name = 'id')
        ALTER TABLE targets DROP COLUMN id;
    END

    IF OBJECT_ID('users', 'U') IS NULL
    BEGIN
      CREATE TABLE users (
        id NVARCHAR(255) PRIMARY KEY,
        username NVARCHAR(255) NOT NULL UNIQUE,
        email NVARCHAR(255) NOT NULL,
        password NVARCHAR(255) NOT NULL,
        role NVARCHAR(50) DEFAULT 'user',
        refresh_token NVARCHAR(MAX)
      );
    END

    IF OBJECT_ID('audit_logs', 'U') IS NULL
    BEGIN
      CREATE TABLE audit_logs (
        id INT IDENTITY(1,1) PRIMARY KEY,
        user_id NVARCHAR(255),
        username NVARCHAR(255),
        action NVARCHAR(255),
        table_name NVARCHAR(255),
        details NVARCHAR(MAX),
        timestamp DATETIME DEFAULT GETDATE()
      );
    END

    -- Remove sme_kpi table as requested
    IF OBJECT_ID('sme_kpi', 'U') IS NOT NULL DROP TABLE sme_kpi;
    
    IF OBJECT_ID('users', 'U') IS NOT NULL
    BEGIN
       UPDATE users SET role = 'superadmin' WHERE username = 'admin';
    END
  `;
  try {
    await db.request().query(schema);
    console.log("Database schema verified.");

    // Seed default users if empty
    const userCountResult = await db.request().query("SELECT COUNT(*) as cnt FROM users");
    if (userCountResult.recordset[0].cnt === 0) {
      const bcrypt = await import("bcryptjs");
      const passAdmin = bcrypt.default.hashSync("admin@123", 10);
      const passUser = bcrypt.default.hashSync("user1@123", 10);
      const pass1 = bcrypt.default.hashSync("1", 10);
      
      const request = db.request();
      request.input('passAdmin', sql.NVarChar, passAdmin);
      request.input('passUser', sql.NVarChar, passUser);
      request.input('pass1', sql.NVarChar, pass1);
      
      const seedSql = `
        INSERT INTO users (id, username, email, password, role) VALUES 
        ('1', 'admin', 'admin@viettel.com.vn', @passAdmin, 'admin'),
        ('2', 'user1', 'user1@viettel.com.vn', @passUser, 'user'),
        ('3', 'huanvx', 'huanvx@viettel.com.vn', @pass1, 'admin'),
        ('4', 'quangdd', 'quangdd@viettel.com.vn', @pass1, 'admin'),
        ('5', 'tuyennb', 'tuyennb@viettel.com.vn', @pass1, 'admin'),
        ('6', 'anhlhl', 'anhlhl@viettel.com.vn', @pass1, 'admin');
      `;
      await request.query(seedSql);
      console.log("Seeded default users into database.");
    }
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
      console.log(`Connected to: ${process.env.DB_NAME || "ThongKeDoanhThu"}`);
      await initDb(pool);
    } catch (err) {
      console.error("DB Connection Error:", err.message);

      // Fallback to 'SQL Server' driver if ODBC 17 is missing
      if (config.connectionString?.includes("ODBC Driver 17")) {
        console.log("Retrying with legacy 'SQL Server' driver...");
        config.connectionString = config.connectionString.replace(
          "ODBC Driver 17 for SQL Server",
          "SQL Server",
        );
        try {
          const pool = await sql.connect(config);
          poolPromise = pool;
          await initDb(pool);
        } catch (err2) {
          console.error("Fallback failed:", err2.message);
          poolPromise = null;
          throw err2;
        }
      } else {
        poolPromise = null;
        throw err;
      }
    }
  }
  return poolPromise;
}

export async function clearData(tableName) {
  try {
    const db = await getDb();
    await db.request().query(`DELETE FROM ${tableName}`);
  } catch (err) {
    console.error(`Error clearing ${tableName}:`, err.message);
  }
}

/**
 * Log a user action to the audit_logs table
 * @param {Object} user - The user object (from req.user)
 * @param {string} action - The action performed (e.g., 'INSERT', 'UPDATE', 'DELETE', 'IMPORT')
 * @param {string} tableName - The table being affected
 * @param {Object|string} details - Additional information about the action
 */
export async function logActivity(user, action, tableName, details = null) {
  try {
    const pool = await getDb();
    const request = pool.request();
    
    // Convert details to JSON string if it's an object
    const detailsStr = details && typeof details === 'object' 
      ? JSON.stringify(details) 
      : (details || '');

    request.input('userId', sql.NVarChar, user?.id || 'system');
    request.input('username', sql.NVarChar, user?.username || 'system');
    request.input('action', sql.NVarChar, action);
    request.input('tableName', sql.NVarChar, tableName);
    request.input('details', sql.NVarChar, detailsStr);
    
    await request.query(`
      INSERT INTO audit_logs (user_id, username, action, table_name, details)
      VALUES (@userId, @username, @action, @tableName, @details)
    `);
  } catch (err) {
    console.error("Audit Logging Error:", err.message);
  }
}
