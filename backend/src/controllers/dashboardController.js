import { getDb } from "../config/db.js";
import * as analytics from "../services/analyticsService.js";

/**
 * Get paginated sales data with search
 * @route GET /api/sales
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
        SELECT d.*, d.tr_month as thang, d.tr_year as nam
        FROM detail d ${whereClause}
        ORDER BY d.tr_year DESC, d.tr_month DESC, d.ma_hang DESC
        OFFSET ${offset} ROWS FETCH NEXT ${parseInt(limit)} ROWS ONLY
      `)
    ]);

    const total = countResult.recordset[0].total;
    res.json({
      data: dataResult.recordset,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / parseInt(limit)),
    });
  } catch (err) {
    console.error("getSalesData error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

/**
 * Main dashboard data aggregator
 * @route GET /api/dashboard
 */
export const getDashboardData = async (req, res) => {
  try {
    const { 
      type = "all", 
      year, 
      month, 
      quarter, 
      mode, 
      source = "all" 
    } = req.query;
    
    const db = await getDb();
    const recordset = await fetchRawDashboardData(db, { type, year, source });

    const primaryYear = year && year.includes(",") ? year.split(",")[0] : year;
    const analyticsFilters = {
      year: primaryYear,
      month,
      quarter,
      mode: mode || (month ? "month" : quarter ? "quarter" : "all"),
    };

    const metrics = ["withVat", "withoutVat", "vat", "serviceCount"];
    const response = { rankings: {}, chartData: {}, comparisonData: {} };

    metrics.forEach((metric) => {
      response.rankings[metric] = analytics.computeStaffRankings(recordset, analyticsFilters, metric);
      const filteredData = analytics.filterDashboardData(recordset, analyticsFilters);
      response.chartData[metric] = analytics.aggregateChartData(filteredData, recordset, analyticsFilters, metric);
      response.comparisonData[metric] = analytics.aggregateComparisonData(recordset, analyticsFilters, metric);
    });

    // Populate dynamic filter lists (Groups, Years, Months, Quarters)
    await populateFilterMetadata(db, response, { type, source, year, month, quarter, mode });

    res.json(response);
  } catch (err) {
    console.error("Dashboard error:", err);
    res.status(500).json({ error: err.message });
  }
};

/**
 * Get basic record counts
 * @route GET /api/status
 */
export const getStatus = async (req, res) => {
  try {
    const db = await getDb();
    const [sCount, pCount] = await Promise.all([
      db.request().query("SELECT COUNT(*) as count FROM detail"),
      db.request().query("SELECT COUNT(*) as count FROM product")
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
 * Get distinct employee names
 * @route GET /api/staff
 */
export const getStaffNames = async (req, res) => {
  try {
    const { year } = req.query;
    const db = await getDb();
    const request = db.request();
    
    let query = "SELECT DISTINCT nhan_vien FROM detail";
    if (year) {
      query += " WHERE tr_year = @year";
      request.input("year", parseInt(year));
    }
    query += " ORDER BY nhan_vien ASC";
    
    const result = await request.query(query);
    res.json(result.recordset.map((r) => r.nhan_vien));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// --- PRIVATE HELPERS ---

async function fetchRawDashboardData(db, { type, year, source }) {
  const request = db.request();
  let query = `
    SELECT 
      tr_month AS thang, tr_year AS nam, nhan_vien AS nhanVien, 
      product_group, source_type, service_count AS serviceCount, 
      total_amount AS withoutVat, total_amount AS withVat, 0 AS vat 
    FROM summary_report WHERE 1=1`;

  if (type !== "all") {
    query += " AND product_group = @type";
    request.input("type", type);
  }
  if (source !== "all") {
    query += " AND source_type = @source";
    request.input("source", source);
  }
  if (year) {
    const years = year.split(",").map(y => parseInt(y.trim()));
    if (years.length > 1) {
      query += ` AND tr_year IN (${years.map((_, i) => `@y${i}`).join(",")})`;
      years.forEach((y, i) => request.input(`y${i}`, y));
    } else {
      query += " AND tr_year = @year";
      request.input("year", years[0]);
    }
  }

  const { recordset } = await request.query(query);
  return recordset;
}

async function populateFilterMetadata(db, response, { type, source, year, month, quarter, mode }) {
  // 1. Available Product Groups (Filtered by ALL current filters and MUST have revenue > 0)
  const groupReq = db.request();
  let whereConditions = ["product_group IS NOT NULL"];
  
  if (source !== "all") {
    whereConditions.push("source_type = @source");
    groupReq.input("source", source);
  }
  
  if (year) {
    const years = year.split(",").map(y => parseInt(y.trim()));
    if (years.length > 1) {
      whereConditions.push(`tr_year IN (${years.map((_, i) => `@gy${i}`).join(",")})`);
      years.forEach((y, i) => groupReq.input(`gy${i}`, y));
    } else {
      whereConditions.push("tr_year = @year");
      groupReq.input("year", years[0]);
    }
  }

  // Add Month/Quarter filtering to Tabs to ensure they hide if no data in selected period
  if (mode === "month" && month) {
    whereConditions.push("tr_month = @month");
    groupReq.input("month", month.padStart(2, '0'));
  } else if (mode === "quarter" && quarter) {
    whereConditions.push("CEILING(CAST(tr_month AS INT) / 3.0) = @quarter");
    groupReq.input("quarter", parseInt(quarter));
  }

  const groupQuery = `
    SELECT product_group 
    FROM summary_report 
    WHERE ${whereConditions.join(" AND ")}
    GROUP BY product_group 
    HAVING SUM(ISNULL(total_amount, 0)) > 0
  `;
  
  const groupRes = await groupReq.query(groupQuery);
  response.productGroups = ["all", ...groupRes.recordset.map(r => r.product_group)];

  // 2. Available Years
  let yearQuery = "SELECT DISTINCT tr_year FROM summary_report WHERE 1=1";
  const yearReq = db.request();
  if (type !== "all") { yearQuery += " AND product_group = @type"; yearReq.input("type", type); }
  if (source !== "all") { yearQuery += " AND source_type = @source"; yearReq.input("source", source); }
  const yearRes = await yearReq.query(yearQuery + " ORDER BY tr_year DESC");
  response.availableYears = yearRes.recordset.map(r => String(r.tr_year));

  // 3. Available Months & Quarters
  let monthQuery = "SELECT DISTINCT tr_month FROM summary_report WHERE 1=1";
  const monthReq = db.request();
  if (type !== "all") { monthQuery += " AND product_group = @type"; monthReq.input("type", type); }
  if (source !== "all") { monthQuery += " AND source_type = @source"; monthReq.input("source", source); }
  if (year && !year.includes(",")) { monthQuery += " AND tr_year = @year"; monthReq.input("year", parseInt(year)); }
  
  const monthRes = await monthReq.query(monthQuery + " ORDER BY tr_month ASC");
  const months = monthRes.recordset.map(r => String(parseInt(r.tr_month)));
  response.availableMonths = months;

  const quarters = new Set();
  months.forEach(m => quarters.add(String(Math.floor((parseInt(m) - 1) / 3) + 1)));
  response.availableQuarters = Array.from(quarters).sort();
}
