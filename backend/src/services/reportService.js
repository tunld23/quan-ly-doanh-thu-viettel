import { getDb } from "../config/db.js";

export const updateSummaryReport = async () => {
  const db = await getDb();
  console.log("Updating summary_report table...");

  // 1. Ensure table exists (without service_count)
  await db.request().query(`
    IF OBJECT_ID('summary_report', 'U') IS NULL
    BEGIN
      CREATE TABLE summary_report (
        tr_year INT,
        tr_month NVARCHAR(2),
        nhan_vien NVARCHAR(255),
        product_group NVARCHAR(255),
        source_type NVARCHAR(50),
        total_amount FLOAT
      );
    END
  `);

  // 2. Xóa dữ liệu cũ và nạp dữ liệu mới bằng GROUP BY
  // Chúng ta sử dụng UNION ALL để gộp dữ liệu từ 2 nguồn: Dữ liệu file (detail) và Dữ liệu điều chỉnh (adjustments)
  await db.request().query(`
    TRUNCATE TABLE summary_report;
    TRUNCATE TABLE staff_service_count;
    
    -- 1. Populate staff_service_count strictly from detail table (counting staff/records)
    INSERT INTO staff_service_count (tr_year, tr_month, nhan_vien, product_group, source_type, service_count)
    SELECT 
      tr_year, 
      tr_month, 
      nhan_vien, 
      product_group, 
      source_type,
      COUNT(*) as service_count
    FROM detail
    GROUP BY tr_year, tr_month, nhan_vien, product_group, source_type;

    -- 2. Populate summary_report by merging Revenue (from product + adjustments)
    INSERT INTO summary_report (tr_year, tr_month, nhan_vien, product_group, source_type, total_amount)
    SELECT 
      t.tr_year, 
      t.tr_month, 
      t.nhan_vien, 
      t.product_group, 
      t.source_type,
      SUM(t.revenue) as total_amount
    FROM (
      -- Source A: Revenue from product table
      SELECT 
        tr_year, tr_month, nhan_vien, product_group, source_type,
        ISNULL(without_vat, 0) as revenue
      FROM product
      
      UNION ALL
      
      -- Source C: Manual Adjustments (revenue only for summary)
      SELECT 
        tr_year, tr_month, nhan_vien, product_group, 
        ISNULL(source_type, 'manual') as source_type,
        ISNULL(adj_amount, 0) as revenue
      FROM adjustments
    ) t
    GROUP BY t.tr_year, t.tr_month, t.nhan_vien, t.product_group, t.source_type;
  `);

  console.log("Summary report updated successfully!");
};
