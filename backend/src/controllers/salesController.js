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
    const { data: sData, summary } = await processSalesImportExcel(buffer, type, source);

    // Auto-detect months and years from data if not provided
    let detectedMonths = months
      ? months.split(",").map((m) => m.trim().padStart(2, "0"))
      : [...new Set(sData.map((s) => s.thang))].filter(m => m !== null);
    
    // Fallback to current month if no month detected
    if (detectedMonths.length === 0) {
      detectedMonths = [String(new Date().getMonth() + 1).padStart(2, "0")];
    }

    let detectedYears = year
      ? [parseInt(year)]
      : [...new Set(sData.map((s) => s.nam))].filter(y => y !== null);

    // Fallback to current year if no year detected
    if (detectedYears.length === 0) {
      detectedYears = [new Date().getFullYear()];
    }

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
        
        // Special logic for Tendoo: Add products to product table automatically
        if (type === "Tendoo") {
           // Use a temporary table or MERGE to insert products without duplicates
           // For simplicity and performance, we'll collect unique products first
           const uniqueProducts = [];
           const seenProducts = new Set();
           
           for (const s of sData) {
              const y = parseInt(s.nam || fallbackYear);
              const m = s.thang || fallbackMonth;
              const key = `${y}|${m}|${s.ma_hang}|${s.mat_hang}|${source}`;
              if (!seenProducts.has(key) && s.price !== undefined) {
                 seenProducts.add(key);
                 uniqueProducts.push({
                    tr_year: y,
                    tr_month: m,
                    ma_hang: s.ma_hang,
                    mat_hang: s.mat_hang,
                    without_vat: s.price,
                    source_type: source
                 });
              }
           }
           
           if (uniqueProducts.length > 0) {
              // We'll use a MERGE statement to avoid PK issues
              // To do this via bulk, we'd need a temp table. 
              // For small amounts, we can generate a query or use multiple requests.
              // Given the potential size, let's use a simple per-item insert (or a batch)
              for (const p of uniqueProducts) {
                const pReq = new sql.Request(transaction);
                pReq.input("y", sql.Int, p.tr_year);
                pReq.input("m", sql.NVarChar, p.tr_month);
                pReq.input("ma", sql.NVarChar, p.ma_hang);
                pReq.input("mat", sql.NVarChar, p.mat_hang);
                pReq.input("price", sql.Float, p.without_vat);
                pReq.input("src", sql.NVarChar, p.source_type);
                
                await pReq.query(`
                  IF NOT EXISTS (SELECT 1 FROM product WHERE tr_year = @y AND tr_month = @m AND ma_hang = @ma AND mat_hang = @mat AND source_type = @src)
                  BEGIN
                    INSERT INTO product (tr_year, tr_month, ma_hang, mat_hang, without_vat, with_vat, vat, source_type)
                    VALUES (@y, @m, @ma, @mat, @price, @price, 0, @src)
                  END
                  ELSE
                  BEGIN
                    UPDATE product SET without_vat = @price, with_vat = @price, vat = 0
                    WHERE tr_year = @y AND tr_month = @m AND ma_hang = @ma AND mat_hang = @mat AND source_type = @src
                  END
                `);
              }
           }
        }
      }

      await transaction.commit();

      await updateSummaryReport();

      res.json({
        message: `Successfully imported ${source.toUpperCase()} sales for ${type}`,
        summary,
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
    res.status(err.isValidationError ? 400 : 500).json({
      error: err.isValidationError ? err.message : "Sales import failed",
      details: err.message,
    });
  }
};
