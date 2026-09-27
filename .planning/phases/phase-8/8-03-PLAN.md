---
phase: phase-8
plan: 03
type: execute
wave: 3
depends_on: [02]
files_modified:
  - assets/scripts/app/app-tooth.js
  - assets/scripts/app/app-modal.js
  - assets/scripts/app/app-core.js
  - index.html
  - sw.js
  - doc/tools/README.md
  - doc/tests/baseline/prototype-methods.json
  - doc/tests/baseline/assets-hash.json
autonomous: true
requirements:
  - SVG-05
must_haves:
  truths:
    - "app 中不再有牙齒的座標辨識程式碼（detectToothPosition、fallback、estimate、手動牙齒選擇器）"
    - "index.html 不再載入 dental-image-mapper.js；牙齒的疾病可視化 canvas 疊圖不再初始化"
    - "doc/tools/ 的牙齒校準工具仍可開啟（它們自己載入所需檔案），README 標註為已停用"
    - "全部測試 0 失敗 0 跳過"
---

<objective>
移除牙齒系統已經不再使用的座標辨識程式碼（死碼清理）。只動牙齒；眼睛、身體的座標辨識**不動**（之後的階段才處理）。
</objective>

<context>
## 要移除的（先 grep 確認每一項都已經沒有呼叫端，有呼叫端就停下來說明）
- app-tooth.js：`detectToothPosition`、`detectToothPositionFallback`、`renderManualToothSelector`、`setupManualToothSelector`
- 其他檔案中的 `estimateToothLocation`（確認位置）
- app-modal.js `openDiseaseModal` 中牙齒系統「沒有 preset 時用座標偵測」的分支，以及顯示手動牙齒選擇器的程式碼。牙齒系統在沒有 preset 時直接 return（理論上不會發生，因為點擊入口只剩牙位圖）。
- app-core.js：`this.dentalMapper` 的建立與載入、`this.diseaseVisualizer` 的建立（先確認 DiseaseVisualizer 只用在牙齒；如果眼睛或身體也在用就保留，並說明）
- index.html：`dental-image-mapper.js`、（若確認無用）`disease-visualization.js` 的 `<script>`；sw.js 同步移除

## 要保留的
- `assets/scripts/dental-image-mapper.js`、`assets/scripts/disease-visualization.js`、`data/dental-coordinates.json` 這些**檔案本身保留**，因為 `doc/tools/` 的工具頁會用到。
- 在 `doc/tools/README.md` 把牙齒相關工具（tooth-calibration、auto-calibrate-teeth、auto-tooth-detection、debug-tooth-detection、visualize-coordinates）標註：「Phase 8 起 app 改用 SVG 牙位圖，這些工具已不再影響 app，僅保留參考」。

## 驗證
- 快照 `--check`：差異只能是被刪除的方法，以及 openDiseaseModal、initModules（或建立 mapper 的方法）、loadSystemImage（若有改）。貼進 SUMMARY 後 `--write`。
- 執行 `python3 doc/tests/bump_cache.py`。
</context>

<tasks>

<task type="auto">
  <name>Task 1：移除死碼</name>
  <files>assets/scripts/app/*.js, index.html, sw.js, doc/tools/README.md</files>
  <action>依 context 移除與標註。</action>
  <verify>
- `grep -rn "detectToothPosition\|renderManualToothSelector\|setupManualToothSelector\|estimateToothLocation" assets/scripts/app/` 沒有結果
- `grep -n "dental-image-mapper" index.html sw.js` 沒有結果
- python3 doc/tests/run_all.py --with-snapshot 0 失敗 0 跳過
  </verify>
</task>

</tasks>

<commit>
refactor(teeth): 移除牙齒座標辨識死碼，校準工具標註為已停用
</commit>
