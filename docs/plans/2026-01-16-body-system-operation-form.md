# 身體系統操作/治療記錄表單改造計劃

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 為身體系統實現操作/治療記錄表單，替代疾病分類表單，允許用戶記錄在特定身體部位進行的醫療操作、治療或程序。

**Architecture:**
創建獨立的 `BodyOperationForm` 類用於處理身體系統的操作記錄，包含側邊選擇器（左/中/右）和自由文本欄位。
當用戶點擊身體圖片時，動態生成針對該部位的操作表單（區別於牙齒/眼睛的疾病表單）。
操作記錄存儲為結構化 JSON，包含部位、側邊、操作類型、描述和時間戳。

**Tech Stack:**
- JavaScript ES6+ 類
- HTML5 表單和 ARIA 屬性
- LocalStorage for persistence
- CSS 網格和 Flexbox 佈局

---

## Task 1: 創建 BodyOperationForm 類框架

### Files
- Create: `assets/scripts/body-operation-form.js` - 新的操作表單類
- Modify: `assets/scripts/main.js` - 集成新表單類
- Modify: `index.html` - 添加操作表單容器

### Step 1: 創建新的 BodyOperationForm 類

在 `assets/scripts/body-operation-form.js` 中：

```javascript
/**
 * 身體系統操作/治療記錄表單
 * 用於記錄在特定身體部位進行的醫療操作、治療或程序
 */
class BodyOperationForm {
  constructor() {
    this.currentRegion = null;
    this.operationTypes = [
      { id: 'surgery', name: '手術', name_en: 'Surgery' },
      { id: 'therapy', name: '治療', name_en: 'Therapy' },
      { id: 'procedure', name: '程序', name_en: 'Procedure' },
      { id: 'examination', name: '檢查', name_en: 'Examination' },
      { id: 'medication', name: '用藥', name_en: 'Medication' },
      { id: 'other', name: '其他', name_en: 'Other' }
    ];
    this.currentLanguage = 'zh';
  }

  /**
   * 初始化表單
   */
  init() {
    console.log('[BodyOperationForm] 初始化操作表單');
    this.currentLanguage = document.documentElement.lang === 'en' ? 'en' : 'zh';
  }

  /**
   * 為指定的身體部位生成操作表單 HTML
   * @param {Object} region - 身體部位信息 {id, name, name_en, side}
   * @returns {string} - 表單 HTML
   */
  generateFormHTML(region) {
    this.currentRegion = region;
    const sideDisplay = this.getSideDisplay(region.side);
    const regionName = this.currentLanguage === 'zh' ? region.name : region.name_en;

    return `
      <div class="body-operation-form">
        <!-- 部位信息和側邊選擇 -->
        <div class="operation-form__header">
          <h3 class="operation-form__title">
            ${regionName}
            <span class="operation-form__side">${sideDisplay}</span>
          </h3>

          <div class="operation-form__side-selector">
            <label class="operation-form__side-label">
              ${this.currentLanguage === 'zh' ? '側邊：' : 'Side:'}
            </label>
            <div class="side-buttons">
              <button class="side-btn ${region.side === 'left' ? 'active' : ''}" data-side="left">
                ${this.currentLanguage === 'zh' ? '左' : 'Left'}
              </button>
              <button class="side-btn ${region.side === 'mid' ? 'active' : ''}" data-side="mid">
                ${this.currentLanguage === 'zh' ? '中' : 'Mid'}
              </button>
              <button class="side-btn ${region.side === 'right' ? 'active' : ''}" data-side="right">
                ${this.currentLanguage === 'zh' ? '右' : 'Right'}
              </button>
            </div>
          </div>
        </div>

        <!-- 操作類型選擇 -->
        <div class="operation-form__section">
          <label class="operation-form__label">
            ${this.currentLanguage === 'zh' ? '操作類型' : 'Operation Type'}
            <span class="required">*</span>
          </label>
          <div class="operation-type-grid">
            ${this.operationTypes.map(type => `
              <label class="operation-type-item">
                <input
                  type="radio"
                  name="operation-type"
                  value="${type.id}"
                  class="operation-type-input"
                >
                <span class="operation-type-label">
                  ${this.currentLanguage === 'zh' ? type.name : type.name_en}
                </span>
              </label>
            `).join('')}
          </div>
        </div>

        <!-- 操作描述文本框 -->
        <div class="operation-form__section">
          <label class="operation-form__label">
            ${this.currentLanguage === 'zh' ? '操作描述' : 'Description'}
            <span class="required">*</span>
          </label>
          <textarea
            class="operation-description"
            placeholder="${this.currentLanguage === 'zh' ? '詳細記錄進行的操作、治療或程序...' : 'Describe the operation, treatment or procedure...'}"
            rows="6"
          ></textarea>
          <div class="character-count">
            <span class="current-count">0</span>/<span class="max-count">500</span>
          </div>
        </div>

        <!-- 醫生備註 -->
        <div class="operation-form__section">
          <label class="operation-form__label">
            ${this.currentLanguage === 'zh' ? '醫生備註（可選）' : 'Doctor Notes (Optional)'}
          </label>
          <textarea
            class="operation-notes"
            placeholder="${this.currentLanguage === 'zh' ? '額外備註或觀察...' : 'Additional notes or observations...'}"
            rows="3"
          ></textarea>
        </div>
      </div>
    `;
  }

  /**
   * 獲取側邊顯示文本
   * @param {string} side - left, mid, right
   * @returns {string}
   */
  getSideDisplay(side) {
    const sideMap = {
      'left': this.currentLanguage === 'zh' ? '左側' : 'Left',
      'mid': this.currentLanguage === 'zh' ? '中央' : 'Center',
      'right': this.currentLanguage === 'zh' ? '右側' : 'Right'
    };
    return sideMap[side] || '';
  }

  /**
   * 驗證表單數據
   * @returns {Object} - {valid: boolean, errors: []}
   */
  validateForm() {
    const errors = [];
    const operationType = document.querySelector('input[name="operation-type"]:checked');
    const description = document.querySelector('.operation-description').value.trim();

    if (!operationType) {
      errors.push(this.currentLanguage === 'zh' ? '請選擇操作類型' : 'Please select operation type');
    }

    if (!description) {
      errors.push(this.currentLanguage === 'zh' ? '請輸入操作描述' : 'Please enter operation description');
    }

    if (description.length > 500) {
      errors.push(this.currentLanguage === 'zh' ? '操作描述不超過 500 字' : 'Description must not exceed 500 characters');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * 收集表單數據
   * @returns {Object} - 操作記錄對象
   */
  getFormData() {
    const side = document.querySelector('.side-btn.active')?.dataset.side || this.currentRegion.side;
    const operationType = document.querySelector('input[name="operation-type"]:checked').value;
    const description = document.querySelector('.operation-description').value.trim();
    const notes = document.querySelector('.operation-notes').value.trim();

    return {
      regionId: this.currentRegion.id,
      regionName: this.currentRegion.name,
      regionNameEn: this.currentRegion.name_en,
      side: side,
      operationType: operationType,
      description: description,
      notes: notes,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * 設置側邊按鈕的點擊事件
   */
  setupSideButtonListeners(callback) {
    const sideButtons = document.querySelectorAll('.side-btn');
    sideButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        sideButtons.forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        if (callback) callback(e.target.dataset.side);
      });
    });
  }

  /**
   * 設置文本計數器
   */
  setupCharacterCounter() {
    const textarea = document.querySelector('.operation-description');
    const currentCount = document.querySelector('.current-count');

    if (textarea) {
      textarea.addEventListener('input', () => {
        currentCount.textContent = textarea.value.length;
      });
    }
  }

  /**
   * 清除表單
   */
  clearForm() {
    document.querySelectorAll('input[name="operation-type"]').forEach(input => {
      input.checked = false;
    });
    document.querySelector('.operation-description').value = '';
    document.querySelector('.operation-notes').value = '';
    document.querySelector('.current-count').textContent = '0';
  }
}
```

