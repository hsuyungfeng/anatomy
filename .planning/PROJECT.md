# 牙科解剖學習與診斷系統

## What This Is

醫療學習與診斷系統，支持牙齒、眼睛、身體三大解剖系統的疾病記錄與管理。用於醫學生學習解剖結構、醫療人員記錄患者病歷。

## Core Value

讓醫療專業人員能夠通過視覺化解剖圖進行疾病記錄和管理。

## Requirements

### Validated

- ✓ 牙齒系統 (32 永久牙 + 20 乳牙) — 現有
- ✓ 眼睛系統 (26 個結構標籤) — 現有
- ✓ 身體系統 (6 部位 + 41 種疾病) — 現有
- ✓ 疾病診斷表單 (ICD-10 編碼) — 現有
- ✓ 患者病歷管理 (localStorage 持久化) — 現有
- ✓ 多語言支持 (中/英) — 現有

### Active

- [ ] 數據導出功能 (PDF/CSV)
- [ ] 系統間數據交叉分析
- [ ] 患者綜合病歷統計
- [ ] 用戶權限管理

### Out of Scope

- 後端服務器 — 純客戶端應用
- 多人協作 — 單機使用

## Context

現有系統為單頁 HTML 應用，使用原生 JavaScript 和 localStorage。包含多個獨立的解剖系統模組。

## Constraints

- **技術**: HTML5 + JavaScript + CSS3，無框架
- **存儲**: localStorage (客戶端)
- **目標用戶**: 醫學生、牙科/眼科/身體健康專業人員

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| 選擇器面板方式 | 簡化座標映射，降低複雜度 | ✓ Good |
| 單機存儲架構 | 無需服務器，快速部署 | ✓ Good |

---
*Last updated: 2026-02-25 after project initialization*
