/* ================================================
   疾病可視化管理器 - 連接線渲染
   ================================================ */

/**
 * 疾病可視化管理器
 * 負責在牙齒圖表上繪製疾病連接線和標籤
 */
class DiseaseVisualizationManager {
  /**
   * 初始化可視化管理器
   * @param {Element} canvasElement - 牙齒圖表 canvas 元素
   */
  constructor(canvasElement) {
    this.canvas = canvasElement;
    this.svgLayer = this.createSVGLayer();
    this.colorMap = this.initializeColorMap();
    this.annotations = [];
  }

  /**
   * 初始化疾病類型到顏色的映射
   * @returns {Object} 疾病代碼到顏色的映射表
   */
  initializeColorMap() {
    return {
      'K00': '#FF6B6B',  // 牙齒發育及萌發疾患 - 紅色
      'K01': '#FF8E72',  // 埋伏牙 - 橙紅
      'K02': '#FFA500',  // 牙根齲齒 - 橙色
      'K03': '#FFD700',  // 牙齒硬組織其他疾病 - 金色
      'K04': '#FF69B4',  // 急性根尖牙周組織炎 - 熱粉紅
      'K05': '#00CED1',  // 齒齦炎及牙周疾病 - 深青色
      'K06': '#87CEEB',  // 牙齦腫大 - 淺藍
      'K08': '#8A2BE2'   // 牙齒及支持性構造其他疾患 - 藍紫
    };
  }

  /**
   * 創建 SVG 疊層
   * @returns {Element} SVG 元素
   */
  createSVGLayer() {
    // 查找或創建 SVG 容器
    let svgContainer = document.getElementById('disease-svg-layer');
    if (!svgContainer) {
      svgContainer = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svgContainer.id = 'disease-svg-layer';
      svgContainer.setAttribute('class', 'disease-svg-layer');
      svgContainer.style.position = 'absolute';
      svgContainer.style.top = '0';
      svgContainer.style.left = '0';
      svgContainer.style.pointerEvents = 'none';
      svgContainer.style.zIndex = '10';

      // 获取图像查看器容器
      const viewer = document.getElementById('image-viewer');
      if (viewer) {
        viewer.style.position = 'relative';
        viewer.appendChild(svgContainer);
      }
    }

    return svgContainer;
  }

  /**
   * 更新 SVG 尺寸以匹配 canvas
   */
  updateSVGSize() {
    if (!this.canvas || !this.svgLayer) return;

    const rect = this.canvas.getBoundingClientRect();
    this.svgLayer.setAttribute('width', rect.width);
    this.svgLayer.setAttribute('height', rect.height);
    this.svgLayer.style.width = `${rect.width}px`;
    this.svgLayer.style.height = `${rect.height}px`;
  }

  /**
   * 獲取牙齒在 canvas 上的位置（使用 DentalImageMapper 的座標）
   * @param {string} locationName - 牙齒名稱 (例: "右上第三臼齒")
   * @param {number} index - 疾病索引
   * @returns {Object} 位置座標 {x, y} 或 null
   */
  getToothPosition(locationName, index = 0) {
    if (!this.canvas) return null;

    // 嘗試從全局 app 實例獲取 DentalImageMapper
    const app = window.app;
    if (!app || !app.dentalMapper || !app.dentalMapper.isLoaded) {
      console.warn('DentalImageMapper 不可用，使用備選方法');
      return this.getToothPositionFallback(locationName);
    }

    // 從座標數據中查找牙齒
    const teethType = app.currentSystemId === 'primary_teeth' ? 'primary' : 'permanent';
    const allTeeth = app.dentalMapper.getAllTeeth(teethType);

    // 根據中文名稱匹配牙齒
    const tooth = allTeeth.find(t => t.nameCh === locationName);

    if (!tooth) {
      console.warn(`未找到牙齒: ${locationName}`);
      return this.getToothPositionFallback(locationName);
    }

    // 轉換座標到 canvas 相對位置
    const canvasRect = this.canvas.getBoundingClientRect();
    const containerRect = this.canvas.parentElement.getBoundingClientRect();

    // 獲取圖像的實際顯示縮放比例
    const imageWidth = this.canvas.naturalWidth || 1313;
    const imageHeight = this.canvas.naturalHeight || 610;
    const displayWidth = canvasRect.width;
    const displayHeight = canvasRect.height;

    const scaleX = displayWidth / imageWidth;
    const scaleY = displayHeight / imageHeight;

    // 計算縮放後的座標
    const x = (tooth.x * scaleX) + (canvasRect.left - containerRect.left);
    const y = (tooth.y * scaleY) + (canvasRect.top - containerRect.top);

    return { x, y };
  }

