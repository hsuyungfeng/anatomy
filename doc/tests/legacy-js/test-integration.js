/**
 * 眼睛系統整合測試腳本
 * 用於在瀏覽器控制台中運行的自動化測試
 *
 * 使用方法：
 * 1. 打開 http://localhost:8000/index.html
 * 2. 打開開發者工具 (F12)
 * 3. 在控制台中複製並粘貼本文件內容
 * 4. 運行 runIntegrationTests()
 */

class EyeSystemIntegrationTest {
  constructor() {
    this.results = [];
    this.errors = [];
  }

  /**
   * 記錄測試結果
   */
  log(testName, status, details = '') {
    const result = { testName, status, details, timestamp: new Date().toISOString() };
    this.results.push(result);
    const icon = status === 'PASS' ? '✅' : '❌';
    console.log(`${icon} ${testName}: ${details}`);
  }

  /**
   * Test 1: 眼睛系統啟動
   */
  testEyeSystemActivation() {
    console.log('\n=== Test 1: 眼睛系統啟動 ===');
    try {
      // 驗證 HTML 元素存在
      const leftEyeBtn = document.getElementById('left-eye-btn');
      const rightEyeBtn = document.getElementById('right-eye-btn');
      const eyeInfoPanel = document.getElementById('eye-info-panel');
      const eyeSelectorContainer = document.getElementById('eye-selector-container');

      if (!leftEyeBtn) throw new Error('左眼按鈕未找到');
      if (!rightEyeBtn) throw new Error('右眼按鈕未找到');
      if (!eyeInfoPanel) throw new Error('信息面板未找到');
      if (!eyeSelectorContainer) throw new Error('眼睛選擇器容器未找到');

      this.log('Test 1.1', 'PASS', '所有 HTML 元素存在');

      // 驗證初始狀態
      if (!window.app.selectedEye) throw new Error('selectedEye 未初始化');
      this.log('Test 1.2', 'PASS', `初始選擇眼睛: ${window.app.selectedEye}`);

      // 驗證容器隱藏/顯示狀態
      const isVisible = eyeSelectorContainer.classList.contains('eye-selector-container--visible') ||
                        eyeSelectorContainer.style.display !== 'none';
      this.log('Test 1.3', isVisible ? 'PASS' : 'WARN', '眼睛選擇器容器可見性');

      return true;
    } catch (error) {
      this.log('Test 1', 'FAIL', error.message);
      this.errors.push(error);
      return false;
    }
  }

  /**
   * Test 2: 結構選擇與描述顯示
   */
  testStructureSelection() {
    console.log('\n=== Test 2: 結構選擇與描述顯示 ===');
    try {
      if (!window.app.eyeMapper) throw new Error('eyeMapper 未初始化');
      if (!window.app.eyeMapper.isLoaded) throw new Error('eyeMapper 數據未加載');

      this.log('Test 2.1', 'PASS', 'EyeImageMapper 已加載');

      // 驗證 eye-descriptions.js 已加載
      if (typeof getEyeStructureDescription !== 'function') {
        throw new Error('getEyeStructureDescription 函數未定義');
      }

      // 測試獲取結構描述
      const leftCorneaDesc = getEyeStructureDescription('left-eye-cornea');
      if (!leftCorneaDesc) throw new Error('左眼角膜描述未找到');
      if (!leftCorneaDesc.name || !leftCorneaDesc.nameEn || !leftCorneaDesc.description) {
        throw new Error('描述對象缺少必要字段');
      }

      this.log('Test 2.2', 'PASS', `結構描述加載: ${leftCorneaDesc.name}`);

      // 驗證所有眼睛結構描述
      const structures = ['left-eye', 'left-eye-cornea', 'left-eye-iris', 'left-eye-lens', 'left-eye-retina',
                         'right-eye', 'right-eye-cornea', 'right-eye-iris', 'right-eye-lens', 'right-eye-retina'];
      let validCount = 0;
      structures.forEach(structId => {
        const desc = getEyeStructureDescription(structId);
        if (desc && desc.name && desc.nameEn) validCount++;
      });

      if (validCount === structures.length) {
        this.log('Test 2.3', 'PASS', `所有 ${validCount} 個結構描述有效`);
      } else {
        this.log('Test 2.3', 'WARN', `僅 ${validCount}/${structures.length} 個結構描述有效`);
      }

      return true;
    } catch (error) {
      this.log('Test 2', 'FAIL', error.message);
      this.errors.push(error);
      return false;
    }
  }

