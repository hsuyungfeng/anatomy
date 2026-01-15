# 眼睛系統功能改進計畫

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**目標：** 修復眼睛系統的三個關鍵問題：移除眼睛選擇器、修復病例保存、實現時間戳分組。

**架構：**
1. 移除左右眼選擇按鈕（簡化UI）
2. 調試並修復疾病記錄保存邏輯
3. 實現同位置多筆記錄的時間戳分組顯示

**技術棧：** HTML5, CSS3, Vanilla JavaScript (ES6+), JSON 數據結構

---

## Task 6A: 刪除左右眼選擇器

**文件：**
- Modify: `index.html:118-140` (眼睛選擇器容器)

**步驟：**

**Step 1: 找到眼睛選擇器代碼**

在 `index.html` 中找到：
```html
<!-- 眼睛選擇器（僅在眼睛系統標籤中顯示） -->
<div class="eye-selector-container" id="eye-selector-container">
  <div class="eye-selector">
    <button id="left-eye-btn" class="eye-btn" data-eye="left" ...>👁️ 左眼</button>
    <button id="right-eye-btn" class="eye-btn active" data-eye="right" ...>👁️ 右眼</button>
  </div>
</div>
```

**Step 2: 刪除整個眼睛選擇器容器**

移除上面的整個 `<div class="eye-selector-container">...  </div>` 區塊（包括開始和結束標籤）。

**Step 3: 驗證**

確認 HTML 結構仍然有效，且眼睛標籤面板在下方。

**Step 4: 提交**

```bash
git add index.html
git commit -m "refactor: 移除眼睛系統的左右眼選擇器

- 刪除 eye-selector-container 和相關按鈕
- 簡化眼睛系統 UI
- 用戶直接從標籤面板選擇結構"
```

---

## Task 6B: 修復病例列表填入問題

**文件：**
- Read: `assets/scripts/main.js` (尋找疾病記錄保存邏輯)
- Modify: `assets/scripts/main.js` (修復保存邏輯)

**背景信息：**
用戶反饋病例列表（疾病記錄）無法成功填入。需要調試並找出問題。

**Step 1: 分析疾病記錄保存流程**

在 `main.js` 中尋找：
- `openDiseaseModalWithStructure()` 方法
- `diseaseForm.render()` 方法
- 病例保存的事件監聽（通常在 modal 的「儲存」按鈕）

**Step 2: 檢查保存邏輯**

尋找類似代碼：
```javascript
// 應該找到的病例保存邏輯
const saveBtn = $('#modal-save-btn');
saveBtn.addEventListener('click', async () => {
  // 保存邏輯
});
```

**Step 3: 識別問題**

常見的保存問題：
- 表單數據未正確收集
- 疾病表單對象未正確初始化
- 保存後未清除表單或關閉模態視窗
- currentEyeStructure 未正確保存

**Step 4: 實現修復**

確保以下邏輯：
```javascript
// 在模態視窗儲存按鈕點擊時
const saveBtn = $('#modal-save-btn');
if (saveBtn) {
  saveBtn.addEventListener('click', async (e) => {
    e.preventDefault();

    // 1. 從表單收集數據
    const diseaseData = await this.diseaseForm.getData();

    // 2. 驗證是否有選擇疾病
    if (!diseaseData || !diseaseData.disease) {
      console.warn('未選擇疾病');
      alert('請選擇疾病');
      return;
    }

    // 3. 創建完整的病例記錄
    const medicalRecord = {
      timestamp: new Date().toISOString(),
      system: this.currentSystemId,
      structure: this.currentEyeStructure,
      disease: diseaseData,
      notes: diseaseData.notes || ''
    };

    // 4. 保存到本地存儲
    this.saveMedicalRecord(medicalRecord);

    // 5. 更新 UI（重新載入記錄列表）
    await this.loadMedicalRecords();

    // 6. 關閉模態視窗
    this.closeDiseaseModal();

    // 7. 顯示成功信息
    console.log('✅ 病例已保存:', medicalRecord);
    alert('病例已成功保存');
  });
}
```

**Step 5: 測試保存功能**

- 打開眼睛系統
- 點擊一個標籤
- 選擇疾病並填入信息
- 點擊「儲存」按鈕
- 驗證病例是否出現在列表中

