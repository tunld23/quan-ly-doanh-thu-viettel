export const TENDOO_RULES = {
  "2026-03": (year, month) => `
    SELECT 
      tr_year, tr_month, tr_day, nhan_vien, product_group, source_type, SUM(service_count) as service_count
    FROM (
        -- Nhóm 1: Gia hạn lần đầu
        SELECT tr_year, tr_month, tr_day, nhan_vien, product_group, source_type, COUNT(*) as service_count
        FROM detail
        WHERE product_group = 'Tendoo' AND UPPER(nhan_vien) LIKE '%HNI%'
          AND tr_year = ${year} AND tr_month = '${month}'
          AND JSON_VALUE(extra_data, '$.gia_han_lan_dau') = N'Gia hạn lần đầu từ gói miễn phí'
          AND CAST(JSON_VALUE(extra_data, '$.price') AS FLOAT) >= 160000
          AND (JSON_VALUE(extra_data, '$.loai_tac_dong') IS NULL OR JSON_VALUE(extra_data, '$.loai_tac_dong') <> N'Bán mới')
        GROUP BY tr_year, tr_month, tr_day, nhan_vien, product_group, source_type
        
        UNION ALL
        
        -- Nhóm 2: Bán mới
        SELECT tr_year, tr_month, tr_day, nhan_vien, product_group, source_type, COUNT(*) as service_count
        FROM detail
        WHERE product_group = 'Tendoo' AND UPPER(nhan_vien) LIKE '%HNI%'
          AND tr_year = ${year} AND tr_month = '${month}'
          AND JSON_VALUE(extra_data, '$.loai_tac_dong') = N'Bán mới'
          AND CAST(JSON_VALUE(extra_data, '$.price') AS FLOAT) >= 160000
        GROUP BY tr_year, tr_month, tr_day, nhan_vien, product_group, source_type
        
        UNION ALL
        
        -- Nhóm 3: Gia hạn n+2
        SELECT t.tr_year, t.tr_month, t.tr_day, t.nhan_vien, t.product_group, t.source_type, COUNT(*) as service_count
        FROM (
            SELECT d.tr_year, d.tr_month, d.tr_day, d.nhan_vien, d.product_group, d.source_type,
                   JSON_VALUE(d.extra_data, '$.loai_tac_dong') AS loai_tac_dong,
                   JSON_VALUE(d.extra_data, '$.gia_han_lan_dau') AS gia_han_lan_dau,
                   JSON_VALUE(d.extra_data, '$.shop_id') AS shop_id,
                   CAST(JSON_VALUE(d.extra_data, '$.price') AS FLOAT) AS extra_price,
                   ROW_NUMBER() OVER(
                       PARTITION BY JSON_VALUE(d.extra_data, '$.shop_id')
                       ORDER BY d.sort_key ASC
                   ) as flow_rn
            FROM detail d
            WHERE d.product_group = 'Tendoo' AND UPPER(d.nhan_vien) LIKE '%HNI%'
              AND d.tr_year = ${year} AND d.tr_month = '${month}'
              AND JSON_VALUE(d.extra_data, '$.shop_id') IS NOT NULL
        ) t
        JOIN (
            SELECT DISTINCT id_cua_hang FROM tendoo_expired_ids
        ) e ON t.shop_id = e.id_cua_hang
        WHERE t.loai_tac_dong = N'Gia hạn'
          AND t.loai_tac_dong <> N'Bán mới'
          AND CAST(t.extra_price AS FLOAT) >= 160000 
          AND t.flow_rn = 1
          AND NOT (
              t.loai_tac_dong = N'Gia hạn' 
              AND CAST(t.extra_price AS FLOAT) >= 160000 
              AND t.gia_han_lan_dau = N'Gia hạn lần đầu từ gói miễn phí'
          )
        GROUP BY t.tr_year, t.tr_month, t.tr_day, t.nhan_vien, t.product_group, t.source_type
    ) TendooGroups
    GROUP BY tr_year, tr_month, tr_day, nhan_vien, product_group, source_type
  `,
  "2026-04": (year, month) => `
    SELECT 
      tr_year, tr_month, tr_day, nhan_vien, product_group, source_type, SUM(service_count) as service_count
    FROM (
        -- Nhóm 1: Tổng thuê bao có phí trên 1 năm
        SELECT tr_year, tr_month, tr_day, nhan_vien, product_group, source_type, COUNT(*) as service_count
        FROM detail
        WHERE product_group = 'Tendoo' AND UPPER(nhan_vien) LIKE '%HNI%'
          AND tr_year = ${year} AND tr_month = '${month}'
          AND CAST(JSON_VALUE(extra_data, '$.price') AS FLOAT) >= 150000
          -- TODO: Các logic có dấu "..." của Nhóm 1
        GROUP BY tr_year, tr_month, tr_day, nhan_vien, product_group, source_type
        
        UNION ALL
        
        -- Nhóm 2: Ghi nhận thuê bao gia hạn lần đầu từ gói miễn phí
        SELECT tr_year, tr_month, tr_day, nhan_vien, product_group, source_type, COUNT(*) as service_count
        FROM detail
        WHERE product_group = 'Tendoo' AND UPPER(nhan_vien) LIKE '%HNI%'
          AND tr_year = ${year} AND tr_month = '${month}'
          AND JSON_VALUE(extra_data, '$.loai_tac_dong') = N'Bán mới'
          AND CAST(JSON_VALUE(extra_data, '$.price') AS FLOAT) >= 150000
          AND JSON_VALUE(extra_data, '$.gia_han_lan_dau') = N'Gia hạn lần đầu từ gói miễn phí'
          -- TODO: Các logic có dấu "..." của Nhóm 2
        GROUP BY tr_year, tr_month, tr_day, nhan_vien, product_group, source_type
        
        UNION ALL

        -- Nhóm 3: Ghi nhận thuê bao bán mới từ một năm 
        SELECT tr_year, tr_month, tr_day, nhan_vien, product_group, source_type, COUNT(*) as service_count
        FROM detail
        WHERE product_group = 'Tendoo' AND UPPER(nhan_vien) LIKE '%HNI%'
          AND tr_year = ${year} AND tr_month = '${month}'
          AND JSON_VALUE(extra_data, '$.loai_tac_dong') = N'Bán mới'
          AND CAST(JSON_VALUE(extra_data, '$.price') AS FLOAT) >= 150000
          -- TODO: Các logic có dấu "..." của Nhóm 3
        GROUP BY tr_year, tr_month, tr_day, nhan_vien, product_group, source_type
        
        UNION ALL

        -- Nhóm 4: Ghi nhận gia hạn hết tháng 6/2026 trở về trước
        SELECT tr_year, tr_month, tr_day, nhan_vien, product_group, source_type, COUNT(*) as service_count
        FROM detail
        WHERE product_group = 'Tendoo' AND UPPER(nhan_vien) LIKE '%HNI%'
          AND tr_year = ${year} AND tr_month = '${month}'
          AND JSON_VALUE(extra_data, '$.loai_tac_dong') = N'Gia hạn'
          AND CAST(JSON_VALUE(extra_data, '$.price') AS FLOAT) >= 150000
          AND JSON_VALUE(extra_data, '$.gia_han_lan_dau') = N'Gia hạn lần đầu từ gói miễn phí'
          -- TODO: Các logic có dấu "..." của Nhóm 4
        GROUP BY tr_year, tr_month, tr_day, nhan_vien, product_group, source_type

    ) TendooGroups
    GROUP BY tr_year, tr_month, tr_day, nhan_vien, product_group, source_type
  `,
};

export const getDefaultTendooRule = TENDOO_RULES["2026-03"];
