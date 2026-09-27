/* ================================================
   眼睛系統模組 (Eye System)
   ================================================ */

defineAppMethods({
  /**
   * 渲染結構化 SVG 眼睛結構圖
   */
  async renderEyeDiagram() {
    const container = document.getElementById('eye-diagram-view');
    if (!container || typeof EyeDiagram === 'undefined') return;

    const lang = (window.I18N && window.I18N.lang()) || (document.documentElement.lang === 'en' ? 'en' : 'zh');
    const labels = window.I18N ? {
      anterior: window.I18N.t('eye.anterior'),
      posterior: window.I18N.t('eye.posterior'),
      frontOD: window.I18N.t('eye.frontOD'),
      frontOS: window.I18N.t('eye.frontOS')
    } : {};

    this.eyeDiagram = EyeDiagram.render(container, {
      side: this.selectedEye || 'right',
      lang,
      labels,
      onSelect: s => this.openEyeModal(s)
    });

    const svg = container.querySelector('svg');
    if (svg && typeof SvgViewport !== 'undefined') {
      if (this.svgViewport) {
        this.svgViewport.detach();
      }
      this.svgViewport = SvgViewport.attach(svg, {
        maxZoom: 4,
        onZoomChange: () => this.updateSvgZoomDisplay()
      });
      this.updateSvgZoomDisplay();
    }

    this.refreshEyeDiagramRecords();
  },

  /**
   * 切換眼別 (OD / OS)
   * @param {'right'|'left'} side
   */
  switchEyeSide(side) {
    if (side !== 'right' && side !== 'left') return;
    this.selectedEye = side;
    const buttons = document.querySelectorAll('#eye-side-toggle button');
    buttons.forEach(btn => {
      btn.setAttribute('aria-pressed', btn.dataset.side === side ? 'true' : 'false');
    });
    this.renderEyeDiagram();
  },

  /**
   * 刷新眼睛結構圖上的病歷標記與筆數
   */
  refreshEyeDiagramRecords() {
    if (!this.eyeDiagram || !this.recordManager) return;
    const records = this.recordManager.getAnnotationsBySystem('eye');
    const counts = {};
    let wholeEyeRight = 0;
    let wholeEyeLeft = 0;

    records.forEach(r => {
      const resolved = AnatomyMapping.resolveEye(r);
      if (resolved.wholeEye) {
        if (resolved.side === 'right') wholeEyeRight++;
        else if (resolved.side === 'left') wholeEyeLeft++;
        else {
          wholeEyeRight++;
          wholeEyeLeft++;
        }
      } else if (resolved.key) {
        if (resolved.side === null || resolved.side === this.selectedEye) {
          counts[resolved.key] = (counts[resolved.key] || 0) + 1;
        }
      }
    });

    this.eyeDiagram.setRecords(counts);

    const rightBtn = document.querySelector('#eye-side-toggle button[data-side="right"]');
    const leftBtn = document.querySelector('#eye-side-toggle button[data-side="left"]');
    if (rightBtn) {
      if (wholeEyeRight > 0) rightBtn.setAttribute('data-record-count', String(wholeEyeRight));
      else rightBtn.removeAttribute('data-record-count');
    }
    if (leftBtn) {
      if (wholeEyeLeft > 0) leftBtn.setAttribute('data-record-count', String(wholeEyeLeft));
      else leftBtn.removeAttribute('data-record-count');
    }
  },

  /**
   * 點選結構圖開啟眼睛疾病模態視窗
   * @param {object} s - 結構物件
   */
  openEyeModal(s) {
    if (!s) return;
    this.currentEyeStructure = {
      name: s.nameZh,
      nameEn: s.nameEn,
      structureId: s.recordId,
      type: s.key,
      side: s.side,
      confidence: 1,
      fromLabel: false,
      source: 'eye-diagram'
    };
    if (typeof this.displayEyeStructureInfo === 'function') {
      this.displayEyeStructureInfo(this.currentEyeStructure);
    }
    this.openDiseaseModal(null, this.currentEyeStructure);
  },

  /**
   * 顯示眼睛結構資訊在側面板
   * @param {object} structure - 眼睛結構物件
   */
  displayEyeStructureInfo(structure) {
    const infoContent = document.getElementById('eye-info-content');

    if (!infoContent) return;

    if (!structure || !structure.structureId) {
      const emptyText = (window.I18N && window.I18N.lang() === 'en')
        ? 'Click on a structure in the diagram to view details'
        : '點擊圖像上的結構以查看詳細信息';
      infoContent.innerHTML = `<div class="eye-info-empty">${escapeHtml(emptyText)}</div>`;
      return;
    }

    // 從 eye-descriptions.js 加載說明
    const description = getEyeStructureDescription(structure.structureId);

    if (!description) {
      infoContent.innerHTML = `
            <div class="eye-info-content">
                <div class="name">${escapeHtml(structure.name || structure.structureId)}</div>
            </div>
        `;
      return;
    }

    infoContent.innerHTML = `
        <div class="eye-info-content">
            <div class="name">${escapeHtml(description.name)}</div>
            <div class="name-en">${escapeHtml(description.nameEn)}</div>
            <div class="description">${escapeHtml(description.description)}</div>
            <div class="description-en">${escapeHtml(description.descriptionEn)}</div>
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
  }

});
