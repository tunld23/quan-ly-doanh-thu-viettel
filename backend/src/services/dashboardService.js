import { getDb } from "../config/db.js";
import sql from "mssql/msnodesqlv8.js";

/**
 * Fetch raw dashboard data from various sources
 */
export async function fetchRawDashboardData(
  db,
  { type, year, source, month, day, includeSip },
) {
  const request = db.request();
  let where = "WHERE 1=1";

  if (type !== "all") {
    where += " AND LOWER(TRIM(product_group)) = LOWER(TRIM(@type))";
    request.input("type", type);
  } else if (!includeSip) {
    where += " AND LOWER(TRIM(product_group)) <> LOWER(N'Doanh Thu Thêm')";
    where +=
      " AND (source_type <> 'dealer' OR LOWER(TRIM(product_group)) IN (LOWER(N'CA'), LOWER(N'BHXH'), LOWER(N'HDDT')))";
  }

  if (source !== "all") {
    where += " AND LOWER(TRIM(source_type)) = LOWER(TRIM(@source))";
    request.input("source", source);
  }
  if (year) {
    const years = String(year)
      .split(",")
      .map((y) => parseInt(y.trim()));
    if (years.length > 1) {
      where += ` AND tr_year IN (${years.map((_, i) => `@y${i}`).join(",")})`;
      years.forEach((y, i) => request.input(`y${i}`, y));
    } else {
      where += " AND tr_year = @year";
      request.input("year", years[0]);
    }
  }

  if (month && day) {
    const paddedMonth = String(month).padStart(2, "0");
    const paddedDay = String(day).padStart(2, "0");
    // Sửa lỗi: Chuyển từ tính Year-to-Date sang Month-to-Date cho dashboard SME
    where += " AND tr_month = @m_mtd AND tr_day <= @d_mtd";
    request.input("m_mtd", paddedMonth);
    request.input("d_mtd", paddedDay);
  } else if (month) {
    const paddedMonth = String(month).padStart(2, "0");
    where += " AND tr_month = @m_filt";
    request.input("m_filt", paddedMonth);
  }

  const query = `
    SELECT 
      tr_year AS nam, tr_month AS thang, tr_day AS ngay, nhan_vien AS nhanVien, 
      product_group, source_type,
      SUM(revenue) AS withoutVat, 
      SUM(revenue) AS withVat, 
      0 AS vat,
      SUM(quantity) AS serviceCount
    FROM (
      SELECT tr_year, tr_month, tr_day, nhan_vien, product_group, source_type, total_amount AS revenue, 0 AS quantity
      FROM summary_report
      UNION ALL
      SELECT tr_year, tr_month, tr_day, nhan_vien, product_group, source_type, 0 AS revenue, service_count AS quantity
      FROM staff_service_count
      UNION ALL
      SELECT tr_year, tr_month, tr_day, nhan_vien, product_group, source_type, 0 AS revenue, adj_quantity AS quantity
      FROM adjustments
    ) t
    ${where}
    GROUP BY tr_year, tr_month, tr_day, nhan_vien, product_group, source_type`;

  const { recordset } = await request.query(query);
  return recordset;
}

/**
 * Calculate target achievement
 */
