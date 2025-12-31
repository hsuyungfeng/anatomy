# 專案脈絡（Project Context）

## 專案目的（Purpose）

**醫療結構化病歷輸入系統**是一個互動式醫療記錄平台，旨在為醫療專業人員提供：

1. **結構化病歷輸入**：使用圖像標註和結構化表單同時記錄患者狀況
2. **多系統支持**：涵蓋牙齒、眼睛、身體等多個解剖系統
3. **智能識別**：整合 OCR 技術自動識別疾病名稱
4. **標準化輸出**：生成結構化 JSON 病歷，符合醫療數據交換標準（FHIR）

### 目標受眾
- 牙科醫生和牙科助理
- 眼科醫生
- 全科醫生
- 醫學學生和醫療工作者

### 核心價值
- 提高病歷輸入效率（圖像標註 + OCR）
- 標準化記錄格式（結構化 JSON）
- 離線可用（localStorage）
- 與 doctor-toolbox.com 整合

## 技術棧（Tech Stack）

### 前端
- **HTML5**：語義化標記，無障礙設計
- **CSS3**：現代樣式，響應式設計
- **Vanilla JavaScript (ES6+)**：無依賴框架，保持輕量
- **SVG**：圖像標註覆蓋層和視覺標記

### 外部函式庫
- **Tesseract.js 6.0.0**：OCR 識別（中英文）
  - WebAssembly 版本，瀏覽器端運行
  - 支持繁體中文（chi_tra）和英文（eng）

### 資料格式
- **JSON**：病歷紀錄、疾病分類、解剖系統定義
- **PNG**：解剖圖像（眼睛、牙齒、身體）

### 開發工具
- **uv**：Python 版本管理（未來數據處理腳本）
- **Git**：版本控制
- **Live Server**：本地開發伺服器

### 部署與整合
- **獨立靜態網站**：GitHub Pages、Netlify、Vercel
- **与 Doctor Toolbox 整合**：iframe + postMessage API
- **FHIR 標準**：符合台灣 2025 跨院互通規範

## 專案規範（Project Conventions）

### 程式碼風格（Code Style）

#### JavaScript
- 使用 ES6+ 語法（const/let、箭頭函數、模板字串）
- 類別命名：大駝峰式 `PascalCase`（如 ImageAnnotator）
- 函數命名：駝峰式 `camelCase`（如 handleClick）
- 常數命名：全大寫 `SNAKE_CASE`（如 MAX_ZOOM_LEVEL）
- ID 屬性：小寫連字符（如 disease-modal）
- 文件編碼：UTF-8
- 縮排：2 空格
- 註解語言：中文繁體

**模組化設計**：
- 每個 JavaScript 檔案一個主類別
- 單一職責原則
- 暴露必要的公開方法和事件

**範例：**
```javascript
const MAX_ZOOM_LEVEL = 4;
const MIN_ZOOM_LEVEL = 0.5;

class ImageAnnotator {
  constructor(imageElement, systemId) {
    this.image = imageElement;
    this.systemId = systemId;
    this.annotations = [];
    this.init();
  }

  init() {
    // 初始化邏輯
  }

  handleImageClick(event) {
    const position = this.getClickPosition(event);
    this.showDiseaseModal(position);
  }

  getClickPosition(event) {
    const rect = this.image.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    };
  }
}
```

#### HTML
- 語義化標籤：使用 `<main>`, `<section>`, `<article>`, `<nav>`
- 無障礙屬性：`aria-label`, `aria-describedby`, `alt` 文字
- 中文繁體內容
- 雙語支持：data-en 屬性保存英文
- 縮排：2 空格

**範例：**
```html
<button
  id="zoom-in-btn"
  class="annotator__control"
  aria-label="放大圖像"
  data-en="Zoom In">
  放大
</button>
```

#### CSS
- **BEM 命名規範**（Block-Element-Modifier）
- **CSS 變數**定義顏色、尺寸、間距
- **移動優先**響應式設計
- **顏色編碼**：不同疾病系統使用不同顏色

**範例：**
```css
:root {
  --color-teeth: #ffd700;
  --color-eye: #87ceeb;
  --color-body: #ff6b9d;
  --spacing-unit: 8px;
}

.disease-form {}
.disease-form__header {}
.disease-form__category {}
.disease-form__category--active {}
.disease-form__checkbox {}
```

### 檔案命名規範
- **目錄名稱**：小寫，連字符分隔（kebab-case）
- **JavaScript 檔案**：小寫，連字符分隔
  - 類別檔案使用帕斯卡命名對應類別（ImageAnnotator → image-annotator.js）
- **JSON 資料**：小寫，連字符分隔
- **CSS 檔案**：小寫，連字符分隔，按功能分割
- **圖像**：保持原始命名（已存在）

