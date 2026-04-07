import * as xlsx from "xlsx";

/**
 * CONFIGURATION - Centralizing all Excel structure rules
 */
const EXCEL_CONFIGS = {
  PRODUCT_MASTER: {
    headerRow: 6, // Dòng 7
    requiredMarkers: ["mã hàng", "mặt hàng", "tiền có vat"],
    dataMapping: (row, source) => {
      const ma_hang = String(row[1] || "")
        .trim()
        .toLowerCase();
      const mat_hang = String(row[2] || "")
        .trim()
        .toLowerCase();

      if (!ma_hang) return null;

      // Filter: AD (index 29) is "hủy"
      const status = String(row[29] || "")
        .trim()
        .toLowerCase();
      if (status === "hủy" || status === "huy") return null;

      // Filter: N (index 13) contains "Thiết bị"
      const noteN = String(row[13] || "")
        .trim()
        .toLowerCase();
      if (noteN.includes("thiết bị") || noteN.includes("thiet bi")) return null;

      const cleanNum = (val) => {
        if (val === null || val === undefined || val === "") return 0;
        if (typeof val === "number") return val;

        let str = String(val).trim();
        // Check for minus signs (hyphen, en-dash, em-dash) and accounting format (parentheses)
        const isNegative =
          str.includes("-") ||
          str.includes("–") ||
          str.includes("—") ||
          (str.startsWith("(") && str.endsWith(")"));

        // Process VN format: dot for thousands, comma for decimals
        // Example: 1.234.567,89 -> 1234567.89
        if (str.includes(".") && str.includes(",")) {
          str = str.replace(/\./g, "").replace(/,/g, ".");
        } else if (str.includes(",")) {
          // If only comma, it could be thousands (US) or decimal (VN).
          // Heuristic: if exactly 3 digits after comma, it's thousands.
          const parts = str.split(",");
          if (parts.length === 2 && parts[1].length === 3) {
            str = str.replace(/,/g, "");
          } else {
            str = str.replace(/,/g, ".");
          }
        } else if (str.includes(".") && str.split(".").length > 2) {
          // "1.234.567" -> thousands
          str = str.replace(/\./g, "");
        }

        // Keep only digits and the first decimal dot
        const digits = str.replace(/[^\d.]/g, "");
        const num = parseFloat(digits) || 0;
        return isNegative ? -num : num;
      };

      // Map Hierarchy Code in AP (index 41) to Group Name
      const hCode = String(row[41] || "").trim();
      const hierarchyMap = {
        "118111710121": "CA",
        "118111810121": "CA",
        "118111710124": "CA",
        "118113310121": "BHXH",
        "118112210124": "HDDT",
        "118112210729": "HDDT",
        "118112410729": "HDDT",
        "118114310121": "vTracking",
        "118111910121": "CAM10(DTDV)",
        "118124010121": "Easybooks",
        "118125910121": "Tendoo",
        "118112510121": "vContract",
        "129120110806": "vContract",
        "118112010121": "Mysign",
      };

      const rawUser = String(row[27] || "Không rõ").trim();
      // Nhánh nv chỉ lấy trước dấu -
      const cleanUser = rawUser.includes("-")
        ? rawUser.split("-")[0].trim()
        : rawUser;

      const groupName = hierarchyMap[hCode];

      // Nếu không có trong map (tức là không thuộc danh mục hệ thống có sẵn) thì bỏ qua
      if (!groupName) return null;

      return {
        ma_hang,
        mat_hang,
        with_vat: cleanNum(row[10]), // Cột K
        without_vat: cleanNum(row[11]), // Cột L
        vat: cleanNum(row[12]), // Cột M
        source_type: source,
        nhan_vien: cleanUser, // Cột AB (đã xử lý cắt dấu -)
        product_group: groupName, // Cột AP (đã map sang tên dịch vụ)
      };
    },
  },
  SALES_DETAIL: {
    DEFAULT: {
      headerRow: 0, // Will be overridden or ignored
      requiredMarkers: [],
      parse: (row) => ({
        rawDate: null,
        rawUser: null,
        rawMa: "",
        rawMat: "",
      }),
    },
    CA: {
      headerRow: 10, // Dòng 11 (Mặc định cho Dealer)
      requiredMarkers: ["ngày", "nhân viên", "hòa mạng"],
      parse: (row) => {
        // Cột V (index 21) là loại yêu cầu / dịch vụ
        const type = String(row[21] || "")
          .trim()
          .toLowerCase();
        const isTargetType =
          type.includes("gia hạn") || type.includes("cấp mới");

        if (!isTargetType) {
          return { rawUser: "skip" };
        }

        const split = splitMaMat(row[22]); // Cột W (Mã - Mặt)
        return {
          rawDate: row[16], // Cột Q (Ngày đấu nối)
          rawUser: row[25], // Cột Z (Nhân viên đấu nối)
          rawMa: split.ma,
          rawMat: split.mat,
        };
      },
    },
    HDDT: {
      headerRow: 6, // Dòng 7
      requiredMarkers: ["ngày đấu nối", "nhân viên đấu nối", "tên hthm"],
      parse: (row) => ({
        rawDate: row[30], // Cột AE (Ngày đấu nối)
        rawUser: row[26], // Cột AA (Nhân viên đấu nối)
        rawMa: String(row[16] || "") // Cột Q (Mã HTHM)
          .trim()
          .toLowerCase(),
        rawMat: String(row[17] || "") // Cột R (Tên HTHM)
          .trim()
          .toLowerCase(),
      }),
    },
    vBHXH: {
      headerRow: 12, // Dòng 13
      requiredMarkers: ["nhân viên đấu nối", "ngày đấu nối", "hthm"],
      parse: (row) => {
        // Cột V (index 21) là loại dịch vụ
        const type = String(row[21] || "").trim();
        if (type !== "Gia hạn" && type !== "Cấp mới") {
          return { rawUser: "skip" };
        }

        const split = splitMaMat(row[15]); // Cột P (HTHM)
        return {
          rawDate: row[26], // Cột AA (Ngày đấu nối)
          rawUser: row[22], // Cột W (Nhân viên đấu nối)
          rawMa: split.ma,
          rawMat: split.mat,
        };
      },
    },
    MySign: {
      headerRow: 5, // Dòng 6
      requiredMarkers: [
        "ngày tạo thuê bao",
        "nhân viên đấu nối",
        "gói cước",
        "tên hiển thị khi đấu nối",
      ],
      parse: (row) => ({
        rawDate: row[23], // Cột X
        rawUser: row[26], // Cột AA
        rawMa: String(row[17] || "")
          .trim()
          .toLowerCase(), // Cột R
        rawMat: String(row[19] || "")
          .trim()
          .toLowerCase(), // Cột T
      }),
    },
    Tendoo: {
      headerRow: 0, // Dòng 1
      requiredMarkers: [
        "ma_nhan_vien_tu_van",
        "goi_dang_ky",
        "ngay_dang_ky_goi",
        "thanh_tien",
      ],
      parse: (row) => {
        // Cột AI (index 34) chỉ lấy "HNI"
        const tinh = String(row[34] || "")
          .trim()
          .toUpperCase();
        if (tinh !== "HNI") {
          return {
            rawDate: null,
            rawUser: "invalid_tinh",
            rawMa: null,
            rawMat: null,
          };
        }
        return {
          rawDate: row[1], // Cột B
          rawUser: row[7], // Cột H
          rawMa: String(row[9] || "")
            .trim()
            .toLowerCase(), // Cột J
          rawMat: String(row[9] || "")
            .trim()
            .toLowerCase(), // Cột J
          price:
            parseFloat(String(row[11] || 0).replace(/[^\d.–—.-]/g, "")) || 0, // Cột L (Including various dashes)
        };
      },
    },
    Easybooks: {
      headerRow: 5, // Dòng 6
      requiredMarkers: [
        "mã tỉnh",
        "gói cước",
        "nhân viên đấu nối",
        "ngày đấu nối",
      ],
      parse: (row) => {
        // Chỉ lấy những dòng nào mà cột C (index 2) là HNI
        const tinh = String(row[2] || "")
          .trim()
          .toUpperCase();
        if (tinh !== "HNI") {
          return {
            rawDate: null,
            rawUser: "invalid_tinh",
            rawMa: null,
            rawMat: null,
          };
        }
        return {
          rawDate: row[15], // Cột P
          rawUser: row[14], // Cột O
          rawMa: String(row[10] || "")
            .trim()
            .toLowerCase(), // Cột K
          rawMat: String(row[10] || "")
            .trim()
            .toLowerCase(), // Cột K (Ma = Mat)
        };
      },
    },
    "Internet Truyền hình": {
      headerRow: 6, // Dòng 7
      requiredMarkers: [
        "tỉnh/tp phát triển",
        "ngày đấu nối",
        "loại hòa mạng",
        "user đấu nối",
      ],
      parse: (row) => {
        // Chỉ lấy dòng có cột AL (index 37) là HNI
        const tinh = String(row[37] || "")
          .trim()
          .toUpperCase();
        if (tinh !== "HNI") {
          return {
            rawDate: null,
            rawUser: "invalid_tinh",
            rawMa: null,
            rawMat: null,
          };
        }
        const split = splitMaMat(row[24]); // Cột Y (Mã-Mặt hàng)
        return {
          rawDate: row[30], // Cột AE
          rawUser: row[45], // Cột AT
          rawMa: split.ma,
          rawMat: split.mat,
        };
      },
    },
    vContract: {
      headerRow: 5, // Dòng 6
      requiredMarkers: ["gói cước", "ngày đấu nối", "nhân viên"],
      parse: (row) => {
        const pValue = String(row[15] || "").trim();
        const split = splitMaMat(pValue);
        return {
          rawDate: row[21], // Cột V
          rawUser: row[7], // Cột H
          rawMa: split.ma,
          rawMat: split.mat || split.ma, // Nếu không có dấu gạch ngang, dùng chung giá trị
        };
      },
    },
    vTracking: {
      headerRow: 5, // Dòng 6
      requiredMarkers: ["gói cước", "ngày tạo thuê bao", "nhân viên"],
      parse: (row) => ({
        rawDate: row[20], // Cột U
        rawUser: row[25], // Cột Z
        rawMa: String(row[17] || "")
          .trim()
          .toLowerCase(), // Cột R
        rawMat: String(row[18] || "")
          .trim()
          .toLowerCase(), // Cột S
      }),
    },
    AM_General: {
      headerRow: 6, // Dòng 7
      requiredMarkers: [
        "mã hàng",
        "mặt hàng",
        "số lượng hạch toán",
        "product line",
      ],
      parse: (row, groupType) => {
        const marker = String(row[43] || "")
          .trim()
          .toLowerCase(); // Cột AR

        let isValid = false;
        if (marker === "") {
          isValid = true; // Cho phép nhập nếu cột AR để trống
        } else {
          if (groupType === "Tendoo" && marker === "pmqlbh_tendoo")
            isValid = true;
        }

        if (!isValid)
          return { rawDate: null, rawUser: "skip", rawMa: null, rawMat: null };

        return {
          rawDate: null, // Date selected from UI
          rawUser: "AM", // Default for these types if no specific column
          rawMa: String(row[1] || "")
            .trim()
            .toLowerCase(), // Cột B
          rawMat: String(row[2] || "")
            .trim()
            .toLowerCase(), // Cột C
          amount:
            parseFloat(String(row[4] || 0).replace(/[^\d.–—.-]/g, "")) || 0, // Cột E (Including various dashes)
        };
      },
    },
  },
};

