---
created: 2026-02-26T03:57:54.201Z
title: 身體圖像位置點擊座標不正確
area: ui
files:
  - assets/scripts/image-annotator.js
  - assets/scripts/main.js:1969
  - assets/scripts/body-image-mapper.js:69
---

## Problem

身體圖像與位置點取後座標不正確。例如：點擊 face point，但記錄的位置和顯示的位置不正確。

**具體問題：**
- 點擊出現位置與圖像要相符
- Face point 點擊位置與實際記錄位置偏移
- 圖像縮放/平移時座標計算錯誤

## Solution

TBD - 需要調查
1. 檢查 image-annotator.js 中 getClickPosition 邏輯
2. 檢查 zoom/pan 影響
3. 測試不同身體區域的點擊準確度
4. 驗證 annotation 位置與點擊位置一致性