**Step 6: 提交**

```bash
git add assets/scripts/main.js
git commit -m "fix: 修復病例列表保存問題

- 完善疾病記錄保存邏輯
- 確保表單數據正確收集和驗證
- 保存後正確更新 UI
- 添加成功/失敗反饋提示"
```

---

## Task 6C: 實現同位置多時間紀錄分組

**文件：**
- Modify: `assets/scripts/main.js` (添加分組和排序邏輯)
- Modify: `index.html` (病例列表 HTML 結構)
- Modify: `assets/styles/main.css` (病例時間戳樣式)

**需求分析：**
同一眼睛結構（如「左眼角膜」）可能有多筆不同時間的病例記錄。需要：
1. 按結構位置分組
2. 每組內按時間排序（最新在前）
3. 顯示每筆記錄的時間戳

**Step 1: 修改病例列表 HTML 結構**

在 `index.html` 中找到病例列表容器（通常在右側面板）：

```html
<!-- 病例列表區域 -->
<div id="medical-records-container" class="medical-records">
  <h3>病例記錄</h3>
  <div id="records-list" class="records-list">
    <!-- 病例將動態生成在此 -->
  </div>
</div>
```

**Step 2: 添加分組的 HTML 結構**

每個結構位置應該有一個群組容器：

```html
<div class="record-group">
  <h4 class="record-group__header">
    <span class="structure-name">角膜</span>
    <span class="structure-location">左眼</span>
  </h4>
  <div class="record-group__items">
    <div class="record-item">
      <div class="record-item__timestamp">2026-01-15 10:30:45</div>
      <div class="record-item__disease">結膜炎 - 病毒性</div>
      <div class="record-item__notes">患者主訴眼睛癢</div>
    </div>
    <div class="record-item">
      <div class="record-item__timestamp">2026-01-14 09:15:20</div>
      <div class="record-item__disease">乾眼症</div>
      <div class="record-item__notes">用眼過度</div>
    </div>
  </div>
</div>
```

**Step 3: 實現 JavaScript 分組邏輯**

在 `main.js` 中添加方法：

```javascript
/**
 * 按結構位置對病例進行分組
 * @param {Array} records - 所有病例記錄
 * @returns {Object} 按結構分組的病例對象
 */
groupRecordsByStructure(records) {
  const grouped = {};

  records.forEach(record => {
    const structureId = record.structure.structureId;
    const structureName = record.structure.name;
    const structureSide = record.structure.side;

    const groupKey = `${structureId}`;

    if (!grouped[groupKey]) {
      grouped[groupKey] = {
        structureId,
        structureName,
        structureSide,
        records: []
      };
    }

    grouped[groupKey].records.push(record);
  });

  // 每組內按時間排序（最新在前）
  Object.values(grouped).forEach(group => {
    group.records.sort((a, b) => {
      return new Date(b.timestamp) - new Date(a.timestamp);
    });
  });

  return grouped;
}

/**
 * 格式化時間戳為可讀格式
 * @param {string} isoString - ISO 格式的時間戳
 * @returns {string} 格式化後的時間字符串
 */
formatTimestamp(isoString) {
  const date = new Date(isoString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

/**
 * 渲染分組的病例列表
 * @param {Object} groupedRecords - 按結構分組的病例
 */
renderGroupedRecords(groupedRecords) {
  const container = $('#records-list');
  if (!container) return;

  container.innerHTML = '';

  Object.entries(groupedRecords).forEach(([, group]) => {
    const groupDiv = document.createElement('div');
    groupDiv.className = 'record-group';

    // 群組標題
    const headerDiv = document.createElement('h4');
    headerDiv.className = 'record-group__header';
    headerDiv.innerHTML = `
      <span class="structure-name">${group.structureName}</span>
      <span class="structure-location">${
        group.structureSide === 'left' ? '左眼' :
        group.structureSide === 'right' ? '右眼' :
        '雙眼'
      }</span>
    `;
    groupDiv.appendChild(headerDiv);

    // 記錄項目
    const itemsDiv = document.createElement('div');
    itemsDiv.className = 'record-group__items';

    group.records.forEach(record => {
      const itemDiv = document.createElement('div');
      itemDiv.className = 'record-item';

      const timestamp = this.formatTimestamp(record.timestamp);
      const diseaseText = record.disease.name +
        (record.disease.subcategory ? ` - ${record.disease.subcategory}` : '');
      const notes = record.notes || '';

      itemDiv.innerHTML = `
        <div class="record-item__timestamp">⏰ ${timestamp}</div>
        <div class="record-item__disease">🏥 ${diseaseText}</div>
        ${notes ? `<div class="record-item__notes">📝 ${notes}</div>` : ''}
      `;

      itemsDiv.appendChild(itemDiv);
    });

    groupDiv.appendChild(itemsDiv);
    container.appendChild(groupDiv);
  });
}

/**
 * 加載並顯示病例記錄
 */
async loadAndDisplayRecords() {
  const records = this.loadMedicalRecords();

  if (!records || records.length === 0) {
    const container = $('#records-list');
    if (container) {
      container.innerHTML = '<p class="empty-message">暫無病例記錄</p>';
    }
    return;
  }

  // 分組
  const grouped = this.groupRecordsByStructure(records);

  // 渲染
  this.renderGroupedRecords(grouped);

  console.log(`[loadAndDisplayRecords] 已加載 ${records.length} 筆病例，分為 ${Object.keys(grouped).length} 個結構組`);
}
```