### Step 2: 在 main.js 中初始化 BodyOperationForm

在 `assets/scripts/main.js` 的 `initModules()` 方法中添加：

```javascript
// 在 class Application 中的某個地方添加
this.bodyOperationForm = new BodyOperationForm();
this.bodyOperationForm.init();
```

### Step 3: 在 index.html 中添加操作表單容器

在 `<div id="disease-form-container"></div>` 後面添加：

```html
<!-- 身體系統操作表單容器 -->
<div id="body-operation-form-container"></div>
```

### Step 4: 在 index.html 中添加腳本引用

在其他 script 標籤之後添加：

```html
<script src="assets/scripts/body-operation-form.js" defer></script>
```

### Step 5: 運行並驗證類能夠初始化

Run: `npm test` 或在瀏覽器中檢查控制台

Expected: 看到 `[BodyOperationForm] 初始化操作表單` 日志

### Step 6: 提交

```bash
git add assets/scripts/body-operation-form.js assets/scripts/main.js index.html
git commit -m "feat: 建立 BodyOperationForm 類框架

- 新增 BodyOperationForm 類用於操作/治療記錄
- 支持 6 種操作類型（手術、治療、程序等）
- 動態生成表單 HTML
- 包含側邊選擇器（左/中/右）
- 支持中英文界面"
```

