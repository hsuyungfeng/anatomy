/* ================================================
   疾病表單模組
   ================================================ */

class DiseaseForm {
  /**
   * 初始化疾病表單
   * @param {object} options - 配置選項
   */
  constructor(options = {}) {
    this.container = options.container || $('#disease-form-container');
    this.diseaseData = options.diseaseData || null;
    this.selectedDiseases = [];
    this.treatmentNotes = '';
    this.currentLanguage = getCurrentLanguage();
    this.systemId = options.systemId || 'teeth'; // 預設系統 ID
    this.diseases = []; // 存儲當前系統的疾病列表

    // 初始化時先加載疾病，然後渲染（非同步，不阻塞）
    if (this.container) {
      this.loadDiseases(this.systemId).then(() => {
        return this.render();
      }).catch(error => {
        console.error('Error initializing disease form:', error);
      });
    }

    // 監聽語言變更事件
    document.addEventListener('language:changed', (e) => {
      this.currentLanguage = e.detail.language;
      this.updateLanguageDisplay();
    });
  }

  /**
   * 加載特定系統的疾病數據
   * @param {string} systemId - 解剖系統 ID
   */
  async loadDiseases(systemId = 'teeth') {
    this.systemId = systemId;

    try {
      const response = await fetch('/data/disease-categories.json');
      const data = await response.json();

      // 查找系統分類
      let systemCategory = null;
      if (data.anatomicalSystems && Array.isArray(data.anatomicalSystems)) {
        systemCategory = data.anatomicalSystems.find(sys => sys.systemId === systemId);
      } else if (Array.isArray(data)) {
        systemCategory = data.find(sys => sys.systemId === systemId);
      }

      if (!systemCategory) {
        console.warn(`未找到系統的疾病: ${systemId}`);
        this.diseases = [];
        return;
      }

      this.diseases = systemCategory.diseases || [];
      console.log(`已加載 ${this.diseases.length} 個疾病，系統: ${systemId}`);
    } catch (error) {
      console.error('加載疾病數據失敗:', error);
      this.diseases = [];
    }
  }

  /**
   * 渲染表單
   */
  async render() {
    if (!this.container) return;

    // 如果疾病列表為空，先加載該系統的疾病
    if (!this.diseases || this.diseases.length === 0) {
      await this.loadDiseases(this.systemId);
    }

    let html = '<div class="disease-form">';

    // 表單標題和提示
    html += `
      <div class="disease-form__header">
        <h3 class="disease-form__title" data-en="Select Diagnosis">
          選擇疾病診斷
        </h3>
        <p class="disease-form__hint" data-en="Multiple selections allowed">
          可複選多個疾病
        </p>
      </div>
    `;

    // 疾病分類
    html += '<div class="disease-form__categories">';

    if (this.diseases && this.diseases.length > 0) {
      html += this.renderDiseaseList();
    } else {
      html += '<p class="error-message">無法加載疾病列表</p>';
    }

    html += '</div>';

    // 療程摘要（其他備註）
    html += `
      <div class="disease-form__notes">
        <label for="treatment-notes">療程摘要</label>
        <textarea
          id="treatment-notes"
          class="treatment-notes-input"
          placeholder="輸入療程摘要或其他備註..."
          rows="4"></textarea>
      </div>
    `;

    html += '</div>';

    this.container.innerHTML = html;
    this.setupEventListeners();
  }

  /**
   * 渲染疾病列表
   * @returns {string} HTML
   */
  renderDiseaseList() {
    let html = '<div class="disease-list">';

    if (!this.diseases || !Array.isArray(this.diseases)) {
      return html + '</div>';
    }

    this.diseases.forEach((disease) => {
      html += `
        <div class="disease-item">
          <input
            type="checkbox"
            id="disease-${escapeHtml(disease.id)}"
            class="disease-checkbox"
            value="${escapeHtml(disease.id)}"
            data-name="${escapeHtml(disease.name)}"
            data-name-en="${escapeHtml(disease.nameEn)}"
            data-icd10="${escapeHtml(disease.icd10 || disease.id)}">
          <label for="disease-${escapeHtml(disease.id)}">
            ${escapeHtml(disease.name)}
          </label>
        </div>
      `;
    });

    html += '</div>';
    return html;
  }

