# Eye System Enhancement Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Enhance the eye system with explicit left/right eye selection UI, combine anatomical images with descriptive text, and replace placeholder diseases with common ophthalmology conditions.

**Architecture:**
1. Add interactive left/right eye selection buttons to the eye image viewer with visual feedback showing selected eye
2. Create a dual-panel layout combining the eye image with anatomical structure descriptions and disease information
3. Update disease data and disease form to load and display 8 common ophthalmology diseases (conjunctivitis, corneal ulcer, cataract, glaucoma, refractive error, dry eye, macular degeneration, retinal detachment) with Chinese/English names

**Tech Stack:**
- Vanilla JavaScript (no new dependencies)
- CSS for layout and styling
- JSON for disease data (already structured)
- localStorage for persistence

---

## Task 1: Add Left/Right Eye Selection UI

**Files:**
- Modify: `assets/styles/main.css` - Add styles for eye selector buttons and active state
- Modify: `assets/scripts/main.js:~150-250` - Add eye selection handler and state management
- Modify: `index.html:~200-300` - Add eye selector button group in image viewer section

**Step 1: Create failing test structure (verification script)**

Create `/test-eye-selection.html` to manually verify:
```html
<!DOCTYPE html>
<html>
<head>
    <title>Eye Selection Test</title>
</head>
<body>
    <div id="eye-selector" class="eye-selector">
        <button id="left-eye-btn" class="eye-btn" data-eye="left">左眼</button>
        <button id="right-eye-btn" class="eye-btn active" data-eye="right">右眼</button>
    </div>
    <div id="selected-eye" style="color: red; font-size: 24px;">Selected: right</div>
    <script>
        let selectedEye = 'right';
        document.getElementById('left-eye-btn').addEventListener('click', function() {
            selectedEye = 'left';
            updateSelection();
        });
        document.getElementById('right-eye-btn').addEventListener('click', function() {
            selectedEye = 'right';
            updateSelection();
        });
        function updateSelection() {
            document.querySelectorAll('.eye-btn').forEach(btn => btn.classList.remove('active'));
            document.querySelector(`[data-eye="${selectedEye}"]`).classList.add('active');
            document.getElementById('selected-eye').textContent = `Selected: ${selectedEye}`;
            console.log('Eye selected:', selectedEye);
        }
    </script>
</body>
</html>
```

**Expected behavior:** Clicking buttons toggles the active state and updates the selected eye.

**Step 2: Add CSS styling to main.css**

Add at the end of `/assets/styles/main.css`:

```css
/* Eye Selection UI */
.eye-selector {
    display: flex;
    gap: 10px;
    margin: 10px 0;
    justify-content: center;
}

.eye-btn {
    padding: 10px 20px;
    border: 2px solid #ccc;
    background: #f5f5f5;
    cursor: pointer;
    border-radius: 5px;
    font-size: 14px;
    font-weight: 500;
    transition: all 0.3s ease;
    font-family: inherit;
}

.eye-btn:hover {
    border-color: #0066cc;
    background: #e8f0ff;
}

.eye-btn.active {
    border-color: #0066cc;
    background: #0066cc;
    color: white;
    box-shadow: 0 2px 8px rgba(0, 102, 204, 0.3);
}

.eye-selector-container {
    margin-bottom: 15px;
}
```

**Step 3: Add HTML eye selector buttons to index.html**

Find the `<div class="image-viewer-controls">` section (around line 250) and add before the zoom controls:

```html
<div class="eye-selector-container" id="eye-selector-container" style="display: none;">
    <div class="eye-selector">
        <button id="left-eye-btn" class="eye-btn" data-eye="left">👁️ 左眼</button>
        <button id="right-eye-btn" class="eye-btn active" data-eye="right">👁️ 右眼</button>
    </div>
</div>
```

**Step 4: Add eye selection state and handler to main.js**

Add after the `currentSystemId` variable declaration (around line 40):

```javascript
// Eye selection state
let selectedEye = 'right'; // Track which eye is selected
```

Add eye selector event listeners after the system tab click handler (around line 150):

