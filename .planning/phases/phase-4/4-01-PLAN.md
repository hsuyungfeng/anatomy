---
phase: phase-4
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - doc/tests/conftest_server.py
  - doc/tests/smoke_test.py
  - doc/tests/snapshot_prototype.py
  - doc/tests/run_all.py
  - doc/tests/baseline/prototype-methods.json
  - doc/tests/README.md
autonomous: true
requirements:
  - IMP-04
must_haves:
  truths:
    - "執行 `python3 doc/tests/run_all.py` 會自動啟動本機伺服器、跑完所有測試，並以結束碼 0/1 回報結果"
    - "冒煙測試涵蓋三個系統（teeth / eye / body）的載入與切換、病歷存入 localStorage 後能重新渲染"
    - "doc/tests/baseline/prototype-methods.json 記錄了重構前 MedicalRecordApp.prototype 每個方法的 SHA-256 雜湊"
  artifacts:
    - path: "doc/tests/run_all.py"
      provides: "零依賴測試執行器（只用 Python 標準庫與 playwright）"
    - path: "doc/tests/baseline/prototype-methods.json"
      provides: "重構前行為快照，供 4-03 比對"
---

<objective>
建立可重複執行的自動化測試與「行為快照」，作為後續重構（4-03）與安全修復（4-04）的安全網。
這個計畫**不修改任何產品程式碼**（assets/、index.html、pages/、sw.js 一律不得更動）。
</objective>

<context>
- 專案是純靜態網頁（HTML + 傳統 `<script>` 載入，無打包工具、無 package.json）。
- 主程式：`assets/scripts/main.js`，定義 `class MedicalRecordApp`，於 `DOMContentLoaded` 時執行 `window.app = new MedicalRecordApp()`。
- 病歷存放在 `localStorage['medicalRecords']`（JSON 陣列）。
- 系統 id：`teeth`、`eye`、`body`（`this.currentSystemId` 預設 `'teeth'`）。
- 環境：Python 3 已安裝 `playwright`（sync API），瀏覽器已下載。**未安裝 pytest，不要引入 pytest 或任何新套件。**
- 使用者規則：**所有文檔與測試程式都放在專案目錄 `doc/` 下**（注意是 `doc/`，不是既有的 `docs/`）。
- 工具頁使用 `fetch('/data/...')` 絕對路徑，所以伺服器必須以專案根目錄為 web root。
</context>

<tasks>

<task type="auto">
  <name>Task 1：測試伺服器輔助模組</name>
  <files>doc/tests/conftest_server.py</files>
  <action>
建立 `start_server()` / `stop_server()`：
- 以 `subprocess.Popen([sys.executable, "-m", "http.server", PORT, "--bind", "127.0.0.1"], cwd=<專案根目錄>)` 啟動。
- 專案根目錄用 `Path(__file__).resolve().parents[2]` 計算，不得寫死 `/home/...`。
- PORT 預設 8765，可用環境變數 `ANATOMY_TEST_PORT` 覆寫。
- 啟動後輪詢 `http://127.0.0.1:PORT/index.html` 直到回應 200（最多 10 秒），逾時則丟例外。
  </action>
  <verify>python3 -c "import sys; sys.path.insert(0,'doc/tests'); import conftest_server as s; p=s.start_server(); s.stop_server(p); print('ok')"</verify>
</task>

<task type="auto">
  <name>Task 2：冒煙測試</name>
  <files>doc/tests/smoke_test.py</files>
  <action>
用 playwright sync API（headless chromium）撰寫下列測試函式，每個測試使用新的 browser context（localStorage 互不干擾）：