/**
 * MAIN EXPORTED FUNCTIONS
 */

export async function processProductImportExcel(buffer, source = "dealer") {
  const { rows } = readExcel(buffer);
  const config = EXCEL_CONFIGS.PRODUCT_MASTER;

  validateHeader(
    rows,
    config.headerRow,
    config.requiredMarkers,
    "Danh mục Sản phẩm",
  );

  const items = rows
    .slice(config.headerRow + 1)
    .map((row) => config.dataMapping(row, source))
    .filter((p) => p !== null);

  console.log(`[Import] Found ${items.length} valid product items from ${rows.length} rows`);

  return {
    data: items,
    summary: {
      totalRows: rows.length - (config.headerRow + 1),
      invalidSkipped: rows.length - (config.headerRow + 1) - items.length,
    },
  };
}

export async function processSalesImportExcel(
  buffer,
  groupType,
  source = "dealer",
) {
  const sheets = readExcelAllSheets(buffer);

  const results = [];
  const skipReasons = {
    wrongMarker: 0,
    noMaHang: 0,
    invalidTinh: 0,
    emptyRow: 0,
  };
  let totalRowsChecked = 0;

  // Xử lý các nhóm AM có thể dùng chung cấu hình hoặc cấu hình mặc định nếu chưa định nghĩa
  let activeType = groupType === "E-Invoice" ? "HDDT" : groupType;
  let config =
    EXCEL_CONFIGS.SALES_DETAIL[activeType] || EXCEL_CONFIGS.SALES_DETAIL["CA"];

  for (const sheetData of sheets) {
    const { rows } = sheetData;
    const detectedIdx = detectHeaderIndex(rows, config.requiredMarkers);
    if (detectedIdx === -1) {
      // Bỏ qua sheet này nếu không tìm thấy header (mặc dù vẫn đếm số dòng tiềm năng)
      continue;
    }

    try {
      validateHeader(rows, detectedIdx, config.requiredMarkers, groupType);
    } catch (e) {
      continue; // Skip silently if validation fails for this sheet
    }

    totalRowsChecked += rows.length - (detectedIdx + 1);

    for (let i = detectedIdx + 1; i < rows.length; i++) {
      const row = rows[i];
      if (!row || row.length === 0) {
        skipReasons.emptyRow++;
        continue;
      }

      const isRowEmpty = !row.some(
        (cell) => cell !== "" && cell !== null && cell !== undefined,
      );
      if (isRowEmpty) {
        skipReasons.emptyRow++;
        continue;
      }

      const parsed = config.parse(row, groupType);
      if (parsed.rawUser === "skip") {
        skipReasons.wrongMarker++;
        continue;
      }
      if (parsed.rawUser === "invalid_tinh") {
        skipReasons.invalidTinh++;
        continue;
      }

      const { rawDate, rawUser, rawMa, rawMat, amount, price } = parsed;
      const { ngay, thang, nam } = parseExcelDate(rawDate);

      if (!rawMa || rawMa === "") {
        skipReasons.noMaHang++;
        continue;
      }

      results.push({
        ma_hang: rawMa,
        mat_hang: rawMat,
        ngay: ngay ? String(ngay).padStart(2, "0") : null,
        thang: thang ? String(thang).padStart(2, "0") : null,
        nam: nam,
        nhan_vien: String(rawUser || "Không rõ").trim(),
        product_group: groupType,
        amount: amount,
        price: price, // New field for direct product insertion
      });
    }
  }

  if (results.length === 0) {
    throw new Error(
      `File không có dữ liệu ${groupType} hợp lệ trên bất kỳ sheet nào.`,
    );
  }

  return {
    data: results,
    summary: {
      totalRows: totalRowsChecked,
      imported: results.length,
      skipped:
        skipReasons.wrongMarker +
        skipReasons.invalidTinh +
        skipReasons.noMaHang +
        skipReasons.emptyRow,
      reasons: skipReasons,
    },
  };
}