---

## Task 2: 添加操作表單 CSS 樣式

### Files
- Modify: `assets/styles/modal.css` - 添加操作表單樣式
- Create: `assets/styles/body-operation-form.css` - 專用樣式文件

### Step 1: 創建操作表單樣式文件

在 `assets/styles/body-operation-form.css` 中：

```css
/* ================================================
   身體系統操作/治療記錄表單樣式
   ================================================ */

.body-operation-form {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

/* 表單頭部 */
.operation-form__header {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding-bottom: 16px;
  border-bottom: 2px solid var(--color-border);
}

.operation-form__title {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--color-text);
  display: flex;
  align-items: center;
  gap: 12px;
}

.operation-form__side {
  display: inline-block;
  padding: 4px 12px;
  background-color: #ff6b9d;
  color: white;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 500;
}

/* 側邊選擇器 */
.operation-form__side-selector {
  display: flex;
  align-items: center;
  gap: 16px;
}

.operation-form__side-label {
  font-weight: 500;
  color: var(--color-text);
  min-width: 60px;
}

.side-buttons {
  display: flex;
  gap: 8px;
}

.side-btn {
  padding: 8px 16px;
  border: 2px solid var(--color-border);
  border-radius: 6px;
  background: white;
  color: var(--color-text);
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  min-width: 70px;
}

.side-btn:hover {
  border-color: #ff6b9d;
  background-color: #ffe0ed;
}

.side-btn.active {
  background-color: #ff6b9d;
  color: white;
  border-color: #ff6b9d;
}

/* 表單區塊 */
.operation-form__section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.operation-form__label {
  font-weight: 600;
  color: var(--color-text);
  font-size: 15px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.required {
  color: #e74c3c;
  font-size: 1.2em;
}

/* 操作類型網格 */
.operation-type-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 12px;
}

.operation-type-item {
  display: flex;
  align-items: center;
  padding: 12px;
  border: 2px solid var(--color-border);
  border-radius: 6px;
  background: white;
  cursor: pointer;
  transition: all 0.2s ease;
}

.operation-type-item:hover {
  border-color: #ff6b9d;
  background-color: #ffe0ed;
}

.operation-type-input {
  margin-right: 8px;
  cursor: pointer;
  width: 16px;
  height: 16px;
  accent-color: #ff6b9d;
}

.operation-type-input:checked + .operation-type-label {
  color: #ff6b9d;
  font-weight: 600;
}

.operation-type-label {
  cursor: pointer;
  color: var(--color-text);
}

/* 文本框樣式 */
.operation-description,
.operation-notes {
  padding: 12px;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  font-family: inherit;
  font-size: 14px;
  color: var(--color-text);
  resize: vertical;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.operation-description:focus,
.operation-notes:focus {
  outline: none;
  border-color: #ff6b9d;
  box-shadow: 0 0 0 3px rgba(255, 107, 157, 0.1);
}

.operation-description::placeholder,
.operation-notes::placeholder {
  color: var(--color-text-secondary);
}

/* 字符計數器 */
.character-count {
  display: flex;
  justify-content: flex-end;
  font-size: 12px;
  color: var(--color-text-secondary);
  gap: 4px;
}

.current-count {
  font-weight: 600;
  color: var(--color-text);
}

/* 響應式設計 */
@media (max-width: 768px) {
  .operation-type-grid {
    grid-template-columns: repeat(auto-fit, minmax(110px, 1fr));
    gap: 8px;
  }

  .operation-form__side-selector {
    flex-direction: column;
    align-items: flex-start;
  }

  .side-buttons {
    width: 100%;
  }

  .side-btn {
    flex: 1;
  }

  .operation-form__title {
    flex-wrap: wrap;
  }
}

/* 暗色模式支持 */
@media (prefers-color-scheme: dark) {
  .body-operation-form {
    color: white;
  }

  .side-btn,
  .operation-type-item {
    background-color: var(--color-surface);
    border-color: rgba(255, 255, 255, 0.1);
  }

  .side-btn.active {
    background-color: #ff6b9d;
    color: white;
  }

  .operation-description,
  .operation-notes {
    background-color: rgba(255, 255, 255, 0.05);
    color: white;
    border-color: rgba(255, 255, 255, 0.1);
  }
}
```

