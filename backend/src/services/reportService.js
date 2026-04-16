import { getDb } from "../config/db.js";
import { TENDOO_RULES, getDefaultTendooRule } from "./tendooRules.js";

export const updateSummaryReport = async () => {
  const db = await getDb();
  console.log("Updating summary_report table...");

  await db.request().query(`
    IF OBJECT_ID('summary_report', 'U') IS NULL
    BEGIN
      CREATE TABLE summary_report (
        tr_year INT,
        tr_month NVARCHAR(2),
        tr_day NVARCHAR(2),
        nhan_vien NVARCHAR(255),
        product_group NVARCHAR(255),
        source_type NVARCHAR(50),
        total_amount FLOAT
      );
    END
  `);

  await db.request().query(`
    TRUNCATE TABLE summary_report;
    TRUNCATE TABLE staff_service_count;
    
    INSERT INTO staff_service_count (tr_year, tr_month, tr_day, nhan_vien, product_group, source_type, service_count)
    SELECT 
      tr_year, tr_month, tr_day, nhan_vien, product_group, source_type,
      SUM(ISNULL(amount, 1)) as service_count
    FROM detail
    WHERE ISNULL(product_group, '') <> 'Tendoo'
    GROUP BY tr_year, tr_month, tr_day, nhan_vien, product_group, source_type;
  `);

  const monthsRes = await db.request().query(`
    SELECT DISTINCT tr_year, tr_month 
    FROM detail 
    WHERE product_group = 'Tendoo'
  `);

  for (const row of monthsRes.recordset) {
    const year = row.tr_year;
    const month = String(row.tr_month).padStart(2, "0");
    const key = `${year}-${month}`;

    const ruleFn = TENDOO_RULES[key] || getDefaultTendooRule;
    if (ruleFn) {
      console.log(`Executing Tendoo Rules for ${key}...`);
      const sqlStr = ruleFn(year, month);
      await db.request().query(`
         INSERT INTO staff_service_count (tr_year, tr_month, tr_day, nhan_vien, product_group, source_type, service_count)
         ${sqlStr}
       `);
    }
  }

  await db.request().query(`
    INSERT INTO summary_report (tr_year, tr_month, tr_day, nhan_vien, product_group, source_type, total_amount)
    SELECT 
      t.tr_year, t.tr_month, t.tr_day, t.nhan_vien, t.product_group, t.source_type,
      SUM(t.revenue) as total_amount
    FROM (
      SELECT 
        tr_year, tr_month, tr_day, nhan_vien, product_group, source_type,
        ISNULL(without_vat, 0) as revenue
      FROM product
      UNION ALL
      SELECT 
        tr_year, tr_month, tr_day, nhan_vien, product_group, 
        ISNULL(source_type, 'manual') as source_type,
        ISNULL(adj_amount, 0) as revenue
      FROM adjustments
    ) t
    GROUP BY t.tr_year, t.tr_month, t.tr_day, t.nhan_vien, t.product_group, t.source_type;
  `);

  console.log("Summary report updated successfully!");
};
