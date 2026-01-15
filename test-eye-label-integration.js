#!/usr/bin/env node

/**
 * 眼睛標籤面板集成測試腳本
 * 用於自動化驗證眼睛標籤系統的所有功能
 *
 * 執行方法：
 * node test-eye-label-integration.js
 */

const fs = require('fs');
const path = require('path');

// 顏色定義
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(msg, color = 'reset') {
  console.log(`${colors[color]}${msg}${colors.reset}`);
}

function printSection(title) {
  log(`\n${'='.repeat(60)}`, 'bright');
  log(`  ${title}`, 'bright');
  log(`${'='.repeat(60)}\n`, 'bright');
}

function printSubSection(title) {
  log(`\n${title}`, 'cyan');
  log('-'.repeat(40), 'cyan');
}

function checkmark(condition) {
  return condition ? `${colors.green}✓${colors.reset}` : `${colors.red}✗${colors.reset}`;
}

// 測試計數
let totalTests = 0;
let passedTests = 0;
let failedTests = 0;
const failedTestsList = [];

function testResult(testName, condition, details = '') {
  totalTests++;

  if (condition) {
    passedTests++;
    log(`${checkmark(true)} ${testName}`, 'green');
  } else {
    failedTests++;
    log(`${checkmark(false)} ${testName}`, 'red');
    failedTestsList.push({ testName, details });
    if (details) {
      log(`  → ${details}`, 'dim');
    }
  }
}

// =============== 測試 1: 檢查 HTML 結構 ===============
printSection('測試 1: HTML 結構驗證');

const htmlPath = '/home/hsu/Desktop/anatomy/index.html';
let htmlContent = '';
let eyeLabelButtonCount = 0;

try {
  htmlContent = fs.readFileSync(htmlPath, 'utf-8');

  // 1.1 檢查眼睛標籤面板容器
  const hasPanelContainer = htmlContent.includes('id="eye-label-panel-container"');
  testResult('眼睛標籤面板容器存在', hasPanelContainer);

  // 1.2 檢查眼睛標籤按鈕
  const eyeLabelBtnRegex = /class="eye-label-btn"/g;
  const matches = htmlContent.match(eyeLabelBtnRegex);
  eyeLabelButtonCount = matches ? matches.length : 0;
  testResult('眼睛標籤按鈕數量正確', eyeLabelButtonCount === 26,
    `期望 26 個按鈕，實際 ${eyeLabelButtonCount} 個`);

  // 1.3 檢查左眼組
  const leftEyeGroup = htmlContent.includes('👁️ 左眼');
  testResult('左眼組標題存在', leftEyeGroup);

  // 1.4 檢查右眼組
  const rightEyeGroup = htmlContent.includes('👁️ 右眼');
  testResult('右眼組標題存在', rightEyeGroup);

  // 1.5 檢查共用結構組
  const sharedGroup = htmlContent.includes('🔗 共用結構');
  testResult('共用結構組標題存在', sharedGroup);

  // 1.6 檢查具體標籤按鈕
  const hasCorneaBtn = htmlContent.includes('data-structure-id="left-eye-cornea"');
  testResult('Cornea 按鈕存在', hasCorneaBtn);

  const hasIrisBtn = htmlContent.includes('data-structure-id="left-eye-iris"');
  testResult('Iris 按鈕存在', hasIrisBtn);

  const hasVitreousBtn = htmlContent.includes('data-structure-id="eye-vitreous"');
  testResult('Vitreous body 按鈕存在', hasVitreousBtn);

  // 1.7 檢查數據屬性
  const dataAttributeRegex = /data-structure-name-en="[^"]+"/g;
  const dataMatches = htmlContent.match(dataAttributeRegex);
  const hasDataAttributes = dataMatches && dataMatches.length === eyeLabelButtonCount;
  testResult('所有按鈕都有 data-structure-name-en 屬性', hasDataAttributes);

} catch (error) {
  log(`錯誤：無法讀取 HTML 文件: ${error.message}`, 'red');
  process.exit(1);
}

// =============== 測試 2: 檢查 JavaScript 代碼 ===============
printSection('測試 2: JavaScript 代碼驗證');

const jsPath = '/home/hsu/Desktop/anatomy/assets/scripts/main.js';
let jsContent = '';

