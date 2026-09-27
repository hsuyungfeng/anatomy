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
- 座標映射複雜，難以精確

## Solution

**已決定：放棄自動識別，改用手動選擇**

1. 已實作樹狀結構手動選擇器（renderManualBodySelector）
2. 當點擊無法自動識別時，顯示下拉選單讓使用者手動選擇部位
3. 放棄複雜的座標映射計算

未來可以考慮：
- 使用影像辨識 AI 來識別身體部位
- 聘請專業美術根據實際圖片重新繪製對應的座標

## 結案（2026-09-27）

已改用手動選擇器；根本解法規劃在「結構化 SVG 解剖圖」階段。