### 文檔和註解語言
- **所有文檔**：中文繁體（README、計畫、指南）
- **程式碼註解**：中文繁體
- **變數、函數名稱**：英文（遵循編程慣例）
- **用戶界面**：中英雙語
  - HTML 元素顯示中文
  - 提供 data-en 屬性存放英文

## 架構模式（Architecture Patterns）

### 模組化系統

系統分為 4 個核心模組，各自獨立可用：

1. **ImageAnnotator（圖像標註模組）**
   - 管理圖像顯示、點擊事件、座標記錄
   - 支持縮放、平移
   - 發出 annotation 事件供外部監聽

2. **DiseaseForm（疾病表單模組）**
   - 管理結構化多選框表單
   - 實作搜尋、篩選、階層展開
   - 獨立資料來源，可脫離圖像使用

3. **OCRHandler（OCR 處理模組）**
   - 包裝 Tesseract.js
   - 處理圖像上傳、識別、疾病名稱匹配
   - 非同步操作

4. **RecordManager（病歷管理模組）**
   - 管理記錄的CRUD操作
   - 與 localStorage 交互
   - 生成標準化輸出格式

### 數據結構與流程

#### 病歷記錄格式（Medical Record）
```json
{
  "recordId": "uuid-v4",
  "patientId": "patient-123",
  "createdAt": "2025-12-16T10:30:00Z",
  "updatedAt": "2025-12-16T10:30:00Z",
  "anatomicalSystems": [
    {
      "systemId": "teeth",
      "systemName": "牙齒系統",
      "systemNameEn": "Teeth/Gums",
      "imageId": "allteeth",
      "annotations": [
        {
          "annotationId": "anno-001",
          "position": {"x": 150, "y": 200},
          "toothNumber": 11,
          "toothName": "左上中門牙",
          "toothNumberingSystem": "universal",
          "diseases": [
            {
              "id": "caries",
              "name": "齲齒",
              "nameEn": "Dental Caries",
              "severity": "moderate",
              "subcategory": "enamel",
              "notes": "近端面齲齒"
            }
          ],
          "createdAt": "2025-12-16T10:30:00Z"
        }
      ]
    }
  ]
}
```

#### 疾病分類結構
```json
{
  "categoryId": "teeth",
  "categoryName": "牙齒/牙齦",
  "categoryNameEn": "Teeth/Gums",
  "color": "#ffd700",
  "diseases": [
    {
      "id": "caries",
      "name": "齲齒",
      "nameEn": "Dental Caries",
      "subcategories": [
        {"id": "enamel", "name": "琺瑯質", "nameEn": "Enamel"}
      ]
    }
  ]
}
```

### 狀態管理策略

- **元件狀態**：各模組管理自身狀態（this.state）
- **全域狀態**：目前患者病歷 ID、當前解剖系統
- **持久化儲存**：localStorage（鍵名：anatomy-[recordId]）
- **事件通訊**：元件間使用自訂事件（CustomEvent）

**事件清單：**
- `annotation:created` - 標註新增
- `annotation:updated` - 標註更新
- `annotation:deleted` - 標註刪除
- `system:switched` - 解剖系統切換

### 響應式設計策略

```css
/* 斷點定義 */
--breakpoint-mobile: 480px
--breakpoint-tablet: 768px
--breakpoint-desktop: 1024px

/* 布局調整 */
Mobile (<480px):   單列，圖像上方，表單下方
Tablet (768px):    兩列，左圖像，右表單
Desktop (1024px):  三列，左圖像，中標註列表，右表單
```

## 測試策略（Testing Strategy）

### 手動測試清單

**功能測試：**
- [ ] 圖像加載正確
- [ ] 點擊圖像記錄座標準確
- [ ] 模態窗口彈出和關閉
- [ ] 疾病表單搜尋功能
- [ ] OCR 識別正確性
- [ ] 病歷儲存和讀取
- [ ] 匯出 JSON 格式

**相容性測試：**
- [ ] Chrome 最新版
- [ ] Firefox 最新版
- [ ] Safari 14+
- [ ] Edge 最新版
- [ ] 移動設備（iOS Safari, Chrome Mobile）

**效能測試：**
- [ ] 大圖像載入時間 < 2 秒
- [ ] 互動響應時間 < 100ms
- [ ] OCR 識別時間 < 30 秒
- [ ] localStorage 容量足夠（預留 50MB）

### 自動化測試（未來）

可考慮使用：
- Jest：JavaScript 單元測試
- Cypress：端對端（E2E）測試
- Lighthouse：效能審計

## Git 工作流程（Git Workflow）

### 分支策略

