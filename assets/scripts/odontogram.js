/* ================================================
   牙位圖產生器（Odontogram）— 結構化 SVG 模組
   每顆牙是一個 <g class="tooth" data-fdi="..">，含 .crown（牙冠）與 .root（牙根）
   點擊直接取得牙位，不需要任何座標換算
   ================================================ */

(function (global) {
  'use strict';

  const SVG_NS = 'http://www.w3.org/2000/svg';

  // 位置 1（中門牙）→ 8（第三大臼齒）的牙型、寬度與高度
  const PERMANENT_POSITIONS = {
    1: { type: 'incisor', name: '中門牙', w: 44, crown: 50, root: 72 },
    2: { type: 'incisor', name: '側門牙', w: 38, crown: 46, root: 66 },
    3: { type: 'canine', name: '犬齒', w: 42, crown: 52, root: 92 },
    4: { type: 'premolar', name: '第一小臼齒', w: 42, crown: 44, root: 72 },
    5: { type: 'premolar', name: '第二小臼齒', w: 42, crown: 44, root: 70 },
    6: { type: 'molar', name: '第一大臼齒', w: 56, crown: 42, root: 64 },
    7: { type: 'molar', name: '第二大臼齒', w: 54, crown: 41, root: 60 },
    8: { type: 'molar', name: '第三大臼齒（智齒）', w: 50, crown: 40, root: 54 }
  };

  const PRIMARY_POSITIONS = {
    1: { type: 'incisor', name: '乳中門牙', w: 40, crown: 40, root: 52 },
    2: { type: 'incisor', name: '乳側門牙', w: 34, crown: 37, root: 48 },
    3: { type: 'canine', name: '乳犬齒', w: 38, crown: 42, root: 62 },
    4: { type: 'molar', name: '第一乳臼齒', w: 48, crown: 36, root: 46 },
    5: { type: 'molar', name: '第二乳臼齒', w: 54, crown: 38, root: 48 }
  };

  const QUADRANTS = {
    1: { name: '右上', arch: 'upper', side: 'right' },
    2: { name: '左上', arch: 'upper', side: 'left' },
    3: { name: '左下', arch: 'lower', side: 'left' },
    4: { name: '右下', arch: 'lower', side: 'right' },
    5: { name: '右上', arch: 'upper', side: 'right' },
    6: { name: '左上', arch: 'upper', side: 'left' },
    7: { name: '左下', arch: 'lower', side: 'left' },
    8: { name: '右下', arch: 'lower', side: 'right' }
  };

  const TYPE_NAMES = { incisor: '門牙', canine: '犬齒', premolar: '小臼齒', molar: '臼齒' };

  /**
   * FDI → Universal 編號
   * 永久牙 1–32；乳牙 A–T
   */
  function toUniversal(fdi) {
    const q = Math.floor(fdi / 10);
    const p = fdi % 10;
    if (q === 1) return String(9 - p);
    if (q === 2) return String(8 + p);
    if (q === 3) return String(25 - p);
    if (q === 4) return String(24 + p);
    const letters = 'ABCDEFGHIJKLMNOPQRST';
    if (q === 5) return letters[5 - p];
    if (q === 6) return letters[4 + p];
    if (q === 7) return letters[15 - p];
    if (q === 8) return letters[14 + p];
    return '';
  }

  /**
   * 牙冠路徑（上顎方向：y=0 為咬合面，往負方向是牙頸部）
   */
  function crownPath(type, w, H) {
    const x = f => (f * w).toFixed(1);
    const y = f => (-f * H).toFixed(1);
    const top = `M ${x(0.14)} ${y(1)} L ${x(0.86)} ${y(1)}`;
    const rightSide = `C ${x(1.02)} ${y(0.62)} ${x(1.0)} ${y(0.32)}`;
    const leftSide = `C ${x(0)} ${y(0.32)} ${x(-0.02)} ${y(0.62)} ${x(0.14)} ${y(1)} Z`;

    switch (type) {
      case 'incisor':
        return `${top} ${rightSide} ${x(0.94)} ${y(0.04)} Q ${x(0.5)} ${y(-0.03)} ${x(0.06)} ${y(0.04)} ${leftSide}`;
      case 'canine':
        return `${top} ${rightSide} ${x(0.88)} ${y(0.2)} L ${x(0.5)} ${y(-0.02)} L ${x(0.12)} ${y(0.2)} ${leftSide}`;
      case 'premolar':
        return `${top} ${rightSide} ${x(0.95)} ${y(0.2)} Q ${x(0.74)} ${y(-0.08)} ${x(0.5)} ${y(0.1)} Q ${x(0.26)} ${y(-0.08)} ${x(0.05)} ${y(0.2)} ${leftSide}`;
      case 'molar':
      default:
        return `${top} ${rightSide} ${x(0.97)} ${y(0.2)} Q ${x(0.83)} ${y(-0.07)} ${x(0.66)} ${y(0.1)} Q ${x(0.5)} ${y(-0.07)} ${x(0.34)} ${y(0.1)} Q ${x(0.17)} ${y(-0.07)} ${x(0.03)} ${y(0.2)} ${leftSide}`;
    }
  }

  /**
   * 牙根路徑（從牙頸部 y=-H 往上延伸 R）
   */
  function rootPath(type, w, H, R) {
    const x = f => (f * w).toFixed(1);
    const y = f => (-H - f * R).toFixed(1);
    if (type === 'molar') {
      return `M ${x(0.08)} ${y(0)} C ${x(0.04)} ${y(0.55)} ${x(0.12)} ${y(1)} ${x(0.25)} ${y(1)} ` +
        `C ${x(0.36)} ${y(1)} ${x(0.4)} ${y(0.7)} ${x(0.43)} ${y(0.5)} ` +
        `Q ${x(0.5)} ${y(0.4)} ${x(0.57)} ${y(0.5)} ` +
        `C ${x(0.6)} ${y(0.7)} ${x(0.64)} ${y(1)} ${x(0.75)} ${y(1)} ` +
        `C ${x(0.88)} ${y(1)} ${x(0.96)} ${y(0.55)} ${x(0.92)} ${y(0)} Z`;
    }
    const inset = type === 'incisor' ? 0.2 : 0.16;
    return `M ${x(inset)} ${y(0)} C ${x(inset + 0.02)} ${y(0.62)} ${x(0.4)} ${y(1)} ${x(0.5)} ${y(1)} ` +
      `C ${x(0.6)} ${y(1)} ${x(1 - inset - 0.02)} ${y(0.62)} ${x(1 - inset)} ${y(0)} Z`;
  }

  function el(name, attrs = {}, parent = null) {
    const node = document.createElementNS(SVG_NS, name);
    Object.entries(attrs).forEach(([k, v]) => node.setAttribute(k, v));
    if (parent) parent.appendChild(node);
    return node;
  }

  /**
   * 建立一顆牙齒的描述資料
   */
  function describeTooth(fdi, positions, names = {}) {
    const q = Math.floor(fdi / 10);
    const p = fdi % 10;
    const pos = positions[p];
    const quad = QUADRANTS[q];
    const custom = names[fdi] || {};
    const nameZh = custom.nameZh || `${quad.name}${pos.name}`;
    const nameEn = custom.name || custom.nameEn || '';
    return {
      fdi,
      universal: toUniversal(fdi),
      quadrant: q,
      arch: quad.arch,
      side: quad.side,
      type: pos.type,
      typeName: TYPE_NAMES[pos.type],
      nameZh,
      nameEn,
      primary: q >= 5
    };
  }

  /**
   * 繪製牙位圖
   * @param {HTMLElement} container - 放置 SVG 的容器
   * @param {object} options
   * @param {'permanent'|'primary'} options.dentition - 永久牙或乳牙
   * @param {object} options.names - 客製化名稱對應表 { [fdi]: { nameZh, name, nameEn } }
   * @param {function} options.onSelect - 選取牙齒時的回呼，參數為牙齒描述資料
   * @returns {{svg: SVGElement, teeth: object[], select: function, setCondition: function, setRecords: function}}
   */
  function render(container, options = {}) {
    const dentition = options.dentition || 'permanent';
    const primary = dentition === 'primary';
    const positions = primary ? PRIMARY_POSITIONS : PERMANENT_POSITIONS;
    const count = primary ? 5 : 8;
    const quads = primary ? [5, 6, 7, 8] : [1, 2, 3, 4];
    const customNames = options.names || {};

    const gap = primary ? 8 : 6;
    const midGap = primary ? 30 : 24;
    const halfWidth = Object.values(positions).reduce((s, p) => s + p.w, 0) + gap * (count - 1);
    const VB_W = 960;
    const VB_H = primary ? 400 : 500;
    const startX = (VB_W - (halfWidth * 2 + midGap)) / 2;
    const upperOcc = primary ? 185 : 238;
    const lowerOcc = primary ? 215 : 272;

    container.textContent = '';
    const svg = el('svg', {
      viewBox: `0 0 ${VB_W} ${VB_H}`,
      class: 'odontogram',
      role: 'group',
      'aria-label': primary ? '乳牙牙位圖' : '永久牙牙位圖'
    }, container);

    // 參考線：中線與咬合平面
    const midX = VB_W / 2;
    el('line', { x1: midX, y1: 30, x2: midX, y2: VB_H - 30, class: 'guide guide--mid' }, svg);
    el('line', { x1: startX - 20, y1: (upperOcc + lowerOcc) / 2, x2: VB_W - startX + 20, y2: (upperOcc + lowerOcc) / 2, class: 'guide' }, svg);

    // 象限標籤
    const qLabel = (text, x, y, anchor) => {
      const t = el('text', { x, y, class: 'quadrant-label', 'text-anchor': anchor }, svg);
      t.textContent = text;
    };
    qLabel(`${QUADRANTS[quads[0]].name}（${quads[0]}）`, startX, 24, 'start');
    qLabel(`${QUADRANTS[quads[1]].name}（${quads[1]}）`, VB_W - startX, 24, 'end');
    qLabel(`${QUADRANTS[quads[3]].name}（${quads[3]}）`, startX, VB_H - 10, 'start');
    qLabel(`${QUADRANTS[quads[2]].name}（${quads[2]}）`, VB_W - startX, VB_H - 10, 'end');

    const teeth = [];
    const nodes = new Map();

    // 依觀看者視角：患者右側在左邊
    const rows = [
      { arch: 'upper', occ: upperOcc, left: quads[0], right: quads[1] },
      { arch: 'lower', occ: lowerOcc, left: quads[3], right: quads[2] }
    ];

    rows.forEach(row => {
      const order = [];
      for (let p = count; p >= 1; p--) order.push(row.left * 10 + p);
      for (let p = 1; p <= count; p++) order.push(row.right * 10 + p);

      let cursor = startX;
      order.forEach((fdi, i) => {
        if (i === count) cursor += midGap - gap;
        const info = describeTooth(fdi, positions, customNames);
        const pos = positions[fdi % 10];
        const flip = row.arch === 'lower' ? ' scale(1,-1)' : '';

        const g = el('g', {
          class: 'tooth',
          'data-fdi': fdi,
          'data-universal': info.universal,
          tabindex: 0,
          role: 'button',
          'aria-label': `${info.nameZh}，FDI ${fdi}，Universal ${info.universal}`,
          'aria-pressed': 'false'
        }, svg);

        const shape = el('g', { transform: `translate(${cursor.toFixed(1)} ${row.occ})${flip}` }, g);
        // 透明點擊區：涵蓋整顆牙（含牙根之間的空隙），避免點到背景
        el('rect', { x: -gap / 2, y: -(pos.crown + pos.root), width: pos.w + gap, height: pos.crown + pos.root, class: 'hit' }, shape);
        el('path', { d: rootPath(pos.type, pos.w, pos.crown, pos.root), class: 'root' }, shape);
        el('path', { d: crownPath(pos.type, pos.w, pos.crown), class: 'crown' }, shape);
        // 缺牙標記（預設隱藏）
        const cx = pos.w / 2;
        const midY = -(pos.crown + pos.root) / 2;
        el('path', {
          d: `M ${cx - 16} ${midY - 16} L ${cx + 16} ${midY + 16} M ${cx + 16} ${midY - 16} L ${cx - 16} ${midY + 16}`,
          class: 'missing-mark'
        }, shape);

        // 牙位編號（放在牙根外側）
        const labelY = row.arch === 'upper'
          ? row.occ - pos.crown - pos.root - 10
          : row.occ + pos.crown + pos.root + 20;
        const label = el('text', { x: (cursor + pos.w / 2).toFixed(1), y: labelY, class: 'tooth-label', 'text-anchor': 'middle' }, g);
        label.textContent = fdi;

        teeth.push(info);
        nodes.set(fdi, g);
        cursor += pos.w + gap;
      });
    });

    let selected = null;
    function select(fdi) {
      if (selected !== null && nodes.has(selected)) {
        nodes.get(selected).classList.remove('is-selected');
        nodes.get(selected).setAttribute('aria-pressed', 'false');
      }
      selected = fdi;
      const node = nodes.get(fdi);
      if (!node) return;
      node.classList.add('is-selected');
      node.setAttribute('aria-pressed', 'true');
      if (typeof options.onSelect === 'function') {
        options.onSelect(teeth.find(t => t.fdi === fdi));
      }
    }

    // 事件委派：點擊目標往上找到 .tooth，直接讀 data-fdi
    svg.addEventListener('click', e => {
      const tooth = e.target.closest('.tooth');
      if (tooth) select(Number(tooth.dataset.fdi));
    });
    svg.addEventListener('keydown', e => {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      const tooth = e.target.closest('.tooth');
      if (tooth) {
        e.preventDefault();
        select(Number(tooth.dataset.fdi));
      }
    });

    /**
     * 標示牙齒狀態（以 class 呈現，顏色由 CSS 決定）
     * @param {number} fdi
     * @param {'caries'|'root-canal'|'missing'|null} condition
     */
    function setCondition(fdi, condition) {
      const node = nodes.get(fdi);
      if (!node) return;
      node.classList.remove('has-caries', 'has-root-canal', 'is-missing');
      if (condition === 'caries') node.classList.add('has-caries');
      if (condition === 'root-canal') node.classList.add('has-root-canal');
      if (condition === 'missing') node.classList.add('is-missing');
    }

    /**
     * 設定牙齒病歷標記與筆數
     * @param {Record<number, number>} countByFdi - FDI 對應的病歷筆數字典
     */
    function setRecords(countByFdi = {}) {
      nodes.forEach((node, fdi) => {
        const count = countByFdi[fdi] || 0;
        const info = teeth.find(t => t.fdi === fdi);
        const baseAria = info ? `${info.nameZh}，FDI ${fdi}，Universal ${info.universal}` : `FDI ${fdi}`;

        // 移除舊的筆數標籤
        const oldBadge = node.querySelector('.tooth-record-badge');
        if (oldBadge) oldBadge.remove();

        if (count > 0) {
          node.classList.add('has-record');
          node.setAttribute('data-record-count', String(count));
          node.setAttribute('aria-label', `${baseAria}，${count} 筆病歷`);

          // 在 tooth-label 旁邊加上筆數文字
          const label = node.querySelector('.tooth-label');
          if (label) {
            const lx = parseFloat(label.getAttribute('x'));
            const ly = parseFloat(label.getAttribute('y'));
            const badge = el('text', {
              x: (lx + 14).toFixed(1),
              y: ly.toFixed(1),
              class: 'tooth-record-badge',
              'text-anchor': 'start'
            }, node);
            badge.textContent = `(${count})`;
          }
        } else {
          node.classList.remove('has-record');
          node.removeAttribute('data-record-count');
          node.setAttribute('aria-label', baseAria);
        }
      });
    }

    return { svg, teeth, select, setCondition, setRecords };
  }

  global.Odontogram = { render, toUniversal };
})(typeof window !== 'undefined' ? window : this);