```javascript
// Eye selector button handlers
function initializeEyeSelector() {
    const leftEyeBtn = document.getElementById('left-eye-btn');
    const rightEyeBtn = document.getElementById('right-eye-btn');
    const eyeSelectorContainer = document.getElementById('eye-selector-container');

    if (!leftEyeBtn || !rightEyeBtn) return;

    leftEyeBtn.addEventListener('click', function() {
        selectedEye = 'left';
        updateEyeSelection();
    });

    rightEyeBtn.addEventListener('click', function() {
        selectedEye = 'right';
        updateEyeSelection();
    });
}

function updateEyeSelection() {
    const leftEyeBtn = document.getElementById('left-eye-btn');
    const rightEyeBtn = document.getElementById('right-eye-btn');

    // Update button active state
    leftEyeBtn.classList.remove('active');
    rightEyeBtn.classList.remove('active');

    if (selectedEye === 'left') {
        leftEyeBtn.classList.add('active');
    } else {
        rightEyeBtn.classList.add('active');
    }

    console.log('Eye selection changed to:', selectedEye);
    // Trigger any eye-specific updates here
    document.dispatchEvent(new CustomEvent('eyeSelected', { detail: { eye: selectedEye } }));
}

function showEyeSelector() {
    const container = document.getElementById('eye-selector-container');
    if (container) {
        container.style.display = 'block';
    }
    initializeEyeSelector();
}

function hideEyeSelector() {
    const container = document.getElementById('eye-selector-container');
    if (container) {
        container.style.display = 'none';
    }
}
```

Add to the `handleSystemTabClick()` function to show/hide selector based on system:

```javascript
// After setting currentSystemId
if (currentSystemId === 'eye') {
    showEyeSelector();
} else {
    hideEyeSelector();
}
```

**Step 5: Verify eye selector works**

Open browser DevTools console and run:
```javascript
console.log('Current selected eye:', selectedEye);
document.getElementById('left-eye-btn').click();
console.log('After click, selectedEye should be "left":', selectedEye);
```

Expected: Console shows "left" after clicking left eye button.

**Step 6: Commit**

```bash
git add assets/styles/main.css assets/scripts/main.js index.html
git commit -m "feat: add left/right eye selection UI with interactive buttons"
```

---

## Task 2: Create Dual-Panel Layout with Image and Descriptions

**Files:**
- Modify: `assets/styles/main.css` - Add layout styles for dual-panel view
- Create: `assets/scripts/eye-descriptions.js` - Store eye structure descriptions
- Modify: `assets/scripts/main.js:~400-500` - Integrate descriptions with eye selection
- Modify: `index.html:~280-320` - Add description panel HTML structure

**Step 1: Create eye structure descriptions data**

Create `/assets/scripts/eye-descriptions.js`:

