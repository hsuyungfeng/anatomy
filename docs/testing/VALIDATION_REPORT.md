# 眼睛標籤映射數據驗證報告

**驗證日期**: 2026-01-15
**驗證狀態**: ⚠️ 發現重大不一致

---

## 執行摘要

驗證發現了**數據結構的重大不一致**，影響系統的18個標籤中的大多數。主要問題包括：

1. **eye-label-mappings.json 標籤計數不匹配**: 聲稱18個標籤，但實際只有17個
2. **structureId 對應完全缺失**: 17個標籤在 eye-coordinates.json 中找不到對應的 structureId
3. **三個數據文件之間的結構不一致**: EyeLabelMapper、eye-label-mappings.json 和 eye-coordinates.json 使用了不同的 structureId 命名方案

---

## 詳細驗證結果

### Step 1: 讀取眼睛標籤映射器初始化代碼

**文件**: `/home/hsu/Desktop/anatomy/assets/scripts/eye-label-mapper.js`

✓ **結果**: 成功讀取
- EyeLabelMapper 類已正確定義
- initializeLabelMappings() 方法包含26個標籤定義
- 包含以下標籤類型：
  - 左眼標籤 (8個): left-eye, left-cornea, left-iris, left-lens, left-retina, left-lacrimal, left-choroid, left-sclera
  - 右眼標籤 (8個): right-eye, right-cornea, right-iris, right-lens, right-retina, right-lacrimal, right-choroid, right-sclera
  - 中線標籤 (10個): optic-nerve, vitreous, ciliary-body, muscles, blood-vessels, pupil, dilator, nasolacrimal, hyaloid, ciliary-muscle

### Step 2: 驗證18個標籤的 structureId 映射

**文件**: `/home/hsu/Desktop/anatomy/data/eye-label-mappings.json`

⚠️ **問題發現**:
- 聲稱的標籤數: 18個 (`totalLabels: 18`, `mappedCount: 18`)
- 實際標籤數: **17個** ❌
- **缺少1個標籤**

**標籤列表 (17個)** ✓ 字段完整:

| # | 英文名稱 | 中文名稱 | structureId | 狀態 |
|---|---------|--------|------------|-----|
| 1 | Lacrimal gland | 淚腺 | left-eye-lacrimal | ❌ |
| 2 | Hyaloid canal | 玻璃管 | eye-vitreous-hyaloid | ❌ |
| 3 | Retina | 視網膜 | eye-retina | ❌ |
| 4 | Choroid | 脈絡膜 | eye-choroid | ❌ |
| 5 | Sclera | 鞏膜 | eye-sclera | ❌ |
| 6 | Cranial nerve | 腦神經 | eye-optic-nerve | ❌ |
| 7 | Muscle | 肌肉 | eye-extraocular-muscles | ❌ |
| 8 | Vitreous body | 玻璃體 | eye-vitreous | ❌ |
| 9 | Ciliary processes | 睫狀突 | eye-ciliary-body | ❌ |
| 10 | Papillary dilator | 瞳孔擴張肌 | eye-dilator-pupillae | ❌ |
| 11 | Lens | 水晶體 | eye-lens | ❌ |
| 12 | Iris | 虹膜 | eye-iris | ❌ |
| 13 | Blood vessels | 血管 | eye-blood-vessels | ❌ |
| 14 | Pupil | 瞳孔 | eye-pupil | ❌ |
| 15 | Cornea | 角膜 | eye-cornea | ❌ |
| 16 | Ciliary muscle | 睫狀肌 | eye-ciliary-muscle | ❌ |
| 17 | Nasolacrimal duct | 鼻淚管 | eye-nasolacrimal-duct | ❌ |

### Step 3: 驗證結構ID與眼睛結構的對應

**文件**: `/home/hsu/Desktop/anatomy/data/eye-coordinates.json`

❌ **結果**: 嚴重不匹配

**eye-coordinates.json 中定義的 structureId** (10個):
```
✓ left-eye
✓ left-eye-cornea
✓ left-eye-iris
✓ left-eye-lens
✓ left-eye-retina
✓ right-eye
✓ right-eye-cornea
✓ right-eye-iris
✓ right-eye-lens
✓ right-eye-retina
```

**eye-label-mappings.json 中引用但在 eye-coordinates.json 中缺失的 structureId** (17個):
```
✗ left-eye-lacrimal
✗ eye-vitreous-hyaloid
✗ eye-retina
✗ eye-choroid
✗ eye-sclera
✗ eye-optic-nerve
✗ eye-extraocular-muscles
✗ eye-vitreous
✗ eye-ciliary-body
✗ eye-dilator-pupillae
✗ eye-lens
✗ eye-iris
✗ eye-blood-vessels
✗ eye-pupil
✗ eye-cornea
✗ eye-ciliary-muscle
✗ eye-nasolacrimal-duct
```

### Step 4: 檢查英文名稱的提取邏輯

**文件**: `/home/hsu/Desktop/anatomy/data/eye-coordinates.json`

✓ **name 字段存在**，但只有10個結構的定義：