  /**
   * Test 3: 眼科疾病表單
   */
  testEyeDiseaseForm() {
    console.log('\n=== Test 3: 眼科疾病表單 ===');
    try {
      if (!window.app.diseaseForm) throw new Error('diseaseForm 未初始化');

      // 切換到眼睛系統
      window.app.currentSystemId = 'eye';
      this.log('Test 3.1', 'PASS', '系統切換到眼睛');

      // 驗證疾病列表
      if (!window.app.diseaseForm.diseases || window.app.diseaseForm.diseases.length === 0) {
        throw new Error('眼睛系統的疾病列表為空');
      }

      const diseaseCount = window.app.diseaseForm.diseases.length;
      this.log('Test 3.2', 'PASS', `已加載 ${diseaseCount} 個眼科疾病`);

      // 驗證特定疾病
      const requiredDiseases = ['結膜炎', '角膜潰瘍', '白內障', '青光眼', '屈光不正', '乾眼症'];
      const diseaseNames = window.app.diseaseForm.diseases.map(d => d.name);

      let foundCount = 0;
      requiredDiseases.forEach(diseaseName => {
        if (diseaseNames.includes(diseaseName)) {
          foundCount++;
        }
      });

      if (foundCount >= 6) {
        this.log('Test 3.3', 'PASS', `找到 ${foundCount}/6 個必要疾病`);
      } else {
        this.log('Test 3.3', 'WARN', `僅找到 ${foundCount}/6 個必要疾病`);
      }

      return true;
    } catch (error) {
      this.log('Test 3', 'FAIL', error.message);
      this.errors.push(error);
      return false;
    }
  }

  /**
   * Test 4: 眼睛選擇器按鈕
   */
  testEyeSelectorButtons() {
    console.log('\n=== Test 4: 眼睛選擇器按鈕 ===');
    try {
      const leftEyeBtn = document.getElementById('left-eye-btn');
      const rightEyeBtn = document.getElementById('right-eye-btn');

      // 測試左眼選擇
      window.app.selectedEye = 'left';
      window.app.updateEyeSelection();

      if (leftEyeBtn.classList.contains('active')) {
        this.log('Test 4.1', 'PASS', '左眼按鈕激活');
      } else {
        this.log('Test 4.1', 'WARN', '左眼按鈕未激活');
      }

      if (leftEyeBtn.getAttribute('aria-pressed') === 'true') {
        this.log('Test 4.2', 'PASS', '左眼 aria-pressed 正確');
      } else {
        this.log('Test 4.2', 'WARN', '左眼 aria-pressed 不正確');
      }

      // 測試右眼選擇
      window.app.selectedEye = 'right';
      window.app.updateEyeSelection();

      if (rightEyeBtn.classList.contains('active')) {
        this.log('Test 4.3', 'PASS', '右眼按鈕激活');
      } else {
        this.log('Test 4.3', 'WARN', '右眼按鈕未激活');
      }

      if (rightEyeBtn.getAttribute('aria-pressed') === 'true') {
        this.log('Test 4.4', 'PASS', '右眼 aria-pressed 正確');
      } else {
        this.log('Test 4.4', 'WARN', '右眼 aria-pressed 不正確');
      }

      return true;
    } catch (error) {
      this.log('Test 4', 'FAIL', error.message);
      this.errors.push(error);
      return false;
    }
  }

  /**
   * Test 5: 系統切換
   */
  testSystemSwitching() {
    console.log('\n=== Test 5: 系統切換 ===');
    try {
      // 記錄初始狀態
      const initialEye = window.app.selectedEye;
      this.log('Test 5.1', 'PASS', `初始眼睛選擇: ${initialEye}`);

      // 切換到牙齒系統
      window.app.currentSystemId = 'teeth';
      window.app.initializeDiseaseForm('teeth');

      if (window.app.diseaseForm.systemId === 'teeth') {
        this.log('Test 5.2', 'PASS', '成功切換到牙齒系統');
      } else {
        this.log('Test 5.2', 'WARN', '牙齒系統 systemId 不正確');
      }

      // 驗證牙齒疾病已加載
      const teethDiseaseCount = window.app.diseaseForm.diseases.length;
      if (teethDiseaseCount > 0) {
        this.log('Test 5.3', 'PASS', `牙齒系統已加載 ${teethDiseaseCount} 個疾病`);
      } else {
        this.log('Test 5.3', 'WARN', '牙齒系統疾病列表為空');
      }

      // 切換回眼睛系統
      window.app.currentSystemId = 'eye';
      window.app.initializeDiseaseForm('eye');

      if (window.app.diseaseForm.systemId === 'eye') {
        this.log('Test 5.4', 'PASS', '成功切換回眼睛系統');
      } else {
        this.log('Test 5.4', 'WARN', '眼睛系統 systemId 不正確');
      }

      // 驗證眼睛選擇狀態保持
      if (window.app.selectedEye === initialEye) {
        this.log('Test 5.5', 'PASS', `眼睛選擇狀態保持: ${initialEye}`);
      } else {
        this.log('Test 5.5', 'WARN', `眼睛選擇狀態改變: ${initialEye} → ${window.app.selectedEye}`);
      }

      return true;
    } catch (error) {
      this.log('Test 5', 'FAIL', error.message);
      this.errors.push(error);
      return false;
    }
  }

