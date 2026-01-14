/**
 * 眼睛圖像標籤映射器 (Eye Label Mapper)
 *
 * 功能：
 * - 識別眼睛圖像中的文字標籤
 * - 將標籤文字與眼睛結構進行配對
 * - 支持點擊標籤以選擇對應的結構
 * - 支持可視化標籤位置
 *
 * @author Medical Record System
 * @version 1.0.0
 */

class EyeLabelMapper {
  /**
   * 初始化眼睛標籤映射器
   * @param {Object} options 配置選項
   */
  constructor(options = {}) {
    this.debug = options.debug || false;
    this.labelMappings = this.initializeLabelMappings();
    this.canvas = null;
    this.ctx = null;
    this.zoom = 1;
    this.panX = 0;
    this.panY = 0;

    if (this.debug) {
      console.log('[EyeLabelMapper] 已初始化，識別標籤數:', Object.keys(this.labelMappings).length);
    }
  }

  /**
   * 初始化標籤映射數據
   * 根據眼睛圖像中的文字標籤定義
   * @returns {Object} 標籤映射表
   */
  initializeLabelMappings() {
    // 基於 eye-coordinates.json 中的座標定義標籤位置
    // 左眼座標: (454.5, 313)，右眼座標: (921.5, 412)
    return {
      // 左眼相關標籤
      'left-eye-label': {
        structureId: 'left-eye',
        labelText: '左眼',
        labelTextEn: 'Left Eye',
        position: { x: 350, y: 250 },  // 左眼球中心左上方
        belongsTo: 'left'
      },
      'left-cornea-label': {
        structureId: 'left-eye-cornea',
        labelText: '角膜',
        labelTextEn: 'Cornea',
        position: { x: 300, y: 350 },  // 角膜位置
        belongsTo: 'left'
      },
      'left-iris-label': {
        structureId: 'left-eye-iris',
        labelText: '虹膜',
        labelTextEn: 'Iris',
        position: { x: 330, y: 330 },  // 虹膜位置
        belongsTo: 'left'
      },
      'left-lens-label': {
        structureId: 'left-eye-lens',
        labelText: '晶狀體',
        labelTextEn: 'Lens',
        position: { x: 350, y: 280 },  // 晶狀體位置
        belongsTo: 'left'
      },
      'left-retina-label': {
        structureId: 'left-eye-retina',
        labelText: '視網膜',
        labelTextEn: 'Retina',
        position: { x: 300, y: 450 },  // 視網膜位置（眼球後方）
        belongsTo: 'left'
      },

      // 右眼相關標籤
      'right-eye-label': {
        structureId: 'right-eye',
        labelText: '右眼',
        labelTextEn: 'Right Eye',
        position: { x: 1050, y: 300 },  // 右眼球中心右上方
        belongsTo: 'right'
      },
      'right-cornea-label': {
        structureId: 'right-eye-cornea',
        labelText: '角膜',
        labelTextEn: 'Cornea',
        position: { x: 1000, y: 350 },  // 角膜位置
        belongsTo: 'right'
      },
      'right-iris-label': {
        structureId: 'right-eye-iris',
        labelText: '虹膜',
        labelTextEn: 'Iris',
        position: { x: 1020, y: 330 },  // 虹膜位置
        belongsTo: 'right'
      },
      'right-lens-label': {
        structureId: 'right-eye-lens',
        labelText: '晶狀體',
        labelTextEn: 'Lens',
        position: { x: 1050, y: 280 },  // 晶狀體位置
        belongsTo: 'right'
      },
      'right-retina-label': {
        structureId: 'right-eye-retina',
        labelText: '視網膜',
        labelTextEn: 'Retina',
        position: { x: 1000, y: 500 },  // 視網膜位置（眼球後方）
        belongsTo: 'right'
      }
    };
  }

  /**
   * 根據點擊位置識別最近的標籤
   * @param {number} x 點擊的 X 座標
   * @param {number} y 點擊的 Y 座標
   * @param {number} tolerance 容差距離（像素）
   * @returns {Object|null} 標籤信息或 null
   */
  getLabelAtPosition(x, y, tolerance = 30) {
    let closestLabel = null;
    let closestDistance = tolerance;

    for (const [labelId, labelData] of Object.entries(this.labelMappings)) {
      const distance = Math.hypot(x - labelData.position.x, y - labelData.position.y);

      if (distance < closestDistance) {
        closestDistance = distance;
        closestLabel = {
          labelId,
          ...labelData,
          distance: closestDistance
        };
      }
    }

    if (closestLabel && this.debug) {
      console.log('[EyeLabelMapper] 識別到標籤:', closestLabel.labelText);
      console.log('  - 結構 ID:', closestLabel.structureId);
      console.log('  - 距離:', closestLabel.distance.toFixed(1), '像素');
    }

    return closestLabel;
  }

