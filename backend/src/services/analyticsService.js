/**
 * analyticsService.js
 * 
 * Logic for processing dashboard data from flat records.
 */

/**
 * Filter a data array by time-based filters
 */
export function filterDashboardData(data, filters) {
  const { year, month, quarter, mode } = filters;
  const targetYears = year && String(year).includes(",") 
    ? year.split(",").map(y => String(y.trim())) 
    : (year ? [String(year)] : []);

  return data.filter(item => {
    // Year filter
    if (targetYears.length > 0 && !targetYears.includes(String(item.nam))) return false;
    
    // Month filter
    if (mode === "month" && month && parseInt(item.thang) !== parseInt(month)) return false;
    
    // Quarter filter
    if (mode === "quarter" && quarter) {
      const itemQuarter = Math.ceil(parseInt(item.thang) / 3);
      if (String(itemQuarter) !== String(quarter)) return false;
    }
    
    return true;
  });
}

/**
 * Compute staff rankings with growth indicators
 */
export function computeStaffRankings(allData, filters, metricField) {
  const currentYear = filters.primaryYear || parseInt(filters.year);

  const getRankedList = (targetYear) => {
    const stats = {};
    const yearData = targetYear 
      ? allData.filter(i => i.nam === targetYear)
      : allData;

    const filtered = filterDashboardData(yearData, { ...filters, year: targetYear || "" });

    filtered.forEach(item => {
      const staff = item.nhanVien || item.nhan_vien || "Không xác định";
      stats[staff] = (stats[staff] || 0) + (item[metricField] || 0);
    });

    return Object.entries(stats)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  };

  // 1. Global Mode (Totals across all years)
  if (isNaN(currentYear)) {
    return getRankedList(null).slice(0, 10).map(item => ({
      ...item,
      rankChange: "-",
      previousValue: 0
    }));
  }

  // 2. Normal Mode (Specific year vs previous year)
  const currentRanked = getRankedList(currentYear);
  const previousRanked = getRankedList(currentYear - 1);

  return currentRanked.slice(0, 10).map((item, index) => {
    const prevIndex = previousRanked.findIndex(p => p.name === item.name);
    let rankChange = "-";
    let previousValue = 0;

    if (prevIndex === -1) {
      rankChange = "new";
    } else {
      previousValue = previousRanked[prevIndex].value;
      if (prevIndex > index) rankChange = `up:${prevIndex - index}`;
      else if (prevIndex < index) rankChange = `down:${index - prevIndex}`;
    }

    return { ...item, rankChange, previousValue };
  });
}

/**
 * Aggregate data for multi-year comparison
 */
export function aggregateComparisonData(allData, filters, metricField) {
  const { year, mode, month, quarter } = filters;
  
  // 1. Determine comparison years
  let years = [];
  if (year && String(year).includes(',')) {
    years = String(year).split(',').map(y => parseInt(y.trim())).sort((a, b) => b - a);
  } else {
    // If year is empty or a single year, take all distinct years present in the fetched data
    years = [...new Set(allData.map(d => d.nam))].sort((a, b) => b - a);
  }

  if (years.length === 0) {
    return { labels: [], years: [], yearData: {} };
  }

  // 2. Prepare time labels
  const labels = [];
  const timeUnits = [];
  
  if (mode === "month") {
    const months = month ? [parseInt(month)] : [1,2,3,4,5,6,7,8,9,10,11,12];
    months.forEach(m => { labels.push(`T${m}`); timeUnits.push({ m }); });
  } else if (mode === "quarter") {
    const quarters = quarter ? [parseInt(quarter)] : [1,2,3,4];
    quarters.forEach(q => { labels.push(`Quý ${q}`); timeUnits.push({ q }); });
  } else {
    for (let m = 1; m <= 12; m++) { labels.push(`T${m}`); timeUnits.push({ m }); }
  }

  const getAggregation = (data, y, m, q) => {
    return data
      .filter(i => {
        if (i.nam !== y) return false;
        if (m && parseInt(i.thang) !== m) return false;
        if (q && Math.ceil(parseInt(i.thang) / 3) !== q) return false;
        return true;
      })
      .reduce((sum, i) => sum + (i[metricField] || 0), 0);
  };

  const yearData = {};
  years.forEach(y => {
    yearData[y] = timeUnits.map(unit => getAggregation(allData, y, unit.m, unit.q));
  });

  return { labels, years, yearData };
}

/**
 * Aggregate chart data for single year view + previous year comparison line
 */
