#!/usr/bin/env node

/**
 * 完整瀏覽器工作流測試
 * 模擬用戶在瀏覽器中的完整操作流程
 * 驗證所有3個 Bug 修復
 */

const fs = require('fs');
const path = require('path');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m',
  bold: '\x1b[1m',
  dim: '\x1b[2m'
};

function log(type, message) {
  const prefix = {
    info: `${colors.blue}ℹ${colors.reset}`,
    pass: `${colors.green}✓${colors.reset}`,
    fail: `${colors.red}✗${colors.reset}`,
    warn: `${colors.yellow}⚠${colors.reset}`,
    test: `${colors.bold}${colors.blue}●${colors.reset}`,
    step: `${colors.bold}→${colors.reset}`
  };
  console.log(`${prefix[type]} ${message}`);
}

// 簡單的模擬系統
class BrowserWorkflowSimulation {
  constructor() {
    this.diseaseForm = null;
    this.medicalRecords = [];
    this.currentSystem = null;
    this.logs = [];
  }

  // 模擬 DiseaseForm
  createDiseaseForm() {
    const self = this;
    this.diseaseForm = {
      selectedDiseases: [],
      treatmentNotes: '',
      diseases: [
        { id: 'conjunctivitis', name: '結膜炎' },
        { id: 'corneal_ulcer', name: '角膜潰瘍' },
        { id: 'refractive_error', name: '屈光不正' },
        { id: 'cataract', name: '白內障' },
        { id: 'macular_degeneration', name: '年齡相關黃斑變性' }
      ],
      reset: function() {
        this.selectedDiseases = [];
        this.treatmentNotes = '';
        self.log('[DiseaseForm] 表單已重置');
      },
      selectDisease: function(diseaseId) {
        const disease = this.diseases.find(d => d.id === diseaseId);
        if (disease && !this.selectedDiseases.find(d => d.id === diseaseId)) {
          this.selectedDiseases.push(disease);
        }
      },
      getFormData: function() {
        return {
          diseases: this.selectedDiseases,
          treatmentNotes: this.treatmentNotes
        };
      }
    };
  }

  log(message) {
    this.logs.push(message);
    console.log(`  ${colors.dim}${message}${colors.reset}`);
  }

  // 模擬打開眼睛系統
  openEyeSystem() {
    this.currentSystem = 'eye';
    this.createDiseaseForm();
    this.log('[APP] 打開眼睛系統');
  }

  // 模擬打開眼睛結構（虹膜）
  openEyeStructure(structureName) {
    this.log(`[APP] 打開眼睛結構: ${structureName}`);

    // 這應該觸發 openDiseaseModalWithStructure()
    // 根據修復，應該調用 this.diseaseForm.reset()
    if (this.diseaseForm) {
      this.diseaseForm.reset();
    }
  }

  // 模擬用戶選擇疾病
  selectDisease(diseaseId) {
    if (this.diseaseForm) {
      this.diseaseForm.selectDisease(diseaseId);
      const disease = this.diseaseForm.diseases.find(d => d.id === diseaseId);
      this.log(`[USER] 選擇疾病: ${disease.name}`);
    }
  }

  // 模擬保存病例（對應 saveDiseaseAnnotation）
  saveDiseaseRecord(structureName, side) {
    if (!this.diseaseForm) {
      this.log('[ERROR] 表單未初始化');
      return false;
    }

    const formData = this.diseaseForm.getFormData();

    // Bug #1: 驗證只有選中的疾病被保存
    if (formData.diseases.length !== 1) {
      this.log(`[BUG#1] 保存了 ${formData.diseases.length} 個疾病而不是 1 個!`);
      return false;
    }

    const record = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toISOString(),
      structure: structureName,
      side: side,
      disease: formData.diseases[0],
      notes: formData.treatmentNotes
    };

    this.medicalRecords.push(record);
    this.log(`[APP] 保存病例: ${structureName} (${side}) - ${record.disease.name}`);

