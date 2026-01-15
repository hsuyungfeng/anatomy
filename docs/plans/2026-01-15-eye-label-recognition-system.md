# 眼睛標籤點擊結構位置識別系統 實現計畫

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**目標：** 確保用戶點擊眼睛系統中的18個英文標籤時，疾病記錄表單能正確識別並顯示該結構的位置信息，特別是英文結構名稱（如點擊 CORNEA 標籤時，疾病記錄中顯示 "cornea"）。

**架構：**
- 驗證標籤點擊檢測系統（`eyeLabelMapper.getLabelAtPosition`）是否正常工作
- 確保結構ID與中英文名稱的映射完整性
- 在模態視窗中正確提取並顯示英文結構名稱
- 完整測試所有18個標籤的識別流程

**技術棧：** JavaScript (ES6+), Canvas API, JSON 數據結構, HTML/CSS

---

## Task 1: 驗證眼睛標籤映射數據的完整性

**文件：**
- Read: `assets/scripts/eye-label-mapper.js`
- Read: `data/eye-label-mappings.json`
- Read: `data/eye-coordinates.json`

**Step 1: 讀取眼睛標籤映射器的初始化代碼**

確認眼睛標籤映射器（EyeLabelMapper 類）中是否正確定義了所有18個標籤及其結構ID。

**Step 2: 驗證18個標籤的structureId映射**

檢查每個標籤是否都有：
- `labelText` (中文名稱)
- `labelTextEn` (英文標籤名稱)
- `structureId` (對應的眼睛結構ID)
- `position` (像素座標)

**Step 3: 驗證結構ID與眼睛結構的對應**

確保 `eye-coordinates.json` 中包含所有被標籤引用的 `structureId`，例如：
- `left-eye-cornea`
- `right-eye-cornea`
- `eye-retina`
- 等其他11個結構

**Step 4: 檢查英文名稱的提取邏輯**

驗證 `eye-coordinates.json` 中的 `name` 字段是否能正確提供簡潔的英文結構名稱（如 "Cornea"），或是否需要從完整名稱（如 "Right Eye Cornea"）中提取。

---

## Task 2: 測試標籤點擊檢測的工作流程

**文件：**
- Modify: `assets/scripts/main.js:815-844`（detectEyeStructure 方法）
- Modify: `assets/scripts/main.js:865-984`（openDiseaseModal 方法）
- Test: `test-eye-label-recognition.html` (新建)

**Step 1: 創建測試HTML文件**

創建 `test-eye-label-recognition.html` 文件，用於測試標籤點擊檢測功能。

```html
<!DOCTYPE html>
<html lang="zh-Hant">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>眼睛標籤點擊檢測測試</title>
  <link rel="stylesheet" href="assets/styles/main.css">
  <style>
    .test-container {
      display: flex;
      gap: 20px;
      padding: 20px;
    }
    .test-canvas {
      flex: 1;
      border: 2px solid #ccc;
    }
    .test-results {
      flex: 1;
      border: 1px solid #999;
      padding: 20px;
      overflow-y: auto;
      max-height: 600px;
    }
    .test-results h3 {
      margin-top: 0;
    }
    .test-result-item {
      padding: 10px;
      margin: 5px 0;
      border: 1px solid #ddd;
      border-radius: 4px;
      background: #f9f9f9;
    }
    .test-result-item.pass {
      border-color: #4caf50;
      background: #c8e6c9;
    }
    .test-result-item.fail {
      border-color: #f44336;
      background: #ffcdd2;
    }
    .test-result-item.warning {
      border-color: #ff9800;
      background: #ffe0b2;
    }
    .label-name {
      font-weight: bold;
      color: #333;
    }
    .structure-info {
      font-size: 0.9em;
      color: #666;
      margin-top: 5px;
    }
  </style>
</head>
<body>
  <h1>👁️ 眼睛標籤點擊檢測測試工具</h1>

  <div class="test-container">
    <div class="test-canvas">
      <canvas id="test-canvas"></canvas>
      <p style="font-size: 0.9em; color: #666;">💡 點擊畫布上的標籤位置以測試檢測功能</p>
    </div>
    <div class="test-results">
      <h3>檢測結果</h3>
      <div id="results-container"></div>
    </div>
  </div>

  <script src="assets/scripts/utils.js"></script>
  <script src="assets/scripts/eye-image-mapper.js"></script>
  <script src="assets/scripts/eye-label-mapper.js"></script>
  <script src="test-eye-label-recognition.js"></script>
</body>
</html>
```

**Step 2: 創建測試JavaScript文件**