```javascript
/**
 * Eye Structure Descriptions
 * Provides anatomical information for each eye structure
 */
const eyeStructureDescriptions = {
    'left-eye': {
        name: '左眼',
        nameEn: 'Left Eye',
        description: '眼睛的主要器官，負責光線感知和視覺處理。',
        descriptionEn: 'The primary organ of vision, responsible for light perception and visual processing.'
    },
    'left-eye-cornea': {
        name: '角膜（左眼）',
        nameEn: 'Left Cornea',
        description: '眼球最外層透明膜，主要負責光線折射。',
        descriptionEn: 'Transparent outer layer of the eye that refracts light and protects inner structures.'
    },
    'left-eye-iris': {
        name: '虹膜（左眼）',
        nameEn: 'Left Iris',
        description: '決定眼睛顏色的部分，控制瞳孔大小以調節光線進入量。',
        descriptionEn: 'Colored part of the eye that controls pupil size to regulate light entering the eye.'
    },
    'left-eye-lens': {
        name: '水晶體（左眼）',
        nameEn: 'Left Lens',
        description: '透明的凸透鏡，能夠改變形狀以調節焦點。',
        descriptionEn: 'Clear, adjustable lens that focuses light onto the retina for clear vision.'
    },
    'left-eye-retina': {
        name: '視網膜（左眼）',
        nameEn: 'Left Retina',
        description: '眼球後部的感光組織，將光轉換為神經信號。',
        descriptionEn: 'Light-sensitive tissue at the back of the eye that converts light to neural signals.'
    },
    'right-eye': {
        name: '右眼',
        nameEn: 'Right Eye',
        description: '眼睛的主要器官，負責光線感知和視覺處理。',
        descriptionEn: 'The primary organ of vision, responsible for light perception and visual processing.'
    },
    'right-eye-cornea': {
        name: '角膜（右眼）',
        nameEn: 'Right Cornea',
        description: '眼球最外層透明膜，主要負責光線折射。',
        descriptionEn: 'Transparent outer layer of the eye that refracts light and protects inner structures.'
    },
    'right-eye-iris': {
        name: '虹膜（右眼）',
        nameEn: 'Right Iris',
        description: '決定眼睛顏色的部分，控制瞳孔大小以調節光線進入量。',
        descriptionEn: 'Colored part of the eye that controls pupil size to regulate light entering the eye.'
    },
    'right-eye-lens': {
        name: '水晶體（右眼）',
        nameEn: 'Right Lens',
        description: '透明的凸透鏡，能夠改變形狀以調節焦點。',
        descriptionEn: 'Clear, adjustable lens that focuses light onto the retina for clear vision.'
    },
    'right-eye-retina': {
        name: '視網膜（右眼）',
        nameEn: 'Right Retina',
        description: '眼球後部的感光組織，將光轉換為神經信號。',
        descriptionEn: 'Light-sensitive tissue at the back of the eye that converts light to neural signals.'
    }
};

/**
 * Get description for a structure
 * @param {string} structureId - The structure identifier
 * @returns {object} Structure description object
 */
function getEyeStructureDescription(structureId) {
    return eyeStructureDescriptions[structureId] || null;
}
```

**Step 2: Update main.css with dual-panel layout styles**

Add to `/assets/styles/main.css`:

```css
/* Dual-Panel Layout for Eye System */
.image-viewer-wrapper {
    display: grid;
    grid-template-columns: 1fr 300px;
    gap: 20px;
    margin-top: 15px;
}

.image-viewer-panel {
    grid-column: 1;
    display: flex;
    flex-direction: column;
}

.eye-info-panel {
    grid-column: 2;
    background: #f9f9f9;
    border: 1px solid #ddd;
    border-radius: 8px;
    padding: 15px;
    max-height: 600px;
    overflow-y: auto;
    font-size: 13px;
    line-height: 1.5;
}

.eye-info-panel h3 {
    margin: 0 0 10px 0;
    font-size: 14px;
    font-weight: 600;
    color: #333;
    border-bottom: 2px solid #0066cc;
    padding-bottom: 8px;
}

.eye-info-content {
    color: #555;
}

.eye-info-content .name {
    font-weight: 600;
    color: #0066cc;
    margin-bottom: 5px;
}

.eye-info-content .name-en {
    font-size: 12px;
    color: #999;
    font-style: italic;
    margin-bottom: 10px;
}

.eye-info-content .description {
    font-size: 13px;
    line-height: 1.6;
    color: #666;
    margin-bottom: 5px;
}

.eye-info-content .description-en {
    font-size: 12px;
    color: #999;
    line-height: 1.5;
    font-style: italic;
}

.eye-info-empty {
    color: #999;
    text-align: center;
    padding: 30px 10px;
    font-size: 12px;
}

/* Responsive: Stack on smaller screens */
@media (max-width: 1200px) {
    .image-viewer-wrapper {
        grid-template-columns: 1fr;
    }

    .eye-info-panel {
        grid-column: 1;
        max-height: 250px;
    }
}
```

**Step 3: Wrap image viewer in dual-panel container in index.html**

Find the `<div class="image-viewer">` element (around line 270) and restructure:

Before (original structure):
```html
<div class="image-viewer">
    <!-- image-viewer-controls and canvas -->
</div>
```

