/**
 * 牙科圖像映射器 (Dental Image Mapper)
 *
 * 功能：
 * - 加載牙齒座標映射數據
 * - 根據點擊位置識別牙齒編號
 * - 計算點擊信心度
 * - 支持調試模式可視化
 *
 * @author Dental Record System
 * @version 1.0.0
 */

class DentalImageMapper {
  /**
   * 初始化牙科圖像映射器
   * @param {Object} options 配置選項
   * @param {string} options.coordinatesUrl 座標映射文件的 URL (預設: /data/dental-coordinates.json)
   * @param {boolean} options.debug 是否啟用調試模式 (預設: false)
   */
  constructor(options = {}) {
    this.debug = options.debug || false;
    this.coordinatesUrl = options.coordinatesUrl || '/data/dental-coordinates.json';

    // 座標數據緩存
    this.coordinates = null;
    this.permanentTeeth = null;
    this.primaryTeeth = null;

    // 加載狀態
    this.isLoaded = false;
    this.loadPromise = null;

    // 事件監聽器
    this.listeners = {
      'toothSelected': [],
      'toothHovered': [],
      'clickOutside': [],
      'loadComplete': [],
      'loadError': []
    };

    if (this.debug) {
      console.log('[DentalImageMapper] 已初始化，正在準備加載座標數據...');
    }
  }

  /**
   * 非同步加載座標映射數據
   * @returns {Promise<boolean>} 加載成功返回 true
   */
  async loadCoordinates() {
    if (this.isLoaded) {
      return true;
    }

    if (this.loadPromise) {
      return this.loadPromise;
    }

    this.loadPromise = (async () => {
      try {
        const response = await fetch(this.coordinatesUrl);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        this.coordinates = await response.json();
        this.permanentTeeth = this.coordinates.permanent.teeth;
        this.primaryTeeth = this.coordinates.primary.teeth;
        this.isLoaded = true;

        if (this.debug) {
          console.log('[DentalImageMapper] ✓ 座標數據加載完成');
          console.log('  - 永久牙:', Object.keys(this.permanentTeeth).length, '顆');
          console.log('  - 乳牙:', Object.keys(this.primaryTeeth).length, '顆');
        }

        this.emit('loadComplete', { teeth: Object.keys(this.permanentTeeth).length });
        return true;
      } catch (error) {
        console.error('[DentalImageMapper] ✗ 座標數據加載失敗:', error);
        this.emit('loadError', { error: error.message });
        this.isLoaded = false;
        return false;
      }
    })();

    return this.loadPromise;
  }

  /**
   * 根據點擊位置識別牙齒
   * @param {number} x 點擊的 X 座標 (相對於圖像)
   * @param {number} y 點擊的 Y 座標 (相對於圖像)
   * @param {string} type 牙齒類型 ('permanent' 或 'primary')
   * @returns {Object|null} 牙齒信息或 null (如果未找到)
   */
  getToothAtPosition(x, y, type = 'permanent') {
    if (!this.isLoaded) {
      console.error('[DentalImageMapper] 座標數據未加載');
      return null;
    }

    const teeth = type === 'permanent' ? this.permanentTeeth : this.primaryTeeth;
    if (!teeth) {
      console.error('[DentalImageMapper] 無效的牙齒類型:', type);
      return null;
    }

    // 遍歷所有牙齒，找到最近的點擊
    let closest = null;
    let closestDistance = Infinity;

    for (const [toothId, toothData] of Object.entries(teeth)) {
      const distance = Math.hypot(x - toothData.x, y - toothData.y);

      // 如果距離在牙齒半徑內
      if (distance <= toothData.radius) {
        if (distance < closestDistance) {
          closestDistance = distance;
          closest = {
            toothId,
            ...toothData,
            distance,
            confidence: Math.max(0, 1 - (distance / toothData.radius))
          };
        }
      }
    }

    if (closest) {
      if (this.debug) {
        console.log('[DentalImageMapper] ✓ 識別到牙齒:', closest.nameCh, `(#${closest.number})`);
        console.log('  - 信心度:', (closest.confidence * 100).toFixed(1) + '%');
        console.log('  - 距離:', closest.distance.toFixed(1), 'px');
      }

      this.emit('toothSelected', closest);
      return closest;
    }

    if (this.debug) {
      console.log('[DentalImageMapper] ✗ 點擊位置未在任何牙齒區域內');
      console.log('  - 座標:', `(${x}, ${y})`);
    }

    this.emit('clickOutside', { x, y });
    return null;
  }

  /**
   * 獲取指定牙齒的詳細信息
   * @param {string|number} toothNumber 牙齒編號 (1-32 或 A-T)
   * @param {string} type 牙齒類型 ('permanent' 或 'primary')
   * @returns {Object|null} 牙齒信息或 null (如果未找到)
   */
  getToothInfo(toothNumber, type = 'permanent') {
    if (!this.isLoaded) {
      console.error('[DentalImageMapper] 座標數據未加載');
      return null;
    }

    const teeth = type === 'permanent' ? this.permanentTeeth : this.primaryTeeth;
    const toothId = String(toothNumber);
    const tooth = teeth[toothId];

    if (!tooth) {
      console.warn('[DentalImageMapper] 牙齒 #' + toothNumber + ' 未找到');
      return null;
    }

    return {
      toothId: toothId,
      ...tooth
    };
  }

