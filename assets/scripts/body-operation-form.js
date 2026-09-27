/**
 * 身體系統操作/治療記錄表單
 * 用於記錄在特定身體部位進行的醫療操作、治療或程序
 */
class BodyOperationForm {
  constructor() {
    this.currentRegion = null;
    this.operationTypes = [
      { id: 'surgery', name: '手術', name_en: 'Surgery' },
      { id: 'therapy', name: '治療', name_en: 'Therapy' },
      { id: 'procedure', name: '程序', name_en: 'Procedure' },
      { id: 'examination', name: '檢查', name_en: 'Examination' },
      { id: 'medication', name: '用藥', name_en: 'Medication' },
      { id: 'other', name: '其他', name_en: 'Other' }
    ];
    this.currentLanguage = (typeof window !== 'undefined' && window.I18N && window.I18N.lang()) || (document.documentElement.lang === 'en' ? 'en' : 'zh');
  }

  /**
   * 初始化表單
   */
  init() {
    console.log('[BodyOperationForm] 初始化操作表單');
    this.currentLanguage = (typeof window !== 'undefined' && window.I18N && window.I18N.lang()) || (document.documentElement.lang === 'en' ? 'en' : 'zh');
  }

  /**
   * 為指定的身體部位生成操作表單 HTML
   * @param {Object} region - 身體部位信息 {id, name, name_en, side}
   * @returns {string} - 表單 HTML
   */
  generateFormHTML(region) {
    this.currentLanguage = (typeof window !== 'undefined' && window.I18N && window.I18N.lang()) || (document.documentElement.lang === 'en' ? 'en' : 'zh');
    this.currentRegion = region;
    const sideDisplay = this.getSideDisplay(region.side);
    const regionName = (this.currentLanguage === 'en' && region.name_en) ? region.name_en : region.name;

    return `
      <div class="body-operation-form">
        <!-- 部位信息和側邊選擇 -->
        <div class="operation-form__header">
          <h3 class="operation-form__title">
            ${escapeHtml(regionName)}
            <span class="operation-form__side">${sideDisplay}</span>
          </h3>

          <div class="operation-form__side-selector">
            <label class="operation-form__side-label">
              ${this.currentLanguage === 'zh' ? '側邊：' : 'Side:'}
            </label>
            <div class="side-buttons">
              <button class="side-btn ${region.side === 'left' ? 'active' : ''}" data-side="left">
                ${this.currentLanguage === 'zh' ? '左' : 'Left'}
              </button>
              <button class="side-btn ${region.side === 'mid' ? 'active' : ''}" data-side="mid">
                ${this.currentLanguage === 'zh' ? '中' : 'Mid'}
              </button>
              <button class="side-btn ${region.side === 'right' ? 'active' : ''}" data-side="right">
                ${this.currentLanguage === 'zh' ? '右' : 'Right'}
              </button>
            </div>
          </div>
        </div>

        <!-- 操作類型選擇 -->
        <div class="operation-form__section">
          <label class="operation-form__label">
            ${this.currentLanguage === 'zh' ? '操作類型' : 'Operation Type'}
            <span class="required">*</span>
          </label>
          <div class="operation-type-grid">
            ${this.operationTypes.map(type => `
              <label class="operation-type-item">
                <input
                  type="radio"
                  name="operation-type"
                  value="${type.id}"
                  class="operation-type-input"
                >
                <span class="operation-type-label">
                  ${this.currentLanguage === 'zh' ? type.name : type.name_en}
                </span>
              </label>
            `).join('')}
          </div>
        </div>

        <!-- 操作描述文本框 -->
        <div class="operation-form__section">
          <label class="operation-form__label">
            ${this.currentLanguage === 'zh' ? '操作描述' : 'Description'}
            <span class="required">*</span>
          </label>
          <textarea
            class="operation-description"
            placeholder="${this.currentLanguage === 'zh' ? '詳細記錄進行的操作、治療或程序...' : 'Describe the operation, treatment or procedure...'}"
            rows="6"
          ></textarea>
          <div class="character-count">
            <span class="current-count">0</span>/<span class="max-count">500</span>
          </div>
        </div>

        <!-- 醫生備註 -->
        <div class="operation-form__section">
          <label class="operation-form__label">
            ${this.currentLanguage === 'zh' ? '醫生備註（可選）' : 'Doctor Notes (Optional)'}
          </label>
          <textarea
            class="operation-notes"
            placeholder="${this.currentLanguage === 'zh' ? '額外備註或觀察...' : 'Additional notes or observations...'}"
            rows="3"
          ></textarea>
        </div>
      </div>
    `;
  }

  /**
   * 獲取側邊顯示文本
   * @param {string} side - left, mid, right
   * @returns {string}
   */
  getSideDisplay(side) {
    const sideMap = {
      'left': this.currentLanguage === 'zh' ? '左側' : 'Left',
      'mid': this.currentLanguage === 'zh' ? '中央' : 'Center',
      'right': this.currentLanguage === 'zh' ? '右側' : 'Right'
    };
    return sideMap[side] || '';
  }

  /**
   * 驗證表單數據
   * @returns {Object} - {valid: boolean, errors: []}
   */
  validateForm() {
    this.currentLanguage = (typeof window !== 'undefined' && window.I18N && window.I18N.lang()) || (document.documentElement.lang === 'en' ? 'en' : 'zh');
    const errors = [];
    const operationType = document.querySelector('input[name="operation-type"]:checked');
    const description = document.querySelector('.operation-description').value.trim();

    if (!operationType) {
      errors.push(this.currentLanguage === 'zh' ? '請選擇操作類型' : 'Please select operation type');
    }

    if (!description) {
      errors.push(this.currentLanguage === 'zh' ? '請輸入操作描述' : 'Please enter operation description');
    }

    if (description.length > 500) {
      errors.push(this.currentLanguage === 'zh' ? '操作描述不超過 500 字' : 'Description must not exceed 500 characters');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * 收集表單數據
   * @returns {Object} - 操作記錄對象
   */
  getFormData() {
    const side = document.querySelector('.side-btn.active')?.dataset.side || this.currentRegion.side;
    const operationType = document.querySelector('input[name="operation-type"]:checked').value;
    const description = document.querySelector('.operation-description').value.trim();
    const notes = document.querySelector('.operation-notes').value.trim();

    return {
      regionId: this.currentRegion.id,
      regionName: this.currentRegion.name,
      regionNameEn: this.currentRegion.name_en,
      side: side,
      operationType: operationType,
      description: description,
      notes: notes,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * 設置側邊按鈕的點擊事件
   */
  setupSideButtonListeners(callback) {
    const sideButtons = document.querySelectorAll('.side-btn');
    sideButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        sideButtons.forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        if (callback) callback(e.target.dataset.side);
      });
    });
  }

  /**
   * 設置文本計數器
   */
  setupCharacterCounter() {
    const textarea = document.querySelector('.operation-description');
    const currentCount = document.querySelector('.current-count');

    if (textarea) {
      textarea.addEventListener('input', () => {
        currentCount.textContent = textarea.value.length;
      });
    }
  }

  /**
   * 清除表單
   */
  clearForm() {
    document.querySelectorAll('input[name="operation-type"]').forEach(input => {
      input.checked = false;
    });
    document.querySelector('.operation-description').value = '';
    document.querySelector('.operation-notes').value = '';
    document.querySelector('.current-count').textContent = '0';
  }
}
