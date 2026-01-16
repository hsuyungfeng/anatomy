# 身體系統實現計畫
**日期:** 2026-01-15
**狀態:** 📋 規劃中
**優先級:** 🔴 高

---

## 📌 概述

實現完整的身體系統（Body System）功能，整合到現有的解剖學習應用中。基於已驗證的眼睛系統架構，複用標籤頁設計模式。

**核心目標：**
- 支持 8 個基本身體部位（頭、頸、胸、腹、左臂、右臂、左腿、右腿）
- 疾病記錄與 ICD-10 對照集成
- 系統隔離顯示（身體系統記錄獨立於牙科/眼科）
- localStorage 持久化
- 100% 自動化測試覆蓋

---

## 🎯 實現步驟

### 第 1 步：創建數據文件

**檔案:** `data/body-systems.json`

**內容：** 定義 8 個身體部位、常見疾病、ICD-10 對照

```json
{
  "bodyRegions": [
    {
      "id": "head",
      "nameZh": "頭部",
      "nameEn": "Head",
      "side": "mid",
      "commonDiseases": {
        "skin": ["脂漏性皮膚炎", "頭皮癬", "毛囊炎"],
        "subcutaneous": ["皮下囊腫", "血腫"]
      }
    },
    // ... 更多部位
  ]
}
```

**預期結果：** ✅ JSON 檔案生成，8 個部位完整定義

---

### 第 2 步：修改 HTML 結構

**檔案:** `index.html`

**修改內容：**
1. 添加身體系統標籤頁 (與牙齒系統同級)
2. 添加身體部位選擇子標籤頁 (8 個按鈕: 頭、頸、胸、腹、左臂、右臂、左腿、右腿)
3. 添加病例記錄子標籤頁
4. 添加 bodysurface.png 影像參考區

**新增代碼行數:** ~50-60 行

**預期結果：** ✅ 身體系統標籤頁與子標籤頁正確顯示

---

### 第 3 步：添加 CSS 樣式

**檔案:** `assets/styles/modal.css`

**新增內容：**
- 身體部位按鈕樣式 (.body-region-btn)
- 身體部位網格佈局 (.body-region-grid)
- 身體結構信息樣式 (.body-structure-info)
- 病例列表樣式 (.body-records-list, .record-group)

**新增代碼行數:** ~80-100 行

**預期結果：** ✅ 身體系統 UI 美觀清晰，按鈕有懸停效果

---

### 第 4 步：實現 JavaScript 邏輯

**檔案:** `assets/scripts/main.js`

**新增 10 個核心方法：**

| 方法 | 功能 |
|------|------|
| `setupBodyRegionButtonListeners()` | 初始化 8 個按鈕事件監聽 |
| `openDiseaseModalWithBodyRegion()` | 打開疾病記錄模態（複用現有邏輯） |
| `displayBodyStructureInfo()` | 顯示身體位置信息 |
| `loadBodyRegionDiseases()` | 動態加載該部位的常見疾病 |
| `saveDiseaseAnnotation()` | 儲存身體系統疾病記錄 |
| `saveMedicalRecord()` | 保存到 localStorage |
| `loadMedicalRecords()` | 從 localStorage 加載 |
| `filterRecordsBySystem()` | 系統隔離過濾 |
| `loadAndDisplayRecords()` | 加載並顯示身體系統記錄 |
| `groupRecordsByBodyPart()` | 按身體部位分組 |
| `displayBodyRecords()` | 渲染病例列表 |
| `getChineseBodyRegionName()` | 取得中文部位名稱 |
| `getEnglishBodyRegionName()` | 取得英文部位名稱 |

**新增代碼行數:** ~200-250 行

**預期結果：** ✅ 點擊部位按鈕 → 打開疾病模態 → 自動載入疾病清單 → 保存記錄

---

### 第 5 步：集成 ICD-10 對照

**檔案:** `assets/scripts/main.js`

**新增內容：**
```javascript
const bodyDiseaseICD = {
  '脂漏性皮膚炎': 'L21.9',
  '頭皮癬': 'B35.0',
  // ... 14+ 疾病對照
};
```

**預期結果：** ✅ 疾病記錄帶有 ICD-10 代碼

---

### 第 6 步：系統切換邏輯

**檔案:** `assets/scripts/main.js`