### Step 2: 在 index.html 中添加 CSS 引用

在 `<link rel="stylesheet" href="assets/styles/modal.css">` 後面添加：

```html
<link rel="stylesheet" href="assets/styles/body-operation-form.css">
```

### Step 3: 運行並在瀏覽器中檢查樣式

Open: `http://localhost:8000` 並查看樣式是否正確應用

### Step 4: 提交

```bash
git add assets/styles/body-operation-form.css index.html
git commit -m "style: 添加身體系統操作表單 CSS 樣式

- 操作類型選擇網格布局
- 側邊選擇按鈕樣式
- 文本框和標籤樣式
- 字符計數器樣式
- 響應式設計和暗色模式支持"
```

---

## Task 3: 集成操作表單到主應用

### Files
- Modify: `assets/scripts/main.js` - 修改疾病表單邏輯以支持身體系統的操作表單

### Step 1: 修改 openDiseaseModal 方法以支持身體系統

在 `assets/scripts/main.js` 的 `openDiseaseModal` 方法中添加邏輯：

```javascript
/**
 * 打開疾病記錄或操作記錄模態視窗
 */
openDiseaseModal(position) {
  const modal = document.getElementById('disease-modal');
  const locationDiv = document.getElementById('modal-location');
  const formContainer = document.getElementById('disease-form-container');
  const operationFormContainer = document.getElementById('body-operation-form-container');

  // 如果是身體系統，使用操作表單；否則使用疾病表單
  if (this.currentSystemId === 'body') {
    // 身體系統 - 使用操作表單
    const region = this.detectBodyRegion(position);
    if (!region) {
      console.warn('[openDiseaseModal] 無法檢測到身體部位');
      return;
    }

    // 更新模態標題
    document.getElementById('modal-title').textContent =
      this.currentLanguage === 'zh' ? '記錄操作/治療' : 'Record Operation/Treatment';

    // 生成位置信息
    locationDiv.innerHTML = `
      <div class="location-info">
        <span class="location-label">
          ${this.currentLanguage === 'zh' ? '身體部位：' : 'Body Part:'}
        </span>
        <span class="location-value">
          ${this.currentLanguage === 'zh' ? region.name : region.name_en}
          <span class="side-badge">${this.getSideBadge(region.side)}</span>
        </span>
      </div>
    `;

    // 生成操作表單
    const formHTML = this.bodyOperationForm.generateFormHTML(region);
    operationFormContainer.innerHTML = formHTML;
    formContainer.innerHTML = ''; // 清空疾病表單容器

    // 設置表單事件監聽
    this.bodyOperationForm.setupSideButtonListeners();
    this.bodyOperationForm.setupCharacterCounter();

  } else {
    // 其他系統 - 使用疾病表單
    operationFormContainer.innerHTML = ''; // 清空操作表單容器

    // 原有的疾病表單邏輯...
    // (保持現有代碼不變)
  }

  // 設置模態視窗
  modal.setAttribute('aria-hidden', 'false');
  // ... 其他模態設置邏輯
}
```

