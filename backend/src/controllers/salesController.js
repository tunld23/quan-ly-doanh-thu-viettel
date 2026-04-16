import { getDb, logActivity } from "../config/db.js";
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

    const effectiveGroup = type;

    let extraOptions = {};
    if (type === "Tendoo") {
      const dbRead = await getDb();
      const expiredResult = await dbRead
        .request()
        .query("SELECT id_cua_hang FROM tendoo_expired_ids");
      extraOptions.expiredIds = new Set(
        expiredResult.recordset.map((r) => r.id_cua_hang),
      );
    }

    const buffer = req.file.buffer;
    const { data: sData, summary } = await processSalesImportExcel(
      buffer,
      type,
      source,
      extraOptions,
    );

    // Auto-detect months and years from data if not provided
    let detectedMonths = months
      ? months.split(",").map((m) => m.trim().padStart(2, "0"))
      : [...new Set(sData.map((s) => s.thang))].filter((m) => m !== null);

    // Fallback to current month if no month detected
    if (detectedMonths.length === 0) {
      detectedMonths = [String(new Date().getMonth() + 1).padStart(2, "0")];
    }

    let detectedYears = year
      ? [parseInt(year)]
      : [...new Set(sData.map((s) => s.nam))].filter((y) => y !== null);

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
      IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('detail') AND name = 'extra_data')
      BEGIN
        ALTER TABLE detail ADD extra_data NVARCHAR(MAX) NULL;
      END

      -- Xóa bỏ cột tendoo_type thừa theo yêu cầu
      IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('detail') AND name = 'tendoo_type')
      BEGIN
        ALTER TABLE detail DROP COLUMN tendoo_type;
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
      deleteRequest.input("group", sql.NVarChar, effectiveGroup);
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
        AND (LOWER(TRIM(source_type)) = LOWER(TRIM(@source)) OR source_type IS NULL)
        AND LOWER(TRIM(product_group)) = LOWER(TRIM(@group))
      `;

      await deleteRequest.query(deleteQuery);

      // 2. Bulk Insert into detail table
      const table = new sql.Table("detail");
      table.columns.add("tr_year", sql.Int, { nullable: false });
      table.columns.add("tr_month", sql.NVarChar(2), { nullable: false });
      table.columns.add("tr_day", sql.NVarChar(2), { nullable: false });
      table.columns.add("nhan_vien", sql.NVarChar(255), { nullable: false });
      table.columns.add("ma_hang", sql.NVarChar(255), { nullable: false });
      table.columns.add("mat_hang", sql.NVarChar(255), { nullable: false });
      table.columns.add("amount", sql.Float, { nullable: true });
      table.columns.add("product_group", sql.NVarChar(255), { nullable: true });
      table.columns.add("source_type", sql.NVarChar(50), { nullable: true });
      table.columns.add("extra_data", sql.NVarChar(sql.MAX), {
        nullable: true,
      });

      // Extract month and year from detected values for fallback if sData doesn't have them
      const fallbackMonth = detectedMonths[0]; // Use the first month from detection or request
      const fallbackYear = detectedYears[0];

      let rowIndex = 0;
      for (const s of sData) {
        rowIndex++;
        let eData = {};
        if (s.extra_data) {
          try {
            eData = JSON.parse(s.extra_data);
          } catch (e) {}
        }
        eData._rn = rowIndex;

        table.rows.add(
          parseInt(s.nam || fallbackYear),
          s.thang || fallbackMonth,
          s.ngay || "01",
          s.nhan_vien,
          s.ma_hang,
          s.mat_hang,
          s.amount || 1,
          effectiveGroup,
          source,
          JSON.stringify(eData),
        );
      }

      if (table.rows.length > 0) {
        const bulkRequest = new sql.Request(transaction);
        await bulkRequest.bulk(table);
      }

      await transaction.commit();

      await logActivity(
        req.user,
        "IMPORT_SALES",
        "detail",
        `Imported ${source.toUpperCase()} sales for ${effectiveGroup} (${sData.length} records)`,
      );

      await updateSummaryReport();

      res.json({
        message: `Successfully imported ${source.toUpperCase()} sales for ${effectiveGroup}`,
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

export const importTendooExpiredIds = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });
    const buffer = req.file.buffer;
    const { data } = await processSalesImportExcel(
      buffer,
      "Tendoo_Expired_Import",
    );

    if (!data || data.length === 0) {
      return res
        .status(400)
        .json({ error: "File không có dữ liệu ID hợp lệ (kiểm tra cột B)" });
    }

    const db = await getDb();
    const transaction = new sql.Transaction(db);
    await transaction.begin();

    try {
      // 1. Clear old IDs (Thay thế tập cũ bằng tập mới)
      await transaction.request().query("DELETE FROM tendoo_expired_ids");

      // 2. Bulk insert new IDs
      const table = new sql.Table("tendoo_expired_ids");
      table.columns.add("id_cua_hang", sql.NVarChar(255), { nullable: false });

      const uniqueIds = new Set();
      for (const item of data) {
        if (item.shopId && !uniqueIds.has(item.shopId)) {
          uniqueIds.add(item.shopId);
          table.rows.add(item.shopId);
        }
      }

      await new sql.Request(transaction).bulk(table);
      await transaction.commit();

      const dbRecalc = await getDb();
      //Migration: Đồng nhất tên 'Tendoo' cho đồng bộ với logic mới
      await dbRecalc.request().query(`
        UPDATE detail SET product_group = 'Tendoo' WHERE product_group = 'TB Tendoo' OR product_group = N'Tendoo';
        UPDATE product SET product_group = 'Tendoo' WHERE product_group = 'DTDV Tendoo' OR product_group = N'Tendoo' OR product_group = 'TB Tendoo';
      `);

      await updateSummaryReport();

      await logActivity(
        req.user,
        "IMPORT_EXPIRED_IDS",
        "tendoo_expired_ids",
        `Imported ${data.length} expired IDs and auto-recalculated`,
      );
      res.json({
        message: `Đã nhập thành công ${data.length} ID và tự động cập nhật lại Dashboard.`,
      });
    } catch (e) {
      if (transaction.active) await transaction.rollback();
      throw e;
    }
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ error: "Lỗi khi nhập danh sách ID hết hạn: " + err.message });
  }
};
