/* ================================================
   主控制邏輯
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
      console.log('初始化應用...');

      // 設置語言
      this.setupLanguage();

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

      console.log('應用初始化完成，病例列表已加載');
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
    console.log(`語言已切換為: ${lang === 'en' ? 'English' : '中文'}`);
  }

  /**
   * 加載資料檔案
   */
  async loadData() {
    try {
      this.anatomicalSystems = await loadJSON('data/anatomical-systems.json');
      console.log('已加載解剖系統資料');
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
      if (success) {
        console.log('✓ 牙齒座標數據加載成功');
      } else {
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
      if (success) {
        console.log('✓ 眼睛座標數據加載成功');
      } else {
        console.error('✗ 眼睛座標數據加載失敗');
      }
    });

    // 眼睛標籤映射器 [新增] - 用於識別眼睛圖像中的文字標籤
    if (typeof EyeLabelMapper !== 'undefined') {
      this.eyeLabelMapper = new EyeLabelMapper({
        debug: true
      });
      console.log('✓ 眼睛標籤映射器已初始化');
    }

    // 身體圖像映射器 [新增] - 用於識別身體圖像中的部位點擊區域
    if (typeof BodyImageMapper !== 'undefined') {
      this.bodyImageMapper = new BodyImageMapper({
        coordinatesUrl: '/data/body-coordinates.json',
        debug: true
      });

      // 預加載座標數據
      this.bodyImageMapper.loadCoordinates().then(success => {
        if (success) {
          console.log('✓ 身體座標數據加載成功');
        } else {
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

    // 疾病表單 (稍後初始化)
    // this.diseaseForm = new DiseaseForm();

    // OCR 處理器 (稍後初始化)
    // this.ocrHandler = new OCRHandler();

    console.log('模組初始化完成');
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
   * 設置眼睛標籤按鈕的事件監聽
   * 為所有 .eye-label-btn 按鈕添加點擊事件處理
   */
  setupEyeLabelButtonListeners() {
    const buttons = document.querySelectorAll('.eye-label-btn');

    buttons.forEach(button => {
      button.addEventListener('click', async (e) => {
        e.preventDefault();

        const structureId = button.dataset.structureId;
        const structureNameEn = button.dataset.structureNameEn;

        console.log(`[setupEyeLabelButtonListeners] 點擊標籤: ${structureNameEn} (ID: ${structureId})`);

        // 創建結構信息對象
        const structureInfo = {
          structureId: structureId,
          name: this.getChineseStructureName(structureId),
          nameEn: structureNameEn,
          type: this.getStructureType(structureId),
          side: this.getStructureSide(structureId),
          confidence: 1.0  // 按鈕點擊的信心度為100%
        };

        // 打開疾病記錄表單
        await this.openDiseaseModalWithStructure(structureInfo);
      });
    });

    console.log(`[setupEyeLabelButtonListeners] 已為 ${buttons.length} 個眼睛標籤按鈕添加點擊事件監聽`);
  }

  /**
   * 根據 structureId 獲取中文名稱
   * @param {string} structureId - 結構唯一標識符
   * @returns {string} 中文名稱
   */
  getChineseStructureName(structureId) {
    const nameMap = {
      'left-eye': '左眼',
      'left-eye-cornea': '角膜',
      'left-eye-iris': '虹膜',
      'left-eye-lens': '水晶體',
      'left-eye-retina': '視網膜',
      'left-eye-lacrimal': '淚腺',
      'right-eye': '右眼',
      'right-eye-cornea': '角膜',
      'right-eye-iris': '虹膜',
      'right-eye-lens': '水晶體',
      'right-eye-retina': '視網膜',
      'right-eye-lacrimal': '淚腺',
      'eye-choroid': '脈絡膜',
      'eye-sclera': '鞏膜',
      'eye-optic-nerve': '視神經',
      'eye-vitreous': '玻璃體',
      'eye-ciliary-body': '睫狀體',
      'eye-extraocular-muscles': '眼肌',
      'eye-blood-vessels': '血管',
      'eye-pupil': '瞳孔',
      'eye-dilator-pupillae': '瞳孔擴張肌',
      'eye-nasolacrimal-duct': '鼻淚管',
      'eye-vitreous-hyaloid': '玻璃管',
      'eye-ciliary-muscle': '睫狀肌'
    };

    return nameMap[structureId] || structureId;
  }

  /**
   * 根據 structureId 獲取結構類型
   * @param {string} structureId - 結構唯一標識符
   * @returns {string} 結構類型
   */
  getStructureType(structureId) {
    if (structureId.includes('cornea')) return 'cornea';
    if (structureId.includes('iris')) return 'iris';
    if (structureId.includes('lens')) return 'lens';
    if (structureId.includes('retina')) return 'retina';
    if (structureId.includes('lacrimal')) return 'lacrimal';
    if (structureId.includes('choroid')) return 'choroid';
    if (structureId.includes('sclera')) return 'sclera';
    if (structureId.includes('optic-nerve')) return 'optic-nerve';
    if (structureId.includes('vitreous')) return 'vitreous';
    if (structureId.includes('ciliary')) return 'ciliary';
    if (structureId.includes('muscle')) return 'muscle';
    if (structureId.includes('blood-vessel')) return 'blood-vessel';
    if (structureId.includes('pupil')) return 'pupil';
    if (structureId.includes('dilator')) return 'dilator';
    if (structureId.includes('nasolacrimal')) return 'nasolacrimal';
    return 'unknown';
  }

  /**
   * 根據 structureId 確定左眼/右眼/雙眼
   * @param {string} structureId - 結構唯一標識符
   * @returns {string} 'left', 'right', 或 'bilateral'
   */
  getStructureSide(structureId) {
    if (structureId.startsWith('left-eye')) return 'left';
    if (structureId.startsWith('right-eye')) return 'right';
    return 'bilateral';
  }

  /**
   * 打開疾病記錄模態視窗，並直接使用傳入的結構信息
   * @param {object} structureInfo - 結構信息對象
   */
  async openDiseaseModalWithStructure(structureInfo) {
    const modal = $('#disease-modal');
    if (!modal) {
      console.error('[openDiseaseModalWithStructure] 找不到疾病記錄模態視窗');
      return;
    }

    // 獲取詳細結構資訊
    let detailedInfo = null;
    if (typeof EyeStructureInfo !== 'undefined') {
      detailedInfo = EyeStructureInfo.getInfo(structureInfo.structureId || structureInfo.type);
    }

    // 設置位置資訊
    const locationDiv = $('#modal-location');
    if (locationDiv) {
      const englishName = structureInfo.nameEn.toLowerCase();
      const sideBadge = structureInfo.side === 'left' ? '左眼' :
                        structureInfo.side === 'right' ? '右眼' :
                        '雙眼';

      let locationText = `
        <div class="eye-structure-info">
          <p class="structure-info__main">
            <strong>${structureInfo.name}</strong>
            <span class="side-badge">${sideBadge}</span>
          </p>
          <p class="structure-info__english">
            <em>English: ${englishName}</em>
          </p>
          <p class="structure-info__type">
            結構類型: ${structureInfo.type}
          </p>
      `;

      // 添加詳細資訊（如果存在）
      if (detailedInfo) {
        locationText += `
          <div class="structure-info__details">
            <p class="structure-info__desc">${detailedInfo.description}</p>
            <p class="structure-info__func">
              <strong>功能：</strong>${detailedInfo.function}
            </p>
            ${detailedInfo.diseases && detailedInfo.diseases.length > 0 ? `
              <p class="structure-info__diseases">
                <strong>常見疾病：</strong>${detailedInfo.diseases.join('、')}
              </p>
            ` : ''}
          </div>
        `;
      }

      locationText += `</div>`;
      locationDiv.innerHTML = locationText;
    }

    // 保存結構信息供後續使用
    this.currentEyeStructure = structureInfo;

    // 初始化或更新疾病表單
    const formContainer = $('#disease-form-container');
    const diseaseSystemId = 'eye';

    if (formContainer && !this.diseaseForm) {
      this.diseaseForm = new DiseaseForm({
        container: formContainer,
        systemId: diseaseSystemId,
        diseaseData: this.anatomicalSystems
      });
      await this.diseaseForm.render();
    } else if (this.diseaseForm) {
      // 重置表單以清除之前的選擇
      this.diseaseForm.reset();

      if (this.diseaseForm.systemId !== diseaseSystemId) {
        this.diseaseForm.systemId = diseaseSystemId;
        this.diseaseForm.diseases = [];
        await this.diseaseForm.loadDiseases(diseaseSystemId);
      }
      await this.diseaseForm.render();
    }

    // 顯示模態視窗
    const overlay = $('#modal-overlay');
    if (overlay) {
      overlay.classList.add('visible');
    }
    modal.setAttribute('aria-hidden', 'false');

    console.log(`[openDiseaseModalWithStructure] 打開疾病記錄: ${structureInfo.name} (${englishName})`);
  }

/**
   * 顯示眼睛結構資訊在側面板
   * @param {object} structure - 眼睛結構物件
   */
  displayEyeStructureInfo(structure) {
    const infoContent = document.getElementById('eye-info-content');

    if (!infoContent) return;

    if (!structure || !structure.structureId) {
      infoContent.innerHTML = '<div class="eye-info-empty">點擊圖像上的結構以查看詳細信息</div>';
      return;
    }

    // 從 eye-descriptions.js 加載說明
    const description = getEyeStructureDescription(structure.structureId);

    if (!description) {
      infoContent.innerHTML = `
            <div class="eye-info-content">
                <div class="name">${structure.name || structure.structureId}</div>
            </div>
        `;
      return;
    }

    infoContent.innerHTML = `
        <div class="eye-info-content">
            <div class="name">${description.name}</div>
            <div class="name-en">${description.nameEn}</div>
            <div class="description">${description.description}</div>
            <div class="description-en">${description.descriptionEn}</div>
        </div>
    `;
  }

  /**
   * 切換眼睛資訊面板可見性
   * @param {boolean} show - 是否顯示面板
   */
  toggleEyeInfoPanel(show) {
    const wrapper = document.getElementById('image-viewer-wrapper');
    const infoPanel = document.getElementById('eye-info-panel');

    if (!wrapper || !infoPanel) return;

    if (show) {
      // 顯示 2 列佈局以用於眼睛系統
      wrapper.classList.add('eye-system-active');
      infoPanel.classList.add('visible');
    } else {
      // 返回單列佈局用於其他系統
      wrapper.classList.remove('eye-system-active');
      infoPanel.classList.remove('visible');
    }
  }

  /**
   * 設置疾病記錄模態視窗
   */
  setupDiseaseModal() {
    const modal = $('#disease-modal');
    const overlay = $('#modal-overlay');
    const closeBtn = document.querySelector('.modal__close');
    const cancelBtn = $('#modal-cancel-btn');
    const saveBtn = $('#modal-save-btn');

    if (overlay) {
      overlay.addEventListener('click', () => this.closeDiseaseModal());
    }

    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.closeDiseaseModal());
    }

    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => this.closeDiseaseModal());
    }

    if (saveBtn) {
      saveBtn.addEventListener('click', () => {
        if (this.currentSystemId === 'body') {
          this.saveBodyOperation();
        } else {
          this.saveDiseaseAnnotation();
        }
      });
    }

    // 監聽按 Escape 關閉模態
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modal && modal.getAttribute('aria-hidden') === 'false') {
        this.closeDiseaseModal();
      }
    });
  }

  /**
   * 初始化疾病表單以加載特定系統的疾病
   * @param {string} systemId - 系統 ID (eye 或 teeth)
   */
  initializeDiseaseForm(systemId) {
    const formContainer = $('#disease-form-container');
    if (!formContainer) return;

    // 如果表單不存在，創建新的
    if (!this.diseaseForm) {
      this.diseaseForm = new DiseaseForm({
        container: formContainer,
        systemId: systemId
      });
    } else {
      // 如果表單已存在，更新系統 ID 並重新加載疾病
      this.diseaseForm.systemId = systemId;
      this.diseaseForm.selectedDiseases = [];
      this.diseaseForm.treatmentNotes = '';

      // 加載新系統的疾病
      this.diseaseForm.loadDiseases(systemId).then(() => {
        return this.diseaseForm.render();
      }).catch(error => {
        console.error('重新加載疾病失敗:', error);
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

      console.log(`已切換至${teethType === 'permanent' ? '永久齒' : '乳齒'}系統`);
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
            console.log('✓ 眼睛標籤已繪製在 canvas 上');
          }, 100);
        }
      }

      // 加載已有的標註
      this.loadAnnotations(systemId);

      console.log(`已加載系統: ${systemId} (${imageId})`);
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
   * 切換眼睛標籤面板的可見性
   * @param {boolean} visible - 是否顯示面板
   */
  toggleEyeLabelPanel(visible = true) {
    const panelContainer = document.getElementById('eye-label-panel-container');
    if (!panelContainer) {
      console.warn('[toggleEyeLabelPanel] 找不到眼睛標籤面板容器');
      return;
    }

    if (visible) {
      panelContainer.style.display = 'block';
      console.log('[toggleEyeLabelPanel] 眼睛標籤面板已顯示');
    } else {
      panelContainer.style.display = 'none';
      console.log('[toggleEyeLabelPanel] 眼睛標籤面板已隱藏');
    }
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

  /**
   * 使用 DentalImageMapper 精確識別牙齒位置
   * @param {object} position - 點擊位置 {x, y}
   * @returns {object|null} 牙齒資訊或 null
   */
  detectToothPosition(position) {
    // 僅處理牙齒系統
    if (this.currentSystemId !== 'teeth' && this.currentSystemId !== 'primary_teeth') {
      return null;
    }

    // 檢查 DentalImageMapper 是否已加載
    if (!this.dentalMapper || !this.dentalMapper.isLoaded) {
      console.warn('DentalImageMapper 尚未加載，使用備選方法');
      return this.detectToothPositionFallback(position);
    }

    const canvas = document.getElementById('image-canvas');
    if (!canvas) return null;

    // 取得原始圖像的實際尺寸
    let naturalWidth = 1313;   // 預設永久齒圖像寬度
    let naturalHeight = 610;   // 預設永久齒圖像高度

    // 嘗試從 ImageAnnotator 實例中獲取原始圖像尺寸
    if (this.annotator && this.annotator.imageData) {
      naturalWidth = this.annotator.imageData.naturalWidth || naturalWidth;
      naturalHeight = this.annotator.imageData.naturalHeight || naturalHeight;
    }

    // 取得 canvas 的顯示尺寸
    const canvasDisplayWidth = canvas.offsetWidth;
    const canvasDisplayHeight = canvas.offsetHeight;

    // 獲取 ImageAnnotator 的 zoom 和 pan 參數
    let zoom = 1;
    let panX = 0;
    let panY = 0;
    if (this.annotator) {
      zoom = this.annotator.zoom || 1;
      panX = this.annotator.panX || 0;
      panY = this.annotator.panY || 0;
    }

    // 計算縮放後的圖像尺寸
    const scaledWidth = (canvasDisplayWidth / window.devicePixelRatio) * zoom;
    const scaledHeight = (canvasDisplayHeight / window.devicePixelRatio) * zoom;

    // 計算圖像在 canvas 中的位置（相對於 canvas 左上角）
    const imgX = (canvasDisplayWidth / window.devicePixelRatio - scaledWidth) / 2 + panX;
    const imgY = (canvasDisplayHeight / window.devicePixelRatio - scaledHeight) / 2 + panY;

    // 將點擊坐標轉換回原始圖像座標
    // 第1步：從 canvas 座標轉換回未縮放的圖像位置
    const relX = (position.x / window.devicePixelRatio - imgX) / scaledWidth * (canvasDisplayWidth / window.devicePixelRatio);
    const relY = (position.y / window.devicePixelRatio - imgY) / scaledHeight * (canvasDisplayHeight / window.devicePixelRatio);

    // 第2步：從顯示座標轉換回原始圖像座標
    const scaleX = canvasDisplayWidth / naturalWidth;
    const scaleY = canvasDisplayHeight / naturalHeight;

    const adjustedPos = {
      x: relX / scaleX,
      y: relY / scaleY
    };

    if (this.dentalMapper.debug) {
      console.log('[detectToothPosition] 坐標轉換詳情：');
      console.log(`  原始圖像: ${naturalWidth}x${naturalHeight}, Canvas: ${canvasDisplayWidth}x${canvasDisplayHeight}`);
      console.log(`  Zoom: ${zoom.toFixed(2)}, Pan: (${panX.toFixed(1)}, ${panY.toFixed(1)})`);
      console.log(`  點擊座標 (原始): ${position.x.toFixed(1)}, ${position.y.toFixed(1)}`);
      console.log(`  轉換後座標 (原始圖像): ${adjustedPos.x.toFixed(1)}, ${adjustedPos.y.toFixed(1)}`);
    }

    // 根據當前牙齒類型選擇座標集
    const teethType = this.currentSystemId === 'primary_teeth' ? 'primary' : 'permanent';

    // 使用 DentalImageMapper 識別牙齒
    const toothInfo = this.dentalMapper.getToothAtPosition(
      adjustedPos.x,
      adjustedPos.y,
      teethType
    );

    if (toothInfo) {
      return {
        name: toothInfo.nameCh,           // 中文名稱
        nameEn: toothInfo.name,           // 英文名稱
        fdi: toothInfo.fdi,               // FDI 編號
        number: toothInfo.number,         // Universal 編號
        confidence: toothInfo.confidence, // 信心度（0-1）
        type: toothInfo.type,             // 牙齒類型
        quadrant: toothInfo.quadrant      // 象限
      };
    }

    return null;
  }

  /**
   * 備選方法：當 DentalImageMapper 不可用時使用
   * @param {object} position - 點擊位置
   * @returns {object|null} 基本位置信息
   */
  detectToothPositionFallback(position) {
    const canvas = document.getElementById('image-canvas');
    if (!canvas) return null;

    const relativeX = position.x / (canvas.width || canvas.offsetWidth);
    const relativeY = position.y / (canvas.height || canvas.offsetHeight);

    let quadrantName = '';
    if (relativeY < 0.5) {
      quadrantName = relativeX < 0.5 ? '右上' : '左上';
    } else {
      quadrantName = relativeX < 0.5 ? '右下' : '左下';
    }

    return {
      name: `${quadrantName}牙齒區域`,
      confidence: 0.3,
      fallback: true
    };
  }

  /**
   * 使用 EyeImageMapper 精確識別眼睛結構位置 [新增方法]
   * @param {object} position - 點擊位置 {x, y}
   * @returns {object|null} 眼睛結構資訊或 null
   */
  detectEyeStructure(position) {
    // 檢查 EyeImageMapper 是否已加載
    if (!this.eyeMapper || !this.eyeMapper.isLoaded) {
      console.warn('EyeImageMapper 尚未加載');
      showNotification('眼睛系統尚未就緒，請稍候...', 'warning');
      return null;
    }

    const canvas = document.getElementById('image-canvas');
    if (!canvas) return null;

    // 獲取原始圖像的實際尺寸（眼睛圖像尺寸）
    let naturalWidth = 1313;   // 3Deye.png 寬度
    let naturalHeight = 664;   // 3Deye.png 高度

    // 嘗試從 ImageAnnotator 實例中獲取原始圖像尺寸
    if (this.annotator && this.annotator.imageData) {
      naturalWidth = this.annotator.imageData.naturalWidth || naturalWidth;
      naturalHeight = this.annotator.imageData.naturalHeight || naturalHeight;
    }

    // 取得 canvas 的顯示尺寸
    const canvasDisplayWidth = canvas.offsetWidth;
    const canvasDisplayHeight = canvas.offsetHeight;

    // 獲取 ImageAnnotator 的 zoom 和 pan 參數
    let zoom = 1;
    let panX = 0;
    let panY = 0;
    if (this.annotator) {
      zoom = this.annotator.zoom || 1;
      panX = this.annotator.panX || 0;
      panY = this.annotator.panY || 0;
    }

    // 計算縮放後的圖像尺寸
    const scaledWidth = (canvasDisplayWidth / window.devicePixelRatio) * zoom;
    const scaledHeight = (canvasDisplayHeight / window.devicePixelRatio) * zoom;

    // 計算圖像在 canvas 中的位置（相對於 canvas 左上角）
    const imgX = (canvasDisplayWidth / window.devicePixelRatio - scaledWidth) / 2 + panX;
    const imgY = (canvasDisplayHeight / window.devicePixelRatio - scaledHeight) / 2 + panY;

    // 將點擊坐標轉換回原始圖像座標
    // 第1步：從 canvas 座標轉換回未縮放的圖像位置
    const relX = (position.x / window.devicePixelRatio - imgX) / scaledWidth * (canvasDisplayWidth / window.devicePixelRatio);
    const relY = (position.y / window.devicePixelRatio - imgY) / scaledHeight * (canvasDisplayHeight / window.devicePixelRatio);

    // 第2步：從顯示座標轉換回原始圖像座標
    const scaleX = canvasDisplayWidth / naturalWidth;
    const scaleY = canvasDisplayHeight / naturalHeight;

    const adjustedPos = {
      x: relX / scaleX,
      y: relY / scaleY
    };

    if (this.eyeMapper.debug) {
      console.log('[detectEyeStructure] 坐標轉換詳情：');
      console.log(`  原始圖像: ${naturalWidth}x${naturalHeight}, Canvas: ${canvasDisplayWidth}x${canvasDisplayHeight}`);
      console.log(`  Zoom: ${zoom.toFixed(2)}, Pan: (${panX.toFixed(1)}, ${panY.toFixed(1)})`);
      console.log(`  點擊座標 (原始): ${position.x.toFixed(1)}, ${position.y.toFixed(1)}`);
      console.log(`  轉換後座標 (原始圖像): ${adjustedPos.x.toFixed(1)}, ${adjustedPos.y.toFixed(1)}`);
    }

    // 首先嘗試檢測標籤點擊（標籤有更高的優先級） [新增]
    let labelInfo = null;
    if (this.eyeLabelMapper) {
      labelInfo = this.eyeLabelMapper.getLabelAtPosition(adjustedPos.x, adjustedPos.y, 40);
      if (labelInfo && this.eyeMapper.debug) {
        console.log('[detectEyeStructure] 檢測到標籤點擊:', labelInfo.labelText);
      }
    }

    // 使用 EyeImageMapper 識別眼睛結構
    const structureInfo = this.eyeMapper.getStructureAtPosition(
      adjustedPos.x,
      adjustedPos.y
    );

    // 如果點擊了標籤，優先使用標籤的結構 ID [新增]
    if (labelInfo && labelInfo.structureId) {
      const labelStructureInfo = this.eyeMapper.getStructureInfo(labelInfo.structureId);
      if (labelStructureInfo) {
        return {
          structureId: labelStructureInfo.id,
          name: labelStructureInfo.nameCh,           // 中文名稱
          nameEn: labelStructureInfo.name,           // 英文名稱
          type: labelStructureInfo.type,             // 結構類型
          side: labelStructureInfo.side,             // 左眼或右眼
          confidence: 1.0,  // 標籤點擊信心度為 100%
          fromLabel: true   // 標記為來自標籤點擊
        };
      }
    }

    // 其次使用圖像結構識別結果
    if (structureInfo) {
      return {
        structureId: structureInfo.structureId,
        name: structureInfo.nameCh,           // 中文名稱
        nameEn: structureInfo.name,           // 英文名稱
        type: structureInfo.type,             // 結構類型（eye, cornea, iris, lens, retina）
        side: structureInfo.side,             // 左眼或右眼
        confidence: structureInfo.confidence  // 信心度（0-1）
      };
    }

    return null;
  }

  /**
   * 使用 BodyImageMapper 精確識別身體部位位置 [新增方法]
   * @param {object} position - 點擊位置 {x, y}
   * @returns {object|null} 身體部位資訊或 null
   */
  detectBodyRegion(position) {
    // 檢查 BodyImageMapper 是否已加載
    if (!this.bodyImageMapper || !this.bodyImageMapper.isLoaded) {
      console.warn('BodyImageMapper 尚未加載');
      showNotification('身體系統尚未就緒，請稍候...', 'warning');
      return null;
    }

    const canvas = document.getElementById('image-canvas');
    if (!canvas) return null;

    // 獲取原始圖像的實際尺寸（bodysurface.png 尺寸）
    let naturalWidth = 600;   // bodysurface.png 寬度
    let naturalHeight = 800;  // bodysurface.png 高度

    // 嘗試從 ImageAnnotator 實例中獲取原始圖像尺寸
    if (this.annotator && this.annotator.imageData) {
      naturalWidth = this.annotator.imageData.naturalWidth || naturalWidth;
      naturalHeight = this.annotator.imageData.naturalHeight || naturalHeight;
    }

    // 取得 canvas 的顯示尺寸
    const canvasDisplayWidth = canvas.offsetWidth;
    const canvasDisplayHeight = canvas.offsetHeight;

    // 獲取 ImageAnnotator 的 zoom 和 pan 參數
    let zoom = 1;
    let panX = 0;
    let panY = 0;
    if (this.annotator) {
      zoom = this.annotator.zoom || 1;
      panX = this.annotator.panX || 0;
      panY = this.annotator.panY || 0;
    }

    // 計算縮放後的圖像尺寸
    const scaledWidth = (canvasDisplayWidth / window.devicePixelRatio) * zoom;
    const scaledHeight = (canvasDisplayHeight / window.devicePixelRatio) * zoom;

    // 計算圖像在 canvas 中的位置（相對於 canvas 左上角）
    const imgX = (canvasDisplayWidth / window.devicePixelRatio - scaledWidth) / 2 + panX;
    const imgY = (canvasDisplayHeight / window.devicePixelRatio - scaledHeight) / 2 + panY;

    // 將點擊坐標轉換回原始圖像座標
    // 第1步：從 canvas 座標轉換回未縮放的圖像位置
    const relX = (position.x / window.devicePixelRatio - imgX) / scaledWidth * (canvasDisplayWidth / window.devicePixelRatio);
    const relY = (position.y / window.devicePixelRatio - imgY) / scaledHeight * (canvasDisplayHeight / window.devicePixelRatio);

    // 第2步：從顯示座標轉換回原始圖像座標
    const scaleX = canvasDisplayWidth / naturalWidth;
    const scaleY = canvasDisplayHeight / naturalHeight;

    const adjustedPos = {
      x: relX / scaleX,
      y: relY / scaleY
    };

    if (this.bodyImageMapper.debug) {
      console.log('[detectBodyRegion] 坐標轉換詳情：');
      console.log(`  原始圖像: ${naturalWidth}x${naturalHeight}, Canvas: ${canvasDisplayWidth}x${canvasDisplayHeight}`);
      console.log(`  Zoom: ${zoom.toFixed(2)}, Pan: (${panX.toFixed(1)}, ${panY.toFixed(1)})`);
      console.log(`  點擊座標 (原始): ${position.x.toFixed(1)}, ${position.y.toFixed(1)}`);
      console.log(`  轉換後座標 (原始圖像): ${adjustedPos.x.toFixed(1)}, ${adjustedPos.y.toFixed(1)}`);
    }

    // 使用 BodyImageMapper 識別身體部位
    const regionInfo = this.bodyImageMapper.getRegionAtPosition(
      adjustedPos.x,
      adjustedPos.y
    );

    if (regionInfo) {
      return {
        id: regionInfo.id,
        name: regionInfo.name,           // 中文名稱
        nameEn: regionInfo.nameEn,       // 英文名稱
        side: regionInfo.side,           // left, right, mid
        confidence: regionInfo.confidence // 信心度（0-1）
      };
    }

    return null;
  }

  /**
   * 打開疾病記錄模態視窗
   * @param {object} position - 點擊位置
   */
  async openDiseaseModal(position) {
    const modal = $('#disease-modal');
    if (!modal) return;

    // 根據系統類型進行適當的結構檢測 [修改]
    let structureInfo = null;

    if (this.currentSystemId === 'teeth' || this.currentSystemId === 'primary_teeth') {
      // 牙齒系統：使用 DentalImageMapper 識別
      structureInfo = this.detectToothPosition(position);
    } else if (this.currentSystemId === 'eye') {
      // 眼睛系統 [新增] 使用 EyeImageMapper 識別
      structureInfo = this.detectEyeStructure(position);
    } else if (this.currentSystemId === 'body') {
      // 身體系統 [新增] 使用 BodyImageMapper 識別
      structureInfo = this.detectBodyRegion(position);
    }

    // 設置位置資訊
    const locationDiv = $('#modal-location');
    if (locationDiv) {
      let locationText = '';

      if (structureInfo) {
        // 牙齒系統特定的顯示格式
        if (this.currentSystemId === 'teeth' || this.currentSystemId === 'primary_teeth') {
          locationText = `
            <div class="tooth-info">
              <p class="tooth-info__main">
                <strong>${structureInfo.name}</strong>
                ${structureInfo.fdi ? `<span class="fdi-badge">FDI: ${structureInfo.fdi}</span>` : ''}
              </p>
              ${structureInfo.confidence < 0.5 ?
                '<p class="tooth-info__warning">⚠️ 檢測信心度較低，請確認選擇</p>' : ''}
            </div>
          `;

          console.log(`牙齒檢測: ${structureInfo.name}, 信心度: ${(structureInfo.confidence * 100).toFixed(1)}%`);

          // 低信心度或備選方法時顯示手動選擇器
          if (structureInfo.fallback || structureInfo.confidence < 0.5) {
            locationText += this.renderManualToothSelector();
          }
        }
        // 眼睛系統特定的顯示格式 [新增]
        else if (this.currentSystemId === 'eye') {
          locationText = `
            <div class="eye-structure-info">
              <p class="structure-info__main">
                <strong>${structureInfo.name}</strong>
                <span class="side-badge">${structureInfo.side === 'left' ? '左眼' : '右眼'}</span>
              </p>
              <p class="structure-info__type">
                結構類型: ${structureInfo.type}
              </p>
              ${structureInfo.confidence < 0.5 ?
                '<p class="structure-info__warning">⚠️ 檢測信心度較低，請點擊重試</p>' : ''}
            </div>
          `;

          console.log(`眼睛結構檢測: ${structureInfo.name}, 信心度: ${(structureInfo.confidence * 100).toFixed(1)}%`);
        }
        // 身體系統特定的顯示格式 [新增]
        else if (this.currentSystemId === 'body') {
          locationText = `
            <div class="body-region-info">
              <p class="structure-info__main">
                <strong>${structureInfo.name}</strong>
                <span class="side-badge">${structureInfo.side === 'left' ? '左側' : structureInfo.side === 'right' ? '右側' : '中線'}</span>
              </p>
              ${structureInfo.confidence < 0.5 ?
                '<p class="structure-info__warning">⚠️ 檢測信心度較低，請重新點擊</p>' : ''}
            </div>
          `;

          console.log(`身體部位檢測: ${structureInfo.name}, 信心度: ${(structureInfo.confidence * 100).toFixed(1)}%`);
        }
      } else {
        // 無法識別 [修改]
        if (this.currentSystemId === 'teeth' || this.currentSystemId === 'primary_teeth') {
          locationText = `
            <p class="tooth-info__error">無法自動識別牙齒位置</p>
            ${this.renderManualToothSelector()}
          `;
        } else if (this.currentSystemId === 'eye') {
          locationText = `
            <p class="structure-info__error">無法自動識別眼睛結構位置，請重新點擊</p>
          `;
        } else if (this.currentSystemId === 'body') {
          locationText = `
            <p class="structure-info__error">無法自動識別身體部位，請重新點擊</p>
          `;
        }
      }

      locationDiv.innerHTML = locationText;
      if (this.currentSystemId === 'teeth' || this.currentSystemId === 'primary_teeth') {
        this.setupManualToothSelector();
      }
    }

    // 保存結構資訊供後續使用 [修改變數名]
    if (this.currentSystemId === 'teeth' || this.currentSystemId === 'primary_teeth') {
      this.currentToothInfo = structureInfo;
    } else if (this.currentSystemId === 'eye') {
      this.currentEyeStructure = structureInfo;
    } else if (this.currentSystemId === 'body') {
      this.currentBodyRegion = structureInfo;
    }

    // 設置模態視窗標題
    const modalTitle = document.getElementById('modal-title');
    if (modalTitle) {
      if (this.currentSystemId === 'body') {
        modalTitle.textContent = this.currentLanguage === 'zh' ? '記錄操作/治療' : 'Record Operation/Treatment';
      } else if (this.currentSystemId === 'teeth' || this.currentSystemId === 'primary_teeth') {
        modalTitle.textContent = this.currentLanguage === 'zh' ? '新增疾病記錄' : 'Add Disease Record';
      } else if (this.currentSystemId === 'eye') {
        modalTitle.textContent = this.currentLanguage === 'zh' ? '新增眼睛結構信息' : 'Add Eye Structure Info';
      }
    }

    // 初始化或更新疾病表單（身體系統使用操作表單，其他系統使用疾病表單）
    const formContainer = $('#disease-form-container');
    const operationFormContainer = $('#body-operation-form-container');

    if (this.currentSystemId === 'body') {
      // 身體系統 - 生成操作表單
      if (structureInfo) {
        const operationFormHTML = this.bodyOperationForm.generateFormHTML(structureInfo);
        if (operationFormContainer) {
          operationFormContainer.innerHTML = operationFormHTML;
        }
        if (formContainer) {
          formContainer.innerHTML = ''; // 清空疾病表單容器
        }

        // 設置表單事件監聽
        this.bodyOperationForm.setupSideButtonListeners();
        this.bodyOperationForm.setupCharacterCounter();
      }
    } else {
      // 其他系統 - 使用疾病表單
      if (operationFormContainer) {
        operationFormContainer.innerHTML = ''; // 清空操作表單容器
      }

      // 將 primary_teeth 系統轉換為 teeth（它們使用相同的疾病列表）
      const diseaseSystemId = this.currentSystemId === 'primary_teeth' ? 'teeth' : this.currentSystemId;

      if (formContainer && !this.diseaseForm) {
        // 載入疾病資料並初始化表單（使用正確的系統 ID）
        this.diseaseForm = new DiseaseForm({
          container: formContainer,
          systemId: diseaseSystemId,
          diseaseData: this.anatomicalSystems
        });
        // 等待表單渲染完成
        await this.diseaseForm.render();
      } else if (this.diseaseForm) {
        // 確保使用正確的系統 ID，然後重新渲染表單
        if (this.diseaseForm.systemId !== diseaseSystemId) {
          this.diseaseForm.systemId = diseaseSystemId;
          this.diseaseForm.diseases = [];
          await this.diseaseForm.loadDiseases(diseaseSystemId);
        }
        await this.diseaseForm.render();
      }
    }

    // 顯示模態視窗和背景覆蓋
    const overlay = $('#modal-overlay');
    if (overlay) {
      overlay.classList.add('visible');
    }
    modal.setAttribute('aria-hidden', 'false');

    // 保存當前位置
    this.currentClickPosition = position;
  }

  /**
   * 渲染手動牙齒選擇器
   * @returns {string} HTML 字串
   */
  renderManualToothSelector() {
    const teethType = this.currentSystemId === 'primary_teeth' ? 'primary' : 'permanent';

    if (!this.dentalMapper || !this.dentalMapper.isLoaded) {
      return '<p class="manual-selector__empty">無法加載牙齒列表</p>';
    }

    let teethList = this.dentalMapper.getAllTeeth(teethType);

    let html = `
      <div class="manual-tooth-selector">
        <h4 class="manual-selector__title">或手動選擇牙齒：</h4>
        <select id="manual-tooth-select" class="manual-tooth-select">
          <option value="">-- 請選擇牙齒 --</option>
    `;

    const quadrants = {
      'UR': '右上', 'UL': '左上', 'LL': '左下', 'LR': '右下'
    };

    Object.entries(quadrants).forEach(([code, name]) => {
      const quadrantTeeth = teethList.filter(t => t.quadrant === code);
      if (quadrantTeeth.length > 0) {
        html += `<optgroup label="${name}">`;
        quadrantTeeth.forEach(tooth => {
          html += `
            <option value="${tooth.toothId}" data-name="${tooth.nameCh}" data-fdi="${tooth.fdi}">
              ${tooth.nameCh} (FDI: ${tooth.fdi})
            </option>
          `;
        });
        html += `</optgroup>`;
      }
    });

    html += `</select></div>`;
    return html;
  }

  /**
   * 設置手動選擇器的事件監聽
   */
  setupManualToothSelector() {
    const selector = document.getElementById('manual-tooth-select');
    if (!selector) return;

    selector.addEventListener('change', (e) => {
      const selectedOption = e.target.options[e.target.selectedIndex];
      if (!selectedOption.value) return;

      const teethType = this.currentSystemId === 'primary_teeth' ? 'primary' : 'permanent';
      const toothInfo = this.dentalMapper.getToothInfo(selectedOption.value, teethType);

      if (toothInfo) {
        this.currentToothInfo = {
          name: toothInfo.nameCh,
          nameEn: toothInfo.name,
          fdi: toothInfo.fdi,
          number: toothInfo.toothId,
          confidence: 1.0,
          manualSelection: true
        };

        const mainInfo = document.querySelector('.tooth-info__main');
        if (mainInfo) {
          mainInfo.innerHTML = `
            <strong>${toothInfo.nameCh}</strong>
            <span class="fdi-badge">FDI: ${toothInfo.fdi}</span>
            <span class="manual-badge">手動選擇</span>
          `;
        }
      }
    });
  }

  /**
   * 關閉疾病記錄模態視窗
   */
  closeDiseaseModal() {
    const modal = $('#disease-modal');
    const overlay = $('#modal-overlay');

    // 在隱藏模態視窗前，清除焦點以避免 aria-hidden 衝突
    if (document.activeElement && document.activeElement !== document.body) {
      document.activeElement.blur();
    }

    if (modal) {
      modal.setAttribute('aria-hidden', 'true');
    }

    if (overlay) {
      overlay.classList.remove('visible');
    }
  }

  /**
   * 獲取位置的人類可讀名稱
   * @param {object} position - 點擊位置
   * @returns {string} 位置名稱
   */
  getLocationName(position) {
    const system = this.anatomicalSystems.systems.find(
      s => s.id === this.currentSystemId
    );

    if (!system) {
      return `位置: (${Math.round(position.x)}, ${Math.round(position.y)})`;
    }

    // 根據系統類型返回更具體的位置信息
    switch (this.currentSystemId) {
      case 'teeth':
        // 牙齒系統：返回牙齒編號範圍
        const toothLocation = this.estimateToothLocation(position);
        return toothLocation ? `牙齒位置: ${toothLocation}` : `位置: 牙齒區域`;

      case 'eye':
        const eyeLocation = this.estimateEyeLocation(position);
        return eyeLocation ? `眼睛位置: ${eyeLocation}` : `位置: 眼睛區域`;

      case 'body':
        const bodyLocation = this.estimateBodyLocation(position);
        return bodyLocation ? `身體位置: ${bodyLocation}` : `位置: 身體區域`;

      default:
        return `位置: (${Math.round(position.x)}, ${Math.round(position.y)})`;
    }
  }

  /**
   * 估計牙齒位置（基於座標的推斷）
   * @param {object} position - 點擊位置（規範化到 0-1 之間）
   * @returns {string} 牙齒位置名稱
   */
  estimateToothLocation(position) {
    const x = position.x;
    const y = position.y;

    // Universal 編號系統：
    // 上牙：1-8(右上), 9-16(左上)
    // 下牙：17-24(左下), 25-32(右下)

    let location = '';
    let quadrant = '';

    // 確定象限（上下）
    if (y < 0.45) {
      quadrant = '上';
    } else if (y > 0.55) {
      quadrant = '下';
    } else {
      quadrant = '中';
    }

    // 確定左右
    if (x < 0.35) {
      location = '左';
    } else if (x > 0.65) {
      location = '右';
    } else {
      location = '中';
    }

    // 細分牙齒類型
    let toothType = '牙齒';
    if (x < 0.15 || x > 0.85) {
      toothType = '磨牙';
    } else if (x < 0.25 || x > 0.75) {
      toothType = '臼牙';
    } else if (x < 0.40 || x > 0.60) {
      toothType = '犬牙';
    } else {
      toothType = '門牙';
    }

    return `${location}${quadrant}${toothType}`;
  }

  /**
   * 估計眼睛位置
   * @param {object} position - 點擊位置
   * @returns {string} 眼睛位置名稱
   */
  estimateEyeLocation(position) {
    const x = position.x;
    const y = position.y;

    let eye = '';
    if (x < 0.35) {
      eye = '左眼';
    } else if (x > 0.65) {
      eye = '右眼';
    } else {
      eye = '眼睛';
    }

    // 細分眼睛部位
    if (y < 0.25) {
      return `${eye}上瞼`;
    } else if (y > 0.75) {
      return `${eye}下瞼`;
    } else if (x > 0.35 && x < 0.65 && y > 0.35 && y < 0.65) {
      return `${eye}角膜`;
    } else if (y > 0.4 && y < 0.6) {
      if ((x < 0.35 && y < 0.5) || (x > 0.65 && y < 0.5)) {
        return `${eye}內眼角`;
      } else if ((x < 0.35 && y > 0.5) || (x > 0.65 && y > 0.5)) {
        return `${eye}外眼角`;
      }
      return `${eye}虹膜`;
    }
    return eye;
  }

  /**
   * 估計身體位置
   * @param {object} position - 點擊位置
   * @returns {string} 身體位置名稱
   */
  estimateBodyLocation(position) {
    const x = position.x;
    const y = position.y;

    // 根據 Y 座標判斷上下身
    if (y < 0.2) {
      // 頭部區域
      if (x < 0.35) return '左耳';
      if (x > 0.65) return '右耳';
      return '頭部';
    } else if (y < 0.35) {
      // 頸部和肩膀
      if (x < 0.35) return '左肩';
      if (x > 0.65) return '右肩';
      return '頸部';
    } else if (y < 0.55) {
      // 胸腔和上腹
      if (x < 0.3) return '左胸';
      if (x > 0.7) return '右胸';
      if (y < 0.45) return '胸部';
      return '上腹';
    } else if (y < 0.7) {
      // 腹部
      if (x < 0.3) return '左側腹';
      if (x > 0.7) return '右側腹';
      return '腹部';
    } else if (y < 0.85) {
      // 骨盆和腹股溝
      if (x < 0.35) return '左腹股溝';
      if (x > 0.65) return '右腹股溝';
      return '下腹';
    } else {
      // 下肢
      if (x < 0.35) return '左腿';
      if (x > 0.65) return '右腿';
      return '腿部';
    }
  }

  /**
   * 保存疾病標註
   */
  async saveDiseaseAnnotation() {
    // 收集表單資料
    if (!this.diseaseForm) {
      console.error('[saveDiseaseAnnotation] 表單未初始化');
      showNotification('表單未初始化', 'error');
      return;
    }

    const formData = this.diseaseForm.getFormData();

    // 驗證是否選擇了疾病
    if (!formData.diseases || formData.diseases.length === 0) {
      console.warn('[saveDiseaseAnnotation] 未選擇疾病');
      showNotification('請選擇至少一種疾病', 'warning');
      return;
    }

    // 根據系統類型構建標註對象
    let annotation;

    if (this.currentSystemId === 'eye') {
      // 眼睛系統的標註對象
      if (!this.currentEyeStructure) {
        console.error('[saveDiseaseAnnotation] 眼睛系統缺少結構信息');
        showNotification('請先選擇眼睛結構', 'warning');
        return;
      }

      annotation = {
        annotationId: generateUUID(),
        position: this.currentClickPosition || { x: 0, y: 0 },

        // 眼睛結構資訊
        locationName: this.currentEyeStructure.name,
        locationNameEn: this.currentEyeStructure.nameEn,
        structureId: this.currentEyeStructure.structureId,
        structureType: this.currentEyeStructure.type,
        side: this.currentEyeStructure.side,

        // 檢測元數據
        detectionConfidence: this.currentEyeStructure.confidence || 1.0,
        fromLabel: this.currentEyeStructure.fromLabel || false,

        // 疾病和療程
        diseases: formData.diseases,
        treatmentNotes: formData.treatmentNotes,

        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      console.log('[saveDiseaseAnnotation] 眼睛系統記錄:', {
        結構: annotation.locationName,
        側眼: annotation.side,
        疾病數量: annotation.diseases.length,
        信心度: `${(annotation.detectionConfidence * 100).toFixed(1)}%`
      });
    } else {
      // 牙齒系統的標註對象（原有邏輯）
      annotation = {
        annotationId: generateUUID(),
        position: this.currentClickPosition,

        // 使用檢測到的牙齒資訊
        locationName: this.currentToothInfo ? this.currentToothInfo.name :
                      this.getLocationName(this.currentClickPosition),
        locationNameEn: this.currentToothInfo ? this.currentToothInfo.nameEn : '',

        // 編號系統
        fdiNumber: this.currentToothInfo ? this.currentToothInfo.fdi : null,
        universalNumber: this.currentToothInfo ? this.currentToothInfo.number : null,

        // 牙齒資訊
        toothType: this.currentToothInfo ? this.currentToothInfo.type : null,
        quadrant: this.currentToothInfo ? this.currentToothInfo.quadrant : null,

        // 檢測元數據
        detectionConfidence: this.currentToothInfo ? this.currentToothInfo.confidence : null,
        manualSelection: this.currentToothInfo ? (this.currentToothInfo.manualSelection || false) : false,

        // 疾病和療程
        diseases: formData.diseases,
        treatmentNotes: formData.treatmentNotes,

        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      console.log('[saveDiseaseAnnotation] 牙齒系統記錄:', {
        牙齒: annotation.locationName,
        FDI: annotation.fdiNumber,
        信心度: annotation.detectionConfidence ?
                `${(annotation.detectionConfidence * 100).toFixed(1)}%` : 'N/A',
        手動選擇: annotation.manualSelection ? '是' : '否',
        疾病數量: annotation.diseases.length
      });
    }

    try {
      // 保存到記錄管理器（內存）
      this.recordManager.addAnnotation(this.currentSystemId, annotation);
      console.log('[saveDiseaseAnnotation] 已保存到記錄管理器');

      // 保存到本地存儲（持久化）
      this.saveMedicalRecord(annotation);
      console.log('[saveDiseaseAnnotation] 已保存到本地存儲');

      // 添加視覺標註到圖像
      const system = this.anatomicalSystems.systems.find(
        s => s.id === this.currentSystemId
      );

      this.annotator.addAnnotation({
        ...annotation,
        color: system?.color || '#ff0000'
      });
      console.log('[saveDiseaseAnnotation] 已添加視覺標註到圖像');

      // 更新疾病可視化（僅限牙齒系統）
      if (this.diseaseVisualizer && this.currentSystemId === 'teeth') {
        const annotations = this.recordManager.getAnnotationsBySystem(this.currentSystemId);
        this.diseaseVisualizer.render(annotations);
        console.log('[saveDiseaseAnnotation] 已更新疾病可視化');
      }

      // 關閉模態並重新加載病例列表（使用分組功能）
      this.closeDiseaseModal();
      await this.loadAndDisplayRecords();
      console.log('[saveDiseaseAnnotation] 已關閉模態視窗並重新加載分組病例列表');

      // 顯示成功提示
      if (this.currentSystemId === 'eye') {
        showNotification('✓ 眼睛病例已成功保存', 'success');
      } else if (annotation.manualSelection) {
        showNotification('✓ 疾病記錄已保存（手動選擇）', 'success');
      } else if (annotation.detectionConfidence && annotation.detectionConfidence > 0.8) {
        showNotification('✓ 疾病記錄已保存（高信心度）', 'success');
      } else {
        showNotification('✓ 疾病記錄已保存', 'success');
      }

      console.log('[saveDiseaseAnnotation] 保存流程完成 ✓');
    } catch (error) {
      console.error('[saveDiseaseAnnotation] 保存失敗:', error);
      showNotification('保存失敗，請重試', 'error');
    }
  }

  /**
   * 保存身體系統操作記錄
   */
  async saveBodyOperation() {
    try {
      // 驗證表單
      const validation = this.bodyOperationForm.validateForm();

      if (!validation.valid) {
        // 顯示驗證錯誤
        const errors = validation.errors.join('\n');
        showNotification(errors, 'warning');
        console.warn('[saveBodyOperation] 表單驗證失敗:', validation.errors);
        return;
      }

      // 收集表單數據
      const operationData = this.bodyOperationForm.getFormData();

      // 構建完整的操作記錄對象，與其他系統的記錄格式相容
      const annotation = {
        annotationId: generateUUID(),
        position: this.currentClickPosition || { x: 0, y: 0 },

        // 身體部位資訊
        locationName: operationData.regionName,
        locationNameEn: operationData.regionNameEn,
        bodyRegionId: operationData.regionId,
        side: operationData.side,

        // 檢測元數據
        detectionConfidence: this.currentBodyRegion ? (this.currentBodyRegion.confidence || 1.0) : 1.0,

        // 操作資訊
        operationType: operationData.operationType,
        description: operationData.description,
        notes: operationData.notes,

        createdAt: operationData.timestamp,
        updatedAt: operationData.timestamp
      };

      console.log('[saveBodyOperation] 身體系統操作記錄:', {
        部位: annotation.locationName,
        側邊: annotation.side,
        操作: operationData.operationType,
        信心度: `${(annotation.detectionConfidence * 100).toFixed(1)}%`
      });

      // 保存到記錄管理器（內存）
      if (this.recordManager) {
        this.recordManager.addAnnotation('body', annotation);
        console.log('[saveBodyOperation] 已保存到記錄管理器');
      }

      // 保存到本地存儲（持久化）
      this.saveMedicalRecord(annotation);
      console.log('[saveBodyOperation] 已保存到本地存儲');

      // 添加視覺標註到圖像
      if (this.annotator) {
        const system = this.anatomicalSystems.systems.find(s => s.id === 'body');
        this.annotator.addAnnotation({
          ...annotation,
          color: system?.color || '#ff0000'
        });
        console.log('[saveBodyOperation] 已添加視覺標註到圖像');
      }

      // 關閉模態並重新加載病例列表
      this.closeDiseaseModal();
      await this.loadAndDisplayRecords();
      console.log('[saveBodyOperation] 已關閉模態視窗並重新加載分組病例列表');

      // 顯示成功提示
      showNotification('✓ 身體系統操作記錄已成功保存', 'success');

      console.log('[saveBodyOperation] 保存流程完成 ✓');
    } catch (error) {
      console.error('[saveBodyOperation] 保存失敗:', error);
      showNotification('保存失敗，請重試', 'error');
    }
  }

  /**
   * 更新病歷列表顯示（時間軸格式）
   * @param {string} systemId - 系統 ID
   */
  updateRecordList(systemId) {
    const annotations = this.recordManager.getAnnotationsBySystem(systemId);
    const container = $('#record-list-container');

    if (!container) return;

    if (annotations.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <p class="empty-state__text">尚無病歷記錄</p>
        </div>
      `;
      return;
    }

    // 按日期降序排列（最新的在上）
    const sortedAnnotations = [...annotations].sort((a, b) => {
      const dateA = new Date(a.createdAt || 0);
      const dateB = new Date(b.createdAt || 0);
      return dateB - dateA;
    });

    let html = '<div class="disease-timeline">';

    sortedAnnotations.forEach((anno, index) => {
      const diseaseList = (anno.diseases || [])
        .map(d => `<span class="disease-tag">${d.name} (${d.id})</span>`)
        .join('');

      const date = anno.createdAt ? new Date(anno.createdAt) : new Date();
      const dateStr = date.toLocaleDateString('zh-TW', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });

      // 顯示牙齒名稱和 FDI 編號
      const locationDisplay = anno.fdiNumber ?
        `${anno.locationName} <span class="fdi-badge">FDI: ${anno.fdiNumber}</span>` :
        anno.locationName || '未知位置';

      html += `
        <div class="timeline-item ${index === 0 ? 'timeline-item--latest' : ''}">
          <div class="timeline-marker"></div>
          <div class="timeline-content">
            <div class="timeline-header">
              <h4 class="timeline-location">${locationDisplay}</h4>
              <span class="timeline-date">${dateStr}</span>
            </div>
            <div class="timeline-diseases">
              ${diseaseList}
            </div>
            ${anno.treatmentNotes ? `
              <div class="timeline-notes">
                <strong>療程摘要：</strong>
                <p>${anno.treatmentNotes}</p>
              </div>
            ` : ''}
          </div>
        </div>
      `;
    });

    html += '</div>';
    container.innerHTML = html;
  }

  /**
   * 導出病歷
   * @param {string} format - 格式
   */
  exportRecord(format) {
    try {
      this.recordManager.downloadRecord(format);
      showNotification(`已導出 ${format.toUpperCase()} 格式`, 'success');
    } catch (error) {
      console.error('導出失敗:', error);
      showNotification('導出失敗', 'error');
    }
  }

  /**
   * 清空病歷
   */
  clearRecords() {
    if (confirm('確認清空所有病歷？')) {
      this.recordManager.clearAll();
      this.annotator.clearAnnotations();
      this.updateRecordList(this.currentSystemId);
      showNotification('已清空所有病歷', 'info');
    }
  }

  /**
   * 處理病歷標籤頁切換
   * @param {Event} e - 事件
   */
  handleRecordTabClick(e) {
    const tab = e.currentTarget;
    const tabName = tab.dataset.tab;

    // 更新標籤頁 UI
    $$('.record-tab').forEach(t => t.classList.remove('record-tab--active'));
    tab.classList.add('record-tab--active');

    // 更新面板 UI
    $$('.record-panel').forEach(p => p.classList.remove('record-panel--active'));
    const panelId = tab.getAttribute('aria-controls');
    const panel = $(`#${panelId}`);
    if (panel) {
      panel.classList.add('record-panel--active');
    }

    // 如果切換到統計標籤，更新統計數據
    if (tabName === 'statistics' && this.recordStatistics) {
      this.recordStatistics.updateDisplay();
    }
  }

  /**
   * 保存醫療記錄到本地存儲
   * @param {Object} record - 醫療記錄對象（標註對象）
   * @returns {boolean} 是否保存成功
   */
  saveMedicalRecord(record) {
    try {
      // 驗證記錄對象
      if (!record) {
        throw new Error('記錄對象為空');
      }

      // 讀取現有記錄
      const storageKey = 'medicalRecords';
      const existingRecords = JSON.parse(localStorage.getItem(storageKey)) || [];

      // 添加新記錄
      existingRecords.push(record);

      // 保存回本地存儲
      localStorage.setItem(storageKey, JSON.stringify(existingRecords));

      console.log(`[saveMedicalRecord] 已保存醫療記錄到 localStorage (總計: ${existingRecords.length} 筆)`);
      console.log('[saveMedicalRecord] 記錄詳情:', {
        ID: record.annotationId,
        位置: record.locationName,
        疾病: record.diseases.length,
        時間: record.createdAt
      });

      return true;
    } catch (error) {
      console.error('[saveMedicalRecord] 保存失敗:', error);
      throw error;
    }
  }

  /**
   * 從本地存儲加載醫療記錄
   * @returns {Array} 醫療記錄陣列
   */
  loadMedicalRecords() {
    try {
      const storageKey = 'medicalRecords';
      const records = JSON.parse(localStorage.getItem(storageKey)) || [];
      console.log(`[loadMedicalRecords] 已加載 ${records.length} 筆醫療記錄`);

      if (records.length > 0) {
        console.log('[loadMedicalRecords] 記錄摘要:');
        records.forEach((record, index) => {
          console.log(`  ${index + 1}. ${record.locationName} - ${record.diseases.length} 種疾病 (${record.createdAt})`);
        });
      }

      return records;
    } catch (error) {
      console.error('[loadMedicalRecords] 加載失敗:', error);
      return [];
    }
  }

  /**
   * 按系統 ID 過濾病例記錄
   * @param {Array} records - 所有病例記錄
   * @param {string} systemId - 系統 ID ('eye' 或 'teeth')
   * @returns {Array} 過濾後的病例記錄
   */
  filterRecordsBySystem(records, systemId) {
    if (!records || records.length === 0) {
      return [];
    }

    // 根據系統 ID 過濾記錄
    const filtered = records.filter(record => {
      if (systemId === 'eye') {
        // 眼睛系統：有 structureId 或 side，沒有 fdiNumber 和 bodyRegionId
        return (record.structureId || (record.side && !record.fdiNumber)) && !record.bodyRegionId;
      } else if (systemId === 'teeth') {
        // 牙齒系統：有 fdiNumber 或 universalNumber
        return record.fdiNumber || record.universalNumber;
      } else if (systemId === 'body') {
        // 身體系統：有 bodyRegionId 或 operationType
        return record.bodyRegionId || record.operationType;
      }
      return false;
    });

    console.log(`[filterRecordsBySystem] 從 ${records.length} 筆記錄中過濾出 ${filtered.length} 筆${systemId}系統的記錄`);
    return filtered;
  }

  /**
   * 按結構位置對病例進行分組
   * @param {Array} records - 所有病例記錄
   * @returns {Array} 分組後的病例組 (依降序排列)
   */
  groupRecordsByStructure(records) {
    const grouped = {};

    // 按 structureId 分組
    records.forEach(record => {
      // 區分身體、牙齒和眼睛系統
      let groupKey = '';
      let structureId = '';
      let structureName = '';
      let structureSide = '';

      if (record.bodyRegionId) {
        // 身體系統：按 bodyRegionId 和 side 分組
        groupKey = `${record.bodyRegionId}-${record.side}`;
        structureId = record.bodyRegionId;
        structureName = record.locationName;
        structureSide = record.side;
      } else if (record.fdiNumber) {
        // 牙齒系統：按 FDI 編號分組
        groupKey = record.fdiNumber || record.locationName;
        structureId = groupKey;
        structureName = record.locationName;
        structureSide = 'tooth';
      } else if (record.structureId) {
        // 眼睛系統：按 structureId 分組
        groupKey = record.structureId;
        structureId = record.structureId;
        structureName = record.locationName;
        structureSide = record.side;
      } else {
        // 其他系統：按 locationName 分組
        groupKey = record.locationName;
        structureId = groupKey;
        structureName = record.locationName;
        structureSide = 'other';
      }

      if (!grouped[groupKey]) {
        grouped[groupKey] = {
          structureId,
          structureName,
          structureSide,
          records: []
        };
      }

      grouped[groupKey].records.push(record);
    });

    // 每組內按時間排序（最新在前）
    Object.values(grouped).forEach(group => {
      group.records.sort((a, b) => {
        return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
      });
    });

    // 轉換為陣列並依據最新記錄排序
    const groupedArray = Object.values(grouped);
    groupedArray.sort((a, b) => {
      const latestA = new Date(a.records[0].createdAt || 0);
      const latestB = new Date(b.records[0].createdAt || 0);
      return latestB - latestA;
    });

    return groupedArray;
  }

  /**
   * 格式化 ISO 時間戳為可讀格式
   * @param {string} isoString - ISO 格式的時間戳 (如 "2026-01-15T10:30:45.000Z")
   * @returns {string} 格式化後的時間字符串 (如 "2026-01-15 10:30:45")
   */
  formatTimestamp(isoString) {
    try {
      const date = new Date(isoString);

      if (isNaN(date.getTime())) {
        return '無效的時間戳';
      }

      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      const seconds = String(date.getSeconds()).padStart(2, '0');

      return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    } catch (error) {
      console.error('[formatTimestamp] 格式化失敗:', error);
      return '時間戳格式化錯誤';
    }
  }

  /**
   * 修復舊格式的醫療記錄
   * @param {Array} records - 原始記錄陣列
   * @returns {Array} 修復後的記錄陣列
   */
  fixLegacyRecords(records) {
    return records.map(record => {
      // 修復疾病數據格式
      if (Array.isArray(record.diseases) && record.diseases.length > 0) {
        // 如果疾病是陣列，取第一項
        const firstDisease = record.diseases[0];
        if (typeof firstDisease === 'object' && !firstDisease.name) {
          // 如果疾病對象結構不完整，嘗試修復
          console.warn('[fixLegacyRecords] 發現不完整的疾病對象:', firstDisease);
        }
      }

      // 修復時間戳格式
      if (!record.timestamp && record.createdAt) {
        record.timestamp = record.createdAt;
      }

      // 確保眼睛系統記錄有 side 信息
      if (record.structureId && !record.side) {
        record.side = this.getStructureSide(record.structureId);
      }

      return record;
    });
  }

  /**
   * 渲染分組的病例列表
   * @param {Array} groupedRecords - 分組後的病例陣列
   */
  renderGroupedRecords(groupedRecords) {
    const container = document.getElementById('record-list-container');
    if (!container) {
      console.warn('[renderGroupedRecords] 找不到 record-list-container 容器');
      return;
    }

    // 清空現有內容
    container.innerHTML = '';

    if (!groupedRecords || groupedRecords.length === 0) {
      container.innerHTML = '<p class="empty-message">暫無病例記錄</p>';
      return;
    }

    // 為每個結構群組創建 HTML
    groupedRecords.forEach(group => {
      const groupDiv = document.createElement('div');
      groupDiv.className = 'record-group';

      // 群組標題
      const headerDiv = document.createElement('h4');
      headerDiv.className = 'record-group__header';

      let sideText = '';
      if (group.structureSide === 'left') {
        sideText = '左眼';
      } else if (group.structureSide === 'right') {
        sideText = '右眼';
      } else if (group.structureSide === 'bilateral') {
        sideText = '雙眼';
      } else if (group.structureSide === 'tooth') {
        sideText = '';
      } else if (group.structureSide === 'mid') {
        sideText = '中線';
      } else if (group.structureSide === 'left') {
        sideText = '左側';
      } else if (group.structureSide === 'right') {
        sideText = '右側';
      } else {
        sideText = '';
      }

      const sideBadge = sideText ? `<span class="structure-location">${sideText}</span>` : '';

      headerDiv.innerHTML = `
        <span class="structure-name">${group.structureName}</span>
        ${sideBadge}
      `;
      groupDiv.appendChild(headerDiv);

      // 記錄項目容器
      const itemsDiv = document.createElement('div');
      itemsDiv.className = 'record-group__items';

      // 為每筆記錄創建項目
      group.records.forEach((record) => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'record-item';

        const timestamp = this.formatTimestamp(record.createdAt || record.timestamp);

        // 構建 HTML
        let html = `<div class="record-item__title">${record.locationName}`;

        // 為眼睛和身體系統添加側邊信息
        if (record.side && record.side !== 'tooth') {
          let sideLabel = '';
          if (['left', 'right', 'bilateral'].includes(record.side)) {
            // 眼睛系統
            sideLabel = record.side === 'left' ? '左眼' :
                       record.side === 'right' ? '右眼' :
                       record.side === 'bilateral' ? '雙眼' : '';
          } else if (['mid', 'left', 'right'].includes(record.side)) {
            // 身體系統
            sideLabel = record.side === 'mid' ? '中線' :
                       record.side === 'left' ? '左側' :
                       record.side === 'right' ? '右側' : '';
          }
          if (sideLabel) {
            html += ` <span class="record-item__side">(${sideLabel})</span>`;
          }
        }
        html += `</div>`;
        html += `<div class="record-item__timestamp">⏰ ${timestamp}</div>`;

        // 處理疾病信息或操作類型
        if (record.operationType) {
          // 身體系統操作記錄
          const operationTypes = {
            'surgery': '手術',
            'therapy': '治療',
            'procedure': '程序',
            'examination': '檢查',
            'medication': '用藥',
            'other': '其他'
          };
          const operationName = operationTypes[record.operationType] || record.operationType;
          html += `<div class="record-item__disease">🏥 ${operationName}</div>`;
          if (record.description) {
            html += `<div class="record-item__description">📋 ${record.description}</div>`;
          }
        } else if (record.diseases && Array.isArray(record.diseases)) {
          // 牙齒和眼睛系統疾病記錄
          if (record.diseases.length > 0) {
            const disease = record.diseases[0];  // 只取第一個疾病
            let diseaseText = '';
            if (typeof disease === 'object' && disease.name) {
              diseaseText = disease.name;
              if (disease.id) {
                diseaseText += ` (${disease.id})`;
              }
            } else if (typeof disease === 'string') {
              diseaseText = disease;
            }
            if (diseaseText) {
              html += `<div class="record-item__disease">🏥 ${diseaseText}</div>`;
            }
          }
        }

        // 顯示備註（疾病系統使用 treatmentNotes，操作系統使用 notes）
        const notes = record.treatmentNotes || record.notes || '';
        if (notes) {
          html += `<div class="record-item__notes">📝 ${notes}</div>`;
        }

        itemDiv.innerHTML = html;
        itemsDiv.appendChild(itemDiv);
      });

      groupDiv.appendChild(itemsDiv);
      container.appendChild(groupDiv);
    });

    console.log(`[renderGroupedRecords] 已渲染 ${groupedRecords.length} 個結構群組的病例`);
  }

  /**
   * 加載並顯示分組的病例記錄
   */
  async loadAndDisplayRecords() {
    try {
      // 加載所有記錄
      let allRecords = this.loadMedicalRecords();

      if (!allRecords || allRecords.length === 0) {
        const container = document.getElementById('record-list-container');
        if (container) {
          container.innerHTML = '<p class="empty-message">暫無病例記錄</p>';
        }
        console.log('[loadAndDisplayRecords] 沒有病例記錄');
        return;
      }

      // 修復舊格式的記錄
      allRecords = this.fixLegacyRecords(allRecords);

      // 重新保存修復後的記錄
      localStorage.setItem('medicalRecords', JSON.stringify(allRecords));
      console.log('[loadAndDisplayRecords] 已修復舊格式記錄並重新保存');

      // 按當前系統過濾記錄（只顯示該系統的記錄）
      let records = this.filterRecordsBySystem(allRecords, this.currentSystemId);

      if (!records || records.length === 0) {
        const container = document.getElementById('record-list-container');
        if (container) {
          let systemName = '';
          if (this.currentSystemId === 'eye') {
            systemName = '眼睛';
          } else if (this.currentSystemId === 'body') {
            systemName = '身體';
          } else if (this.currentSystemId === 'teeth' || this.currentSystemId === 'primary_teeth') {
            systemName = '牙齒';
          } else {
            systemName = '目前';
          }
          container.innerHTML = `<p class="empty-message">暫無${systemName}系統的病例記錄</p>`;
        }
        console.log(`[loadAndDisplayRecords] 沒有${this.currentSystemId}系統的病例記錄`);
        return;
      }

      // 分組
      const groupedRecords = this.groupRecordsByStructure(records);

      // 渲染
      this.renderGroupedRecords(groupedRecords);

      console.log(`[loadAndDisplayRecords] 已加載 ${records.length} 筆${this.currentSystemId}系統的病例，分為 ${groupedRecords.length} 個結構群組`);
    } catch (error) {
      console.error('[loadAndDisplayRecords] 加載失敗:', error);
      const container = document.getElementById('record-list-container');
      if (container) {
        container.innerHTML = '<p class="empty-message">病例加載失敗</p>';
      }
    }
  }
  // ===================================================
  // 身體系統 (Body System) 實現
  // ===================================================

  /**
   * 打開疾病記錄模態，顯示身體部位信息
   */
  openDiseaseModalWithBodyRegion(regionInfo) {
    try {
      // 構建結構信息對象
      const structureInfo = {
        type: 'body',
        bodyPart: regionInfo.bodyPart,
        side: regionInfo.side,
        nameZh: this.getChineseBodyRegionName(regionInfo.bodyPart, regionInfo.side),
        nameEn: this.getEnglishBodyRegionName(regionInfo.bodyPart, regionInfo.side)
      };

      // 顯示身體結構信息
      this.displayBodyStructureInfo(structureInfo);

      // 動態加載該部位的常見疾病
      this.loadBodyRegionDiseases(regionInfo.bodyPart);

      // 存儲當前選擇
      this.currentBodyRegion = regionInfo;

      // 打開模態視窗
      this.diseaseModal.style.display = 'block';
      this.modalOverlay.classList.add('visible');
      this.diseaseModal.setAttribute('aria-hidden', 'false');

      console.log('[openDiseaseModalWithBodyRegion] 已打開疾病模態，選擇:', regionInfo);
    } catch (error) {
      console.error('[openDiseaseModalWithBodyRegion] 打開失敗:', error);
    }
  }

  /**
   * 顯示身體結構信息（在疾病模態中）
   */
  displayBodyStructureInfo(regionInfo) {
    const infoContainer = document.getElementById('disease-structure-info');
    if (!infoContainer) return;

    infoContainer.innerHTML = `
      <div class="body-structure-info">
        <div class="info-title">身體位置</div>
        <div class="info-item">
          <strong>部位：</strong> ${regionInfo.nameZh}
        </div>
        <div class="info-item">
          <strong>English：</strong> ${regionInfo.nameEn}
        </div>
        <div class="info-item">
          <strong>側邊：</strong> ${regionInfo.side === 'mid' ? '中線' : (regionInfo.side === 'left' ? '左側' : '右側')}
        </div>
      </div>
    `;
  }

  /**
   * 動態加載身體部位常見疾病
   */
  async loadBodyRegionDiseases(bodyPart) {
    try {
      // 加載 body-systems.json
      if (!this.bodySystemsData) {
        const response = await fetch('/data/body-systems.json');
        this.bodySystemsData = await response.json();
      }

      // 查找身體部位
      const region = this.bodySystemsData.bodyRegions.find(r => r.id === bodyPart);
      if (!region) {
        console.warn('[loadBodyRegionDiseases] 找不到部位:', bodyPart);
        return;
      }

      // 獲取容器
      const skinContainer = document.getElementById('skinDiseases');
      const subContainer = document.getElementById('subDiseases');

      // 清空舊內容
      if (skinContainer) skinContainer.innerHTML = '';
      if (subContainer) subContainer.innerHTML = '';

      // 填入表皮疾病
      if (region.commonDiseases.skin && skinContainer) {
        region.commonDiseases.skin.forEach(disease => {
          skinContainer.innerHTML += `
            <label>
              <input type="checkbox" value="${disease}"> ${disease}
            </label><br>
          `;
        });
      }

      // 填入皮下疾病
      if (region.commonDiseases.subcutaneous && subContainer) {
        region.commonDiseases.subcutaneous.forEach(disease => {
          subContainer.innerHTML += `
            <label>
              <input type="checkbox" value="${disease}"> ${disease}
            </label><br>
          `;
        });
      }

      console.log('[loadBodyRegionDiseases] 已加載', bodyPart, '的疾病列表');
    } catch (error) {
      console.error('[loadBodyRegionDiseases] 加載失敗:', error);
    }
  }

  /**
   * 取得中文身體部位名稱
   */
  getChineseBodyRegionName(bodyPart, side) {
    const nameMap = {
      'head-mid': '頭部',
      'neck-mid': '頸部',
      'chest-mid': '胸部',
      'abdomen-mid': '腹部',
      'arm-left': '左臂',
      'arm-right': '右臂',
      'leg-left': '左腿',
      'leg-right': '右腿'
    };
    return nameMap[`${bodyPart}-${side}`] || bodyPart;
  }

  /**
   * 取得英文身體部位名稱
   */
  getEnglishBodyRegionName(bodyPart, side) {
    const nameMap = {
      'head-mid': 'Head',
      'neck-mid': 'Neck',
      'chest-mid': 'Chest',
      'abdomen-mid': 'Abdomen',
      'arm-left': 'Left Arm',
      'arm-right': 'Right Arm',
      'leg-left': 'Left Leg',
      'leg-right': 'Right Leg'
    };
    return nameMap[`${bodyPart}-${side}`] || bodyPart;
  }

  /**
   * 保存身體系統疾病記錄
   */
  saveDiseaseAnnotation(annotation) {
    if (this.currentSystemId !== 'body') {
      console.warn('[saveDiseaseAnnotation] 非身體系統，操作被略過');
      return;
    }

    try {
      // 蒐集選中的疾病並轉換為 ICD-10
      const selectedDiseases = [
        ...document.querySelectorAll('#diseaseArea input:checked')
      ].map(input => ({
        name: input.value,
        icd10: this.bodyDiseaseICD[input.value] || 'UNKNOWN'
      }));

      // 構建完整的身體標註對象
      const fullAnnotation = {
        annotationId: this.generateUUID(),

        // 身體系統專用欄位
        bodyPart: this.currentBodyRegion.bodyPart,
        side: this.currentBodyRegion.side,
        nameZh: this.getChineseBodyRegionName(this.currentBodyRegion.bodyPart, this.currentBodyRegion.side),
        nameEn: this.getEnglishBodyRegionName(this.currentBodyRegion.bodyPart, this.currentBodyRegion.side),

        // 疾病信息
        diseases: selectedDiseases,
        treatmentNotes: document.getElementById('treatment-notes-input')?.value || '',

        // 系統標識
        system: 'body',

        // 時間戳
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // 保存到記錄管理器
      this.recordManager.addAnnotation(fullAnnotation);

      // 保存到 localStorage
      this.saveMedicalRecord(fullAnnotation);

      // 更新 UI
      this.loadAndDisplayRecords();

      // 顯示成功提示
      alert('✅ 身體系統病例已保存');

      console.log('[saveDiseaseAnnotation] 身體系統記錄已保存:', fullAnnotation);
    } catch (error) {
      console.error('[saveDiseaseAnnotation] 保存失敗:', error);
      alert('❌ 保存失敗，請重試');
    }
  }

  /**
   * 保存醫療記錄到 localStorage
   */
  saveMedicalRecord(record) {
    try {
      const records = this.loadMedicalRecords();
      records.push(record);
      localStorage.setItem('medicalRecords', JSON.stringify(records));
      console.log('[saveMedicalRecord] 已保存到 localStorage');
      return true;
    } catch (error) {
      console.error('[saveMedicalRecord] 保存失敗:', error);
      return false;
    }
  }

  /**
   * 從 localStorage 加載醫療記錄
   */
  loadMedicalRecords() {
    try {
      const data = localStorage.getItem('medicalRecords');
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('[loadMedicalRecords] 加載失敗:', error);
      return [];
    }
  }

  /**
   * 加載並顯示身體系統的病例
   */
  loadAndDisplayRecords() {
    if (this.currentSystemId !== 'body') return;

    try {
      const allRecords = this.loadMedicalRecords();
      const bodyRecords = this.filterRecordsBySystem(allRecords, 'body');

      // 按身體部位分組
      const groupedRecords = this.groupRecordsByBodyPart(bodyRecords);

      this.displayBodyRecords(groupedRecords);
      console.log('[loadAndDisplayRecords] 身體系統病例已加載');
    } catch (error) {
      console.error('[loadAndDisplayRecords] 加載失敗:', error);
    }
  }

  /**
   * 按身體部位分組病例
   */
  groupRecordsByBodyPart(records) {
    const grouped = {};

    records.forEach(record => {
      const key = `${record.bodyPart}-${record.side}`;
      if (!grouped[key]) {
        grouped[key] = {
          location: record.nameZh,
          records: []
        };
      }
      grouped[key].records.push(record);
    });

    // 按時間倒序排列
    Object.keys(grouped).forEach(key => {
      grouped[key].records.sort((a, b) =>
        new Date(b.createdAt) - new Date(a.createdAt)
      );
    });

    return grouped;
  }

  /**
   * 顯示身體系統病例列表
   */
  displayBodyRecords(groupedRecords) {
    const container = document.getElementById('record-list-container');
    if (!container) return;

    let html = '';

    Object.keys(groupedRecords).forEach(key => {
      const group = groupedRecords[key];
      html += `
        <div class="record-group">
          <h4 class="record-group-title">${group.location}</h4>
          <div class="record-group-content">
      `;

      group.records.forEach(record => {
        const diseaseList = record.diseases
          .map(d => `${d.name} <span class="icd-code">[${d.icd10}]</span>`)
          .join('、');

        html += `
          <div class="record-item">
            <div class="record-time">
              ${new Date(record.createdAt).toLocaleString('zh-Hant-TW')}
            </div>
            <div class="record-details">
              <strong>疾病：</strong> ${diseaseList || '無'}<br>
              <strong>備註：</strong> ${record.treatmentNotes || '—'}
            </div>
          </div>
        `;
      });

      html += `
          </div>
        </div>
      `;
    });

    container.innerHTML = html || '<p class="no-records">暫無身體系統病例記錄</p>';
  }

  /**
   * 根據系統類型過濾記錄（修正污染問題）
   */
  filterRecordsBySystem(records, systemType) {
    switch(systemType) {
      case 'body':
        // ✅ 只過濾明確標記為身體系統的記錄
        return records.filter(r => r.system === 'body' && r.bodyPart && r.side);
      case 'eye':
        // ✅ 只過濾明確標記為眼睛系統的記錄（或有 structureId）
        return records.filter(r => r.system === 'eye' || (r.structureId && !r.fdiNumber && !r.bodyPart));
      case 'tooth':
        // ✅ 只過濾明確標記為牙齒系統的記錄（或有 fdiNumber）
        return records.filter(r => r.system === 'tooth' || (r.fdiNumber && !r.bodyPart && !r.structureId));
      default:
        return [];
    }
  }

}

// ICD-10 疾病代碼對照表（身體系統）
const bodyDiseaseICD = {
  '脂漏性皮膚炎': 'L21.9',
  '頭皮癬': 'B35.0',
  '毛囊炎': 'L73.9',
  '痤瘡': 'L70.9',
  '皮下囊腫': 'L72.9',
  '血腫': 'T14.8',
  '皮脂腺囊腫': 'L72.1',
  '頸部皮炎': 'L23.9',
  '扁平疣': 'B07.8',
  '淋巴結腫大': 'R59.1',
  '甲狀腺結節': 'E04.1',
  '頸部膿腫': 'L02.1',
  '濕疹': 'L30.9',
  '帶狀疱疹': 'B02.9',
  '接觸性皮膚炎': 'L25.9',
  '乳頭濕疹': 'L30.1',
  '脂肪瘤': 'D17.9',
  '乳腺結節': 'N63',
  '乳腺炎': 'N61',
  '乳房膿腫': 'N61.1',
  '蕁麻疹': 'L50.9',
  '皮膚感染': 'L08.9',
  '腹部皮炎': 'L23.9',
  '色素沉著': 'L81.9',
  '疝氣': 'K40.9',
  '皮下膿瘍': 'L02.2',
  '腹部腫塊': 'R19.0',
  '蚊蟲叮咬': 'L30.2',
  '蜂窩性組織炎': 'L03.9',
  '皮膚真菌感染': 'B35.9',
  '肌肉挫傷': 'S46.9',
  '皮下血腫': 'T14.8',
  '肌腱炎': 'M76.9',
  '滑囊炎': 'M71.9',
  '靜脈炎皮膚變化': 'I87.2',
  '黴菌感染': 'B35.9',
  '運動員腳': 'B35.3',
  '深層靜脈栓塞': 'I82.4',
  '肌肉拉傷': 'S76.9',
  '膝蓋關節炎': 'M17.9',
  '踝關節扭傷': 'S93.4'
};

// 將 ICD 對照表添加到 MedicalRecordApp 的原型
MedicalRecordApp.prototype.bodyDiseaseICD = bodyDiseaseICD;

// 應用啟動
document.addEventListener('DOMContentLoaded', () => {
  window.app = new MedicalRecordApp();
});
