/* ================================================
   圖像標註模組
   ================================================ */

class ImageAnnotator {
  /**
   * 初始化圖像標註器
   * @param {object} options - 配置選項
   */
  constructor(options = {}) {
    // 配置
    this.imageElement = options.imageElement || document.getElementById('image-canvas');
    this.containerElement = options.containerElement || document.getElementById('image-viewer');
    this.systemId = options.systemId || 'teeth';
    this.minZoom = options.minZoom || 0.5;
    this.maxZoom = options.maxZoom || 4;
    this.initialZoom = options.initialZoom || 1;

    // 狀態
    this.zoom = this.initialZoom;
    this.panX = 0;
    this.panY = 0;
    this.isDragging = false;
    this.dragStart = { x: 0, y: 0 };
    this.annotations = [];
    this.imageData = null;
    this.isImageLoaded = false;

    // 初始化
    this.init();
  }

  /**
   * 初始化事件監聽和狀態
   */
  init() {
    this.setupEventListeners();
    this.updateZoomDisplay();

    // 性能優化：使用 requestAnimationFrame 進行平滑渲染
    this.renderFrame = null;
  }

  /**
   * 設置事件監聽
   */
  setupEventListeners() {
    // 圖像點擊事件 - 在 canvas 和容器上都添加監聽
    if (this.imageElement) {
      this.imageElement.addEventListener('click', (e) => this.handleImageClick(e));
      this.imageElement.style.cursor = 'crosshair';
    }

    // 縮放事件及容器點擊事件
    if (this.containerElement) {
      // 容器點擊事件（備選方案）
      this.containerElement.addEventListener('click', (e) => {
        // 確保點擊目標是 canvas
        if (e.target === this.imageElement || this.imageElement.contains(e.target)) {
          this.handleImageClick(e);
        }
      });

      this.containerElement.addEventListener('wheel', (e) => this.handleZoom(e), { passive: false });
      // 使用節流優化 mousemove 事件
      this.containerElement.addEventListener('mousemove',
        throttle((e) => this.handleMouseMove(e), 16) // 約 60fps
      );
      this.containerElement.addEventListener('mousedown', (e) => this.handleMouseDown(e));
      this.containerElement.addEventListener('mouseup', () => this.handleMouseUp());
      this.containerElement.addEventListener('mouseleave', () => this.handleMouseUp());
    }

    // 按鈕控制
    const zoomInBtn = document.getElementById('zoom-in-btn');
    const zoomOutBtn = document.getElementById('zoom-out-btn');
    const zoomResetBtn = document.getElementById('zoom-reset-btn');

    if (zoomInBtn) zoomInBtn.addEventListener('click', () => this.zoomIn());
    if (zoomOutBtn) zoomOutBtn.addEventListener('click', () => this.zoomOut());
    if (zoomResetBtn) zoomResetBtn.addEventListener('click', () => this.resetZoom());
  }

  /**
   * 加載圖像
   * @param {string} imagePath - 圖像路徑
   */
  async loadImage(imagePath) {
    try {
      const img = new Image();
      img.src = imagePath;

      return new Promise((resolve, reject) => {
        img.onload = () => {
          this.imageData = img;
          this.isImageLoaded = true;
          this.renderImage();
          dispatchEvent('image:loaded', { imagePath }, this.imageElement);
          resolve(img);
        };

        img.onerror = () => {
          this.isImageLoaded = false;
          reject(new Error(`Failed to load image: ${imagePath}`));
        };
      });
    } catch (error) {
      console.error('Error loading image:', error);
      throw error;
    }
  }

  /**
   * 渲染圖像到 Canvas（帶性能優化）
   */
  renderImage() {
    if (!this.imageElement || !this.imageData) return;

    // 取消之前的渲染幀
    if (this.renderFrame) {
      cancelAnimationFrame(this.renderFrame);
    }

    // 使用 requestAnimationFrame 進行優化渲染
    this.renderFrame = requestAnimationFrame(() => {
      this._performRender();
      this.renderFrame = null;
    });
  }

  /**
   * 執行實際的渲染操作
   * @private
   */
  _performRender() {
    const ctx = this.imageElement.getContext('2d');
    if (!ctx) return;

    // 清除畫布
    ctx.clearRect(0, 0, this.imageElement.width, this.imageElement.height);

    // 設置畫布尺寸（只在必要時更新）
    if (this.imageElement.width !== this.imageElement.offsetWidth * window.devicePixelRatio ||
        this.imageElement.height !== this.imageElement.offsetHeight * window.devicePixelRatio) {
      this.imageElement.width = this.imageElement.offsetWidth * window.devicePixelRatio;
      this.imageElement.height = this.imageElement.offsetHeight * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    }

    // 保存當前狀態
    ctx.save();

    // 計算縮放後的尺寸
    const scaledWidth = this.imageElement.width / window.devicePixelRatio * this.zoom;
    const scaledHeight = this.imageElement.height / window.devicePixelRatio * this.zoom;

    // 繪製圖像
    const x = (this.imageElement.width / window.devicePixelRatio - scaledWidth) / 2 + this.panX;
    const y = (this.imageElement.height / window.devicePixelRatio - scaledHeight) / 2 + this.panY;

    ctx.drawImage(
      this.imageData,
      x,
      y,
      scaledWidth,
      scaledHeight
    );

    // 繪製標註點
    this.drawAnnotations(ctx);

    // 恢復狀態
    ctx.restore();
  }

