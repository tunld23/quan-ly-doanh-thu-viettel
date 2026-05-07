import { getDb } from "../config/db.js";
import { TENDOO_RULES, getDefaultTendooRule } from "./tendooRules.js";

async function calculateMysignSubscribers(db) {
  // 1. Load VAS price map: packageName → price
  const vasRes = await db
    .request()
    .query("SELECT package_name, price FROM mysign_vas_prices");
  const vasMap = new Map();
  for (const r of vasRes.recordset) {
    vasMap.set(String(r.package_name).trim().toLowerCase(), r.price || 0);
  }

  // 2. Load expired subscribers set: cccd
  const expiredRes = await db
    .request()
    .query("SELECT cccd FROM mysign_expired_subscribers");
  const expiredSet = new Set();
  for (const r of expiredRes.recordset) {
    expiredSet.add(String(r.cccd).trim());
  }

  // 3. Load all "Mysign Gia Hạn Mới" rows & "Mysign Gia Hạn Thuê Bao" rows
  const newRowsRes = await db.request().query(`
    SELECT tr_year, tr_month, tr_day, nhan_vien, source_type, extra_data, ma_hang
    FROM detail WHERE product_group = N'Mysign Gia Hạn Mới'
  `);
  const renewalRowsRes = await db.request().query(`
    SELECT tr_year, tr_month, tr_day, nhan_vien, source_type, extra_data
    FROM detail WHERE product_group = N'Mysign Gia Hạn Thuê Bao'
  `);

  // 4. Build renewal lookup: soThueBao (col AV) → VAS price from that row
  const renewalSoThueBaoMap = new Map(); // soThueBao → vasPrice
  const parsedRenewalRows = [];
  // Dedup set theo mã thuê bao (cột AW) riêng cho sheet Gia Hạn Thuê Bao
  const renewalMaThueBaoSeen = new Set();
  for (const row of renewalRowsRes.recordset) {
    let extra = {};
    try {
      extra = JSON.parse(row.extra_data || "{}");
    } catch (e) {}
    const packageName = String(extra.packageName || "")
      .trim()
      .toLowerCase();
    const thanhTien = Number(extra.thanhTien) || 0;
    const soThueBao = String(extra.soThueBao || "").trim();
    const cccd = String(extra.cccd || "").trim();
    const nvDauNoi = String(extra.nhanVienDauNoi || "")
      .trim()
      .toUpperCase();
    const maThueBao = String(extra.maThueBao || "").trim();
    const loaiYeuCau = String(extra.loaiYeuCau || "").trim();

    // Filter nhân viên đấu nối: chỉ lấy SME_HNI cho sheet Gia Hạn Thuê Bao (Cột AG)
    if (!nvDauNoi.includes("SME_HNI")) continue;

    // Filter cột AB (loại yêu cầu): bỏ qua "Chấm dứt thuê bao SME"
    if (loaiYeuCau.toLowerCase().includes("chấm dứt")) continue;

    // Lấy tiền từ cột BA. Nếu rỗng/bằng 0 thì check danh sách gói vas (AZ) tra bảng giá.
    let currentPrice = Number(extra.soTienGiaoDich) || 0;
    if (currentPrice <= 0 && packageName) {
      const lowerPkgName = packageName.trim().toLowerCase();
      if (vasMap.has(lowerPkgName)) {
        currentPrice = vasMap.get(lowerPkgName);
      } else if (packageName.includes("|")) {
        const parts = packageName.split("|").map((p) => p.trim().toLowerCase());
        for (const p of parts) {
          currentPrice += vasMap.get(p) || 0;
        }
      }
    }
    const vasPrice = currentPrice;

    // Store for renewal soThueBao → vasPrice lookup
    if (soThueBao) {
      renewalSoThueBaoMap.set(soThueBao, vasPrice);
    }

    parsedRenewalRows.push({
      tr_year: row.tr_year,
      tr_month: row.tr_month,
      tr_day: row.tr_day,
      nhan_vien: row.nhan_vien,
      source_type: row.source_type,
      vasPrice,
      thanhTien,
      cccd,
      soThueBao,
      maThueBao,
      packageName,
    });
  }

  // ─── Maps for counting ───
  const newStaffCounts = new Map(); // key → { high: number, lowCount: number, cbnvCount: number }
  const renewalStaffCounts = new Map(); // key → { high: number, lowCount: number, cbnvCount: number }

  // ─── Process "Mysign Gia Hạn Mới" (New subscribers) ───
  const newSoThueBaoSet = new Set();
  // Dedup set theo mã thuê bao (cột AW) riêng cho sheet Gia Hạn Mới
  const newMaThueBaoSeen = new Set();

  for (const row of newRowsRes.recordset) {
    let extra = {};
    try {
      extra = JSON.parse(row.extra_data || "{}");
    } catch (e) {}

    // Rule đặc biệt cho CBNV: tính là 1 thuê bao, không cần tiền, không check expired, không check AN
    const ma_hang = String(row.ma_hang || "").toLowerCase();
    if (ma_hang.includes("cbnv")) {
      const cbnvKey = `${row.tr_year}|${row.tr_month}|${row.nhan_vien}|${row.source_type}`;
      if (!newStaffCounts.has(cbnvKey)) {
        newStaffCounts.set(cbnvKey, {
          high: 0,
          lowCount: 0,
          cbnvCount: 0,
          meta: row,
        });
      }
      newStaffCounts.get(cbnvKey).cbnvCount += 1;
      continue;
    }

    const loaiYeuCau = String(extra.loaiYeuCau || "").trim();
    if (loaiYeuCau.toLowerCase().includes("chấm dứt")) continue;

    // Filter nhân viên đấu nối: chỉ lấy HNI hoặc H004 cho sheet Gia Hạn Mới (Cột AN)
    const nvDauNoi = String(extra.nhanVienDauNoi || "")
      .trim()
      .toUpperCase();
    if (!nvDauNoi.includes("HNI") && !nvDauNoi.includes("H004")) continue;

    const thanhTien = Number(extra.thanhTien) || 0;
    const soThueBao = String(extra.soThueBao || "").trim(); // col BB
    const cccd = String(extra.cccd || "").trim(); // col AK
    const maThueBao = String(extra.maThueBao || "").trim(); // col AW — dedup

    if (soThueBao) {
      newSoThueBaoSet.add(soThueBao);
    }

    // Filter: only count if CCCD is NOT in expired list
    let isRenewalByExpiry = false;
    if (cccd && expiredSet.has(cccd)) {
      isRenewalByExpiry = true;
    }

    // Cross-sheet matching: look up soThueBao (col BB) in renewal's soThueBao (col AV)
    let renewalVasPrice = 0;
    if (soThueBao && renewalSoThueBaoMap.has(soThueBao)) {
      renewalVasPrice = renewalSoThueBaoMap.get(soThueBao);
    } else {
      // "nếu tìm không thấy thì lấy luôn tiền ở thành tiền ấy" → use thanhTien
      renewalVasPrice = thanhTien;
    }

    // Take the larger of the two prices
    const finalPrice = Math.max(renewalVasPrice, thanhTien);

    // Xác định map đích: Nếu trùng CCCD hết hạn thì tính sang Renewal
    const targetMap = isRenewalByExpiry ? renewalStaffCounts : newStaffCounts;
    const targetKey = `${row.tr_year}|${row.tr_month}|${row.nhan_vien}|${row.source_type}`;

    if (!targetMap.has(targetKey)) {
      targetMap.set(targetKey, {
        high: 0,
        lowCount: 0,
        cbnvCount: 0,
        meta: row,
      });
    }
    const targetEntry = targetMap.get(targetKey);

    // Dedup theo mã thuê bao (cột AW): nếu đã đếm rồi thì bỏ qua
    const dedupeKey = `${isRenewalByExpiry ? "renewal" : "new"}|${maThueBao}`;
    if (maThueBao && newMaThueBaoSeen.has(dedupeKey)) continue;
    if (maThueBao) newMaThueBaoSeen.add(dedupeKey);

    if (finalPrice >= 49000) {
      targetEntry.high += 1;
    } else {
      targetEntry.lowCount += 1;
    }
  }

  // Khử trùng và lấy giá cao nhất cho mỗi mã thuê bao trong sheet Gia hạn
  const renewalFinalData = new Map(); // maThueBao -> { maxPrice, isCbnv, meta }

  for (const pr of parsedRenewalRows) {
    // Nếu thuê bao đã có ở bảng Mới thì bỏ qua hoàn toàn ở bảng Gia hạn
    if (pr.soThueBao && newSoThueBaoSet.has(pr.soThueBao)) {
      continue;
    }

    const maThueBao = pr.maThueBao || `no-ma-${Math.random()}`;
    const isCbnv = (pr.packageName || "").toLowerCase().includes("cbnv");
    const currentPrice = pr.vasPrice; // Đây là giá từ cột BA

    if (!renewalFinalData.has(maThueBao)) {
      renewalFinalData.set(maThueBao, {
        maxPrice: currentPrice,
        isCbnv,
        meta: pr,
      });
    } else {
      const existing = renewalFinalData.get(maThueBao);
      existing.maxPrice = Math.max(existing.maxPrice, currentPrice);
      if (isCbnv) existing.isCbnv = true;
    }
  }

  // Sau khi đã gom nhóm và lấy được giá cao nhất cho mỗi mã thuê bao, tiến hành phân loại
  for (const [ma, data] of renewalFinalData) {
    const pr = data.meta;
    const finalPrice = data.maxPrice;

    const key = `${pr.tr_year}|${pr.tr_month}|${pr.nhan_vien}|${pr.source_type}`;
    if (!renewalStaffCounts.has(key)) {
      renewalStaffCounts.set(key, {
        high: 0,
        lowCount: 0,
        cbnvCount: 0,
        meta: pr,
      });
    }
    const entry = renewalStaffCounts.get(key);

    if (data.isCbnv) {
      entry.high += 1; // CBNV tính tương đương High (1 thuê bao)
    } else if (finalPrice >= 49000) {
      entry.high += 1;
    } else {
      entry.lowCount += 1;
    }
  }

  // ─── Merge & Insert combined "Mysign" entries ───
  const combined = new Map(); // key → total count

  const addCounts = (staffCounts) => {
    for (const [key, { high, lowCount, cbnvCount = 0, meta }] of staffCounts) {
      const subsFromLow = Math.floor(lowCount / 10);
      const totalSubs = high + subsFromLow + cbnvCount;
      if (totalSubs <= 0) continue;

      if (!combined.has(key)) {
        combined.set(key, { count: 0, meta });
      }
      combined.get(key).count += totalSubs;
    }
  };

  addCounts(newStaffCounts);
  addCounts(renewalStaffCounts);

  // Delete old simple-counted Mysign sub-group rows
  await db.request().query(`
    DELETE FROM staff_service_count 
    WHERE product_group IN (N'Mysign Gia Hạn Mới', N'Mysign Gia Hạn Thuê Bao', N'Mysign', N'MySign')
  `);

  // Insert new calculated rows
  for (const [key, { count, meta }] of combined) {
    await db
      .request()
      .input("yr", meta.tr_year)
      .input("mo", meta.tr_month)
      .input("dy", "01") // Aggregate at start of month
      .input("nv", meta.nhan_vien)
      .input("src", meta.source_type)
      .input("cnt", count).query(`
        INSERT INTO staff_service_count (tr_year, tr_month, tr_day, nhan_vien, product_group, source_type, service_count)
        VALUES (@yr, @mo, @dy, @nv, N'Mysign', @src, @cnt)
      `);
  }

  const totalNew = [...newStaffCounts.values()].reduce(
    (s, e) => s + e.high + Math.floor(e.lowCount / 10) + (e.cbnvCount || 0),
    0,
  );
  const totalRenewal = [...renewalStaffCounts.values()].reduce(
    (s, e) => s + e.high + Math.floor(e.lowCount / 10) + (e.cbnvCount || 0),
    0,
  );
  console.log(
    `Mysign calculation done: New=${totalNew}, Renewal=${totalRenewal}, Total=${totalNew + totalRenewal}`,
  );
}

