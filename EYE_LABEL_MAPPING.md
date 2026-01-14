# 眼睛圖像標籤映射系統 (Eye Label Mapping System)

## 概述

眼睛標籤映射系統自動在眼睛圖像上識別和顯示器官名稱標籤，並將用戶點擊的標籤與眼睛結構進行配對。這提高了點擊檢測的準確性和用戶體驗。

## 功能說明

### 1. 標籤自動繪製
當用戶切換到眼睛系統時，系統會自動在 canvas 上繪製所有眼睛結構的文字標籤。

**支持的標籤**:
- 左眼/右眼（整體眼睛）
- 角膜（Cornea）
- 虹膜（Iris）
- 晶狀體（Lens）
- 視網膜（Retina）

### 2. 標籤點擊識別
用戶點擊標籤時，系統會：
1. 識別最近的標籤（容差距離：40 像素）
2. 獲取該標籤對應的眼睛結構 ID
3. 優先選擇標籤對應的結構（信心度 100%）
4. 打開疾病記錄模態視窗

### 3. 雙語支持
所有標籤支持中英文顯示：
- **中文**: 左眼、右眼、角膜、虹膜、晶狀體、視網膜
- **英文**: Left Eye, Right Eye, Cornea, Iris, Lens, Retina

## 技術實現

### 類結構

#### EyeLabelMapper 類
```javascript
class EyeLabelMapper {
  // 初始化並加載標籤映射
  constructor(options = {})

  // 根據位置識別最近的標籤
  getLabelAtPosition(x, y, tolerance = 30)

  // 根據結構 ID 獲取標籤
  getLabelByStructureId(structureId)

  // 獲取特定眼睛的所有標籤
  getLabelsByEye(eye)

  // 在 Canvas 上繪製標籤
  drawLabels(canvas, options = {})
}
```

### 標籤映射數據結構

```javascript
{
  labelId: "left-eye-label",
  structureId: "left-eye",
  labelText: "左眼",
  labelTextEn: "Left Eye",
  position: { x: 350, y: 250 },
  belongsTo: "left"
}
```

### 座標系統

標籤位置基於眼睛圖像的原始尺寸：
- **圖像寬**: 1313 像素
- **圖像高**: 664 像素

標籤位置參考眼睛座標（來自 eye-coordinates.json）：
- 左眼中心: (454.5, 313)
- 右眼中心: (921.5, 412)

## 使用方式

### 在頁面中集成

1. **引入腳本** (index.html):
```html
<script src="assets/scripts/eye-label-mapper.js"></script>
```

2. **初始化映射器** (main.js):
```javascript
this.eyeLabelMapper = new EyeLabelMapper({
  debug: true  // 開發階段啟用調試
});
```

3. **繪製標籤** (載入眼睛圖像後):
```javascript
const canvas = document.getElementById('image-canvas');
this.eyeLabelMapper.drawLabels(canvas, {
  showText: true,
  textColor: '#333',
  fontSize: 13,
  backgroundColor: 'rgba(255, 255, 255, 0.85)',
  borderColor: '#0066cc'
});
```

### 標籤位置校正

如果標籤位置不夠準確，可以通過以下步驟進行校正：

1. **修改標籤位置** (eye-label-mapper.js):
```javascript
this.setLabelPosition('left-eye-label', 350, 250);
```

2. **匯出校正後的位置**:
```javascript
const labelData = this.eyeLabelMapper.exportAsJSON();
console.log(labelData);
```

3. **更新映射文件**:
將匯出的 JSON 數據保存並用於更新初始映射。

## 點擊檢測流程

```
用戶點擊圖像
  ↓
convertCanvasCoordinatesToImageCoordinates()
  ↓
detectEyeStructure(position)
  ├→ eyeLabelMapper.getLabelAtPosition(x, y)
  │  ├→ 找到最近的標籤 (容差 40px)
  │  └→ 返回標籤信息 (includesstructureId)
  │
  └→ eyeMapper.getStructureAtPosition(x, y)
     ├→ 使用座標檢測結構
     └→ 返回結構信息
  ↓
優先選擇標籤結構（信心度 100%）
  ↓
openDiseaseModal()
  ↓
顯示疾病記錄表單
```

## 調試模式

啟用調試模式以查看詳細的標籤檢測信息：

```javascript
const labelMapper = new EyeLabelMapper({ debug: true });
```

控制台輸出範例：
```
[EyeLabelMapper] 已初始化，識別標籤數: 10
[EyeLabelMapper] 識別到標籤: 左眼
  - 結構 ID: left-eye
  - 距離: 25.3 像素
```

## 標籤繪製選項

### drawLabels() 方法參數

