---
phase: phase-7
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - sw.js
  - doc/tests/sw_offline_test.py
  - doc/tests/cache_version_test.py
  - doc/tests/bump_cache.py
  - doc/tests/baseline/assets-hash.json
  - doc/tests/run_all.py
  - doc/tests/README.md
autonomous: true
requirements:
  - PWA-01
  - PWA-02
  - PWA-03
must_haves:
  truths:
    - "程式碼更新後，已安裝舊 Service Worker 的瀏覽器在下一次連線載入時就會拿到新版 JS（不會永遠卡在舊快取）"
    - "第一次連線載入後，離線重新整理：頁面正常、統計圖表的 Chart 存在、沒有 pageerror"
    - "assets/、data/、index.html、manifest.json 有變動但 CACHE_NAME 沒升版時，自動化測試會失敗"
---

<objective>
修正 Service Worker 的快取策略。目前 Phase 5、6 的修正**很可能沒有送到使用者的瀏覽器**：
`sw.js` 是「有快取就用快取、永遠不再向伺服器要新版」，而 `CACHE_NAME` 在 Phase 4 升到 `anatomy-v2` 之後就沒有再改過，但 Phase 5、6 改了 7 個 JS 檔。
</objective>

<context>
## 現況（sw.js，Claude 審查時確認）
- `install`：預先快取 13 個檔案，但 index.html 實際載入的本地腳本中，**有 11 個不在清單內**：dental-image-mapper、eye-image-mapper、eye-label-mapper、body-image-mapper、eye-descriptions、image-annotator、body-operation-form、ocr-handler、disease-data-migration、eye-structure-info、disease-visualization。data/ 的 JSON 和圖片也大多不在清單內。
- `fetch`：cache-first。沒有快取時才連網路，並且只快取 `response.type === 'basic'`（同源）的回應 → **CDN 資源（Chart.js、Font Awesome、Tesseract）永遠不會被快取，離線時統計圖表和圖示都會失效**。
- 有快取就永遠使用快取 → 升版前程式碼永遠不會更新。
- 是否有 `skipWaiting` / `clients.claim` / 刪除舊快取：請先讀 sw.js 確認，並在 SUMMARY 記錄。

## 目標策略
| 請求類型 | 策略 |
|---------|------|
| 同源的 HTML、JS、CSS、JSON（程式碼與資料） | **network-first**：先連網路，成功就更新快取並回傳；失敗（離線）才用快取 |
| 同源圖片（assets/images/） | cache-first（體積大、很少變動） |
| CDN（cdn.jsdelivr.net、cdnjs.cloudflare.com） | cache-first，**允許快取 opaque 回應**（`<script>` 載入的 CDN 是 no-cors，response.type 會是 `'opaque'`、status 0） |
| 其他 | 直接連網路 |

- `install`：預先快取 index.html 用到的**所有**本地腳本、樣式，加上 data/*.json、manifest.json，以及 3 個 CDN 網址（CDN 用 `new Request(url, {mode: 'no-cors'})`）。清單要跟 index.html 完全一致（見 Task 1 的測試）。呼叫 `self.skipWaiting()`。
- `activate`：刪除所有名稱不等於目前 `CACHE_NAME` 的快取，並呼叫 `self.clients.claim()`。
- 導覽請求（`request.mode === 'navigate'`）離線且沒有快取時，回傳快取的 `/index.html`。
- `CACHE_NAME` 改成 `'anatomy-v3'`。
- **不要新增 console.log**（sw.js 裡原本的 console.log 一併移除）。

## 快取版本守門機制
因為沒有打包工具，無法自動用雜湊命名。改用測試守門：
- `doc/tests/baseline/assets-hash.json`：`{ "cacheName": "anatomy-v3", "hash": "<sha256>" }`
- hash 的計算方式：依路徑排序後，對 `index.html`、`manifest.json`、`assets/**`（排除 `assets/images/**/*.md`）、`data/**` 每個檔案串接「相對路徑 + 內容」再做 SHA-256。**sw.js 本身不算在內**。
- `cache_version_test.py`：
  - 重新計算 hash；如果 hash 跟基準不同，**而且** sw.js 中的 CACHE_NAME 仍然等於基準的 cacheName → 失敗，訊息：「assets 已變更但 CACHE_NAME 未升版，請執行 python3 doc/tests/bump_cache.py」
  - 如果 hash 不同但 CACHE_NAME 已經改了 → 也失敗，提示執行 bump_cache.py 更新基準（避免基準過期）
- `bump_cache.py`：把 sw.js 的 `anatomy-vN` 加 1，並重寫基準檔。可以用 `--check-only` 參數只檢查不寫入。
</context>

<tasks>

<task type="auto">
  <name>Task 1：先寫失敗測試</name>
  <files>doc/tests/sw_offline_test.py, doc/tests/cache_version_test.py, doc/tests/run_all.py</files>
  <action>
1. `test_precache_covers_index_assets`（純 Python）：解析 index.html 所有本地 `<script src>` 與 `<link rel=stylesheet href>`，以及 3 個 CDN 網址；解析 sw.js 的預先快取清單；斷言 index.html 的每一項都在清單中。
2. `test_offline_reload_works`（Playwright）：開啟頁面 → 等待 `navigator.serviceWorker.ready` 以及 `navigator.serviceWorker.controller` 不為 null（必要時 reload 一次讓 SW 接管）→ `context.set_offline(True)` → reload → 斷言 `window.app` 存在、`typeof Chart !== 'undefined'`、沒有 pageerror。
3. `test_code_update_reaches_client`（Playwright，**這是最重要的測試**）：
   - 伺服器從一個暫存副本目錄提供服務（在 scratch 目錄複製專案，用 conftest_server 的 cwd 參數，必要時擴充 conftest_server 支援指定根目錄與 port）
   - 第一次載入，等 SW 接管
   - 修改副本中的 `assets/scripts/main.js`，在檔尾加上 `window.__codeVersion = 'NEW';`（**不要**升 CACHE_NAME，模擬「只改程式碼」）
   - 重新載入（一般 reload，連線狀態）→ 斷言 `window.__codeVersion === 'NEW'`
   - 目前的 cache-first 策略下，這個測試應該失敗
4. `cache_version_test.py` 的 `test_cache_name_bumped_when_assets_change`：依 context 實作。第一次執行時還沒有基準檔 → 測試失敗並提示執行 bump_cache.py。

先執行並確認 1、2、3 失敗（紅燈），把輸出貼進 SUMMARY。
  </action>
  <verify>修正前 1～3 FAIL</verify>
</task>

<task type="auto">
  <name>Task 2：改寫 sw.js 並建立版本守門</name>
  <files>sw.js, doc/tests/bump_cache.py, doc/tests/baseline/assets-hash.json, doc/tests/README.md</files>
  <action>
依 context 改寫 sw.js，實作 bump_cache.py，然後執行 `python3 doc/tests/bump_cache.py` 產生基準（CACHE_NAME 會從 v2 升到 v3）。
在 doc/tests/README.md 補充說明：「修改 assets/ 或 data/ 之後必須執行 bump_cache.py」。
  </action>
  <verify>python3 doc/tests/run_all.py --with-snapshot 0 失敗 0 跳過</verify>
</task>

</tasks>

<verification>
- 全部測試通過，0 跳過
- 手動：在 Chrome DevTools → Application → Service Workers 確認新版 SW 啟用、舊的 `anatomy-v2` 快取被刪除
</verification>

<commit>
fix(pwa): Service Worker 改為程式碼 network-first、完整預先快取含 CDN，並加入快取版本守門測試
</commit>