  /**
   * 根據結構 ID 獲取對應的標籤
   * @param {string} structureId 結構唯一標識符
   * @returns {Object|null} 標籤信息或 null
   */
  getLabelByStructureId(structureId) {
    for (const [labelId, labelData] of Object.entries(this.labelMappings)) {
      if (labelData.structureId === structureId) {
        return {
          labelId,
          ...labelData
        };
      }
    }
    return null;
  }

  /**
   * 獲取特定眼睛的所有標籤
   * @param {string} eye 眼睛 ('left' 或 'right')
   * @returns {Array} 標籤陣列
   */
  getLabelsByEye(eye) {
    return Object.entries(this.labelMappings)
      .filter(([, labelData]) => labelData.belongsTo === eye)
      .map(([labelId, labelData]) => ({
        labelId,
        ...labelData
      }));
  }

  /**
   * 在 Canvas 上繪製所有標籤
   * @param {HTMLCanvasElement} canvas Canvas 元素
   * @param {Object} options 繪製選項
   */
  drawLabels(canvas, options = {}) {
    if (!canvas) return;

    const {
      showText = true,
      textColor = '#333',
      fontSize = 14,
      fontFamily = 'Arial',
      backgroundColor = 'rgba(255, 255, 255, 0.9)',
      borderColor = '#0066cc',
      borderRadius = 4,
      padding = 4
    } = options;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 設置字體
    ctx.font = `${fontSize}px ${fontFamily}`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';

    // 遍歷所有標籤並繪製
    for (const [, labelData] of Object.entries(this.labelMappings)) {
      const x = labelData.position.x;
      const y = labelData.position.y;
      const text = showText ? labelData.labelText : '';

      if (text) {
        // 測量文本寬度
        const metrics = ctx.measureText(text);
        const textWidth = metrics.width;
        const textHeight = fontSize;

        // 繪製背景框
        const boxX = x - padding;
        const boxY = y - padding;
        const boxWidth = textWidth + padding * 2;
        const boxHeight = textHeight + padding * 2;

        // 繪製圓角矩形背景
        ctx.fillStyle = backgroundColor;
        ctx.strokeStyle = borderColor;
        ctx.lineWidth = 1;
        this.roundRect(ctx, boxX, boxY, boxWidth, boxHeight, borderRadius);
        ctx.fill();
        ctx.stroke();

        // 繪製標籤文字
        ctx.fillStyle = textColor;
        ctx.fillText(text, x, y);

        // 繪製指向線到結構位置（可選）
        // ctx.strokeStyle = borderColor;
        // ctx.lineWidth = 1;
        // ctx.beginPath();
        // ctx.moveTo(x + textWidth / 2, y + textHeight + padding);
        // ctx.lineTo(structureData.x, structureData.y);
        // ctx.stroke();
      }
    }
  }

  /**
   * 繪製圓角矩形（輔助方法）
   * @private
   */
  roundRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  }

  /**
   * 獲取所有標籤列表
   * @returns {Array} 標籤物件陣列
   */
  getAllLabels() {
    return Object.entries(this.labelMappings).map(([labelId, labelData]) => ({
      labelId,
      ...labelData
    }));
  }

  /**
   * 設置標籤位置（用於校正）
   * @param {string} labelId 標籤 ID
   * @param {number} x 新 X 座標
   * @param {number} y 新 Y 座標
   */
  setLabelPosition(labelId, x, y) {
    if (this.labelMappings[labelId]) {
      this.labelMappings[labelId].position = { x, y };
      if (this.debug) {
        console.log('[EyeLabelMapper] 已更新標籤位置:', labelId, `(${x}, ${y})`);
      }
    }
  }

  /**
   * 匯出標籤映射為 JSON 格式（用於校正後的備份）
   * @returns {string} JSON 字串
   */
  exportAsJSON() {
    return JSON.stringify({
      version: '1.0',
      description: '眼睛圖像標籤映射',
      lastUpdated: new Date().toISOString(),
      labelMappings: this.labelMappings
    }, null, 2);
  }
}

// 瀏覽器全域暴露
if (typeof window !== 'undefined') {
  window.EyeLabelMapper = EyeLabelMapper;
}

// Node.js 模組支持
if (typeof module !== 'undefined' && module.exports) {
  module.exports = EyeLabelMapper;
}