創建 `test-eye-label-recognition.js` 文件。

```javascript
class EyeLabelRecognitionTester {
  constructor() {
    this.canvas = document.getElementById('test-canvas');
    this.ctx = this.canvas.getContext('2d');
    this.resultsContainer = document.getElementById('results-container');
    this.results = [];

    this.eyeLabelMapper = null;
    this.eyeImageMapper = null;
    this.img = null;

    this.init();
  }

  async init() {
    try {
      // 加載眼睛圖像
      this.img = await this.loadImage('assets/images/3Deye.png');

      // 初始化映射器
      this.eyeLabelMapper = new EyeLabelMapper({ debug: false });
      this.eyeImageMapper = new EyeImageMapper({ debug: false });

      // 設置Canvas
      this.canvas.width = this.img.width * 0.6; // 縮放至60%以適應屏幕
      this.canvas.height = this.img.height * 0.6;
      this.scale = this.canvas.width / this.img.width;

      // 繪製圖像和標籤
      this.drawImage();

      // 設置點擊事件
      this.canvas.addEventListener('click', (e) => this.handleCanvasClick(e));

      console.log('✅ 測試工具初始化完成');
    } catch (error) {
      console.error('❌ 初始化失敗:', error);
      this.addResult('初始化失敗', error.message, 'fail');
    }
  }

  loadImage(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
      img.src = src;
    });
  }

  drawImage() {
    // 繪製背景圖像
    this.ctx.drawImage(this.img, 0, 0, this.canvas.width, this.canvas.height);

    // 在縮放的Canvas上繪製標籤
    if (this.eyeLabelMapper) {
      const originalWidth = this.img.width;
      const originalHeight = this.img.height;

      // 繪製標籤圓點
      const labels = this.eyeLabelMapper.getAllLabels();
      labels.forEach(label => {
        const x = label.position.x * this.scale;
        const y = label.position.y * this.scale;

        // 繪製圓點
        this.ctx.fillStyle = '#ff0000';
        this.ctx.beginPath();
        this.ctx.arc(x, y, 5, 0, Math.PI * 2);
        this.ctx.fill();

        // 繪製文字
        this.ctx.fillStyle = '#333';
        this.ctx.font = 'bold 10px Arial';
        this.ctx.fillText(label.labelTextEn, x + 8, y - 8);
      });
    }
  }

  handleCanvasClick(e) {
    const rect = this.canvas.getBoundingClientRect();
    const canvasX = e.clientX - rect.left;
    const canvasY = e.clientY - rect.top;

    // 轉換回原始圖像座標
    const x = canvasX / this.scale;
    const y = canvasY / this.scale;

    console.log(`點擊座標: Canvas(${canvasX}, ${canvasY}) → 原始(${x.toFixed(0)}, ${y.toFixed(0)})`);

    // 嘗試檢測標籤
    const labelInfo = this.eyeLabelMapper.getLabelAtPosition(x, y, 40);

    if (labelInfo) {
      this.testLabelDetection(labelInfo);
    } else {
      this.addResult('標籤檢測', '未找到標籤', 'warning');
    }
  }

  testLabelDetection(labelInfo) {
    try {
      // 1. 驗證標籤信息
      const labelTest = {
        name: labelInfo.labelText || 'N/A',
        nameEn: labelInfo.labelTextEn || 'N/A',
        structureId: labelInfo.structureId || 'N/A'
      };

      this.addResult(
        `標籤檢測: ${labelTest.nameEn}`,
        `中文: ${labelTest.name}<br/>結構ID: ${labelTest.structureId}`,
        labelInfo.structureId ? 'pass' : 'fail'
      );

      // 2. 驗證結構信息
      if (labelInfo.structureId) {
        const structureInfo = this.eyeImageMapper.getStructureInfo(labelInfo.structureId);

        if (structureInfo) {
          this.addResult(
            `結構識別: ${structureInfo.name}`,
            `英文: ${structureInfo.name}<br/>中文: ${structureInfo.nameCh}<br/>類型: ${structureInfo.type}`,
            'pass'
          );
        } else {
          this.addResult(
            `結構識別: ${labelInfo.structureId}`,
            '❌ 未找到對應的結構信息',
            'fail'
          );
        }
      }

      // 3. 驗證英文名稱提取
      const englishName = this.extractEnglishStructureName(structureInfo);
      this.addResult(
        '英文名稱提取',
        `原始: ${structureInfo?.name || 'N/A'}<br/>提取結果: ${englishName}`,
        englishName ? 'pass' : 'fail'
      );

    } catch (error) {
      this.addResult('測試執行', `❌ ${error.message}`, 'fail');
    }
  }

  extractEnglishStructureName(structureInfo) {
    if (!structureInfo) return null;

    // 如果已經是簡潔名稱，直接返回
    if (structureInfo.type && !structureInfo.name.includes('Eye')) {
      return structureInfo.type;
    }

    // 從完整名稱中提取（如 "Right Eye Cornea" → "Cornea"）
    const parts = structureInfo.name.split(' ');
    return parts[parts.length - 1]; // 取最後一個單詞
  }

  addResult(title, content, status = 'pass') {
    const resultDiv = document.createElement('div');
    resultDiv.className = `test-result-item ${status}`;
    resultDiv.innerHTML = `
      <div class="label-name">${status === 'pass' ? '✅' : status === 'fail' ? '❌' : '⚠️'} ${title}</div>
      <div class="structure-info">${content}</div>
    `;
    this.resultsContainer.insertBefore(resultDiv, this.resultsContainer.firstChild);
    this.results.push({ title, content, status });
  }
}

// 初始化測試工具
document.addEventListener('DOMContentLoaded', () => {
  new EyeLabelRecognitionTester();
});
```