/**
 * UTILS & HELPERS
 */

function readExcelAllSheets(buffer) {
  const wb = xlsx.read(buffer, { type: "buffer" });
  if (!wb.SheetNames || wb.SheetNames.length === 0)
    throw new Error("File Excel không có sheet nào");

  return wb.SheetNames.filter(
    (name) =>
      !name.toLowerCase().includes("tong hop") &&
      !name.toLowerCase().includes("summary"),
  ).map((name) => ({
    name,
    rows: xlsx.utils.sheet_to_json(wb.Sheets[name], { header: 1, defval: "" }),
  }));
}

function readExcel(buffer) {
  const wb = xlsx.read(buffer, { type: "buffer" });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const rows = xlsx.utils.sheet_to_json(sheet, { header: 1, defval: "" });
  return { rows };
}

function validateHeader(rows, index, markers, label) {
  if (!rows[index])
    throw new Error(
      `File trống hoặc không tìm thấy dòng tiêu đề tại dòng ${index + 1}`,
    );

  // Nếu markers trống (cho các nhóm mới của AM chưa định nghĩa signature), thì bỏ qua verify
  if (!markers || markers.length === 0) return;

  const header = rows[index].map((c) =>
    String(c || "")
      .toLowerCase()
      .trim(),
  );
  const isMatched = markers.every((m) =>
    header.some((cell) => cell.includes(m)),
  );

  if (!isMatched) {
    throw new Error(
      `File không đúng định dạng cho ${label} (Kiểm tra lại dòng tiêu đề tại dòng ${index + 1})`,
    );
  }
}

