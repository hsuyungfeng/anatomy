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

    this.currentSystemId = 'teeth';
    this.currentTeethType = 'permanent'; // 牙齒類型：permanent (永久齒) 或 primary (乳齒)
    this.currentImageId = null;
    this.anatomicalSystems = null;

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

      console.log('應用初始化完成');
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

    // 病歷管理器
    this.recordManager = new RecordManager();

    // 疾病可視化管理器
    if (typeof DiseaseVisualizationManager !== 'undefined') {
      this.diseaseVisualizer = new DiseaseVisualizationManager($('#image-canvas'));
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
    const clearBtn = $('#clear-records-btn');

    if (exportTextBtn) {
      exportTextBtn.addEventListener('click', () => this.exportRecord('text'));
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

    // 模態視窗
    this.setupDiseaseModal();
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
      saveBtn.addEventListener('click', () => this.saveDiseaseAnnotation());
    }

    // 監聽按 Escape 關閉模態
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modal && modal.getAttribute('aria-hidden') === 'false') {
        this.closeDiseaseModal();
      }
    });
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
      const imagePath = `assets/images/${systemId}/${imageId}.png`;

      // 加載圖像
      await this.annotator.loadImage(imagePath);

      // 更新標題
      const modal = $('#disease-modal');
      if (modal) {
        modal.setAttribute('data-system', systemId);
      }

      // 重置縮放
      this.annotator.resetZoom();

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

    // 更新疾病可視化
    if (this.diseaseVisualizer) {
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

    // 顯示模態視窗
    this.openDiseaseModal(position);
  }

  /**
   * 根據點擊位置推斷牙齒位置
   * @param {object} position - 點擊位置 {x, y}
   * @param {object} system - 系統信息
   * @returns {string} 牙齒名稱
   */
  detectToothPosition(position, system) {
    if (!system || !system.locations) return null;

    // 獲取圖像容器以確定相對位置
    const canvas = document.getElementById('image-canvas');
    if (!canvas) return null;

    // 計算相對位置比例
    const imageWidth = canvas.width || canvas.offsetWidth;
    const imageHeight = canvas.height || canvas.offsetHeight;

    const relativeX = position.x / imageWidth;
    const relativeY = position.y / imageHeight;

    // 基於相對位置推斷牙齒位置
    let position_type = '';

    // 上下判斷
    if (relativeY < 0.5) {
      position_type = 'upper';
    } else {
      position_type = 'lower';
    }

    // 左右判斷
    if (relativeX < 0.5) {
      position_type += '-left';
    } else {
      position_type += '-right';
    }

    // 找到對應的牙齒（簡單的區域映射）
    const matchingTeeth = system.locations.filter(loc =>
      loc.position && loc.position === position_type
    );

    if (matchingTeeth.length > 0) {
      // 返回該區域的第一顆牙齒作為示例
      const tooth = matchingTeeth[Math.floor(Math.random() * matchingTeeth.length)];
      return tooth.name;
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

    // 設置位置資訊
    const locationDiv = $('#modal-location');
    if (locationDiv) {
      const system = this.anatomicalSystems.systems.find(
        s => s.id === this.currentSystemId
      );

      let locationText = `位置: (${Math.round(position.x)}, ${Math.round(position.y)})`;

      if (this.currentSystemId === 'teeth' && system) {
        // 根據點擊位置推斷牙齒（基於圖像區域）
        const toothName = this.detectToothPosition(position, system);
        locationText = `位置: ${toothName || '牙齒區域'}`;
      }

      locationDiv.innerHTML = `<p>${locationText}</p>`;
    }

    // 初始化或更新疾病表單
    const formContainer = $('#disease-form-container');
    if (formContainer && !this.diseaseForm) {
      // 載入疾病資料並初始化表單
      this.diseaseForm = new DiseaseForm({
        container: formContainer,
        diseaseData: this.anatomicalSystems
      });
      // 等待表單渲染完成
      await this.diseaseForm.render();
    } else if (this.diseaseForm) {
      // 重新渲染表單（刷新數據）
      await this.diseaseForm.render();
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
   * 關閉疾病記錄模態視窗
   */
  closeDiseaseModal() {
    const modal = $('#disease-modal');
    const overlay = $('#modal-overlay');

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
  saveDiseaseAnnotation() {
    // 收集表單資料
    if (!this.diseaseForm) {
      showNotification('表單未初始化', 'error');
      return;
    }

    const formData = this.diseaseForm.getFormData();

    // 驗證是否選擇了疾病
    if (!formData.diseases || formData.diseases.length === 0) {
      showNotification('請選擇至少一種疾病', 'warning');
      return;
    }

    // 構建標註對象
    const annotation = {
      annotationId: generateUUID(),
      position: this.currentClickPosition,
      locationName: this.getLocationName(this.currentClickPosition),
      diseases: formData.diseases,
      treatmentNotes: formData.treatmentNotes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // 保存到記錄管理器
    this.recordManager.addAnnotation(this.currentSystemId, annotation);

    // 添加視覺標註到圖像
    const system = this.anatomicalSystems.systems.find(
      s => s.id === this.currentSystemId
    );

    this.annotator.addAnnotation({
      ...annotation,
      color: system?.color || '#ff0000'
    });

    // 更新疾病可視化
    if (this.diseaseVisualizer) {
      const annotations = this.recordManager.getAnnotationsBySystem(this.currentSystemId);
      this.diseaseVisualizer.render(annotations);
    }

    // 關閉模態並更新列表
    this.closeDiseaseModal();
    this.updateRecordList(this.currentSystemId);
    showNotification('疾病記錄已保存', 'success');
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

      html += `
        <div class="timeline-item ${index === 0 ? 'timeline-item--latest' : ''}">
          <div class="timeline-marker"></div>
          <div class="timeline-content">
            <div class="timeline-header">
              <h4 class="timeline-location">${anno.locationName || '未知位置'}</h4>
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
  }
}

// 應用啟動
document.addEventListener('DOMContentLoaded', () => {
  window.app = new MedicalRecordApp();
});