**Step 3: 在瀏覽器中測試**

打開 `test-eye-label-recognition.html`，點擊畫布上各個標籤位置，驗證檢測結果。

**Step 4: 紀錄測試結果**

記錄測試結果，特別注意：
- 是否所有18個標籤都能被正確檢測
- 結構ID是否正確映射
- 英文名稱是否能正確提取和顯示

---

## Task 3: 增強 modal-location 中的結構信息顯示

**文件：**
- Modify: `assets/scripts/main.js:906-923`（眼睛系統的位置信息顯示）

**Step 1: 分析當前的位置信息顯示邏輯**

查看當前在 `openDiseaseModal` 方法中，眼睛系統的位置信息是如何構建和顯示的。

**Step 2: 增強顯示邏輯以包含英文結構名稱**

修改代碼以確保顯示英文結構名稱：

```javascript
// 眼睛系統特定的顯示格式 [修改]
else if (this.currentSystemId === 'eye') {
  // 從結構名稱中提取簡潔的英文名稱
  const englishStructureName = this.extractEnglishStructureName(structureInfo.nameEn);

  locationText = `
    <div class="eye-structure-info">
      <p class="structure-info__main">
        <strong>${structureInfo.name}</strong>
        <span class="side-badge">${structureInfo.side === 'left' ? '左眼' : structureInfo.side === 'right' ? '右眼' : '雙眼'}</span>
      </p>
      <p class="structure-info__english">
        <em>English: ${englishStructureName}</em>
      </p>
      <p class="structure-info__type">
        結構類型: ${structureInfo.type}
      </p>
      ${structureInfo.confidence < 0.5 ?
        '<p class="structure-info__warning">⚠️ 檢測信心度較低，請點擊重新檢測</p>' : ''}
    </div>
  `;

  console.log(`眼睛結構檢測: ${structureInfo.name} (${englishStructureName}), 信心度: ${(structureInfo.confidence * 100).toFixed(1)}%`);
}
```

**Step 3: 實現英文名稱提取方法**

在 ApplicationController 類中添加方法：

```javascript
extractEnglishStructureName(fullName) {
  if (!fullName) return '';

  // 移除方向前綴（Left/Right/Bilateral）
  const parts = fullName.split(' ');

  // 如果是 "Left Eye Cornea" 格式，取最後一個單詞
  if (parts.length > 1) {
    return parts[parts.length - 1].toLowerCase();
  }

  return fullName.toLowerCase();
}
```

**Step 4: 添加CSS樣式支持**

在 `assets/styles/modal.css` 中添加新的樣式類：

```css
.structure-info__english {
  font-size: 0.9em;
  color: #0066cc;
  margin: 8px 0;
  font-style: italic;
}

.eye-structure-info {
  padding: 12px;
  background: #f5f5f5;
  border-left: 3px solid #87ceeb;
  border-radius: 4px;
  margin-bottom: 16px;
}
```

**Step 5: 驗證顯示效果**

在主應用中測試，點擊眼睛標籤，驗證 modal-location 中是否正確顯示英文結構名稱。

---

## Task 4: 測試所有18個眼睛標籤的完整流程

**文件：**
- Test: `test-eye-complete-workflow.html` (新建)

**Step 1: 創建完整流程測試頁面**

創建 `test-eye-complete-workflow.html`，模擬用戶點擊標籤到填寫疾病記錄的完整工作流程。