  /**
   * 獲取所有牙齒的列表
   * @param {string} type 牙齒類型 ('permanent' 或 'primary')
   * @returns {Array} 牙齒列表
   */
  getAllTeeth(type = 'permanent') {
    if (!this.isLoaded) {
      console.error('[DentalImageMapper] 座標數據未加載');
      return [];
    }

    const teeth = type === 'permanent' ? this.permanentTeeth : this.primaryTeeth;
    return Object.entries(teeth).map(([id, data]) => ({
      toothId: id,
      ...data
    }));
  }

  /**
   * 在 canvas 上可視化所有牙齒區域 (調試用)
   * @param {HTMLCanvasElement} canvas Canvas 元素
   * @param {string} type 牙齒類型 ('permanent' 或 'primary')
   * @param {Object} options 視覺化選項
   */
  visualizeClickAreas(canvas, type = 'permanent', options = {}) {
    if (!this.isLoaded) {
      console.error('[DentalImageMapper] 座標數據未加載，無法可視化');
      return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      console.error('[DentalImageMapper] 無法取得 canvas 上下文');
      return;
    }

    const {
      showLabels = true,
      fillColor = 'rgba(100, 150, 255, 0.1)',
      strokeColor = '#0066ff',
      lineWidth = 2,
      textColor = '#333',
      fontSize = 12
    } = options;

    const teeth = type === 'permanent' ? this.permanentTeeth : this.primaryTeeth;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 繪製每個牙齒的點擊區域
    for (const [toothId, tooth] of Object.entries(teeth)) {
      // 繪製圓形區域
      ctx.fillStyle = fillColor;
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = lineWidth;
      ctx.beginPath();
      ctx.arc(tooth.x, tooth.y, tooth.radius, 0, 2 * Math.PI);
      ctx.fill();
      ctx.stroke();

      // 繪製標籤
      if (showLabels) {
        ctx.fillStyle = textColor;
        ctx.font = `${fontSize}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(toothId, tooth.x, tooth.y);
      }
    }

    console.log('[DentalImageMapper] ✓ 已在 canvas 上可視化所有牙齒點擊區域');
  }

  /**
   * 在 canvas 上突顯特定牙齒
   * @param {HTMLCanvasElement} canvas Canvas 元素
   * @param {string|number} toothNumber 牙齒編號
   * @param {string} type 牙齒類型
   * @param {Object} options 突顯選項
   */
  highlightTooth(canvas, toothNumber, type = 'permanent', options = {}) {
    const tooth = this.getToothInfo(toothNumber, type);
    if (!tooth) {
      console.warn('[DentalImageMapper] 無法突顯牙齒 #' + toothNumber + ': 未找到');
      return;
    }

    const ctx = canvas.getContext('2d');
    const {
      fillColor = 'rgba(100, 255, 100, 0.2)',
      strokeColor = '#00cc00',
      lineWidth = 3
    } = options;

    ctx.fillStyle = fillColor;
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = lineWidth;
    ctx.beginPath();
    ctx.arc(tooth.x, tooth.y, tooth.radius, 0, 2 * Math.PI);
    ctx.fill();
    ctx.stroke();

    if (this.debug) {
      console.log('[DentalImageMapper] ✓ 已突顯牙齒 #' + toothNumber);
    }
  }

  /**
   * 清除 canvas
   * @param {HTMLCanvasElement} canvas Canvas 元素
   */
  clearCanvas(canvas) {
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  /**
   * 註冊事件監聽器
   * @param {string} event 事件名稱
   * @param {Function} callback 回調函數
   */
  on(event, callback) {
    if (this.listeners[event]) {
      this.listeners[event].push(callback);
    }
  }

  /**
   * 移除事件監聽器
   * @param {string} event 事件名稱
   * @param {Function} callback 回調函數
   */
  off(event, callback) {
    if (this.listeners[event]) {
      this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
    }
  }

  /**
   * 觸發事件
   * @private
   */
  emit(event, data) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('[DentalImageMapper] 事件回調出錯:', error);
        }
      });
    }
  }

  /**
   * 計算圖像縮放因子 (用於支持高 DPI 顯示)
   * @param {HTMLImageElement} image 圖像元素
   * @returns {Object} 縮放因子 {scaleX, scaleY}
   */
  getImageScale(image) {
    const canvas = document.createElement('canvas');
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    const displayWidth = image.width || image.naturalWidth;
    const displayHeight = image.height || image.naturalHeight;

    return {
      scaleX: displayWidth / canvas.width,
      scaleY: displayHeight / canvas.height
    };
  }

  /**
   * 調整點擊座標以適應圖像縮放
   * @param {number} x 原始 X 座標 (相對於顯示寬度)
   * @param {number} y 原始 Y 座標 (相對於顯示高度)
   * @param {HTMLImageElement} image 圖像元素
   * @returns {Object} 調整後的座標 {x, y}
   */
  adjustCoordinatesForScale(x, y, image) {
    const scale = this.getImageScale(image);
    return {
      x: x / scale.scaleX,
      y: y / scale.scaleY
    };
  }
}

// 如果在瀏覽器環境中，將類掛載到全域作用域
if (typeof window !== 'undefined') {
  window.DentalImageMapper = DentalImageMapper;
}

// 支持 Node.js/模組導出
if (typeof module !== 'undefined' && module.exports) {
  module.exports = DentalImageMapper;
}
