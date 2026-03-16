import fs from 'fs/promises';
import { getDb } from './src/config/db.js';

async function backup() {
  try {
    const db = await getDb();
    console.log("Đang tiến hành sao lưu dữ liệu...");
    
    // Tạo thư mục backup nếu chưa có
    await fs.mkdir('./backup', { recursive: true });

    const tables = ['product', 'detail', 'adjustments', 'summary_report'];
    
    for (const table of tables) {
      const result = await db.request().query(`SELECT * FROM ${table}`);
      
      // Ghi ra file JSON
      await fs.writeFile(
        `./backup/${table}.json`, 
        JSON.stringify(result.recordset, null, 2), 
        'utf-8'
      );
      
      console.log(`- Đã sao lưu bảng ${table}: ${result.recordset.length} dòng`);
    }

    console.log("\n✅ Sao lưu thành công! Dữ liệu được lưu trong thư mục 'backup'.");
    process.exit(0);
  } catch (err) {
    console.error("❌ Lỗi khi sao lưu:", err);
    process.exit(1);
  }
}

backup();