After (new dual-panel structure):
```html
<div class="image-viewer-wrapper" id="eye-info-wrapper" style="display: none;">
    <div class="image-viewer-panel">
        <div class="image-viewer">
            <!-- Keep all existing image-viewer content here -->
        </div>
    </div>
    <div class="eye-info-panel" id="eye-info-panel">
        <h3>結構信息</h3>
        <div class="eye-info-empty" id="eye-info-content">
            點擊圖像上的結構以查看詳細信息
        </div>
    </div>
</div>
```

Make sure the original `image-viewer` div with all its children (controls, canvas) is nested inside `image-viewer-panel`.

**Step 4: Add function to display structure information**

Add to `/assets/scripts/main.js` after the eye selection functions:

```javascript
/**
 * Display eye structure information in the side panel
 * @param {object} structure - Structure object from eye mapper
 */
function displayEyeStructureInfo(structure) {
    const infoPanel = document.getElementById('eye-info-content');

    if (!structure || !structure.id) {
        infoPanel.innerHTML = '<div class="eye-info-empty">點擊圖像上的結構以查看詳細信息</div>';
        return;
    }

    // Load description from eye-descriptions.js
    const description = getEyeStructureDescription(structure.id);

    if (!description) {
        infoPanel.innerHTML = `
            <div class="eye-info-content">
                <div class="name">${structure.name || structure.id}</div>
            </div>
        `;
        return;
    }

    infoPanel.innerHTML = `
        <div class="eye-info-content">
            <div class="name">${description.name}</div>
            <div class="name-en">${description.nameEn}</div>
            <div class="description">${description.description}</div>
            <div class="description-en">${description.descriptionEn}</div>
        </div>
    `;
}

/**
 * Toggle eye info panel visibility
 * @param {boolean} show - Whether to show the panel
 */
function toggleEyeInfoPanel(show) {
    const wrapper = document.getElementById('eye-info-wrapper');
    if (wrapper) {
        wrapper.style.display = show ? 'grid' : 'none';
    }
}
```

**Step 5: Integrate with eye selection and click detection**

Modify the existing `handleAnnotationClick()` function to call `displayEyeStructureInfo()` when eye system is active:

Find where `detectEyeStructure()` is called and add after it:

```javascript
if (currentSystemId === 'eye') {
    displayEyeStructureInfo(structure);
}
```

Update `handleSystemTabClick()` to show/hide the panel:

```javascript
// After setting currentSystemId
if (currentSystemId === 'eye') {
    showEyeSelector();
    toggleEyeInfoPanel(true);
} else {
    hideEyeSelector();
    toggleEyeInfoPanel(false);
}
```

**Step 6: Add script import to index.html**

Add in the `<head>` section after other script imports:

```html
<script src="assets/scripts/eye-descriptions.js"></script>
```

**Step 7: Test the dual-panel layout**

1. Click on "眼睛系統" tab
2. Verify left/right eye buttons appear
3. Verify the info panel appears on the right side
4. Click on different eye structures
5. Verify descriptions update correctly

**Step 8: Commit**

```bash
git add assets/scripts/eye-descriptions.js assets/styles/main.css assets/scripts/main.js index.html
git commit -m "feat: create dual-panel layout with eye structure descriptions"
```

---

## Task 3: Update Eye Disease Data with Common Ophthalmology Conditions

**Files:**
- Modify: `data/disease-categories.json` - Update with 8 common eye diseases
- Modify: `assets/scripts/disease-form.js` - Fix parameterization to load correct diseases per system
- Modify: `assets/scripts/main.js` - Update disease form initialization for eye system

**Step 1: Update disease categories JSON**

Replace the eye system diseases in `/data/disease-categories.json`:

