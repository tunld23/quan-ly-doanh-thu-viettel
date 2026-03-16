/**
 * analytics.js
 *
 * Logic to filter, aggregate and compute rankings for the dashboard.
 */

export function filterDashboardData(data, filters) {
  let filtered = [...data];
  const { year, month, quarter, mode } = filters;

  if (year) {
    filtered = filtered.filter((item) => String(item.nam) === year);
  }

  if (mode === "month" && month) {
    filtered = filtered.filter((item) => String(item.thang) === month);
  }

  if (mode === "quarter" && quarter) {
    filtered = filtered.filter((item) => {
      const q = Math.ceil(item.thang / 3);
      return String(q) === quarter;
    });
  }

  return filtered;
}

export function computeStaffRankings(allData, filters, metricField) {
  const { year } = filters;
  const currentYear = parseInt(year);

  const getRankedList = (targetYear) => {
    const revenueByStaff = {};
    // If targetYear is provided, filter by it. If not, use all data (global mode)
    const filtered = targetYear
      ? allData.filter((item) => item.nam === targetYear)
      : allData;

    // Further filter by month/quarter if applicable
    const finalFiltered = filterDashboardData(filtered, {
      ...filters,
      year: targetYear ? String(targetYear) : "",
    });

    finalFiltered.forEach((item) => {
      const staff = item.nhanVien || "Unknown";
      if (!revenueByStaff[staff]) revenueByStaff[staff] = 0;
      revenueByStaff[staff] += item[metricField] || 0;
    });

    return Object.keys(revenueByStaff)
      .map((name) => ({ name, value: revenueByStaff[name] }))
      .sort((a, b) => b.value - a.value);
  };

  // Case 1: Global mode (No year selected)
  if (isNaN(currentYear)) {
    return getRankedList(null)
      .slice(0, 10)
      .map((item) => ({
        ...item,
        rankChange: "-",
        previousValue: 0,
      }));
  }

  // Case 2: Specific year selected (Normal mode)
  const currentRanked = getRankedList(currentYear);
  const previousRanked = getRankedList(currentYear - 1);

  return currentRanked.slice(0, 10).map((item, index) => {
    const prevIndex = previousRanked.findIndex((p) => p.name === item.name);
    let rankChange = "-";
    let previousValue = 0;

    if (prevIndex === -1) {
      rankChange = "new";
    } else {
      previousValue = previousRanked[prevIndex].value;
      if (prevIndex > index) rankChange = `up:${prevIndex - index}`;
      else if (prevIndex < index) rankChange = `down:${index - prevIndex}`;
    }

    return {
      ...item,
      rankChange,
      previousValue,
    };
  });
}

/**
 * Aggregates data for a 3-year comparison.
 * Returns labels and 3 arrays of values (Current, N-1, N-2).
 */
