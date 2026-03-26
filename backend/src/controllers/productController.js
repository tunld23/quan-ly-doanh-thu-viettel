import { getDb } from "../config/db.js";
import { processProductImportExcel } from "../services/excelProcessor.js";
import { updateSummaryReport } from "../services/reportService.js";
import sql from "mssql/msnodesqlv8.js";

export const importProducts = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const { month, year, source = "dealer" } = req.body;
    if (!month || !year) {
      return res.status(400).json({ error: "Month and Year are required" });
    }

    const paddedMonth = String(month).padStart(2, "0");
    const buffer = req.file.buffer;
    const { data: pData, summary } = await processProductImportExcel(buffer, source);

    if (pData.length === 0) {
      return res
        .status(400)
        .json({ error: "No valid product data found in file" });
    }

    const db = await getDb();
    const transaction = new sql.Transaction(db);
    await transaction.begin();

    try {
      // 1. Delete old products for the month/year AND current source
      const deleteRequest = new sql.Request(transaction);
      deleteRequest.input("m", sql.NVarChar, paddedMonth);
      deleteRequest.input("y", sql.Int, parseInt(year));
      deleteRequest.input("src", sql.NVarChar, source);
      await deleteRequest.query(
        "DELETE FROM product WHERE tr_month = @m AND tr_year = @y AND (source_type = @src OR source_type IS NULL)",
      );

      // 2. Bulk Insert into product table
      const table = new sql.Table("product");
      table.columns.add("tr_year", sql.Int, { nullable: false });
      table.columns.add("tr_month", sql.NVarChar(2), { nullable: false });
      table.columns.add("ma_hang", sql.NVarChar(255), { nullable: false });
      table.columns.add("mat_hang", sql.NVarChar(255), { nullable: false });
      table.columns.add("source_type", sql.NVarChar(50), { nullable: true });
      table.columns.add("with_vat", sql.Float, { nullable: true });
      table.columns.add("without_vat", sql.Float, { nullable: true });
      table.columns.add("vat", sql.Float, { nullable: true });
      table.columns.add("nhan_vien", sql.NVarChar(255), { nullable: true });
      table.columns.add("product_group", sql.NVarChar(255), { nullable: true });

      let importedCount = 0;

      for (const p of pData) {
        importedCount++;

        table.rows.add(
          parseInt(year),
          paddedMonth,
          p.ma_hang,
          p.mat_hang,
          p.source_type || source,
          p.with_vat || 0,
          p.without_vat || 0,
          p.vat || 0,
          p.nhan_vien || "Không rõ",
          p.product_group || "Khác"
        );
      }

      if (table.rows.length > 0) {
        const bulkRequest = new sql.Request(transaction);
        await bulkRequest.bulk(table);
      }

      await transaction.commit();

      // Trigger summary update to sync dashboard
      await updateSummaryReport();

      res.json({
        message: `Successfully imported ${importedCount} ${source.toUpperCase()} products for ${paddedMonth}/${year}`,
        summary: {
          ...summary,
          imported: importedCount
        }
      });
    } catch (err) {
      if (transaction) {
        try {
          if (transaction.active) await transaction.rollback();
        } catch (rollbackErr) {
          console.error("Rollback Error:", rollbackErr);
        }
      }
      throw err;
    }
  } catch (err) {
    console.error("General Error:", err);
    res
      .status(500)
      .json({
        error: "Import failed before database operation",
        details: err.message,
      });
  }
};

export const getProductGroups = async (req, res) => {
  try {
    const { source } = req.query;
    const db = await getDb();
    const request = db.request();
    
    let query = "SELECT DISTINCT product_group FROM summary_report WHERE product_group IS NOT NULL";
    if (source && source !== "all") {
      query += " AND source_type = @source";
      request.input("source", source);
    }
    
    const result = await request.query(query);
    res.json(result.recordset.map((r) => r.product_group).filter(Boolean));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getProductYears = async (req, res) => {
  try {
    const db = await getDb();
    const result = await db
      .request()
      .query("SELECT DISTINCT tr_year FROM product ORDER BY tr_year DESC");
    res.json(result.recordset.map((r) => String(r.tr_year)));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
