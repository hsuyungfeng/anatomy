/**
 * 眼科圖像映射器 (Eye Image Mapper)
 *
 * 功能：
 * - 加載眼睛座標映射數據
 * - 根據點擊位置識別眼睛結構
 * - 計算點擊信心度
 * - 支持調試模式可視化
 *
 * @author Medical Record System
 * @version 1.0.0
 */

class EyeImageMapper {
  /**
   * 初始化眼科圖像映射器
   * @param {Object} options 配置選項
   * @param {string} options.coordinatesUrl 座標映射檔案的 URL (預設: /data/eye-coordinates.json)
   * @param {boolean} options.debug 是否啟用調試模式 (預設: false)
   */
  constructor(options = {}) {
    this.debug = options.debug || false;
    this.coordinatesUrl = options.coordinatesUrl || '/data/eye-coordinates.json';

    // 座標數據緩存
    this.coordinates = null;
    this.structures = null;

    // 加載狀態
    this.isLoaded = false;
    this.loadPromise = null;

    // 事件監聽器
    this.listeners = {
      'structureSelected': [],
      'clickOutside': [],
      'loadComplete': [],
      'loadError': []
    };

    if (this.debug) {
      console.log('[EyeImageMapper] 已初始化，正在準備加載座標數據...');
    }
  }

  /**
   * 非同步加載座標映射數據
   * @returns {Promise<boolean>} 加載成功返回 true
   */
  async loadCoordinates() {
    // 如果已加載，直接返回
    if (this.isLoaded) {
      return true;
    }

    // 如果正在加載中，返回正在進行的 Promise
    if (this.loadPromise) {
      return this.loadPromise;
    }

    // 開始加載
    this.loadPromise = (async () => {
      try {
        const response = await fetch(this.coordinatesUrl);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        this.coordinates = await response.json();
        this.structures = this.coordinates.structures;
        this.isLoaded = true;

        if (this.debug) {
          console.log('[EyeImageMapper] ✓ 座標數據加載完成');
          console.log('  - 眼睛結構:', Object.keys(this.structures).length, '個');
          console.log('  - 圖像尺寸:', this.coordinates.imageReferenceSize.width, 'x', this.coordinates.imageReferenceSize.height);
        }

        this.emit('loadComplete', { structures: Object.keys(this.structures).length });
        return true;
      } catch (error) {
        console.error('[EyeImageMapper] ✗ 座標數據加載失敗:', error);
        this.emit('loadError', { error: error.message });
        this.isLoaded = false;
        return false;
      }
    })();

    return this.loadPromise;
  }

  /**
   * 根據點擊位置識別眼睛結構
   * 使用圓形檢測，優先匹配半徑較小的細部結構
   *
   * @param {number} x 點擊的 X 座標 (相對於圖像)
   * @param {number} y 點擊的 Y 座標 (相對於圖像)
   * @returns {Object|null} 結構資訊或 null (如果未找到)
   */
  getStructureAtPosition(x, y) {
    if (!this.isLoaded) {
      console.error('[EyeImageMapper] 座標數據未加載');
      return null;
    }

    // 按半徑大小排序，小半徑優先（細部結構優先）
    const sortedStructures = Object.entries(this.structures)
      .sort(([, a], [, b]) => a.radius - b.radius);

    let closest = null;
    let closestDistance = Infinity;

    // 遍歷所有結構，查找最接近的匹配項
    for (const [structureId, structureData] of sortedStructures) {
      // 計算點擊位置到結構圓心的距離
      const distance = Math.hypot(x - structureData.x, y - structureData.y);

      // 如果點擊位置在檢測半徑內，且是目前最接近的
      if (distance <= structureData.radius && distance < closestDistance) {
        closestDistance = distance;
        closest = {
          structureId,
          ...structureData,
          distance,
          // 信心度：1.0（在圓心）到 0（在邊界）
          confidence: Math.max(0, 1 - (distance / structureData.radius))
        };
      }
    }

    if (closest) {
      if (this.debug) {
        console.log('[EyeImageMapper] ✓ 識別到眼睛結構:', closest.nameCh);
        console.log('  - 結構 ID:', closest.structureId);
        console.log('  - 信心度:', (closest.confidence * 100).toFixed(1) + '%');
        console.log('  - 距離圓心:', closest.distance.toFixed(1), '像素');
      }
      this.emit('structureSelected', closest);
      return closest;
    }

    if (this.debug) {
      console.log('[EyeImageMapper] ✗ 點擊位置未在任何眼睛結構區域內');
      console.log('  - 點擊座標: (' + x + ', ' + y + ')');
    }
    this.emit('clickOutside', { x, y });
    return null;
  }

