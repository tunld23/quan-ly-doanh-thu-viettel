import { getDb } from "../config/db.js";
import { updateSummaryReport } from "./reportService.js";

/**
 * Adjustment Service
 * Handles data logic for manual adjustments
 */
export const adjustmentService = {
  /**
   * Get all adjustments joined with current summary and service counts
   */
  async getAll() {
    const db = await getDb();
    const result = await db
      .request()
      .query(`
        SELECT 
          adj.*,
          sr.total_amount as current_revenue,
          sc.service_count as current_quantity
        FROM adjustments adj
        LEFT JOIN summary_report sr ON adj.tr_year = sr.tr_year 
            AND adj.tr_month = sr.tr_month 
            AND adj.nhan_vien = sr.nhan_vien 
            AND adj.product_group = sr.product_group
            AND adj.source_type = sr.source_type
        LEFT JOIN staff_service_count sc ON adj.tr_year = sc.tr_year 
            AND adj.tr_month = sc.tr_month 
            AND adj.nhan_vien = sc.nhan_vien 
            AND adj.product_group = sc.product_group
            AND adj.source_type = sc.source_type
        ORDER BY adj.created_at DESC
      `);
    return result.recordset;
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

  /**
   * Get staff members available in both revenue and count reports (matching summary and staff_count)
   */
  async getAvailableStaff(filters) {
    const db = await getDb();
    const request = db.request();

    request.input("year", filters.tr_year);
    request.input("month", String(filters.tr_month).padStart(2, "0"));
    request.input("group", filters.product_group);
    request.input("source_type", filters.source_type);

    const result = await request.query(`
      SELECT 
        t.nhan_vien,
        SUM(t.revenue) as current_revenue,
        SUM(t.quantity) as current_quantity
      FROM (
        -- Revenue base from summary_report (already includes revenue adjustments)
        SELECT nhan_vien, total_amount as revenue, 0 as quantity 
        FROM summary_report
        WHERE tr_year = @year AND tr_month = @month AND product_group = @group AND source_type = @source_type
        
        UNION ALL
        
        -- Quantity base from staff_service_count
        SELECT nhan_vien, 0 as revenue, service_count as quantity 
        FROM staff_service_count
        WHERE tr_year = @year AND tr_month = @month AND product_group = @group AND source_type = @source_type
        
        UNION ALL
        
        -- Existing quantity adjustments
        SELECT nhan_vien, 0 as revenue, adj_quantity as quantity 
        FROM adjustments
        WHERE tr_year = @year AND tr_month = @month AND product_group = @group AND source_type = @source_type
      ) t
      GROUP BY t.nhan_vien
      ORDER BY t.nhan_vien ASC
    `);
    return result.recordset;
  },

  /**
   * Create a new adjustment with limit validation
   */
  async create(data) {
    const db = await getDb();
    const month = String(data.tr_month).padStart(2, "0");

    // 1. Validation Logic: Calculate CURRENT NET balance (Base + Previous Adjustments)
    const checkReq = db.request();
    checkReq.input("year", data.tr_year);
    checkReq.input("month", month);
    checkReq.input("user", data.nhan_vien);
    checkReq.input("group", data.product_group);
    checkReq.input("source", data.source_type);

    const balanceRes = await checkReq.query(`
      SELECT 
        SUM(revenue) as cur_amt,
        SUM(quantity) as cur_qty
      FROM (
        -- Revenue base
        SELECT total_amount as revenue, 0 as quantity FROM summary_report
        WHERE tr_year = @year AND tr_month = @month AND nhan_vien = @user AND product_group = @group AND source_type = @source
        
        UNION ALL
        
        -- Quantity base
        SELECT 0 as revenue, service_count as quantity FROM staff_service_count
        WHERE tr_year = @year AND tr_month = @month AND nhan_vien = @user AND product_group = @group AND source_type = @source
        
        UNION ALL
        
        -- Existing adjustments
        SELECT 0 as revenue, adj_quantity as quantity FROM adjustments
        WHERE tr_year = @year AND tr_month = @month AND nhan_vien = @user AND product_group = @group AND source_type = @source
      ) t
    `);

    const balance = balanceRes.recordset[0] || { cur_amt: 0, cur_qty: 0 };
    const curAmt = balance.cur_amt || 0;
    const curQty = balance.cur_qty || 0;

    // Check quantity limit (if subtracting)
    if (data.adj_quantity < 0 && Math.abs(data.adj_quantity) > curQty) {
      throw new Error(`Số lượng trừ đi (${Math.abs(data.adj_quantity)}) không thể vượt quá số lượng hiện có (${curQty})`);
    }

    // Check revenue limit (if subtracting)
    if (data.adj_amount < 0 && Math.abs(data.adj_amount) > curAmt) {
      throw new Error(`Số tiền trừ đi (${Math.abs(data.adj_amount)}) không thể vượt quá doanh thu hiện có (${curAmt.toLocaleString()} VNĐ)`);
    }

    const request = db.request();
    request.input("year", data.tr_year);
    request.input("month", month);
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
};
