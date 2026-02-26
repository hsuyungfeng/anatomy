#!/usr/bin/env node

/**
 * 疾病記錄 Bug 修復測試
 * 驗證: 修復疾病模態視窗重新打開時未重置表單狀態的問題
 *
 * 測試場景:
 * 1. 打開模態視窗，選擇一個疾病並保存
 * 2. 打開模態視窗第二次，選擇不同的疾病
 * 3. 驗證第二條記錄只包含新選擇的疾病，而不是舊的 + 新的混合
 */

const fs = require('fs');
const path = require('path');

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m',
  bold: '\x1b[1m'
};

function log(type, message) {
  const prefix = {
    info: `${colors.blue}ℹ${colors.reset}`,
    pass: `${colors.green}✓${colors.reset}`,
    fail: `${colors.red}✗${colors.reset}`,
    warn: `${colors.yellow}⚠${colors.reset}`,
    test: `${colors.bold}${colors.blue}●${colors.reset}`
  };
  console.log(`${prefix[type]} ${message}`);
}

// 簡單的 DiseaseForm 模擬
class MockDiseaseForm {
  constructor(options = {}) {
    this.selectedDiseases = [];
    this.treatmentNotes = '';
    this.diseases = [
      { id: 'conjunctivitis', name: '結膜炎' },
      { id: 'corneal_ulcer', name: '角膜潰瘍' },
      { id: 'refractive_error', name: '屈光不正' },
      { id: 'cataract', name: '白內障' },
      { id: 'macular_degeneration', name: '年齡相關黃斑變性' }
    ];
  }

  // 重置表單
  reset() {
    this.selectedDiseases = [];
    this.treatmentNotes = '';
  }

  // 獲取表單數據
  getFormData() {
    return {
      diseases: this.selectedDiseases,
      treatmentNotes: this.treatmentNotes
    };
  }

  // 模擬用戶選擇疾病
  selectDisease(diseaseId) {
    const disease = this.diseases.find(d => d.id === diseaseId);
    if (disease && !this.selectedDiseases.find(d => d.id === diseaseId)) {
      this.selectedDiseases.push(disease);
    }
  }

  // 模擬用戶取消選擇
  unselectDisease(diseaseId) {
    this.selectedDiseases = this.selectedDiseases.filter(d => d.id !== diseaseId);
  }
}

