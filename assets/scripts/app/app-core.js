/* ================================================
   主控制邏輯 - 核心 (Core)
   ================================================ */

class MedicalRecordApp {
  /**
   * 初始化應用
   */
  constructor() {
    this.annotator = null;
    this.recordManager = null;
    this.diseaseForm = null;
    this.ocrHandler = null;
    this.diseaseVisualizer = null; // 疾病可視化管理器
    this.dentalMapper = null; // 牙齒圖像映射器
    this.eyeMapper = null; // 眼睛圖像映射器 [新增]
    this.bodyImageMapper = null; // 身體圖像映射器 [新增]

    this.currentSystemId = 'teeth';
    this.currentTeethType = 'permanent'; // 牙齒類型：permanent (永久齒) 或 primary (乳齒)
    this.currentImageId = null;
    this.anatomicalSystems = null;
    this.selectedEye = 'right'; // 追蹤選擇的眼睛（左眼或右眼）

    this.init();
  }
  /**
   * 初始化應用
   */
  async init() {
    try {

      // 設置語言
      this.setupLanguage();

      // 設置主題
      this.setupTheme();

      // 設置鍵盤快捷鍵
      this.setupKeyboardShortcuts();

      // 加載資料
      await this.loadData();

      // 初始化模組
      this.initModules();

      // 設置事件監聽
      this.setupEventListeners();

      // 載入初始圖像
      await this.loadSystemImage(this.currentSystemId);

      // 初始加載病例列表（分組顯示）
      await this.loadAndDisplayRecords();

      dispatchEvent('app:ready');
    } catch (error) {
      console.error('應用初始化失敗:', error);
      showNotification('應用初始化失敗', 'error');
    }
  }
  /**
   * 設置語言
   */
  setupLanguage() {
    const currentLang = getCurrentLanguage();
    updateLanguageUI(currentLang);

    const langButtons = $$('.language-btn');
    langButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const lang = e.currentTarget.dataset.lang;
        this.switchLanguage(lang);
      });
    });
  }
  /**
   * 設置主題切換
   */
  setupTheme() {
    const themeToggle = $('#theme-toggle');
    if (!themeToggle) return;

    const savedTheme = localStorage.getItem('theme') || 'light';
    this.setTheme(savedTheme, false);

    themeToggle.addEventListener('click', () => {
      const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
      const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
      this.setTheme(newTheme, true);
    });
  }
  /**
   * 設置主題
   * @param {string} theme - 'light' 或 'dark'
   * @param {boolean} save - 是否保存到 localStorage
   */
  setTheme(theme, save = true) {
    const themeToggle = $('#theme-toggle');
    
    if (theme === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
      if (themeToggle) {
        themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
      }
    } else {
      document.documentElement.removeAttribute('data-theme');
      if (themeToggle) {
        themeToggle.innerHTML = '<i class="fas fa-moon"></i>';
      }
    }

    if (save) {
      localStorage.setItem('theme', theme);
    }
  }
  /**
   * 設置鍵盤快捷鍵
   */
  setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      // Ctrl/Cmd + S: 儲存
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        showNotification('快捷鍵: 儲存', 'info');
      }

      // Ctrl/Cmd + E: 導出
      if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
        e.preventDefault();
        this.exportRecord('text');
      }

      // Ctrl/Cmd + F: 搜尋
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        const searchInput = $('#search-input');
        if (searchInput) {
          searchInput.focus();
        }
      }

      // Escape: 關閉模態
      if (e.key === 'Escape') {
        const modal = $('#disease-modal');
        const overlay = $('#modal-overlay');
        if (modal && !modal.hidden) {
          this.closeDiseaseModal();
        }
      }

      // Ctrl/Cmd + D: 切換主題
      if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
        e.preventDefault();
        const themeToggle = $('#theme-toggle');
        if (themeToggle) {
          themeToggle.click();
        }
      }

      // 1/2/3: 切換系統
      if (!e.ctrlKey && !e.metaKey && !e.altKey) {
        const systemTabs = $$('.system-tab');
        if (e.key === '1' && systemTabs[0]) systemTabs[0].click();
        if (e.key === '2' && systemTabs[1]) systemTabs[1].click();
        if (e.key === '3' && systemTabs[2]) systemTabs[2].click();
      }
    });

  }
  /**
   * 切換語言
   * @param {string} lang - 語言代碼
   */
  switchLanguage(lang) {
    setLanguage(lang);

    // 更新按鈕狀態
    $$('.language-btn').forEach(btn => {
      btn.classList.toggle('language-btn--active', btn.dataset.lang === lang);
    });

    // 更新表單顯示
    if (this.diseaseForm) {
      this.diseaseForm.updateLanguageDisplay();
    }

    // 記錄語言變更
  }
  /**
   * 加載資料檔案
   */
  async loadData() {
    try {
      this.anatomicalSystems = await loadJSON('data/anatomical-systems.json');
    } catch (error) {
      console.error('加載資料失敗:', error);
      throw error;
    }
  }
  /**
   * 初始化各模組
   */
  initModules() {
    // 圖像標註器
    this.annotator = new ImageAnnotator({
      imageElement: $('#image-canvas'),
      containerElement: $('#image-viewer'),
      systemId: this.currentSystemId
    });

    // 牙齒圖像映射器
    this.dentalMapper = new DentalImageMapper({
      coordinatesUrl: '/data/dental-coordinates.json',
      debug: true  // 開發階段啟用，生產環境改為 false
    });

    // 預加載座標數據
    this.dentalMapper.loadCoordinates().then(success => {
      if (!success) {
        console.error('✗ 牙齒座標數據加載失敗');
      }
    });

    // 眼睛圖像映射器 [新增區塊]
    this.eyeMapper = new EyeImageMapper({
      coordinatesUrl: '/data/eye-coordinates.json',
      debug: true  // 開發階段啟用，生產環境改為 false
    });

    // 預加載眼睛座標數據
    this.eyeMapper.loadCoordinates().then(success => {
      if (!success) {
        console.error('✗ 眼睛座標數據加載失敗');
      }
    });

    // 眼睛標籤映射器 [新增] - 用於識別眼睛圖像中的文字標籤
    if (typeof EyeLabelMapper !== 'undefined') {
      this.eyeLabelMapper = new EyeLabelMapper({
        debug: true
      });
    }

    // 身體圖像映射器 [新增] - 用於識別身體圖像中的部位點擊區域
    if (typeof BodyImageMapper !== 'undefined') {
      this.bodyImageMapper = new BodyImageMapper({
        coordinatesUrl: '/data/body-coordinates.json',
        debug: true
      });

      // 預加載座標數據
      this.bodyImageMapper.loadCoordinates().then(success => {
        if (!success) {
          console.error('✗ 身體座標數據加載失敗');
        }
      });
    }

    // 病歷管理器
    this.recordManager = new RecordManager();

    // 疾病可視化管理器
    if (typeof DiseaseVisualizationManager !== 'undefined') {
      this.diseaseVisualizer = new DiseaseVisualizationManager($('#image-canvas'));
    }

    // 病歷統計管理器
    if (typeof RecordStatistics !== 'undefined') {
      this.recordStatistics = new RecordStatistics();
    }

    // 身體系統操作表單
    if (typeof BodyOperationForm !== 'undefined') {
      this.bodyOperationForm = new BodyOperationForm();
      this.bodyOperationForm.init();
    }

    // 預先加載身體系統數據（用於手動選擇器）
    this.loadBodySystemsData();

    // 疾病表單 (稍後初始化)
    // this.diseaseForm = new DiseaseForm();

    // OCR 處理器 (稍後初始化)
    // this.ocrHandler = new OCRHandler();

  }
  /**
   * 設置事件監聽
   */
  setupEventListeners() {
    // 系統標籤頁
    $$('.system-tab').forEach(tab => {
      tab.addEventListener('click', (e) => {
        this.handleSystemTabClick(e);
      });
    });

    // 牙齒子標籤頁 (永久齒/乳齒切換)
    $$('.teeth-tab').forEach(tab => {
      tab.addEventListener('click', (e) => {
        this.handleTeethTypeChange(e);
      });
    });

    // 縮放按鈕已在 ImageAnnotator 中處理

    // 導出按鈕
    const exportTextBtn = $('#export-text-btn');
    const exportCsvBtn = $('#export-csv-btn');
    const exportPdfBtn = $('#export-pdf-btn');
    const backupBtn = $('#backup-btn');
    const restoreBtn = $('#restore-btn');
    const restoreFile = $('#restore-file');
    const clearBtn = $('#clear-records-btn');

    if (exportTextBtn) {
      exportTextBtn.addEventListener('click', () => this.exportRecord('text'));
    }

    if (exportCsvBtn) {
      exportCsvBtn.addEventListener('click', () => this.exportRecord('csv'));
    }

    if (exportPdfBtn) {
      exportPdfBtn.addEventListener('click', () => this.exportRecord('pdf'));
    }

    if (backupBtn) {
      backupBtn.addEventListener('click', () => {
        if (this.recordManager) {
          this.recordManager.downloadBackup();
        }
      });
    }

    if (restoreBtn && restoreFile) {
      restoreBtn.addEventListener('click', () => {
        restoreFile.click();
      });

      restoreFile.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (file && this.recordManager) {
          if (confirm('還原將覆蓋現有數據，確定要繼續嗎？')) {
            await this.recordManager.restoreFromBackup(file);
            this.updateRecordList(this.currentSystemId);
            if (this.recordStatistics) {
              this.recordStatistics.updateDisplay();
            }
          }
        }
        restoreFile.value = '';
      });
    }

    if (clearBtn) {
      clearBtn.addEventListener('click', () => this.clearRecords());
    }

    // 圖像點擊標註事件
    document.addEventListener('annotation:click', (e) => {
      this.handleAnnotationClick(e);
    });

    // 病歷列表標籤頁
    $$('.record-tab').forEach(tab => {
      tab.addEventListener('click', (e) => this.handleRecordTabClick(e));
    });

    // 統計分析篩選按鈕
    const applyFilterBtn = $('#apply-filter-btn');
    const clearFilterBtn = $('#clear-filter-btn');

    if (applyFilterBtn) {
      applyFilterBtn.addEventListener('click', () => {
        const systemFilter = $('#system-filter')?.value;
        const dateFrom = $('#date-from')?.value;
        const dateTo = $('#date-to')?.value;
        if (this.recordStatistics) {
          this.recordStatistics.setSystemFilter(systemFilter);
          this.recordStatistics.setDateRange(dateFrom, dateTo);
        }
      });
    }

    if (clearFilterBtn) {
      clearFilterBtn.addEventListener('click', () => {
        if (this.recordStatistics) {
          this.recordStatistics.clearFilter();
        }
      });
    }

    // 搜尋按鈕
    const searchBtn = $('#search-btn');
    const searchInput = $('#search-input');

    if (searchBtn && searchInput) {
      searchBtn.addEventListener('click', () => {
        const keyword = searchInput.value.trim();
        if (keyword && this.recordStatistics) {
          const results = this.recordStatistics.searchRecords(keyword);
          this.recordStatistics.displaySearchResults(results);
        }
      });

      // 按 Enter 鍵搜尋
      searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          const keyword = searchInput.value.trim();
          if (keyword && this.recordStatistics) {
            const results = this.recordStatistics.searchRecords(keyword);
            this.recordStatistics.displaySearchResults(results);
          }
        }
      });
    }

    // 模態視窗
    this.setupDiseaseModal();

    // 設置眼睛標籤按鈕事件監聽
    this.setupEyeLabelButtonListeners();
  }
  /**
   * 處理系統標籤頁點擊
   * @param {Event} e - 事件
   */
  async handleSystemTabClick(e) {
    const tab = e.currentTarget;
    const systemId = tab.dataset.system;

    // 更新 UI
    $$('.system-tab').forEach(t => t.classList.remove('system-tab--active'));
    tab.classList.add('system-tab--active');

    // 顯示或隱藏牙齒子標籤頁
    const teethSubTabs = $('#teeth-sub-tabs');
    if (systemId === 'teeth' && teethSubTabs) {
      teethSubTabs.classList.add('teeth-sub-tabs--visible');
      // 重置為永久齒
      this.currentTeethType = 'permanent';
      const tabs = $$('.teeth-tab');
      tabs.forEach(t => t.classList.remove('teeth-tab--active'));
      if (tabs.length > 0) {
        tabs[0].classList.add('teeth-tab--active');
      }
    } else if (teethSubTabs) {
      teethSubTabs.classList.remove('teeth-sub-tabs--visible');
    }

    // 顯示或隱藏眼睛資訊面板
    if (systemId === 'eye') {
      this.toggleEyeInfoPanel(true);
    } else {
      this.toggleEyeInfoPanel(false);
    }

    // 初始化疾病表單（當系統切換時）
    this.initializeDiseaseForm(systemId);

    // 切換系統
    await this.loadSystemImage(systemId);
  }
  /**
   * 處理牙齒類型變更 (永久齒/乳齒)
   * @param {Event} e - 點擊事件
   */
  async handleTeethTypeChange(e) {
    const tab = e.currentTarget;
    const teethType = tab.dataset.teethType;

    // 更新 UI
    $$('.teeth-tab').forEach(t => t.classList.remove('teeth-tab--active'));
    tab.classList.add('teeth-tab--active');

    // 切換牙齒系統
    await this.loadTeethSystem(teethType);
  }
  /**
   * 加載牙齒系統 (永久齒或乳齒)
   * @param {string} teethType - 牙齒類型: 'permanent' 或 'primary'
   */
  async loadTeethSystem(teethType) {
    try {
      this.currentTeethType = teethType;

      // 根據牙齒類型決定系統 ID
      const systemId = teethType === 'permanent' ? 'teeth' : 'primary_teeth';

      // 載入對應的系統圖像
      await this.loadSystemImage(systemId);

    } catch (error) {
      console.error(`切換牙齒系統失敗: ${teethType}`, error);
      showNotification(`無法切換牙齒系統: ${error.message}`, 'error');
    }
  }
  /**
   * 加載系統圖像
   * @param {string} systemId - 系統 ID
   */
  async loadSystemImage(systemId) {
    try {
      this.currentSystemId = systemId;

      // 控制眼睛標籤面板的可見性
      // 只有在眼睛系統時才顯示面板
      this.toggleEyeLabelPanel(systemId === 'eye');

      // 找到系統配置
      const system = this.anatomicalSystems.systems.find(
        s => s.id === systemId
      );

      if (!system) {
        throw new Error(`System not found: ${systemId}`);
      }

      // 使用第一張圖像
      const imageId = system.imageIds[0];
      this.currentImageId = imageId;

      // 構建圖像路徑
      // 牙齒系統統一使用 teeth 資料夾
      const imageFolder = (systemId === 'teeth' || systemId === 'primary_teeth') ? 'teeth' : systemId;

      // 特殊映射：某些 imageId 需要映射到實際的文件名
      const imageFileMap = {
        'eye-3d': '3Deye',        // eye-3d imageId 對應 3Deye.png 文件
        'eyefunctions': '3Deye'   // eyefunctions imageId 也對應 3Deye.png 文件
      };

      const imageFileName = imageFileMap[imageId] || imageId;
      const imagePath = `assets/images/${imageFolder}/${imageFileName}.png`;

      // 加載圖像
      await this.annotator.loadImage(imagePath);

      // 更新標題
      const modal = $('#disease-modal');
      if (modal) {
        modal.setAttribute('data-system', systemId);
      }

      // 重置縮放
      this.annotator.resetZoom();

      // 在眼睛系統加載後繪製標籤 [新增]
      if (systemId === 'eye' && this.eyeLabelMapper) {
        const canvas = document.getElementById('image-canvas');
        if (canvas) {
          setTimeout(() => {
            // 延遲繪製以確保圖像已加載
            this.eyeLabelMapper.drawLabels(canvas, {
              showText: true,
              textColor: '#333',
              fontSize: 13,
              backgroundColor: 'rgba(255, 255, 255, 0.85)',
              borderColor: '#0066cc',
              borderRadius: 4
            });
          }, 100);
        }
      }

      // 加載已有的標註
      this.loadAnnotations(systemId);

      // 加載並顯示 localStorage 病歷
      await this.loadAndDisplayRecords();

    } catch (error) {
      console.error(`加載系統圖像失敗: ${systemId}`, error);
      showNotification(`無法加載圖像: ${error.message}`, 'error');
    }
  }
  /**
   * 加載已有的標註
   * @param {string} systemId - 系統 ID
   */
  loadAnnotations(systemId) {
    const annotations = this.recordManager.getAnnotationsBySystem(systemId);

    // 清除舊標註
    this.annotator.clearAnnotations();

    // 添加新標註
    annotations.forEach(anno => {
      const system = this.anatomicalSystems.systems.find(s => s.id === systemId);
      const color = system ? system.color : '#ff0000';

      this.annotator.addAnnotation({
        ...anno,
        color
      });
    });

    // 更新疾病可視化（僅限牙齒系統）
    if (this.diseaseVisualizer && systemId === 'teeth') {
      this.diseaseVisualizer.render(annotations);
    }

    // 更新列表
    this.updateRecordList(systemId);
  }
  /**
   * 處理標註點擊
   * @param {Event} e - 事件
   */
  handleAnnotationClick(e) {
    const { position } = e.detail;

    // 如果是眼睛系統，顯示結構資訊
    if (this.currentSystemId === 'eye') {
      const structure = this.detectEyeStructure(position);
      if (structure) {
        this.displayEyeStructureInfo(structure);
      }
    }

    // 如果是身體系統，偵測身體部位並顯示結構資訊 [新增]
    if (this.currentSystemId === 'body') {
      const bodyRegion = this.detectBodyRegion(position);
      if (bodyRegion) {
        this.displayBodyStructureInfo(bodyRegion);
      }
    }

    // 顯示模態視窗（openDiseaseModal 會根據系統類型進行適當的檢測）
    this.openDiseaseModal(position);
  }
}

/**
 * 定義 MedicalRecordApp 原型方法輔助函式（不可列舉，與 class 方法一致）
 * @param {Object} methods - 方法物件
 */
function defineAppMethods(methods) {
  for (const [name, desc] of Object.entries(Object.getOwnPropertyDescriptors(methods))) {
    desc.enumerable = false;
    Object.defineProperty(MedicalRecordApp.prototype, name, desc);
  }
}
