# 簡化眼睛標籤點擊識別系統 實現計畫

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**目標：** 在眼睛系統的圖像查看器下方添加18個眼睛結構標籤按鈕面板，用戶點擊按鈕時直接在疾病記錄中顯示相應的英文結構名稱，無需複雜的座標映射。

**架構：**
在眼睛系統UI中添加一個固定的標籤按鈕面板，包含18個眼睛結構的快速選擇按鈕。點擊按鈕時，直接觸發 `openDiseaseModal()` 並傳入預定義的結構信息，跳過座標檢測邏輯。此方案簡化了實現，提升了用戶可用性。

**技術棧：** HTML5, CSS3, Vanilla JavaScript (ES6+), JSON 數據結構

---

## Task 1: 新增眼睛標籤選擇面板的HTML結構

**文件：**
- Modify: `index.html:119-140` (眼睛選擇器容器區域)

**Step 1: 在眼睛選擇器下方添加標籤面板容器**

在 `eye-selector-container` 之後，添加眼睛標籤面板的HTML結構：

```html
<!-- 眼睛結構標籤選擇面板 (僅在眼睛系統中顯示) -->
<div class="eye-label-panel-container" id="eye-label-panel-container" style="display: none;">
  <div class="eye-label-panel">
    <p class="eye-label-panel__title">選擇眼睛結構：</p>

    <!-- 左眼標籤 -->
    <div class="eye-label-group">
      <h4 class="eye-label-group__title">👁️ 左眼</h4>
      <div class="eye-label-buttons">
        <button class="eye-label-btn" data-structure-id="left-eye" data-structure-name-en="left eye">Left Eye</button>
        <button class="eye-label-btn" data-structure-id="left-eye-cornea" data-structure-name-en="cornea">Cornea</button>
        <button class="eye-label-btn" data-structure-id="left-eye-iris" data-structure-name-en="iris">Iris</button>
        <button class="eye-label-btn" data-structure-id="left-eye-lens" data-structure-name-en="lens">Lens</button>
        <button class="eye-label-btn" data-structure-id="left-eye-retina" data-structure-name-en="retina">Retina</button>
        <button class="eye-label-btn" data-structure-id="left-eye-lacrimal" data-structure-name-en="lacrimal gland">Lacrimal gland</button>
        <button class="eye-label-btn" data-structure-id="eye-choroid" data-structure-name-en="choroid">Choroid</button>
        <button class="eye-label-btn" data-structure-id="eye-sclera" data-structure-name-en="sclera">Sclera</button>
      </div>
    </div>

    <!-- 右眼標籤 -->
    <div class="eye-label-group">
      <h4 class="eye-label-group__title">👁️ 右眼</h4>
      <div class="eye-label-buttons">
        <button class="eye-label-btn" data-structure-id="right-eye" data-structure-name-en="right eye">Right Eye</button>
        <button class="eye-label-btn" data-structure-id="right-eye-cornea" data-structure-name-en="cornea">Cornea</button>
        <button class="eye-label-btn" data-structure-id="right-eye-iris" data-structure-name-en="iris">Iris</button>
        <button class="eye-label-btn" data-structure-id="right-eye-lens" data-structure-name-en="lens">Lens</button>
        <button class="eye-label-btn" data-structure-id="right-eye-retina" data-structure-name-en="retina">Retina</button>
        <button class="eye-label-btn" data-structure-id="right-eye-lacrimal" data-structure-name-en="lacrimal gland">Lacrimal gland</button>
        <button class="eye-label-btn" data-structure-id="eye-choroid" data-structure-name-en="choroid">Choroid</button>
        <button class="eye-label-btn" data-structure-id="eye-sclera" data-structure-name-en="sclera">Sclera</button>
      </div>
    </div>

    <!-- 共用標籤 -->
    <div class="eye-label-group">
      <h4 class="eye-label-group__title">🔗 共用結構</h4>
      <div class="eye-label-buttons">
        <button class="eye-label-btn" data-structure-id="eye-optic-nerve" data-structure-name-en="cranial nerve">Cranial nerve</button>
        <button class="eye-label-btn" data-structure-id="eye-vitreous" data-structure-name-en="vitreous body">Vitreous body</button>
        <button class="eye-label-btn" data-structure-id="eye-ciliary-body" data-structure-name-en="ciliary processes">Ciliary processes</button>
        <button class="eye-label-btn" data-structure-id="eye-extraocular-muscles" data-structure-name-en="muscle">Muscle</button>
        <button class="eye-label-btn" data-structure-id="eye-blood-vessels" data-structure-name-en="blood vessels">Blood vessels</button>
        <button class="eye-label-btn" data-structure-id="eye-pupil" data-structure-name-en="pupil">Pupil</button>
        <button class="eye-label-btn" data-structure-id="eye-dilator-pupillae" data-structure-name-en="papillary dilator">Papillary dilator</button>
        <button class="eye-label-btn" data-structure-id="eye-nasolacrimal-duct" data-structure-name-en="nasolacrimal duct">Nasolacrimal duct</button>
        <button class="eye-label-btn" data-structure-id="eye-vitreous-hyaloid" data-structure-name-en="hyaloid canal">Hyaloid canal</button>
        <button class="eye-label-btn" data-structure-id="eye-ciliary-muscle" data-structure-name-en="ciliary muscle">Ciliary muscle</button>
      </div>
    </div>
  </div>
</div>
```