```json
{
  "systemId": "eye",
  "systemName": "眼睛系統",
  "diseases": [
    {
      "id": "conjunctivitis",
      "name": "結膜炎",
      "nameEn": "Conjunctivitis",
      "description": "眼睛表面膜的發炎，可能由病毒、細菌或過敏引起。",
      "descriptionEn": "Inflammation of the conjunctiva (eye surface membrane), can be caused by viruses, bacteria, or allergies.",
      "subcategories": [
        {
          "id": "viral_conjunctivitis",
          "name": "病毒性結膜炎",
          "nameEn": "Viral Conjunctivitis"
        },
        {
          "id": "bacterial_conjunctivitis",
          "name": "細菌性結膜炎",
          "nameEn": "Bacterial Conjunctivitis"
        },
        {
          "id": "allergic_conjunctivitis",
          "name": "過敏性結膜炎",
          "nameEn": "Allergic Conjunctivitis"
        }
      ]
    },
    {
      "id": "corneal_ulcer",
      "name": "角膜潰瘍",
      "nameEn": "Corneal Ulcer",
      "description": "角膜上的開放性病灶，可能由感染或眼部損傷引起，是眼科急症。",
      "descriptionEn": "Open sore on the cornea, potentially caused by infection or eye trauma. A serious eye condition.",
      "subcategories": [
        {
          "id": "infectious_corneal_ulcer",
          "name": "感染性角膜潰瘍",
          "nameEn": "Infectious Corneal Ulcer"
        },
        {
          "id": "traumatic_corneal_ulcer",
          "name": "創傷性角膜潰瘍",
          "nameEn": "Traumatic Corneal Ulcer"
        }
      ]
    },
    {
      "id": "cataract",
      "name": "白內障",
      "nameEn": "Cataract",
      "description": "眼球水晶體變濁，導致視力下降。常見於老年人。",
      "descriptionEn": "Clouding of the eye lens, causing vision loss. Commonly seen in older adults.",
      "subcategories": [
        {
          "id": "nuclear_cataract",
          "name": "核性白內障",
          "nameEn": "Nuclear Cataract"
        },
        {
          "id": "cortical_cataract",
          "name": "皮質性白內障",
          "nameEn": "Cortical Cataract"
        },
        {
          "id": "posterior_subcapsular_cataract",
          "name": "後囊下白內障",
          "nameEn": "Posterior Subcapsular Cataract"
        }
      ]
    },
    {
      "id": "glaucoma",
      "name": "青光眼",
      "nameEn": "Glaucoma",
      "description": "眼內壓升高導致視神經損傷和視野缺損。是導致不可逆性失明的主要原因。",
      "descriptionEn": "Elevated intraocular pressure damaging the optic nerve and causing vision loss. Leading cause of irreversible blindness.",
      "subcategories": [
        {
          "id": "open_angle_glaucoma",
          "name": "開角型青光眼",
          "nameEn": "Open-Angle Glaucoma"
        },
        {
          "id": "closed_angle_glaucoma",
          "name": "閉角型青光眼",
          "nameEn": "Closed-Angle Glaucoma"
        },
        {
          "id": "secondary_glaucoma",
          "name": "繼發性青光眼",
          "nameEn": "Secondary Glaucoma"
        }
      ]
    },
    {
      "id": "refractive_error",
      "name": "屈光不正",
      "nameEn": "Refractive Error",
      "description": "眼睛不能正確聚焦光線，導致視力模糊。是最常見的視力問題。",
      "descriptionEn": "Eye's inability to properly focus light, causing blurred vision. Most common vision problem worldwide.",
      "subcategories": [
        {
          "id": "myopia",
          "name": "近視",
          "nameEn": "Myopia (Nearsightedness)"
        },
        {
          "id": "hyperopia",
          "name": "遠視",
          "nameEn": "Hyperopia (Farsightedness)"
        },
        {
          "id": "astigmatism",
          "name": "散光",
          "nameEn": "Astigmatism"
        },
        {
          "id": "presbyopia",
          "name": "老花眼",
          "nameEn": "Presbyopia"
        }
      ]
    },
    {
      "id": "dry_eye",
      "name": "乾眼症",
      "nameEn": "Dry Eye Syndrome",
      "description": "淚液分泌不足或淚膜穩定性下降，導致眼睛不適和視力波動。",
      "descriptionEn": "Insufficient tear production or unstable tear film, causing eye discomfort and fluctuating vision.",
      "subcategories": [
        {
          "id": "aqueous_deficient_dry_eye",
          "name": "淚液缺乏型乾眼症",
          "nameEn": "Aqueous Deficient Dry Eye"
        },
        {
          "id": "evaporative_dry_eye",
          "name": "蒸發型乾眼症",
          "nameEn": "Evaporative Dry Eye"
        }
      ]
    },
    {
      "id": "age_related_macular_degeneration",
      "name": "年齡相關黃斑變性",
      "nameEn": "Age-Related Macular Degeneration (AMD)",
      "description": "黃斑部退化導致中心視力喪失。是老年人視力喪失的主要原因。",
      "descriptionEn": "Deterioration of the macula causing loss of central vision. Leading cause of vision loss in older adults.",
      "subcategories": [
        {
          "id": "dry_amd",
          "name": "乾性黃斑變性",
          "nameEn": "Dry AMD"
        },
        {
          "id": "wet_amd",
          "name": "濕性黃斑變性",
          "nameEn": "Wet AMD"
        }
      ]
    },
    {
      "id": "retinal_detachment",
      "name": "視網膜脫離",
      "nameEn": "Retinal Detachment",
      "description": "視網膜從眼球後部分離，可能導致永久性視力喪失。是眼科急症。",
      "descriptionEn": "Separation of the retina from the back of the eye, potentially causing permanent vision loss. Requires emergency treatment.",
      "subcategories": [
        {
          "id": "rhegmatogenous_retinal_detachment",
          "name": "孔源性視網膜脫離",
          "nameEn": "Rhegmatogenous Retinal Detachment"
        },
        {
          "id": "tractional_retinal_detachment",
          "name": "牽引性視網膜脫離",
          "nameEn": "Tractional Retinal Detachment"
        }
      ]
    }
  ]
}
```

