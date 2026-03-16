import { getDb } from "../config/db.js";

export const updateSummaryReport = async () => {
  const db = await getDb();
  console.log("Updating summary_report table...");

  // 1. Tạo bảng nếu chưa có
  await db.request().query(`
    IF OBJECT_ID('summary_report', 'U') IS NULL
    CREATE TABLE summary_report (
      tr_year INT,
      tr_month NVARCHAR(2),
      nhan_vien NVARCHAR(255),
      product_group NVARCHAR(255),
      source_type NVARCHAR(50),
      service_count INT,
      total_amount FLOAT
    )
  `);

  // 2. Xóa dữ liệu cũ và nạp dữ liệu mới bằng GROUP BY
  // Chúng ta sử dụng UNION ALL để gộp dữ liệu từ 2 nguồn: Dữ liệu file (detail) và Dữ liệu điều chỉnh (adjustments)
  await db.request().query(`
    TRUNCATE TABLE summary_report;
    
    INSERT INTO summary_report (tr_year, tr_month, nhan_vien, product_group, source_type, service_count, total_amount)
    SELECT 
      t.tr_year, 
      t.tr_month, 
      t.nhan_vien, 
      t.product_group,
      t.source_type,
      SUM(t.qty) as service_count,
      SUM(t.amt) as total_amount
    FROM (
      -- Nhóm 1: Dữ liệu từ file Sales
      SELECT 
        d.tr_year, 
        d.tr_month, 
        d.nhan_vien, 
        d.product_group, 
        d.source_type,
        d.amount as qty,
        ISNULL(p.price, 0) * d.amount as amt
      FROM detail d
      LEFT JOIN (
         SELECT ma_hang, tr_year, tr_month, MAX(without_vat) as price
         FROM product
         GROUP BY ma_hang, tr_year, tr_month
      ) p ON d.ma_hang = p.ma_hang AND d.tr_year = p.tr_year AND d.tr_month = p.tr_month
      
      UNION ALL
      
      -- Nhóm 2: Dữ liệu điều chỉnh thủ công
      SELECT 
        tr_year, 
        tr_month, 
        nhan_vien, 
        product_group, 
        ISNULL(source_type, 'manual') as source_type,
        adj_quantity as qty, 
        adj_amount as amt
      FROM adjustments
    ) t
    GROUP BY t.tr_year, t.tr_month, t.nhan_vien, t.product_group, t.source_type
  `);

  console.log("Summary report updated successfully!");
};