1. `test_page_loads_without_errors`：開啟 index.html，收集 `pageerror` 事件與 `console` type=error 的訊息，等待 `window.app` 存在後斷言沒有 pageerror（忽略載入 CDN 失敗的網路錯誤，例如 tesseract/chart.js 在離線時的錯誤；只要把網路相關錯誤過濾掉即可）。
2. `test_switch_systems`：依序切換到 teeth / eye / body（先讀 index.html 找出實際的系統切換按鈕選擇器，**不要猜測**），每次切換後斷言 `window.app.currentSystemId` 等於預期值，而且解剖圖的 `<img>` 已載入（`naturalWidth > 0`）。
3. `test_records_render_from_storage`：在頁面載入**前**用 `context.add_init_script` 寫入一筆 body 系統病歷到 `localStorage['medicalRecords']`（欄位參考 main.js `saveDiseaseAnnotation` 與 `displayBodyRecords` 實際讀取的欄位：`system:'body'`、`bodyPart`、`side`、`diseases:[{name, icd10}]`、`treatmentNotes`、`createdAt`），載入後切到 body 系統，斷言病歷清單容器內出現該疾病名稱文字。
4. `test_theme_toggle`：點擊主題切換按鈕後，`localStorage['theme']` 改變。

每個測試函式獨立，拋出 AssertionError 就代表失敗。檔案底部提供 `TESTS = [...]` 清單給 run_all.py 使用。
  </action>
  <verify>python3 doc/tests/run_all.py（在 Task 4 完成後）</verify>
</task>

<task type="auto">
  <name>Task 3：原型方法快照工具</name>
  <files>doc/tests/snapshot_prototype.py, doc/tests/baseline/prototype-methods.json</files>
  <action>
撰寫腳本：開啟 index.html、等待 `window.app` 出現後，在頁面中執行：

```js
(() => {
  const proto = Object.getPrototypeOf(window.app);
  const out = {};
  for (const name of Object.getOwnPropertyNames(proto).sort()) {
    if (name === 'constructor') continue; // constructor.toString() 是整個 class 原始碼，會隨拆分改變，改由冒煙測試涵蓋
    const v = proto[name];
    out[name] = typeof v === 'function' ? v.toString() : JSON.stringify(v);
  }
  return out;
})()
```

在 Python 端先正規化空白（`re.sub(r"\s+", " ", s).strip()`，讓縮排調整不會造成誤判），再對每個值做 SHA-256，輸出 `{方法名: 雜湊}`（依 key 排序、縮排 2）。
支援兩種模式：
- `python3 doc/tests/snapshot_prototype.py --write`：寫入 `doc/tests/baseline/prototype-methods.json`
- `python3 doc/tests/snapshot_prototype.py --check`：跟基準檔比對，列出「新增 / 缺少 / 內容不同」的方法名，有差異時結束碼 1。

**現在就用 `--write` 對目前（未修改）的程式碼產生基準檔並提交。**
  </action>
  <verify>python3 doc/tests/snapshot_prototype.py --check 結束碼為 0</verify>
</task>

<task type="auto">
  <name>Task 4：測試執行器與說明</name>
  <files>doc/tests/run_all.py, doc/tests/README.md</files>
  <action>
- `run_all.py`：啟動伺服器 → 依序執行 smoke_test.TESTS → 印出每個測試 PASS/FAIL（失敗時附上錯誤訊息）→ 關閉伺服器（用 try/finally）→ 全部通過結束碼 0，否則 1。
  參數 `--with-snapshot` 時，額外執行 snapshot `--check`。
- `README.md`（中文）：說明怎麼執行、每個測試涵蓋什麼、怎麼更新快照基準（只有在**刻意**改變行為時才能 `--write`）。
  </action>
  <verify>python3 doc/tests/run_all.py --with-snapshot 結束碼為 0</verify>
</task>

</tasks>

<verification>
1. `git diff --stat` 只能出現 `doc/` 底下的檔案。
2. `python3 doc/tests/run_all.py --with-snapshot` 全部通過。
3. 如果有測試因為**既有 bug** 而失敗，不要修改產品程式碼，也不要為了讓測試通過而放寬斷言。在 SUMMARY 記錄下來，並在該測試上用 `SKIP_REASON = "..."` 標記跳過。
</verification>

<commit>
test: 建立 Phase 4 冒煙測試與原型方法快照基準
</commit>
