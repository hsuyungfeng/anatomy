# State: 牙科解剖學習與診斷系統

**Updated:** 2026-09-27

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-25)

**Core Value:** 讓醫療專業人員能夠通過視覺化解剖圖進行疾病記錄和管理。

## Current Status

**Milestone:** v1.0
**Current Phase:** 9 — 眼睛、身體 SVG（已規劃，交由 agy 執行）
**Known Minor Issues:** 5 項，已排入 Phase 9-05
**Progress:** Existing features complete, roadmap created

## Decisions Made

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| 選擇器面板方式 | 簡化座標映射，降低複雜度 | ✓ Good |
| 單機存儲架構 | 無需服務器，快速部署 | ✓ Good |
| main.js 以原型混入拆分，不改 ES module | 無打包工具，維持傳統 script 載入 | ✓ Good |
| Phase 4 由 agy 執行、Claude 審查 | 使用者指定 | ✓ Good（快照證明純搬移） |
| Phase 5 恢復通用病歷流程而非個別打補丁 | 三個 bug 同源：身體專用版本覆蓋通用方法 | ✓ Good |
| Phase 6 以 medicalRecords 為唯一來源 + 巢狀唯讀檢視 | 清單流程已驗證；巢狀的「病歷」層無業務意義；檢視層避免改寫 39 處依賴 | ✓ Good |

## Blockers

(None)

## Notes

Brownfield project - existing features from HTML/JS implementation mapped to planning structure.

## Accumulated Context

### Pending Todos

| Date | Area | Title | Files |
|------|------|-------|-------|
| 2026-02-26 | ui | 身體圖像位置點擊座標不正確 | 3 |