| structureId | name |
|------------|------|
| left-eye | Left Eye |
| left-eye-cornea | Left Eye Cornea |
| left-eye-iris | Left Eye Iris |
| left-eye-lens | Left Eye Lens |
| left-eye-retina | Left Eye Retina |
| right-eye | Right Eye |
| right-eye-cornea | Right Eye Cornea |
| right-eye-iris | Right Eye Iris |
| right-eye-lens | Right Eye Lens |
| right-eye-retina | Right Eye Retina |

⚠️ **問題**: 英文名稱只能為10個眼睛結構提取，無法為其他17個標籤提取。

---

## EyeLabelMapper 與數據文件的對應分析

### 對應情況概覽

| 來源 | structureId 數量 | 標籤數量 | 備註 |
|-----|------------|--------|-----|
| EyeLabelMapper 代碼 | 24 (唯一) | 26 | 包含 left/right 和 center 標籤 |
| eye-label-mappings.json | 17 (唯一) | 17 | 只包含中性的結構ID |
| eye-coordinates.json | 10 | 10 | 只定義了 left/right 眼睛結構 |

### 三個文件的 structureId 使用差異

**EyeLabelMapper 的 structureId** (24個唯一):
- left-eye, left-eye-cornea, left-eye-iris, left-eye-lens, left-eye-retina, left-eye-lacrimal
- right-eye, right-eye-cornea, right-eye-iris, right-eye-lens, right-eye-retina, right-eye-lacrimal
- eye-choroid, eye-sclera, eye-optic-nerve, eye-vitreous, eye-ciliary-body, eye-extraocular-muscles
- eye-blood-vessels, eye-pupil, eye-dilator-pupillae, eye-nasolacrimal-duct, eye-vitreous-hyaloid, eye-ciliary-muscle

**eye-label-mappings.json 的 structureId** (17個唯一):
- left-eye-lacrimal, eye-vitreous-hyaloid, eye-retina, eye-choroid, eye-sclera
- eye-optic-nerve, eye-extraocular-muscles, eye-vitreous, eye-ciliary-body, eye-dilator-pupillae
- eye-lens, eye-iris, eye-blood-vessels, eye-pupil, eye-cornea
- eye-ciliary-muscle, eye-nasolacrimal-duct

**eye-coordinates.json 的 structureId** (10個):
- left-eye, left-eye-cornea, left-eye-iris, left-eye-lens, left-eye-retina
- right-eye, right-eye-cornea, right-eye-iris, right-eye-lens, right-eye-retina

### 數據映射缺口

```
EyeLabelMapper ──→ [24 structureId] ──→ eye-label-mappings.json
                                              ↓
                                        [17 structureId]
                                              ↓
                                   ✗ eye-coordinates.json
                                         [10 structureId]
```

**問題**: 17個標籤的 structureId 在 eye-coordinates.json 中找不到

---

## 根本原因分析

基於驗證結果，發現了以下根本問題：

1. **數據同步失敗**: eye-coordinates.json 只包含了10個基本結構，但 eye-label-mappings.json 引用了17個不同的 structureId。

2. **兩種命名方案混用**:
   - **眼睛級命名**: `left-eye`, `right-eye` 等（存在於 eye-coordinates.json）
   - **通用結構命名**: `eye-cornea`, `eye-lens` 等（只在 eye-label-mappings.json 中）

3. **標籤計數錯誤**: eye-label-mappings.json 聲稱有18個標籤，但實際只有17個。

4. **缺失的共用結構定義**: 以下結構完全未在 eye-coordinates.json 中定義：
   - 中線結構: optic-nerve, vitreous, ciliary-body, extraocular-muscles, blood-vessels, pupil, dilator-pupillae, nasolacrimal-duct, vitreous-hyaloid, ciliary-muscle
   - 左眼淚腺: left-eye-lacrimal

---

## 對系統的影響

### 英文結構名稱提取問題

當點擊眼睛標籤時，系統無法從 eye-coordinates.json 正確提取英文結構名稱，因為：

1. **17個標籤找不到對應的 structureId**: 無法獲取任何結構信息
2. **只有10個結構有英文名稱**: 其他結構無法提供英文名稱到病歷系統

### 預期的修復影響

需要添加以下到 eye-coordinates.json：
- 17個缺失的 structureId 及其對應的英文名稱
- 特別是中線結構（共用於左右眼）
- 左眼淚腺

---

## 建議的修復方案

1. **完成 eye-coordinates.json**: 添加所有17個缺失的結構定義，包含 `name` 和 `nameCh` 字段
2. **更正標籤計數**: 將 eye-label-mappings.json 中的 `totalLabels` 從18改為17
3. **驗證一致性**: 確保三個文件中的 structureId 完全一致
4. **提取邏輯驗證**: 確認疾病記錄系統能正確從 eye-coordinates.json 提取英文名稱

---

## 驗證檢查清單

- [x] Step 1: 讀取眼睛標籤映射器初始化代碼 ✓
- [x] Step 2: 驗證18個標籤的 structureId 映射 ⚠️ (17個標籤，1個缺失)
- [x] Step 3: 驗證結構ID與眼睛結構的對應 ❌ (17個不匹配)
- [x] Step 4: 檢查英文名稱的提取邏輯 ⚠️ (只有10個結構)

**總體結論**: ❌ **驗證失敗 - 需要修復三個數據文件之間的同步問題**

