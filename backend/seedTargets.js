
import sql from "mssql/msnodesqlv8.js";
import dotenv from "dotenv";

dotenv.config();

const config = {
  driver: "msnodesqlv8",
  connectionString: `Driver={ODBC Driver 17 for SQL Server};Server=${process.env.DB_SERVER || "localhost"};Database=${process.env.DB_NAME || "ThongKeDoanhThu"};Trusted_Connection=yes;`,
};

async function seedTargets() {
    try {
        const pool = await sql.connect(config);
        console.log("Connected to DB...");

        await pool.request().query("DELETE FROM targets");
        
        // Fetch real product groups to match exactly
        const groupsRes = await pool.request().query("SELECT DISTINCT source_type, TRIM(product_group) as pg FROM summary_report WHERE product_group IS NOT NULL");
        const groups = groupsRes.recordset;

        const years = [2023, 2024, 2025, 2026];
        const types = ['Doanh thu', 'Thuê Bao'];

        let values = [];
        for (const item of groups) {
            years.forEach(year => {
                // Seed Jan, Feb, Mar to cover current data
                ['01', '02', '03'].forEach(month => {
                    types.forEach(type => {
                        let amount;
                        // Special case for vContract to make it visible (e.g. 50% - 150% achievement)
                        if (item.pg.toLowerCase() === 'vcontract') {
                            if (type === 'Doanh thu') {
                                // Actual is ~136k, let's set target around 200k
                                amount = 200000;
                            } else {
                                // Actual subs? Let's assume 100
                                amount = 100;
                            }
                        } else if (type === 'Doanh thu') {
                            // Random target between 50M and 300M for AM/Dealer
                            amount = Math.floor(Math.random() * 250000000) + 50000000;
                        } else {
                            // Subs targets
                            amount = Math.floor(Math.random() * 1000) + 100;
                        }
                        values.push(`(${year}, '${month}', '${item.source_type}', N'${item.pg}', N'${type}', ${amount})`);
                    });
                });
            });
        }

        const insertQueryBase = "INSERT INTO targets (tr_year, tr_month, source_type, product_group, type, amount) VALUES ";
        for (let i = 0; i < values.length; i += 50) {
            const batch = values.slice(i, i + 50);
            await pool.request().query(insertQueryBase + batch.join(","));
        }

        console.log("Seeding targets completed with VISIBLE amounts for vContract!");
        await pool.close();
    } catch (err) {
        console.error("Seeding error:", err.message);
    }
}

seedTargets();
