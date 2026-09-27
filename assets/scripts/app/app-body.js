/* ================================================
   身體系統模組 (Body System)
   ================================================ */

defineAppMethods({
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
    let naturalWidth = 764;   // bodysurface.png 寬度
    let naturalHeight = 602;  // bodysurface.png 高度

    // 嘗試從 ImageAnnotator 實例中獲取原始圖像尺寸
    if (this.annotator && this.annotator.imageData) {
      naturalWidth = this.annotator.imageData.naturalWidth || naturalWidth;
      naturalHeight = this.annotator.imageData.naturalHeight || naturalHeight;
    }

    // 獲取 ImageAnnotator 的 zoom 和 pan 參數
    let zoom = 1;
    let panX = 0;
    let panY = 0;
    if (this.annotator) {
      zoom = this.annotator.zoom || 1;
      panX = this.annotator.panX || 0;
      panY = this.annotator.panY || 0;
    }

    // 計算顯示的圖像尺寸（使用 offsetWidth/offsetHeight 獲取顯示大小）
    const imageDisplayWidth = canvas.offsetWidth;
    const imageDisplayHeight = canvas.offsetHeight;

    // 計算圖片在canvas中的實際顯示尺寸（維持長寬比）
    const displayAspect = imageDisplayWidth / imageDisplayHeight;
    const imageAspect = naturalWidth / naturalHeight;
    
    let displayedWidth, displayedHeight, offsetX, offsetY;
    
    if (displayAspect > imageAspect) {
      // 畫面比較寬，以高度為主
      displayedHeight = imageDisplayHeight;
      displayedWidth = displayedHeight * imageAspect;
      offsetX = (imageDisplayWidth - displayedWidth) / 2;
      offsetY = 0;
    } else {
      // 畫面比較窄，以寬度為主
      displayedWidth = imageDisplayWidth;
      displayedHeight = displayedWidth / imageAspect;
      offsetX = 0;
      offsetY = (imageDisplayHeight - displayedHeight) / 2;
    }

    // 將點擊座標轉換到原始圖像座標
    // 1. 首先去除偏移量
    // 2. 然後按比例轉換
    const scaleX = displayedWidth / naturalWidth;
    const scaleY = displayedHeight / naturalHeight;

    const adjustedPos = {
      x: ((position.x - offsetX) / scaleX),
      y: ((position.y - offsetY) / scaleY)
    };

    if (this.bodyImageMapper.debug) {
      console.log('[detectBodyRegion] 坐標轉換詳情：');
      console.log(`  原始圖像: ${naturalWidth}x${naturalHeight}`);
      console.log(`  顯示畫布: ${imageDisplayWidth}x${imageDisplayHeight}`);
      console.log(`  實際顯示: ${displayedWidth.toFixed(1)}x${displayedHeight.toFixed(1)}`);
      console.log(`  偏移: (${offsetX.toFixed(1)}, ${offsetY.toFixed(1)})`);
      console.log(`  比例: scaleX=${scaleX.toFixed(3)}, scaleY=${scaleY.toFixed(3)}`);
      console.log(`  Zoom: ${zoom.toFixed(2)}, Pan: (${panX.toFixed(1)}, ${panY.toFixed(1)})`);
      console.log(`  點擊座標 (顯示): position.x=${position.x.toFixed(1)}, position.y=${position.y.toFixed(1)}`);
      console.log(`  轉換後座標 (原始圖像): adjustedPos.x=${adjustedPos.x.toFixed(1)}, adjustedPos.y=${adjustedPos.y.toFixed(1)}`);
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
  },

  /**
   * 渲染身體部位手動選擇器（樹狀結構）
   */
  renderManualBodySelector() {
    const bodyRegions = this.bodySystemsData?.bodyRegions || [];
    
    let html = `
      <div class="manual-body-selector">
        <h4 class="manual-selector__title">或選擇身體部位：</h4>
        <select id="manual-body-select" class="manual-body-select">
          <option value="">-- 請選擇部位 --</option>
    `;

    const sideMap = { 'left': '左', 'right': '右', 'mid': '中' };

    bodyRegions.forEach(region => {
      const sideName = sideMap[region.side] || '';
      const regionName = region.nameZh || region.nameEn;
      
      // 主區域
      html += `<optgroup label="${sideName}${regionName}">`;
      
      // 子區域
      if (region.subRegions && region.subRegions.length > 0) {
        region.subRegions.forEach(sub => {
          html += `
            <option value="${sub.id}" data-region-id="${region.id}" data-name-zh="${sub.nameZh}" data-name-en="${sub.nameEn}" data-side="${region.side}">
              ${sub.nameZh} (${sub.nameEn})
            </option>
          `;
        });
      } else {
        // 沒有子區域時，選擇主區域
        html += `
          <option value="${region.id}" data-region-id="${region.id}" data-name-zh="${region.nameZh}" data-name-en="${region.nameEn}" data-side="${region.side}">
            ${region.nameZh} (${region.nameEn})
          </option>
        `;
      }
      
      html += `</optgroup>`;
    });

    html += `</select></div>`;
    return html;
  },

  /**
   * 設置身體部位手動選擇器的事件監聽
   */
  setupManualBodySelector() {
    const selector = document.getElementById('manual-body-select');
    if (!selector) return;

    // 清除舊的事件監聽器（避免重複）
    const newSelector = selector.cloneNode(true);
    selector.parentNode.replaceChild(newSelector, selector);

    newSelector.addEventListener('change', (e) => {
      const selectedOption = e.target.options[e.target.selectedIndex];
      if (!selectedOption.value) return;

      const bodyRegionInfo = {
        id: selectedOption.value,
        name: selectedOption.dataset.nameZh,
        nameEn: selectedOption.dataset.nameEn,
        side: selectedOption.dataset.side,
        parentRegion: selectedOption.dataset.regionId,
        confidence: 1.0,
        manualSelection: true
      };

      this.currentBodyRegion = bodyRegionInfo;

      // 更新顯示（保留選單）
      const locationDiv = $('#modal-location');
      if (locationDiv) {
        const sideBadge = bodyRegionInfo.side === 'left' ? '左側' : bodyRegionInfo.side === 'right' ? '右側' : '中線';
        locationDiv.innerHTML = `
          <div class="body-region-info">
            <p class="structure-info__main">
              <strong>${bodyRegionInfo.name}</strong>
              <span class="side-badge">${sideBadge}</span>
              <span class="manual-badge">手動選擇</span>
            </p>
          </div>
          ${this.renderManualBodySelector()}
        `;
        // 重新綁定事件
        this.setupManualBodySelector();
      }

      showNotification(`已選擇：${bodyRegionInfo.name}`, 'success');
    });
  },

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
  },

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
  },

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
  },

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
  },

  /**
   * 預先加載身體系統數據
   */
  async loadBodySystemsData() {
    if (!this.bodySystemsData) {
      try {
        const response = await fetch('/data/body-systems.json');
        this.bodySystemsData = await response.json();
        console.log('✓ 身體系統數據已預加載');
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
  },

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
  },

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
  },

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

