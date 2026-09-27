# Phase 7-01 執行總結：Service Worker 快取策略重構與版本守門

## 執行成果
- 完成 Service Worker 快取策略重構，同源程式碼與資料改為 **network-first**（搭配 `cache: 'no-cache'` 強制網路驗證，避免瀏覽器啟發式快取阻擋更新）。
- 補齊預先快取清單：涵蓋 `index.html` 載入的所有本地 JS、CSS、`data/*.json`、`manifest.json` 與 3 個 CDN 資源（Chart.js、Font Awesome、Tesseract）。
- CDN 支援 opaque 離線快取，確保離線狀態下圖示與統計圖表正常顯示。
- 建立快取版本守門機制（`bump_cache.py` 與 `cache_version_test.py`），當 `assets/`、`data/`、`index.html`、`manifest.json` 內容變更但 `CACHE_NAME` 未升版時，自動化測試自動攔截失敗。
- 移除 `sw.js` 中的 `console.log`。

---

## 修改的檔案
- `sw.js`：
  - 快取版本升級為 `anatomy-v3`
  - 擴充 `ASSETS_TO_CACHE` 包含全部 29 個本地腳本與樣式、9 個資料 JSON、3 個 CDN
  - `install` 事件中以 `{ mode: 'no-cors' }` 抓取 CDN，並呼叫 `self.skipWaiting()`
  - `activate` 事件刪除所有舊快取，並呼叫 `self.clients.claim()`
  - `fetch` 事件重構：
    - 同源 HTML/JS/CSS/JSON：network-first（`fetch(request, { cache: 'no-cache' })`，失敗退回 cache）
    - 同源圖片與 CDN：cache-first（允許 `type === 'opaque'`）
    - 導覽請求（`navigate`）斷網時回傳快取的 `/index.html`
- `doc/tests/bump_cache.py`：計算靜態資源 SHA-256 雜湊、自動遞增 `CACHE_NAME` 並產生基準檔
- `doc/tests/cache_version_test.py`：驗證靜態資源變更時 `CACHE_NAME` 必須升版
- `doc/tests/sw_offline_test.py`：
  - `test_precache_covers_index_assets`：靜態比對 index.html 資源是否完整被 sw.js 快取
  - `test_offline_reload_works`：驗證斷網重新載入後頁面正常、`Chart` 存在、無 pageerror
  - `test_code_update_reaches_client`：模擬只改程式碼沒升快取版號，驗證已註冊 SW 的客戶端連線重整後立即拿到新版程式碼
- `doc/tests/conftest_server.py`：擴充測試伺服器支援自訂 `cwd`
- `doc/tests/run_all.py`：整合 Phase 7-01 測試項目
- `doc/tests/baseline/assets-hash.json`：快取版本與靜態資源雜湊基準
- `doc/tests/README.md`：補充 `bump_cache.py` 說明與開發流程規則

---

## 修改前 sw.js 分析確認
在本次改寫前，針對 `sw.js` 原有實作確認：
1. **`skipWaiting()`**：舊版有在 `install` 中呼叫 `self.skipWaiting()`。
2. **`clients.claim()`**：舊版有在 `activate` 中呼叫 `self.clients.claim()`。
3. **刪除舊快取**：舊版在 `activate` 中有刪除鍵值不等於目前 `CACHE_NAME` 的快取。
4. **但主要致命問題為**：
   - 預先快取清單遺漏了 11 個核心腳本與所有 data JSON，且排除 CDN。
   - `fetch` 策略為全面的 cache-first，且限定只快取 `type === 'basic'`。這導致：
     - 使用者只要快取過舊版 JS，即使伺服器程式碼更新，瀏覽器也永遠讀取舊快取（Phase 5/6 的修正無法推送）。
     - CDN 腳本因跨域 opaque 回應被拒絕快取，斷網時無法載入 Chart.js。

---

## 測試輸出