### Step 2: 修改保存邏輯以支持身體系統操作記錄

在 `assets/scripts/main.js` 中修改保存按鈕的事件監聽：

```javascript
setupDiseaseModal() {
  // ... 現有代碼 ...

  const saveBtn = document.getElementById('modal-save-btn');
  saveBtn.addEventListener('click', () => {
    if (this.currentSystemId === 'body') {
      this.saveBodyOperation();
    } else {
      this.saveDiseaseRecord();
    }
  });

  // ... 其他代碼 ...
}

/**
 * 保存身體系統操作記錄
 */
saveBodyOperation() {
  const validation = this.bodyOperationForm.validateForm();

  if (!validation.valid) {
    // 顯示驗證錯誤
    alert(validation.errors.join('\n'));
    return;
  }

  const operationData = this.bodyOperationForm.getFormData();

  // 保存到 LocalStorage
  let records = JSON.parse(localStorage.getItem('bodyOperationRecords') || '[]');
  records.push(operationData);
  localStorage.setItem('bodyOperationRecords', JSON.stringify(records));

  console.log('[saveBodyOperation] 操作記錄已保存', operationData);

  // 關閉模態視窗
  this.closeDiseaseModal();

  // 刷新記錄列表
  this.loadRecords();

  // 顯示成功提示（可選）
  this.showNotification(
    this.currentLanguage === 'zh' ? '操作記錄已保存' : 'Operation record saved',
    'success'
  );
}
```

### Step 3: 修改記錄顯示邏輯

在 `assets/scripts/main.js` 中修改 `loadRecords` 方法以顯示身體系統操作記錄：

```javascript
loadRecords() {
  // ... 現有代碼 ...

  if (this.currentSystemId === 'body') {
    this.displayBodyOperationRecords();
  } else {
    // 現有的牙齒/眼睛記錄邏輯...
  }
}

/**
 * 顯示身體系統操作記錄
 */
displayBodyOperationRecords() {
  const container = document.getElementById('record-list-container');
  const records = JSON.parse(localStorage.getItem('bodyOperationRecords') || '[]');

  if (records.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <p class="empty-state__text">
          ${this.currentLanguage === 'zh' ? '尚無操作記錄。點擊圖像開始記錄。' : 'No records yet. Click on the image to add.'}
        </p>
      </div>
    `;
    return;
  }

  // 按部位分組
  const groupedRecords = {};
  records.forEach(record => {
    if (!groupedRecords[record.regionId]) {
      groupedRecords[record.regionId] = [];
    }
    groupedRecords[record.regionId].push(record);
  });

  const html = Object.entries(groupedRecords).map(([regionId, regionRecords]) => {
    return `
      <div class="record-group">
        <h4 class="record-group-title">
          ${regionRecords[0].regionName}
          ${this.getSideBadge(regionRecords[0].side)}
        </h4>
        <div class="record-group-content">
          ${regionRecords.map(record => this.renderOperationRecord(record)).join('')}
        </div>
      </div>
    `;
  }).join('');

  container.innerHTML = html;
}

/**
 * 渲染單個操作記錄
 */
renderOperationRecord(record) {
  const timestamp = new Date(record.timestamp).toLocaleString(
    this.currentLanguage === 'zh' ? 'zh-TW' : 'en-US'
  );

  const operationType = this.bodyOperationForm.operationTypes.find(
    t => t.id === record.operationType
  );
  const operationName = this.currentLanguage === 'zh'
    ? operationType?.name
    : operationType?.name_en;

  return `
    <div class="record-item body-operation-record">
      <div class="record-time">${timestamp}</div>
      <div class="record-details">
        <div class="operation-type-badge">${operationName}</div>
        <div class="operation-description">${record.description}</div>
        ${record.notes ? `<div class="operation-notes">備註: ${record.notes}</div>` : ''}
      </div>
    </div>
  `;
}
```

### Step 4: 運行並測試

1. 在瀏覽器中打開應用
2. 點擊身體系統標籤
3. 點擊身體圖片的某個部位
4. 驗證操作表單是否正確顯示
5. 填寫表單並保存
6. 驗證記錄是否正確顯示

### Step 5: 提交

```bash
git add assets/scripts/main.js
git commit -m "feat: 集成身體系統操作表單到主應用

