# Requirements: 牙科解剖學習與診斷系統

**Defined:** 2026-02-25
**Core Value:** 讓醫療專業人員能夠通過視覺化解剖圖進行疾病記錄和管理

## v1 Requirements

### Data Export

- [ ] **EXP-01**: User can export medical records as PDF
- [ ] **EXP-02**: User can export data as CSV
- [ ] **EXP-03**: Export includes patient info, disease records, timeline

### Statistics

- [ ] **STAT-01**: Disease frequency statistics
- [ ] **STAT-02**: Time range filtering
- [ ] **STAT-03**: Chart visualization (bar, pie)

### Authentication

~~- [ ] **AUTH-01**: User login/registration~~
~~- [ ] **AUTH-02**: Patient data isolation~~
~~- [ ] **AUTH-03**: Encrypted data storage~~

## Phase 4 Requirements（程式碼品質改善）

- [ ] **IMP-01**: main.js 拆分為領域模組（每檔 < 800 行），行為不變
- [ ] **IMP-02**: 根目錄測試腳本與工具頁移至 doc/
- [ ] **IMP-03**: 修復病歷渲染的儲存型 XSS
- [ ] **IMP-04**: 建立可自動執行的冒煙測試與行為快照

## Out of Scope

| Feature | Reason |
|---------|--------|
| Backend server | Pure client-side application |
| Multi-user collaboration | Single-user use case |
| User authentication | Not needed for local use |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| EXP-01 | Phase 1 | Pending |
| EXP-02 | Phase 1 | Pending |
| EXP-03 | Phase 1 | Pending |
| STAT-01 | Phase 2 | Pending |
| STAT-02 | Phase 2 | Pending |
| STAT-03 | Phase 2 | Pending |
| AUTH-01 | Phase 3 | Pending |
| AUTH-02 | Phase 3 | Pending |
| AUTH-03 | Phase 3 | Pending |
| IMP-01 | Phase 4 | Planned |
| IMP-02 | Phase 4 | Planned |
| IMP-03 | Phase 4 | Planned |
| IMP-04 | Phase 4 | Planned |

**Coverage:**
- v1 requirements: 9 total
- Mapped to phases: 9
- Unmapped: 0 ✓

---
*Requirements defined: 2026-02-25*
*Last updated: 2026-09-27 — 新增 Phase 4 IMP 需求*