**Step 2: 驗證HTML結構有效**

打開瀏覽器開發工具，檢查HTML是否正確插入，確保所有28個按鈕（包括重複的結構）都能在DOM中看到。

---

## Task 2: 添加眼睛標籤面板的CSS樣式

**文件：**
- Modify: `assets/styles/modal.css` (或 `assets/styles/main.css`)

**Step 1: 添加CSS樣式**

在CSS文件末尾添加眼睛標籤面板的樣式：

```css
/* 眼睛標籤選擇面板 */
.eye-label-panel-container {
  padding: 15px;
  background: #f5f5f5;
  border-top: 1px solid #ddd;
  border-bottom: 1px solid #ddd;
  margin-top: 10px;
}

.eye-label-panel {
  max-width: 100%;
}

.eye-label-panel__title {
  margin: 0 0 15px 0;
  font-size: 0.95em;
  font-weight: 600;
  color: #333;
}

.eye-label-group {
  margin-bottom: 15px;
}

.eye-label-group__title {
  margin: 0 0 8px 0;
  font-size: 0.9em;
  font-weight: 500;
  color: #666;
}

.eye-label-buttons {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(110px, 1fr));
  gap: 8px;
  margin-bottom: 10px;
}

.eye-label-btn {
  padding: 8px 12px;
  border: 1px solid #ccc;
  border-radius: 4px;
  background: #fff;
  color: #333;
  font-size: 0.85em;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.eye-label-btn:hover {
  background: #e3f2fd;
  border-color: #0066cc;
  color: #0066cc;
  transform: translateY(-2px);
  box-shadow: 0 2px 4px rgba(0, 102, 204, 0.2);
}

.eye-label-btn:active {
  transform: translateY(0);
  background: #bbdefb;
}

@media (max-width: 768px) {
  .eye-label-buttons {
    grid-template-columns: repeat(auto-fit, minmax(90px, 1fr));
    gap: 6px;
  }

  .eye-label-btn {
    padding: 6px 10px;
    font-size: 0.8em;
  }
}
```

**Step 2: 在瀏覽器中驗證樣式**

打開眼睛系統，檢查標籤面板的視覺效果是否正確。

---

## Task 3: 實現眼睛標籤面板的顯示/隱藏邏輯

**文件：**
- Modify: `assets/scripts/main.js` (在 ApplicationController 類中)

**Step 1: 添加方法以控制面板可見性**

