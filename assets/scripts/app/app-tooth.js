/* ================================================
   牙齒系統模組 (Tooth System)
   ================================================ */

defineAppMethods({
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

    const lang = (window.I18N && window.I18N.lang()) || (document.documentElement.lang === 'en' ? 'en' : 'zh');
    const labels = window.I18N ? {
      1: window.I18N.t('teeth.quadrant1'),
      2: window.I18N.t('teeth.quadrant2'),
      3: window.I18N.t('teeth.quadrant3'),
      4: window.I18N.t('teeth.quadrant4'),
      5: window.I18N.t('teeth.quadrant1'),
      6: window.I18N.t('teeth.quadrant2'),
      7: window.I18N.t('teeth.quadrant3'),
      8: window.I18N.t('teeth.quadrant4'),
      permanent: window.I18N.t('teeth.permanent'),
      primary: window.I18N.t('teeth.primary')
    } : {};

    this.odontogram = Odontogram.render(container, {
      dentition,
      names,
      lang,
      labels,
      onSelect: tooth => this.openToothModal(tooth)
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
  }
});