**Step 2: Fix disease form parameterization**

Modify `/assets/scripts/disease-form.js` to load diseases based on the active system:

Find the `DiseaseForm` class and update the `loadDiseases()` method:

```javascript
/**
 * Load diseases for the current system
 * @param {string} systemId - The anatomical system ID
 */
loadDiseases(systemId = 'teeth') {
    // Load from disease-categories.json
    fetch('data/disease-categories.json')
        .then(response => response.json())
        .then(data => {
            // Find diseases for the specified system
            const systemDiseases = data.find(cat => cat.systemId === systemId);

            if (!systemDiseases) {
                console.warn(`No diseases found for system: ${systemId}`);
                this.diseases = [];
                return;
            }

            this.diseases = systemDiseases.diseases || [];
            this.systemId = systemId;
            console.log(`Loaded ${this.diseases.length} diseases for system: ${systemId}`);
        })
        .catch(error => {
            console.error('Error loading diseases:', error);
            this.diseases = [];
        });
}
```

Update the form creation to use the loaded diseases:

```javascript
/**
 * Create disease selection checkboxes dynamically
 * @returns {HTMLElement} Container with disease checkboxes
 */
createDiseaseCheckboxes() {
    const container = document.createElement('div');
    container.className = 'disease-checkboxes';

    if (!this.diseases || this.diseases.length === 0) {
        container.innerHTML = '<p style="color: #999; font-size: 12px;">暫無可用疾病</p>';
        return container;
    }

    this.diseases.forEach(disease => {
        const label = document.createElement('label');
        label.className = 'disease-checkbox';

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.value = disease.id;
        checkbox.dataset.diseaseName = disease.name;

        const labelText = document.createElement('span');
        labelText.textContent = `${disease.name} (${disease.nameEn})`;

        label.appendChild(checkbox);
        label.appendChild(labelText);
        container.appendChild(label);
    });

    return container;
}
```

**Step 3: Update disease form initialization in main.js**

Find where `DiseaseForm` is instantiated and update to pass the correct system:

```javascript
/**
 * Initialize disease form for the current system
 * @param {string} systemId - Anatomical system ID
 */
function initializeDiseaseForm(systemId = 'teeth') {
    if (diseaseForm) {
        diseaseForm.loadDiseases(systemId);
    } else {
        diseaseForm = new DiseaseForm();
        diseaseForm.loadDiseases(systemId);
    }
}
```