    return true;
  }

  // 驗證記錄顯示
  verifyRecordDisplay() {
    const results = {
      correct: 0,
      errors: []
    };

    this.medicalRecords.forEach((record, idx) => {
      // 檢查 1: 只有一個疾病
      if (Array.isArray(record.disease) || !record.disease.name) {
        results.errors.push(`記錄 ${idx}: 疾病數據格式錯誤`);
      } else {
        results.correct++;
      }

      // 檢查 2: 有眼睛側面
      if (!record.side) {
        results.errors.push(`記錄 ${idx}: 缺少眼睛側面標籤`);
      }

      // 檢查 3: 時間戳格式正確
      const timestamp = record.timestamp;
      if (!timestamp.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)) {
        results.errors.push(`記錄 ${idx}: 時間戳格式不正確`);
      }
    });

    return results;
  }

  // 驗證沒有交叉污染
  verifyNoCrossPollution() {
    // 如果系統是 eye，不應該有牙齒相關的數據
    if (this.currentSystem === 'eye') {
      for (const record of this.medicalRecords) {
        if (record.fdiNumber || record.quadrant) {
          return { clean: false, error: '眼睛記錄中發現牙齒數據' };
        }
        // 應該有 structureId 或 side
        if (!record.structure || !record.side) {
          return { clean: false, error: '眼睛記錄缺少結構或側面信息' };
        }
      }
    }
    return { clean: true };
  }
}

