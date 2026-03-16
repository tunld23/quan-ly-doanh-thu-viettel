import * as echarts from "echarts";

const formatMoney = (val, isCurrency = true) => {
  if (val === 0) return "0";
  const absVal = Math.abs(val);
  if (isCurrency) {
    if (absVal >= 1e9) {
      return (val / 1e9).toFixed(2).replace(/\.?0+$/, "") + " B";
    }
    if (absVal >= 1e6) {
      return (val / 1e6).toFixed(1).replace(/\.?0+$/, "") + " M";
    }
  }
  return val.toLocaleString("vi-VN");
};

export const getBaseChartOption = () => ({
  grid: { top: 20, right: 0, bottom: 20, left: 30, containLabel: true },
  tooltip: { trigger: "axis", axisPointer: { type: "shadow" } },
  xAxis: {
    type: "category",
    data: [],
    axisTick: { show: false },
    axisLine: { lineStyle: { color: "#e5e7eb" } },
    axisLabel: { color: "#6b7280", margin: 16, fontSize: 13 },
  },
  yAxis: {
    type: "value",
    splitLine: { show: false },
    axisLabel: { color: "#6b7280", fontSize: 13 },
    axisLine: { show: true, lineStyle: { color: "#e5e7eb" } },
  },
  series: [],
});

export const getUpdateOption = (
  labels,
  chartValues,
  metricName,
  prevValues = [],
  metricId = ""
) => {
  const isCurrency = metricId !== "serviceCount";
  const getGrowth = (cur, old) => {
    if (!old || old === 0) return 0;
    return (((cur - old) / old) * 100).toFixed(1);
  };

  return {
    grid: {
      top: 60,
      bottom: labels.length > 8 ? 75 : 40,
      left: 50,
      right: 25,
      containLabel: true,
    },
    xAxis: {
      data: labels,
      axisLabel: {
        interval: 0,
        rotate: labels.length > 8 ? 35 : 0,
        fontSize: 10,
        color: "#6b7280",
      },
    },
    yAxis: {
      name: metricName,
      axisLabel: {
        formatter: (value) => formatMoney(value, isCurrency),
        fontSize: 10,
        color: "#6b7280",
      },
      // Let ECharts handle axis scale more naturally
      boundaryGap: ["0%", "15%"],
    },
    series: [
      {
        name: metricName,
        type: "bar",
        barWidth: labels.length > 4 ? "50%" : "30%",
        itemStyle: {
          color: "#65a5fe",
          borderRadius: [4, 4, 0, 0],
        },
        data: chartValues,
        label: {
          show: true,
          position: "top",
          distance: 5,
          formatter: (params) => {
            const idx = params.dataIndex;
            const curVal = chartValues[idx];
            const oldVal = prevValues[idx];

            let res = formatMoney(curVal, isCurrency);

            // Luôn hiện growth nếu có dữ liệu so sánh và giá trị hiện tại > 0 (tránh hiện giảm 100%)
            if (oldVal > 0 && curVal > 0) {
              const growth = getGrowth(curVal, oldVal);
              const icon = growth >= 0 ? "▲" : "▼";
              res += `\n{${growth >= 0 ? "up" : "down"}|${icon}${Math.abs(growth)}%}`;
            }
            return res;
          },
          rich: {
            up: {
              color: "#10B981",
              fontSize: 9,
              fontWeight: "bold",
              backgroundColor: "#D1FAE5",
              padding: [1, 2],
              borderRadius: 2,
            },
            down: {
              color: "#EF4444",
              fontSize: 9,
              fontWeight: "bold",
              backgroundColor: "#FEE2E2",
              padding: [1, 2],
              borderRadius: 2,
            },
          },
        },
      },
    ],
    tooltip: {
      trigger: "axis",
      backgroundColor: "rgba(255, 255, 255, 0.98)",
      borderColor: "#f0f0f0",
      borderWidth: 1,
      textStyle: { color: "#333", fontSize: 12 },
      shadowColor: "rgba(0, 0, 0, 0.05)",
      shadowBlur: 10,
      formatter: (params) => {
        const p = params[0];
        const idx = p.dataIndex;
        const curVal = p.value || 0;
        const oldVal = prevValues ? prevValues[idx] : 0;

        let res = `<div style="font-weight:bold;margin-bottom:8px;border-bottom:1px solid #f0f0f0;padding-bottom:6px;font-size:13px;">${p.name}</div>`;
        res += `<div style="display:flex;justify-content:space-between;gap:30px;margin-bottom:2px;">
          <span style="color:#666;">${p.marker} ${p.seriesName}:</span>
          <span style="font-weight:bold;color:#1e293b;">${curVal.toLocaleString("vi-VN")}${isCurrency ? ' VNĐ' : ''}</span>
        </div>`;

        if (oldVal > 0 && curVal > 0) {
          const growth = getGrowth(curVal, oldVal);
          const color = growth >= 0 ? "#10B981" : "#EF4444";
          const icon = growth >= 0 ? "▲" : "▼";
          const diff = curVal - oldVal;
          res += `<div style="margin-top:8px;padding-top:8px;border-top:1px dashed #f0f0f0;display:flex;flex-direction:column;gap:2px;">
            <div style="display:flex;justify-content:space-between;color:${color};font-weight:bold;">
              <span>Tăng trưởng:</span>
              <span>${icon} ${Math.abs(growth)}%</span>
            </div>
            <div style="font-size:11px;color:#94a3b8;text-align:right;">
              (${diff >= 0 ? "+" : ""}${diff.toLocaleString("vi-VN")}${isCurrency ? ' VNĐ' : ''})
            </div>
          </div>`;
        }
        return res;
      },
    },
  };
};