在 `ApplicationController` 類中添加方法：

```javascript
/**
 * 切換眼睛標籤面板的可見性
 * @param {boolean} visible - 是否顯示面板
 */
toggleEyeLabelPanel(visible = true) {
  const panelContainer = $('#eye-label-panel-container');
  if (!panelContainer) return;

  if (visible) {
    panelContainer.style.display = 'block';
  } else {
    panelContainer.style.display = 'none';
  }
}
```

**Step 2: 在系統標籤切換時調用此方法**

在 `switchSystem` 方法中（大約行 ~450-500），添加邏輯：

```javascript
switchSystem(systemId) {
  this.currentSystemId = systemId;

  // ... 現有的系統切換邏輯 ...

  // 控制眼睛標籤面板可見性
  this.toggleEyeLabelPanel(systemId === 'eye');

  // ... 其他邏輯 ...
}
```

**Step 3: 驗證切換功能**

在瀏覽器中點擊"眼睛系統"標籤，確認標籤面板出現；點擊其他系統標籤，確認面板隱藏。

---

## Task 4: 實現標籤按鈕的點擊事件處理

**文件：**
- Modify: `assets/scripts/main.js` (在 ApplicationController 類中)

**Step 1: 添加標籤按鈕事件監聽器**

在 `ApplicationController` 的初始化方法或合適的位置添加：

