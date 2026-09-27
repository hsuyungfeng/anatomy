/* ================================================
   牙齒系統模組 (Tooth System)
   ================================================ */

defineAppMethods({
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
  },

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
  },

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
            <option value="${escapeHtml(tooth.toothId)}" data-name="${escapeHtml(tooth.nameCh)}" data-fdi="${escapeHtml(tooth.fdi)}">
              ${escapeHtml(tooth.nameCh)} (FDI: ${escapeHtml(tooth.fdi)})
            </option>
          `;
        });
        html += `</optgroup>`;
      }
    });

    html += `</select></div>`;
    return html;
  },

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
            <strong>${escapeHtml(toothInfo.nameCh)}</strong>
            <span class="fdi-badge">FDI: ${escapeHtml(toothInfo.fdi)}</span>
            <span class="manual-badge">手動選擇</span>
          `;
        }
      }
    });
  },

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
  },

  /**
   * 取得牙齒名稱對照表（快取於 this.toothNames）
   * @returns {Promise<object>}
   */
  async getToothNames() {
    if (this.toothNames) return this.toothNames;
    try {
      const resp = await fetch('data/tooth-numbering.json');
      const data = await resp.json();
      const names = {};
      const universalSys = (data.systems || []).find(s => s.id === 'universal');
      if (universalSys && Array.isArray(universalSys.teeth)) {
        universalSys.teeth.forEach(t => {
          if (t.fdi) {
            names[t.fdi] = {
              nameZh: t.nameZh,
              name: t.name,
              nameEn: t.name
            };
          }
        });
      }
      this.toothNames = names;
      return names;
    } catch (e) {
      console.error('載入 tooth-numbering.json 失敗:', e);
      return {};
    }
  },

  /**
   * 渲染結構化 SVG 牙位圖
   */
  async renderOdontogram() {
    const container = document.getElementById('odontogram-view');
    if (!container || typeof Odontogram === 'undefined') return;

    const dentition = this.currentSystemId === 'primary_teeth' ? 'primary' : 'permanent';
    let names = {};
    if (dentition === 'permanent') {
      names = await this.getToothNames();
    }

    this.odontogram = Odontogram.render(container, {
      dentition,
      names,
      onSelect: tooth => this.openToothModal(tooth)
    });

    this.refreshOdontogramRecords();
  },

  /**
   * 刷新牙位圖上的病歷標記與筆數
   */
  refreshOdontogramRecords() {
    if (!this.odontogram || !this.recordManager) return;
    const records = this.recordManager.getAnnotationsBySystem('teeth');
    const counts = {};
    records.forEach(r => {
      const fdi = r.fdiNumber || r.fdi;
      if (fdi) {
        counts[fdi] = (counts[fdi] || 0) + 1;
      }
    });
    this.odontogram.setRecords(counts);
  },

  /**
   * 點選牙位圖牙齒時開啟疾病記錄表單
   * @param {object} tooth - 牙位圖回傳的牙齒物件
   */
  openToothModal(tooth) {
    if (!tooth) return;
    this.currentToothInfo = {
      name: tooth.nameZh,
      nameEn: tooth.nameEn || '',
      fdi: tooth.fdi,
      number: tooth.universal,
      type: tooth.type,
      quadrant: tooth.quadrant,
      confidence: 1,
      manualSelection: false,
      source: 'odontogram'
    };
    this.openDiseaseModal(null, this.currentToothInfo);
  },

  /**
   * 切換參考圖（點陣圖）與牙位圖（SVG）
   */
  toggleReferenceImage() {
    const isTeeth = this.currentSystemId === 'teeth' || this.currentSystemId === 'primary_teeth';
    if (!isTeeth) return;
    if (this.currentSystemId === 'primary_teeth') {
      showNotification('乳牙沒有參考圖', 'info');
      return;
    }

    const odontogramView = document.getElementById('odontogram-view');
    const canvas = document.getElementById('image-canvas');
    const toggleBtn = document.getElementById('reference-image-toggle');

    this.isReferenceImageMode = !this.isReferenceImageMode;

    if (this.isReferenceImageMode) {
      if (odontogramView) odontogramView.hidden = true;
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
        toggleBtn.textContent = '牙位圖';
      }
    } else {
      if (canvas) canvas.style.display = 'none';
      if (odontogramView) odontogramView.hidden = false;
      if (toggleBtn) {
        toggleBtn.setAttribute('aria-pressed', 'false');
        toggleBtn.textContent = '參考圖';
      }
    }
  }

});