- 修改 openDiseaseModal 以支持身體系統操作表單
- 新增 saveBodyOperation 方法保存操作記錄
- 新增 displayBodyOperationRecords 方法顯示記錄
- 新增 renderOperationRecord 方法渲染記錄
- 支持按身體部位分組顯示記錄"
```

---

## Task 4: 添加操作記錄的樣式

### Files
- Modify: `assets/styles/body-operation-form.css` - 添加記錄顯示樣式

### Step 1: 添加記錄樣式

在 `assets/styles/body-operation-form.css` 的末尾添加：

```css
/* ================================================
   身體操作記錄顯示樣式
   ================================================ */

.body-operation-record {
  padding: 12px 15px;
  border-left: 4px solid #ff6b9d;
  background-color: #fff5f8;
  border-radius: 4px;
  margin-bottom: 8px;
}

.operation-type-badge {
  display: inline-block;
  padding: 4px 10px;
  background-color: #ff6b9d;
  color: white;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
  margin-bottom: 6px;
}

.body-operation-record .operation-description {
  font-size: 14px;
  color: #333;
  margin: 6px 0;
  line-height: 1.5;
}

.body-operation-record .operation-notes {
  font-size: 12px;
  color: #666;
  margin-top: 6px;
  font-style: italic;
}

/* 暗色模式 */
@media (prefers-color-scheme: dark) {
  .body-operation-record {
    background-color: rgba(255, 107, 157, 0.1);
    border-left-color: #ff6b9d;
  }

  .body-operation-record .operation-description {
    color: rgba(255, 255, 255, 0.9);
  }

  .body-operation-record .operation-notes {
    color: rgba(255, 255, 255, 0.6);
  }
}
```

### Step 2: 驗證樣式在瀏覽器中顯示正確

### Step 3: 提交

```bash
git add assets/styles/body-operation-form.css
git commit -m "style: 添加身體操作記錄顯示樣式