**Step 4: 添加 CSS 樣式**

在 `assets/styles/main.css` 或 `modal.css` 末尾添加：

```css
/* 病例分組列表 */
.record-group {
  margin-bottom: 20px;
  border: 1px solid #ddd;
  border-radius: 4px;
  overflow: hidden;
}

.record-group__header {
  margin: 0;
  padding: 12px 15px;
  background: #e8f4f8;
  border-bottom: 2px solid #0066cc;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.95em;
  font-weight: 600;
  color: #333;
}

.structure-name {
  font-weight: 700;
  color: #0066cc;
}

.structure-location {
  background: #0066cc;
  color: white;
  padding: 2px 8px;
  border-radius: 3px;
  font-size: 0.8em;
  font-weight: 500;
}

.record-group__items {
  background: white;
}

.record-item {
  padding: 12px 15px;
  border-bottom: 1px solid #eee;
  font-size: 0.9em;
}

.record-item:last-child {
  border-bottom: none;
}

.record-item__timestamp {
  font-weight: 600;
  color: #0066cc;
  margin-bottom: 6px;
  font-size: 0.85em;
}

.record-item__disease {
  color: #333;
  margin-bottom: 4px;
  font-weight: 500;
}

.record-item__notes {
  color: #666;
  font-size: 0.85em;
  margin-top: 4px;
  padding-top: 4px;
  border-top: 1px solid #f0f0f0;
}

.empty-message {
  text-align: center;
  color: #999;
  padding: 20px;
  font-size: 0.9em;
}
```

**Step 5: 集成到保存流程**

修改 `openDiseaseModalWithStructure()` 中的保存邏輯，保存後調用 `loadAndDisplayRecords()`。

**Step 6: 測試分組顯示**

1. 打開眼睛系統
2. 點擊同一個標籤多次，添加多筆病例
3. 驗證病例列表：
   - 按結構分組
   - 同組內按時間排序（最新在前）
   - 每筆記錄顯示完整時間戳

**Step 7: 提交**

```bash
git add assets/scripts/main.js index.html assets/styles/main.css
git commit -m "feat: 實現病例時間戳分組顯示

- 按眼睛結構分組病例記錄
- 同組內按時間排序（最新在前）
- 每筆記錄顯示完整時間戳 (YYYY-MM-DD HH:mm:ss)
- 添加分組列表的視覺樣式（顏色、邊框、間距）
- 改善病例列表的可讀性和易用性"
```

---

## 驗收標準

✅ **Task 6A - 移除眼睛選擇器：**
- 左眼和右眼選擇按鈕已移除
- UI 更簡潔，用戶直接從標籤面板選擇

✅ **Task 6B - 修復病例保存：**
- 疾病記錄能正確保存
- 保存後顯示成功提示
- 病例列表自動更新

✅ **Task 6C - 時間戳分組：**
- 病例按結構分組
- 同組內按時間排序（最新在前）
- 每筆記錄顯示完整時間戳
- 視覺效果清晰美觀

