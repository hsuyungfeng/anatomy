---
phase: phase-5
plan: 02
type: execute
wave: 2
depends_on: [01]
files_modified:
  - assets/scripts/ocr-handler.js
  - doc/tests/ocr_match_test.py
  - doc/tests/run_all.py
autonomous: true
requirements:
  - FIX-04
must_haves:
  truths:
    - "OCRHandler.matchDiseases 不再丟出 TypeError: Object.forEach is not a function"
    - "給定含有疾病中文名稱的文字，matchDiseases 會回傳對應的疾病"
    - "專案中 `grep -rn 'Object.forEach' assets/` 沒有結果"
---

<objective>
修復 `assets/scripts/ocr-handler.js:101` 誤用不存在的 `Object.forEach`（跟 Phase 4 修過的 utils.js `formatDateTime` 是同一類錯誤），導致 OCR 疾病比對一執行就丟例外。
</objective>

<context>
目前程式碼（ocr-handler.js 約 100 行）：
```js
const searchCategories = (categories) => {
  Object.forEach((categoryId, category) => {
    ...
  }, categories);
```
原意是走訪 `categories` 物件的每個 `[categoryId, category]`。正確寫法：
```js
Object.entries(categories).forEach(([categoryId, category]) => {
```
注意：參數順序原本是 `(categoryId, category)`，改用 `Object.entries` 後要解構成 `[categoryId, category]`；並確認函式結尾的 `}, categories);` 改成 `});`。
請讀完整個 `matchDiseases`，確認 `diseaseDatabase` 的實際結構（從 data/disease-categories.json 與呼叫端確認 categories 是物件還是陣列），如果是陣列就用 `categories.forEach(category => ...)`，並在 SUMMARY 說明判斷依據。
</context>

<tasks>

<task type="auto">
  <name>Task 1：先寫失敗測試</name>
  <files>doc/tests/ocr_match_test.py, doc/tests/run_all.py</files>
  <action>
用 playwright 開啟 index.html，等待 `window.app` 出現，並確認 `app.ocrHandler` 存在（沒有的話就用 `new OCRHandler()`，建構子參數從原始碼確認）。
從 data/disease-categories.json 挑一個實際存在的疾病中文名稱 X，呼叫 `matchDiseases('病人主訴 ' + X, <實際的疾病資料庫物件>)`（資料庫物件取得方式要跟正式呼叫端一致），斷言：
1. 沒有丟出例外
2. 回傳陣列中至少有一筆的 name 等於 X
加進 run_all.py，先執行確認 FAIL。
  </action>
  <verify>修復前 FAIL</verify>
</task>

<task type="auto">
  <name>Task 2：修正</name>
  <files>assets/scripts/ocr-handler.js</files>
  <action>依 context 修正。不要動 matchDiseases 以外的程式碼。</action>
  <verify>node --check assets/scripts/ocr-handler.js；grep -rn "Object.forEach" assets/ 沒有結果；python3 doc/tests/run_all.py --with-snapshot 全部通過（ocr-handler 不在 MedicalRecordApp 原型上，快照不應該變動）</verify>
</task>

</tasks>

<commit>
fix: 修正 OCR 疾病比對誤用 Object.forEach 導致例外
</commit>
