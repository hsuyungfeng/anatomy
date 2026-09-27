# Roadmap: 牙科解剖學習與診斷系統

**Created:** 2026-02-25
**Profile:** quick | yolo | balanced

## Phase 1: 數據導出系統

**Goal:** 實現病歷數據導出功能

**Requirements:**
- [ ] EXP-01: 導出為 PDF 格式報告
- [ ] EXP-02: 導出為 CSV 格式
- [ ] EXP-03: 結構化醫療報告模板

**Success Criteria:**
1. 用戶可以導出完整病歷為 PDF
2. 用戶可以導出數據為 CSV
3. 導出包含患者信息、疾病記錄、時間軸

---

## Phase 2: 數據分析儀表板

**Goal:** 提供病歷數據統計與可視化

**Requirements:**
- [ ] STAT-01: 疾病發生頻率統計
- [ ] STAT-02: 按時間範圍篩選分析
- [ ] STAT-03: 圖表化展示 (長條圖、圓餅圖)

**Success Criteria:**
1. 顯示疾病分佈統計
2. 支援時間範圍篩選
3. 視覺化圖表正確渲染

---

## Phase 3: 用戶權限管理

~~**Goal:** 添加用戶認證與權限控制~~

~~**Requirements:**
- [ ] AUTH-01: 用戶登入/註冊
- [ ] AUTH-02: 患者資料隔離
- [ ] AUTH-03: 數據加密存儲~~

~~**Success Criteria:**
1. 用戶可以創建帳戶
2. 各用戶只能訪問自己的病歷
3. 敏感數據加密存儲~~

**狀態:** 不需要（單機使用）

---

## Phase 4: 程式碼品質改善

**Goal:** 降低維護成本、修補安全弱點、建立自動化測試安全網

**Executor:** Antigravity (agy)，完成後由 Claude Code 審查

**Status:** ✓ Complete（2026-09-27，合併於 c7446ac，經 Claude Code 審查通過）

**Plans:** 4 plans（依序執行）
- [x] 4-01-PLAN.md — 冒煙測試與原型方法快照基準（IMP-04）
- [x] 4-02-PLAN.md — 根目錄雜檔移至 doc/（IMP-02）
- [x] 4-03-PLAN.md — main.js 拆分為 app/ 模組（IMP-01）
- [x] 4-04-PLAN.md — 儲存型 XSS 修復（IMP-03）

