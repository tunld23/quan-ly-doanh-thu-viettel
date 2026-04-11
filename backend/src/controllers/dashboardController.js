import { getDb } from "../config/db.js";
import * as analytics from "../services/analyticsService.js";
import * as dashboardService from "../services/dashboardService.js";

/**
 * Get paginated sales data with search
 */
export const getSalesData = async (req, res) => {
  try {
    const { page = 1, limit = 50, search = "" } = req.query;
    const db = await getDb();
    const request = db.request();
    const offset = (Math.max(1, parseInt(page)) - 1) * parseInt(limit);

    let whereClause = "WHERE 1=1";
    if (search) {
      whereClause += ` AND (d.ma_hang LIKE @search OR d.nhan_vien LIKE @search OR d.mat_hang LIKE @search)`;
      request.input("search", `%${search}%`);
    }

    const [countResult, dataResult] = await Promise.all([
      request.query(`SELECT COUNT(*) as total FROM detail d ${whereClause}`),
      request.query(`
        SELECT d.*, d.tr_year as nam, d.tr_month as thang
        FROM detail d ${whereClause}
        ORDER BY d.tr_year DESC, d.tr_month DESC, d.ma_hang DESC
        OFFSET ${offset} ROWS FETCH NEXT ${parseInt(limit)} ROWS ONLY
      `),
    ]);

    res.json({
      data: dataResult.recordset,
      total: countResult.recordset[0].total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(countResult.recordset[0].total / parseInt(limit)),
    });
  } catch (err) {
    console.error("getSalesData error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

/**
 * Main dashboard data aggregator
 */
export const getDashboardData = async (req, res) => {
  try {
    const {
      type = "all", year, month, day, quarter, mode, source = "all",
      viewMode: reqViewMode, includeSip = false,
    } = req.query;

    const db = await getDb();
    const isIncludeSip = includeSip === "true" || includeSip === true;

    // 1. Fetch Raw Data
    const recordset = await dashboardService.fetchRawDashboardData(db, {
      type, year, source, month, day, includeSip: isIncludeSip,
    });

    const yearList = year && String(year).includes(",") 
      ? year.split(",").map(y => parseInt(y.trim())) 
      : (year ? [parseInt(year)] : []);
    const primaryYear = yearList.length > 0 ? Math.max(...yearList) : NaN;

    const analyticsFilters = {
      year, primaryYear, month, day, quarter,
      mode: mode || (month ? "month" : quarter ? "quarter" : "all"),
    };

    const metrics = ["withVat", "withoutVat", "vat", "serviceCount"];
    const response = { rankings: {}, chartData: {}, comparisonData: {}, categoryData: {} };

    metrics.forEach((metric) => {
      response.rankings[metric] = analytics.computeStaffRankings(recordset, analyticsFilters, metric);
      const filteredData = analytics.filterDashboardData(recordset, analyticsFilters);
      response.chartData[metric] = analytics.aggregateChartData(filteredData, recordset, analyticsFilters, metric);
      response.comparisonData[metric] = analytics.aggregateComparisonData(recordset, analyticsFilters, metric);
      response.categoryData[metric] = analytics.aggregateCategoryData(recordset, analyticsFilters, metric, "product_group");
    });

    // 2. Metadata (Product Groups, Years, Months)
    const metadata = await dashboardService.getFilterMetadata(db, {
      type, source, year, month, quarter, mode, viewMode: reqViewMode, includeSip: isIncludeSip
    });
    Object.assign(response, metadata);

    // 3. Target Achievement (Specific View)
    if (reqViewMode === "target") {
        response.targetAchievement = await dashboardService.calculateTargetAchievement(db, {
            type, source, year: req.query.year, month, quarter, mode
        });
    }

    res.json(response);
  } catch (err) {
    console.error("Dashboard error:", err);
    res.status(500).json({ error: err.message });
  }
};

/**
 * Performance Comparison (Today vs Past)
 */
export const getPerformanceComparisons = async (req, res) => {
  try {
    const { year, month, day, source = "all", includeSip = "false" } = req.query;
    if (!year || !month || !day) return res.status(400).json({ error: "Missing date parameters" });

    const db = await getDb();
    const results = await dashboardService.getPerformanceData(db, {
        year, month, day, source, includeSip: includeSip === "true" || includeSip === true
    });
    res.json(results);
  } catch (err) {
    console.error("Comparison error:", err);
    res.status(500).json({ error: err.message });
  }
};

/**
 * Basic status counts
 */
export const getStatus = async (req, res) => {
  try {
    const db = await getDb();
    const [sCount, pCount] = await Promise.all([
      db.request().query("SELECT COUNT(*) as count FROM detail"),
      db.request().query("SELECT COUNT(*) as count FROM product"),
    ]);

    res.json({
      sales: sCount.recordset[0]?.count || 0,
      products: pCount.recordset[0]?.count || 0,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * Distinct employee names
 */
export const getStaffNames = async (req, res) => {
  try {
    const { year, source } = req.query;
    const db = await getDb();
    const request = db.request();

    let where = "WHERE 1=1";
    if (year) { where += " AND tr_year = @year"; request.input("year", parseInt(year)); }
    if (source && source !== "all") {
      where += " AND LOWER(TRIM(source_type)) = LOWER(TRIM(@source))";
      request.input("source", source);
    }

    const query = `
      SELECT DISTINCT nhan_vien FROM (
        SELECT nhan_vien, tr_year, source_type FROM detail
        UNION ALL
        SELECT nhan_vien, tr_year, source_type FROM summary_report
        UNION ALL
        SELECT nhan_vien, tr_year, source_type FROM staff_service_count
      ) t 
      ${where} 
      AND nhan_vien IS NOT NULL 
      AND LOWER(nhan_vien) NOT IN ('admin', 'null', 'không rõ')
      ORDER BY nhan_vien ASC`;

    const result = await request.query(query);
    res.json(result.recordset.map((r) => r.nhan_vien));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getSmeDashboardSummary = async (req, res) => {
  try {
    const { year, month, day, includeSip = false } = req.query;
    const db = await getDb();
    const isIncludeSip = includeSip === "true" || includeSip === true;

    // Helper to make mock requests formatted for dashboardService
    const mockQueryForData = async (options) => {
        const recordset = await dashboardService.fetchRawDashboardData(db, options);
        // We only care about categoryData (for subscribers) & chartData (for totals)
        // Actually, for SME, we need total revenues for Dealer, AM, and Tendoo!
        let totalRevenue = 0;
        let categoryData = {};
        if (options.viewMode === "subscriber") {
           const analyticsFilters = { year, primaryYear: parseInt(year), month, day, mode: "month" };
           const filteredData = analytics.filterDashboardData(recordset, analyticsFilters);
           categoryData = analytics.aggregateCategoryData(recordset, analyticsFilters, "serviceCount", "product_group");
        } else {
           const analyticsFilters = { year, primaryYear: parseInt(year), month, day, mode: "month" };
           const filteredData = analytics.filterDashboardData(recordset, analyticsFilters);
           // total revenue
           totalRevenue = filteredData.reduce((sum, d) => sum + (Number(d.revenue) || 0), 0);
           // Also, Tendoo specifically needs to parse pieData correctly if we pass `type: "Tendoo"` but it gives totalRevenue already!
           if (options.type === "Tendoo") {
              // Usually Tendoo data comes with source=all and product_group='Tendoo'. But wait, in `useSmeDashboard.js`, we did:
              //   amRes => amRes.data.chartData["withVat"].totalPie
           }
        }
        
        return {
           totalRevenue,
           categoryData
        };
    };

    // But it's FAR easier to just replicate what the frontend used:
    const getDash = async (source, type, viewMode) => {
       const recordset = await dashboardService.fetchRawDashboardData(db, { type, year, source, month, day, includeSip: isIncludeSip });
       const analyticsFilters = { year, primaryYear: parseInt(year), month, day, mode: "month" };
       const metrics = ["withVat", "withoutVat", "vat", "serviceCount"];
       const filteredData = analytics.filterDashboardData(recordset, analyticsFilters);
       const obj = { chartData: {}, categoryData: {} };
       
       metrics.forEach(metric => {
         obj.chartData[metric] = analytics.aggregateChartData(filteredData, recordset, analyticsFilters, metric);
         obj.categoryData[metric] = analytics.aggregateCategoryData(recordset, analyticsFilters, metric, "product_group");
       });
       
       return obj;
    };

    // Fire them all concurrently on the server
    const [subscriberRes, compRes, dealerRes, amRes, tendooRes] = await Promise.all([
      getDash("all", "all", "subscriber"),
      dashboardService.getPerformanceData(db, { year, month, day, source: "sme", includeSip: isIncludeSip }),
      getDash("dealer", "all", "actual"),
      getDash("am", "all", "actual"),
      getDash("all", "Tendoo", "actual")
    ]);

    res.json({
      subscriberData: subscriberRes,
      comparisonData: compRes,
      dealerData: dealerRes,
      amData: amRes,
      tendooData: tendooRes
    });
  } catch (err) {
    console.error("SME Summary Error:", err);
    res.status(500).json({ error: err.message });
  }
};

/**
 * Force refresh summary report
 */
export const refreshSummary = async (req, res) => {
  try {
    const { updateSummaryReport } = await import("../services/reportService.js");
    await updateSummaryReport();
    res.json({ message: "Dữ liệu đã được cập nhật thành công!" });
  } catch (err) {
    console.error("Refresh error:", err);
    res.status(500).json({ error: "Không thể làm mới dữ liệu: " + err.message });
  }
};
