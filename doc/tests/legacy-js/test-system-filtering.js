#!/usr/bin/env node

/**
 * 系統過濾功能測試
 * 驗證病例列表只顯示當前系統的記錄
 */

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

// 模擬 ApplicationController 的過濾方法
class RecordFilterSimulation {
  constructor() {
    this.records = [];
  }

  // 模擬 filterRecordsBySystem
  filterRecordsBySystem(records, systemId) {
    if (!records || records.length === 0) {
      return [];
    }

    const filtered = records.filter(record => {
      if (systemId === 'eye') {
        // 眼睛系統：有 structureId 或 side，沒有 fdiNumber
        return record.structureId || (record.side && !record.fdiNumber);
      } else if (systemId === 'teeth') {
        // 牙齒系統：有 fdiNumber 或 universalNumber
        return record.fdiNumber || record.universalNumber;
      }
      return false;
    });

    console.log(`  [filterRecordsBySystem] 從 ${records.length} 筆記錄中過濾出 ${filtered.length} 筆${systemId}系統的記錄`);
    return filtered;
  }

  // 創建混合記錄集
  createMixedRecords() {
    return [
      // 眼睛系統記錄
      {
        id: 'eye-1',
        structure: '虹膜',
        structureId: 'eye-iris',
        side: 'right',
        disease: { name: '結膜炎' },
        timestamp: new Date().toISOString()
      },
      // 牙齒系統記錄
      {
        id: 'tooth-1',
        structure: '右上第一臼齒',
        fdiNumber: '16',
        disease: { name: '牙齦炎' },
        timestamp: new Date().toISOString()
      },
      // 眼睛系統記錄
      {
        id: 'eye-2',
        structure: '角膜',
        structureId: 'eye-cornea',
        side: 'left',
        disease: { name: '角膜潰瘍' },
        timestamp: new Date().toISOString()
      },
      // 牙齒系統記錄
      {
        id: 'tooth-2',
        structure: '左下第一磨牙',
        fdiNumber: '36',
        disease: { name: '齲齒' },
        timestamp: new Date().toISOString()
      },
      // 眼睛系統記錄
      {
        id: 'eye-3',
        structure: '視網膜',
        structureId: 'eye-retina',
        side: 'bilateral',
        disease: { name: '年齡相關黃斑變性' },
        timestamp: new Date().toISOString()
      }
    ];
  }
}