**Success Criteria:**
1. `python3 doc/tests/run_all.py --with-snapshot` 全部通過
2. 根目錄只剩產品檔案
3. main.js < 30 行，app/*.js 每檔 < 800 行
4. XSS payload 存進病歷後只會顯示成文字

---

## Phase 5: 病歷流程 Bug 修復

**Goal:** 修復 Phase 4 審查時發現的病歷儲存／顯示問題與 OCR 例外

**Executor:** Antigravity (agy)，完成後由 Claude Code 審查

**Root cause:** 新增身體系統時，以身體專用版本覆蓋了三系統共用的 saveDiseaseAnnotation / filterRecordsBySystem / loadAndDisplayRecords

**Status:** ✓ Complete（2026-09-27，經 Claude Code 審查通過：TDD 驗證修復前 7 項失敗、修復後 14/14 通過）

**Plans:** 2 plans（依序執行）
- [x] 5-01-PLAN.md — 恢復通用病歷流程（FIX-01～03）
- [x] 5-02-PLAN.md — OCR Object.forEach 修正（FIX-04）

**Success Criteria:**
1. 三個系統都能新增病歷，切換分頁、重新整理後記錄仍在且不混雜
2. `run_all.py --with-snapshot` 0 失敗、0 跳過
3. `grep -rn "Object.forEach" assets/` 沒有結果

---

## Phase 6: 病歷儲存整併

**Goal:** 將 recordManager（anatomy-record-*）與 localStorage['medicalRecords'] 整併為單一資料來源

**Executor:** Antigravity (agy)，完成後由 Claude Code 審查

**Design:** medicalRecords（扁平標註陣列）為唯一來源；RecordManager 為唯一存取層，並提供唯讀巢狀檢視給匯出／統計／PDF 使用；首次載入自動遷移舊資料並保留備份

**Status:** ✓ Complete（2026-09-27，經 Claude Code 審查：追加 6-03 修補 3 個資料安全問題後通過，28/28 測試、真實遷移演練一致）

**Plans:** 3 plans（依序執行）
- [x] 6-01-PLAN.md — 整併行為的端到端測試（TDD 紅燈）
- [x] 6-02-PLAN.md — RecordManager 改寫、遷移、呼叫端改用單一儲存（STORE-01～04）
- [x] 6-03-PLAN.md — 審查追加：還原無效檔不清空、遷移失敗不刪舊資料、無 system 記錄歸類一致

**Success Criteria:**
1. 病歷資料只在 record-manager.js 讀寫
2. 清單、圖上標記、統計、備份、清除全部看到同一份資料
3. 重新整理不會新增 localStorage key，也不會讓標記消失
4. 舊資料自動遷移且不遺失；`run_all.py --with-snapshot` 0 失敗、0 跳過

---

## Phase 7: PWA 更新修正、清單顯示修正、CI

**Goal:** 讓程式碼更新真的送到使用者手上、離線可用；修正清單顯示；建立 CI

**Executor:** Antigravity (agy)，完成後由 Claude Code 審查

**Why urgent:** sw.js 為 cache-first，CACHE_NAME 自 Phase 4 後未升版，Phase 5／6 的修正可能從未送達已開過網站的瀏覽器

**Status:** ✓ Complete（2026-09-27，經 Claude Code 審查：35/35 測試、舊版 SW v2 → v4 升級演練通過）

**Plans:** 3 plans（依序執行）
- [x] 7-01-PLAN.md — Service Worker 策略與快取版本守門（PWA-01～03）
- [x] 7-02-PLAN.md — 清單側別標籤與重複名稱（UI-01～02）
- [x] 7-03-PLAN.md — GitHub Actions CI（CI-01）

---

## Phase 8: 牙齒系統改用結構化 SVG 牙位圖

**Goal:** 以可點擊的 SVG 牙位圖取代點陣圖座標辨識，從根本解決「無法自動識別牙齒位置」

**Executor:** Antigravity (agy)，完成後由 Claude Code 審查

**Design:** 原型 doc/prototypes/odontogram/（使用者已確認）；SVG 為主，點陣圖保留為只能看的參考圖；只動牙齒系統，眼睛、身體之後比照辦理

**Status:** ✓ Complete（2026-09-27，經 Claude Code 審查：44/44 測試；52 顆牙在多種縮放與手機寬度下 100% 辨識；舊病歷標示演練通過）

**Plans:** 3 plans（依序執行）
- [x] 8-01-PLAN.md — 端到端測試（TDD 紅燈，含螢幕縮放 1／1.25／2）
- [x] 8-02-PLAN.md — 牙位圖模組、整合、病歷標示、參考圖切換（SVG-01～04）
- [x] 8-03-PLAN.md — 移除牙齒座標辨識死碼（SVG-05）

**Success Criteria:**
1. 52 顆牙（永久 32＋乳牙 20）點擊辨識 100% 正確，與螢幕縮放無關
2. 病歷標示在牙位圖上，重新整理與舊記錄都正確
3. 眼睛、身體系統行為不變；`run_all.py --with-snapshot` 0 失敗、0 跳過

---

## Milestone v1.0 Coverage

| Phase | Requirements | Status |
|-------|--------------|--------|
| (existing) | 牙齒/眼睛/身體系統 | ✓ Complete |
| 1 | 數據導出 | ✓ Complete |
| 2 | 數據分析 | ✓ Complete |
| 3 | 用戶權限 | ✗ Not Needed |
| 4 | 程式碼品質改善 | ✓ Complete |
| 5 | 病歷流程 Bug 修復 | ✓ Complete |
| 6 | 病歷儲存整併 | ✓ Complete |
| 7 | PWA 更新／清單顯示／CI | ✓ Complete |
| 8 | 牙齒 SVG 牙位圖 | ✓ Complete |

**Milestone:** Complete ✓
