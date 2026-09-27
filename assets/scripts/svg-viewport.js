/**
 * SVG 視口縮放與平移模組 (SvgViewport)
 * 
 * 透過操作 SVG 的 viewBox 屬性實現視口縮放、拖曳平移與聚焦部位。
 * 不使用 CSS transform，確保點擊命中座標精確與向量線條清晰。
 * 
 * 用法：
 * const vp = SvgViewport.attach(svgElement, { maxZoom: 4, onZoomChange: (z) => {} });
 * vp.zoomIn();
 * vp.zoomOut();
 * vp.reset();
 * vp.focusOn('head-eye-r');
 * vp.getZoom();
 * vp.detach();
 */

(function(root) {
  'use strict';

  class SvgViewport {
    /**
     * @param {SVGSVGElement} svg
     * @param {object} [options]
     * @param {number} [options.maxZoom=4] - 最大縮放倍率
     * @param {number} [options.minZoom=1] - 最小縮放倍率
     * @param {number} [options.zoomStep=1.25] - 每次縮放倍數
     * @param {function} [options.onZoomChange] - 縮放變更回呼
     */
    constructor(svg, options = {}) {
      if (!svg) {
        throw new Error('SvgViewport requires an SVG element');
      }
      this.svg = svg;
      this.maxZoom = options.maxZoom || 4;
      this.minZoom = options.minZoom || 1;
      this.zoomStep = options.zoomStep || 1.25;
      this.onZoomChange = options.onZoomChange || null;

      this.zoom = 1;

      // 解析初始 viewBox
      const vbAttr = svg.getAttribute('viewBox');
      if (vbAttr) {
        const parts = vbAttr.trim().split(/\s+/).map(Number);
        this.origViewBox = { x: parts[0], y: parts[1], w: parts[2], h: parts[3] };
      } else {
        let bbox = { x: 0, y: 0, width: 960, height: 500 };
        try {
          bbox = svg.getBBox();
        } catch (_) {}
        this.origViewBox = {
          x: bbox.x || 0,
          y: bbox.y || 0,
          w: bbox.width || 960,
          h: bbox.height || 500
        };
        svg.setAttribute('viewBox', `${this.origViewBox.x} ${this.origViewBox.y} ${this.origViewBox.w} ${this.origViewBox.h}`);
      }

      this.currentViewBox = { ...this.origViewBox };

      // 拖曳平移狀態
      this.isDragging = false;
      this.dragStart = { x: 0, y: 0 };
      this.dragStartViewBox = { ...this.currentViewBox };
      this.dragMoved = 0;
      this.shouldBlockClick = false;

      // 綁定事件處理函數
      this._onPointerDown = this._onPointerDown.bind(this);
      this._onPointerMove = this._onPointerMove.bind(this);
      this._onPointerUp = this._onPointerUp.bind(this);
      this._onWheel = this._onWheel.bind(this);
      this._onClickCapture = this._onClickCapture.bind(this);

      this._bindEvents();
    }

    static attach(svg, options) {
      if (!svg) return null;
      return new SvgViewport(svg, options);
    }

    _bindEvents() {
      this.svg.addEventListener('pointerdown', this._onPointerDown);
      this.svg.addEventListener('pointermove', this._onPointerMove);
      this.svg.addEventListener('pointerup', this._onPointerUp);
      this.svg.addEventListener('pointercancel', this._onPointerUp);
      this.svg.addEventListener('wheel', this._onWheel, { passive: false });
      // capture 階段攔截拖曳後的 click
      this.svg.addEventListener('click', this._onClickCapture, true);
    }

    _unbindEvents() {
      this.svg.removeEventListener('pointerdown', this._onPointerDown);
      this.svg.removeEventListener('pointermove', this._onPointerMove);
      this.svg.removeEventListener('pointerup', this._onPointerUp);
      this.svg.removeEventListener('pointercancel', this._onPointerUp);
      this.svg.removeEventListener('wheel', this._onWheel);
      this.svg.removeEventListener('click', this._onClickCapture, true);
      this.svg.style.cursor = '';
    }

    detach() {
      this._unbindEvents();
    }

    getZoom() {
      return this.zoom;
    }

    /**
     * 取得目前的縮放與可視範圍（重繪 SVG 前保存，重繪後以 setState 還原）
     * @returns {{zoom: number, viewBox: {x: number, y: number, w: number, h: number}}}
     */
    getState() {
      return { zoom: this.zoom, viewBox: { ...this.currentViewBox } };
    }

    /**
     * 還原 getState 取得的狀態
     * @param {{zoom: number, viewBox: {x: number, y: number, w: number, h: number}}} state
     */
    setState(state) {
      if (!state || !state.viewBox) return;
      const { w, h } = state.viewBox;
      this.setZoom(state.zoom, state.viewBox.x + w / 2, state.viewBox.y + h / 2);
    }

    /**
     * 設定縮放倍率，錨定至 (cx, cy)
     * @param {number} newZoom
     * @param {number} [anchorX] - SVG 座標系的中心 X
     * @param {number} [anchorY] - SVG 座標系的中心 Y
     */
    setZoom(newZoom, anchorX, anchorY) {
      const clampedZoom = Math.max(this.minZoom, Math.min(this.maxZoom, newZoom));
      this.zoom = clampedZoom;

      const newW = this.origViewBox.w / clampedZoom;
      const newH = this.origViewBox.h / clampedZoom;

      // 若未指定錨點，以當前可視中心為基準
      const cx = (anchorX !== undefined) ? anchorX : (this.currentViewBox.x + this.currentViewBox.w / 2);
      const cy = (anchorY !== undefined) ? anchorY : (this.currentViewBox.y + this.currentViewBox.h / 2);

      let newX = cx - newW / 2;
      let newY = cy - newH / 2;

      // 限制 viewBox 不移出原始範圍
      const minX = this.origViewBox.x;
      const maxX = this.origViewBox.x + this.origViewBox.w - newW;
      const minY = this.origViewBox.y;
      const maxY = this.origViewBox.y + this.origViewBox.h - newH;

      newX = Math.max(minX, Math.min(maxX, newX));
      newY = Math.max(minY, Math.min(maxY, newY));

      this.currentViewBox = { x: newX, y: newY, w: newW, h: newH };
      this.svg.setAttribute('viewBox', `${newX} ${newY} ${newW} ${newH}`);

      if (this.onZoomChange) {
        this.onZoomChange(this.zoom);
      }
    }

    zoomIn() {
      this.setZoom(this.zoom * this.zoomStep);
    }

    zoomOut() {
      this.setZoom(this.zoom / this.zoomStep);
    }

    reset() {
      this.setZoom(1);
    }

    /**
     * 將 viewBox 置中到指定元素，並放大使其至少佔可視寬度的 1/6
     * @param {Element|string} elementOrSelector
     * @param {number} [customZoom]
     */
    focusOn(elementOrSelector, customZoom) {
      let el = elementOrSelector;
      if (typeof elementOrSelector === 'string') {
        el = this.svg.querySelector(`[data-region="${elementOrSelector}"], [data-structure="${elementOrSelector}"], #${elementOrSelector}, ${elementOrSelector}`)
          || document.querySelector(`[data-region="${elementOrSelector}"]`);
      }
      if (!el) return;

      let bbox;
      try {
        bbox = el.getBBox();
      } catch (_) {
        return;
      }
      if (!bbox || !bbox.width || !bbox.height) return;

      // 至少佔可視寬度的 1/6: visibleWidth <= bbox.width * 6
      // origW / zoom <= bbox.width * 6 ==> zoom >= origW / (bbox.width * 6)
      const requiredZoom = this.origViewBox.w / (bbox.width * 6);
      const targetZoom = customZoom ? Math.min(this.maxZoom, Math.max(1, customZoom)) : Math.min(this.maxZoom, Math.max(1, requiredZoom));

      let cx = bbox.x + bbox.width / 2;
      let cy = bbox.y + bbox.height / 2;

      try {
        const ctm = el.getCTM();
        const svgCtm = this.svg.getCTM();
        if (ctm && svgCtm && typeof this.svg.createSVGPoint === 'function') {
          const pt = this.svg.createSVGPoint();
          pt.x = cx;
          pt.y = cy;
          const screenPt = pt.matrixTransform(ctm);
          const svgPt = screenPt.matrixTransform(svgCtm.inverse());
          if (Number.isFinite(svgPt.x) && Number.isFinite(svgPt.y)) {
            cx = svgPt.x;
            cy = svgPt.y;
          }
        }
      } catch (_) {}

      this.setZoom(targetZoom, cx, cy);
    }

    _onPointerDown(e) {
      if (this.zoom <= 1) return;
      if (e.button !== undefined && e.button !== 0) return;

      this.isDragging = true;
      this.dragStart = { x: e.clientX, y: e.clientY };
      this.dragStartViewBox = { ...this.currentViewBox };
      this.dragMoved = 0;
      this.svg.style.cursor = 'grabbing';

      try {
        this.svg.setPointerCapture(e.pointerId);
      } catch (_) {}
    }

    _onPointerMove(e) {
      if (!this.isDragging) return;

      const dx = e.clientX - this.dragStart.x;
      const dy = e.clientY - this.dragStart.y;
      const dist = Math.hypot(dx, dy);

      if (dist > 4) {
        this.dragMoved = dist;
        this.shouldBlockClick = true;
      }

      const rect = this.svg.getBoundingClientRect();
      const scaleX = this.currentViewBox.w / (rect.width || 1);
      const scaleY = this.currentViewBox.h / (rect.height || 1);

      let newX = this.dragStartViewBox.x - (dx * scaleX);
      let newY = this.dragStartViewBox.y - (dy * scaleY);

      const minX = this.origViewBox.x;
      const maxX = this.origViewBox.x + this.origViewBox.w - this.currentViewBox.w;
      const minY = this.origViewBox.y;
      const maxY = this.origViewBox.y + this.origViewBox.h - this.currentViewBox.h;

      newX = Math.max(minX, Math.min(maxX, newX));
      newY = Math.max(minY, Math.min(maxY, newY));

      this.currentViewBox.x = newX;
      this.currentViewBox.y = newY;
      this.svg.setAttribute('viewBox', `${newX} ${newY} ${this.currentViewBox.w} ${this.currentViewBox.h}`);
    }

    _onPointerUp(e) {
      if (!this.isDragging) return;
      this.isDragging = false;
      this.svg.style.cursor = '';

      try {
        this.svg.releasePointerCapture(e.pointerId);
      } catch (_) {}

      // 如果有發生拖曳，在稍後的點擊事件攔截後清除旗標
      if (this.shouldBlockClick) {
        setTimeout(() => {
          this.shouldBlockClick = false;
        }, 150);
      }
    }

    _onClickCapture(e) {
      if (this.shouldBlockClick) {
        e.stopPropagation();
        e.stopImmediatePropagation();
        e.preventDefault();
        this.shouldBlockClick = false;
      }
    }

    _onWheel(e) {
      if (e.ctrlKey || this.zoom > 1) {
        e.preventDefault();
        const rect = this.svg.getBoundingClientRect();
        const scaleX = this.currentViewBox.w / (rect.width || 1);
        const scaleY = this.currentViewBox.h / (rect.height || 1);
        const svgX = this.currentViewBox.x + (e.clientX - rect.left) * scaleX;
        const svgY = this.currentViewBox.y + (e.clientY - rect.top) * scaleY;

        const delta = e.deltaY < 0 ? this.zoomStep : (1 / this.zoomStep);
        this.setZoom(this.zoom * delta, svgX, svgY);
      }
    }
  }

  root.SvgViewport = SvgViewport;
})(typeof window !== 'undefined' ? window : globalThis);