```javascript
/**
 * 設置眼睛標籤按鈕的事件監聽
 */
setupEyeLabelButtonListeners() {
  const buttons = document.querySelectorAll('.eye-label-btn');

  buttons.forEach(button => {
    button.addEventListener('click', async (e) => {
      e.preventDefault();

      const structureId = button.dataset.structureId;
      const structureNameEn = button.dataset.structureNameEn;

      // 創建結構信息對象
      const structureInfo = {
        structureId: structureId,
        name: this.getChineseStructureName(structureId),  // 獲取中文名稱
        nameEn: structureNameEn,  // 英文名稱
        type: this.getStructureType(structureId),  // 結構類型
        side: this.getStructureSide(structureId),  // 左眼/右眼
        confidence: 1.0  // 按鈕選擇的信心度為100%
      };

      // 保存結構信息
      this.currentEyeStructure = structureInfo;

      // 打開疾病記錄模態視窗，傳入結構信息
      await this.openDiseaseModalWithStructure(structureInfo);
    });
  });
}

/**
 * 根據 structureId 獲取中文名稱
 * @param {string} structureId
 * @returns {string} 中文名稱
 */
getChineseStructureName(structureId) {
  const nameMap = {
    'left-eye': '左眼',
    'left-eye-cornea': '角膜',
    'left-eye-iris': '虹膜',
    'left-eye-lens': '水晶體',
    'left-eye-retina': '視網膜',
    'left-eye-lacrimal': '淚腺',
    'right-eye': '右眼',
    'right-eye-cornea': '角膜',
    'right-eye-iris': '虹膜',
    'right-eye-lens': '水晶體',
    'right-eye-retina': '視網膜',
    'right-eye-lacrimal': '淚腺',
    'eye-choroid': '脈絡膜',
    'eye-sclera': '鞏膜',
    'eye-optic-nerve': '視神經',
    'eye-vitreous': '玻璃體',
    'eye-ciliary-body': '睫狀體',
    'eye-extraocular-muscles': '眼肌',
    'eye-blood-vessels': '血管',
    'eye-pupil': '瞳孔',
    'eye-dilator-pupillae': '瞳孔擴張肌',
    'eye-nasolacrimal-duct': '鼻淚管',
    'eye-vitreous-hyaloid': '玻璃管',
    'eye-ciliary-muscle': '睫狀肌'
  };

  return nameMap[structureId] || structureId;
}

/**
 * 根據 structureId 獲取結構類型
 * @param {string} structureId
 * @returns {string} 結構類型
 */
getStructureType(structureId) {
  if (structureId.includes('cornea')) return 'cornea';
  if (structureId.includes('iris')) return 'iris';
  if (structureId.includes('lens')) return 'lens';
  if (structureId.includes('retina')) return 'retina';
  if (structureId.includes('lacrimal')) return 'lacrimal';
  if (structureId.includes('choroid')) return 'choroid';
  if (structureId.includes('sclera')) return 'sclera';
  if (structureId.includes('optic-nerve')) return 'optic-nerve';
  if (structureId.includes('vitreous')) return 'vitreous';
  if (structureId.includes('ciliary')) return 'ciliary';
  if (structureId.includes('muscle')) return 'muscle';
  if (structureId.includes('blood-vessel')) return 'blood-vessel';
  if (structureId.includes('pupil')) return 'pupil';
  if (structureId.includes('dilator')) return 'dilator';
  if (structureId.includes('nasolacrimal')) return 'nasolacrimal';

  return 'unknown';
}

/**
 * 根據 structureId 確定左眼/右眼/雙眼
 * @param {string} structureId
 * @returns {string} 'left', 'right', 或 'bilateral'
 */
getStructureSide(structureId) {
  if (structureId.startsWith('left-eye')) return 'left';
  if (structureId.startsWith('right-eye')) return 'right';
  return 'bilateral';
}

/**
 * 打開疾病記錄模態視窗，並直接使用傳入的結構信息
 * @param {object} structureInfo - 結構信息對象
 */
async openDiseaseModalWithStructure(structureInfo) {
  const modal = $('#disease-modal');
  if (!modal) return;

  // 設置位置資訊（眼睛系統特定格式）
  const locationDiv = $('#modal-location');
  if (locationDiv) {
    const englishName = structureInfo.nameEn.toLowerCase();
    const locationText = `
      <div class="eye-structure-info">
        <p class="structure-info__main">
          <strong>${structureInfo.name}</strong>
          <span class="side-badge">${
            structureInfo.side === 'left' ? '左眼' :
            structureInfo.side === 'right' ? '右眼' :
            '雙眼'
          }</span>
        </p>
        <p class="structure-info__english">
          <em>English: ${englishName}</em>
        </p>
        <p class="structure-info__type">
          結構類型: ${structureInfo.type}
        </p>
      </div>
    `;
    locationDiv.innerHTML = locationText;
  }

  // 保存結構信息供後續使用
  this.currentEyeStructure = structureInfo;

  // 初始化或更新疾病表單
  const formContainer = $('#disease-form-container');
  const diseaseSystemId = 'eye';

  if (formContainer && !this.diseaseForm) {
    this.diseaseForm = new DiseaseForm({
      container: formContainer,
      systemId: diseaseSystemId,
      diseaseData: this.anatomicalSystems
    });
    await this.diseaseForm.render();
  } else if (this.diseaseForm) {
    if (this.diseaseForm.systemId !== diseaseSystemId) {
      this.diseaseForm.systemId = diseaseSystemId;
      this.diseaseForm.diseases = [];
      await this.diseaseForm.loadDiseases(diseaseSystemId);
    }
    await this.diseaseForm.render();
  }

  // 顯示模態視窗
  const overlay = $('#modal-overlay');
  if (overlay) {
    overlay.classList.add('visible');
  }
  modal.setAttribute('aria-hidden', 'false');

  console.log(`打開疾病記錄: ${structureInfo.name} (${englishName})`);
}
```

**Step 2: 在初始化時調用事件監聽設置**

在 `init` 方法中添加對 `setupEyeLabelButtonListeners()` 的調用：

```javascript
async init() {
  // ... 現有初始化邏輯 ...

  // 設置眼睛標籤按鈕事件監聽
  this.setupEyeLabelButtonListeners();

  console.log('✅ 應用初始化完成');
}
```

**Step 3: 在瀏覽器中測試點擊事件**

