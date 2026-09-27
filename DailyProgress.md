# Daily Progress - 每日進度

**日期**: 2026-09-27  
**專案**: 牙科解剖學習與診斷系統  
**版本**: M2.5 + Phase 4–6（品質改善、Bug 修復、儲存整併）

---

## 今日完成

### ✅ 已完成項目

| 項目 | 狀態 | 說明 |
|------|------|------|
| 數據導出 (CSV/PDF) | ✓ | Phase 1 完成 |
| 數據分析儀表板 | ✓ | Phase 2 完成 |
| 系統篩選功能 | ✓ | 支援牙齒/眼睛/身體篩選 |
| 專案規劃結構 | ✓ | 建立 .planning 目錄 |
| **M2.5-01 牙齒疾病** | ✓ | 擴展至 8 種疾病，含細分類 |
| **M2.5-02 眼睛結構資訊** | ✓ | 添加詳細描述、功能、常見疾病 |
| **M2.5-03 身體部位細分** | ✓ | 8 大部位，42 個子部位 |
| **M2.5-04 病歷搜尋** | ✓ | 關鍵字搜尋疾病/位置/備註 |
| **M2.5-05 數據備份/還原** | ✓ | 一鍵備份、檔案還原 |
| **M2.5-06 列印樣式** | ✓ | 隱藏工具列、優化顯示 |
| **M2.5-07 深色模式** | ✓ | 主題切換按鈕、Dark Mode |
| **M2.5-08 快捷鍵** | ✓ | Ctrl+S/E/F/D, Escape, 1/2/3 |
| **M2.5-09 PWA 離線** | ✓ | Service Worker、Manifest |

---

## 今日開發記錄

### 2026-09-27 — Phase 4～6

> 流程：由 Claude Code 規劃（`.planning/phases/phase-N/N-PLAN.md`）→ Antigravity (agy) 依計畫以 TDD 執行 → Claude Code 獨立驗收（重跑測試、在舊程式碼上驗證紅燈、核對快照、實測邊界情況）→ 合併

#### Phase 4：程式碼品質改善
1. **自動化測試** - `doc/tests/`
   - `run_all.py` 零相依執行器（Python + Playwright），自動啟動本機伺服器
   - 原型方法快照（`snapshot_prototype.py`），用來證明重構是純搬移
2. **根目錄整理** - 測試腳本移至 `doc/tests/legacy*`，除錯／校準工具頁移至 `doc/tools/`
3. **拆分 main.js** - 3106 行 → `assets/scripts/app/` 6 個領域模組（core / eye / tooth / body / modal / records）＋ 8 行啟動檔；移除除錯 console.log
4. **修復儲存型 XSS** - 新增 `escapeHtml()`，病歷渲染的所有使用者資料都會先跳脫

#### Phase 5：病歷流程 Bug 修復
1. **牙齒／眼睛病歷存不進去（資料遺失）** - 身體專用的 `saveDiseaseAnnotation` 覆蓋了通用版本，已恢復通用流程
2. **系統篩選錯誤** - `'tooth'` 與 `'teeth'` 不一致；身體操作記錄被篩掉
3. **切換分頁不顯示病歷** - 系統切換後重新載入清單
4. **OCR 比對例外** - `Object.forEach` 不存在，改用 `Object.entries`

#### Phase 6：病歷儲存整併
1. **單一資料來源** - `localStorage['medicalRecords']`，`RecordManager` 為唯一存取層
2. **巢狀唯讀檢視** - 匯出、PDF、統計、搜尋不需改寫
3. **自動遷移舊資料** - `anatomy-record-*` 併入並去重，原始資料保留在 `anatomy-record-legacy-backup`
4. **備份 v2** - 還原相容 v1；無效檔案不會清空現有資料
5. **修正** - 載入頁面不再產生空病歷；重新整理後圖上標記不再消失；清除全部、還原、統計與清單一致

#### 測試結果
- `python3 doc/tests/run_all.py --with-snapshot`：**28 通過、0 失敗、0 跳過**

---

### 2026-02-26

#### 新增功能
1. **CSV 導出** - `record-manager.js`
   - `exportAsCSV()` 方法
   - UTF-8 BOM 支援
   
2. **PDF 導出** - `record-manager.js`
   - `exportAsPDF()` 方法
   - 美觀的 HTML 模板
   
3. **統計分析面板** - `record-statistics.js`
   - 疾病頻率長條圖
   - 疾病分佈圓餅圖
   - 系統篩選（牙齒/眼睛/身體）
   - 日期範圍篩選

