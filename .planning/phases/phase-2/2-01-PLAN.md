---
phase: phase-2
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - index.html
  - assets/scripts/main.js
  - assets/styles/main.css
autonomous: true
requirements:
  - STAT-01
  - STAT-02
  - STAT-03

must_haves:
  truths:
    - "用戶可以在儀表板看到疾病發生頻率統計"
    - "用戶可以按時間範圍篩選數據"
    - "用戶可以看到圖表化的統計結果"
  artifacts:
    - path: "index.html"
      provides: "儀表板 UI 容器"
      contains: "statistics-panel"
    - path: "assets/scripts/main.js"
      provides: "統計數據計算"
      contains: "getDiseaseStatistics"
    - path: "assets/scripts/chart.js"
      provides: "圖表渲染"
      contains: "Chart"
---

<objective>
實現病歷數據分析儀表板功能，包括疾病頻率統計、時間範圍篩選、圖表展示。
</objective>

<context>
@.planning/ROADMAP.md
@.planning/REQUIREMENTS.md

現有系統已有病歷數據保存在 localStorage，需要添加統計分析功能。
</context>

<tasks>

<task type="auto">
  <name>添加統計面板 UI</name>
  <files>index.html, assets/styles/main.css</files>
  <action>
在 index.html 的右側面板添加「統計分析」標籤頁，包含：
- 疾病頻率統計區域
- 時間範圍篩選器
- 圖表展示區域（長條圖、圓餅圖）

在 main.css 添加相應樣式。
  </action>
  <verify>
檢查 index.html 包含 statistics-panel 元素
  </verify>
  <done>
儀表板 UI 元素已添加到頁面
</done>
</task>

<task type="auto">
  <name>實現統計數據計算</name>
  <files>assets/scripts/main.js</files>
  <action>
添加 getDiseaseStatistics() 方法：
- 從 localStorage 讀取所有病歷數據
- 計算每種疾病的發生次數
- 按時間範圍篩選數據
- 返回統計結果對象

確保與現有 recordManager 整合。
  </action>
  <verify>
方法存在且返回正確的統計數據結構
  </verify>
  <done>
統計數據可從病歷中計算出來
</done>
</task>

<task type="auto">
  <name>實現圖表渲染</name>
  <files>assets/scripts/chart.js, assets/scripts/main.js</files>
  <action>
創建 chart.js 使用 Chart.js 庫：
- 實現疾病頻率長條圖
- 實現疾病分佈圓餅圖
- 實現時間範圍篩選功能
- 圖表響應式設計

在 main.js 中調用圖表渲染方法。
  </action>
  <verify>
圖表正確顯示疾病統計數據
  </verify>
  <done>
圖表可以視覺化展示疾病數據
</done>
</task>

</tasks>

<verification>
用戶可以：
1. 打開統計分析面板
2. 看到疾病頻率長條圖
3. 看到疾病分佈圓餅圖
4. 使用時間範圍篩選
</verification>

<success_criteria>
- 顯示疾病分佈統計
- 支援時間範圍篩選
- 視覺化圖表正確渲染
</success_criteria>

<output>
完成後創建 .planning/phases/phase-2/2-01-SUMMARY.md
</output>