function splitMaMat(input) {
  if (!input) return { ma: "", mat: "" };
  const str = String(input).trim();
  const dashIdx = str.indexOf("-");
  if (dashIdx !== -1) {
    return {
      ma: str.substring(0, dashIdx).trim().toLowerCase(),
      mat: str
        .substring(dashIdx + 1)
        .trim()
        .toLowerCase(),
    };
  }
  return { ma: str.toLowerCase(), mat: "" };
}

function parseExcelDate(val) {
  if (!val) return { ngay: null, thang: null, nam: null };

  if (typeof val === "number") {
    // Excel number format (e.g., 46091)
    const date = new Date(Math.round((val - 25569) * 86400 * 1000));
    return {
      ngay: date.getUTCDate(),
      thang: date.getUTCMonth() + 1,
      nam: date.getUTCFullYear(),
    };
  }

  let rawStr = String(val).trim();
  if (!rawStr) return { ngay: null, thang: null, nam: null };

  // Xử lý định dạng ngày có giờ (ví dụ: 09/03/2026 15:40:06)
  if (rawStr.includes(" ") && (rawStr.includes("/") || rawStr.includes("-"))) {
    rawStr = rawStr.split(" ")[0];
  }

  // Ưu tiên parse thủ công định dạng DD/MM/YYYY (Việt Nam)
  const parts = rawStr.split(/[\/\.-]/);
  if (parts.length >= 3) {
    let year = parseInt(parts[0].length === 4 ? parts[0] : parts[2]);
    let month = parseInt(parts[1]);
    let day = parseInt(parts[0].length === 4 ? parts[2] : parts[0]);

    // Heuristic: Nếu tháng > 12 -> Khả năng cao là định dạng MM/DD/YYYY
    if (month > 12) {
      if (day <= 12) {
        month = day;
        day = parseInt(parts[1]);
      }
    }

    if (month >= 1 && month <= 12 && year > 1900) {
      return { ngay: day, thang: month, nam: year };
    }
  }

  // Fallback 1: Thử parse chuẩn JS (handles "March 3, 2026", ISO, etc.)
  const d = new Date(val);
  if (!isNaN(d.getTime()) && d.getFullYear() > 1970) {
    return { ngay: d.getDate(), thang: d.getMonth() + 1, nam: d.getFullYear() };
  }

  // Fallback 2: Thử parse MM/YYYY
  if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
    return { thang: parseInt(parts[0]), nam: parseInt(parts[1]) };
  }

  return { ngay: null, thang: null, nam: null };
}