```html
<!DOCTYPE html>
<html lang="zh-Hant">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>眼睛標籤完整工作流程測試</title>
  <link rel="stylesheet" href="assets/styles/main.css">
  <link rel="stylesheet" href="assets/styles/modal.css">
  <style>
    .test-workflow-container {
      max-width: 900px;
      margin: 0 auto;
      padding: 20px;
    }
    .test-section {
      margin: 20px 0;
      padding: 15px;
      border: 1px solid #ddd;
      border-radius: 4px;
    }
    .test-checklist {
      list-style: none;
      padding: 0;
    }
    .test-checklist li {
      padding: 8px;
      margin: 5px 0;
      background: #f9f9f9;
      border: 1px solid #eee;
      border-radius: 3px;
      display: flex;
      align-items: center;
    }
    .test-checklist input {
      margin-right: 10px;
    }
    .label-list {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 10px;
      margin: 15px 0;
    }
    .label-item {
      padding: 10px;
      border: 1px solid #ccc;
      border-radius: 4px;
      background: #fff;
      cursor: pointer;
      text-align: center;
      font-size: 0.9em;
    }
    .label-item:hover {
      background: #e3f2fd;
      border-color: #0066cc;
    }
    .label-item.tested {
      background: #c8e6c9;
      border-color: #4caf50;
    }
  </style>
</head>
<body>
  <div class="test-workflow-container">
    <h1>👁️ 眼睛標籤完整工作流程測試</h1>

    <div class="test-section">
      <h2>測試清單</h2>
      <ul class="test-checklist">
        <li><input type="checkbox" disabled> 標籤點擊檢測工作正常</li>
        <li><input type="checkbox" disabled> 結構ID正確映射</li>
        <li><input type="checkbox" disabled> modal-location 顯示正確的結構信息</li>
        <li><input type="checkbox" disabled> 英文結構名稱正確提取和顯示</li>
        <li><input type="checkbox" disabled> 疾病表單正確初始化</li>
        <li><input type="checkbox" disabled> 所有18個標籤都能被識別</li>
      </ul>
    </div>

    <div class="test-section">
      <h2>18個眼睛標籤測試矩陣</h2>
      <p>點擊下方標籤，在模擬的應用中測試完整工作流程：</p>

      <h3>左眼標籤 (8個)</h3>
      <div class="label-list">
        <div class="label-item" data-label="left-eye-lacrimal">Lacrimal gland</div>
        <div class="label-item" data-label="left-eye-cornea">Cornea</div>
        <div class="label-item" data-label="left-eye-iris">Iris</div>
        <div class="label-item" data-label="left-eye-lens">Lens</div>
        <div class="label-item" data-label="left-eye-retina">Retina</div>
        <div class="label-item" data-label="left-eye-choroid">Choroid</div>
        <div class="label-item" data-label="left-eye-sclera">Sclera</div>
        <div class="label-item" data-label="left-eye">Left Eye</div>
      </div>

      <h3>右眼標籤 (8個)</h3>
      <div class="label-list">
        <div class="label-item" data-label="right-eye-lacrimal">Lacrimal gland</div>
        <div class="label-item" data-label="right-eye-cornea">Cornea</div>
        <div class="label-item" data-label="right-eye-iris">Iris</div>
        <div class="label-item" data-label="right-eye-lens">Lens</div>
        <div class="label-item" data-label="right-eye-retina">Retina</div>
        <div class="label-item" data-label="right-eye-choroid">Choroid</div>
        <div class="label-item" data-label="right-eye-sclera">Sclera</div>
        <div class="label-item" data-label="right-eye">Right Eye</div>
      </div>

      <h3>共用標籤 (2個)</h3>
      <div class="label-list">
        <div class="label-item" data-label="eye-optic-nerve">Cranial nerve</div>
        <div class="label-item" data-label="eye-vitreous">Vitreous body</div>
      </div>
    </div>

    <div class="test-section">
      <h2>測試結果記錄</h2>
      <div id="test-results" style="max-height: 300px; overflow-y: auto;"></div>
    </div>
  </div>

  <script src="assets/scripts/utils.js"></script>
  <script src="assets/scripts/eye-image-mapper.js"></script>
  <script src="assets/scripts/eye-label-mapper.js"></script>
  <script src="test-eye-complete-workflow.js"></script>
</body>
</html>
```

**Step 2: 創建測試JavaScript邏輯**

創建 `test-eye-complete-workflow.js` 進行交互式測試。

**Step 3: 手動測試每個標籤**

逐個點擊每個標籤，驗證：
- 標籤是否被正確識別
- modal-location 中是否顯示正確的結構信息
- 英文名稱是否正確