export function aggregateComparisonData(allData, filters, metricField) {
  const { year, mode, month, quarter } = filters;
  const currentYear = parseInt(year);
  if (isNaN(currentYear))
    return { labels: [], current: [], prev1: [], prev2: [], years: [0, 0, 0] };

  const years = [currentYear, currentYear - 1, currentYear - 2];
  const labels = [];
  const seriesData = {
    current: [],
    prev1: [],
    prev2: [],
  };

  const getSum = (data, y, m, q) => {
    return data
      .filter((item) => {
        const matchYear = item.nam === y;
        let matchTime = true;
        if (m) matchTime = String(item.thang) === String(m);
        if (q) matchTime = Math.ceil(item.thang / 3) === parseInt(q);
        return matchYear && matchTime;
      })
      .reduce((sum, item) => sum + (item[metricField] || 0), 0);
  };

  if (mode === "all") {
    // Show 12 months
    for (let m = 1; m <= 12; m++) {
      labels.push(`T${m}`);
      seriesData.current.push(getSum(allData, years[0], m));
      seriesData.prev1.push(getSum(allData, years[1], m));
      seriesData.prev2.push(getSum(allData, years[2], m));
    }
  } else if (mode === "quarter") {
    const qList = quarter ? [parseInt(quarter)] : [1, 2, 3, 4];
    qList.forEach((q) => {
      labels.push(`Quý ${q}`);
      seriesData.current.push(getSum(allData, years[0], null, q));
      seriesData.prev1.push(getSum(allData, years[1], null, q));
      seriesData.prev2.push(getSum(allData, years[2], null, q));
    });
  } else if (mode === "month") {
    const mList = month
      ? [parseInt(month)]
      : [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
    mList.forEach((m) => {
      labels.push(`Tháng ${m}`);
      seriesData.current.push(getSum(allData, years[0], m));
      seriesData.prev1.push(getSum(allData, years[1], m));
      seriesData.prev2.push(getSum(allData, years[2], m));
    });
  }

  return { labels, ...seriesData, years };
}

export function aggregateChartData(
  filteredData,
  allData,
  filters,
  metricField,
) {
  const { year, month, quarter, mode } = filters;
  const timeTotals = {};
  const labels = [];

  const prevTimeTotals = {};

  if (mode === "all") {
    if (!year) {
      // Show by YEAR
      const rowYears = [...new Set(allData.map((i) => i.nam))].sort(
        (a, b) => a - b,
      );
      rowYears.forEach((y, idx) => {
        const label = `Năm ${y}`;
        labels.push(label);
        timeTotals[label] = allData
          .filter((i) => i.nam === y)
          .reduce((sum, i) => sum + (i[metricField] || 0), 0);

        // Prev value is the previous year in the list
        if (idx > 0) {
          const prevYearLabel = `Năm ${rowYears[idx - 1]}`;
          prevTimeTotals[label] = timeTotals[prevYearLabel];
        } else {
          prevTimeTotals[label] = 0;
        }
      });
    } else {
      // Show all 12 MONTHS of the selected year
      const prevYear = parseInt(year) - 1;
      for (let m = 1; m <= 12; m++) {
        const label = `Tháng ${m}/${year}`;
        labels.push(label);
        timeTotals[label] = filteredData
          .filter((i) => i.thang === m)
          .reduce((sum, i) => sum + (i[metricField] || 0), 0);

        prevTimeTotals[label] = allData
          .filter((i) => i.nam === prevYear && i.thang === m)
          .reduce((sum, i) => sum + (i[metricField] || 0), 0);
      }
    }
  } else if (mode === "quarter") {
    const targetQuarters = quarter ? [parseInt(quarter)] : [1, 2, 3, 4];
    const prevYear = year ? parseInt(year) - 1 : null;
    targetQuarters.forEach((q, idx) => {
      const label = `Quý ${q}${year ? "/" + year : ""}`;
      labels.push(label);
      timeTotals[label] = filteredData
        .filter((i) => Math.ceil(i.thang / 3) === q)
        .reduce((sum, i) => sum + (i[metricField] || 0), 0);

      if (prevYear) {
        prevTimeTotals[label] = allData
          .filter((i) => i.nam === prevYear && Math.ceil(i.thang / 3) === q)
          .reduce((sum, i) => sum + (i[metricField] || 0), 0);
      } else if (!year && idx > 0) {
        // Sequential comparison for "All Years" mode
        const prevLabel = `Quý ${targetQuarters[idx - 1]}`;
        prevTimeTotals[label] = timeTotals[prevLabel];
      }
    });
  } else if (mode === "month") {
    const targetMonths = month
      ? [parseInt(month)]
      : [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
    const prevYear = year ? parseInt(year) - 1 : null;
    targetMonths.forEach((m, idx) => {
      const label = `Tháng ${m}${year ? "/" + year : ""}`;
      labels.push(label);
      timeTotals[label] = filteredData
        .filter((i) => i.thang === m)
        .reduce((sum, i) => sum + (i[metricField] || 0), 0);

      if (prevYear) {
        prevTimeTotals[label] = allData
          .filter((i) => i.nam === prevYear && i.thang === m)
          .reduce((sum, i) => sum + (i[metricField] || 0), 0);
      } else if (!year && idx > 0) {
        // Sequential comparison for "All Years" mode
        const prevLabel = `Tháng ${targetMonths[idx - 1]}`;
        prevTimeTotals[label] = timeTotals[prevLabel];
      }
    });
  }

  const values = labels.map((l) => timeTotals[l] || 0);
  const prevValues = labels.map((l, idx) => {
    if (prevTimeTotals[l] !== undefined) return prevTimeTotals[l];
    // Fallback: sequential comparison for "All Years" mode
    if (!year && idx > 0) return values[idx - 1];
    return 0;
  });

  return { labels, values, prevValues };
}
