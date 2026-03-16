import fs from "fs/promises";
import path from "path";
import sql from "mssql/msnodesqlv8.js";
import { getDb, clearData } from "../config/db.js";
import {
  processMasterExcel,
  processSalesExcel,
} from "../services/excelProcessor.js";
import { updateSummaryReport } from "../services/reportService.js";

async function getFilesRecursively(dir) {
  let results = [];
  try {
    const list = await fs.readdir(dir, { withFileTypes: true });
    for (const file of list) {
      const fullPath = path.resolve(dir, file.name);
      if (file.isDirectory()) {
        results = results.concat(await getFilesRecursively(fullPath));
      } else if (fullPath.endsWith(".xls") || fullPath.endsWith(".xlsx")) {
        results.push(fullPath);
      }
    }
  } catch (err) {
    if (err.code !== "ENOENT") {
      console.warn(`Read error: ${dir}`, err.message);
    }
  }
  return results;
}

export const syncData = async (req, res) => {
  try {
    const db = await getDb();
    const dataPath = path.resolve(process.env.DATA_PATH || "./data");
    console.log(`Syncing from: ${dataPath}`);

    // Gỡ bỏ khóa chính nếu tồn tại để cho phép cộng dồn trùng lặp
    try {
      const pkCheck = await db.request().query("SELECT name FROM sys.key_constraints WHERE type = 'PK' AND parent_object_id = OBJECT_ID('detail')");
      if (pkCheck.recordset.length > 0) {
        const pkName = pkCheck.recordset[0].name;
        await db.request().query(`ALTER TABLE detail DROP CONSTRAINT ${pkName}`);
        console.log('Dropped PK to allow duplicates');
      }
    } catch (e) {
      console.log('No PK to drop or error dropping it (continuing...)');
    }

    // 1. Process Master Data
    const masterDir = path.join(dataPath, "master");
    const masterFiles = await getFilesRecursively(masterDir);

    if (masterFiles.length > 0) {
      const mBuffer = await fs.readFile(masterFiles[0]);
      const pData = await processMasterExcel(mBuffer);

      await clearData("product");

      const pTx = new sql.Transaction(db);
      await pTx.begin();
      try {
        // 1. Bulk Insert into product table
        const productTable = new sql.Table("product");
        productTable.columns.add("tr_year", sql.Int, { nullable: false });
        productTable.columns.add("tr_month", sql.NVarChar(2), { nullable: false });
        productTable.columns.add("ma_hang", sql.NVarChar(255), { nullable: false });
        productTable.columns.add("mat_hang", sql.NVarChar(255), { nullable: false });
        productTable.columns.add("with_vat", sql.Float, { nullable: true });
        productTable.columns.add("without_vat", sql.Float, { nullable: true });
        productTable.columns.add("vat", sql.Float, { nullable: true });

        const seenProducts = new Set();
        for (const p of pData) {
          const pk = `${p.tr_year}-${p.tr_month}-${p.ma_hang.toLowerCase()}-${p.mat_hang.toLowerCase()}`;
          if (seenProducts.has(pk)) continue;
          seenProducts.add(pk);

          productTable.rows.add(
            p.nam || p.tr_year || 0,
            String(p.thang || p.tr_month || '0').padStart(2, '0'),
            p.ma_hang || "Unknown",
            p.mat_hang || "Unknown",
            p.with_vat || 0,
            p.without_vat || 0,
            p.vat || 0
          );
        }
        console.log("Ready to bulk insert products", productTable.rows.length);
        if (productTable.rows.length > 0) console.log("First row:", productTable.rows[0]);
        if (productTable.rows.length > 0) {
          await new sql.Request(pTx).bulk(productTable);
        }

        await pTx.commit();
        console.log(`Synced Master: ${pData.length} products`);
      } catch (err) {
        await pTx.rollback();
        throw err;
      }
    }

    // 2. Process Sales Data
    const salesDir = path.join(dataPath, "sales");
    const salesFiles = await getFilesRecursively(salesDir);

    await clearData("detail");
    let totalSales = 0;

    const sTx = new sql.Transaction(db);
    await sTx.begin();
    try {
      const detailTable = new sql.Table("detail");
      detailTable.columns.add("tr_year", sql.Int, { nullable: false });
      detailTable.columns.add("tr_month", sql.NVarChar(2), { nullable: false });
      detailTable.columns.add("nhan_vien", sql.NVarChar(255), { nullable: false });
      detailTable.columns.add("ma_hang", sql.NVarChar(255), { nullable: false });
      detailTable.columns.add("mat_hang", sql.NVarChar(255), { nullable: false });
      detailTable.columns.add("amount", sql.Float, { nullable: true });
      detailTable.columns.add("product_group", sql.NVarChar(255), { nullable: true });

      for (const file of salesFiles) {
        if (file.includes("TONGHOP") || file.includes("~") || path.basename(file).startsWith(".")) continue;
        try {
          const buffer = await fs.readFile(file);
          const sRecords = await processSalesExcel(buffer, path.basename(file));
          for (const s of sRecords) {
            detailTable.rows.add(
              s.nam || 0,
              String(s.thang || '0').padStart(2, '0'),
              s.nhan_vien || "Không rõ",
              s.ma_hang || "Unknown",
              s.mat_hang || "Unknown",
              1, // amount stores quantity (1 per row)
              null // product_group (sync doesn't know group easily without complex logic)
            );
          }
          totalSales += sRecords.length;
        } catch (e) {
          console.warn(`File error ${file}:`, e.message);
        }
      }

      if (detailTable.rows.length > 0) {
        await new sql.Request(sTx).bulk(detailTable);
      }
      await sTx.commit();
    } catch (err) {
      await sTx.rollback();
      throw err;
    }

    await updateSummaryReport();

    res.json({ message: "Sync Success", stats: { sales: totalSales } });
  } catch (err) {
    console.error("Sync Error:", err);
    res.status(500).json({ error: "Sync failed", details: err.message });
  }
};
