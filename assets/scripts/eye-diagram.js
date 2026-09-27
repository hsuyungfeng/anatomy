/* ================================================
   眼睛結構圖產生器 — 結構化 SVG
   左：眼球矢狀剖面（前方在左）；右下：正面小圖（淚器）
   每個結構是 <g class="structure" data-structure="cornea">，點擊直接取得結構
   ================================================ */

(function (global) {
  'use strict';

  const SVG_NS = 'http://www.w3.org/2000/svg';

  // 結構定義：key → 中英文名稱與既有病歷使用的 ID 規則
  // sided: true 代表既有資料有分左右（left-eye-cornea / right-eye-cornea）
  const STRUCTURES = {
    cornea: { nameZh: '角膜', nameEn: 'Cornea', sided: true },
    'anterior-chamber': { nameZh: '前房', nameEn: 'Anterior chamber', isNew: true },
    iris: { nameZh: '虹膜', nameEn: 'Iris', sided: true },
    'dilator-pupillae': { nameZh: '瞳孔擴張肌', nameEn: 'Dilator pupillae', id: 'eye-dilator-pupillae' },
    pupil: { nameZh: '瞳孔', nameEn: 'Pupil', id: 'eye-pupil' },
    lens: { nameZh: '水晶體', nameEn: 'Lens', sided: true },
    'ciliary-body': { nameZh: '睫狀體', nameEn: 'Ciliary body', id: 'eye-ciliary-body' },
    'ciliary-muscle': { nameZh: '睫狀肌', nameEn: 'Ciliary muscle', id: 'eye-ciliary-muscle' },
    sclera: { nameZh: '鞏膜', nameEn: 'Sclera', id: 'eye-sclera' },
    conjunctiva: { nameZh: '結膜', nameEn: 'Conjunctiva', isNew: true },
    choroid: { nameZh: '脈絡膜', nameEn: 'Choroid', id: 'eye-choroid' },
    retina: { nameZh: '視網膜', nameEn: 'Retina', sided: true },
    macula: { nameZh: '黃斑部', nameEn: 'Macula', isNew: true },
    'optic-disc': { nameZh: '視神經盤', nameEn: 'Optic disc', isNew: true },
    vitreous: { nameZh: '玻璃體', nameEn: 'Vitreous body', id: 'eye-vitreous' },
    'hyaloid-canal': { nameZh: '玻璃體管', nameEn: 'Hyaloid canal', id: 'eye-vitreous-hyaloid' },
    'optic-nerve': { nameZh: '視神經', nameEn: 'Optic nerve', id: 'eye-optic-nerve' },
    vessels: { nameZh: '視網膜中央血管', nameEn: 'Central retinal vessels', id: 'eye-blood-vessels' },
    'extraocular-muscles': { nameZh: '眼外肌', nameEn: 'Extraocular muscles', id: 'eye-extraocular-muscles' },
    eyelid: { nameZh: '眼瞼', nameEn: 'Eyelid', isNew: true },
    'lacrimal-gland': { nameZh: '淚腺', nameEn: 'Lacrimal gland', sided: true, legacyKey: 'lacrimal' },
    'nasolacrimal-duct': { nameZh: '鼻淚管', nameEn: 'Nasolacrimal duct', id: 'eye-nasolacrimal-duct' }
  };

  /**
   * 取得病歷用的結構 ID（與既有資料相容）
   * @param {string} key - 結構 key
   * @param {'right'|'left'} side - 右眼 OD／左眼 OS
   */
  function recordId(key, side) {
    const s = STRUCTURES[key];
    if (!s) return `eye-${key}`;
    if (s.sided) return `${side}-eye-${s.legacyKey || key}`;
    if (s.id) return s.id;
    return `eye-${key}`;
  }

  function el(name, attrs = {}, parent = null) {
    const node = document.createElementNS(SVG_NS, name);
    Object.entries(attrs).forEach(([k, v]) => node.setAttribute(k, v));
    if (parent) parent.appendChild(node);
    return node;
  }

  const rad = d => (d * Math.PI) / 180;
  const f = n => n.toFixed(1);

  // 極座標 → SVG 座標（角度為數學角度，0° 朝右、逆時針為正）
  function pt(cx, cy, r, deg) {
    return [cx + r * Math.cos(rad(deg)), cy - r * Math.sin(rad(deg))];
  }

  /**
   * 環形扇區：半徑 r1（外）到 r2（內），角度 a1 → a2（逆時針）
   */
  function ring(cx, cy, r1, r2, a1, a2) {
    const span = ((a2 - a1) % 360 + 360) % 360;
    const large = span > 180 ? 1 : 0;
    const [x1, y1] = pt(cx, cy, r1, a1);
    const [x2, y2] = pt(cx, cy, r1, a2);
    const [x3, y3] = pt(cx, cy, r2, a2);
    const [x4, y4] = pt(cx, cy, r2, a1);
    return `M ${f(x1)} ${f(y1)} A ${r1} ${r1} 0 ${large} 0 ${f(x2)} ${f(y2)} ` +
      `L ${f(x3)} ${f(y3)} A ${r2} ${r2} 0 ${large} 1 ${f(x4)} ${f(y4)} Z`;
  }

  /**
   * 繪製眼睛結構圖
   * @param {HTMLElement} container
   * @param {object} options
   * @param {'right'|'left'} [options.side='right'] - 右眼（OD）或左眼（OS）
   * @param {object} [options.names] - 自訂中英文名稱覆寫表 { [key]: { nameZh, nameEn } }
   * @param {function} [options.onSelect] - 參數 { key, recordId, nameZh, nameEn, side, isNew }
   */
  function render(container, options = {}) {
    const side = options.side || 'right';
    const names = options.names || {};
    container.textContent = '';

    const lang = options.lang || (window.I18N ? window.I18N.lang() : 'zh');
    const svgAria = options.ariaLabel || (lang === 'en'
      ? `${side === 'right' ? 'Right Eye (OD)' : 'Left Eye (OS)'} Anatomy Diagram`
      : `${side === 'right' ? '右眼' : '左眼'}結構圖`);

    const svg = el('svg', {
      viewBox: '0 0 1000 560',
      class: 'eye-diagram',
      role: 'group',
      'aria-label': svgAria
    });
    container.appendChild(svg);

    const groups = new Map();
    function group(key, parent = svg) {
      if (groups.has(key)) {
        // 同一結構在兩個位置出現（例如上下眼外肌、剖面與正面的虹膜）
        const g = el('g', { class: 'structure', 'data-structure': key }, parent);
        groups.get(key).push(g);
        return g;
      }
      const s = STRUCTURES[key] || { nameZh: key, nameEn: key };
      const nameZh = names[key]?.nameZh || s.nameZh;
      const nameEn = names[key]?.nameEn || s.nameEn;
      const structureAria = lang === 'en' ? nameEn : `${nameZh}（${nameEn}）`;
      const g = el('g', {
        class: 'structure',
        'data-structure': key,
        'data-record-id': recordId(key, side),
        tabindex: 0,
        role: 'button',
        'aria-label': structureAria,
        'aria-pressed': 'false'
      }, parent);
      groups.set(key, [g]);
      return g;
    }

    // ---------- 矢狀剖面 ----------
    const cx = 360;
    const cy = 280;
    const R = 180;
    const section = el('g', { class: 'section' }, svg);

    // 眼外肌（上直肌、下直肌）：沿鞏膜外側，往後方延伸
    [1, -1].forEach(dir => {
      const g = group('extraocular-muscles', section);
      const [ax, ay] = pt(cx, cy, R + 2, dir * 118);
      const [bx, by] = pt(cx, cy, R + 2, dir * 62);
      const [ox, oy] = pt(cx, cy, R + 20, dir * 70);
      const [ix, iy] = pt(cx, cy, R + 14, dir * 115);
      el('path', {
        d: `M ${f(ax)} ${f(ay)} A ${R + 2} ${R + 2} 0 0 ${dir > 0 ? 0 : 1} ${f(bx)} ${f(by)} ` +
          `Q ${f(cx + 230)} ${f(cy - dir * 120)} ${f(cx + 330)} ${f(cy - dir * 70)} ` +
          `L ${f(cx + 334)} ${f(cy - dir * 88)} Q ${f(cx + 240)} ${f(cy - dir * 150)} ${f(ox)} ${f(oy)} ` +
          `A ${R + 20} ${R + 20} 0 0 ${dir > 0 ? 1 : 0} ${f(ix)} ${f(iy)} Z`,
        class: 'fill-muscle'
      }, g);
    });

    // 視神經（後方偏鼻側）與中央血管
    const nerveAngle = -10;
    const [n1x, n1y] = pt(cx, cy, R - 4, nerveAngle + 7);
    const [n2x, n2y] = pt(cx, cy, R - 4, nerveAngle - 7);
    const nerve = group('optic-nerve', section);
    el('path', {
      d: `M ${f(n1x)} ${f(n1y)} C ${f(n1x + 60)} ${f(n1y - 4)} ${f(n1x + 120)} ${f(n1y - 2)} ${f(cx + 340)} ${f(n1y + 4)} ` +
        `L ${f(cx + 340)} ${f(n2y - 4)} C ${f(n2x + 120)} ${f(n2y + 2)} ${f(n2x + 60)} ${f(n2y + 4)} ${f(n2x)} ${f(n2y)} Z`,
      class: 'fill-nerve'
    }, nerve);

    const vessels = group('vessels', section);
    const midY = (n1y + n2y) / 2;
    [[-5, 'fill-artery'], [5, 'fill-vein']].forEach(([dy, cls]) => {
      const d = `M ${f(cx + R - 36)} ${f(midY + dy * 0.6)} L ${f(cx + 338)} ${f(midY + dy)}`;
      el('path', { d, class: 'vessel-hit' }, vessels);
      el('path', { d, class: `vessel ${cls}` }, vessels);
    });

    // 鞏膜：留出前方角膜開口（180° ± 34°）
    el('path', { d: ring(cx, cy, R, R - 12, -146, 146), class: 'fill-sclera' }, group('sclera', section));

    // 結膜：覆蓋前段鞏膜外側
    const conj = group('conjunctiva', section);
    el('path', { d: ring(cx, cy, R + 5, R, 108, 146), class: 'fill-conjunctiva' }, conj);
    el('path', { d: ring(cx, cy, R + 5, R, -146, -108), class: 'fill-conjunctiva' }, conj);

    // 脈絡膜、視網膜
    el('path', { d: ring(cx, cy, R - 12, R - 21, -130, 130), class: 'fill-choroid' }, group('choroid', section));
    el('path', { d: ring(cx, cy, R - 21, R - 31, -126, 126), class: 'fill-retina' }, group('retina', section));

    // 玻璃體（視網膜內側的空間）
    const vit = group('vitreous', section);
    el('path', {
      d: `M ${f(pt(cx, cy, R - 31, 126)[0])} ${f(pt(cx, cy, R - 31, 126)[1])} ` +
        `A ${R - 31} ${R - 31} 0 1 1 ${f(pt(cx, cy, R - 31, -126)[0])} ${f(pt(cx, cy, R - 31, -126)[1])} ` +
        `C ${f(cx - 95)} ${f(cy + 70)} ${f(cx - 95)} ${f(cy - 70)} ${f(pt(cx, cy, R - 31, 126)[0])} ${f(pt(cx, cy, R - 31, 126)[1])} Z`,
      class: 'fill-vitreous'
    }, vit);

    // 玻璃體管：從視神經盤到水晶體後方
    const [dx, dy] = pt(cx, cy, R - 31, nerveAngle);
    const hyaloid = group('hyaloid-canal', section);
    el('path', {
      d: `M ${f(cx - 74)} ${f(cy - 7)} C ${f(cx + 20)} ${f(cy - 9)} ${f(dx - 70)} ${f(dy - 8)} ${f(dx - 4)} ${f(dy - 7)} ` +
        `L ${f(dx - 4)} ${f(dy + 7)} C ${f(dx - 70)} ${f(dy + 8)} ${f(cx + 20)} ${f(cy + 9)} ${f(cx - 74)} ${f(cy + 7)} Z`,
      class: 'fill-hyaloid'
    }, hyaloid);

    // 視神經盤與黃斑部（視網膜上的小區域）
    el('path', { d: ring(cx, cy, R - 19, R - 33, nerveAngle - 6, nerveAngle + 6), class: 'fill-disc' }, group('optic-disc', section));
    const [mx, my] = pt(cx, cy, R - 27, 8);
    el('ellipse', { cx: f(mx), cy: f(my), rx: 7, ry: 11, class: 'fill-macula' }, group('macula', section));

    // 睫狀體與睫狀肌（上、下）
    [1, -1].forEach(dir => {
      const a1 = dir > 0 ? 130 : -146;
      const a2 = dir > 0 ? 146 : -130;
      el('path', { d: ring(cx, cy, R - 12, R - 22, a1, a2), class: 'fill-ciliary-muscle' }, group('ciliary-muscle', section));
      const [p1x, p1y] = pt(cx, cy, R - 22, dir > 0 ? 146 : -146);
      const [p2x, p2y] = pt(cx, cy, R - 22, dir > 0 ? 128 : -128);
      el('path', {
        d: `M ${f(p1x)} ${f(p1y)} L ${f(p2x)} ${f(p2y)} Q ${f(cx - 96)} ${f(cy - dir * 96)} ${f(cx - 104)} ${f(cy - dir * 74)} ` +
          `Q ${f(cx - 128)} ${f(cy - dir * 92)} ${f(p1x)} ${f(p1y)} Z`,
        class: 'fill-ciliary'
      }, group('ciliary-body', section));
    });

    // 水晶體
    el('ellipse', { cx: cx - 100, cy, rx: 28, ry: 64, class: 'fill-lens' }, group('lens', section));

    // 虹膜（上下兩片）＋瞳孔擴張肌（虹膜後側薄層）＋瞳孔（中間開口）
    const irisX = cx - 138;
    [[cy - 96, cy - 20], [cy + 20, cy + 96]].forEach(([y1, y2]) => {
      el('rect', { x: irisX, y: y1, width: 11, height: y2 - y1, rx: 3, class: 'fill-iris' }, group('iris', section));
      el('rect', { x: irisX + 11, y: y1 + 6, width: 5, height: y2 - y1 - 12, rx: 2, class: 'fill-dilator' }, group('dilator-pupillae', section));
    });
    el('rect', { x: irisX - 2, y: cy - 20, width: 20, height: 40, class: 'fill-pupil' }, group('pupil', section));

    // 角膜與前房
    const [l1x, l1y] = pt(cx, cy, R, 146);
    const [l2x, l2y] = pt(cx, cy, R, -146);
    const halfChord = (l2y - l1y) / 2;
    const rc = 118;
    const ccx = l1x + Math.sqrt(rc * rc - halfChord * halfChord);
    const rci = rc - 9;
    const innerX = l1x + 8;
    const innerHalf = Math.sqrt(rci * rci - (ccx - innerX) * (ccx - innerX));
    el('path', {
      d: `M ${f(innerX)} ${f(cy - innerHalf)} A ${rci} ${rci} 0 0 0 ${f(innerX)} ${f(cy + innerHalf)} ` +
        `L ${f(irisX)} ${f(cy + 96)} L ${f(irisX)} ${f(cy - 96)} Z`,
      class: 'fill-chamber'
    }, group('anterior-chamber', section));
    el('path', {
      d: `M ${f(l1x)} ${f(l1y)} A ${rc} ${rc} 0 0 0 ${f(l2x)} ${f(l2y)} L ${f(innerX)} ${f(cy + innerHalf)} ` +
        `A ${rci} ${rci} 0 0 1 ${f(innerX)} ${f(cy - innerHalf)} Z`,
      class: 'fill-cornea'
    }, group('cornea', section));

    // 眼瞼（上、下）
    [1, -1].forEach(dir => {
      const tipY = cy - dir * 40;
      el('path', {
        d: `M ${f(l1x + 8)} ${f(cy - dir * 150)} C ${f(l1x - 70)} ${f(cy - dir * 150)} ${f(l1x - 96)} ${f(cy - dir * 88)} ${f(l1x - 92)} ${f(tipY)} ` +
          `L ${f(l1x - 76)} ${f(tipY)} C ${f(l1x - 76)} ${f(cy - dir * 96)} ${f(l1x - 44)} ${f(cy - dir * 132)} ${f(l1x + 10)} ${f(cy - dir * 132)} Z`,
        class: 'fill-eyelid'
      }, group('eyelid', section));
    });

    // 剖面方向標示
    const labels = options.labels || {};
    const label = (text, x, y, anchor = 'middle') => {
      const t = el('text', { x, y, class: 'axis-label', 'text-anchor': anchor }, svg);
      t.textContent = text;
    };
    const defaultAnterior = lang === 'en' ? 'Front (Cornea)' : '前（角膜側）';
    const defaultPosterior = lang === 'en' ? 'Back (Optic Nerve)' : '後（視神經側）';
    label(labels.anterior || defaultAnterior, 110, 40, 'start');
    label(labels.posterior || defaultPosterior, 700, 40, 'end');

    // ---------- 正面小圖：淚器 ----------
    const inset = el('g', { class: 'inset', transform: 'translate(740 330)' }, svg);
    el('rect', { x: 0, y: 0, width: 240, height: 210, rx: 10, class: 'inset-frame' }, inset);
    const insetTitle = el('text', { x: 12, y: 22, class: 'axis-label' }, inset);
    const defaultFrontTitle = lang === 'en'
      ? `Front (${side === 'right' ? 'Right Eye OD' : 'Left Eye OS'})`
      : `正面（${side === 'right' ? '右眼 OD' : '左眼 OS'}）`;
    const frontLabel = side === 'right'
      ? (labels.frontOD || labels.front || defaultFrontTitle)
      : (labels.frontOS || labels.front || defaultFrontTitle);
    insetTitle.textContent = frontLabel;

    // 觀看者視角：右眼的外側（顳側）在畫面左邊，左眼則相反
    const mirror = side === 'right' ? '' : 'translate(240 0) scale(-1 1)';
    const face = el('g', { transform: mirror }, inset);
    el('path', { d: 'M 40 100 Q 120 44 200 100 Q 120 150 40 100 Z', class: 'fill-sclera-front' }, face);
    el('circle', { cx: 120, cy: 99, r: 27, class: 'fill-iris' }, group('iris', face));
    el('circle', { cx: 120, cy: 99, r: 10, class: 'fill-pupil' }, group('pupil', face));
    el('path', { d: 'M 36 66 C 40 44 76 40 92 54 C 80 66 56 72 36 66 Z', class: 'fill-gland' }, group('lacrimal-gland', face));
    el('path', {
      d: 'M 196 92 C 206 90 212 96 212 106 L 214 178 C 214 186 204 186 204 178 L 202 110 C 200 104 198 100 196 100 Z',
      class: 'fill-duct'
    }, group('nasolacrimal-duct', face));
    el('path', { d: 'M 34 60 Q 120 20 206 60', class: 'brow' }, face);

    // ---------- 互動 ----------
    let selected = null;
    function select(key) {
      if (selected && groups.has(selected)) {
        groups.get(selected).forEach(g => {
          g.classList.remove('is-selected');
          g.setAttribute('aria-pressed', 'false');
        });
      }
      selected = key;
      const list = groups.get(key);
      if (!list) return;
      list.forEach(g => {
        g.classList.add('is-selected');
        if (g.hasAttribute('tabindex')) g.setAttribute('aria-pressed', 'true');
      });
      const s = STRUCTURES[key] || { nameZh: key, nameEn: key };
      const nameZh = names[key]?.nameZh || s.nameZh;
      const nameEn = names[key]?.nameEn || s.nameEn;
      if (typeof options.onSelect === 'function') {
        options.onSelect({
          key,
          recordId: recordId(key, side),
          nameZh,
          nameEn,
          side,
          isNew: !!s.isNew
        });
      }
    }

    svg.addEventListener('click', e => {
      const g = e.target.closest('.structure');
      if (g && g.dataset.structure) select(g.dataset.structure);
    });
    svg.addEventListener('keydown', e => {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      const g = e.target.closest('.structure');
      if (g && g.dataset.structure) {
        e.preventDefault();
        select(g.dataset.structure);
      }
    });
    // 同一結構的多個區塊一起高亮
    svg.addEventListener('pointerover', e => {
      const g = e.target.closest('.structure');
      svg.querySelectorAll('.structure.is-hover').forEach(n => n.classList.remove('is-hover'));
      if (g && g.dataset.structure && groups.has(g.dataset.structure)) {
        groups.get(g.dataset.structure).forEach(n => n.classList.add('is-hover'));
      }
    });
    svg.addEventListener('pointerleave', () => {
      svg.querySelectorAll('.structure.is-hover').forEach(n => n.classList.remove('is-hover'));
    });

    function setRecords(countByKey) {
      groups.forEach((list, key) => {
        const n = countByKey[key] || 0;
        list.forEach(g => {
          g.classList.toggle('has-record', n > 0);
          if (n > 0) {
            g.setAttribute('data-record-count', String(n));
          } else {
            g.removeAttribute('data-record-count');
          }
        });
      });
    }

    return { svg, select, setRecords, structures: Object.keys(STRUCTURES) };
  }

  const exportObj = { render, recordId, STRUCTURES };
  (typeof window !== 'undefined' ? window : global).EyeDiagram = exportObj;
})(typeof window !== 'undefined' ? window : globalThis);
