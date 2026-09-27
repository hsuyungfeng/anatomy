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
    this.eyeMapper = null; // 眼睛圖像映射器 [新增]
    this.bodyImageMapper = null; // 身體圖像映射器 [新增]

    this.currentSystemId = 'teeth';
    this.currentTeethType = 'permanent'; // 牙齒類型：permanent (永久齒) 或 primary (乳齒)
    this.currentImageId = null;
    this.anatomicalSystems = null;
    this.selectedEye = 'right'; // 追蹤選擇的眼睛（左眼或右眼）
    this.odontogram = null;
    this.isReferenceImageMode = false;
    this.toothNames = null;
    this.svgViewport = null;

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

    // 病歷統計管理器
    if (typeof RecordStatistics !== 'undefined') {
      this.recordStatistics = new RecordStatistics(this.recordManager);
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

    // 眼睛眼別切換 (OD/OS)
    $$('#eye-side-toggle button').forEach(btn => {
      btn.addEventListener('click', (e) => {
        if (typeof this.switchEyeSide === 'function') {
          this.switchEyeSide(e.currentTarget.dataset.side);
        }
      });
    });

    // 縮放按鈕：在 SVG 啟用時交由 SvgViewport 處理，阻止冒泡到 ImageAnnotator
    const zoomInBtn = $('#zoom-in-btn');
    const zoomOutBtn = $('#zoom-out-btn');
    const zoomResetBtn = $('#zoom-reset-btn');

    if (zoomInBtn) {
      zoomInBtn.addEventListener('click', (e) => {
        if (this.isSvgActive()) {
          e.stopImmediatePropagation();
          if (this.svgViewport) {
            this.svgViewport.zoomIn();
          }
        }
      }, true);
    }

    if (zoomOutBtn) {
      zoomOutBtn.addEventListener('click', (e) => {
        if (this.isSvgActive()) {
          e.stopImmediatePropagation();
          if (this.svgViewport) {
            this.svgViewport.zoomOut();
          }
        }
      }, true);
    }

    if (zoomResetBtn) {
      zoomResetBtn.addEventListener('click', (e) => {
        if (this.isSvgActive()) {
          e.stopImmediatePropagation();
          if (this.svgViewport) {
            this.svgViewport.reset();
          }
        }
      }, true);
    }

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
            await this.loadAndDisplayRecords();
            this.loadAnnotations(this.currentSystemId);
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

    // 設置參考圖切換按鈕事件監聽
    const refToggleBtn = $('#reference-image-toggle');
    if (refToggleBtn) {
      refToggleBtn.addEventListener('click', () => {
        this.toggleReferenceImage();
      });
    }
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

      // 控制眼睛標籤面板的可見性（Phase 9 眼睛改用 SVG，舊標籤面板隱藏）
      this.toggleEyeLabelPanel(false);

      const eyeSideToggle = document.getElementById('eye-side-toggle');
      if (eyeSideToggle) {
        eyeSideToggle.hidden = (systemId !== 'eye');
      }

      const isTeeth = systemId === 'teeth' || systemId === 'primary_teeth';
      const odontogramView = document.getElementById('odontogram-view');
      const canvas = document.getElementById('image-canvas');
      const toggleBtn = document.getElementById('reference-image-toggle');

      const currentSvgContainer = this.getCurrentSvgContainer();
      if (currentSvgContainer) {
        this.isReferenceImageMode = false;
        // 隱藏其他 SVG 容器
        if (odontogramView && odontogramView !== currentSvgContainer) odontogramView.hidden = true;
        const eyeSvg = document.getElementById('eye-diagram-view');
        if (eyeSvg && eyeSvg !== currentSvgContainer) eyeSvg.hidden = true;
        const bodySvg = document.getElementById('body-map-view');
        if (bodySvg && bodySvg !== currentSvgContainer) bodySvg.hidden = true;

        currentSvgContainer.hidden = false;
        if (canvas) canvas.style.display = 'none';

        if (toggleBtn) {
          toggleBtn.hidden = false;
          toggleBtn.setAttribute('aria-pressed', 'false');
          toggleBtn.textContent = '參考圖';
          if (systemId === 'primary_teeth') {
            toggleBtn.disabled = true;
            toggleBtn.setAttribute('title', '乳牙沒有參考圖');
          } else {
            toggleBtn.disabled = false;
            toggleBtn.setAttribute('title', '切換參考圖');
          }
        }

        if (isTeeth) {
          await this.renderOdontogram();
        } else if (systemId === 'eye' && typeof this.renderEyeDiagram === 'function') {
          await this.renderEyeDiagram();
        } else if (systemId === 'body' && typeof this.renderBodyMap === 'function') {
          await this.renderBodyMap();
        }
      } else {
        this.isReferenceImageMode = false;
        if (odontogramView) odontogramView.hidden = true;
        const eyeSvg = document.getElementById('eye-diagram-view');
        if (eyeSvg) eyeSvg.hidden = true;
        const bodySvg = document.getElementById('body-map-view');
        if (bodySvg) bodySvg.hidden = true;

        if (canvas) {
          canvas.style.display = 'block';
          if (canvas.width === 0 || canvas.height === 0) {
            canvas.width = 800;
            canvas.height = 600;
          }
        }
        if (toggleBtn) {
          toggleBtn.hidden = true;
          toggleBtn.setAttribute('aria-pressed', 'false');
          toggleBtn.textContent = '參考圖';
        }
      }

      // 載入底層圖像（乳牙無底層圖檔，跳過）
      if (systemId !== 'primary_teeth') {
        const system = this.anatomicalSystems.systems.find(
          s => s.id === systemId
        );

        if (!system) {
          throw new Error(`System not found: ${systemId}`);
        }

        const imageId = system.imageIds[0];
        this.currentImageId = imageId;
        const imageFolder = systemId === 'teeth' ? 'teeth' : systemId;
        const imageFileMap = {
          'eye-3d': '3Deye',
          'eyefunctions': '3Deye'
        };

        const imageFileName = imageFileMap[imageId] || imageId;
        const imagePath = `assets/images/${imageFolder}/${imageFileName}.png`;
        await this.annotator.loadImage(imagePath);
      }

      // 更新標題
      const modal = $('#disease-modal');
      if (modal) {
        modal.setAttribute('data-system', systemId);
      }

      // 重置縮放
      this.annotator.resetZoom();

      // 加載已有的標註
      this.loadAnnotations(systemId);

      // 更新病歷列表
      await this.updateRecordList(systemId);

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
    const isTeeth = systemId === 'teeth' || systemId === 'primary_teeth';
    if (isTeeth) {
      this.annotator.clearAnnotations();
      const annotations = this.recordManager.getAnnotationsBySystem(systemId);
      annotations.forEach(anno => this.annotator.annotations.push(anno));
      this.refreshOdontogramRecords();
      this.updateRecordList(systemId);
      return;
    }

    if (systemId === 'eye') {
      this.annotator.clearAnnotations();
      const annotations = this.recordManager.getAnnotationsBySystem(systemId);
      annotations.forEach(anno => this.annotator.annotations.push(anno));
      if (typeof this.refreshEyeDiagramRecords === 'function') {
        this.refreshEyeDiagramRecords();
      }
      this.updateRecordList(systemId);
      return;
    }

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

    // 更新列表
    this.updateRecordList(systemId);
  }
  /**
   * 處理標註點擊
   * @param {Event} e - 事件
   */
  handleAnnotationClick(e) {
    // 參考圖僅供檢視，不開啟模態
    if (this.isReferenceImageMode || this.currentSystemId === 'teeth' || this.currentSystemId === 'primary_teeth') {
      showNotification('參考圖僅供檢視，請切回結構圖點選', 'info');
      return;
    }

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

  /**
   * 取得當前系統對應的 SVG 容器元素
   * @returns {HTMLElement|null}
   */
  getCurrentSvgContainer() {
    if (this.currentSystemId === 'teeth' || this.currentSystemId === 'primary_teeth') {
      return document.getElementById('odontogram-view');
    }
    if (this.currentSystemId === 'eye') {
      return document.getElementById('eye-diagram-view');
    }
    if (this.currentSystemId === 'body') {
      return document.getElementById('body-map-view');
    }
    return null;
  }

  /**
   * 判斷當前是否處於 SVG 視口有效狀態
   * @returns {boolean}
   */
  isSvgActive() {
    if (this.isReferenceImageMode) return false;
    const container = this.getCurrentSvgContainer();
    return !!(container && !container.hidden && this.svgViewport);
  }

  /**
   * 更新 SVG 縮放百分比顯示
   */
  updateSvgZoomDisplay() {
    const levelEl = document.getElementById('zoom-level');
    if (levelEl && this.svgViewport) {
      levelEl.textContent = `${Math.round(this.svgViewport.getZoom() * 100)}%`;
    }
  }

  /**
   * 切換參考圖（點陣圖）與結構圖（SVG）
   */
  toggleReferenceImage() {
    if (this.currentSystemId === 'primary_teeth') {
      showNotification('乳牙沒有參考圖', 'info');
      return;
    }

    const svgContainer = this.getCurrentSvgContainer();
    if (!svgContainer) return;

    const canvas = document.getElementById('image-canvas');
    const toggleBtn = document.getElementById('reference-image-toggle');

    this.isReferenceImageMode = !this.isReferenceImageMode;

    if (this.isReferenceImageMode) {
      svgContainer.hidden = true;
      if (canvas) {
        canvas.style.display = 'block';
        if (canvas.width === 0 || canvas.height === 0) {
          canvas.width = 800;
          canvas.height = 600;
        }
      }
      if (this.annotator) {
        this.annotator.renderImage();
      }
      if (toggleBtn) {
        toggleBtn.setAttribute('aria-pressed', 'true');
        toggleBtn.textContent = (this.currentSystemId === 'teeth' || this.currentSystemId === 'primary_teeth') ? '牙位圖' : '結構圖';
      }
    } else {
      if (canvas) canvas.style.display = 'none';
      svgContainer.hidden = false;
      if (toggleBtn) {
        toggleBtn.setAttribute('aria-pressed', 'false');
        toggleBtn.textContent = '參考圖';
      }
    }
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