Update the system tab click handler to initialize correct diseases:

```javascript
// In handleSystemTabClick after setting currentSystemId
if (currentSystemId === 'eye') {
    showEyeSelector();
    toggleEyeInfoPanel(true);
    initializeDiseaseForm('eye');
} else if (currentSystemId === 'teeth') {
    hideEyeSelector();
    toggleEyeInfoPanel(false);
    initializeDiseaseForm('teeth');
} else if (currentSystemId === 'body') {
    hideEyeSelector();
    toggleEyeInfoPanel(false);
    initializeDiseaseForm('body');
}
```

**Step 4: Test disease loading**

1. Click on "眼睛系統" tab
2. Click on an eye structure in the image
3. Modal should open and show 8 eye diseases with Chinese/English names
4. Verify diseases can be selected with checkboxes
5. Add a record and verify it saves correctly

**Step 5: Verify all 8 diseases appear**

Expected diseases in the modal:
- 結膜炎 (Conjunctivitis)
- 角膜潰瘍 (Corneal Ulcer)
- 白內障 (Cataract)
- 青光眼 (Glaucoma)
- 屈光不正 (Refractive Error)
- 乾眼症 (Dry Eye Syndrome)
- 年齡相關黃斑變性 (Age-Related Macular Degeneration)
- 視網膜脫離 (Retinal Detachment)

**Step 6: Commit**

```bash
git add data/disease-categories.json assets/scripts/disease-form.js assets/scripts/main.js
git commit -m "feat: update eye diseases to 8 common ophthalmology conditions with Chinese/English names"
```

---

## Task 4: Integration Testing and Polish

**Files:**
- Test all three enhancements work together
- Verify disease data persistence
- Test responsive layout on different screen sizes

**Step 1: Full workflow test**

1. Open application in browser
2. Click "眼睛系統" tab
   - Expected: Left/right eye buttons appear
   - Expected: Info panel appears on right
3. Click on a structure (e.g., cornea)
   - Expected: Info panel updates with structure description
   - Expected: Modal opens with 8 eye diseases
4. Select 2-3 diseases, add notes, click Save
   - Expected: Record appears in list
   - Expected: Diseases display correctly in record
5. Click on different eye structures
   - Expected: Info updates for each structure
6. Test left/right eye button switching
   - Expected: Visual feedback (active state) changes
7. Export records
   - Expected: Eye records export correctly

**Step 2: Test responsive layout**

Resize browser window:
1. Desktop (1400px) - Info panel should be on right
2. Tablet (900px) - Info panel should stack below
3. Mobile (600px) - Layout should be readable

**Step 3: Test disease data accuracy**

Verify each disease in modal has:
- Chinese name ✓
- English name ✓
- Subcategories where applicable ✓

**Step 4: Commit integration test completion**

```bash
git add -A
git commit -m "chore: complete eye system enhancement - left/right selection, dual-panel layout, common ophthalmology diseases"
```

---

## Summary

This plan implements three major enhancements to the eye system:

1. **Left/Right Eye Selection** - Interactive button UI with visual feedback showing currently selected eye
2. **Dual-Panel Layout** - Eye image on left, anatomical structure descriptions on right, combining visual and textual information
3. **Common Eye Diseases** - 8 clinically relevant ophthalmology conditions (conjunctivitis, corneal ulcer, cataract, glaucoma, refractive error, dry eye, macular degeneration, retinal detachment) with Chinese/English names and subcategories

All changes maintain backward compatibility with existing teeth and body systems, use vanilla JavaScript with no new dependencies, and follow the DRY principle with modular, reusable code.

---

Plan complete and saved to `/home/hsu/Desktop/anatomy/docs/plans/2026-01-13-eye-system-enhancement.md`.

Two execution options:

**1. Subagent-Driven (this session)** - I dispatch a fresh subagent per task, review between tasks, fast iteration and immediate feedback

**2. Parallel Session (separate)** - Open new session with executing-plans skill, batch execution with checkpoints

Which approach would you prefer?