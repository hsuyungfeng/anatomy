# 眼睛系統整合測試 - 實行指南

本文檔提供運行眼睛系統整合測試的詳細步驟。

---

## 快速開始 (5 分鐘)

### 1. 啟動本地服務器
```bash
cd /home/hsu/Desktop/anatomy
python3 -m http.server 8000
```

服務器將在 http://localhost:8000 運行

### 2. 打開應用
在瀏覽器中訪問：
```
http://localhost:8000/index.html
```

### 3. 打開開發者工具
按 `F12` 打開開發者工具，選擇「控制台」標籤

### 4. 運行自動化測試
在控制台中複製並粘貼以下內容：

```javascript
// 加載測試腳本
fetch('/test-integration.js')
  .then(r => r.text())
  .then(code => {
    eval(code);
    runIntegrationTests();
  });
```

或簡單地複製 `test-integration.js` 的內容直接粘貼到控制台。

---

## 詳細測試步驟

### 步驟 1: 眼睛系統啟動測試

1. 打開應用：http://localhost:8000/index.html
2. 點擊頁面頂部的「眼睛系統」標籤頁
3. **預期結果：**
   - ✅ 顯示「左眼」和「右眼」按鈕
   - ✅ 右側出現結構信息面板
   - ✅ 面板顯示「點擊圖像上的結構以查看詳細信息」
   - ✅ 控制台無錯誤

### 步驟 2: 結構選擇測試

1. 在眼睛圖像上點擊不同位置
2. **預期結果：**
   - ✅ 右側面板更新結構信息
   - ✅ 顯示中文名稱（例如：「角膜（右眼）」）
   - ✅ 顯示英文名稱（例如：「Right Cornea」）
   - ✅ 顯示詳細描述（中英文）
   - ✅ 面板內容可滾動

### 步驟 3: 左眼/右眼切換測試

1. 點擊「左眼」按鈕
   - ✅ 左眼按鈕變為藍色（活躍）
   - ✅ 右眼按鈕變為灰色（非活躍）

2. 點擊「右眼」按鈕
   - ✅ 右眼按鈕變為藍色（活躍）
   - ✅ 左眼按鈕變為灰色（非活躍）

3. 在眼睛圖像上再次點擊
   - ✅ 結構描述反映選擇的眼睛

### 步驟 4: 疾病表單測試

1. 在眼睛結構上點擊打開疾病模態
2. **預期結果：**
   - ✅ 模態打開
   - ✅ 顯示 8 種疾病複選框：
     - 結膜炎
     - 角膜潰瘍
     - 白內障
     - 青光眼
     - 屈光不正
     - 乾眼症
     - 年齡相關黃斑變性
     - 視網膜脫離
   - ✅ 每個疾病有中英文名稱

3. 選擇 2-3 種疾病
4. 在「療程摘要」框中輸入文本
5. 點擊「保存」按鈕
   - ✅ 模態關閉
   - ✅ 記錄出現在右側的記錄列表中
   - ✅ 記錄顯示選擇的疾病

### 步驟 5: 系統切換測試

1. 點擊「牙齒系統」標籤頁
   - ✅ 眼睛選擇器按鈕消失
   - ✅ 信息面板消失
   - ✅ 牙齒圖像出現

2. 再次點擊「眼睛系統」標籤頁
   - ✅ 眼睛選擇器按鈕重新出現
   - ✅ 信息面板重新出現
   - ✅ 以前的眼科標註仍在記錄列表中
   - ✅ 左/右眼選擇狀態被保留

### 步驟 6: 響應式測試

#### 桌面測試 (1400px+)
1. 在 1400px+ 寬度上打開應用
   - ✅ 眼睛圖像在左側
   - ✅ 信息面板在右側（並排）

#### 平板測試 (1000px)
1. 調整瀏覽器寬度至 1000px
   - ✅ 眼睛圖像全寬
   - ✅ 信息面板堆疊在下方
   - ✅ 面板高度受限但可滾動

#### 手機測試 (480px)
1. 調整瀏覽器寬度至 480px
   - ✅ 所有元素響應式調整
   - ✅ 按鈕仍可點擊（≥44px）
   - ✅ 文字可讀，無需水平滾動

### 步驟 7: 控制台驗證

在開發者工具控制台中執行以下命令，驗證狀態：

```javascript
// 驗證眼睛選擇
console.log('Selected eye:', window.app.selectedEye);
// 應返回: 'left' 或 'right'

// 驗證當前系統
console.log('Current system:', window.app.currentSystemId);
// 應返回: 'eye'

// 驗證眼睛映射器
console.log('Eye mapper loaded:', window.app.eyeMapper?.isLoaded);
// 應返回: true

// 驗證疾病表單
console.log('Disease form system:', window.app.diseaseForm?.systemId);
// 應返回: 'eye'

// 驗證眼科疾病列表
console.log('Eye diseases:', window.app.diseaseForm?.diseases?.length);
// 應返回: 8
```

