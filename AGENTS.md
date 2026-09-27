<!-- OPENSPEC:START -->
# OpenSpec Instructions

These instructions are for AI assistants working in this project.

Always open `@/openspec/AGENTS.md` when the request:
- Mentions planning or proposals (words like proposal, spec, change, plan)
- Introduces new capabilities, breaking changes, architecture shifts, or big performance/security work
- Sounds ambiguous and you need the authoritative spec before coding

Use `@/openspec/AGENTS.md` to learn:
- How to create and apply change proposals
- Spec format and conventions
- Project structure and guidelines

Keep this managed block so 'openspec update' can refresh the instructions.

<!-- OPENSPEC:END -->
# 專案慣例（給 AI 代理，例如 Antigravity / Claude Code）

## 語言與目錄
- 程式碼註解、提交訊息、文件一律使用**繁體中文**
- **新的文件與測試程式放在 `doc/`**（不是既有的 `docs/`）
  - `doc/tests/`：自動化測試；`doc/tests/legacy*`：舊的手動腳本（不在自動化流程內）
  - `doc/tools/`：除錯／校準工具頁，開啟方式 `http://localhost:8000/doc/tools/<頁面>.html`
- 規劃文件放在 `.planning/`（GSD 流程），每個階段的入口是 `.planning/phases/phase-N/N-PLAN.md`

## 架構重點
- 純靜態網頁，使用傳統 `<script>` 載入，**沒有打包工具、沒有 package.json**。不要引入 npm／pip 相依套件。
- `MedicalRecordApp` 的 class 本體在 `assets/scripts/app/app-core.js`，其他方法依領域放在 `app/app-{eye,tooth,body,modal,records}.js`，用 `defineAppMethods({...})` 註冊到原型；`assets/scripts/main.js` 只負責啟動。
  - 新增 app 檔案時，要同時加進 `index.html` 的 script 清單和 `sw.js` 的 `ASSETS_TO_CACHE`，並把 `CACHE_NAME` 升版。
  - 不要在 class 或 `defineAppMethods` 中重複定義同名方法（後面的會默默覆蓋前面的，Phase 5 的資料遺失 bug 就是這樣造成的）。
- **病歷資料只能透過 `RecordManager`（`assets/scripts/record-manager.js`）讀寫**，唯一的資料來源是 `localStorage['medicalRecords']`（扁平標註陣列，每筆都有 `system`：`teeth` / `eye` / `body`）。
  - 不要在其他檔案直接存取 `medicalRecords` 或 `anatomy-record-*`。
  - 系統判斷一律使用 `RecordManager.normalizeSystem()` / `matchesSystem()`（`primary_teeth` 視同 `teeth`）。
  - 不可以刪除 `anatomy-record-legacy-backup`（使用者舊資料的救命備份）。
- 把資料插入 `innerHTML` 模板時，使用者資料或外部資料一律使用 `escapeHtml()`（`utils.js`）。
- 不要新增 `console.log`（`console.error` / `console.warn` 可以）。

## 測試（修改後必跑）
```bash
python3 doc/tests/run_all.py --with-snapshot
```
- 必須 0 失敗、0 跳過。
- `doc/tests/baseline/prototype-methods.json` 是 `MedicalRecordApp` 每個方法的原始碼雜湊。刻意改變方法時，先 `snapshot_prototype.py --check` 確認差異只出現在你改過的方法，才可以 `--write`；**純重構時不可以更新基準**。
- 修 bug 或加功能時採用 TDD：先寫測試，並證明它在修改前會失敗。
- 不可以為了讓測試通過而放寬斷言、跳過測試，或修改計畫規定不能動的測試。

## 執行 `.planning` 計畫時
- 在獨立分支上工作；每份計畫完成後，撰寫 `N-0M-SUMMARY.md`（內容：做了什麼、修改的檔案、修改前後的測試輸出、發現的問題、偏離計畫之處），然後照計畫指定的訊息 commit。
- **不要 push**，由使用者審查後再合併。
- 範圍外的 bug 只記錄在 SUMMARY，不要順手修。