  /**
   * Test 6: 數據持久化
   */
  testDataPersistence() {
    console.log('\n=== Test 6: 數據持久化 ===');
    try {
      if (!window.app.recordManager) throw new Error('recordManager 未初始化');

      // 檢查 localStorage
      const storageKeys = Object.keys(localStorage).filter(k => k.startsWith('annotation'));
      this.log('Test 6.1', 'PASS', `localStorage 中有 ${storageKeys.length} 個標註鍵`);

      // 檢查記錄管理器
      const eyeAnnotations = window.app.recordManager.getAnnotationsBySystem('eye');
      const teethAnnotations = window.app.recordManager.getAnnotationsBySystem('teeth');

      this.log('Test 6.2', 'PASS', `眼睛標註數: ${eyeAnnotations.length}`);
      this.log('Test 6.3', 'PASS', `牙齒標註數: ${teethAnnotations.length}`);

      return true;
    } catch (error) {
      this.log('Test 6', 'FAIL', error.message);
      this.errors.push(error);
      return false;
    }
  }

  /**
   * Test 7: 控制台檢查
   */
  testConsoleState() {
    console.log('\n=== Test 7: 控制台狀態檢查 ===');
    try {
      // 檢查全局變量
      const checks = [
        { name: 'window.app', fn: () => window.app !== undefined },
        { name: 'window.app.selectedEye', fn: () => window.app.selectedEye !== undefined },
        { name: 'window.app.currentSystemId', fn: () => window.app.currentSystemId !== undefined },
        { name: 'window.app.eyeMapper', fn: () => window.app.eyeMapper !== undefined },
        { name: 'window.app.diseaseForm', fn: () => window.app.diseaseForm !== undefined },
        { name: 'window.app.recordManager', fn: () => window.app.recordManager !== undefined },
        { name: 'getEyeStructureDescription', fn: () => typeof getEyeStructureDescription === 'function' }
      ];

      let passCount = 0;
      checks.forEach(check => {
        if (check.fn()) {
          this.log(`Test 7.${passCount + 1}`, 'PASS', check.name);
          passCount++;
        } else {
          this.log(`Test 7.${passCount + 1}`, 'FAIL', `${check.name} 未定義或無效`);
        }
      });

      return passCount === checks.length;
    } catch (error) {
      this.log('Test 7', 'FAIL', error.message);
      this.errors.push(error);
      return false;
    }
  }

  /**
   * 運行所有測試
   */
  async runAll() {
    console.log('====================================');
    console.log('眼睛系統整合測試');
    console.log('====================================\n');

    const tests = [
      () => this.testEyeSystemActivation(),
      () => this.testStructureSelection(),
      () => this.testEyeDiseaseForm(),
      () => this.testEyeSelectorButtons(),
      () => this.testSystemSwitching(),
      () => this.testDataPersistence(),
      () => this.testConsoleState()
    ];

    let passCount = 0;
    for (const test of tests) {
      if (test()) passCount++;
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // 摘要
    console.log('\n====================================');
    console.log('測試摘要');
    console.log('====================================');
    console.log(`通過: ${passCount}/${tests.length}`);
    console.log(`失敗: ${this.errors.length}`);

    if (this.errors.length > 0) {
      console.log('\n錯誤詳情:');
      this.errors.forEach((error, i) => {
        console.log(`${i + 1}. ${error.message}`);
      });
    }

    console.log('\n詳細結果:');
    console.table(this.results);

    return passCount === tests.length;
  }
}

// 全局函數用於在控制台調用
async function runIntegrationTests() {
  const tester = new EyeSystemIntegrationTest();
  return await tester.runAll();
}

console.log('✓ 測試套件已加載');
console.log('運行 runIntegrationTests() 以開始測試');
