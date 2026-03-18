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
      source = "all",
      viewMode: reqViewMode
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
    const response = { rankings: {}, chartData: {}, comparisonData: {}, categoryData: {} };
    metrics.forEach((metric) => {
      // 1. Rankings (Always use filtered data)
      response.rankings[metric] = analytics.computeStaffRankings(recordset, analyticsFilters, metric);
      
      // 2. Standard Charts (Original time-series)
      const filteredData = analytics.filterDashboardData(recordset, analyticsFilters);
      response.chartData[metric] = analytics.aggregateChartData(filteredData, recordset, analyticsFilters, metric);
      response.comparisonData[metric] = analytics.aggregateComparisonData(recordset, analyticsFilters, metric);
    });

    // 3. Category Breakdown Data (Line, Pie, Table)
    // We fetch a SEPARATE recordset without the Category filter for the Category Summary charts
    // so that the chart always shows the full context even when a specific category is selected
    const categoryRecordset = await fetchRawDashboardData(db, { type: "all", year, source });
    metrics.forEach(metric => {
      response.categoryData[metric] = analytics.aggregateCategoryData(categoryRecordset, analyticsFilters, metric);
    });

    // Populate dynamic filter lists (Groups, Years, Months, Quarters)
    await populateFilterMetadata(db, response, { type, source, year, month, quarter, mode, viewMode: reqViewMode });

    // Target Achievement Calculation
    if (reqViewMode === 'target') {
        const rawYear = req.query.year;
        let years = [];
        
        if (rawYear && rawYear !== "all") {
            years = String(rawYear).split(',').map(y => parseInt(y.trim())).filter(y => !isNaN(y));
        } else {
            // Default to all years that have targets
            const allTargetYearsRes = await db.request().query("SELECT DISTINCT tr_year FROM targets ORDER BY tr_year DESC");
            years = allTargetYearsRes.recordset.map(r => r.tr_year);
        }

        if (years.length === 0) {
            years = [new Date().getFullYear()];
        }

        const result = { labels: [], years: years, yearsData: {} };
        
        // 1. Get ALL unique product groups for these years from BOTH targets and actuals
        const groupReq = db.request();
        const yearsStr = years.join(",");
        
        let actualWhere = `tr_year IN (${yearsStr}) AND (total_amount > 0 OR service_count > 0)`;
        let targetWhere = `tr_year IN (${yearsStr})`;

        if (source && source !== "all") {
            actualWhere += " AND LOWER(TRIM(source_type)) = LOWER(TRIM(@source))";
            targetWhere += " AND LOWER(TRIM(source_type)) = LOWER(TRIM(@source))";
            groupReq.input("source", source);
        }
        
        if (type && type !== "all") {
            actualWhere += " AND product_group = @type";
            targetWhere += " AND product_group = @type";
            groupReq.input("type", type);
        }

        let groupQuery = `
            SELECT DISTINCT TRIM(product_group) as pg FROM summary_report WHERE ${actualWhere}
                AND TRIM(product_group) IN (
                    SELECT DISTINCT TRIM(product_group) FROM targets WHERE ${targetWhere} AND amount > 0
                )
        `;

        if (type && type !== "all") {
            groupQuery = `SELECT TRIM(@type) as pg`;
        }

        const groupRes = await groupReq.query(groupQuery);
        result.labels = groupRes.recordset.map(r => r.pg).sort();

        // 2. Fetch data for each year
        for (const targetYear of years) {
            const targetReq = db.request();
            const actualReq = db.request();
            targetReq.input("year", targetYear);
            actualReq.input("year", targetYear);
            
            let targetQuery = `SELECT TRIM(product_group) as product_group, TRIM(type) as type, SUM(CAST(amount AS FLOAT)) as target_amount FROM targets WHERE tr_year = @year`;
            let actualQuery = `SELECT TRIM(product_group) as product_group, SUM(CAST(total_amount AS FLOAT)) as actual_revenue, SUM(CAST(service_count AS FLOAT)) as actual_subs FROM summary_report WHERE tr_year = @year`;

            if (source && source !== "all") {
                targetQuery += " AND LOWER(TRIM(source_type)) = LOWER(TRIM(@source))";
                actualQuery += " AND LOWER(TRIM(source_type)) = LOWER(TRIM(@source))";
                targetReq.input("source", source);
                actualReq.input("source", source);
            }

            if (type && type !== "all") {
                targetQuery += " AND product_group = @type";
                actualQuery += " AND product_group = @type";
                targetReq.input("type", type);
                actualReq.input("type", type);
            }
            
            if (mode === "month" && month) {
                const mStr = month.toString().padStart(2, '0');
                targetQuery += " AND tr_month = @month";
                actualQuery += " AND tr_month = @month";
                targetReq.input("month", mStr);
                actualReq.input("month", mStr);
            } else if (mode === "quarter" && quarter) {
                const q = parseInt(quarter);
                const m1 = ((q - 1) * 3 + 1).toString().padStart(2, '0');
                const m2 = ((q - 1) * 3 + 2).toString().padStart(2, '0');
                const m3 = ((q - 1) * 3 + 3).toString().padStart(2, '0');
                targetQuery += " AND tr_month IN (@m1, @m2, @m3)";
                actualQuery += " AND tr_month IN (@m1, @m2, @m3)";
                [targetReq, actualReq].forEach(r => {
                    r.input("m1", m1); r.input("m2", m2); r.input("m3", m3);
                });
            }

            targetQuery += " GROUP BY TRIM(product_group), TRIM(type)";
            actualQuery += " GROUP BY TRIM(product_group)";

            const [targetRes, actualRes] = await Promise.all([
                targetReq.query(targetQuery),
                actualReq.query(actualQuery)
            ]);

            const targetRows = targetRes.recordset;
            const actualRows = actualRes.recordset;

            result.yearsData[targetYear] = { 
                revenueRates: [], 
                subRates: [],
                revenueDetails: [], // { actual, target }
                subDetails: []      // { actual, target }
            };

            result.labels.forEach(group => {
                const groupLower = group.toLowerCase().trim();
                
                // Find actuals for this group (case-insensitive)
                const actual = actualRows.find(a => a.product_group.toLowerCase().trim() === groupLower) || { actual_revenue: 0, actual_subs: 0 };
                
                // Find targets for this group and type (case-insensitive and trimmed)
                const revTarget = targetRows.find(t => 
                    t.product_group.toLowerCase().trim() === groupLower && 
                    (t.type.toLowerCase().trim() === 'doanh thu' || t.type.toLowerCase().trim().includes('doanh thu'))
                )?.target_amount || 0;
                
                const subTarget = targetRows.find(t => 
                    t.product_group.toLowerCase().trim() === groupLower && 
                    (t.type.toLowerCase().trim() === 'thuê bao' || t.type.toLowerCase().trim().includes('thuê bao'))
                )?.target_amount || 0;

                const revRate = Number(revTarget) > 0 ? (Number(actual.actual_revenue) / Number(revTarget)) * 100 : 0;
                const subRate = Number(subTarget) > 0 ? (Number(actual.actual_subs) / Number(subTarget)) * 100 : 0;

                // Return 2 decimal places for better precision on small achievements
                result.yearsData[targetYear].revenueRates.push(parseFloat(Number(revRate).toFixed(2)));
                result.yearsData[targetYear].subRates.push(parseFloat(Number(subRate).toFixed(2)));

                // Add raw details for "extreme detail" tooltips
                result.yearsData[targetYear].revenueDetails.push({
                    actual: Number(actual.actual_revenue || 0),
                    target: Number(revTarget || 0)
                });
                result.yearsData[targetYear].subDetails.push({
                    actual: Number(actual.actual_subs || 0),
                    target: Number(subTarget || 0)
                });
            });
        }

        response.targetAchievement = result;
    }

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
    query += " AND LOWER(TRIM(product_group)) = LOWER(TRIM(@type))";
    request.input("type", type);
  }
  if (source !== "all") {
    query += " AND LOWER(TRIM(source_type)) = LOWER(TRIM(@source))";
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

async function populateFilterMetadata(db, response, { type, source, year, month, quarter, mode, viewMode }) {
  // 1. Available Product Groups (Filtered by ALL current filters)
  const groupReq = db.request();
  let whereActual = ["product_group IS NOT NULL"];
  let whereTarget = ["product_group IS NOT NULL"];
  
  if (source !== "all") {
    whereActual.push("source_type = @source");
    whereTarget.push("source_type = @source");
    groupReq.input("source", source);
  }
  
  if (year) {
    const years = year.split(",").map(y => parseInt(y.trim()));
    if (years.length > 1) {
        whereActual.push(`tr_year IN (${years.map((_, i) => `@gy${i}`).join(",")})`);
        whereTarget.push(`tr_year IN (${years.map((_, i) => `@gy${i}`).join(",")})`);
        years.forEach((y, i) => groupReq.input(`gy${i}`, y));
    } else {
        whereActual.push("tr_year = @year");
        whereTarget.push("tr_year = @year");
        groupReq.input("year", years[0]);
    }
  }

  if (mode === "month" && month) {
    whereActual.push("tr_month = @month");
    whereTarget.push("tr_month = @month");
    groupReq.input("month", month.padStart(2, '0'));
  } else if (mode === "quarter" && quarter) {
    const q = parseInt(quarter);
    whereActual.push("CEILING(CAST(tr_month AS INT) / 3.0) = @quarter");
    whereTarget.push("tr_month IN (@m1, @m2, @m3)");
    groupReq.input("quarter", q);
    groupReq.input("m1", ((q - 1) * 3 + 1).toString().padStart(2, '0'));
    groupReq.input("m2", ((q - 1) * 3 + 2).toString().padStart(2, '0'));
    groupReq.input("m3", ((q - 1) * 3 + 3).toString().padStart(2, '0'));
  }

  const actualWhereStr = whereActual.join(" AND ");
  const targetWhereStr = whereTarget.join(" AND ");

  let groupQuery = "";
  if (viewMode === 'target') {
    // ONLY show groups that have BOTH a target AND an actual recorded (since rate 0 shows "No Data")
    groupQuery = `
      SELECT DISTINCT TRIM(product_group) as product_group 
      FROM summary_report 
      WHERE ${actualWhereStr} AND (total_amount > 0 OR service_count > 0)
        AND TRIM(product_group) IN (
            SELECT DISTINCT TRIM(product_group) FROM targets WHERE ${targetWhereStr} AND amount > 0
        )
    `;
  } else {
    groupQuery = `
      SELECT DISTINCT TRIM(product_group) as product_group 
      FROM summary_report 
      WHERE ${actualWhereStr} 
        AND (total_amount > 0 OR service_count > 0)
        AND product_group IS NOT NULL AND product_group <> ''
    `;
  }
  
  const groupRes = await groupReq.query(groupQuery);
  const otherGroups = [...new Set(groupRes.recordset.map(r => r.product_group))].sort();
  response.productGroups = ["all", ...otherGroups];

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
  if (type !== "all") { monthQuery += " AND LOWER(TRIM(product_group)) = LOWER(TRIM(@type))"; monthReq.input("type", type); }
  if (source !== "all") { monthQuery += " AND LOWER(TRIM(source_type)) = LOWER(TRIM(@source))"; monthReq.input("source", source); }
  if (year && !year.includes(",")) { monthQuery += " AND tr_year = @year"; monthReq.input("year", parseInt(year)); }
  
  const monthRes = await monthReq.query(monthQuery + " ORDER BY tr_month ASC");
  const months = monthRes.recordset.map(r => String(parseInt(r.tr_month)));
  response.availableMonths = months;

  const quarters = new Set();
  months.forEach(m => quarters.add(String(Math.floor((parseInt(m) - 1) / 3) + 1)));
  response.availableQuarters = Array.from(quarters).sort();
}
