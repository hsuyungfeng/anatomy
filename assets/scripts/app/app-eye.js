/* ================================================
   眼睛系統模組 (Eye System)
   ================================================ */

defineAppMethods({
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

  },

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
  },

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
  },

  /**
   * 根據 structureId 確定左眼/右眼/雙眼
   * @param {string} structureId - 結構唯一標識符
   * @returns {string} 'left', 'right', 或 'bilateral'
   */
  getStructureSide(structureId) {
    if (structureId.startsWith('left-eye')) return 'left';
    if (structureId.startsWith('right-eye')) return 'right';
    return 'bilateral';
  },

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

  },

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
  },

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
  },

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
    } else {
      panelContainer.style.display = 'none';
    }
  },

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
    }

    // 首先嘗試檢測標籤點擊（標籤有更高的優先級） [新增]
    let labelInfo = null;
    if (this.eyeLabelMapper) {
      labelInfo = this.eyeLabelMapper.getLabelAtPosition(adjustedPos.x, adjustedPos.y, 40);
      if (labelInfo && this.eyeMapper.debug) {
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
  },

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
  },

});