| 參數 | 類型 | 預設值 | 說明 |
|------|------|--------|------|
| showText | boolean | true | 是否顯示標籤文字 |
| textColor | string | '#333' | 文字顏色 |
| fontSize | number | 14 | 字體大小（像素） |
| fontFamily | string | 'Arial' | 字體類型 |
| backgroundColor | string | rgba(255,255,255,0.9) | 背景色 |
| borderColor | string | '#0066cc' | 邊框色 |
| borderRadius | number | 4 | 邊框圓角（像素） |
| padding | number | 4 | 內邊距（像素） |

### 使用範例

```javascript
labelMapper.drawLabels(canvas, {
  showText: true,
  textColor: '#fff',
  fontSize: 12,
  backgroundColor: 'rgba(0, 102, 204, 0.7)',
  borderColor: '#fff',
  borderRadius: 6,
  padding: 6
});
```

## 眼睛標籤清單

### 左眼標籤 (Left Eye)
| 標籤 ID | 結構 ID | 中文 | 英文 |
|---------|---------|------|------|
| left-eye-label | left-eye | 左眼 | Left Eye |
| left-cornea-label | left-eye-cornea | 角膜 | Cornea |
| left-iris-label | left-eye-iris | 虹膜 | Iris |
| left-lens-label | left-eye-lens | 晶狀體 | Lens |
| left-retina-label | left-eye-retina | 視網膜 | Retina |

### 右眼標籤 (Right Eye)
| 標籤 ID | 結構 ID | 中文 | 英文 |
|---------|---------|------|------|
| right-eye-label | right-eye | 右眼 | Right Eye |
| right-cornea-label | right-eye-cornea | 角膜 | Cornea |
| right-iris-label | right-eye-iris | 虹膜 | Iris |
| right-lens-label | right-eye-lens | 晶狀體 | Lens |
| right-retina-label | right-eye-retina | 視網膜 | Retina |

## API 參考

### 獲取標籤信息

```javascript
// 根據位置獲取標籤
const label = eyeLabelMapper.getLabelAtPosition(100, 150, 40);

// 根據結構 ID 獲取標籤
const label = eyeLabelMapper.getLabelByStructureId('left-eye');

// 獲取特定眼睛的所有標籤
const labels = eyeLabelMapper.getLabelsByEye('left');

// 獲取所有標籤
const allLabels = eyeLabelMapper.getAllLabels();
```

### 設置和匯出

```javascript
// 設置標籤位置
eyeLabelMapper.setLabelPosition('left-eye-label', 350, 250);

// 匯出為 JSON
const json = eyeLabelMapper.exportAsJSON();
```

## 已知限制和改進方向

### 當前限制
1. **標籤位置為預設值** - 尚未通過實際測量校正
2. **不支持動態標籤顯示/隱藏** - 所有標籤同時顯示
3. **標籤位置不隨 zoom/pan 動態更新** - 標籤位置是靜態的

### 改進方向
1. **自動標籤位置校正工具**
   - 交互式校正界面
   - 拖動標籤進行位置調整
   - 自動保存校正數據

2. **動態標籤可視化**
   - 根據 zoom 級別自動調整標籤大小
   - 根據 pan 位移調整標籤位置
   - 高 zoom 級別時隱藏主要標籤，顯示細部標籤

3. **增強的標籤檢測**
   - 根據語言設置自動切換中英文
   - 支持多種標籤樣式（顏色、背景等）
   - 支持標籤分組和層級

## 測試檢查清單

- [ ] 眼睛系統加載時標籤正確顯示
- [ ] 點擊標籤可以正確識別對應的結構
- [ ] 標籤點擊的信心度為 100%
- [ ] 點擊標籤打開的疾病表單正確加載
- [ ] 左眼和右眼的標籤分別正確顯示
- [ ] 標籤文字清晰可見（不與圖像內容重疊）
- [ ] 點擊圖像（非標籤）仍能正確檢測眼睛結構
- [ ] 標籤位置在不同分辨率下合理顯示

## 相關文件

| 文件 | 用途 |
|------|------|
| assets/scripts/eye-label-mapper.js | 標籤映射和識別引擎 |
| assets/scripts/main.js | 集成標籤映射器的主控制器 |
| assets/scripts/eye-image-mapper.js | 眼睛結構座標映射 |
| data/eye-coordinates.json | 眼睛結構座標數據 |

## 版本歷史

### v1.0.0 (2026-01-14)
- 初始發布
- 實現基本的標籤映射和識別功能
- 支持中英文雙語標籤
- 實現標籤繪製和點擊檢測

## 反饋和建議

如發現標籤位置不準確或有其他改進建議，請提出 issue 或 PR。

---

**文檔版本**: 1.0
**最後更新**: 2026-01-14
**作者**: Medical Record System Development Team
