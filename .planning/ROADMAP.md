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

## Milestone v1.0 Coverage

| Phase | Requirements | Status |
|-------|--------------|--------|
| (existing) | 牙齒/眼睛/身體系統 | ✓ Complete |
| 1 | 數據導出 | ✓ Complete |
| 2 | 數據分析 | ✓ Complete |
| 3 | 用戶權限 | ✗ Not Needed |
| 4 | 程式碼品質改善 | ✓ Complete |
| 5 | 病歷流程 Bug 修復 | ✓ Complete |

**Milestone:** Complete ✓