- 操作記錄卡片樣式
- 操作類型徽章樣式
- 記錄分組標題樣式
- 暗色模式支持"
```

---

## Task 5: 測試和錯誤處理

### Files
- Create: `test/integration/body-operation-form.test.js`
- Modify: `assets/scripts/body-operation-form.js` - 添加驗證和錯誤處理

### Step 1: 編寫集成測試

在 `test/integration/body-operation-form.test.js` 中：

```javascript
describe('BodyOperationForm', () => {
  let form;

  beforeEach(() => {
    form = new BodyOperationForm();
    form.init();
  });

  describe('表單生成', () => {
    test('應該生成包含所有必要元素的表單 HTML', () => {
      const region = { id: 'head', name: '頭部', name_en: 'Head', side: 'mid' };
      const html = form.generateFormHTML(region);

      expect(html).toContain('head');
      expect(html).toContain('左');
      expect(html).toContain('手術');
      expect(html).toContain('操作描述');
    });

    test('應該顯示正確的側邊信息', () => {
      const region = { id: 'arm', name: '臂', name_en: 'Arm', side: 'left' };
      const html = form.generateFormHTML(region);

      expect(html).toContain('左側');
    });
  });

  describe('表單驗證', () => {
    test('沒有選擇操作類型時應該驗證失敗', () => {
      const region = { id: 'head', name: '頭部', name_en: 'Head', side: 'mid' };
      form.generateFormHTML(region);

      const result = form.validateForm();
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    test('沒有輸入操作描述時應該驗證失敗', () => {
      const region = { id: 'head', name: '頭部', name_en: 'Head', side: 'mid' };
      form.generateFormHTML(region);

      // 選擇操作類型但不填寫描述
      document.querySelector('input[name="operation-type"]').checked = true;

      const result = form.validateForm();
      expect(result.valid).toBe(false);
    });

    test('超過 500 字時應該驗證失敗', () => {
      const region = { id: 'head', name: '頭部', name_en: 'Head', side: 'mid' };
      form.generateFormHTML(region);

      document.querySelector('input[name="operation-type"]').checked = true;
      document.querySelector('.operation-description').value = 'x'.repeat(501);

      const result = form.validateForm();
      expect(result.valid).toBe(false);
    });

    test('填寫完整表單時應該驗證通過', () => {
      const region = { id: 'head', name: '頭部', name_en: 'Head', side: 'mid' };
      form.generateFormHTML(region);

      document.querySelector('input[name="operation-type"]').checked = true;
      document.querySelector('.operation-description').value = '進行了頭部檢查';

      const result = form.validateForm();
      expect(result.valid).toBe(true);
    });
  });

  describe('數據收集', () => {
    test('應該正確收集表單數據', () => {
      const region = { id: 'head', name: '頭部', name_en: 'Head', side: 'mid' };
      form.generateFormHTML(region);
      form.currentRegion = region;

      document.querySelector('input[name="operation-type"]').checked = true;
      document.querySelector('input[name="operation-type"]').value = 'examination';
      document.querySelector('.operation-description').value = '進行了頭部檢查';
      document.querySelector('.operation-notes').value = '未發現異常';

      const data = form.getFormData();

      expect(data.regionId).toBe('head');
      expect(data.operationType).toBe('examination');
      expect(data.description).toBe('進行了頭部檢查');
      expect(data.notes).toBe('未發現異常');
      expect(data.timestamp).toBeDefined();
    });
  });
});
```

### Step 2: 運行測試

Run: `npm test -- test/integration/body-operation-form.test.js`

Expected: 所有測試通過

### Step 3: 提交

```bash
git add test/integration/body-operation-form.test.js
git commit -m "test: 添加身體操作表單集成測試

- 測試表單 HTML 生成
- 測試表單驗證邏輯
- 測試數據收集
- 測試多語言支持"
```

---

## Task 6: 多語言和本地化完成

### Files
- Modify: `assets/scripts/body-operation-form.js` - 完善多語言支持

### Step 1: 確保完整的多語言支持

驗證所有用戶可見文本都有中英文版本：

- ✅ 操作類型標籤（已完成）
- ✅ 表單標籤和佔位符（已完成）
- ✅ 驗證錯誤消息（已完成）
- ✅ 側邊顯示文本（已完成）

### Step 2: 運行語言切換測試

1. 在應用中切換到英文
2. 點擊身體部位
3. 驗證所有文本都顯示為英文

### Step 3: 提交

```bash
git add assets/scripts/body-operation-form.js
git commit -m "feat: 完善多語言支持

- 所有用戶界面文本支持中英文
- 動態語言切換正常工作
- 時間戳本地化格式"
```

---

## 總結

**完成後的預期結果：**

✅ 身體系統使用操作/治療記錄表單而非疾病表單
✅ 側邊選擇器（左/中/右）
✅ 6 種操作類型選擇
✅ 自由文本欄位用於詳細記錄
✅ 字符計數器（最多 500 字）
✅ 表單驗證和錯誤提示
✅ 按身體部位分組顯示記錄
✅ 完整的中英文支持
✅ 響應式設計和暗色模式

**檔案清單：**
- 2 個新 JavaScript 文件（body-operation-form.js、test）
- 1 個新 CSS 文件（body-operation-form.css）
- 3 個修改的檔案（main.js、index.html、modal.css）
- 1 個新測試文件

**預計耗時：** 3-4 小時

---

## 執行選項

計劃已完成並保存到 `docs/plans/2026-01-16-body-system-operation-form.md`。

**兩種執行方式：**

**1. 子代理驅動（此會話）** - 我為每個任務分派新的子代理，進行代碼審查，快速迭代

**2. 平行會話（獨立）** - 在新會話中打開，使用 `executing-plans` 批量執行，設置檢查點

**你想選擇哪一種方式？**
