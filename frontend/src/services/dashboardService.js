const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:3000/api";

export async function fetchDashboardData(params) {
  const query = new URLSearchParams(params).toString();
  const response = await fetch(`${API_BASE}/dashboard?${query}`);
  if (!response.ok) throw new Error("Lỗi tải dữ liệu từ Server.");
  return await response.json();
}

export async function fetchSalesData(params) {
  const query = new URLSearchParams(params).toString();
  const response = await fetch(`${API_BASE}/sales?${query}`);
  if (!response.ok) throw new Error("Lỗi tải danh sách Sales.");
  return await response.json();
}
