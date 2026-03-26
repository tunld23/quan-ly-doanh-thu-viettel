import * as echarts from "echarts";

const formatMoney = (val, isCurrency = true) => {
  if (val === 0 || !val) return "0";
  if (!isCurrency) return val.toLocaleString("en-US", { useGrouping: false });

  const inMillions = val / 1000000;
  return inMillions.toLocaleString("en-US", {
    useGrouping: false,
    maximumFractionDigits: 6,
  });
};

export const getShortName = (name) => {
  if (name === "all") return "Tất cả";
  if (name === "Internet truyền hình" || name === "Internet Truyền hình")
    return "Internet";
  if (name === "Hóa đơn (HDDT)" || name === "Hóa đơn") return "HDDT";
  if (name === "HDDTV") return "HDDT";
  return name;
};

const CATEGORY_COLOR_MAP = {
  CA: "#3b82f6", // Blue 500
  "Internet truyền hình": "#22c55e", // Green 500
  Internet: "#22c55e",
  HDDT: "#ef4444", // Red 500
  "Hóa đơn (HDDT)": "#ef4444",
  "Hóa đơn": "#ef4444",
  vTracking: "#f97316", // Orange 500
  BHXH: "#a855f7", // Purple 500
  vBHXH: "#a855f7",
  "CAM10(DTDV)": "#14b8a6", // Teal 500
  vContract: "#ec4899", // Pink 500
  HDDTV: "#6366f1", // Indigo 500
  Easybooks: "#eab308", // Yellow 500
  Tendoo: "#84cc16", // Lime 500
  MySign: "#38bdf8", // Sky 400
};

const DEFAULT_COLORS = [
  // 1-10: Bright Distinct Professional (Level 500)
  "#3b82f6", // Blue
  "#22c55e", // Green
  "#ef4444", // Red
  "#f97316", // Orange
  "#a855f7", // Purple
  "#14b8a6", // Teal
  "#ec4899", // Pink
  "#eab308", // Yellow
  "#6366f1", // Indigo
  "#84cc16", // Lime
  "#38bdf8", // Sky
  "#8b5cf6", // Violet
  "#fb923c", // Light Orange
  "#22d3ee", // Cyan
  "#f43f5e", // Rose
  "#4ade80", // Light Green
  "#60a5fa", // Light Blue
  "#c084fc", // Light Purple
  "#fbbf24", // Amber
  "#34d399", // Emerald
  // 21-30: Deep
  "#db2777",
  "#d97706",
  "#7c3aed",
  "#2563eb",
  "#0891b2",
  "#e11d48",
  "#65a30d",
  "#0284c7",
  "#4338ca",
  "#065f46",
  // 31-40: Earth & Unique
  "#9d174d",
  "#b45309",
  "#5b21b6",
  "#1e40af",
  "#155e75",
  "#9f1239",
  "#3f6212",
  "#075985",
  "#3730a3",
  "#064e3b",
  "#264653",
  "#2a9d8f",
  "#e9c46a",
  "#f4a261",
  "#e76f51",
  "#003049",
  "#d62828",
  "#f77f00",
  "#fcbf49",
  "#eae2b7",
  "#5f0f40",
  "#9a031e",
  "#fb8b24",
  "#e36414",
  "#0f4c5c",
  "#606c38",
  "#283618",
  "#fefae0",
  "#dda15e",
  "#bc6c25",
  "#c026d3",
  "#ea580c",
  "#ca8a04",
  "#16a34a",
  "#0d9488",
  "#9333ea",
  "#f11712",
  "#662d91",
  "#006837",
  "#fbb03b",
  "#29abe2",
  "#00a99d",
  "#d4145a",
  "#f7931e",
  "#8cc63f",
  "#39b54a",
  "#4b2113",
  "#744b19",
  "#322659",
  "#1c4532",
];

// Simple hash function to get consistent color from name
const getStringHash = (str) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash);
};