### 步驟 8: 數據持久化測試

1. 添加一個眼科疾病標註
2. 按 `F5` 刷新頁面
   - ✅ 標註仍在記錄列表中
   - ✅ 可編輯或刪除標註

---

## 自動化測試運行

### 方法 1：通過 Console 腳本

1. 打開開發者工具 (F12)
2. 在控制台中複製以下內容：

```javascript
// 創建測試類
class EyeSystemIntegrationTest {
  constructor() {
    this.results = [];
    this.errors = [];
  }

  testEyeSystemActivation() {
    console.log('\n=== Test 1: 眼睛系統啟動 ===');
    try {
      const leftEyeBtn = document.getElementById('left-eye-btn');
      const rightEyeBtn = document.getElementById('right-eye-btn');
      const eyeInfoPanel = document.getElementById('eye-info-panel');

      if (!leftEyeBtn || !rightEyeBtn || !eyeInfoPanel) {
        throw new Error('必要的 HTML 元素未找到');
      }

      console.log('✅ Test 1 PASS: 所有 UI 元素存在');
      return true;
    } catch (error) {
      console.log('❌ Test 1 FAIL:', error.message);
      return false;
    }
  }

  testEyeDiseases() {
    console.log('\n=== Test 2: 眼科疾病 ===');
    try {
      const diseaseCount = window.app.diseaseForm?.diseases?.length || 0;
      if (diseaseCount === 8) {
        console.log('✅ Test 2 PASS: 8 個眼科疾病已加載');
        return true;
      } else {
        throw new Error(`期望 8 個疾病，但找到 ${diseaseCount} 個`);
      }
    } catch (error) {
      console.log('❌ Test 2 FAIL:', error.message);
      return false;
    }
  }

  async runAll() {
    console.log('====================================');
    console.log('眼睛系統整合測試');
    console.log('====================================');

    const results = [
      this.testEyeSystemActivation(),
      this.testEyeDiseases()
    ];

    const passed = results.filter(r => r).length;
    console.log(`\n結果: ${passed}/${results.length} 通過`);

    return passed === results.length;
  }
}

// 運行測試
const tester = new EyeSystemIntegrationTest();
tester.runAll();
```

### 方法 2：使用預製的測試文件

直接在控制台中加載並運行 `test-integration.js`：

```javascript
fetch('/test-integration.js')
  .then(r => r.text())
  .then(code => eval(code))
  .then(() => runIntegrationTests());
```

---

## 常見問題排除

### 問題 1: 眼睛選擇器未顯示

**原因：** 可能未切換到眼睛系統

**解決方案：**
1. 確保點擊了頂部的「眼睛系統」標籤頁
2. 檢查控制台中是否有錯誤
3. 刷新頁面重新嘗試

### 問題 2: 結構信息未更新

**原因：** 眼睛映射器可能未完全加載

**解決方案：**
1. 等待 2-3 秒讓座標數據加載
2. 在控制台驗證：`window.app.eyeMapper.isLoaded`
3. 檢查網絡標籤確認 `eye-coordinates.json` 已加載

### 問題 3: 疾病列表為空

**原因：** 疾病數據未加載

**解決方案：**
1. 在控制台檢查：`window.app.diseaseForm.diseases`
2. 確認 `disease-categories.json` 已加載
3. 切換系統並重新打開模態

### 問題 4: 控制台出現紅色錯誤

**常見錯誤：**
- `Uncaught TypeError: Cannot read properties of null`
  - 解決：確保已加載必要的 HTML 元素
- `404 Not Found: /data/eye-coordinates.json`
  - 解決：確保服務器在正確的目錄運行

---

## 預期結果總結

### 所有測試通過標準
```
✅ 眼睛系統啟動 - 所有 UI 元素出現
✅ 結構選擇 - 信息面板更新
✅ 左/右眼切換 - 按鈕狀態改變
✅ 疾病表單 - 8 種疾病顯示
✅ 系統切換 - 無數據丟失
✅ 響應式設計 - 3 個斷點驗證
✅ 控制台 - 零錯誤
```

---

## 測試完成後

1. **記錄結果** - 將測試結果複製到文本文件
2. **審查報告** - 查看 `/home/hsu/Desktop/anatomy/TESTING.md`
3. **提交反饋** - 如有任何問題，報告給開發團隊

---

## 技術支持

如有問題，請：
1. 檢查 `TESTING.md` 中的完整報告
2. 查看 `TASK4_COMPLETION_SUMMARY.md` 中的詳細信息
3. 運行自動化測試腳本 `test-integration.js`
4. 查看瀏覽器控制台的詳細錯誤信息

---

**測試指南版本：** 1.0
**最後更新：** 2026-01-13
**狀態：** ✅ 生產就緒