**Step 4: 記錄所有測試結果**

記錄每個標籤的測試結果，特別注意任何失敗或異常情況。

---

## Task 5: 修復英文名稱提取邏輯

**文件：**
- Modify: `assets/scripts/main.js` (新增方法)
- Modify: `assets/scripts/main.js:906-923`

**Step 1: 確認需要修復的地方**

根據Task 2和Task 4的測試結果，確認是否需要修復英文名稱提取邏輯。

**Step 2: 實現健壯的名稱提取方法**

在 `main.js` 的 ApplicationController 類中添加：

```javascript
/**
 * 從完整的眼睛結構名稱中提取簡潔的英文結構名稱
 * 例如: "Right Eye Cornea" → "cornea"
 *      "Eye Retina" → "retina"
 *      "Optic Nerve" → "nerve"
 * @param {string} fullName - 完整的結構名稱
 * @returns {string} 簡潔的英文名稱（小寫）
 */
extractEnglishStructureName(fullName) {
  if (!fullName || typeof fullName !== 'string') {
    return '';
  }

  // 移除方向前綴和"Eye"字樣
  let name = fullName
    .replace(/^(Left|Right|Bilateral)\s+/i, '')  // 移除方向前綴
    .replace(/\s+Eye\s+/i, ' ')                 // 移除"Eye"
    .trim();

  // 取最後一個單詞作為結構名稱
  const words = name.split(/\s+/);
  return words[words.length - 1].toLowerCase();
}
```

**Step 3: 修改 openDiseaseModal 中的眼睛系統部分**

更新代碼以使用新的提取方法。

**Step 4: 測試名稱提取**

驗證提取邏輯對所有可能的名稱格式都有效。

---

## Task 6: 驗證標籤與結構ID的完整映射

**文件：**
- Check: `data/eye-label-mappings.json`
- Check: `data/eye-coordinates.json`

**Step 1: 驗證映射完整性**

檢查所有18個標籤是否都有有效的 `structureId`。

**Step 2: 驗證結構ID是否在座標數據中存在**

確保每個 `structureId` 都能在 `eye-coordinates.json` 中找到對應的結構定義。

**Step 3: 記錄任何缺失或不匹配的項目**

如果發現問題，記錄並在Task 7中修復。

---

## Task 7: 修復任何缺失的映射關係

**文件：**
- Modify: `data/eye-label-mappings.json` (如需要)
- Modify: `data/eye-coordinates.json` (如需要)

**Step 1: 根據Task 6的發現進行修復**

基於驗證結果，修復任何缺失或不正確的映射。

**Step 2: 確保所有18個標籤都有完整的映射**

驗證修復後，所有標籤都能正確映射到結構信息。

**Step 3: 更新文件的lastUpdated時間戳**

更新修改後的JSON文件的時間戳。

---

## Task 8: 集成測試和文檔更新

**文件：**
- Modify: `assets/scripts/main.js`
- Modify: `assets/styles/modal.css`
- Update: `docs/plans/` (此計畫文檔)
- Update: `progress.md`

**Step 1: 在主應用中進行集成測試**

打開 `index.html`，切換到眼睛系統，點擊幾個標籤，驗證完整的工作流程。

**Step 2: 驗證所有功能**

- 標籤點擊檢測
- 結構信息提取
- modal-location 顯示
- 疾病表單初始化
- 英文名稱顯示

**Step 3: 記錄測試結果**

如果所有測試都通過，記錄完成狀態。

**Step 4: 更新進度文件**

在 `progress.md` 中更新眼睛系統的進度。

---

## 驗收標準 (Acceptance Criteria)

✅ **必須滿足：**

1. 所有18個眼睛標籤都能被正確點擊檢測
2. 點擊標籤時，modal-location 中顯示的中文名稱正確
3. 點擊標籤時，modal-location 中顯示的英文結構名稱正確
4. 疾病表單能正確初始化和填充
5. 沒有JavaScript錯誤或警告
6. 測試覆蓋所有18個標籤

✅ **建議滿足：**

1. 提供視覺反饋（如標籤高亮）
2. 顯示檢測信心度
3. 支持手動結構選擇作為備選方案

---

## 實施注意事項

- **優先級：** 標籤點擊檢測 > 結構ID映射 > 顯示優化 > 增強功能
- **測試策略：** 單元測試 → 集成測試 → 用戶驗收測試
- **回滾計畫：** 如發現問題，回滾到上一個已知良好的提交
- **提交頻率：** 每完成一個Task進行一次Git提交