async function calculateServiceSubscribersWithMstLogic(db, productGroup) {
  // 1. Load Used MSTs
  const usedMstRes = await db
    .request()
    .query(
      "IF OBJECT_ID('ca_used_mst', 'U') IS NOT NULL SELECT mst FROM ca_used_mst",
    );
  const usedMstSet = new Set();
  if (usedMstRes.recordset) {
    usedMstRes.recordset.forEach((r) => usedMstSet.add(String(r.mst).trim()));
  }

  // 2. Load New Enterprises (MTL)
  const newEntRes = await db
    .request()
    .query(
      "IF OBJECT_ID('ca_new_enterprise', 'U') IS NOT NULL SELECT mst FROM ca_new_enterprise",
    );
  const newEntSet = new Set();
  if (newEntRes.recordset) {
    newEntRes.recordset.forEach((r) => newEntSet.add(String(r.mst).trim()));
  }

  // 3. Load Product Prices (as backup)
  const pPriceRes = await db.request().input("group", productGroup).query(`
      SELECT ma_hang, MAX(ISNULL(without_vat, 0)) as max_price 
      FROM product 
      WHERE product_group = @group
      GROUP BY ma_hang
    `);

  const productPriceMap = new Map();
  if (pPriceRes.recordset) {
    pPriceRes.recordset.forEach((r) => {
      productPriceMap.set(String(r.ma_hang).trim().toLowerCase(), r.max_price);
    });
  }

  // 4. Load Detail rows
  const detailRowsRes = await db.request().input("group", productGroup).query(`
    SELECT tr_year, tr_month, nhan_vien, source_type, extra_data, ma_hang
    FROM detail WHERE product_group = @group
  `);

  const staffCounts = new Map(); // key -> count

  for (const row of detailRowsRes.recordset) {
    let extra = {};
    try {
      extra = JSON.parse(row.extra_data || "{}");
    } catch (e) {}

    const mst = String(extra.mst || "").trim();
    let thanhTien = extra.thanhTien;

    // Nếu cột tiền trống (null), lấy giá từ danh mục product làm dự phòng
    if (thanhTien === null || thanhTien === undefined) {
      const maHang = String(row.ma_hang || "")
        .trim()
        .toLowerCase();
      thanhTien = productPriceMap.get(maHang) || 0;
    }

    // Logic:
    // - MST không trùng bảng MST đã dùng
    // - MST phải thuộc bảng DN MTL
    // - Thành tiền > 0 (sau khi đã check backup từ product)
    const op1 = !usedMstSet.has(mst);
    const op2 = newEntSet.has(mst);
    const op3 = thanhTien > 0;

    if (op1 && op2 && op3) {
      const key = `${row.tr_year}|${row.tr_month}|${row.nhan_vien}|${row.source_type}`;
      staffCounts.set(key, (staffCounts.get(key) || 0) + 1);
    }
  }

  // 4. Delete existing counts and insert new ones
  await db
    .request()
    .input("group", productGroup)
    .query("DELETE FROM staff_service_count WHERE product_group = @group");

  for (const [key, count] of staffCounts) {
    const [yr, mo, nv, src] = key.split("|");
    await db
      .request()
      .input("yr", yr)
      .input("mo", mo)
      .input("nv", nv)
      .input("src", src)
      .input("group", productGroup)
      .input("cnt", count).query(`
        INSERT INTO staff_service_count (tr_year, tr_month, tr_day, nhan_vien, product_group, source_type, service_count)
        VALUES (@yr, @mo, '01', @nv, @group, @src, @cnt)
      `);
  }
}

