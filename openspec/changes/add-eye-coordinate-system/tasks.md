# 眼睛系統座標映射與點擊檢測 - 實施任務清單

## 1. OpenSpec 提案與驗證
- [x] 1.1 創建 OpenSpec 目錄結構（openspec/changes/add-eye-coordinate-system/）
- [x] 1.2 編寫 proposal.md 變更提案
- [x] 1.3 編寫 specs/eye-system/spec.md 技術規範
- [x] 1.4 編寫 tasks.md 實施清單
- [x] 1.5 運行 `openspec validate add-eye-coordinate-system --strict` 驗證

## 2. 座標資料結構
- [x] 2.1 創建 `data/eye-coordinates.json` 檔案
- [x] 2.2 定義 10 個眼睛結構座標（右眼5個 + 左眼5個）
  - 右眼 (right-eye)
  - 右眼角膜 (right-eye-cornea)
  - 右眼虹膜 (right-eye-iris)
  - 右眼晶狀體 (right-eye-lens)
  - 右眼視網膜 (right-eye-retina)
  - 左眼 (left-eye)
  - 左眼角膜 (left-eye-cornea)
  - 左眼虹膜 (left-eye-iris)
  - 左眼晶狀體 (left-eye-lens)
  - 左眼視網膜 (left-eye-retina)
- [x] 2.3 驗證所有 ID 與 data/anatomical-systems.json 一致

## 3. EyeImageMapper 類別實現
- [x] 3.1 創建 `assets/scripts/eye-image-mapper.js` 檔案
- [x] 3.2 實現 constructor 與初始化邏輯
- [x] 3.3 實現 loadCoordinates() 非同步加載方法
- [x] 3.4 實現 getStructureAtPosition(x, y) 圓形檢測邏輯
  - 優先匹配半徑較小的結構
  - 計算點擊信心度
- [x] 3.5 實現 getStructureInfo(structureId) 獲取結構信息方法
- [x] 3.6 實現 getAllStructures() 獲取全部結構列表方法
- [x] 3.7 實現 visualizeClickAreas(canvas, options) Canvas可視化方法（調試用）
- [x] 3.8 實現 on(event, callback) / off(event, callback) / emit(event, data) 事件系統
- [x] 3.9 添加完整的中文繁體程式碼註解

## 4. 座標校正工具開發
- [x] 4.1 複製 `tooth-calibration.html` 檔案至 `eye-calibration.html`
- [x] 4.2 修改頁面標題為「眼睛結構位置校正工具」
- [x] 4.3 修改圖像路徑為 `/assets/images/eye/3Deye.png`
- [x] 4.4 移除牙齒系統切換功能
- [x] 4.5 修改結構選擇器 (select) 為 10 個眼睛結構
- [x] 4.6 調整 Canvas 尺寸為 3Deye.png 尺寸 (1313×664)
- [x] 4.7 修改點擊事件處理邏輯（使用 structureId 而非 toothNumber）
- [x] 4.8 測試座標記錄和匯出功能
- [x] 4.9 驗證 eye-calibration.html 可正常運行

## 5. 主系統整合 - main.js 修改
- [x] 5.1 在 constructor() 添加 `this.eyeMapper = null;` 初始化
- [x] 5.2 在 initModules() 方法中添加 EyeImageMapper 初始化程式碼
  - 實例化 EyeImageMapper
  - 非同步加載座標數據
  - 登錄成功/失敗訊息
- [x] 5.3 在 handleAnnotationClick(e) 方法中添加眼睛系統處理邏輯
  - 檢查 systemId === 'eye'
  - 驗證 eyeMapper 已加載
  - 呼叫 getStructureAtPosition(x, y)
  - 識別成功時打開疾病表單
  - 識別失敗時顯示提示訊息
- [x] 5.4 確保牙齒系統邏輯保持不變（向後相容）

## 6. 主應用頁面修改 - index.html
- [x] 6.1 確保眼睛標籤頁已正確設置（data-system="eye"）
- [x] 6.2 在 `</body>` 前添加 eye-image-mapper.js 腳本載入
  - `<script src="assets/scripts/eye-image-mapper.js"></script>`
  - 確保在 main.js 之前載入
- [x] 6.3 測試頁面載入不出現 JavaScript 錯誤

## 7. 座標校正與驗證
- [ ] 7.1 在瀏覽器開啟 eye-calibration.html
- [ ] 7.2 逐個點擊每個眼睛結構，記錄座標
- [ ] 7.3 根據 3Deye.png 圖像，精確定位 10 個結構的中心和半徑
- [ ] 7.4 導出座標數據
- [ ] 7.5 更新 data/eye-coordinates.json 為校正後的精確座標

## 8. 功能測試
- [ ] 8.1 在主應用中點擊眼睛標籤頁，確認頁面切換
- [ ] 8.2 確認 3Deye.png 圖像正確加載
- [ ] 8.3 點擊右眼角膜區域，確認識別出「右眼角膜」
- [ ] 8.4 驗證疾病表單彈出並顯示眼科疾病分類
- [ ] 8.5 選擇一個眼科疾病（如結膜炎）並保存
- [ ] 8.6 驗證標註被記錄至病歷
- [ ] 8.7 測試點擊圖像邊界外不發生錯誤
- [ ] 8.8 測試不同瀏覽器相容性（Chrome, Firefox, Safari）

## 9. 調試與優化
- [ ] 9.1 開啟瀏覽器開發者工具，檢查 JavaScript 控制台無錯誤
- [ ] 9.2 驗證 `app.eyeMapper.isLoaded` 為 true
- [ ] 9.3 驗證 `app.eyeMapper.getAllStructures().length` 為 10
- [ ] 9.4 測試調試模式：在 eye-calibration.html 中可視化所有結構區域
- [ ] 9.5 優化效能：確認點擊檢測響應時間 < 100ms

## 10. OpenSpec 驗證與提交
- [ ] 10.1 運行 `openspec validate add-eye-coordinate-system --strict` 最終驗證
- [ ] 10.2 更新 tasks.md，所有項目標記為 `[x]`
- [ ] 10.3 確認所有檔案已創建且無遺漏
- [ ] 10.4 準備 Git 提交訊息
- [ ] 10.5 執行 git add 和 git commit
- [ ] 10.6 驗證提交成功

## 預估投入時間

| 階段 | 任務數 | 預估時間 |
|------|--------|---------|
| OpenSpec 提案 | 5 | 30 分鐘 |
| 座標資料結構 | 3 | 20 分鐘 |
| EyeImageMapper 類別 | 9 | 60 分鐘 |
| 校正工具 | 9 | 45 分鐘 |
| 主系統整合 | 4 | 30 分鐘 |
| HTML 修改 | 3 | 10 分鐘 |
| 座標校正 | 5 | 30 分鐘 |
| 功能測試 | 8 | 45 分鐘 |
| 調試優化 | 5 | 20 分鐘 |
| 提交完成 | 6 | 15 分鐘 |
| **總計** | **57** | **约 4.5 小時** |

## 完成定義

- ✅ 所有 57 個任務項目標記為 `[x]`
- ✅ OpenSpec 驗證通過 `--strict` 模式
- ✅ eye-coordinates.json 包含 10 個精確校正的結構座標
- ✅ 主應用眼睛系統完全可用
- ✅ 無 JavaScript 錯誤或警告
- ✅ 代碼遵循專案風格指南
- ✅ 所有註解使用中文繁體