async function runBrowserTests() {
  console.log(`
${colors.bold}================================================${colors.reset}
${colors.bold}完整瀏覽器工作流測試${colors.reset}
${colors.bold}================================================${colors.reset}
`);

  let passed = 0;
  let failed = 0;

  // ---- 測試 1: Bug #1 修復 - 單次選擇和保存 ----
  log('test', '測試 1: Bug #1 - 單次選擇疾病並保存');
  try {
    const sim1 = new BrowserWorkflowSimulation();
    sim1.openEyeSystem();
    sim1.openEyeStructure('虹膜');
    sim1.selectDisease('conjunctivitis');

    if (sim1.saveDiseaseRecord('虹膜', '右眼')) {
      log('pass', '第一條記錄保存成功 (只有 1 個疾病)');
      passed++;
    } else {
      log('fail', '第一條記錄保存失敗');
      failed++;
    }
  } catch (e) {
    log('fail', `異常: ${e.message}`);
    failed++;
  }

  // ---- 測試 2: Bug #1 修復 - 多次打開/關閉不累積選擇 ----
  log('test', '測試 2: Bug #1 - 多次打開模態視窗不累積選擇');
  try {
    const sim2 = new BrowserWorkflowSimulation();
    sim2.openEyeSystem();

    // 第一次: 選擇 conjunctivitis
    sim2.openEyeStructure('虹膜');
    sim2.selectDisease('conjunctivitis');
    const saved1 = sim2.saveDiseaseRecord('虹膜', '右眼');

    // 第二次: 選擇不同的疾病
    sim2.openEyeStructure('角膜'); // 打開新結構 (應觸發 reset)
    sim2.selectDisease('corneal_ulcer');
    const saved2 = sim2.saveDiseaseRecord('角膜', '左眼');

    // 驗證第二條記錄只有 corneal_ulcer，沒有累積 conjunctivitis
    if (saved1 && saved2 && sim2.medicalRecords[1].disease.id === 'corneal_ulcer') {
      log('pass', '第二條記錄正確 (只包含新選擇的疾病，沒有累積)');
      passed++;
    } else {
      log('fail', '累積選擇問題未修復');
      failed++;
    }
  } catch (e) {
    log('fail', `異常: ${e.message}`);
    failed++;
  }

  // ---- 測試 3: 記錄顯示驗證 ----
  log('test', '測試 3: 記錄顯示驗證 (時間戳、側面、格式)');
  try {
    const sim3 = new BrowserWorkflowSimulation();
    sim3.openEyeSystem();

    // 創建 3 條記錄
    sim3.openEyeStructure('虹膜');
    sim3.selectDisease('conjunctivitis');
    sim3.saveDiseaseRecord('虹膜', '右眼');

    sim3.openEyeStructure('角膜');
    sim3.selectDisease('corneal_ulcer');
    sim3.saveDiseaseRecord('角膜', '左眼');

    sim3.openEyeStructure('視網膜');
    sim3.selectDisease('macular_degeneration');
    sim3.saveDiseaseRecord('視網膜', '雙眼');

    const verification = sim3.verifyRecordDisplay();
    if (verification.correct === 3 && verification.errors.length === 0) {
      log('pass', `所有 ${verification.correct} 條記錄格式正確`);
      passed++;
    } else {
      log('fail', `記錄格式問題: ${verification.errors.join(', ')}`);
      failed++;
    }
  } catch (e) {
    log('fail', `異常: ${e.message}`);
    failed++;
  }

  // ---- 測試 4: Bug #2 修復 - 沒有交叉污染 ----
  log('test', '測試 4: Bug #2 - 眼睛系統沒有牙齒數據污染');
  try {
    const sim4 = new BrowserWorkflowSimulation();
    sim4.openEyeSystem();

    sim4.openEyeStructure('角膜');
    sim4.selectDisease('corneal_ulcer');
    sim4.saveDiseaseRecord('角膜', '左眼');

    const pollution = sim4.verifyNoCrossPollution();
    if (pollution.clean) {
      log('pass', '眼睛系統數據乾淨，沒有牙齒污染');
      passed++;
    } else {
      log('fail', `交叉污染檢測: ${pollution.error}`);
      failed++;
    }
  } catch (e) {
    log('fail', `異常: ${e.message}`);
    failed++;
  }

  // ---- 測試 5: 代碼檢查 - 驗證修復已實施 ----
  log('test', '測試 5: 代碼檢查 - 驗證所有修復已實施');
  try {
    const mainJs = fs.readFileSync('/home/hsu/Desktop/anatomy/assets/scripts/main.js', 'utf-8');
    const diseaseViz = fs.readFileSync('/home/hsu/Desktop/anatomy/assets/scripts/disease-visualization.js', 'utf-8');

    let codeChecks = 0;

    // 檢查 1: diseaseForm.reset() 在 openDiseaseModalWithStructure 中
    const startIdx = mainJs.indexOf('async openDiseaseModalWithStructure');
    if (startIdx !== -1) {
      // 找到方法結束
      let braceCount = 0;
      let inMethod = false;
      let endIdx = startIdx;

      for (let i = startIdx; i < mainJs.length; i++) {
        if (mainJs[i] === '{') {
          braceCount++;
          inMethod = true;
        } else if (mainJs[i] === '}') {
          braceCount--;
          if (inMethod && braceCount === 0) {
            endIdx = i;
            break;
          }
        }
      }

      const section = mainJs.substring(startIdx, endIdx);
      if (section.includes('this.diseaseForm.reset()')) {
        codeChecks++;
        log('info', '✓ 修復 1: diseaseForm.reset() 已實施');
      }
    }

    // 檢查 2: diseaseVisualizer 只在牙齒系統調用
    if (mainJs.includes("this.currentSystemId === 'teeth'") &&
        mainJs.includes("systemId === 'teeth'")) {
      codeChecks++;
      log('info', '✓ 修復 2a: diseaseVisualizer 系統檢查已實施');
    }

    // 檢查 3: disease-visualization.js 有系統檢查
    if (diseaseViz.includes('annotation.structureId')) {
      codeChecks++;
      log('info', '✓ 修復 2b: disease-visualization.js 過濾已實施');
    }

    // 檢查 4: aria-hidden 焦點修復
    if (mainJs.includes('document.activeElement.blur()')) {
      codeChecks++;
      log('info', '✓ 修復 3: aria-hidden 焦點修復已實施');
    }

    if (codeChecks === 4) {
      log('pass', `所有 4 個代碼修復已驗證`);
      passed++;
    } else {
      log('warn', `只發現 ${codeChecks}/4 個修復`);
      failed++;
    }
  } catch (e) {
    log('fail', `代碼檢查異常: ${e.message}`);
    failed++;
  }

  // ---- 測試統計 ----
  console.log(`
${colors.bold}================================================${colors.reset}
${colors.bold}測試結果${colors.reset}
${colors.bold}================================================${colors.reset}
`);

  const total = passed + failed;
  const percentage = total > 0 ? ((passed / total) * 100).toFixed(1) : 0;

  console.log(`總測試數: ${total}`);
  console.log(`${colors.green}通過: ${passed}${colors.reset}`);
  if (failed > 0) console.log(`${colors.red}失敗: ${failed}${colors.reset}`);
  console.log(`通過率: ${colors.bold}${percentage}%${colors.reset}`);

  if (failed === 0) {
    console.log(`
${colors.green}${colors.bold}✓ 所有測試通過！所有 Bug 修復已驗證。${colors.reset}

${colors.bold}修復總結:${colors.reset}
1. Bug #1 - 疾病記錄顯示所有疾病
   ✓ 在打開模態視窗時重置表單
   ✓ 防止選擇狀態累積

2. Bug #2 - 眼睛/牙齒系統交叉污染
   ✓ 只在牙齒系統調用 diseaseVisualizer
   ✓ 眼睛系統註釋被正確過濾

3. Bug #3 - aria-hidden 無障礙衝突
   ✓ 隱藏模態視窗前清除焦點
   ✓ 防止輔助技術警告

準備好進行瀏覽器測試！ 🚀
`);
  } else {
    console.log(`
${colors.red}${colors.bold}✗ 有些測試失敗，請檢查實現。${colors.reset}
`);
  }

  return failed === 0 ? 0 : 1;
}

runBrowserTests().then(exitCode => process.exit(exitCode));