export async function calculateTargetAchievement(
  db,
  { type, source, year, month, quarter, mode },
) {
  let years = [];
  if (year && year !== "all") {
    years = String(year)
      .split(",")
      .map((y) => parseInt(y.trim()))
      .filter((y) => !isNaN(y));
  } else {
    const allTargetYearsRes = await db
      .request()
      .query("SELECT DISTINCT tr_year FROM targets ORDER BY tr_year DESC");
    years = allTargetYearsRes.recordset.map((r) => r.tr_year);
  }

  if (years.length === 0) {
    years = [new Date().getFullYear()];
  }

  const result = { labels: [], years: years, yearsData: {} };
  const yearsStr = years.join(",");
  const groupReq = db.request();

  let sourceFilter = "";
  let targetSourceFilter = "";
  if (source && source !== "all") {
    sourceFilter = " AND LOWER(TRIM(source_type)) = LOWER(TRIM(@source))";
    targetSourceFilter = " AND LOWER(TRIM(source_type)) = LOWER(TRIM(@source))";
    groupReq.input("source", source);
  }

  let typeFilter = "";
  let targetTypeFilter = "";
  if (type && type !== "all") {
    typeFilter = " AND product_group = @type";
    targetTypeFilter = " AND product_group = @type";
    groupReq.input("type", type);
  }

  const actualUnion = `
        SELECT product_group, tr_year, source_type, total_amount as revenue, 0 as quantity FROM summary_report
        UNION ALL
        SELECT product_group, tr_year, source_type, 0 as revenue, service_count as quantity FROM staff_service_count
        UNION ALL
        SELECT product_group, tr_year, source_type, 0 as revenue, adj_quantity as quantity FROM adjustments
    `;

  let groupQuery = `
        SELECT DISTINCT TRIM(product_group) as pg FROM (${actualUnion}) t 
        WHERE tr_year IN (${yearsStr}) ${sourceFilter} ${typeFilter}
        AND (revenue > 0 OR quantity > 0)
        AND TRIM(product_group) IN (
            SELECT DISTINCT TRIM(product_group) FROM targets 
            WHERE tr_year IN (${yearsStr}) ${targetSourceFilter} ${targetTypeFilter} AND amount > 0
        )
    `;

  if (type && type !== "all") {
    groupQuery = `SELECT TRIM(@type) as pg`;
  }

  const groupRes = await groupReq.query(groupQuery);
  result.labels = groupRes.recordset.map((r) => r.pg).sort();

  for (const targetYear of years) {
    const targetReq = db.request();
    const actualReq = db.request();
    targetReq.input("year", targetYear);
    actualReq.input("year", targetYear);

    let targetQuery = `SELECT TRIM(product_group) as product_group, TRIM(type) as type, SUM(CAST(amount AS FLOAT)) as target_amount FROM targets WHERE tr_year = @year`;
    let actualQuery = `
          SELECT 
            TRIM(product_group) as product_group, 
            SUM(revenue) as actual_revenue, 
            SUM(quantity) as actual_subs 
          FROM (
            SELECT product_group, tr_year, tr_month, source_type, total_amount as revenue, 0 as quantity FROM summary_report
            UNION ALL
            SELECT product_group, tr_year, tr_month, source_type, 0 as revenue, service_count as quantity FROM staff_service_count
            UNION ALL
            SELECT product_group, tr_year, tr_month, source_type, 0 as revenue, adj_quantity as quantity FROM adjustments
          ) t
          WHERE tr_year = @year`;

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
      const mStr = month.toString().padStart(2, "0");
      targetQuery += " AND tr_month = @month";
      actualQuery += " AND tr_month = @month";
      targetReq.input("month", mStr);
      actualReq.input("month", mStr);
    } else if (mode === "quarter" && quarter) {
      const q = parseInt(quarter);
      if (!isNaN(q)) {
        const m1 = ((q - 1) * 3 + 1).toString().padStart(2, "0");
        const m2 = ((q - 1) * 3 + 2).toString().padStart(2, "0");
        const m3 = ((q - 1) * 3 + 3).toString().padStart(2, "0");
        targetQuery += " AND tr_month IN (@m1, @m2, @m3)";
        actualQuery += " AND tr_month IN (@m1, @m2, @m3)";
        [targetReq, actualReq].forEach((r) => {
          r.input("m1", m1);
          r.input("m2", m2);
          r.input("m3", m3);
        });
      }
    }

    targetQuery += " GROUP BY TRIM(product_group), TRIM(type)";
    actualQuery += " GROUP BY TRIM(product_group)";

    const [targetRes, actualRes] = await Promise.all([
      targetReq.query(targetQuery),
      actualReq.query(actualQuery),
    ]);

    const targetRows = targetRes.recordset;
    const actualRows = actualRes.recordset;

    result.yearsData[targetYear] = {
      revenueRates: [],
      subRates: [],
      revenueDetails: [],
      subDetails: [],
    };

    result.labels.forEach((group) => {
      const groupLower = (group || "").toLowerCase().trim();
      const actual = actualRows.find(
        (a) => (a.product_group || "").toLowerCase().trim() === groupLower,
      ) || { actual_revenue: 0, actual_subs: 0 };
      const revTarget =
        targetRows.find(
          (t) =>
            (t.product_group || "").toLowerCase().trim() === groupLower &&
            (t.type || "").toLowerCase().trim().includes("doanh thu"),
        )?.target_amount || 0;
      const subTarget =
        targetRows.find(
          (t) =>
            (t.product_group || "").toLowerCase().trim() === groupLower &&
            (t.type || "").toLowerCase().trim().includes("thuê bao"),
        )?.target_amount || 0;

      const revRate =
        Number(revTarget) > 0
          ? (Number(actual.actual_revenue) / Number(revTarget)) * 100
          : 0;
      const subRate =
        Number(subTarget) > 0
          ? (Number(actual.actual_subs) / Number(subTarget)) * 100
          : 0;

      result.yearsData[targetYear].revenueRates.push(
        parseFloat(Number(revRate).toFixed(2)),
      );
      result.yearsData[targetYear].subRates.push(
        parseFloat(Number(subRate).toFixed(2)),
      );
      result.yearsData[targetYear].revenueDetails.push({
        actual: Number(actual.actual_revenue || 0),
        target: Number(revTarget || 0),
      });
      result.yearsData[targetYear].subDetails.push({
        actual: Number(actual.actual_subs || 0),
        target: Number(subTarget || 0),
      });
    });
  }
  return result;
}