**修改內容：**
- 更新 `handleSystemChange()` 方法，支持身體系統
- 確保標籤頁切換時自動加載對應系統的記錄

**預期結果：** ✅ 標籤頁切換流暢，記錄隔離正確

---

### 第 7 步：瀏覽器功能驗證

**驗證流程：**
1. 點擊「身體系統」標籤頁 → 面板顯示
2. 點擊「左臂」按鈕 → 疾病模態打開，顯示「左臂」信息
3. 勾選疾病 (如「蚊蟲叮咬」) + 輸入備註
4. 點擊「儲存」→ 成功提示
5. 切換到其他系統再切回 → 記錄仍存在（localStorage 驗證）
6. 檢查病例列表 → 按部位分組，時間倒序

**預期結果：** ✅ 所有功能正常運作，無控制台錯誤

---

### 第 8 步：自動化測試

**檔案：** `test-body-system-integration.js`

**測試覆蓋：**
- HTML 結構驗證 (8 個按鈕存在)
- JavaScript 方法驗證 (13 個方法完整)
- CSS 樣式驗證 (5+ 個類別)
- 邏輯驗證 (部位名稱映射、疾病加載)
- 功能流程驗證 (點擊 → 保存 → 顯示)
- 系統隔離驗證 (記錄正確過濾)

**目標:** 100% 通過 (35+ 項測試)

**預期結果：** ✅ 全部測試通過

---

### 第 9 步：文檔與提交

**新增文件：**
- `BODY_SYSTEM_IMPLEMENTATION_GUIDE.md` - 使用指南

**修改檔案：**
- `progress.md` - 更新 Phase 7 進度

**Git 提交：**
```bash
1. git add data/body-systems.json
   commit: "feat: 新增身體系統部位定義與疾病映射"

2. git add index.html
   commit: "feat: 添加身體系統標籤頁 HTML 結構"

3. git add assets/styles/modal.css
   commit: "feat: 添加身體系統樣式"

4. git add assets/scripts/main.js
   commit: "feat: 實現身體系統核心邏輯 (13 個方法)"

5. git add test-body-system-integration.js
   commit: "test: 身體系統整合測試"

6. git add progress.md BODY_SYSTEM_IMPLEMENTATION_GUIDE.md
   commit: "docs: Phase 7 身體系統開發完成"
```

**預期結果：** ✅ 代碼提交到 Git

---

## 📊 實現工作量

| 項目 | 工作量 | 文件 |
|------|--------|------|
| 數據定義 | 15 分鐘 | body-systems.json |
| HTML 修改 | 20 分鐘 | index.html |
| CSS 樣式 | 25 分鐘 | modal.css |
| JavaScript 實現 | 90 分鐘 | main.js |
| 瀏覽器測試 | 30 分鐘 | 手動驗證 |
| 自動化測試 | 45 分鐘 | test-body-system-integration.js |
| 文檔與提交 | 20 分鐘 | 文檔 + Git |
| **總計** | **4.5 小時** | - |

---

## ✅ 驗收標準

- [ ] 數據檔案完整，8 個部位定義清晰
- [ ] HTML 標籤頁結構正確，8 個按鈕可見
- [ ] CSS 樣式美觀，按鈕有懸停效果
- [ ] JavaScript 邏輯完整，13 個方法正常運作
- [ ] 點擊按鈕 → 疾病模態 → 保存 → 顯示 完整流程
- [ ] 自動化測試 100% 通過
- [ ] localStorage 持久化驗證通過
- [ ] 系統隔離正確（身體/牙齒/眼睛記錄不混雜）
- [ ] 無 JavaScript 控制台錯誤
- [ ] Git 提交完成，6 個提交清晰

---

## 📌 參考資源

**已驗證的相似實現：**
- 眼睛系統架構 (Phase 6): `assets/scripts/main.js` 第 226-398 行
- 系統過濾邏輯 (Phase 6+): `assets/scripts/main.js` 第 1713-1736 行
- CSS 樣式範例: `assets/styles/modal.css` (眼睛結構信息樣式)

**相關數據文件：**
- `data/anatomical-systems.json` - 現有系統定義格式參考
- `data/dental-coordinates.json` - ICD 對照格式參考

---

**下一步：** 依照上述步驟逐一實現 ✅

