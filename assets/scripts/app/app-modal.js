/* ================================================
   疾病模態視窗模組 (Modal & Disease Form)
   ================================================ */

defineAppMethods({
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
  },

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
  },

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
            ${this.renderManualBodySelector()}
          `;

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
            <p class="structure-info__error">無法自動識別身體部位，請重新點擊或使用下方選單選擇</p>
            ${this.renderManualBodySelector()}
          `;
        }
      }

      locationDiv.innerHTML = locationText;
      if (this.currentSystemId === 'teeth' || this.currentSystemId === 'primary_teeth') {
        this.setupManualToothSelector();
      } else if (this.currentSystemId === 'body') {
        this.setupManualBodySelector();
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
  },

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
  },

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
  },

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

    } catch (error) {
      console.error('[saveDiseaseAnnotation] 保存失敗:', error);
      alert('❌ 保存失敗，請重試');
    }
  },

});