打開眼睛系統，點擊一個標籤按鈕（如 "Cornea"），確認：
- 疾病記錄模態視窗打開
- modal-location 中顯示 "角膜" 和 "English: cornea"
- 疾病表單正確初始化

---

## Task 5: 集成測試和修復

**文件：**
- Test: `test-eye-label-panel.html` (新建)

**Step 1: 創建測試頁面**

創建 `test-eye-label-panel.html` 進行快速測試：

```html
<!DOCTYPE html>
<html lang="zh-Hant">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>眼睛標籤面板測試</title>
  <link rel="stylesheet" href="assets/styles/main.css">
  <link rel="stylesheet" href="assets/styles/modal.css">
</head>
<body>
  <h1>👁️ 眼睛標籤選擇面板測試</h1>
  <p>此測試頁面驗證眼睛標籤面板的功能。</p>

  <div id="test-results" style="padding: 20px; border: 1px solid #ddd; margin-top: 20px;">
    <h3>測試檢查清單：</h3>
    <ul>
      <li>☐ 標籤面板在眼睛系統中顯示</li>
      <li>☐ 標籤面板在其他系統中隱藏</li>
      <li>☐ 點擊標籤按鈕打開疾病記錄模態視窗</li>
      <li>☐ modal-location 顯示正確的中文名稱和英文名稱</li>
      <li>☐ 所有18個標籤都能正確點擊</li>
      <li>☐ 沒有JavaScript錯誤</li>
    </ul>
  </div>

  <script src="assets/scripts/utils.js"></script>
  <script src="assets/scripts/main.js"></script>
  <script>
    // 簡單測試邏輯可以在此添加
    console.log('✅ 測試頁面已加載');
  </script>
</body>
</html>
```

**Step 2: 在主應用中進行功能測試**

打開 `index.html`，切換到眼睛系統，逐個點擊標籤面板中的按鈕，驗證：
1. 標籤面板正確顯示/隱藏
2. 疾病記錄模態視窗正確打開
3. 結構名稱正確顯示
4. 疾病表單正確初始化
5. 沒有JavaScript錯誤

**Step 3: 修復任何發現的問題**

根據測試結果修復任何bug。

---

## Task 6: 文檔更新和提交

**文件：**
- Update: `progress.md`
- Update: `README.md` (可選)

**Step 1: 更新進度文件**

在 `progress.md` 中更新眼睛系統的進度：

```markdown
## Phase 7 - 簡化眼睛標籤選擇面板 ✅ 完成

**功能：**
- ✅ 添加18個眼睛結構標籤快速選擇按鈕面板
- ✅ 點擊標籤按鈕直接打開疾病記錄表單
- ✅ 正確顯示英文結構名稱
- ✅ 支持左眼、右眼和共用結構選擇

**改進：**
- 簡化了標籤識別流程（無需座標映射）
- 提升了用戶可用性（一鍵選擇）
- 減少了代碼複雜性
```

**Step 2: 進行最終提交**

```bash
git add index.html assets/styles/modal.css assets/scripts/main.js
git commit -m "feat: 添加簡化眼睛標籤選擇面板 - 18個快速選擇按鈕

- 在眼睛系統中添加結構標籤選擇面板
- 左眼、右眼各8個標籤，共用10個結構
- 點擊按鈕直接打開疾病記錄模態視窗
- 正確顯示英文結構名稱和中文翻譯
- 移除複雜的座標映射邏輯"
```

---

## 驗收標準

✅ **必須滿足：**

1. 眼睛系統中顯示18個標籤快速選擇按鈕
2. 其他系統中隱藏標籤面板
3. 點擊任何標籤按鈕都能打開疾病記錄表單
4. modal-location 中正確顯示英文結構名稱（小寫）
5. 沒有JavaScript控制台錯誤
6. 所有18個標籤都能被正確識別和處理

✅ **建議滿足：**

1. 視覺反饋（按鈕懸停效果）
2. 響應式設計（移動設備支持）
3. 無障礙設計（ARIA標籤）