4. **M2.5-01: 牙齒疾病擴展** - `disease-categories.json`
   - 8 種主要牙齒疾病
   - 每種疾病細分類（24 項）
   - 包含描述、病因說明

5. **M2.5-02: 眼睛結構詳細資訊** - `eye-structure-info.js`
   - 26 個結構詳細資料
   - 解剖學描述、功能說明
   - 常見疾病列表
   - 治療建議

6. **M2.5-03: 身體部位細分** - `body-systems.json`
   - 8 大身體部位
   - 42 個細分子部位
   - 每個部位獨立 ICD-10 代碼

#### 修改檔案
- `index.html` - 添加統計面板 UI、眼睛結構資訊
- `main.css` - 添加統計樣式
- `main.js` - 初始化統計模組、眼鏡結構資訊顯示

---

## 明日待辦

### 🔜 明日任務

| 優先級 | 任務 | 預估時間 |
|--------|------|----------|
| 🟢 低 | M2.5-07: 深色模式 | ✅ 完成 |
| 🟢 低 | M2.5-08: 快捷鍵支援 | ✅ 完成 |
| 🟢 低 | M2.5-09: 離線支援 | ✅ 完成 |

### 本週目標

- [x] 牙齒疾病選項擴展
- [x] 眼睛結構詳細資訊頁面
- [x] 病歷搜尋功能
- [x] 數據備份/還原功能
- [x] 深色模式
- [x] 快捷鍵支援
- [x] 離線支援

---

## 技術筆記

### 現有技術棧
- HTML5 + CSS3 + JavaScript (ES6+)
- Chart.js 4.4.1（圖表）
- localStorage（數據持久化）
- Font Awesome（圖示）

### 關鍵模組
- `MedicalRecordApp` - 主程式，以原型混入拆分於 `assets/scripts/app/*.js`（由 `defineAppMethods()` 註冊）
- `RecordManager` - **病歷資料唯一存取層**（`localStorage['medicalRecords']`，扁平標註陣列）
- `RecordStatistics` - 統計分析（透過 RecordManager 讀取）
- `DiseaseForm` - 疾病表單
- `ImageAnnotator` - 圖像標註

### 資料儲存
- 病歷：`localStorage['medicalRecords']`，每筆標註有 `system` 欄位（`teeth` / `eye` / `body`）
- 舊資料備份：`localStorage['anatomy-record-legacy-backup']`（Phase 6 遷移時自動產生，請勿刪除）
- 備份檔格式：v2.0（扁平），還原時相容 v1.0（巢狀）

---

## 問題與解決

### 已解決問題
1. ✅ CSV 編碼問題 - 添加 UTF-8 BOM
2. ✅ 統計只顯示牙齒 - 添加系統篩選
3. ✅ 牙齒疾病選項太少 - 擴展至 8 種含細分類
4. ✅ 眼睛結構無詳細資訊 - 添加完整結構資料
5. ✅ 儲存型 XSS - 病歷渲染一律 `escapeHtml`（Phase 4）
6. ✅ 牙齒／眼睛病歷無法儲存 - 恢復通用儲存流程（Phase 5）
7. ✅ 兩套儲存不一致、每次載入產生空病歷 - 整併為單一儲存（Phase 6）

### 已知小問題（未處理）
- 病歷清單標題：牙齒位置名稱重複顯示；身體記錄的左右標籤顯示為「右眼」而非「右側」（`renderGroupedRecords`）

---

## 代碼統計

| 指標 | 數量 |
|------|------|
| HTML 檔案 | 2 個產品頁（index、pages/medical-record）＋ doc/ 下工具與舊測試頁 |
| JS 模組 | 22（含 app/ 下 6 個） |
| CSS 檔案 | 4 |
| JSON 數據 | 9 |
| JS 總行數 | ~8400 |
| 自動化測試 | 28 項 |

---

## 常用命令

```bash
# 啟動本地伺服器
python3 -m http.server 8000

# 執行全部自動化測試（會自動啟動伺服器於 127.0.0.1:8765）
python3 doc/tests/run_all.py --with-snapshot

# 刻意改變 MedicalRecordApp 行為後，核對差異再更新快照基準
python3 doc/tests/snapshot_prototype.py --check
python3 doc/tests/snapshot_prototype.py --write

# 工具頁（校準、座標視覺化等）
# http://localhost:8000/doc/tools/
```

---

## 聯繫與回報

- **問題回報**: 請提交 Git Issue
- **功能建議**: 聯繫開發團隊

---

**更新時間**: 2026-09-27
