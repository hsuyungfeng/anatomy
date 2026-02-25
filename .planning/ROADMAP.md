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

**Goal:** 添加用戶認證與權限控制

**Requirements:**
- [ ] AUTH-01: 用戶登入/註冊
- [ ] AUTH-02: 患者資料隔離
- [ ] AUTH-03: 數據加密存儲

**Success Criteria:**
1. 用戶可以創建帳戶
2. 各用戶只能訪問自己的病歷
3. 敏感數據加密存儲

---

## Milestone v1.0 Coverage

| Phase | Requirements | Status |
|-------|--------------|--------|
| (existing) | 牙齒/眼睛/身體系統 | ✓ Complete |
| 1 | 數據導出 | ✓ Complete |
| 2 | 數據分析 | ✓ Complete |
| 3 | 權限管理 | Planned |

**Total:** 7 requirements | 3 phases