export function aggregateChartData(filteredData, allData, filters, metricField) {
  const { year, month, quarter, mode } = filters;
  const labels = [];
  const values = [];
  const prevValues = [];

  const prevYear = year ? parseInt(year) - 1 : null;

  if (mode === "all" || !mode) {
    if (!year) {
      // Annual Overview
      const allYears = [...new Set(allData.map(i => i.nam))].sort((a,b) => a - b);
      allYears.forEach((y, idx) => {
        const label = `Năm ${y}`;
        labels.push(label);
        const val = allData.filter(i => i.nam === y).reduce((s, i) => s + (i[metricField] || 0), 0);
        values.push(val);
        
        let pVal = 0;
        if (idx > 0) {
          const prevY = allYears[idx-1];
          pVal = allData.filter(i => i.nam === prevY).reduce((s, i) => s + (i[metricField] || 0), 0);
        }
        prevValues.push(pVal);
      });
    } else {
      // Monthly Breakdown
      for (let m = 1; m <= 12; m++) {
        labels.push(`T${m}/${year}`);
        values.push(filteredData.filter(i => parseInt(i.thang) === m).reduce((s, i) => s + (i[metricField] || 0), 0));
        prevValues.push(allData.filter(i => i.nam === prevYear && parseInt(i.thang) === m).reduce((s, i) => s + (i[metricField] || 0), 0));
      }
    }
  } else if (mode === "quarter") {
    const targetQs = quarter ? [parseInt(quarter)] : [1,2,3,4];
    targetQs.forEach((q, idx) => {
      const label = `Quý ${q}${year ? "/" + year : ""}`;
      labels.push(label);
      values.push(filteredData.filter(i => Math.ceil(parseInt(i.thang)/3) === q).reduce((s,i) => s + (i[metricField] || 0), 0));
      
      let pVal = 0;
      if (prevYear) {
        pVal = allData.filter(i => i.nam === prevYear && Math.ceil(parseInt(i.thang)/3) === q).reduce((s,i) => s + (i[metricField] || 0), 0);
      } else if (!year && idx > 0) {
        pVal = values[idx-1];
      }
      prevValues.push(pVal);
    });
  } else if (mode === "month") {
    const targetMs = month ? [parseInt(month)] : [1,2,3,4,5,6,7,8,9,10,11,12];
    targetMs.forEach((m, idx) => {
      const label = `T${m}${year ? "/" + year : ""}`;
      labels.push(label);
      values.push(filteredData.filter(i => parseInt(i.thang) === m).reduce((s,i) => s + (i[metricField] || 0), 0));
      
      let pVal = 0;
      if (prevYear) {
        pVal = allData.filter(i => i.nam === prevYear && parseInt(i.thang) === m).reduce((s,i) => s + (i[metricField] || 0), 0);
      } else if (!year && idx > 0) {
        pVal = values[idx-1];
      }
      prevValues.push(pVal);
    });
  }

  return { labels, values, prevValues };
}

/**
 * Aggregate data by category and month for line chart, pie chart and table
 */
export function aggregateCategoryData(allData, filters, metricField) {
  const { year, month, quarter, mode } = filters;
  const targetYears = year ? String(year).split(',').map(y => parseInt(y.trim())) : [];
  const isNoYear = targetYears.length === 0 || isNaN(targetYears[0]);

  // 1. Group data into a Map for efficiency and accuracy (O(n))
  const dataMap = new Map();
  const foundCategories = new Set();

  allData.forEach(item => {
    // a. Filter by Year
    if (!isNoYear && !targetYears.includes(parseInt(item.nam))) return;
    
    // b. Filter by Month/Quarter
    const itemMonth = parseInt(item.thang);
    if (mode === "month" && month && itemMonth !== parseInt(month)) return;
    if (mode === "quarter" && quarter) {
      const itemQuarter = Math.ceil(itemMonth / 3);
      if (String(itemQuarter) !== String(quarter)) return;
    }
    
    // Normalize Category Name (CRITICAL: Remove newlines which appear in DB)
    let cat = (item.product_group || "Khác").toString().replace(/[\r\n\t]+/g, " ").trim();
    if (!cat) cat = "Khác";

    foundCategories.add(cat);
    if (!dataMap.has(cat)) {
      dataMap.set(cat, new Array(13).fill(0));
    }
    
    if (itemMonth >= 1 && itemMonth <= 12) {
      dataMap.get(cat)[itemMonth] += (Number(item[metricField]) || 0);
    }
  });

  const categories = Array.from(foundCategories).sort();
  
  // 2. Filter available months for the series/labels if a time filter is active
  let months = Array.from({ length: 12 }, (_, i) => i + 1);
  if (mode === "month" && month) {
    months = [parseInt(month)];
  } else if (mode === "quarter" && quarter) {
    const q = parseInt(quarter);
    months = [(q - 1) * 3 + 1, (q - 1) * 3 + 2, (q - 1) * 3 + 3];
  }
  const series = [];
  const pieData = [];

  categories.forEach(cat => {
    const monthlyValues = months.map(m => dataMap.get(cat)[m]);
    
    series.push({
      name: cat,
      data: monthlyValues
    });

    const yearTotal = monthlyValues.reduce((a, b) => a + b, 0);
    // Only show categories in PIE chart if they have non-zero value
    if (yearTotal > 0.01) { 
      pieData.push({
        name: cat,
        value: yearTotal
      });
    }
  });

  return {
    categories,
    months: months.map(m => `T${m}`),
    series,
    pieData: pieData.sort((a, b) => b.value - a.value)
  };
}