  /**
   * 繪製標註點
   * @param {CanvasRenderingContext2D} ctx - Canvas 上下文
   */
  drawAnnotations(ctx) {
    if (!this.annotations || this.annotations.length === 0) return;

    this.annotations.forEach((annotation) => {
      const x = annotation.position.x;
      const y = annotation.position.y;

      // 繪製圓點
      ctx.fillStyle = annotation.color || '#ff0000';
      ctx.beginPath();
      ctx.arc(x, y, 6, 0, 2 * Math.PI);
      ctx.fill();

      // 繪製邊框
      ctx.strokeStyle = 'white';
      ctx.lineWidth = 2;
      ctx.stroke();
    });
  }

  /**
   * 處理圖像點擊事件
   * @param {MouseEvent} event - 滑鼠事件
   */
  handleImageClick(event) {
    if (!this.isImageLoaded) return;

    const rect = this.imageElement.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const position = {
      x: x / window.devicePixelRatio,
      y: y / window.devicePixelRatio
    };

    // 分派事件，由外部處理
    dispatchEvent('annotation:click', {
      position,
      systemId: this.systemId,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * 處理縮放事件
   * @param {WheelEvent} event - 滾輪事件
   */
  handleZoom(event) {
    if (!this.isImageLoaded) return;

    event.preventDefault();

    const delta = event.deltaY > 0 ? 0.9 : 1.1;
    const newZoom = this.zoom * delta;

    if (newZoom >= this.minZoom && newZoom <= this.maxZoom) {
      this.zoom = newZoom;
      this.renderImage();
      this.updateZoomDisplay();
    }
  }

  /**
   * 處理滑鼠按下事件
   * @param {MouseEvent} event - 滑鼠事件
   */
  handleMouseDown(event) {
    if (!this.isImageLoaded || this.zoom <= 1) return;

    this.isDragging = true;
    this.dragStart = {
      x: event.clientX - this.panX,
      y: event.clientY - this.panY
    };
    this.containerElement.style.cursor = 'grabbing';
  }

  /**
   * 處理滑鼠移動事件
   * @param {MouseEvent} event - 滑鼠事件
   */
  handleMouseMove(event) {
    if (!this.isDragging || !this.isImageLoaded) return;

    this.panX = event.clientX - this.dragStart.x;
    this.panY = event.clientY - this.dragStart.y;

    this.renderImage();
  }

  /**
   * 處理滑鼠抬起事件
   */
  handleMouseUp() {
    this.isDragging = false;
    if (this.containerElement) {
      this.containerElement.style.cursor = this.isImageLoaded ? 'crosshair' : 'default';
    }
  }

  /**
   * 放大圖像
   */
  zoomIn() {
    const newZoom = Math.min(this.zoom * 1.2, this.maxZoom);
    if (newZoom !== this.zoom) {
      this.zoom = newZoom;
      this.renderImage();
      this.updateZoomDisplay();
    }
  }

  /**
   * 縮小圖像
   */
  zoomOut() {
    const newZoom = Math.max(this.zoom * 0.8, this.minZoom);
    if (newZoom !== this.zoom) {
      this.zoom = newZoom;
      this.renderImage();
      this.updateZoomDisplay();
    }
  }

  /**
   * 重置縮放
   */
  resetZoom() {
    this.zoom = this.initialZoom;
    this.panX = 0;
    this.panY = 0;
    this.renderImage();
    this.updateZoomDisplay();
  }

  /**
   * 更新縮放顯示
   */
  updateZoomDisplay() {
    const zoomLevelEl = document.getElementById('zoom-level');
    if (zoomLevelEl) {
      zoomLevelEl.textContent = `${Math.round(this.zoom * 100)}%`;
    }
  }

  /**
   * 添加標註
   * @param {object} annotation - 標註對象
   */
  addAnnotation(annotation) {
    this.annotations.push(annotation);
    this.renderImage();
  }

  /**
   * 移除標註
   * @param {string} annotationId - 標註 ID
   */
  removeAnnotation(annotationId) {
    this.annotations = this.annotations.filter(a => a.id !== annotationId);
    this.renderImage();
  }

  /**
   * 清除所有標註
   */
  clearAnnotations() {
    this.annotations = [];
    this.renderImage();
  }

  /**
   * 獲取所有標註
   * @returns {array} 標註列表
   */
  getAnnotations() {
    return this.annotations;
  }

  /**
   * 設置系統 ID
   * @param {string} systemId - 解剖系統 ID
   */
  setSystemId(systemId) {
    this.systemId = systemId;
  }

  /**
   * 獲取當前圖像尺寸
   * @returns {object} {width, height}
   */
  getImageSize() {
    if (!this.imageData) return { width: 0, height: 0 };
    return {
      width: this.imageData.width,
      height: this.imageData.height
    };
  }

  /**
   * 獲取當前縮放級別
   * @returns {number} 縮放級別
   */
  getZoom() {
    return this.zoom;
  }

  /**
   * 銷毀標註器，清除資源
   */
  destroy() {
    this.clearAnnotations();
    this.imageData = null;
    this.isImageLoaded = false;
    // 移除事件監聽可在此添加
  }
}
