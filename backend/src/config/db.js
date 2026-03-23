import sql from "mssql/msnodesqlv8.js";
import dotenv from "dotenv";

dotenv.config();

const config = {
  driver: "msnodesqlv8",
  connectionString: `Driver={ODBC Driver 17 for SQL Server};Server=${process.env.DB_SERVER || "localhost"};Database=${process.env.DB_NAME || "ThongKeDoanhThu"};Trusted_Connection=yes;`,
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
        tr_year INT NOT NULL,
        tr_month NVARCHAR(2) NOT NULL,
        ma_hang NVARCHAR(255) NOT NULL,
        mat_hang NVARCHAR(255) NOT NULL,
        source_type NVARCHAR(50) NOT NULL DEFAULT 'dealer',
        with_vat FLOAT,
        without_vat FLOAT,
        vat FLOAT
      );
    END
    ELSE
    BEGIN
       -- Ensure ID column is REMOVED if it exists (at user request)
       IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('product') AND name = 'id')
       BEGIN
          DECLARE @pk_name_id NVARCHAR(255);
          SELECT @pk_name_id = name FROM sys.key_constraints WHERE type = 'PK' AND parent_object_id = OBJECT_ID('product');
          IF @pk_name_id IS NOT NULL EXEC('ALTER TABLE product DROP CONSTRAINT ' + @pk_name_id);
          ALTER TABLE product DROP COLUMN id;
       END

       -- Remove product_line if it exists
       IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('product') AND name = 'product_line')
       BEGIN
          ALTER TABLE product DROP COLUMN product_line;
       END
    END

    IF OBJECT_ID('detail', 'U') IS NULL
    BEGIN
      CREATE TABLE detail (
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

    IF OBJECT_ID('adjustments', 'U') IS NULL
    BEGIN
      CREATE TABLE adjustments (
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
       -- Check if id column exists and drop it if we want to remove it
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
        tr_year INT,
        tr_month NVARCHAR(2),
        nhan_vien NVARCHAR(255),
        product_group NVARCHAR(255),
        source_type NVARCHAR(50),
        service_count FLOAT,
        total_amount FLOAT
      );
    END
    ELSE
    BEGIN
      IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('summary_report') AND name = 'source_type')
      BEGIN
        ALTER TABLE summary_report ADD source_type NVARCHAR(50) NULL;
      END
    END

    IF OBJECT_ID('targets', 'U') IS NULL
    BEGIN
      CREATE TABLE targets (
        tr_year INT NOT NULL,
        tr_month NVARCHAR(2) NOT NULL,
        source_type NVARCHAR(50) NOT NULL,
        product_group NVARCHAR(255) NOT NULL,
        type NVARCHAR(50) NOT NULL,
        amount FLOAT NOT NULL,
        created_at DATETIME DEFAULT GETDATE(),
        PRIMARY KEY (tr_year, tr_month, source_type, product_group, type)
      );
    END
    ELSE
    BEGIN
      -- 1. Standardize column names if any leftovers (optional now but good for safety)
      IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('targets') AND name = 'type')
        AND EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('targets') AND name = 'target_type')
      BEGIN
        EXEC sp_rename 'targets.target_type', 'type', 'COLUMN';
      END
      
      -- 2. Ensure all required columns exist
      IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('targets') AND name = 'source_type')
        ALTER TABLE targets ADD source_type NVARCHAR(50) NOT NULL DEFAULT 'dealer';
        
      IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('targets') AND name = 'created_at')
        ALTER TABLE targets ADD created_at DATETIME DEFAULT GETDATE();

      -- 3. Final cleanup of any redundant columns
      IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('targets') AND name = 'target_type')
        ALTER TABLE targets DROP COLUMN target_type;
        
      IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('targets') AND name = 'id')
        ALTER TABLE targets DROP COLUMN id;
    END
  `;
  try {
    await db.request().query(schema);
    console.log("Database schema verified.");
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
