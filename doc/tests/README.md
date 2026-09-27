# 專案自動化測試與快照驗證說明

本目錄提供醫療結構化病歷系統的自動化測試套件與原型方法快照工具，用於重構與安全修復期間提供回歸防護網。

## 目錄結構

```
doc/tests/
├── conftest_server.py      # 本機 HTTP 伺服器啟動與終止管理模組
├── smoke_test.py           # Playwright 冒煙測試（頁面載入、切換系統、病歷、主題）
├── snapshot_prototype.py   # MedicalRecordApp 原型方法 SHA-256 快照提取與比對工具
├── run_all.py              # 整合測試執行器（零額外相依，僅依賴標準庫與 playwright）
├── baseline/
│   └── prototype-methods.json # 重構前 MedicalRecordApp.prototype 方法雜湊基準檔
└── README.md               # 本份說明文件
```

## 執行方式

### 1. 執行所有測試（含原型快照比對）

```bash
python3 doc/tests/run_all.py --with-snapshot
```

### 2. 僅執行冒煙測試

```bash
python3 doc/tests/run_all.py
```

### 3. 單獨檢查原型快照

```bash
python3 doc/tests/snapshot_prototype.py --check
```

### 4. 更新原型快照基準

> **注意**：只有在**刻意**修改、新增或刪除原型方法時，才能執行此指令更新基準。重構期間（例如 4-03 純搬移模組）嚴禁使用此指令覆蓋基準。

```bash
python3 doc/tests/snapshot_prototype.py --write
```

## 測試項目涵蓋說明

| 測試名稱 | 涵蓋範圍 | 說明 |
|---|---|---|
| `test_page_loads_without_errors` | 頁面載入穩定性 | 驗證 `index.html` 載入後 `window.app` 正常初始化，且無 JavaScript 運行時錯誤（`pageerror`）與 console error（自動過濾離線 CDN 網路請求錯誤）。 |
| `test_switch_systems` | 解剖系統切換與圖像渲染 | 依序切換牙齒（`teeth`）、眼睛（`eye`）、身體（`body`）系統，驗證 `window.app.currentSystemId` 正確變更，且各系統解剖圖成功加載（`naturalWidth > 0`）。 |
| `test_records_render_from_storage` | 本地儲存資料渲染 | 在載入前寫入 `localStorage['medicalRecords']`，驗證切換至該系統時病歷清單正確渲染。*(若存在既有 bug 會標記 SKIP_REASON 跳過，絕不放寬斷言)* |
| `test_theme_toggle` | 深淺色主題切換 | 點擊 `#theme-toggle` 按鈕，驗證 `localStorage['theme']` 在 `light` 與 `dark` 之間切換。 |
| `snapshot_prototype` | 方法完整性與純搬移保證 | 提取 `MedicalRecordApp.prototype` 上所有 62 個方法的正規化原始碼並計算 SHA-256 雜湊，確保拆分模組過程未發生任何改寫或遺漏。 |

## 自訂環境變數

- `ANATOMY_TEST_PORT`：測試伺服器連接埠，預設為 `8765`。