- **main**：穩定發佈版本
- **develop**：開發主分支
- **feature/***：新功能分支（如 feature/add-ocr）
- **fix/***：錯誤修復分支
- **docs/***：文檔更新分支

### 提交訊息規範

使用中文繁體的約定式提交（Conventional Commits）：

```
<類型>: <簡短描述>

[詳細說明]

[頁腳]
```

**類型：**
- `feat`: 新功能
- `fix`: 錯誤修復
- `docs`: 文檔更新
- `style`: 代碼格式（不影響邏輯）
- `refactor`: 重構
- `perf`: 效能改進
- `test`: 測試相關
- `chore`: 構建或工具變更

**範例：**
```
feat: 實作圖像標註點擊功能

- 添加 ImageAnnotator 類別
- 實作點擊座標記錄
- 彈出疾病表單模態窗口

Related-to: #12
```

## 領域知識（Domain Context）

### 醫療術語和標準

**牙齒編號系統：**
1. **Universal Numbering System（美國標準）**
   - 成人：1-32（#1 右上第三臼齒，#32 右下第三臼齒）
   - 兒童：A-T
   - 範例：#11 = 左上中門牙

2. **FDI Two-Digit System（國際標準）**
   - 第一位：象限（1=右上, 2=左上, 3=左下, 4=右下）
   - 第二位：牙齒位置（1-8）
   - 範例：21 = 左上中門牙

3. **Palmer Notation**（牙科常用）
   - 符號表示象限：├┤ 上頜，└┘ 下頜

**常見牙科疾病：**
- 齲齒（Dental Caries）- 分深度：琺瑯質、象牙質、牙髓
- 牙周病（Periodontal Disease）
- 牙齦發炎（Gingivitis）
- 牙齒斷裂（Tooth Fracture）
- 缺牙（Missing Tooth）

### 眼科術語

**眼睛部位：**
- 角膜（Cornea）
- 鞏膜（Sclera）
- 虹膜（Iris）
- 瞳孔（Pupil）
- 晶狀體（Lens）
- 視網膜（Retina）

### 醫療數據標準

- **FHIR（Fast Healthcare Interoperability Resources）**
  - 台灣 2025 標準：跨院互通
  - 本系統輸出格式相容 FHIR Observation

- **HL7**：醫療訊息標準
- **DICOM**：醫學影像標準（未來擴展）

## 重要限制（Important Constraints）

### 技術限制

- **純靜態網站**：無後端伺服器
- **localStorage 限制**：通常 5-10MB（取決於瀏覽器）
- **OCR 效能**：Tesseract.js 在瀏覽器端運行，處理大圖像較慢
- **瀏覽器支持**：ES6+（IE11 不支持）
- **圖像大小**：控制在 1MB 以內

### 醫療合規性

- **法規聲明**：本系統僅供教育和記錄用途，不作為診斷工具
- **隱私保護**：無網路傳輸，所有資料儲存於本地設備
- **資料備份**：使用者需自行備份 localStorage 資料
- **醫學準確性**：疾病分類應由醫療專業人員審核

### 無障礙要求（WCAG 2.1 AA）

- **鍵盤導航**：所有功能可用 Tab 鍵導航
- **螢幕閱讀器**：完整 ARIA 標籤支持
- **顏色對比**：文字和背景對比度 ≥ 4.5:1
- **色盲友善**：不僅依靠顏色區分

## 外部依賴（External Dependencies）

### CDN 資源

```html
<!-- Tesseract.js 6.0.0 -->
<script src="https://cdn.jsdelivr.net/npm/tesseract.js@6"></script>

<!-- 可選：icons -->
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
```

### 開發工具

- **uv**：Python 版本管理（可選）
- **http-server**：本地伺服器（npm: `npx http-server`)
- **Live Server**：VS Code 擴展或 npm 包

### 部署平台

推薦的免費靜態託管：
- **GitHub Pages**（免費，結合 GitHub）
- **Netlify**（自動構建，易於部署）
- **Vercel**（高效能，支持邊界函數）

## 效能目標

- **首次加載**：< 3 秒（包含圖像）
- **互動響應**：< 100ms
- **OCR 識別**：< 30 秒（依圖像清晰度）
- **localStorage 寫入**：< 50ms
- **圖像優化**：WebP 格式（向下兼容 PNG）

## 未來擴展方向（Roadmap）

1. **後端整合**：雲端儲存、用戶帳號系統
2. **多語言**：英文、簡體中文、日文
3. **3D 模型**：Three.js 互動 3D 解剖模型
4. **語音**：文字轉語音朗讀、語音輸入
5. **分析**：疾病統計、趨勢分析
6. **整合**：FHIR API、EMR 系統整合
7. **行動應用**：React Native 跨平台
8. **協作**：多使用者編輯、標準化病歷模板