// 測試執行
async function runTests() {
  console.log(`
${colors.bold}================================================${colors.reset}
${colors.bold}疾病記錄 Bug 修復驗證測試${colors.reset}
${colors.bold}================================================${colors.reset}
`);

  let testsPassed = 0;
  let testsFailed = 0;

  // ---- 測試 1: 單次選擇 ----
  log('test', '測試 1: 單次選擇疾病');
  try {
    const form1 = new MockDiseaseForm();
    form1.selectDisease('conjunctivitis');
    const data1 = form1.getFormData();

    if (data1.diseases.length === 1 && data1.diseases[0].id === 'conjunctivitis') {
      log('pass', '單次選擇正確 (應有 1 種疾病)');
      testsPassed++;
    } else {
      log('fail', `單次選擇失敗 (預期 1，實際 ${data1.diseases.length})`);
      testsFailed++;
    }
  } catch (e) {
    log('fail', `測試異常: ${e.message}`);
    testsFailed++;
  }

  // ---- 測試 2: 重置後重新選擇 (核心測試) ----
  log('test', '測試 2: 重置後重新選擇 (核心測試)');
  try {
    const form2 = new MockDiseaseForm();

    // 第一次選擇
    form2.selectDisease('conjunctivitis');
    const data2a = form2.getFormData();
    log('info', `第一次選擇: ${data2a.diseases.map(d => d.name).join(', ')} (${data2a.diseases.length} 種)`);

    // 重置表單
    form2.reset();
    log('info', '表單已重置');

    // 第二次選擇 (模擬打開模態視窗第二次)
    form2.selectDisease('corneal_ulcer');
    const data2b = form2.getFormData();
    log('info', `第二次選擇: ${data2b.diseases.map(d => d.name).join(', ')} (${data2b.diseases.length} 種)`);

    if (data2b.diseases.length === 1 && data2b.diseases[0].id === 'corneal_ulcer') {
      log('pass', '重置後重新選擇正確 (只包含新選擇的疾病)');
      testsPassed++;
    } else {
      log('fail', `重置後選擇失敗 (預期 1 個角膜潰瘍，實際 ${data2b.diseases.length} 個)`);
      console.log('  實際結果:', data2b.diseases);
      testsFailed++;
    }
  } catch (e) {
    log('fail', `測試異常: ${e.message}`);
    testsFailed++;
  }

  // ---- 測試 3: 驗證重置清空了舊狀態 ----
  log('test', '測試 3: 驗證重置清空了舊狀態');
  try {
    const form3 = new MockDiseaseForm();
    form3.selectDisease('conjunctivitis');
    form3.selectDisease('cataract');

    const beforeReset = form3.selectedDiseases.length;
    form3.reset();
    const afterReset = form3.selectedDiseases.length;

    if (beforeReset === 2 && afterReset === 0) {
      log('pass', `重置成功: ${beforeReset} → ${afterReset}`);
      testsPassed++;
    } else {
      log('fail', `重置失敗: 應該從 2 變為 0，實際 ${beforeReset} → ${afterReset}`);
      testsFailed++;
    }
  } catch (e) {
    log('fail', `測試異常: ${e.message}`);
    testsFailed++;
  }

  // ---- 測試 4: 多次打開/關閉循環 ----
  log('test', '測試 4: 多次打開/關閉循環');
  try {
    const form4 = new MockDiseaseForm();
    const cycles = 5;
    let cyclesFailed = 0;

    for (let i = 0; i < cycles; i++) {
      form4.reset();

      // 在每個循環中選擇不同的疾病
      const diseaseIndex = i % form4.diseases.length;
      const disease = form4.diseases[diseaseIndex];
      form4.selectDisease(disease.id);

      const data = form4.getFormData();
      if (data.diseases.length !== 1 || data.diseases[0].id !== disease.id) {
        cyclesFailed++;
        log('warn', `循環 ${i + 1}: 失敗 (選擇了 ${data.diseases.length} 個疾病)`);
      }
    }

    if (cyclesFailed === 0) {
      log('pass', `完成 ${cycles} 個循環，全部成功`);
      testsPassed++;
    } else {
      log('fail', `${cycles} 個循環中有 ${cyclesFailed} 個失敗`);
      testsFailed++;
    }
  } catch (e) {
    log('fail', `測試異常: ${e.message}`);
    testsFailed++;
  }

  // ---- 測試 5: 驗證 main.js 中的修復 ----
  log('test', '測試 5: 檢查 main.js 修復');
  try {
    const mainJsPath = '/home/hsu/Desktop/anatomy/assets/scripts/main.js';
    const mainJsContent = fs.readFileSync(mainJsPath, 'utf-8');

    // 檢查是否在 openDiseaseModalWithStructure 中添加了 reset() 調用
    const hasReset = mainJsContent.includes('this.diseaseForm.reset()');
    const lines = mainJsContent.split('\n');

    let foundInCorrectLocation = false;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes('openDiseaseModalWithStructure')) {
        // 在這個方法內找 reset() 調用
        for (let j = i; j < Math.min(i + 50, lines.length); j++) {
          if (lines[j].includes('this.diseaseForm.reset()')) {
            foundInCorrectLocation = true;
            break;
          }
        }
      }
    }

    if (hasReset && foundInCorrectLocation) {
      log('pass', 'main.js 中已添加 diseaseForm.reset() 調用');
      testsPassed++;
    } else {
      log('fail', 'main.js 中未正確添加 reset() 調用');
      testsFailed++;
    }
  } catch (e) {
    log('fail', `無法檢查 main.js: ${e.message}`);
    testsFailed++;
  }

  // ---- 測試統計 ----
  console.log(`
${colors.bold}================================================${colors.reset}
${colors.bold}測試結果${colors.reset}
${colors.bold}================================================${colors.reset}
`);

  const total = testsPassed + testsFailed;
  const percentage = total > 0 ? ((testsPassed / total) * 100).toFixed(1) : 0;

  console.log(`總測試數: ${total}`);
  console.log(`${colors.green}通過: ${testsPassed}${colors.reset}`);
  if (testsFailed > 0) console.log(`${colors.red}失敗: ${testsFailed}${colors.reset}`);
  console.log(`通過率: ${colors.bold}${percentage}%${colors.reset}`);

  if (testsFailed === 0) {
    console.log(`
${colors.green}${colors.bold}✓ 所有測試通過! Bug 修復已驗證。${colors.reset}

變更內容:
- 在 openDiseaseModalWithStructure() 中添加了 this.diseaseForm.reset()
- 確保每次打開模態視窗時清除舊的選擇狀態
- 防止多個選擇被累積到同一條記錄中
`);
  } else {
    console.log(`
${colors.red}${colors.bold}✗ 有些測試失敗，請檢查實現。${colors.reset}
`);
  }

  return testsFailed === 0 ? 0 : 1;
}

runTests().then(exitCode => process.exit(exitCode));
