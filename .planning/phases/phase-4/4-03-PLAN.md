---
phase: phase-4
plan: 03
type: execute
wave: 3
depends_on: [01, 02]
files_modified:
  - assets/scripts/main.js
  - assets/scripts/app/app-core.js
  - assets/scripts/app/app-eye.js
  - assets/scripts/app/app-tooth.js
  - assets/scripts/app/app-body.js
  - assets/scripts/app/app-modal.js
  - assets/scripts/app/app-records.js
  - index.html
  - sw.js
autonomous: true
requirements:
  - IMP-01
must_haves:
  truths:
    - "main.js 只剩啟動程式碼（DOMContentLoaded → new MedicalRecordApp()），少於 30 行"
    - "assets/scripts/app/ 底下每個檔案都少於 800 行"
    - "Task 1–3 完成後 `snapshot_prototype.py --check` 通過，代表每個有效方法的原始碼完全沒變（純搬移）"
    - "Service Worker 快取清單包含新檔案，CACHE_NAME 升版"
---

<objective>
把 3106 行的 main.js 依功能領域拆成 6 個檔案，**只搬移、不改寫**。行為必須完全不變，由 4-01 的原型快照驗證。
搬移完成、快照確認後，再另外做一次「移除 console.log」清理。
</objective>

<context>
## 關鍵事實：main.js 有 5 個方法重複定義

在 JS class 中，同名方法**後面的定義會覆蓋前面的**，所以前面那個是永遠不會執行的死碼：

| 方法 | 死碼（刪除） | 有效（保留） |
|------|-------------|-------------|
| saveDiseaseAnnotation | 第 1910 行（async 版） | 第 2858 行 |
| saveMedicalRecord | 第 2272 行 | 第 2917 行 |
| loadMedicalRecords | 第 2308 行 | 第 2933 行 |
| filterRecordsBySystem | 第 2334 行（參數 systemId） | 第 3037 行（參數 systemType） |
| loadAndDisplayRecords | 第 2633 行 | 第 2946 行 |

**規則：只保留「有效」版本，刪除死碼版本。絕對不要把兩個版本合併，也不要「修正」有效版本的邏輯**，即使看起來有 bug（例如 3037 行的 switch 用 `'tooth'`，但 currentSystemId 是 `'teeth'`）。發現的疑似 bug 一律寫進 SUMMARY 的「發現的問題」段落，交由使用者決定。
快照只會看到有效版本，所以刪除死碼後 `--check` 仍應通過。

## 拆分方式：原型混入（不改成 ES module）

專案用傳統 `<script>`，沒有打包工具。做法：
1. `app-core.js` 保留 `class MedicalRecordApp { ... }` 本體，並在檔尾定義輔助函式：
   ```js
   function defineAppMethods(methods) {
     // 與 class 方法一致：不可列舉
     for (const [name, desc] of Object.entries(Object.getOwnPropertyDescriptors(methods))) {
       desc.enumerable = false;
       Object.defineProperty(MedicalRecordApp.prototype, name, desc);
     }
   }
   ```
2. 其他檔案：
   ```js
   defineAppMethods({
     methodA(args) {
       ...原封不動的方法內容...
     },

     async methodB() {
       ...
     },
   });
   ```
   方法本體逐字複製，縮排維持「方法簽名 2 格、內容 4 格」，跟原本在 class 裡一樣。
3. `main.js` 只留下：
   ```js
   // 應用啟動
   document.addEventListener('DOMContentLoaded', () => {
     window.app = new MedicalRecordApp();
   });
   ```

## 方法 → 檔案對應表（行號以目前 main.js 為準）

**app-core.js**（class 本體）：constructor(9), init(31), setupLanguage(70), setupTheme(86), setTheme(105), setupKeyboardShortcuts(128), switchLanguage(189), loadData(209), initModules(222), setupEventListeners(319), handleSystemTabClick(786), handleTeethTypeChange(827), loadTeethSystem(843), loadSystemImage(864), loadAnnotations(943), handleAnnotationClick(993)

**app-eye.js**：setupEyeLabelButtonListeners(459), getChineseStructureName(494), getStructureType(530), getStructureSide(554), openDiseaseModalWithStructure(564), displayEyeStructureInfo(660), toggleEyeInfoPanel(696), toggleEyeLabelPanel(973), detectEyeStructure(1146), estimateEyeLocation(1832)

**app-tooth.js**：detectToothPosition(1021), detectToothPositionFallback(1120), renderManualToothSelector(1552), setupManualToothSelector(1594), estimateToothLocation(1783)

**app-body.js**：detectBodyRegion(1262), renderManualBodySelector(1630), setupManualBodySelector(1677), estimateBodyLocation(1868), saveBodyOperation(2061), openDiseaseModalWithBodyRegion(2698), displayBodyStructureInfo(2732), loadBodySystemsData(2755), loadBodyRegionDiseases(2770), getChineseBodyRegionName(2824), getEnglishBodyRegionName(2841), groupRecordsByBodyPart(2966), displayBodyRecords(2993)，以及檔尾的 `const bodyDiseaseICD = {...}` 與 `MedicalRecordApp.prototype.bodyDiseaseICD = bodyDiseaseICD;`（這行保持原樣，因為它原本就是可列舉的指派）