  /**
   * 備選方法：當 DentalImageMapper 不可用時使用
   * @param {string} locationName - 牙齒名稱
   * @returns {Object} 估算的位置座標
   */
  getToothPositionFallback(locationName) {
    const relPos = this.estimatePositionFromName(locationName);

    if (!relPos) {
      relPos = { x: 0.5, y: 0.5 }; // 預設中心位置
    }

    // 轉換為 canvas 座標
    const canvasRect = this.canvas.getBoundingClientRect();
    const containerRect = this.canvas.parentElement.getBoundingClientRect();

    const x = (relPos.x * canvasRect.width) + (canvasRect.left - containerRect.left);
    const y = (relPos.y * canvasRect.height) + (canvasRect.top - containerRect.top);

    return { x, y };
  }

  /**
   * 基於牙齒名稱估算位置
   * @param {string} name - 牙齒名稱
   * @returns {Object} 相對位置 {x, y} 或 null
   */
  estimatePositionFromName(name) {
    // 簡單的位置估算邏輯
    let x = 0.5, y = 0.5;

    // 上下判定
    if (name.includes('上')) {
      y = 0.25;
    } else if (name.includes('下')) {
      y = 0.75;
    }

    // 左右判定
    if (name.includes('左')) {
      x = 0.25;
    } else if (name.includes('右')) {
      x = 0.75;
    }

    // 前後判定（門牙、尖牙、臼齒）
    if (name.includes('門牙')) {
      x += name.includes('左') ? 0 : name.includes('右') ? 0 : -0.2;
    } else if (name.includes('尖牙')) {
      x += name.includes('左') ? 0.05 : name.includes('右') ? -0.05 : 0;
    }

    return { x: Math.max(0.1, Math.min(0.9, x)), y };
  }

  /**
   * 計算標籤位置（偏離牙齒位置）
   * @param {Object} toothPos - 牙齒位置 {x, y}
   * @param {number} diseaseIndex - 疾病索引
   * @param {number} totalDiseases - 總疾病數
   * @returns {Object} 標籤位置 {x, y}
   */
  calculateLabelPosition(toothPos, diseaseIndex, totalDiseases) {
    if (!toothPos) return { x: 0, y: 0 };

    // 計算排列角度（圍繞牙齒分散）
    const angleStep = 360 / Math.max(totalDiseases, 1);
    const angle = (diseaseIndex * angleStep) * Math.PI / 180;

    // 距離牙齒 80 像素
    const distance = 80;
    const offsetX = Math.cos(angle) * distance;
    const offsetY = Math.sin(angle) * distance;

    return {
      x: toothPos.x + offsetX,
      y: toothPos.y + offsetY
    };
  }

  /**
   * 在 SVG 中繪製連接線
   * @param {Object} startPoint - 起點 {x, y}
   * @param {Object} endPoint - 終點 {x, y}
   * @param {string} color - 線條顏色
   * @param {string} diseaseId - 疾病 ID（用於標識）
   */
  drawLine(startPoint, endPoint, color, diseaseId) {
    if (!this.svgLayer || !startPoint || !endPoint) return;

    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', startPoint.x);
    line.setAttribute('y1', startPoint.y);
    line.setAttribute('x2', endPoint.x);
    line.setAttribute('y2', endPoint.y);
    line.setAttribute('stroke', color);
    line.setAttribute('stroke-width', '2');
    line.setAttribute('opacity', '0.8');
    line.setAttribute('class', `disease-line disease-line--${diseaseId}`);
    line.setAttribute('data-disease', diseaseId);
    line.style.cursor = 'pointer';
    line.style.pointerEvents = 'auto';

    // 添加鼠標交互
    line.addEventListener('mouseenter', () => {
      line.setAttribute('stroke-width', '4');
      line.setAttribute('opacity', '1');
    });

    line.addEventListener('mouseleave', () => {
      line.setAttribute('stroke-width', '2');
      line.setAttribute('opacity', '0.8');
    });

    this.svgLayer.appendChild(line);
  }

