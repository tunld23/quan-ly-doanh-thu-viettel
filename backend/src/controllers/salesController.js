import { getDb } from "../config/db.js";
import { processSalesImportExcel } from "../services/excelProcessor.js";
import { updateSummaryReport } from "../services/reportService.js";
import sql from "mssql/msnodesqlv8.js";

export const importSales = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const { months, year, type, source = "dealer" } = req.body;
    if (!type) {
      return res
        .status(400)
        .json({ error: "Product Group (type) is required" });
    }

    const buffer = req.file.buffer;
    const sData = await processSalesImportExcel(buffer, type);

    if (sData.length === 0) {
      return res
        .status(400)
        .json({ error: "No valid sales data found in file for " + type });
    }

    // Auto-detect months and years from data if not provided
    const detectedMonths = months
      ? months.split(",").map((m) => m.trim().padStart(2, "0"))
      : [...new Set(sData.map((s) => s.thang))];

    const detectedYears = year
      ? [parseInt(year)]
      : [...new Set(sData.map((s) => s.nam))];

    if (detectedMonths.length === 0 || detectedYears.length === 0) {
      return res
        .status(400)
        .json({ error: "Could not determine Month/Year from file or request" });
    }

    const db = await getDb();

    // Ensure product_group and source_type columns exist
    await db.request().query(`
      IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('detail') AND name = 'product_group')
      BEGIN
        ALTER TABLE detail ADD product_group NVARCHAR(255) NULL;
      END
      IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('detail') AND name = 'source_type')
      BEGIN
        ALTER TABLE detail ADD source_type NVARCHAR(50) NULL;
      END
    `);

    // Gỡ bỏ khóa chính nếu tồn tại để cho phép cộng dồn trùng lặp (nếu cần)
    try {
      const pkCheck = await db
        .request()
        .query(
          "SELECT name FROM sys.key_constraints WHERE type = 'PK' AND parent_object_id = OBJECT_ID('detail')",
        );
      if (pkCheck.recordset.length > 0) {
        const pkName = pkCheck.recordset[0].name;
        await db
          .request()
          .query(`ALTER TABLE detail DROP CONSTRAINT ${pkName}`);
        console.log("Dropped PK to allow duplicates");
      }
    } catch (e) {
      console.log("No PK to drop or error dropping it (continuing...)");
    }

    const transaction = new sql.Transaction(db);
    await transaction.begin();

    try {
      // 1. Delete old sales for the specified months, group AND source
      const deleteRequest = new sql.Request(transaction);
      deleteRequest.input("group", sql.NVarChar, type);
      deleteRequest.input("source", sql.NVarChar, source);

      const monthParams = detectedMonths.map((m, i) => `@m${i}`);
      detectedMonths.forEach((m, i) =>
        deleteRequest.input(`m${i}`, sql.NVarChar, m),
      );

      const yearParams = detectedYears.map((y, i) => `@y${i}`);
      detectedYears.forEach((y, i) => deleteRequest.input(`y${i}`, sql.Int, y));

      const deleteQuery = `
        DELETE FROM detail 
        WHERE tr_year IN (${yearParams.join(",")})
        AND tr_month IN (${monthParams.join(",")})
        AND (source_type = @source OR source_type IS NULL)
        AND product_group = @group
      `;

      await deleteRequest.query(deleteQuery);

      // 2. Bulk Insert into detail table
      const table = new sql.Table("detail");
      table.columns.add("tr_year", sql.Int, { nullable: false });
      table.columns.add("tr_month", sql.NVarChar(2), { nullable: false });
      table.columns.add("nhan_vien", sql.NVarChar(255), { nullable: false });
      table.columns.add("ma_hang", sql.NVarChar(255), { nullable: false });
      table.columns.add("mat_hang", sql.NVarChar(255), { nullable: false });
      table.columns.add("amount", sql.Float, { nullable: true });
      table.columns.add("product_group", sql.NVarChar(255), { nullable: true });
      table.columns.add("source_type", sql.NVarChar(50), { nullable: true });

      // Extract month and year from detected values for fallback if sData doesn't have them
      const fallbackMonth = detectedMonths[0]; // Use the first month from detection or request
      const fallbackYear = detectedYears[0];

      for (const s of sData) {
        table.rows.add(
          parseInt(s.nam || fallbackYear), 
          s.thang || fallbackMonth, 
          s.nhan_vien,
          s.ma_hang,
          s.mat_hang,
          s.amount || 1, 
          type, 
          source,
        );
      }

      if (table.rows.length > 0) {
        const bulkRequest = new sql.Request(transaction);
        await bulkRequest.bulk(table);
      }

      await transaction.commit();

      await updateSummaryReport();

      res.json({
        message: `Successfully imported ${source.toUpperCase()} sales for ${type}`,
      });
    } catch (err) {
      if (transaction) {
        try {
          if (transaction.active) await transaction.rollback();
        } catch (rollbackErr) {
          console.error("Rollback Error (ignored):", rollbackErr.message);
        }
      }
      // Log the original error so we can see what actually failed
      console.error("Original Import Error:", err);
      throw err; 
    }
  } catch (err) {
    console.error("Import Sales Error:", err);
    res.status(500).json({
      error: "Sales import failed",
      details: err.message,
    });
  }
};