  /**
   * 獲取指定結構的詳細資訊
   * @param {string} structureId 結構唯一標識符
   * @returns {Object|null} 結構資訊或 null
   */
  getStructureInfo(structureId) {
    if (!this.isLoaded) {
      console.error('[EyeImageMapper] 座標數據未加載');
      return null;
    }

    const structure = this.structures[structureId];
    if (structure) {
      return {
        structureId,
        ...structure
      };
    }

    console.warn('[EyeImageMapper] 未找到結構:', structureId);
    return null;
  }

  /**
   * 獲取所有眼睛結構列表
   * @returns {Array} 結構物件陣列
   */
  getAllStructures() {
    if (!this.isLoaded) {
      console.error('[EyeImageMapper] 座標數據未加載');
      return [];
    }

    return Object.entries(this.structures).map(([id, data]) => ({
      structureId: id,
      ...data
    }));
  }

  /**
   * 在 Canvas 上可視化所有眼睛結構的檢測區域（調試用）
   * @param {HTMLCanvasElement} canvas Canvas 元素
   * @param {Object} options 可視化選項
   * @param {boolean} options.showLabels 是否顯示標籤 (預設: true)
   * @param {string} options.fillColor 填充顏色 (預設: rgba(135, 206, 235, 0.1))
   * @param {string} options.strokeColor 邊框顏色 (預設: #87ceeb)
   * @param {number} options.lineWidth 邊框寬度 (預設: 2)
   * @param {string} options.textColor 文字顏色 (預設: #333)
   * @param {number} options.fontSize 字體大小 (預設: 12)
   */
  visualizeClickAreas(canvas, options = {}) {
    if (!this.isLoaded) {
      console.error('[EyeImageMapper] 座標數據未加載，無法可視化');
      return;
    }

    // 提取選項，設置預設值
    const {
      showLabels = true,
      fillColor = 'rgba(135, 206, 235, 0.1)',
      strokeColor = '#87ceeb',
      lineWidth = 2,
      textColor = '#333',
      fontSize = 12
    } = options;

    const ctx = canvas.getContext('2d');

    // 清空 Canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 遍歷所有結構，繪製圓形區域
    for (const [structureId, structure] of Object.entries(this.structures)) {
      // 繪製填充的圓形
      ctx.fillStyle = fillColor;
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = lineWidth;
      ctx.beginPath();
      ctx.arc(structure.x, structure.y, structure.radius, 0, 2 * Math.PI);
      ctx.fill();
      ctx.stroke();

      // 繪製中心點
      ctx.fillStyle = strokeColor;
      ctx.beginPath();
      ctx.arc(structure.x, structure.y, 3, 0, 2 * Math.PI);
      ctx.fill();

      // 顯示標籤
      if (showLabels) {
        ctx.fillStyle = textColor;
        ctx.font = `${fontSize}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(structure.nameCh, structure.x, structure.y);
      }
    }

    if (this.debug) {
      console.log('[EyeImageMapper] ✓ 已在 Canvas 上可視化所有結構區域');
    }
  }

  /**
   * 事件系統 - 監聽事件
   * @param {string} event 事件名稱
   * @param {Function} callback 回調函數
   */
  on(event, callback) {
    if (this.listeners[event]) {
      this.listeners[event].push(callback);
      if (this.debug) {
        console.log('[EyeImageMapper] 已添加事件監聽:', event);
      }
    } else {
      console.warn('[EyeImageMapper] 未知事件:', event);
    }
  }

  /**
   * 事件系統 - 移除事件監聽
   * @param {string} event 事件名稱
   * @param {Function} callback 回調函數
   */
  off(event, callback) {
    if (this.listeners[event]) {
      this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
      if (this.debug) {
        console.log('[EyeImageMapper] 已移除事件監聽:', event);
      }
    }
  }

  /**
   * 事件系統 - 觸發事件
   * @param {string} event 事件名稱
   * @param {*} data 事件數據
   */
  emit(event, data) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('[EyeImageMapper] 事件回調出錯:', event, error);
        }
      });
    }
  }
}

// 瀏覽器全域暴露
if (typeof window !== 'undefined') {
  window.EyeImageMapper = EyeImageMapper;
}

// Node.js 模組支持
if (typeof module !== 'undefined' && module.exports) {
  module.exports = EyeImageMapper;
}