  /**
   * 在 SVG 中繪製文字標籤
   * @param {Object} position - 位置 {x, y}
   * @param {string} text - 標籤文字
   * @param {string} color - 文字顏色
   * @param {string} diseaseId - 疾病 ID（用於標識）
   */
  drawLabel(position, text, color, diseaseId) {
    if (!this.svgLayer || !position) return;

    // 背景矩形
    const bg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    bg.setAttribute('x', position.x - 40);
    bg.setAttribute('y', position.y - 12);
    bg.setAttribute('width', '80');
    bg.setAttribute('height', '24');
    bg.setAttribute('fill', 'white');
    bg.setAttribute('stroke', color);
    bg.setAttribute('stroke-width', '1');
    bg.setAttribute('rx', '4');
    bg.setAttribute('opacity', '0.9');
    bg.setAttribute('class', `disease-label-bg disease-label-bg--${diseaseId}`);
    bg.style.pointerEvents = 'auto';

    // 文字
    const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    label.setAttribute('x', position.x);
    label.setAttribute('y', position.y + 4);
    label.setAttribute('text-anchor', 'middle');
    label.setAttribute('font-size', '12');
    label.setAttribute('fill', color);
    label.setAttribute('font-weight', 'bold');
    label.setAttribute('class', `disease-label disease-label--${diseaseId}`);
    label.setAttribute('data-disease', diseaseId);
    label.textContent = text;
    label.style.cursor = 'pointer';
    label.style.pointerEvents = 'auto';

    // 添加鼠標交互
    label.addEventListener('mouseenter', () => {
      bg.setAttribute('opacity', '1');
      label.setAttribute('font-size', '13');
    });

    label.addEventListener('mouseleave', () => {
      bg.setAttribute('opacity', '0.9');
      label.setAttribute('font-size', '12');
    });

    this.svgLayer.appendChild(bg);
    this.svgLayer.appendChild(label);
  }

  /**
   * 渲染所有標註的疾病連接線
   * @param {Array} annotations - 標註陣列
   */
  render(annotations) {
    if (!this.svgLayer) return;

    // 清除舊的連接線和標籤
    this.svgLayer.innerHTML = '';

    // 更新 SVG 尺寸
    this.updateSVGSize();

    this.annotations = annotations || [];

    if (!Array.isArray(this.annotations) || this.annotations.length === 0) {
      return;
    }

    // 對每個標註繪製連接線
    this.annotations.forEach(annotation => {
      if (!annotation.diseases || annotation.diseases.length === 0) {
        return;
      }

      // 獲取牙齒位置
      const toothPos = this.getToothPosition(annotation.locationName);
      if (!toothPos) {
        return;
      }

      // 為每個疾病繪製連接線和標籤
      annotation.diseases.forEach((disease, diseaseIndex) => {
        const color = this.getColorForDisease(disease.id);
        const labelPos = this.calculateLabelPosition(
          toothPos,
          diseaseIndex,
          annotation.diseases.length
        );

        // 繪製連接線
        this.drawLine(toothPos, labelPos, color, disease.id);

        // 繪製標籤
        this.drawLabel(labelPos, disease.name, color, disease.id);
      });
    });

    console.log(`已渲染 ${this.annotations.length} 條標註的疾病連接線`);
  }

  /**
   * 獲取疾病對應的顏色
   * @param {string} diseaseId - 疾病 ID (例: K02)
   * @returns {string} 顏色代碼
   */
  getColorForDisease(diseaseId) {
    // 提取主疾病代碼（例: K02 -> K02）
    const code = diseaseId.substring(0, 3);
    return this.colorMap[code] || '#999999'; // 預設灰色
  }

  /**
   * 清除所有連接線
   */
  clear() {
    if (this.svgLayer) {
      this.svgLayer.innerHTML = '';
    }
    this.annotations = [];
  }

  /**
   * 銷毀可視化管理器
   */
  destroy() {
    this.clear();
    if (this.svgLayer && this.svgLayer.parentElement) {
      this.svgLayer.parentElement.removeChild(this.svgLayer);
    }
  }
}