**app-modal.js**：setupDiseaseModal(716), initializeDiseaseForm(757), openDiseaseModal(1363), closeDiseaseModal(1726), getLocationName(1749), saveDiseaseAnnotation(**2858 版**)

**app-records.js**：updateRecordList(2146), exportRecord(2219), clearRecords(2232), handleRecordTabClick(2245), groupRecordsByStructure(2363), formatTimestamp(2435), fixLegacyRecords(2462), renderGroupedRecords(2492), saveMedicalRecord(**2917 版**), loadMedicalRecords(**2933 版**), loadAndDisplayRecords(**2946 版**), filterRecordsBySystem(**3037 版**)

方法上方的 JSDoc 註解跟著方法一起搬。若發現對應表沒列到的方法，放進最相關的檔案，並記錄在 SUMMARY。

## 載入順序（index.html 第 501 行）

把 `<script src="assets/scripts/main.js"></script>` 換成：
```html
<script src="assets/scripts/app/app-core.js"></script>
<script src="assets/scripts/app/app-eye.js"></script>
<script src="assets/scripts/app/app-tooth.js"></script>
<script src="assets/scripts/app/app-body.js"></script>
<script src="assets/scripts/app/app-modal.js"></script>
<script src="assets/scripts/app/app-records.js"></script>
<script src="assets/scripts/main.js"></script>
```
（`pages/medical-record.html` 沒有載入 main.js，不用改。）

## sw.js
- `CACHE_NAME` 從 `'anatomy-v1'` 改成 `'anatomy-v2'`
- 在 `ASSETS_TO_CACHE` 的 `'/assets/scripts/main.js'` 後面加入 6 個 app/*.js 路徑
</context>

<tasks>

<task type="auto">
  <name>Task 1：建立 app/ 檔案並搬移方法</name>
  <files>assets/scripts/app/*.js, assets/scripts/main.js</files>
  <action>
依對應表搬移。建議用 Python 腳本依行號範圍切出方法文字（放在 scratch 位置，不要提交），比手動複製可靠。
每個方法的範圍＝從它的 JSDoc 註解開頭到它的結尾 `  }`。
刪除 5 個死碼版本。
  </action>
  <verify>
- `wc -l assets/scripts/app/*.js assets/scripts/main.js`：每個 app 檔案 < 800 行，main.js < 30 行
- `for f in assets/scripts/app/*.js assets/scripts/main.js; do node --check $f; done` 全部通過
  </verify>
</task>

<task type="auto">
  <name>Task 2：更新 index.html 與 sw.js</name>
  <files>index.html, sw.js</files>
  <action>依 context 修改。</action>
  <verify>grep -c "assets/scripts/app/" index.html 輸出 6；grep -c "assets/scripts/app/" sw.js 輸出 6</verify>
</task>

<task type="auto">
  <name>Task 3：快照驗證（關鍵閘門）</name>
  <files>（無）</files>
  <action>
執行 `python3 doc/tests/run_all.py --with-snapshot`。
- 如果快照顯示「缺少」或「內容不同」：代表搬移時漏掉或改動了方法，**修正搬移結果，不要用 `--write` 蓋掉基準**。
- 全部通過才能提交：`refactor: 將 main.js 拆分為 app/ 下的領域模組（純搬移）`
  </action>
  <verify>python3 doc/tests/run_all.py --with-snapshot 結束碼 0</verify>
</task>

<task type="auto">
  <name>Task 4：移除除錯用 console.log（獨立提交）</name>
  <files>assets/scripts/app/*.js</files>
  <action>
刪除 app/*.js 裡所有 `console.log(...)` 陳述式（包括跨多行的）。**保留** `console.error` 和 `console.warn`。
如果移除 console.log 後，留下空的 if/else 區塊，就連同區塊一起刪除（前提是該區塊只有 log、沒有其他副作用）。
接著：
1. `node --check` 全部通過
2. `python3 doc/tests/run_all.py` 通過（不帶 --with-snapshot）
3. 用 `--check` 確認差異**只**來自有 console.log 的方法，再執行 `python3 doc/tests/snapshot_prototype.py --write` 更新基準
4. 提交：`chore: 移除 app 模組中的除錯 console.log`
  </action>
  <verify>grep -c "console.log" assets/scripts/app/*.js 全部為 0；run_all.py --with-snapshot 通過</verify>
</task>

</tasks>

<verification>
- Task 3 的提交中，快照必須跟 4-01 的基準**完全一致**（這證明是純搬移）
- 手動在瀏覽器開 http://localhost:8000 ，切換三個系統、新增一筆病歷，確認 DevTools Console 沒有錯誤
</verification>