try {
  jsContent = fs.readFileSync(jsPath, 'utf-8');

  // 2.1 檢查 setupEyeLabelButtonListeners 方法
  const hasSetupMethod = jsContent.includes('setupEyeLabelButtonListeners()');
  testResult('setupEyeLabelButtonListeners 方法存在', hasSetupMethod);

  // 2.2 檢查方法實現細節
  const methodImpl = jsContent.includes('const buttons = document.querySelectorAll(\'.eye-label-btn\')');
  testResult('方法實現查詢標籤按鈕', methodImpl);

  // 2.3 檢查 getChineseStructureName 方法
  const hasGetChineseMethod = jsContent.includes('getChineseStructureName(structureId)');
  testResult('getChineseStructureName 方法存在', hasGetChineseMethod);

  // 2.4 檢查中文名稱映射
  const hasChineseMappings = jsContent.includes("'left-eye-cornea': '角膜'");
  testResult('角膜的中文映射存在', hasChineseMappings);

  const hasVitrousMapping = jsContent.includes("'eye-vitreous': '玻璃體'");
  testResult('玻璃體的中文映射存在', hasVitrousMapping);

  // 2.5 檢查 getStructureType 方法
  const hasTypeMethod = jsContent.includes('getStructureType(structureId)');
  testResult('getStructureType 方法存在', hasTypeMethod);

  // 2.6 檢查 getStructureSide 方法
  const hasSideMethod = jsContent.includes('getStructureSide(structureId)');
  testResult('getStructureSide 方法存在', hasSideMethod);

  // 2.7 檢查 openDiseaseModalWithStructure 方法
  const hasOpenModalMethod = jsContent.includes('openDiseaseModalWithStructure(structureInfo)');
  testResult('openDiseaseModalWithStructure 方法存在', hasOpenModalMethod);

  // 2.8 檢查 toggleEyeLabelPanel 方法
  const hasToggleMethod = jsContent.includes('toggleEyeLabelPanel(visible');
  testResult('toggleEyeLabelPanel 方法存在', hasToggleMethod);

  // 2.9 檢查在 setupEventListeners 中的調用
  const setupEventCall = jsContent.includes('this.setupEyeLabelButtonListeners()');
  testResult('setupEyeLabelButtonListeners 在 setupEventListeners 中被調用', setupEventCall);

  // 2.10 檢查在 loadSystemImage 中的面板切換
  const loadImageCall = jsContent.includes('this.toggleEyeLabelPanel(systemId === \'eye\')');
  testResult('toggleEyeLabelPanel 在 loadSystemImage 中被調用', loadImageCall);

} catch (error) {
  log(`錯誤：無法讀取 JavaScript 文件: ${error.message}`, 'red');
  process.exit(1);
}

// =============== 測試 3: 檢查 CSS 樣式 ===============
printSection('測試 3: CSS 樣式驗證');

const cssPath = '/home/hsu/Desktop/anatomy/assets/styles/modal.css';
let cssContent = '';

try {
  cssContent = fs.readFileSync(cssPath, 'utf-8');

  // 3.1 檢查眼睛標籤面板容器樣式
  const hasPanelStyle = cssContent.includes('.eye-label-panel-container');
  testResult('眼睛標籤面板容器樣式定義存在', hasPanelStyle);

  // 3.2 檢查眼睛標籤按鈕樣式
  const hasButtonStyle = cssContent.includes('.eye-label-btn');
  testResult('眼睛標籤按鈕樣式定義存在', hasButtonStyle);

  // 3.3 檢查按鈕懸停效果
  const hasHoverStyle = cssContent.includes('.eye-label-btn:hover');
  testResult('眼睛標籤按鈕懸停樣式存在', hasHoverStyle);

  // 3.4 檢查按鈕點擊效果
  const hasActiveStyle = cssContent.includes('.eye-label-btn:active');
  testResult('眼睛標籤按鈕點擊樣式存在', hasActiveStyle);

  // 3.5 檢查眼睛標籤組樣式
  const hasGroupStyle = cssContent.includes('.eye-label-group');
  testResult('眼睛標籤組樣式定義存在', hasGroupStyle);

  // 3.6 檢查過渡動畫
  const hasTransition = cssContent.includes('transition:');
  testResult('按鈕過渡動畫定義存在', hasTransition);

  // 3.7 檢查結構信息樣式
  const hasEyeStructureInfo = cssContent.includes('.eye-structure-info');
  testResult('眼睛結構信息樣式定義存在', hasEyeStructureInfo);

} catch (error) {
  log(`錯誤：無法讀取 CSS 文件: ${error.message}`, 'red');
  process.exit(1);
}

// =============== 測試 4: 邏輯驗證 ===============
printSection('測試 4: 邏輯驗證');

// 4.1 驗證按鈕與中文映射一致性
printSubSection('4.1 按鈕與中文映射驗證');

