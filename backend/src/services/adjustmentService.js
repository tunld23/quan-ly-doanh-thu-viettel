import { getDb } from "../config/db.js";
import { updateSummaryReport } from "./reportService.js";

/**
 * Adjustment Service
 * Handles data logic for manual adjustments
 */
export const adjustmentService = {
  /**
   * Get all adjustments ordered by date
   */
  async getAll() {
    const db = await getDb();
    const result = await db
      .request()
      .query("SELECT * FROM adjustments ORDER BY created_at DESC");
    return result.recordset;
  },

  /**
   * Create a new adjustment and update report
   */
  async create(data) {
    const db = await getDb();
    const request = db.request();

    request.input("year", data.tr_year);
    request.input("month", String(data.tr_month).padStart(2, "0"));
    request.input("user", data.nhan_vien);
    request.input("group", data.product_group || "Điều chỉnh");
    request.input("source_type", data.source_type || "manual");
    request.input("qty", data.adj_quantity || 0);
    request.input("amt", data.adj_amount || 0);
    request.input("note", data.note || "");

    await request.query(`
      INSERT INTO adjustments (tr_year, tr_month, nhan_vien, product_group, source_type, adj_quantity, adj_amount, note)
      VALUES (@year, @month, @user, @group, @source_type, @qty, @amt, @note)
    `);

    await updateSummaryReport();
    return { success: true };
  },

  /**
   * Remove adjustment and refresh report
   */
  async delete(createdAt) {
    const db = await getDb();
    const request = db.request();
    request.input("createdAt", createdAt);
    await request.query("DELETE FROM adjustments WHERE created_at = @createdAt");
    await updateSummaryReport();
    return { success: true };
  },
};
