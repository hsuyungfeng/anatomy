/**
 * 身體系統快速驗證測試
 * 驗證：HTML 結構、CSS 類別、JS 方法、數據文件
 */

const fs = require('fs');
const path = require('path');

let testsPassed = 0;
let testsFailed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`✅ ${message}`);
    testsPassed++;
  } else {
    console.log(`❌ ${message}`);
    testsFailed++;
  }
}

function readFile(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf-8');
  } catch {
    return '';
  }
}

console.log('\n========== 身體系統快速驗證測試 ==========\n');

// 1. 驗證 HTML 結構
console.log('【HTML 結構驗證】');
const indexHtml = readFile('./index.html');
assert(indexHtml.includes('body-region-panel-container'), 'HTML: 身體部位面板容器存在');
assert(indexHtml.includes('body-region-grid'), 'HTML: 身體部位網格存在');
assert(indexHtml.includes('data-body-part="head"'), 'HTML: 頭部按鈕存在');
assert(indexHtml.includes('data-body-part="neck"'), 'HTML: 頸部按鈕存在');
assert(indexHtml.includes('data-body-part="chest"'), 'HTML: 胸部按鈕存在');
assert(indexHtml.includes('data-body-part="abdomen"'), 'HTML: 腹部按鈕存在');
assert(indexHtml.includes('data-body-part="arm"') && indexHtml.includes('data-side="left"'), 'HTML: 左臂按鈕存在');
assert(indexHtml.includes('data-body-part="arm"') && indexHtml.includes('data-side="right"'), 'HTML: 右臂按鈕存在');
assert(indexHtml.includes('data-body-part="leg"') && indexHtml.includes('data-side="left"'), 'HTML: 左腿按鈕存在');
assert(indexHtml.includes('data-body-part="leg"') && indexHtml.includes('data-side="right"'), 'HTML: 右腿按鈕存在');

// 2. 驗證 CSS 樣式
console.log('\n【CSS 樣式驗證】');
const modalCss = readFile('./assets/styles/modal.css');
assert(modalCss.includes('.body-region-panel-container'), 'CSS: 身體部位面板樣式存在');
assert(modalCss.includes('.body-region-btn'), 'CSS: 身體部位按鈕樣式存在');
assert(modalCss.includes('.body-region-grid'), 'CSS: 身體部位網格樣式存在');
assert(modalCss.includes('.body-structure-info'), 'CSS: 身體結構信息樣式存在');
assert(modalCss.includes('.record-group'), 'CSS: 病例分組樣式存在');

// 3. 驗證 JavaScript 方法
console.log('\n【JavaScript 方法驗證】');
const mainJs = readFile('./assets/scripts/main.js');
assert(mainJs.includes('setupBodyRegionButtonListeners()'), 'JS: setupBodyRegionButtonListeners 方法存在');
assert(mainJs.includes('openDiseaseModalWithBodyRegion'), 'JS: openDiseaseModalWithBodyRegion 方法存在');
assert(mainJs.includes('loadBodyRegionDiseases'), 'JS: loadBodyRegionDiseases 方法存在');
assert(mainJs.includes('displayBodyStructureInfo'), 'JS: displayBodyStructureInfo 方法存在');
assert(mainJs.includes('getChineseBodyRegionName'), 'JS: getChineseBodyRegionName 方法存在');
assert(mainJs.includes('getEnglishBodyRegionName'), 'JS: getEnglishBodyRegionName 方法存在');
assert(mainJs.includes('saveMedicalRecord'), 'JS: saveMedicalRecord 方法存在');
assert(mainJs.includes('loadMedicalRecords'), 'JS: loadMedicalRecords 方法存在');
assert(mainJs.includes('groupRecordsByBodyPart'), 'JS: groupRecordsByBodyPart 方法存在');
assert(mainJs.includes('displayBodyRecords'), 'JS: displayBodyRecords 方法存在');
assert(mainJs.includes('filterRecordsBySystem'), 'JS: filterRecordsBySystem 方法存在');
assert(mainJs.includes('toggleBodyRegionPanel'), 'JS: toggleBodyRegionPanel 方法存在');
assert(mainJs.includes('bodyDiseaseICD'), 'JS: ICD-10 對照表存在');

// 4. 驗證身體部位集成
console.log('\n【系統集成驗證】');
assert(mainJs.includes("this.setupBodyRegionButtonListeners()"), 'JS: setupBodyRegionButtonListeners 已初始化');
assert(mainJs.includes("systemId === 'body'") && mainJs.includes("toggleBodyRegionPanel"), 'JS: 身體系統切換邏輯完整');

// 5. 驗證數據文件
console.log('\n【數據文件驗證】');
const bodySystemsJson = readFile('./data/body-systems.json');
const bodyData = JSON.parse(bodySystemsJson || '{}');
assert(bodyData.bodyRegions, 'JSON: bodyRegions 欄位存在');
assert(bodyData.bodyRegions && bodyData.bodyRegions.length >= 6, 'JSON: 至少 6 個身體部位定義');
const bodyPartIds = bodyData.bodyRegions?.map(r => r.id) || [];
assert(bodyPartIds.includes('head'), 'JSON: 頭部部位定義存在');
assert(bodyPartIds.includes('neck'), 'JSON: 頸部部位定義存在');
assert(bodyPartIds.includes('chest'), 'JSON: 胸部部位定義存在');
assert(bodyPartIds.includes('abdomen'), 'JSON: 腹部部位定義存在');
assert(bodyPartIds.includes('arm'), 'JSON: 手臂部位定義存在');
assert(bodyPartIds.includes('leg'), 'JSON: 腿部部位定義存在');

// 6. 驗證 ICD-10 對照
console.log('\n【ICD-10 對照驗證】');
assert(mainJs.includes("'濕疹': 'L30.9'"), 'ICD: 濕疹對照存在');
assert(mainJs.includes("'帶狀疱疹': 'B02.9'"), 'ICD: 帶狀疱疹對照存在');
assert(mainJs.includes("'脂肪瘤': 'D17.9'"), 'ICD: 脂肪瘤對照存在');
assert(mainJs.includes("'蜂窩性組織炎': 'L03.9'"), 'ICD: 蜂窩性組織炎對照存在');

// 總結
console.log('\n========== 測試總結 ==========');
console.log(`✅ 通過: ${testsPassed}`);
console.log(`❌ 失敗: ${testsFailed}`);
console.log(`📊 通過率: ${((testsPassed / (testsPassed + testsFailed)) * 100).toFixed(1)}%`);
console.log(`\n【最終結果】${testsFailed === 0 ? '✅ 全部通過！' : '⚠️ 有失敗項目，請檢查'}\n`);

process.exit(testsFailed === 0 ? 0 : 1);