const btnDataRegex = /data-structure-id="([^"]+)"\s+data-structure-name-en="([^"]+)"/g;
const chineseMapRegex = /'([^']+)':\s*'([^']+)'/g;

const buttons = new Map();
let match;
while ((match = btnDataRegex.exec(htmlContent)) !== null) {
  buttons.set(match[1], match[2]);
}

const chineseMap = new Map();
while ((match = chineseMapRegex.exec(jsContent)) !== null) {
  chineseMap.set(match[1], match[2]);
}

let mappingConsistency = 0;
buttons.forEach((enName, structureId) => {
  if (chineseMap.has(structureId)) {
    mappingConsistency++;
  }
});

const mappingPassed = mappingConsistency === buttons.size;
testResult(`所有 ${buttons.size} 個按鈕都有中文映射`, mappingPassed,
  `已映射 ${mappingConsistency}/${buttons.size}`);

// 4.2 驗證結構類型邏輯
printSubSection('4.2 結構類型邏輯驗證');

const typeChecks = [
  ['left-eye-cornea', 'cornea'],
  ['left-eye-iris', 'iris'],
  ['right-eye-cornea', 'cornea'],
  ['eye-vitreous', 'vitreous'],
];

let typeLogicCorrect = true;
typeChecks.forEach(([structId, expectedType]) => {
  const typeRegex = new RegExp(`if \\(structureId\\.includes\\('${expectedType.split('-')[0]}'\\)\\) return '${expectedType}'`);
  if (!jsContent.match(typeRegex) && !jsContent.includes(`'${structId}'`)) {
    typeLogicCorrect = false;
  }
});

testResult('結構類型識別邏輯正確', typeLogicCorrect);

// 4.3 驗證側眼（left/right/bilateral）識別
printSubSection('4.3 眼睛側面識別邏輯驗證');

const sideLogicCorrect =
  jsContent.includes("if (structureId.startsWith('left-eye')) return 'left'") &&
  jsContent.includes("if (structureId.startsWith('right-eye')) return 'right'") &&
  jsContent.includes("return 'bilateral'");

testResult('眼睛側面識別邏輯正確', sideLogicCorrect);

// =============== 測試 5: 功能流程驗證 ===============
printSection('測試 5: 功能流程驗證');

// 5.1 驗證事件監聽綁定
const eventBinding = jsContent.includes('button.addEventListener(\'click\', async (e) => {');
testResult('標籤按鈕事件監聽綁定正確', eventBinding);

// 5.2 驗證模態視窗打開流程
const modalOpenFlow = jsContent.includes('await this.openDiseaseModalWithStructure(structureInfo)');
testResult('模態視窗打開流程正確', modalOpenFlow);

// 5.3 驗證結構信息對象創建
const structureInfoCreation = jsContent.includes('structureId: structureId,') &&
                             jsContent.includes('nameEn: structureNameEn,');
testResult('結構信息對象創建正確', structureInfoCreation);

// 5.4 驗證面板可見性控制
const panelVisibility = jsContent.includes('panelContainer.style.display = \'block\'') &&
                       jsContent.includes('panelContainer.style.display = \'none\'');
testResult('面板可見性控制邏輯正確', panelVisibility);

// =============== 測試 6: 日誌輸出驗證 ===============
printSection('測試 6: 日誌和調試輸出驗證');

const logs = [
  ['setupEyeLabelButtonListeners 調試日誌', '[setupEyeLabelButtonListeners]'],
  ['toggleEyeLabelPanel 調試日誌', '[toggleEyeLabelPanel]'],
  ['openDiseaseModalWithStructure 調試日誌', '[openDiseaseModalWithStructure]'],
  ['按鈕計數日誌', '已為'],
];

logs.forEach(([logName, searchStr]) => {
  testResult(`${logName}存在`, jsContent.includes(searchStr));
});

// =============== 測試結果總結 ===============
printSection('測試結果總結');

log(`總測試數：${totalTests}`);
log(`通過測試：${passedTests}`, 'green');
log(`失敗測試：${failedTests}`, failedTests > 0 ? 'red' : 'green');

if (failedTests > 0) {
  printSubSection('失敗的測試詳情');
  failedTestsList.forEach((item, idx) => {
    log(`${idx + 1}. ${item.testName}`, 'red');
    if (item.details) {
      log(`   ${item.details}`, 'dim');
    }
  });
}

// =============== 最終報告 ===============
printSection('最終報告');

const passPercentage = totalTests > 0 ? ((passedTests / totalTests) * 100).toFixed(1) : 0;
const overallStatus = failedTests === 0 ? '✓ 全部通過' : '✗ 有失敗項';

log(`通過率：${passPercentage}%`, failedTests === 0 ? 'green' : 'red');
log(`狀態：${overallStatus}`, failedTests === 0 ? 'green' : 'red');

if (failedTests === 0) {
  log('\n🎉 眼睛標籤面板集成測試已通過！所有功能已準備好進行瀏覽器測試。', 'green');
} else {
  log('\n⚠️ 發現了一些問題需要修復。請檢查上面的失敗項。', 'yellow');
}

log(`\n📝 測試時間：${new Date().toLocaleString('zh-Hans-CN')}`, 'dim');

process.exit(failedTests === 0 ? 0 : 1);
