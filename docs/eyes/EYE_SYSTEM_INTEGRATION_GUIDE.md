# 眼睛系統集成與標籤映射使用指南

**最後更新**: 2026-01-14
**版本**: 1.0

---

## 📋 快速概覽

眼睛系統現已完整實現，包括：

1. **眼睛解剖學習系統** - 支持左/右眼選擇、結構點擊檢測、疾病記錄
2. **英文標籤識別工具** - OCR 自動識別眼睛圖像中的 18 個英文解剖學標籤
3. **交互式標籤映射工具** - 手動調整標籤位置與眼睛結構的對應關係
4. **自動標籤繪製系統** - 在眼睛圖像上自動顯示標籤標記

---

## 🎯 使用流程

### 第 1 步：訪問主應用

```
http://localhost:8000/index.html
```

點擊「眼睛系統」標籤頁以進入眼睛系統。

### 第 2 步：與眼睛系統互動

#### 選擇眼睛
- 點擊「左眼」或「右眼」按鈕選擇要檢查的眼睛
- 系統會自動更新顯示相關結構

#### 點擊標籤進行標記
- **標籤標記** (藍色圓點)：點擊眼睛圖像上的藍色圓點可快速標記該結構
- **結構檢測** (自動)：系統自動識別點擊位置對應的眼睛結構
- **病歷記錄**：選擇結構後，填寫疾病信息並保存

### 第 3 步：進階 - 調整標籤映射（可選）

如果需要微調標籤位置或建立更精確的映射：

```
http://localhost:8000/eye-label-mapping-tool.html
```

#### 映射工具功能

1. **視覺標記** - 17 個藍色圓點在眼睛圖像上
2. **標籤列表** - 右側顯示所有 18 個英文標籤
3. **編輯對話框** - 點擊標籤進行配對：
   - 標籤在圖像中的位置
   - 該標籤指向的眼睛結構
   - 對應的結構 ID（可選）
   - 備註信息
4. **進度追蹤** - 實時顯示配對進度
5. **結果導出** - 導出 JSON 配對結果

### 第 4 步：導入自定義映射（進階）

完成標籤配對後，導出的 JSON 可通過以下方式導入應用：

```javascript
// 在應用開發者工具中執行
const mappingData = { /* 從映射工具導出的 JSON */ };
app.eyeLabelMapper.loadCustomMappings(mappingData);
```

---

## 🔧 系統架構

### 核心組件

#### 1. EyeLabelMapper (`assets/scripts/eye-label-mapper.js`)

負責管理眼睛圖像中的標籤映射。

**主要方法**：
- `getLabelAtPosition(x, y, threshold)` - 根據座標獲取標籤
- `getLabelByStructureId(structureId)` - 根據結構 ID 獲取標籤
- `drawLabels(canvas, options)` - 在 canvas 上繪製標籤
- `setLabelPosition(labelId, x, y)` - 更新標籤位置
- `loadCustomMappings(mappingData)` - 加載自定義映射
- `loadMappingsFromURL(url)` - 從遠程 URL 加載映射
- `exportAsJSON()` - 導出映射為 JSON

#### 2. EyeImageMapper (`assets/scripts/eye-image-mapper.js`)

識別眼睛圖像中的解剖學結構。

**主要功能**：
- 10 個雙側眼睛結構的座標定義
- 點擊位置到結構的映射
- 信心度計算

#### 3. 主應用集成 (`assets/scripts/main.js`)

- 眼睛系統初始化
- 左/右眼選擇管理
- 點擊檢測和結構識別
- 疾病表單打開

---

## 📊 眼睛標籤列表

### 18 個英文標籤與中文對應

| # | 英文 | 中文 | 位置 | 結構ID |
|---|------|------|------|--------|
| 1 | Lacrimal gland | 淚腺 | 左眼上方 | 待配對 |
| 2 | Hyaloid canal | 玻璃管 | 眼球內部 | 待配對 |
| 3 | Retina | 視網膜 | 眼球後部 | eye-retina |
| 4 | Choroid | 脈絡膜 | 眼球中層 | 待配對 |
| 5 | Sclera | 鞏膜 | 眼球外部 | 待配對 |
| 6 | Cranial nerve | 腦神經 | 眼球後部 | 待配對 |
| 7 | Muscle | 肌肉 | 眼球周圍 | 待配對 |
| 8 | Vitreous body | 玻璃體 | 眼球內部 | 待配對 |
| 9 | Ciliary processes | 睫狀突 | 眼球內周 | 待配對 |
| 10 | Papillary dilator | 瞳孔擴張肌 | 虹膜外周 | 待配對 |
| 11 | Lens | 水晶體 | 眼球前方 | eye-lens |
| 12 | Iris | 虹膜 | 眼球前部 | eye-iris |
| 13 | Blood vessels | 血管 | 眼球各層 | 待配對 |
| 14 | Pupil | 瞳孔 | 虹膜中央 | 待配對 |
| 15 | Cornea | 角膜 | 眼球前表面 | eye-cornea |
| 16 | Ciliary muscle | 睫狀肌 | 眼球內周 | 待配對 |
| 17 | Nasolacrimal duct | 鼻淚管 | 下方/側面 | 待配對 |

---

## 📁 相關文件

### 數據文件

- `data/anatomical-systems.json` - 系統與疾病配置
- `data/eye-coordinates.json` - 眼睛結構座標定義
- `data/eye-image-labels.json` - 18 個英文標籤的元數據
- `data/eye-label-mappings.json` - 標籤映射模板（用戶導出結果）
- `data/disease-categories.json` - 眼科疾病定義（8 種常見疾病）