async function runTests() {
  console.log(`
${colors.bold}================================================${colors.reset}
${colors.bold}系統過濾功能測試${colors.reset}
${colors.bold}================================================${colors.reset}
`);

  let passed = 0;
  let failed = 0;

  // ---- 測試 1: 眼睛系統過濾 ----
  log('test', '測試 1: 眼睛系統過濾');
  try {
    const sim1 = new RecordFilterSimulation();
    const allRecords = sim1.createMixedRecords();
    const eyeRecords = sim1.filterRecordsBySystem(allRecords, 'eye');

    if (eyeRecords.length === 3 && eyeRecords.every(r => r.structureId)) {
      log('pass', `眼睛系統正確過濾: ${eyeRecords.length}/5 記錄`);
      passed++;
    } else {
      log('fail', `眼睛系統過濾失敗 (預期 3，實際 ${eyeRecords.length})`);
      failed++;
    }
  } catch (e) {
    log('fail', `異常: ${e.message}`);
    failed++;
  }

  // ---- 測試 2: 牙齒系統過濾 ----
  log('test', '測試 2: 牙齒系統過濾');
  try {
    const sim2 = new RecordFilterSimulation();
    const allRecords = sim2.createMixedRecords();
    const teethRecords = sim2.filterRecordsBySystem(allRecords, 'teeth');

    if (teethRecords.length === 2 && teethRecords.every(r => r.fdiNumber)) {
      log('pass', `牙齒系統正確過濾: ${teethRecords.length}/5 記錄`);
      passed++;
    } else {
      log('fail', `牙齒系統過濾失敗 (預期 2，實際 ${teethRecords.length})`);
      failed++;
    }
  } catch (e) {
    log('fail', `異常: ${e.message}`);
    failed++;
  }

  // ---- 測試 3: 眼睛記錄不包含牙齒數據 ----
  log('test', '測試 3: 眼睛記錄中沒有牙齒數據');
  try {
    const sim3 = new RecordFilterSimulation();
    const allRecords = sim3.createMixedRecords();
    const eyeRecords = sim3.filterRecordsBySystem(allRecords, 'eye');

    const hasDentalData = eyeRecords.some(r => r.fdiNumber || r.universalNumber);
    if (!hasDentalData) {
      log('pass', '眼睛記錄乾淨，沒有牙齒數據');
      passed++;
    } else {
      log('fail', '眼睛記錄中發現牙齒數據！');
      failed++;
    }
  } catch (e) {
    log('fail', `異常: ${e.message}`);
    failed++;
  }

  // ---- 測試 4: 牙齒記錄不包含眼睛數據 ----
  log('test', '測試 4: 牙齒記錄中沒有眼睛數據');
  try {
    const sim4 = new RecordFilterSimulation();
    const allRecords = sim4.createMixedRecords();
    const teethRecords = sim4.filterRecordsBySystem(allRecords, 'teeth');

    const hasEyeData = teethRecords.some(r => r.structureId || r.side);
    if (!hasEyeData) {
      log('pass', '牙齒記錄乾淨，沒有眼睛數據');
      passed++;
    } else {
      log('fail', '牙齒記錄中發現眼睛數據！');
      failed++;
    }
  } catch (e) {
    log('fail', `異常: ${e.message}`);
    failed++;
  }

  // ---- 測試 5: 空記錄集 ----
  log('test', '測試 5: 空記錄集處理');
  try {
    const sim5 = new RecordFilterSimulation();
    const emptyResult1 = sim5.filterRecordsBySystem([], 'eye');
    const emptyResult2 = sim5.filterRecordsBySystem([], 'teeth');

    if (emptyResult1.length === 0 && emptyResult2.length === 0) {
      log('pass', '空記錄集正確處理');
      passed++;
    } else {
      log('fail', '空記錄集處理失敗');
      failed++;
    }
  } catch (e) {
    log('fail', `異常: ${e.message}`);
    failed++;
  }

  // ---- 測試 6: 無效系統 ID ----
  log('test', '測試 6: 無效系統 ID 處理');
  try {
    const sim6 = new RecordFilterSimulation();
    const allRecords = sim6.createMixedRecords();
    const invalidResult = sim6.filterRecordsBySystem(allRecords, 'invalid');

    if (invalidResult.length === 0) {
      log('pass', '無效系統 ID 返回空陣列');
      passed++;
    } else {
      log('fail', '無效系統 ID 應該返回空陣列');
      failed++;
    }
  } catch (e) {
    log('fail', `異常: ${e.message}`);
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
${colors.green}${colors.bold}✓ 所有測試通過！系統過濾功能已驗證。${colors.reset}

功能驗證:
✓ 眼睛系統只顯示眼睛記錄 (3/5)
✓ 牙齒系統只顯示牙齒記錄 (2/5)
✓ 完全隔離，沒有交叉污染
✓ 空陣列正確處理
✓ 無效系統 ID 正確處理

使用者體驗改進:
- 眼科醫生只看眼科記錄
- 牙醫只看牙科記錄
- 不同科目的記錄完全分開
- 更清晰的使用者界面

準備好進行瀏覽器測試！ 🚀
`);
  } else {
    console.log(`
${colors.red}${colors.bold}✗ 有些測試失敗，請檢查實現。${colors.reset}
`);
  }

  return failed === 0 ? 0 : 1;
}

runTests().then(exitCode => process.exit(exitCode));