export const updateSummaryReport = async () => {
  const db = await getDb();

  await db.request().query(`
    IF OBJECT_ID('summary_report', 'U') IS NULL
    BEGIN
      CREATE TABLE summary_report (
        tr_year INT,
        tr_month NVARCHAR(2),
        tr_day NVARCHAR(2),
        nhan_vien NVARCHAR(255),
        product_group NVARCHAR(255),
        source_type NVARCHAR(50),
        total_amount FLOAT
      );
    END
  `);

  await db.request().query(`
    TRUNCATE TABLE summary_report;
    TRUNCATE TABLE staff_service_count;
    
    INSERT INTO staff_service_count (tr_year, tr_month, tr_day, nhan_vien, product_group, source_type, service_count)
    SELECT 
      tr_year, tr_month, tr_day, nhan_vien, product_group, source_type,
      SUM(ISNULL(amount, 1)) as service_count
    FROM detail
    WHERE ISNULL(product_group, '') NOT IN ('Tendoo', 'Mysign Gia Hạn Mới', 'Mysign Gia Hạn Thuê Bao', 'CA', 'HDDT', 'E-Invoice', 'vBHXH')
    GROUP BY tr_year, tr_month, tr_day, nhan_vien, product_group, source_type;

    -- Normalize: đồng bộ tên cũ "MySign" hoặc các nhánh con → "Mysign" cho nhất quán
    UPDATE staff_service_count 
    SET product_group = N'Mysign' 
    WHERE product_group IN (N'MySign', N'Mysign Gia Hạn Mới', N'Mysign Gia Hạn Thuê Bao');

    -- Normalize Targets: gộp các chỉ tiêu của nhánh con vào "Mysign"
    UPDATE targets
    SET product_group = N'Mysign'
    WHERE product_group IN (N'MySign', N'Mysign Gia Hạn Mới', N'Mysign Gia Hạn Thuê Bao');
  `);

  // ─── Mysign: Advanced subscriber counting ───
  await calculateMysignSubscribers(db);

  // ─── CA: Advanced subscriber counting ───
  await calculateServiceSubscribersWithMstLogic(db, "CA");

  // ─── HDDT: Advanced subscriber counting ───
  await calculateServiceSubscribersWithMstLogic(db, "HDDT");

  // ─── vBHXH: Advanced subscriber counting ───
  await calculateServiceSubscribersWithMstLogic(db, "vBHXH");

  // ─── Tendoo Rules ───
  const monthsRes = await db.request().query(`
    SELECT DISTINCT tr_year, tr_month 
    FROM detail 
    WHERE product_group = 'Tendoo'
  `);

  for (const row of monthsRes.recordset) {
    const year = row.tr_year;
    const month = String(row.tr_month).padStart(2, "0");
    const key = `${year}-${month}`;

    const ruleFn = TENDOO_RULES[key] || getDefaultTendooRule;
    if (ruleFn) {
      const sqlStr = ruleFn(year, month);
      await db.request().query(`
         INSERT INTO staff_service_count (tr_year, tr_month, tr_day, nhan_vien, product_group, source_type, service_count)
         ${sqlStr}
       `);
    }
  }

  await db.request().query(`
    INSERT INTO summary_report (tr_year, tr_month, tr_day, nhan_vien, product_group, source_type, total_amount)
    SELECT 
      t.tr_year, t.tr_month, t.tr_day, t.nhan_vien, t.product_group, t.source_type,
      SUM(t.revenue) as total_amount
    FROM (
      SELECT 
        tr_year, tr_month, tr_day, nhan_vien, product_group, source_type,
        ISNULL(without_vat, 0) as revenue
      FROM product
      UNION ALL
      SELECT 
        tr_year, tr_month, tr_day, nhan_vien, product_group, 
        ISNULL(source_type, 'manual') as source_type,
        ISNULL(adj_amount, 0) as revenue
      FROM adjustments
    ) t
    GROUP BY t.tr_year, t.tr_month, t.tr_day, t.nhan_vien, t.product_group, t.source_type;

    -- Normalize Summary Report: gộp doanh thu các nhánh con vào "Mysign"
    UPDATE summary_report
    SET product_group = N'Mysign'
    WHERE product_group IN (N'MySign', N'Mysign Gia Hạn Mới', N'Mysign Gia Hạn Thuê Bao');
  `);
};
