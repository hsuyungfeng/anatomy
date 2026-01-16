/**
 * 身體圖像映射器 (Body Image Mapper)
 *
 * 功能：
 * - 加載身體座標映射數據
 * - 根據點擊位置識別身體部位
 * - 計算點擊信心度
 * - 支持調試模式可視化
 *
 * @author Body Region System
 * @version 1.0.0
 */

class BodyImageMapper {
  /**
   * 初始化身體圖像映射器
   * @param {Object} options 配置選項
   * @param {string} options.coordinatesUrl 座標映射文件的 URL (預設: /data/body-coordinates.json)
   * @param {boolean} options.debug 是否啟用調試模式 (預設: false)
   */
  constructor(options = {}) {
    this.debug = options.debug || false;
    this.coordinatesUrl = options.coordinatesUrl || '/data/body-coordinates.json';

    // 座標數據緩存
    this.coordinates = null;
    this.bodyRegions = null;

    // 加載狀態
    this.isLoaded = false;
    this.loadPromise = null;

    // 事件監聽器
    this.listeners = {
      'regionSelected': [],
      'regionHovered': [],
      'clickOutside': [],
      'loadComplete': [],
      'loadError': []
    };

    if (this.debug) {
      console.log('[BodyImageMapper] 已初始化，正在準備加載座標數據...');
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

        const data = await response.json();

        // body-coordinates.json 的結構：{ systemId, systemName, imageIds: { bodysurface: { regions: [...] } } }
        if (data.imageIds && data.imageIds.bodysurface && data.imageIds.bodysurface.regions) {
          this.bodyRegions = data.imageIds.bodysurface.regions;
          this.coordinates = data;
          this.isLoaded = true;

          if (this.debug) {
            console.log('[BodyImageMapper] ✓ 座標數據加載完成');
            console.log('  - 身體部位:', this.bodyRegions.length, '個');
            this.bodyRegions.forEach(region => {
              console.log(`    • ${region.name} (${region.nameEn}) [${region.side}]`);
            });
          }

          this.emit('loadComplete', { regions: this.bodyRegions.length });
          return true;
        } else {
          throw new Error('座標數據格式不正確');
        }
      } catch (error) {
        console.error('[BodyImageMapper] ✗ 座標數據加載失敗:', error);
        this.emit('loadError', { error: error.message });
        this.isLoaded = false;
        return false;
      }
    })();

    return this.loadPromise;
  }

  /**
   * 根據點擊位置識別身體部位
   * @param {number} x 點擊的 X 座標 (相對於圖像)
   * @param {number} y 點擊的 Y 座標 (相對於圖像)
   * @returns {Object|null} 身體部位信息或 null (如果未找到)
   */
  getRegionAtPosition(x, y) {
    if (!this.isLoaded || !this.bodyRegions) {
      console.error('[BodyImageMapper] 座標數據未加載');
      return null;
    }

    // 遍歷所有身體部位，找到最近的點擊
    let closest = null;
    let closestDistance = Infinity;

    for (const region of this.bodyRegions) {
      const distance = Math.hypot(x - region.centerPoint.x, y - region.centerPoint.y);

      // 如果距離在點擊半徑內
      if (distance <= region.clickRadius) {
        if (distance < closestDistance) {
          closestDistance = distance;
          closest = {
            ...region,
            distance,
            confidence: Math.max(0, 1 - (distance / region.clickRadius))
          };
        }
      }
    }

    // 如果沒有找到在半徑內的區域，檢查多邊形
    if (!closest && this.bodyRegions) {
      for (const region of this.bodyRegions) {
        if (this.isPointInPolygon(x, y, region.polygon)) {
          const distance = Math.hypot(x - region.centerPoint.x, y - region.centerPoint.y);
          closest = {
            ...region,
            distance,
            confidence: Math.max(0, 1 - (distance / region.clickRadius))
          };
          break;
        }
      }
    }

    if (closest) {
      if (this.debug) {
        console.log('[BodyImageMapper] ✓ 識別到身體部位:', closest.name, `(${closest.nameEn})`);
        console.log('  - 側面:', closest.side);
        console.log('  - 信心度:', (closest.confidence * 100).toFixed(1) + '%');
        console.log('  - 距離:', closest.distance.toFixed(1), 'px');
      }

      this.emit('regionSelected', closest);
      return closest;
    }

    if (this.debug) {
      console.log('[BodyImageMapper] ✗ 點擊位置未在任何身體部位區域內');
      console.log('  - 座標:', `(${x}, ${y})`);
    }

    this.emit('clickOutside', { x, y });
    return null;
  }

  /**
   * 檢查點是否在多邊形內 (射線投射算法)
   * @param {number} x 點的 X 座標
   * @param {number} y 點的 Y 座標
   * @param {Array} polygon 多邊形頂點陣列
   * @returns {boolean} 如果點在多邊形內返回 true
   */
  isPointInPolygon(x, y, polygon) {
    if (!polygon || polygon.length < 3) {
      return false;
    }

    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const xi = polygon[i].x;
      const yi = polygon[i].y;
      const xj = polygon[j].x;
      const yj = polygon[j].y;

      const intersect = ((yi > y) !== (yj > y))
        && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
      if (intersect) inside = !inside;
    }

    return inside;
  }

  /**
   * 獲取指定身體部位的詳細信息
   * @param {string} bodyPart 身體部位 (head, neck, chest, abdomen, arm, leg)
   * @param {string} side 側面 (left, right, mid)
   * @returns {Object|null} 身體部位信息或 null (如果未找到)
   */
  getRegionInfo(bodyPart, side = 'mid') {
    if (!this.isLoaded || !this.bodyRegions) {
      console.error('[BodyImageMapper] 座標數據未加載');
      return null;
    }

    const region = this.bodyRegions.find(r => r.id === bodyPart && r.side === side);

    if (!region) {
      console.warn(`[BodyImageMapper] 身體部位 ${bodyPart} (${side}) 未找到`);
      return null;
    }

    return { ...region };
  }

  /**
   * 獲取所有身體部位的列表
   * @returns {Array} 身體部位列表
   */
  getAllRegions() {
    if (!this.isLoaded || !this.bodyRegions) {
      console.error('[BodyImageMapper] 座標數據未加載');
      return [];
    }

    return this.bodyRegions.map(region => ({ ...region }));
  }

  /**
   * 在 canvas 上可視化所有身體部位區域 (調試用)
   * @param {HTMLCanvasElement} canvas Canvas 元素
   * @param {Object} options 視覺化選項
   */
  visualizeClickAreas(canvas, options = {}) {
    if (!this.isLoaded || !this.bodyRegions) {
      console.error('[BodyImageMapper] 座標數據未加載，無法可視化');
      return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      console.error('[BodyImageMapper] 無法取得 canvas 上下文');
      return;
    }

    const {
      showLabels = true,
      showCenterPoints = true,
      showPolygons = true,
      fillColor = 'rgba(150, 200, 255, 0.15)',
      strokeColor = '#0099ff',
      lineWidth = 2,
      textColor = '#333',
      fontSize = 12,
      pointSize = 4,
      pointColor = '#ff3366'
    } = options;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 繪製每個身體部位
    for (const region of this.bodyRegions) {
      // 繪製點擊半徑圓形
      ctx.fillStyle = fillColor;
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = lineWidth;
      ctx.beginPath();
      ctx.arc(region.centerPoint.x, region.centerPoint.y, region.clickRadius, 0, 2 * Math.PI);
      ctx.fill();
      ctx.stroke();

      // 繪製多邊形邊界
      if (showPolygons && region.polygon && region.polygon.length > 0) {
        ctx.strokeStyle = '#ff9900';
        ctx.lineWidth = 1;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(region.polygon[0].x, region.polygon[0].y);
        for (let i = 1; i < region.polygon.length; i++) {
          ctx.lineTo(region.polygon[i].x, region.polygon[i].y);
        }
        ctx.closePath();
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // 繪製中心點
      if (showCenterPoints) {
        ctx.fillStyle = pointColor;
        ctx.beginPath();
        ctx.arc(region.centerPoint.x, region.centerPoint.y, pointSize, 0, 2 * Math.PI);
        ctx.fill();
      }

      // 繪製標籤
      if (showLabels) {
        ctx.fillStyle = textColor;
        ctx.font = `bold ${fontSize}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(region.name, region.centerPoint.x, region.centerPoint.y - region.clickRadius - 15);
      }
    }

    console.log('[BodyImageMapper] ✓ 已在 canvas 上可視化所有身體部位點擊區域');
  }

  /**
   * 添加事件監聽器
   * @param {string} eventName 事件名稱
   * @param {Function} callback 回調函數
   */
  on(eventName, callback) {
    if (this.listeners[eventName]) {
      this.listeners[eventName].push(callback);
    } else {
      console.warn(`[BodyImageMapper] 未知的事件: ${eventName}`);
    }
  }

  /**
   * 移除事件監聽器
   * @param {string} eventName 事件名稱
   * @param {Function} callback 回調函數
   */
  off(eventName, callback) {
    if (this.listeners[eventName]) {
      this.listeners[eventName] = this.listeners[eventName].filter(cb => cb !== callback);
    }
  }

  /**
   * 觸發事件
   * @param {string} eventName 事件名稱
   * @param {*} data 事件數據
   */
  emit(eventName, data) {
    if (this.listeners[eventName]) {
      this.listeners[eventName].forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`[BodyImageMapper] 事件 '${eventName}' 回調執行出錯:`, error);
        }
      });
    }
  }
}
