/* ================================================
   身體系統模組 (Body System)
   ================================================ */

defineAppMethods({

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

      const regionId = (this.currentBodyRegion && this.currentBodyRegion.id) || operationData.regionId;
      const regionNameZh = (this.currentBodyRegion && this.currentBodyRegion.name) || this.getBodySubregionNameZh(regionId) || operationData.regionName;
      const regionNameEn = (this.currentBodyRegion && this.currentBodyRegion.name_en) || this.getBodySubregionNameEn(regionId) || operationData.regionNameEn;
      const regionSide = operationData.side || (this.currentBodyRegion && this.currentBodyRegion.side) || (typeof AnatomyMapping !== 'undefined' ? AnatomyMapping.bodySide(regionId) : 'mid');

      // 構建完整的操作記錄對象，與其他系統的記錄格式相容
      const annotation = {
        annotationId: generateUUID(),
        position: this.currentClickPosition || { x: 0, y: 0 },

        // 身體部位資訊
        locationName: regionNameZh,
        locationNameEn: regionNameEn,
        bodyRegionId: regionId,
        side: regionSide,
        source: 'body-map',

        // 檢測元數據
        detectionConfidence: this.currentBodyRegion ? (this.currentBodyRegion.confidence || 1.0) : 1.0,

        // 操作資訊
        operationType: operationData.operationType,
        description: operationData.description,
        notes: operationData.notes,

        createdAt: operationData.timestamp,
        updatedAt: operationData.timestamp
      };

      // 保存到記錄管理器
      if (this.recordManager) {
        this.recordManager.addAnnotation('body', annotation);
      }

      // 添加視覺標註到圖像
      if (this.annotator) {
        const system = this.anatomicalSystems.systems.find(s => s.id === 'body');
        this.annotator.addAnnotation({
          ...annotation,
          color: system?.color || '#ff0000'
        });
      }

      // 關閉模態並重新加載病例列表
      this.closeDiseaseModal();
      if (typeof this.refreshBodyMapRecords === 'function') {
        this.refreshBodyMapRecords();
      }
      await this.loadAndDisplayRecords();

      // 顯示成功提示
      showNotification('身體系統操作記錄已成功保存', 'success');

    } catch (error) {
      console.error('[saveBodyOperation] 保存失敗:', error);
      showNotification('保存失敗，請重試', 'error');
    }
  },

  /**
   * 取得所有身體子部位中英文名稱映射表
   */
  getBodySubregionNames() {
    const names = {};
    if (this.bodySystemsData && Array.isArray(this.bodySystemsData.bodyRegions)) {
      this.bodySystemsData.bodyRegions.forEach(reg => {
        if (Array.isArray(reg.subRegions)) {
          reg.subRegions.forEach(sub => {
            names[sub.id] = sub.nameZh;
          });
        }
      });
    }
    return names;
  },

  /**
   * 取得子部位中文名稱
   */
  getBodySubregionNameZh(subId) {
    if (this.bodySystemsData && Array.isArray(this.bodySystemsData.bodyRegions)) {
      for (const reg of this.bodySystemsData.bodyRegions) {
        if (Array.isArray(reg.subRegions)) {
          const found = reg.subRegions.find(s => s.id === subId);
          if (found) return found.nameZh;
        }
      }
    }
    return null;
  },

  /**
   * 取得子部位英文名稱
   */
  getBodySubregionNameEn(subId) {
    if (this.bodySystemsData && Array.isArray(this.bodySystemsData.bodyRegions)) {
      for (const reg of this.bodySystemsData.bodyRegions) {
        if (Array.isArray(reg.subRegions)) {
          const found = reg.subRegions.find(s => s.id === subId);
          if (found) return found.nameEn;
        }
      }
    }
    return null;
  },

  /**
   * 取得大區域底下的所有子部位 ID 清單
   */
  getSubregionsForRegion(regionId) {
    if (this.bodySystemsData && Array.isArray(this.bodySystemsData.bodyRegions)) {
      const reg = this.bodySystemsData.bodyRegions.find(r => r.id === regionId);
      if (reg && Array.isArray(reg.subRegions)) {
        return reg.subRegions.map(s => s.id);
      }
    }
    return [];
  },

  /**
   * 渲染寫實輪廓身體部位圖 SVG
   */
  async renderBodyMap() {
    const container = document.getElementById('body-map-view');
    if (!container || typeof BodyMap === 'undefined') return;

    if (!this.bodySystemsData) {
      await this.loadBodySystemsData();
    }

    if (!this.bodySex) {
      try {
        this.bodySex = localStorage.getItem('bodyMapSex') || 'female';
      } catch (_) {
        this.bodySex = 'female';
      }
    }

    // 更新體型切換按鈕狀態
    const sexButtons = document.querySelectorAll('#body-sex-toggle button');
    sexButtons.forEach(btn => {
      btn.setAttribute('aria-pressed', String(btn.dataset.sex === this.bodySex));
    });

    const names = this.getBodySubregionNames();

    this.bodyMap = BodyMap.render(container, {
      sex: this.bodySex,
      names: names,
      onSelect: r => this.openBodyModal(r)
    });

    // 掛載 SvgViewport
    if (typeof SvgViewport !== 'undefined' && this.bodyMap.svg) {
      if (this.svgViewport) {
        this.svgViewport.detach();
      }
      this.svgViewport = SvgViewport.attach(this.bodyMap.svg, {
        minZoom: 1,
        maxZoom: 4,
        zoomStep: 1.25,
        onZoomChange: (zoom) => {
          const zoomLevelEl = document.getElementById('zoom-level');
          if (zoomLevelEl) {
            zoomLevelEl.textContent = `${Math.round(zoom * 100)}%`;
          }
        }
      });
      this.updateSvgZoomDisplay();
    }

    await this.refreshBodyMapRecords();
  },

  /**
   * 切換身體體型 (female / male)
   */
  async switchBodySex(sex) {
    if (sex !== 'female' && sex !== 'male') return;
    this.bodySex = sex;
    try {
      localStorage.setItem('bodyMapSex', sex);
    } catch (_) {}

    const sexButtons = document.querySelectorAll('#body-sex-toggle button');
    sexButtons.forEach(btn => {
      btn.setAttribute('aria-pressed', String(btn.dataset.sex === sex));
    });

    await this.renderBodyMap();
  },

  /**
   * 放大臉部區域
   */
  focusFace() {
    const head = document.querySelector('#body-map-view .region[data-region="head"][data-view="front"]');
    if (head && this.svgViewport) {
      this.svgViewport.focusOn(head, 3.5);
    }
  },

  /**
   * 開啟身體部位操作表單模態視窗
   */
  openBodyModal(r) {
    const subId = r.id || r.key;
    const nameZh = r.nameZh || this.getBodySubregionNameZh(subId) || subId;
    const nameEn = this.getBodySubregionNameEn(subId) || subId;
    const side = (typeof AnatomyMapping !== 'undefined') ? AnatomyMapping.bodySide(subId) : 'mid';

    const region = {
      id: subId,
      name: nameZh,
      name_en: nameEn,
      side: side,
      confidence: 1.0,
      source: 'body-map'
    };

    this.currentBodyRegion = region;
    this.openDiseaseModal(null, region);
  },

  /**
   * 依據現有病歷更新身體部位圖的 has-record / has-region-record 標示
   */
  async refreshBodyMapRecords() {
    if (!this.bodyMap || typeof this.bodyMap.setRecords !== 'function') return;

    if (!this.bodyLegacyMap) {
      try {
        this.bodyLegacyMap = await loadJSON('data/body-legacy-map.json');
      } catch (_) {
        this.bodyLegacyMap = null;
      }
    }

    if (!this.bodySystemsData) {
      await this.loadBodySystemsData();
    }

    const records = this.recordManager ? this.recordManager.getAnnotationsBySystem('body') : [];
    const countById = {};
    const regionRecordSubIds = new Set();

    records.forEach(rec => {
      if (typeof AnatomyMapping !== 'undefined') {
        const res = AnatomyMapping.resolveBody(rec, this.bodyLegacyMap);
        if (res.subId) {
          countById[res.subId] = (countById[res.subId] || 0) + 1;
        } else if (res.regionId) {
          const subIds = this.getSubregionsForRegion(res.regionId);
          subIds.forEach(id => regionRecordSubIds.add(id));
        }
      } else {
        const id = rec.bodyRegionId || rec.bodyPart;
        if (id) countById[id] = (countById[id] || 0) + 1;
      }
    });

    this.bodyMap.setRecords(countById);
    if (typeof this.bodyMap.setRegionRecords === 'function') {
      this.bodyMap.setRegionRecords(regionRecordSubIds);
    }
  },

  /**
   * 預先加載身體系統數據
   */
  async loadBodySystemsData() {
    if (!this.bodySystemsData) {
      try {
        const response = await fetch('/data/body-systems.json');
        this.bodySystemsData = await response.json();
      } catch (error) {
        console.error('✗ 身體系統數據預加載失敗:', error);
      }
    }
  },

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
              <input type="checkbox" value="${escapeHtml(disease)}"> ${escapeHtml(disease)}
            </label><br>
          `;
        });
      }

      // 填入皮下疾病
      if (region.commonDiseases.subcutaneous && subContainer) {
        region.commonDiseases.subcutaneous.forEach(disease => {
          subContainer.innerHTML += `
            <label>
              <input type="checkbox" value="${escapeHtml(disease)}"> ${escapeHtml(disease)}
            </label><br>
          `;
        });
      }

    } catch (error) {
      console.error('[loadBodyRegionDiseases] 加載失敗:', error);
    }
  },

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
  },

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
});

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