export const getComparisonOption = (data, metricName, metricId = "") => {
  const { labels, current, prev1, prev2, years } = data;
  const isCurrency = metricId !== "serviceCount";

  const getGrowth = (cur, prev) => {
    if (!prev) return 0;
    return (((cur - prev) / prev) * 100).toFixed(1);
  };

  const series = [];
  
  // N-2 (Nếu có)
  if (years && years.length >= 3) {
    series.push({
      name: String(years[2]),
      type: "bar",
      data: prev2,
      itemStyle: {
        color: "#5D8FFF",
        opacity: 0.25,
        borderRadius: [4, 4, 0, 0],
      },
    });
  }

  // N-1 (Nếu có)
  if (years && years.length >= 2) {
    series.push({
      name: String(years[1]),
      type: "bar",
      data: prev1,
      itemStyle: {
        color: "#5D8FFF",
        opacity: 0.55,
        borderRadius: [4, 4, 0, 0],
      },
      label: {
        show: labels.length <= 6,
        position: "top",
        distance: 5,
        formatter: (params) => {
          if (years.length < 3) return "";
          const idx = params.dataIndex;
          const curVal = prev1[idx];
          const oldVal = prev2[idx];
          if (curVal === 0 || !oldVal) return "";
          const growth = getGrowth(curVal, oldVal);
          const icon = growth >= 0 ? "▲" : "▼";
          return `{${growth >= 0 ? "up" : "down"}|${Math.abs(growth)}%}`;
        },
        rich: {
          up: { color: "#10B981", fontSize: 8, fontWeight: "bold", backgroundColor: "#D1FAE5", padding: [1, 2], borderRadius: 2 },
          down: { color: "#EF4444", fontSize: 8, fontWeight: "bold", backgroundColor: "#FEE2E2", padding: [1, 2], borderRadius: 2 },
        },
      },
    });
  }

  // Năm hiện tại (Luôn có)
  if (years && years.length >= 1) {
    series.push({
      name: String(years[0]),
      type: "bar",
      data: current,
      itemStyle: { color: "#5D8FFF", opacity: 1, borderRadius: [4, 4, 0, 0] },
      label: {
        show: labels.length <= 6,
        position: "top",
        distance: 5,
        formatter: (params) => {
          if (years.length < 2) return "";
          const idx = params.dataIndex;
          const curVal = current[idx];
          const oldVal = prev1[idx];
          if (curVal <= 0 || !oldVal) return "";
          const growth = getGrowth(curVal, oldVal);
          const icon = growth >= 0 ? "▲" : "▼";
          return `{${growth >= 0 ? "up" : "down"}|${Math.abs(growth)}%}`;
        },
        rich: {
          up: { color: "#10B981", fontSize: 8, fontWeight: "bold", backgroundColor: "#D1FAE5", padding: [1, 2], borderRadius: 2 },
          down: { color: "#EF4444", fontSize: 8, fontWeight: "bold", backgroundColor: "#FEE2E2", padding: [1, 2], borderRadius: 2 },
        },
      },
    });
  }

  return {
    legend: {
      show: true,
      top: 0,
      data: years.map(String),
    },
    grid: {
      top: 80,
      bottom: labels.length > 8 ? 75 : 40,
      left: 30,
      right: 30,
      containLabel: true,
    },
    xAxis: {
      type: "category",
      data: labels,
      axisLabel: { fontSize: 11, color: "#6b7280" },
    },
    yAxis: {
      type: "value",
      axisLabel: { formatter: (v) => formatMoney(v, isCurrency), fontSize: 10 },
      splitLine: { lineStyle: { type: "dashed" } },
      boundaryGap: ["0%", "15%"],
    },
    tooltip: {
      trigger: "axis",
      axisPointer: { type: "shadow" },
      formatter: (params) => {
        if (!params || !params.length) return "";
        let res = `<div style="font-weight:bold;margin-bottom:8px;border-bottom:1px solid #eee;padding-bottom:5px;">${params[0].name}</div>`;

        // Sort params to match years array [N, N-1, N-2]
        const sorted = [...params].sort((a, b) => b.seriesName - a.seriesName);

        sorted.forEach((p) => {
          res += `<div style="display:flex;justify-content:space-between;gap:20px;margin-bottom:3px;">
            <span>${p.marker} Năm ${p.seriesName}:</span>
            <span style="font-weight:bold">${p.value.toLocaleString("vi-VN")}${isCurrency ? ' VNĐ' : ''}</span>
          </div>`;
        });

        if (years && years.length > 1) {
          const curVal = current[params[0].dataIndex] || 0;
          const p1Val = prev1[params[0].dataIndex] || 0;
          const growth = getGrowth(curVal, p1Val);
          const color = growth >= 0 ? "#10B981" : "#EF4444";
          const icon = growth >= 0 ? "▲" : "▼";

          res += `<div style="margin-top:8px;padding-top:8px;border-top:1px dashed #eee;color:${color};font-weight:bold;text-align:right;">
            ${icon} So với ${years[1]}: ${Math.abs(growth)}% 
            (${(curVal - p1Val).toLocaleString("vi-VN")}${isCurrency ? ' VNĐ' : ''})
          </div>`;
        }

        return res;
      },
    },
    series
  };
};
