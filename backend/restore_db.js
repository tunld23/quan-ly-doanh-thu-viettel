import fs from 'fs/promises';
import { getDb } from './src/config/db.js';
import sql from 'mssql/msnodesqlv8.js';

async function restore() {
  try {
    const db = await getDb();
    console.log("Đang tiến hành phục hồi dữ liệu từ thư mục 'backup'...");

    const tables = ['product', 'detail', 'adjustments', 'summary_report'];
    
    // 1. Xóa sạch dữ liệu cũ theo thứ tự ngược lại để tránh lỗi khóa (dù hiện tại không dùng FK)
    for (const table of [...tables].reverse()) {
        await db.request().query(`DELETE FROM ${table}`);
        console.log(`- Đã xóa sạch dữ liệu cũ trong bảng ${table}`);
    }

    // 2. Nạp lại dữ liệu từ file JSON
    for (const table of tables) {
      let data = [];
      try {
        const dataStr = await fs.readFile(`./backup/${table}.json`, 'utf-8');
        data = JSON.parse(dataStr);
      } catch (err) {
        if (err.code === 'ENOENT') {
            console.log(`- Bỏ qua bảng ${table}: Không tìm thấy file backup.`);
        } else {
            console.error(`- Lỗi đọc file backup của bảng ${table}:`, err);
        }
        continue;
      }

      if (data.length === 0) {
          console.log(`- Bảng ${table} trống, không cần nạp.`);
          continue;
      }

      const tx = new sql.Transaction(db);
      await tx.begin();

      try {
        const sqlTable = new sql.Table(table);
        
        // Định nghĩa cấu trúc cột cho lệnh Bulk Insert
        if (table === 'product') {
            sqlTable.columns.add("tr_year", sql.Int, { nullable: false });
            sqlTable.columns.add("tr_month", sql.NVarChar(2), { nullable: false });
            sqlTable.columns.add("ma_hang", sql.NVarChar(255), { nullable: false });
            sqlTable.columns.add("mat_hang", sql.NVarChar(255), { nullable: false });
            sqlTable.columns.add("source_type", sql.NVarChar(50), { nullable: true });
            sqlTable.columns.add("with_vat", sql.Float, { nullable: true });
            sqlTable.columns.add("without_vat", sql.Float, { nullable: true });
            sqlTable.columns.add("vat", sql.Float, { nullable: true });
            
            for(const row of data) {
                sqlTable.rows.add(row.tr_year, row.tr_month, row.ma_hang, row.mat_hang, row.source_type, row.with_vat, row.without_vat, row.vat);
            }
        } 
        else if (table === 'detail') {
            sqlTable.columns.add("tr_year", sql.Int, { nullable: false });
            sqlTable.columns.add("tr_month", sql.NVarChar(2), { nullable: false });
            sqlTable.columns.add("nhan_vien", sql.NVarChar(255), { nullable: false });
            sqlTable.columns.add("ma_hang", sql.NVarChar(255), { nullable: false });
            sqlTable.columns.add("mat_hang", sql.NVarChar(255), { nullable: false });
            sqlTable.columns.add("amount", sql.Float, { nullable: true });
            sqlTable.columns.add("product_group", sql.NVarChar(255), { nullable: true });
            sqlTable.columns.add("source_type", sql.NVarChar(50), { nullable: true });
            
            for(const row of data) {
                sqlTable.rows.add(row.tr_year, row.tr_month, row.nhan_vien, row.ma_hang, row.mat_hang, row.amount, row.product_group, row.source_type);
            }
        } 
        else if (table === 'adjustments') {
            sqlTable.columns.add("tr_year", sql.Int, { nullable: true });
            sqlTable.columns.add("tr_month", sql.NVarChar(2), { nullable: true });
            sqlTable.columns.add("nhan_vien", sql.NVarChar(255), { nullable: true });
            sqlTable.columns.add("product_group", sql.NVarChar(255), { nullable: true });
            sqlTable.columns.add("source_type", sql.NVarChar(50), { nullable: true });
            sqlTable.columns.add("adj_quantity", sql.Int, { nullable: true });
            sqlTable.columns.add("adj_amount", sql.Float, { nullable: true });
            sqlTable.columns.add("note", sql.NVarChar(sql.MAX), { nullable: true });
            sqlTable.columns.add("created_at", sql.DateTime, { nullable: false });
            
            for(const row of data) {
                sqlTable.rows.add(row.tr_year, row.tr_month, row.nhan_vien, row.product_group, row.source_type, row.adj_quantity, row.adj_amount, row.note, new Date(row.created_at));
            }
        } 
        else if (table === 'summary_report') {
            sqlTable.columns.add("tr_year", sql.Int, { nullable: true });
            sqlTable.columns.add("tr_month", sql.NVarChar(2), { nullable: true });
            sqlTable.columns.add("nhan_vien", sql.NVarChar(255), { nullable: true });
            sqlTable.columns.add("product_group", sql.NVarChar(255), { nullable: true });
            sqlTable.columns.add("source_type", sql.NVarChar(50), { nullable: true });
            sqlTable.columns.add("service_count", sql.Float, { nullable: true });
            sqlTable.columns.add("total_amount", sql.Float, { nullable: true });
            
            for(const row of data) {
                sqlTable.rows.add(row.tr_year, row.tr_month, row.nhan_vien, row.product_group, row.source_type, row.service_count, row.total_amount);
            }
        }

        const request = new sql.Request(tx);
        await request.bulk(sqlTable);
        await tx.commit();
        console.log(`- Đã nạp lại ${data.length} dòng vào bảng ${table}`);
      } catch (err) {
        await tx.rollback();
        console.error(`- Lỗi nạp lại bảng ${table}:`, err);
        throw err;
      }
    }

    console.log("\n✅ Phục hồi thành công! Hệ thống đã khôi phục lại dữ liệu hoàn toàn.");
    process.exit(0);
  } catch (err) {
    console.error("❌ Phục hồi thất bại:", err);
    process.exit(1);
  }
}

restore();