  /**
   * 渲染分類
   * @param {object} category - 分類資料
   * @returns {string} HTML
   */
  renderCategory(category) {
    let html = '<div class="disease-list">';

    let diseases = null;

    if (category && category.diseases && Array.isArray(category.diseases)) {
      diseases = category.diseases;
    } else if (category && category.orderingSystem && category.orderingSystem.diseases) {
      diseases = category.orderingSystem.diseases;
    } else if (category && category.locations && Array.isArray(category.locations)) {
      // 疾病可能在 locations 中
      category.locations.forEach((loc) => {
        if (loc && loc.diseases && !diseases) {
          diseases = loc.diseases;
        }
      });
    }

    if (diseases && Array.isArray(diseases)) {
      diseases.forEach((disease) => {
        html += `
          <div class="disease-item">
            <input
              type="checkbox"
              id="disease-${escapeHtml(disease.id)}"
              class="disease-checkbox"
              value="${escapeHtml(disease.id)}"
              data-name="${escapeHtml(disease.name)}"
              data-name-en="${escapeHtml(disease.nameEn)}"
              data-icd10="${escapeHtml(disease.icd10 || disease.id)}">
            <label for="disease-${escapeHtml(disease.id)}">
              ${escapeHtml(disease.name)}
            </label>
          </div>
        `;
      });
    }

    html += '</div>';
    return html;
  }

  /**
   * 設置事件監聽
   */
  setupEventListeners() {
    // 複選框
    $$('.disease-checkbox').forEach(checkbox => {
      checkbox.addEventListener('change', (e) => this.handleCheckboxChange(e));
    });

    // 治療摘要文本框
    const notesInput = $('#treatment-notes');
    if (notesInput) {
      notesInput.addEventListener('change', (e) => {
        this.treatmentNotes = e.target.value;
      });
      notesInput.addEventListener('input', (e) => {
        this.treatmentNotes = e.target.value;
      });
    }
  }

  /**
   * 處理複選框變化
   * @param {Event} e - 事件
   */
  handleCheckboxChange(e) {
    const checkbox = e.target;
    const diseaseId = checkbox.value;
    const diseaseName = checkbox.dataset.name;
    const diseaseNameEn = checkbox.dataset.nameEn;

    if (checkbox.checked) {
      if (!this.selectedDiseases.find(d => d.id === diseaseId)) {
        this.selectedDiseases.push({
          id: diseaseId,
          name: diseaseName,
          nameEn: diseaseNameEn
        });
      }
    } else {
      this.selectedDiseases = this.selectedDiseases.filter(d => d.id !== diseaseId);
    }
  }

  /**
   * 獲取表單資料
   * @returns {object} 表單資料
   */
  getFormData() {
    return {
      diseases: this.selectedDiseases,
      treatmentNotes: this.treatmentNotes
    };
  }

  /**
   * 重置表單
   */
  reset() {
    this.selectedDiseases = [];
    this.treatmentNotes = '';

    $$('.disease-checkbox').forEach(checkbox => checkbox.checked = false);
    const notesInput = $('#treatment-notes');
    if (notesInput) notesInput.value = '';
  }

  /**
   * 設置表單資料
   * @param {object} data - 表單資料
   */
  setFormData(data) {
    this.reset();

    if (data.diseases) {
      data.diseases.forEach(disease => {
        const checkbox = $(`#disease-${disease.id}`);
        if (checkbox) {
          checkbox.checked = true;
          this.handleCheckboxChange({ target: checkbox });
        }
      });
    }

    if (data.treatmentNotes) {
      this.treatmentNotes = data.treatmentNotes;
      const notesInput = $('#treatment-notes');
      if (notesInput) notesInput.value = data.treatmentNotes;
    }
  }

  /**
   * 更新表單語言顯示
   */
  updateLanguageDisplay() {
    // 更新表單標題
    const formTitle = $('.disease-form__title');
    if (formTitle) {
      formTitle.textContent = this.currentLanguage === 'en'
        ? 'Select Diagnosis'
        : '選擇疾病診斷';
    }

    // 更新提示文字
    const formHint = $('.disease-form__hint');
    if (formHint) {
      formHint.textContent = this.currentLanguage === 'en'
        ? 'Multiple selections allowed'
        : '可複選多個疾病';
    }

    // 更新療程摘要標籤
    const notesLabel = $$('label').find(el =>
      el.textContent.includes('療程摘要') || el.textContent.includes('Treatment Summary')
    );
    if (notesLabel) {
      notesLabel.textContent = this.currentLanguage === 'en' ? 'Treatment Summary' : '療程摘要';
    }

    // 更新文本框佔位符
    const notesInput = $('#treatment-notes');
    if (notesInput) {
      notesInput.placeholder = this.currentLanguage === 'en'
        ? 'Enter treatment summary or other notes...'
        : '輸入療程摘要或其他備註...';
    }
  }
}
