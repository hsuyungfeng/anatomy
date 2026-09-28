# Daily Progress - 每日進度

**日期**: 2026-09-28  
**專案**: 牙科解剖學習與診斷系統  
**版本**: M2.5 + Phase 4–10（品質改善、Bug 修復、儲存整併、PWA、結構化 SVG、版面與在地化、互動體驗）

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
| **Phase 4 品質改善** | ✓ | 模組化拆分、XSS 防護、自動化測試框架 |
| **Phase 5 病歷流程** | ✓ | 牙齒/眼睛病歷儲存、系統篩選一致性 |
| **Phase 6 儲存整併** | ✓ | medicalRecords 單一資料源、舊資料自動遷移、備份 v2 |
| **Phase 7 PWA 與清單** | ✓ | SW 程式碼網路優先、快取守門、病歷標籤修正、GitHub Actions CI |
| **Phase 8 SVG 牙位圖** | ✓ | 結構化 SVG 牙位圖（32 永久牙＋20 乳牙）、直接 FDI 辨識、縮放相容 |
| **Phase 9 眼睛/身體 SVG** | ✓ | 眼睛剖面與寫實輪廓 SVG、共用視口縮放平移、舊記錄 ID 對照 |
| **Phase 10 版面與英文** | ✓ | 響應式排版防裁切、說明文字、未知時間戳、完整中英雙語在地化 |
| **互動修復與規範** | ✓ | 修正放大後點擊結構開啟模態失效 bug、加入真實滑鼠點擊測試規範 |

---

## 今日開發記錄

### 2026-09-28 — Phase 7～10 暨互動優化

> 流程：由 Claude Code 規劃（`.planning/phases/phase-N/N-PLAN.md`）→ Antigravity (agy) 依計畫以 TDD 執行 → Claude Code 獨立審查與驗收 → 合併

#### Phase 7：PWA 更新、清單顯示與 CI
1. **Service Worker 更新策略** - 程式碼與靜態資源改採 Network-First，確保程式更新無需手動清除快取即可即時送達瀏覽器；包含 CDN 資源完整預先快取以支援完全離線使用。
2. **快取守門機制** - 新增守門測試（`test_cache_name_bumped_when_assets_change`），若修改程式或樣式而未升級快取版號則測試失敗；提供 `bump_cache.py` 自動更新資產雜湊與快取版本（升版至 `anatomy-v20`）。
3. **病歷清單標籤與重複名稱修正** - 身體記錄依側別顯示「右側／左側」（不再顯示「右眼」）；牙齒病歷標題不再重複顯示位置名稱。
4. **GitHub Actions 自動化 CI** - 建立 `.github/workflows/ci.yml`，於每次 push 與 PR 自動執行完整端到端測試。

#### Phase 8：牙齒結構化 SVG 牙位圖
1. **結構化 SVG 向量圖** - 替換原先點陣圖座標辨識方式，支援 32 顆永久牙與 20 顆乳牙向量圖示，使用者點擊任何牙齒可直接精準辨識 FDI 代號。
2. **螢幕縮放相容性** - 在 100%、125%、200% 等不同螢幕縮放設定下均能精確判定點擊位置，徹底解決以往縮放後座標偏移的問題。
3. **病歷標記與參考圖** - 結構圖上即時呈現既有病歷標記（永久牙與乳牙分離渲染）；保留原點陣圖為參考圖切換顯示。
4. **死碼重構** - 清理舊有牙齒像素座標辨識邏輯，將舊校準工具標註為停用。

#### Phase 9：眼睛剖面與身體寫實 SVG、共用視口縮放平移
1. **眼睛結構化剖面圖** - 建立 `EyeDiagram` 向量模組，繪製矢狀剖面結構圖與正面方位小圖（OD／OS 切換），精準辨識 26 個解剖結構並相容既有 structureId。
2. **身體寫實輪廓向量圖** - 建立 `BodyMap` 模組，採用寫實人體輪廓搭配 clipPath 分區（正面／背面、男／女體型），支援 42 個子部位選取與「放大臉部」視角。
3. **共用視口縮放平移** - 抽取 `SvgViewport` 模組，為三個系統提供統一的視口縮放（`zoomIn`, `zoomOut`, `reset`）、滑鼠滾輪縮放與拖曳平移功能。
4. **舊記錄 ID 對照模組** - 建立 `AnatomyMapping`，雙向相容 2026-02-26、Phase 2 與 Phase 5 的舊版記錄識別碼，確保舊病歷完好呈現。

#### Phase 10：版面排版、時間戳與英文介面在地化
1. **版面排版重構** - 解決在 1366×768（筆電）、1200×800 及手機螢幕（390×844）上工具列與說明文字被裁切的嚴重問題，重構 Flexbox 容器布局，確保工具列恆久可見可點。
2. **說明文案更新** - 說明文字符合 Phase 8/9/10 現狀（支援點擊結構、拖曳平移、按鈕/滾輪縮放）。
3. **時間戳處理** - 修正缺少或無效時間戳的歷史記錄顯示，由原本的「無效的時間戳」改為「時間不明」（英文顯示 `Unknown time`）。
4. **完整英文在地化** - 建立全域翻譯字典模組 `assets/scripts/i18n.js`（`I18N.t()`, `I18N.lang()`）；結構圖（象限、方位、剖面、身體部位）支援切換語言時即時重繪；表單、統計與通知全面英文化；維持已存病歷之 `locationName` 中文原文儲存不變。

