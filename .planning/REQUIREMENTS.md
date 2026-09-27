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

- [x] **IMP-01**: main.js 拆分為領域模組（每檔 < 800 行），行為不變
- [x] **IMP-02**: 根目錄測試腳本與工具頁移至 doc/
- [x] **IMP-03**: 修復病歷渲染的儲存型 XSS
- [x] **IMP-04**: 建立可自動執行的冒煙測試與行為快照

## Phase 5 Requirements（病歷流程 Bug 修復）

- [x] **FIX-01**: 牙齒／眼睛疾病記錄可以正常儲存（修復 saveDiseaseAnnotation 被身體專用版本覆蓋）
- [x] **FIX-02**: 系統篩選正確（'teeth'/'primary_teeth'/'eye'/'body'），身體操作記錄可以顯示
- [x] **FIX-03**: 切換系統分頁時顯示 localStorage 中該系統的病歷
- [x] **FIX-04**: OCR 疾病比對不再因 Object.forEach 丟出例外

## Phase 6 Requirements（病歷儲存整併）

- [x] **STORE-01**: 病歷只有一個資料來源（localStorage['medicalRecords']），RecordManager 為唯一存取層
- [x] **STORE-02**: 舊 anatomy-record-* 資料自動遷移、去重，並保留原始備份
- [x] **STORE-03**: 備份／還原／清除／統計／匯出與清單使用同一份資料（備份 v2，還原相容 v1）
- [x] **STORE-04**: 載入頁面不再產生空病歷；重新整理後圖上標記仍在

## Phase 7 Requirements（PWA 更新、清單顯示、CI）

- [ ] **PWA-01**: 程式碼更新能送達已安裝 Service Worker 的瀏覽器（network-first）
- [ ] **PWA-02**: 首次載入後可離線使用，包含 CDN 資源
- [ ] **PWA-03**: assets 變動但快取未升版時，測試會失敗
- [ ] **UI-01**: 病歷清單側別標籤依系統正確顯示
- [ ] **UI-02**: 病歷清單位置名稱不重複
- [ ] **CI-01**: push／PR 自動執行完整測試

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
| IMP-01 | Phase 4 | Complete |
| IMP-02 | Phase 4 | Complete |
| IMP-03 | Phase 4 | Complete |
| IMP-04 | Phase 4 | Complete |
| FIX-01 | Phase 5 | Complete |
| FIX-02 | Phase 5 | Complete |
| FIX-03 | Phase 5 | Complete |
| FIX-04 | Phase 5 | Complete |
| STORE-01 | Phase 6 | Complete |
| STORE-02 | Phase 6 | Complete |
| STORE-03 | Phase 6 | Complete |
| STORE-04 | Phase 6 | Complete |
| PWA-01 | Phase 7 | Planned |
| PWA-02 | Phase 7 | Planned |
| PWA-03 | Phase 7 | Planned |
| UI-01 | Phase 7 | Planned |
| UI-02 | Phase 7 | Planned |
| CI-01 | Phase 7 | Planned |

**Coverage:**
- v1 requirements: 9 total
- Mapped to phases: 9
- Unmapped: 0 ✓

---
*Requirements defined: 2026-02-25*
*Last updated: 2026-09-27 — Phase 4～6 完成，新增 Phase 7 需求*
