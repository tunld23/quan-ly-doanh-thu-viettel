import sql from "mssql/msnodesqlv8.js";
import dotenv from "dotenv";

dotenv.config();

const config = {
  driver: "msnodesqlv8",
  connectionString: `Driver={ODBC Driver 17 for SQL Server};Server=${process.env.DB_SERVER || "localhost"};Database=${process.env.DB_NAME || "ThongKeDoanhThu"};Trusted_Connection=yes;`,
};

async function check() {
  try {
    const pool = await sql.connect(config);
    const result = await pool.request().query("SELECT COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH, IS_NULLABLE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'detail' ORDER BY ORDINAL_POSITION");
    console.log(JSON.stringify(result.recordset, null, 2));
    await pool.close();
  } catch (err) {
    console.error(err);
  }
}

check();