### 修改前（紅燈：4 項失敗）
```
--- 執行 Phase 7-01 Service Worker 離線與更新測試 ---
[FAIL] test_precache_covers_index_assets: index.html 有 11 個本地資源未在 sw.js 預先快取中: ['assets/scripts/dental-image-mapper.js', ...]
[FAIL] test_offline_reload_works: AssertionError: Chart is not defined in offline mode
[FAIL] test_code_update_reaches_client: AssertionError: assert None == 'NEW' (舊版 cache-first 策略阻止了程式碼更新)

--- 執行 Phase 7-01 快取版本守門測試 ---
[FAIL] test_cache_name_bumped_when_assets_change: 基準檔 doc/tests/baseline/assets-hash.json 不存在，請執行 python3 doc/tests/bump_cache.py
```

### 修改後（綠燈：全部通過）
```
==================================================
 醫療病歷系統 — Phase 4 自動化測試
==================================================
啟動本機測試伺服器...
測試伺服器就緒: http://127.0.0.1:8765

--- 執行冒煙測試 ---
[PASS] test_page_loads_without_errors
[PASS] test_switch_systems
[PASS] test_records_render_from_storage
[PASS] test_theme_toggle

--- 執行工具頁載入測試 ---
[PASS] test_tools_load_without_404_or_errors

--- 執行 XSS 安全性測試 ---
[PASS] test_stored_xss_records
[PASS] test_notification_xss

--- 執行病歷流程端到端測試 ---
[PASS] test_save_teeth_record
[PASS] test_save_eye_record
[PASS] test_save_body_operation
[PASS] test_records_isolated_per_system
[PASS] test_records_persist_after_reload

--- 執行 OCR 疾病比對測試 ---
[PASS] test_ocr_match_diseases

--- 執行 Phase 6 儲存整併測試 ---
[PASS] test_no_storage_growth_on_reload
[PASS] test_markers_persist_after_reload
[PASS] test_backup_contains_saved_record
[PASS] test_restore_v2_shows_in_list
[PASS] test_restore_v1_legacy_backup
[PASS] test_clear_all_clears_list
[PASS] test_statistics_match_list
[PASS] test_migrate_legacy_keys
[PASS] test_single_write_per_save
[PASS] test_export_csv_contains_saved

--- 執行 Phase 6-03 儲存安全與資料一致性測試 ---
[PASS] test_restore_invalid_content_keeps_data
[PASS] test_restore_empty_backup_replaces
[PASS] test_migration_write_failure_keeps_legacy_keys
[PASS] test_view_classifies_records_without_system

--- 執行 Phase 7-01 Service Worker 離線與更新測試 ---
[PASS] test_precache_covers_index_assets
[PASS] test_offline_reload_works
[PASS] test_code_update_reaches_client

--- 執行 Phase 7-01 快取版本守門測試 ---
[PASS] test_cache_name_bumped_when_assets_change

--- 執行原型方法快照比對 ---
[PASS] 原型方法快照比對完全一致（共 60 個方法）

停止本機測試伺服器...

==================================================
 測試結果: 通過 32, 失敗 0, 跳過 0
==================================================
```

---

## 發現的問題與關鍵技術細節
1. **瀏覽器 HTTP 啟發式快取阻擋 Service Worker fetch**：
   在實作 network-first 時，若單純使用 `fetch(request)`，Chromium 因偵測到本地 Python 伺服器回應中的 `Last-Modified`，會直接命中瀏覽器底層的 HTTP 快取，導致即使檔案被更新，fetch 仍取得舊內容。加上 `{ cache: 'no-cache' }` 強制發出條件式網路請求，徹底解決此問題。
2. **CDN 資源的 opaque response**：
   `<script>` 標籤跨域請求不會攜帶 CORS 標頭，回應狀態碼為 0（`type === 'opaque'`）。Service Worker 快取 CDN 時必須接受 `response.type === 'opaque'`，且預先快取時需以 `new Request(url, { mode: 'no-cors' })` 抓取。

---

## 偏離計畫之處
無偏離計畫。所有要求（包含 `bump_cache.py` 規則、測試項、network-first / cache-first 分流）均依規格實作完成。