/**
 * LEGACY EXPORTS (Used by other controllers)
 */
export async function processMasterExcel(buffer) {
  return processProductImportExcel(buffer);
}

const MARKERS = {
  SALES_DATA: [
    "tháng",
    "năm",
    "hình thức hòa mạng",
    "nhân viên đấu nối",
    "mã hthm",
    "tên hthm",
    "ngày đấu nối",
    "hthm",
  ],
};

function detectHeaderIndex(rows, markers) {
  for (let i = 0; i < Math.min(rows.length, 30); i++) {
    const rowData = rows[i].map((c) =>
      String(c || "")
        .toLowerCase()
        .trim(),
    );
    const matchCount = rowData.filter((cell) =>
      markers.some((m) => cell.includes(m)),
    ).length;
    if (matchCount >= 2) return i;
  }
  return -1;
}

function normalizeDate(rawDate) {
  return parseExcelDate(rawDate);
}

export async function processSalesExcel(buffer, filename) {
  const wb = xlsx.read(buffer, { type: "buffer" });
  let allRecords = [];

  wb.SheetNames.forEach((sheetName) => {
    if (sheetName.includes("TONGHOP")) return;
    const worksheet = wb.Sheets[sheetName];
    const rows = xlsx.utils.sheet_to_json(worksheet, { header: 1, defval: "" });
    const headerIdx = detectHeaderIndex(rows, MARKERS.SALES_DATA);
    if (headerIdx === -1 && wb.SheetNames.length > 1) return;

    const data = xlsx.utils.sheet_to_json(worksheet, {
      range: headerIdx === -1 ? 0 : headerIdx,
    });

    data.forEach((s) => {
      const hthm = s["HTHM"] || "";
      const vParts = String(hthm).split(/\s*[-–—]\s*/);
      const hddtMa = String(s["MÃ HTHM"] || "")
        .trim()
        .toLowerCase();
      const dtHthm = s["HÌNH THỨC HÒA MẠNG"] || "";
      const dtParts = String(dtHthm).split(/\s*[-–—]\s*/);

      const dateStr = s["NGÀY ĐẤU NỐI"] || s["Ngày đấu nối"];
      let { thang, nam } = normalizeDate(dateStr);
      if (!thang) {
        thang = parseInt(s["Tháng"] || s["THÁNG"]);
        nam = parseInt(s["Năm"] || s["NĂM"]);
      }

      const ma = (vParts[0] || hddtMa || dtParts[0] || "").trim().toLowerCase();
      const mat = (vParts[1] || s["TÊN HTHM"] || dtParts[1] || "")
        .trim()
        .toLowerCase();

      if (ma) {
        allRecords.push({
          ma_hang: ma,
          mat_hang: mat,
          thang: String(thang).padStart(2, "0"),
          nam,
          nhan_vien:
            s["NHÂN VIÊN ĐẤU NỐI"] || s["Nhân viên đấu nối"] || "Không rõ",
        });
      }
    });
  });

  return allRecords;
}