const getCategoryColor = (name, index) => {
  if (CATEGORY_COLOR_MAP[name]) return CATEGORY_COLOR_MAP[name];

  // Use hash of name if not in map, fallback to index if hash fails
  const nameHash = name ? getStringHash(name) : index;
  return DEFAULT_COLORS[nameHash % DEFAULT_COLORS.length];
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
  metricId = "",
) => {
  const isCurrency = metricId !== "serviceCount";
  const getGrowth = (cur, old) => {
    if (!old || old === 0) return 0;
    return (((cur - old) / old) * 100).toFixed(1);
  };

  return {
    grid: {
      show: true,
      borderColor: "#e2e8f0",
      borderWidth: 1,
      top: 60,
      bottom: labels.length > 8 ? 75 : 40,
      left: 50,
      right: 25,
      containLabel: true,
    },
    xAxis: {
      type: "category",
      data: labels,
      boundaryGap: true,
      axisLabel: {
        interval: 0,
        rotate: labels.length > 8 ? 35 : 0,
        fontSize: 10,
        color: "#6b7280",
      },
      splitLine: {
        show: true,
        lineStyle: { color: "#f1f5f9", type: "dashed" },
      },
    },
    yAxis: {
      name: metricName,
      axisLabel: {
        formatter: (value) => formatMoney(value, isCurrency),
        fontSize: 10,
        color: "#6b7280",
      },
      splitLine: {
        show: true,
        lineStyle: { color: "#f1f5f9", type: "dashed" },
      },
      boundaryGap: ["0%", "15%"],
    },
    series: [
      {
        name: metricName,
        type: labels.length === 1 ? "bar" : "line",
        smooth: 0.4,
        showSymbol: true,
        symbol: "circle",
        symbolSize: 10,
        barMaxWidth: "40",
        barMinHeight: 5, // Improved balance for small data
        itemStyle: {
          color: "#65a5fe",
          borderRadius: [6, 6, 0, 0],
          borderWidth: 2,
          borderColor: "#fff",
        },
        lineStyle: {
          width: 4,
          cap: "round",
          shadowBlur: 10,
          shadowColor: "rgba(0,0,0,0.1)",
          shadowOffsetY: 5,
        },
        areaStyle: {
          opacity: 0.1,
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: "#65a5fe" },
            { offset: 1, color: "rgba(255, 255, 255, 0)" },
          ]),
        },
        data: chartValues,
        label: {
          show: true,
          position: "top",
          distance: 10,
          formatter: (params) => {
            const idx = params.dataIndex;
            const curVal = chartValues[idx];
            const oldVal = prevValues[idx];

            let res = formatMoney(curVal, isCurrency);

            if (oldVal > 0 && curVal > 0) {
              const growth = (((curVal - oldVal) / oldVal) * 100).toFixed(1);
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
          <span style="font-weight:bold;color:#1e293b;">${formatMoney(curVal, isCurrency)}</span>
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
              (${diff >= 0 ? "+" : ""}${diff.toLocaleString("vi-VN")}${isCurrency ? " VNĐ" : ""})
            </div>
          </div>`;
        }
        return res;
      },
    },
  };
};

export const getComparisonOption = (data, metricName, metricId = "") => {
  const { labels, years, yearData } = data;
  const isCurrency = metricId !== "serviceCount";

  const getGrowth = (cur, prev) => {
    if (!prev || prev === 0) return 0;
    return (((cur - prev) / prev) * 100).toFixed(1);
  };

  const displayYears = [...years].sort((a, b) => a - b);
  const series = [];

  // Professional Gradient Blue (Decreasing intensity from Newest to Oldest)
  // Professional Colors for Year-over-year comparison (High contrast)
  const colors = [
    "#3b82f6", // Blue
    "#ef4444", // Red
    "#22c55e", // Green
    "#f97316", // Orange
    "#a855f7", // Purple
    "#14b8a6", // Teal
  ];

  displayYears.forEach((y, idx) => {
    // Reversed: Oldest year (idx 0) gets colors[0] (Dark Blue)
    const colorIdx = idx % colors.length;
    const values = yearData[y];
    const prevYear = displayYears[idx - 1];
    const prevValues = prevYear ? yearData[prevYear] : null;

    const isSinglePoint = labels.length === 1;
    series.push({
      name: String(y),
      type: isSinglePoint ? "bar" : "line",
      smooth: 0.4,
      barMaxWidth: 30,
      barMinHeight: 5, // Improved balance for small data
      showSymbol: true,
      symbol: "circle",
      symbolSize: 10,
      itemStyle: {
        color: colors[colorIdx],
        borderWidth: 2,
        borderColor: "#fff",
        borderRadius: [4, 4, 0, 0],
      },
      data: values,
      lineStyle: {
        width: 4,
        cap: "round",
        shadowBlur: 10,
        shadowColor: "rgba(0,0,0,0.1)",
        shadowOffsetY: 5,
      },
      areaStyle: {
        opacity: 0.05,
      },
      label: {
        show: labels.length <= 6 && displayYears.length <= 3,
        position: "top",
        distance: 5,
        formatter: (params) => {
          if (!prevValues) return "";
          const curVal = params.value;
          const oldVal = prevValues[params.dataIndex];
          if (curVal <= 0 || !oldVal || oldVal <= 0) return "";
          const growth = getGrowth(curVal, oldVal);
          const icon = growth >= 0 ? "▲" : "▼";
          return `{${growth >= 0 ? "up" : "down"}|${Math.abs(growth)}%}`;
        },
        rich: {
          up: {
            color: "#10B981",
            fontSize: 8,
            fontWeight: "bold",
            backgroundColor: "#D1FAE5",
            padding: [1, 2],
            borderRadius: 2,
          },
          down: {
            color: "#EF4444",
            fontSize: 8,
            fontWeight: "bold",
            backgroundColor: "#FEE2E2",
            padding: [1, 2],
            borderRadius: 2,
          },
        },
      },
    });
  });

  return {
    legend: {
      show: true,
      top: 0,
      icon: "roundRect",
      data: displayYears.map(String),
      textStyle: { fontWeight: "bold", fontSize: 12 },
    },
    grid: {
      show: true,
      borderColor: "#e2e8f0",
      borderWidth: 1,
      top: 80,
      bottom: labels.length > 8 ? 75 : 40,
      left: 30,
      right: 30,
      containLabel: true,
    },
    xAxis: {
      type: "category",
      data: labels,
      boundaryGap: true,
      axisLabel: { fontSize: 11, color: "#6b7280", fontWeight: "bold" },
      splitLine: {
        show: true,
        lineStyle: { color: "#f1f5f9", type: "dashed" },
      },
    },
    yAxis: {
      type: "value",
      axisLabel: {
        formatter: (v) => formatMoney(v, isCurrency),
        fontSize: 10,
        fontWeight: "bold",
      },
      splitLine: { lineStyle: { type: "dashed", color: "#f0f0f0" } },
      boundaryGap: ["0%", "15%"],
    },
    tooltip: {
      trigger: "axis",
      axisPointer: { type: "shadow" },
      backgroundColor: "rgba(255, 255, 255, 0.98)",
      borderColor: "#f0f0f0",
      borderWidth: 1,
      textStyle: { color: "#333" },
      formatter: (params) => {
        if (!params || !params.length) return "";
        let res = `<div style="font-weight:bold;margin-bottom:10px;border-bottom:1px solid #eee;padding-bottom:6px;font-size:14px;">${params[0].name}</div>`;

        const sortedParams = [...params].sort(
          (a, b) => b.seriesName - a.seriesName,
        );

        sortedParams.forEach((p) => {
          const curVal = p.value || 0;
          const currentYear = parseInt(p.seriesName);
          const prevYear = currentYear - 1;
          const prevParam = sortedParams.find(
            (sp) => parseInt(sp.seriesName) === prevYear,
          );
          const prevVal = prevParam ? prevParam.value : null;

          res += `<div style="display:flex;justify-content:space-between;gap:30px;margin-bottom:5px;align-items:center;">
            <div style="display:flex;items-center;gap:8px;">
              ${p.marker} <span style="font-weight:bold;">Năm ${p.seriesName}:</span>
            </div>
            <div style="text-align:right;">
              <div style="font-weight:black;color:#1e293b;">${formatMoney(curVal, isCurrency)}</div>`;

          if (prevVal && prevVal > 0 && curVal > 0) {
            const growth = getGrowth(curVal, prevVal);
            const color = growth >= 0 ? "#10B981" : "#EF4444";
            const icon = growth >= 0 ? "▲" : "▼";
            res += `<div style="font-size:10px;color:${color};font-weight:bold;">${icon} ${Math.abs(growth)}% so với ${prevYear}</div>`;
          }

          res += `</div></div>`;
        });

        return res;
      },
    },
    series,
  };
};

export const getCategoryLineOption = (data, metricName, metricId = "") => {
  if (!data || !data.series) return getBaseChartOption();
  const { categories, months, series } = data;
  const isCurrency = metricId !== "serviceCount";

  const colors = DEFAULT_COLORS;

  return {
    color: colors,
    legend: {
      type: "scroll",
      bottom: 0,
      itemWidth: 10,
      itemHeight: 10,
      textStyle: { fontSize: 10, fontWeight: "bold", color: "#64748b" },
    },
    tooltip: {
      trigger: "axis",
      backgroundColor: "rgba(255, 255, 255, 0.98)",
      padding: [12, 16],
      extraCssText:
        "box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1); border-radius: 12px; border: none; min-width: 200px;",
      formatter: (params) => {
        if (!params || params.length === 0) return "";
        const isTransposed = months.length === 1;

        if (isTransposed) {
          const p = params[0];
          return `<div style="font-weight:800;margin-bottom:8px;color:#1e293b;font-size:14px;border-bottom:1px solid #f1f5f9;padding-bottom:8px;">${p.seriesName}</div>
                  <div style="display:flex;justify-content:space-between;gap:20px;align-items:center;">
                    <span style="font-size:12px;color:#475569;font-weight:600;">${getShortName(p.name)}</span>
                    <span style="font-weight:800;color:#1e293b;font-size:13px;font-family:monospace;">${formatMoney(p.value, isCurrency)}</span>
                  </div>`;
        }

        let res = `<div style="font-weight:800;margin-bottom:12px;color:#1e293b;font-size:14px;border-bottom:1px solid #f1f5f9;padding-bottom:10px;display:flex;justify-content:space-between;align-items:center;">
                    <span>${params[0].name}</span>
                    <span style="font-size:10px;background:#f1f5f9;padding:2px 6px;border-radius:4px;color:#64748b;">${metricName}</span>
                   </div>`;
        const sorted = [...params].sort((a, b) => b.value - a.value);
        sorted.forEach((p) => {
          res += `<div style="display:flex;justify-content:space-between;gap:40px;margin-bottom:6px;align-items:center;">
                    <div style="display:flex;align-items:center;gap:8px;">
                      <span style="display:inline-block;width:10px;height:10px;border-radius:3px;background:${p.color}"></span>
                      <span style="font-size:12px;color:#475569;font-weight:600;">${getShortName(p.seriesName)}</span>
                    </div>
                    <span style="font-weight:800;color:#1e293b;font-size:12px;font-family:monospace;">${formatMoney(p.value, isCurrency)}</span>
                  </div>`;
        });
        return res;
      },
    },
    grid: {
      show: true,
      borderColor: "#e2e8f0",
      borderWidth: 1,
      top: 40,
      bottom: months.length === 1 ? 95 : 85, // Extra space for labels if categories on X
      left: 10,
      right: 10,
      containLabel: true,
    },
    xAxis: {
      type: "category",
      data: months.length === 1 ? categories : months,
      boundaryGap: true,
      axisLabel: {
        fontSize: 10,
        color: "#64748b",
        fontWeight: "bold",
        margin: 15,
        rotate: months.length === 1 ? 35 : 0,
      },
      axisLine: { lineStyle: { color: "#e2e8f0" } },
      axisTick: { show: false },
      splitLine: {
        show: true,
        lineStyle: { color: "#f1f5f9", type: "dashed" },
      },
    },
    yAxis: {
      type: "value",
      axisLabel: {
        formatter: (v) => formatMoney(v, isCurrency),
        fontSize: 10,
        color: "#64748b",
        fontWeight: "bold",
        margin: 10,
      },
      splitLine: {
        show: true,
        lineStyle: { color: "#f1f5f9", type: "dashed" },
      },
    },
    series:
      months.length === 1
        ? [
            {
              name: months[0],
              type: categories.length === 1 ? "bar" : "line",
              smooth: 0.4,
              showSymbol: true,
              symbol: "circle",
              symbolSize: 10,
              barMaxWidth: 40,
              barWidth: "30%",
              itemStyle: {
                color: "#6366f1",
                borderWidth: 2,
                borderColor: "#fff",
                borderRadius: [4, 4, 0, 0],
              },
              data: categories.map((cat) => {
                const s = series.find((ser) => ser.name === cat);
                return s ? s.data[0] : 0;
              }),
              lineStyle: { width: 4, cap: "round" },
              areaStyle: {
                opacity: 0.1,
                color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                  { offset: 0, color: "#6366f1" },
                  { offset: 1, color: "rgba(255, 255, 255, 0)" },
                ]),
              },
            },
          ]
        : series.map((s, idx) => {
            const isSinglePoint = months.length === 1;
            const seriesColor = getCategoryColor(s.name, idx);
            return {
              name: getShortName(s.name),
              type: isSinglePoint ? "bar" : "line",
              smooth: 0.4,
              barMaxWidth: 30,
              barMinHeight: 5, // Improved balance for small data
              showSymbol: true,
              symbol: "circle",
              symbolSize: 10,
              itemStyle: {
                color: seriesColor,
                borderWidth: 2,
                borderColor: "#fff",
                borderRadius: [4, 4, 0, 0],
              },
              data: s.data,
              lineStyle: {
                width: 4,
                cap: "round",
                shadowBlur: 10,
                shadowColor: "rgba(0,0,0,0.1)",
                shadowOffsetY: 5,
              },
              areaStyle: {
                opacity: 0.1,
                color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                  { offset: 0, color: seriesColor },
                  { offset: 1, color: "rgba(255, 255, 255, 0)" },
                ]),
              },
              emphasis: {
                focus: "series",
                lineStyle: { width: 5 },
                itemStyle: { scale: 1.5 },
              },
            };
          }),
  };
};

export const getCategoryPieOption = (pieData, metricName, metricId = "") => {
  if (!pieData) return getBaseChartOption();

  const isCurrency = metricId !== "serviceCount";

  // 1. Data Processing: Sort by value (largest to smallest)
  const total = pieData.reduce((acc, curr) => acc + curr.value, 0);
  const data = [...pieData].sort((a, b) => b.value - a.value);

  return {
    color: data.map((item, idx) => getCategoryColor(item.name, idx)),
    tooltip: {
      trigger: "item",
      backgroundColor: "rgba(255, 255, 255, 0.98)",
      padding: [12, 16],
      borderRadius: 12,
      borderWidth: 0,
      extraCssText:
        "box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1); z-index: 100;",
      formatter: (p) => {
        return `<div style="font-weight:800;color:#1e293b;margin-bottom:8px;border-bottom:1px solid #f1f5f9;padding-bottom:6px;">${getShortName(p.name)}</div>
                <div style="display:flex;justify-content:space-between;gap:30px;margin-bottom:6px;">
                  <span style="color:#64748b;font-size:12px;">Giá trị:</span>
                  <span style="font-weight:800;color:#1e293b;">${formatMoney(p.value, isCurrency)}</span>
                </div>
                <div style="display:flex;justify-content:space-between;gap:30px;">
                  <span style="color:#64748b;font-size:12px;">Tỷ trọng:</span>
                  <span style="font-weight:900;color:${p.color};">${p.percent}%</span>
                </div>`;
      },
    },
    legend: {
      show: true,
      type: "scroll",
      orient: "vertical",
      top: "40%",
      left: "center", 
      icon: "circle",
      padding: [10, 0, 10, 0],
      itemWidth: 10,
      itemHeight: 10,
      itemGap: 10,
      formatter: (name) => {
        const item = data.find((d) => d.name === name);
        const percent = item ? ((item.value / total) * 100).toFixed(2) : 0;

        // Show RAW full numbers in millions for currency (as requested: 120.950912 style)
        let valueStr = "-";
        if (item && item.value !== 0) {
          const rawVal = isCurrency ? item.value / 1000000 : item.value;
          valueStr = rawVal.toLocaleString("en-US", {
            useGrouping: false,
            maximumFractionDigits: 6,
          });
        }
        const displayName = getShortName(name);
        return `${displayName.padEnd(12, " ")} : ${valueStr} (${percent}%)`;
      },
      textStyle: {
        fontSize: 10,
        fontWeight: "700",
        color: "#475569",
        fontFamily: "monospace",
      },
    },
    title: { show: false },
    series: [
      {
        name: metricName,
        type: "pie",
        radius: ["0%", "50%"],
        center: ["50%", "23%"],
        avoidLabelOverlap: true,
        itemStyle: {
          borderRadius: 8,
          borderColor: "#fff",
          borderWidth: 2,
        },
        data: data.map((item) => {
          const percent = (item.value / total) * 100;
          const isLarge = percent >= 8;
          return {
            ...item,
            label: {
              show: isLarge,
              position: "inside",
              formatter: "{d}%",
              fontSize: 10,
              fontWeight: "900",
              color: "#fff",
              textShadowBlur: 4,
              textShadowColor: "rgba(0,0,0,0.3)",
            },
            labelLine: { show: false },
          };
        }),
        emphasis: {
          scale: true,
          scaleSize: 10,
          itemStyle: { shadowBlur: 20, shadowColor: "rgba(0,0,0,0.15)" },
        },
      },
    ],
  };
};