#### 互動體驗優化與規範
1. **放大後點擊結構開啟模態失效修復** - 解決 `SvgViewport` 在放大狀態下於 `pointerdown` 提早執行 `setPointerCapture` 導致 click 事件目標被搶奪為 `<svg>` 本身的問題。改為移動超過 4px 才鎖定指標判定為拖曳；未超過則視為點擊，恢復正常開啟模態視窗。
2. **真實滑鼠點擊測試** - 新增 `doc/tests/zoom_click_test.py`，以 Playwright 真實滑鼠事件（`page.mouse.click`）驗證 100%、放大 1 次、2 次與放大臉部下的點擊互動。
3. **專案測試規範更新** - 於 `AGENTS.md` 明定「點擊類的互動至少要有一項測試用真實滑鼠點擊，不可只用鍵盤或 evaluate 呼叫方法」，防止此類互動問題再次漏測。

#### 測試結果
- `python3 doc/tests/run_all.py --with-snapshot`：**78 通過、0 失敗、0 跳過**
- 原型方法快照比對（68 個方法）：**全數一致通過**

---

### 2026-09-27 — Phase 4～6

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
   - 疾病頻率長條圖、圓餅圖、系統與日期篩選
4. **M2.5-01: 牙齒疾病擴展** - `disease-categories.json`
5. **M2.5-02: 眼睛結構詳細資訊** - `eye-structure-info.js`
6. **M2.5-03: 身體部位細分** - `body-systems.json`

---

## 技術筆記

### 現有技術棧
- HTML5 + CSS3 + JavaScript (ES6+，純原生無打包相依)
- SVG 向量解剖結構圖（牙位圖、眼睛剖面圖、身體寫實輪廓）
- Chart.js 4.4.1（圖表）
- localStorage（資料持久化）
- Font Awesome（圖示）
- Service Worker（離線 PWA，Network-First 策略）

### 關鍵模組
- `MedicalRecordApp` - 主程式，以原型混入拆分於 `assets/scripts/app/*.js`（由 `defineAppMethods()` 註冊）
- `RecordManager` - **病歷資料唯一存取層**（`localStorage['medicalRecords']`，扁平標註陣列）
- `Odontogram` - 結構化 SVG 牙位圖（永久牙與乳牙向量視圖）
- `EyeDiagram` - 結構化 SVG 眼睛剖面圖（OD／OS 方位小圖與剖面）
- `BodyMap` - 寫實輪廓 SVG 身體圖（男女體型、正背面、放大臉部）
- `SvgViewport` - 三系統共用視口控制（縮放、滾輪、拖曳平移、4px 閾值判定）
- `I18N` - 集中翻譯字典與中英在地化介面
- `AnatomyMapping` - 舊版病歷 ID 對照相容模組
- `RecordStatistics` - 統計分析（透過 RecordManager 讀取）
- `DiseaseForm` / `BodyOperationForm` - 疾病與身體操作表單
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
8. ✅ SW 更新延遲與離線不完整 - Network-first 策略與快取版本守門（Phase 7）
9. ✅ 病歷清單側別錯誤與牙齒名稱重複 - 清單渲染標籤邏輯修復（Phase 7）
10. ✅ 螢幕縮放時牙齒點擊座標偏移 - 改用結構化 SVG 牙位圖與直接 FDI 辨識（Phase 8）
11. ✅ 眼睛與身體缺乏向量支援與縮放平移 - 新增 SVG 結構圖與 SvgViewport（Phase 9）
12. ✅ 筆電（1366×768 等）與手機排版裁切工具列 - Flexbox 響應式排版重構（Phase 10）
13. ✅ 缺少時間戳顯示「無效的時間戳」 - 顯示「時間不明／Unknown time」（Phase 10）
14. ✅ 英文模式下介面殘留中文 - 全域 I18N 翻譯字典與結構圖即時重繪（Phase 10）
15. ✅ 結構圖放大後滑鼠點擊無法開啟填寫視窗 - 4px 拖曳閾值判定與真實滑鼠點擊測試（縮放優化）

### 已知小問題（未處理）
- 無（Phase 4～10 已規劃及發現之問題皆已全數修復完成）

---

## 代碼統計

| 指標 | 數量 |
|------|------|
| HTML 檔案 | 2 個產品頁（index、pages/medical-record）＋ doc/ 下工具與舊測試頁 |
| JS 模組 | 28（含 app/ 下 6 個） |
| CSS 檔案 | 6 |
| JSON 數據 | 10 |
| JS 總行數 | ~10,250 |
| 自動化測試 | 78 項（0 失敗、0 跳過） |
| 原型方法快照 | 68 個方法一致 |

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

# 資產檔案變更後自動升級快取版本
python3 doc/tests/bump_cache.py

# 工具頁（校準、座標視覺化等）
# http://localhost:8000/doc/tools/
```

---

## 聯繫與回報

- **問題回報**: 請提交 Git Issue
- **功能建議**: 聯繫開發團隊

---

**更新時間**: 2026-09-28