/**
 * Populate filter metadata
 */
export async function getFilterMetadata(
  db,
  { type, source, year, month, quarter, mode, viewMode, includeSip },
) {
  const response = {};
  const groupReq = db.request();
  let whereActual = ["product_group IS NOT NULL"];
  let whereTarget = ["product_group IS NOT NULL"];

  if (source !== "all") {
    whereActual.push("source_type = @source");
    whereTarget.push("source_type = @source");
    groupReq.input("source", source);
  }

  if (!includeSip) {
    const filter =
      "LOWER(TRIM(product_group)) <> LOWER(N'Doanh Thu Thêm') AND (source_type <> 'dealer' OR LOWER(TRIM(product_group)) IN (LOWER(N'CA'), LOWER(N'BHXH'), LOWER(N'HDDT')))";
    whereActual.push(filter);
    whereTarget.push(filter);
  }

  if (year) {
    const years = String(year)
      .split(",")
      .map((y) => parseInt(y.trim()));
    if (years.length > 1) {
      whereActual.push(
        `tr_year IN (${years.map((_, i) => `@gy${i}`).join(",")})`,
      );
      whereTarget.push(
        `tr_year IN (${years.map((_, i) => `@gy${i}`).join(",")})`,
      );
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
    groupReq.input("month", String(month).padStart(2, "0"));
  } else if (mode === "quarter" && quarter) {
    const q = parseInt(quarter);
    if (!isNaN(q)) {
      whereActual.push("CEILING(CAST(tr_month AS INT) / 3.0) = @quarter");
      whereTarget.push("tr_month IN (@m1, @m2, @m3)");
      groupReq.input("quarter", q);
      groupReq.input("m1", ((q - 1) * 3 + 1).toString().padStart(2, "0"));
      groupReq.input("m2", ((q - 1) * 3 + 2).toString().padStart(2, "0"));
      groupReq.input("m3", ((q - 1) * 3 + 3).toString().padStart(2, "0"));
    }
  }

  const actualWhereStr = whereActual.join(" AND ");
  const targetWhereStr = whereTarget.join(" AND ");
  const actualUnion = `
    SELECT nhan_vien, tr_year, tr_month, product_group, source_type, total_amount as revenue, 0 as quantity FROM summary_report
    UNION ALL
    SELECT nhan_vien, tr_year, tr_month, product_group, source_type, 0 as revenue, service_count as quantity FROM staff_service_count
    UNION ALL
    SELECT nhan_vien, tr_year, tr_month, product_group, source_type, 0 as revenue, adj_quantity as quantity FROM adjustments
  `;

  let groupQuery = "";
  if (viewMode === "target") {
    groupQuery = `
      SELECT DISTINCT TRIM(product_group) as product_group FROM (${actualUnion}) t 
      WHERE ${actualWhereStr} AND (revenue > 0 OR quantity > 0)
        AND TRIM(product_group) IN (SELECT DISTINCT TRIM(product_group) FROM targets WHERE ${targetWhereStr} AND amount > 0)
    `;
  } else if (viewMode === "subscriber") {
    groupQuery = `
      SELECT DISTINCT TRIM(product_group) as product_group FROM (${actualUnion}) t 
      WHERE ${actualWhereStr} AND quantity > 0 AND product_group IS NOT NULL AND product_group <> ''
    `;
  } else {
    groupQuery = `
      SELECT DISTINCT TRIM(product_group) as product_group FROM (${actualUnion}) t 
      WHERE ${actualWhereStr} AND (revenue > 0.01 OR revenue < -0.01) AND product_group IS NOT NULL AND product_group <> ''
    `;
  }

  const groupRes = await groupReq.query(groupQuery);
  const categories = [
    ...new Set(groupRes.recordset.map((r) => r.product_group)),
  ].sort();
  response.productGroups = ["all", ...categories];

  // Available Years
  let yearQuery = "SELECT DISTINCT tr_year FROM summary_report WHERE 1=1";
  const yearReq = db.request();
  if (type !== "all") {
    yearQuery += " AND product_group = @type";
    yearReq.input("type", type);
  }
  if (source !== "all") {
    yearQuery += " AND source_type = @source";
    yearReq.input("source", source);
  }
  const yearRes = await yearReq.query(yearQuery + " ORDER BY tr_year DESC");
  response.availableYears = yearRes.recordset.map((r) => String(r.tr_year));

  // Available Months
  let monthQuery = "SELECT DISTINCT tr_month FROM summary_report WHERE 1=1";
  const monthReq = db.request();
  if (type !== "all") {
    monthQuery += " AND LOWER(TRIM(product_group)) = LOWER(TRIM(@type))";
    monthReq.input("type", type);
  }
  if (source !== "all") {
    monthQuery += " AND LOWER(TRIM(source_type)) = LOWER(TRIM(@source))";
    monthReq.input("source", source);
  }
  if (year && !String(year).includes(",")) {
    monthQuery += " AND tr_year = @year";
    monthReq.input("year", parseInt(year));
  }
  const monthRes = await monthReq.query(monthQuery + " ORDER BY tr_month ASC");
  const months = monthRes.recordset.map((r) => String(parseInt(r.tr_month)));
  response.availableMonths = months;

  const quarters = new Set();
  months.forEach((m) =>
    quarters.add(String(Math.floor((parseInt(m) - 1) / 3) + 1)),
  );
  response.availableQuarters = Array.from(quarters).sort();

  return response;
}

/**
 * Get performance comparisons
 */
export async function getPerformanceData(
  db,
  { year, month, day, source, includeSip },
) {
  const y = parseInt(year);
  const m = parseInt(month);
  const d = parseInt(day);

  const todayStr = String(d).padStart(2, "0");
  const monthStr = String(m).padStart(2, "0");

  const todayObj = new Date(y, m - 1, d);
  const yesterdayObj = new Date(todayObj);
  yesterdayObj.setDate(todayObj.getDate() - 1);
  const yesDayStr = String(yesterdayObj.getDate()).padStart(2, "0");
  const yesMonthStr = String(yesterdayObj.getMonth() + 1).padStart(2, "0");
  const yesYear = yesterdayObj.getFullYear();

  const lastMonthObj = new Date(y, m - 2, d);
  const lmMonthStr = String(lastMonthObj.getMonth() + 1).padStart(2, "0");
  const lmYear = lastMonthObj.getFullYear();

  const lastYear = y - 1;

  const getSourceFilter = (req) => {
    let filter = "";
    if (source === "sme") {
      filter += " AND LOWER(TRIM(source_type)) IN ('am', 'dealer')";
    } else if (source !== "all") {
      filter += " AND LOWER(TRIM(source_type)) = LOWER(TRIM(@source))";
      req.input("source", source);
    }

    if (includeSip === "false" || includeSip === false) {
      filter +=
        " AND (source_type <> 'dealer' OR LOWER(TRIM(product_group)) IN (LOWER(N'CA'), LOWER(N'BHXH'), LOWER(N'HDDT')))";
      filter += " AND LOWER(TRIM(product_group)) <> LOWER(N'Doanh Thu Thêm')";
    }
    return filter;
  };

  const getDaySum = async (yr, mo, da) => {
    const req = db.request();
    req.input("y", sql.Int, yr);
    req.input("m", sql.NVarChar, mo);
    req.input("d", sql.NVarChar, da);
    const filter = getSourceFilter(req);
    const query = `SELECT SUM(total_amount) as revenue FROM summary_report WHERE tr_year = @y AND tr_month = @m AND tr_day = @d ${filter}`;
    const res = await req.query(query);
    return res.recordset[0]?.revenue || 0;
  };

  const getMtdSum = async (yr, mo, da) => {
    const req = db.request();
    req.input("y", sql.Int, yr);
    req.input("m", sql.NVarChar, mo);
    req.input("d", sql.NVarChar, da);
    const filter = getSourceFilter(req);
    const query = `SELECT SUM(total_amount) as revenue FROM summary_report WHERE tr_year = @y AND tr_month = @m AND tr_day <= @d ${filter}`;
    const res = await req.query(query);
    return res.recordset[0]?.revenue || 0;
  };

  const [todayVal, yesterdayVal, currentMtd, lastMonthMtd, lastYearMtd] =
    await Promise.all([
      getDaySum(y, monthStr, todayStr),
      getDaySum(yesYear, yesMonthStr, yesDayStr),
      getMtdSum(y, monthStr, todayStr),
      getMtdSum(lmYear, lmMonthStr, todayStr),
      getMtdSum(lastYear, monthStr, todayStr),
    ]);

  return {
    today: todayVal,
    todayMtd: currentMtd,
    yesterday: yesterdayVal,
    lastMonth: lastMonthMtd,
    lastYear: lastYearMtd,
  };
}