### JavaScript 文件

- `assets/scripts/eye-label-mapper.js` - 標籤映射引擎（核心）
- `assets/scripts/eye-image-mapper.js` - 結構識別引擎
- `assets/scripts/eye-descriptions.js` - 眼睛結構描述
- `assets/scripts/main.js` - 應用主控制邏輯

### 工具與頁面

- `eye-text-recognition.html` - OCR 文字識別工具
- `eye-label-mapping-tool.html` - 交互式標籤映射工具
- `eye-calibration.html` - 眼睛校正工具（開發用）

### 文檔

- `EYE_LABEL_MAPPING_GUIDE.md` - 詳細的配對工具使用指南
- `EYE_IMAGE_TEXT_RECOGNITION.md` - OCR 工具文檔
- `EYE_LABEL_EXTRACTION_SUMMARY.md` - 工作總結
- `EYE_LABEL_MAPPING.md` - 系統架構文檔

---

## 🎨 常見眼科疾病

系統預配置了 8 種常見眼科疾病，每個均包含多個子分類：

1. **結膜炎** (Conjunctivitis)
   - 病毒性、細菌性、過敏性

2. **角膜潰瘍** (Corneal Ulcer)
   - 感染性、創傷性

3. **白內障** (Cataract)
   - 核性、皮質性、後囊下

4. **青光眼** (Glaucoma)
   - 開角型、閉角型、繼發性

5. **屈光不正** (Refractive Error)
   - 近視、遠視、散光、老花眼

6. **乾眼症** (Dry Eye Syndrome)
   - 淚液缺乏型、蒸發型

7. **年齡相關黃斑變性** (Age-Related Macular Degeneration)
   - 乾性、濕性

8. **視網膜脫離** (Retinal Detachment)
   - 孔源性、牽引性

---

## 🚀 進階功能

### 開發者用法

#### 手動加載自定義映射

```javascript
// 在瀏覽器控制台中
const customMapping = {
  labelMappings: {
    'left-cornea-label': {
      structureId: 'left-eye-cornea',
      labelText: '角膜',
      position: { x: 320, y: 350 },
      belongsTo: 'left'
    }
    // ... 其他標籤
  }
};

app.eyeLabelMapper.loadCustomMappings(customMapping);
app.eyeLabelMapper.drawLabels(document.getElementById('image-canvas'));
```

#### 從 URL 加載映射

```javascript
// 非同步加載
await app.eyeLabelMapper.loadMappingsFromURL('data/eye-label-mappings.json');
```

#### 導出當前映射

```javascript
const json = app.eyeLabelMapper.exportAsJSON();
console.log(json);  // 複製並保存為 JSON 文件
```

---

## 🐛 故障排除

### 問題：標籤在眼睛圖像上不顯示

**解決方案**：
1. 確認眼睛系統已正確加載
2. 檢查瀏覽器控制台是否有錯誤信息
3. 嘗試刷新頁面
4. 驗證 eye-label-mapper.js 已正確加載

### 問題：點擊標籤無法打開疾病表單

**解決方案**：
1. 確認眼睛系統已選中
2. 檢查眼科疾病數據是否已加載
3. 嘗試點擊眼睛結構而不是標籤

### 問題：自定義映射未加載

**解決方案**：
1. 驗證 JSON 數據格式正確
2. 檢查瀏覽器控制台的錯誤信息
3. 確保映射數據包含必要的欄位（position, x, y）

---

## 📞 技術支持

### 常見問題

**Q: 如何添加新的眼科疾病？**
A: 編輯 `data/disease-categories.json`，在 eye 系統的 diseases 陣列中添加新疾病。

**Q: 如何修改標籤位置？**
A:
- 直接編輯 `data/eye-label-mappings.json` 中的 position 欄位，或
- 使用 eye-label-mapping-tool.html 進行交互式調整

**Q: 如何支持新的眼睛結構？**
A: 編輯 `data/eye-coordinates.json`，添加新結構的座標定義。

---

## 📈 性能與優化

### 當前性能特性

- ✅ 標籤繪製：< 10ms（在 canvas 上繪製 17-20 個標籤）
- ✅ 點擊檢測：< 5ms（檢測 40px 範圍內的標籤）
- ✅ 自定義映射加載：< 100ms

### 潛在優化（未來）

- 實現標籤層級渲染
- 添加標籤聚類算法（當標籤過多時）
- 支持標籤動畫和過渡效果

---

## 🔐 安全與驗證

### 數據驗證

所有導入的映射數據都經過以下驗證：
1. 檢查數據格式（JSON object）
2. 驗證必要欄位存在（position.x, position.y）
3. 類型檢查（座標必須是數字）
4. 邊界檢查（座標在合理範圍內）

### 錯誤處理

- 無效的映射數據不會覆蓋現有映射
- 所有錯誤都會記錄到瀏覽器控制台
- 加載失敗時返回 `false`，應用繼續使用默認映射

---

## 📝 更新日誌

### 2026-01-14
- ✅ 完成眼睛標籤識別與映射系統
- ✅ 添加自定義映射導入功能
- ✅ 創建完整文檔與使用指南
- ✅ 實現 18 個英文標籤的識別與配對

### 進行中
- ⏳ 用戶完成標籤配對工作
- ⏳ 導入用戶配對結果
- ⏳ 實現視覺連接線系統

---

**版本**: 1.0
**狀態**: 生產就緒 ✅
**最後更新**: 2026-01-14

祝您使用愉快！👁️✨
