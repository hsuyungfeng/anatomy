/* ================================================
   身體部位圖產生器 — 結構化 SVG 原型（寫實輪廓版）
   以平滑的人體輪廓當作 clipPath，再把輪廓內切分成 58 個子部位
   每個子部位是 <g class="region" data-region="arm-r">，ID 與 data/body-systems.json 一致
   ================================================ */

(function (global) {
  'use strict';

  const SVG_NS = 'http://www.w3.org/2000/svg';

  const NAMES = {
    'head-forehead': '前額', 'head-eyebrow': '左眉毛', 'head-eyebrow-r': '右眉毛',
    'head-eye': '左眼', 'head-eye-r': '右眼', 'head-ear': '左耳', 'head-ear-r': '右耳',
    'head-nose': '鼻子', 'head-cheek': '左臉頰', 'head-cheek-r': '右臉頰', 'head-lips': '嘴唇', 'head-chin': '下巴',
    head: '頭部', neck: '頸部', 'neck-nape': '後頸', back: '背部',
    chest: '胸', 'chest-breast': '左乳房', 'chest-breast-r': '右乳房',
    'abdomen-upper': '上腹', abdomen: '腹部', 'abdomen-umbilical': '肚臍',
    'groin-mons': '恥丘', groin: '腹股溝', 'groin-vulva': '外陰', 'groin-penis': '陰莖', 'groin-scrotum': '陰囊',
    'shoulder-l': '左肩', 'axilla-l': '左腋下', 'arm-l': '左上臂', 'elbow-l': '左手肘', 'forearm-l': '左前臂',
    'wrist-l': '左手腕', 'hand-l': '左手', 'fingers-l': '左手指',
    'shoulder-r': '右肩', 'axilla-r': '右腋下', 'arm-r': '右上臂', 'elbow-r': '右手肘', 'forearm-r': '右前臂',
    'wrist-r': '右手腕', 'hand-r': '右手', 'fingers-r': '右手指',
    'hip-l': '左髖', 'buttock-l': '左臀部', 'thigh-l': '左大腿', 'knee-l': '左膝蓋', 'leg-l': '左小腿',
    'ankle-l': '左腳踝', 'foot-l': '左腳', 'heel-l': '左腳跟',
    'hip-r': '右髖', 'buttock-r': '右臀部', 'thigh-r': '右大腿', 'knee-r': '右膝蓋', 'leg-r': '右小腿',
    'ankle-r': '右腳踝', 'foot-r': '右腳', 'heel-r': '右腳跟'
  };

  const f = n => n.toFixed(1);

  function el(name, attrs = {}, parent = null) {
    const node = document.createElementNS(SVG_NS, name);
    Object.entries(attrs).forEach(([k, v]) => node.setAttribute(k, v));
    if (parent) parent.appendChild(node);
    return node;
  }

  /**
   * 人體右半邊輪廓（x 為距中線的偏移，y 由上往下），從頭頂沿外側繞到胯下
   */
  function halfOutline(sex) {
    const male = sex === 'male';
    const sh = male ? 7 : 0;       // 男性肩寬
    const hp = male ? -2 : 5;      // 女性骨盆較寬
    const wa = male ? 2 : -3;      // 女性腰較細
    return [
      [0, 16], [22, 20], [35, 36], [39, 58], [37, 80], [32, 98], [24, 110], [14, 118],
      [13, 126], [15, 138],
      [32 + sh * 0.5, 146], [54 + sh, 152], [70 + sh, 160], [78 + sh, 176],
      [81 + sh, 202], [82 + sh * 0.6, 232], [81, 258], [80, 272],
      [85, 298], [85, 324], [80, 352], [76, 366],
      [81, 380], [86, 398], [84, 418], [77, 434], [69, 440], [62, 434],
      [60, 414], [60, 392], [63, 374], [64, 362],
      [64, 336], [62, 306], [60, 282], [60, 268],
      [58, 244], [56, 218], [53, 198], [49 + sh * 0.3, 188],
      [49 + sh * 0.3, 206], [46 + wa, 236], [44 + wa, 258], [48 + hp * 0.4, 280], [56 + hp, 304], [60 + hp, 326],
      [60 + hp * 0.6, 352], [56, 390], [51, 424], [47, 446], [47, 462],
      [49, 490], [46, 522], [37, 560], [31, 586], [33, 600],
      [43, 612], [48, 623], [40, 630], [22, 632], [13, 627],
      [11, 611], [13, 598], [12, 586],
      [14, 556], [18, 514], [16, 478], [14, 452],
      [16, 422], [14, 386], [9, 356], [3, 338], [0, 336]
    ];
  }

  /**
   * 以 Catmull-Rom 樣條把點串成平滑封閉路徑
   */
  function smoothClosed(points) {
    const n = points.length;
    let d = `M ${f(points[0][0])} ${f(points[0][1])}`;
    for (let i = 0; i < n; i++) {
      const p0 = points[(i - 1 + n) % n];
      const p1 = points[i];
      const p2 = points[(i + 1) % n];
      const p3 = points[(i + 2) % n];
      const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
      const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
      d += ` C ${f(c1[0])} ${f(c1[1])} ${f(c2[0])} ${f(c2[1])} ${f(p2[0])} ${f(p2[1])}`;
    }
    return d + ' Z';
  }

  /**
   * 手臂自然外張：從腋下（y≈200）往下逐漸外移，避免手與臀部、大腿重疊
   */
  function withArmSpread(points) {
    const start = points.findIndex(([, y], i) => i > 10 && y >= 200);
    const end = points.findIndex(([x, y], i) => i > start && y < 200 && x < 55);
    return points.map(([x, y], i) => {
      if (i < start || i > end) return [x, y];
      const t = Math.max(0, Math.min(1, (y - 196) / 110));
      return [x + t * 9, y];
    });
  }

  function fullOutline(cx, sex) {
    const half = withArmSpread(halfOutline(sex));
    const right = half.map(([x, y]) => [cx + x, y]);
    const left = half.slice(1, -1).reverse().map(([x, y]) => [cx - x, y]);
    return smoothClosed(right.concat(left));
  }

  /**
   * 帶狀區塊：x1→x2，上緣 yt（中段彎曲 ct）、下緣 yb（中段彎曲 cb）
   */
  function band(x1, x2, yt, yb, ct = 0, cb = 0) {
    const xm = (x1 + x2) / 2;
    return `M ${x1} ${yt} Q ${xm} ${yt + ct * 2} ${x2} ${yt} L ${x2} ${yb} Q ${xm} ${yb + cb * 2} ${x1} ${yb} Z`;
  }
  const ellipse = (cx, cy, rx, ry) => `M ${cx - rx} ${cy} a ${rx} ${ry} 0 1 0 ${2 * rx} 0 a ${rx} ${ry} 0 1 0 ${-2 * rx} 0 Z`;

  /**
   * 繪製身體部位圖
   * @param {HTMLElement} container
   * @param {object} options
   * @param {'female'|'male'} [options.sex='female']
   * @param {object} [options.names] - 自訂 ID 與中文名稱映射
   * @param {function} [options.onSelect] - 參數 { id, nameZh, view }
   */
  function render(container, options = {}) {
    const sex = options.sex || 'female';
    const male = sex === 'male';
    const names = options.names || NAMES;
    const namesEn = options.namesEn || {};
    const labels = options.labels || {};
    const lang = options.lang || (window.I18N ? window.I18N.lang() : 'zh');

    container.textContent = '';
    const svgAria = options.ariaLabel || (lang === 'en' ? 'Body Map (Front and Back)' : '身體部位圖（正面與背面）');
    const svg = el('svg', { viewBox: '0 0 760 690', class: 'body-map', role: 'group', 'aria-label': svgAria });
    container.appendChild(svg);
    const defs = el('defs', {}, svg);
    const groups = new Map();
    const uid = Math.random().toString(36).slice(2, 8);

    function figure(view, offsetX) {
      const cx = 180;
      const root = el('g', { transform: `translate(${offsetX} 22)`, class: `figure figure--${view}` }, svg);
      const title = el('text', { x: cx, y: -4, 'text-anchor': 'middle', class: 'view-label' }, root);
      title.textContent = view === 'front' ? (labels.front || '正面') : (labels.back || '背面');

      const outline = fullOutline(cx, sex);
      const clipId = `body-clip-${view}-${uid}`;
      el('path', { d: outline }, el('clipPath', { id: clipId }, defs));

      // 畫面右半（+x）屬於病人的哪一側：正面是病人左側，背面是病人右側
      const plusSide = view === 'front' ? 'l' : 'r';
      const minusSide = view === 'front' ? 'r' : 'l';

      function add(id, halfPath, { clip = true, mirror = false, cls = '', hitRect = null } = {}) {
        const nameZh = (names && names[id]) || NAMES[id] || id;
        const nameEn = namesEn[id] || id;
        const viewLabel = view === 'front' ? (labels.front || (lang === 'en' ? 'Front' : '正面')) : (labels.back || (lang === 'en' ? 'Back' : '背面'));
        const regionAria = lang === 'en' ? `${nameEn} (${viewLabel})` : `${nameZh}（${view === 'front' ? '正面' : '背面'}）`;
        const g = el('g', {
          class: `region ${cls}`.trim(),
          'data-region': id,
          'data-view': view,
          tabindex: 0,
          role: 'button',
          'aria-label': regionAria,
          'aria-pressed': 'false'
        }, root);
        const transform = mirror ? `translate(${cx} 0) scale(-1 1)` : `translate(${cx} 0)`;
        if (hitRect) {
          el('rect', { x: hitRect.x, y: hitRect.y, width: hitRect.w, height: hitRect.h, class: 'hit', fill: 'transparent', transform }, g);
        }
        const attrs = { d: halfPath, class: 'shape', transform };
        if (clip) {
          // clipPath 的座標是絕對座標；在套用 transform 前先包一層 g 做裁切
          const holder = el('g', { 'clip-path': `url(#${clipId})` }, g);
          el('path', attrs, holder);
        } else {
          el('path', attrs, g);
        }
        if (!groups.has(id)) groups.set(id, []);
        groups.get(id).push(g);
      }

      // 左右成對的部位：+x 側與 −x 側
      function pair(base, halfPath, opts = {}) {
        add(`${base}-${plusSide}`, halfPath, opts);
        add(`${base}-${minusSide}`, halfPath, { ...opts, mirror: true });
      }

      // ---- 軀幹 ----
      if (view === 'front') {
        add('neck', band(-18, 18, 108, 152, 0, 2));
        add('chest', band(-52, 52, 146, 226, 5, 3));
        add('abdomen-upper', band(-52, 52, 224, 256, 3, 4));
        add('abdomen', band(-58, 58, 254, 304, 4, 6));
        add('groin', band(-66, 66, 300, 350, 6, 0));
      } else {
        add('neck-nape', band(-20, 20, 108, 154, 0, 3));
        add('back', band(-60, 60, 146, 300, 6, 6));
      }

      // ---- 下肢 ----
      pair('thigh', 'M 1 338 Q 34 324 64 300 L 76 300 L 76 446 Q 38 452 0 446 Z');
      pair('knee', band(0, 76, 444, 476, 3, 3));
      pair('leg', band(0, 76, 474, 584, 3, 1));
      pair('ankle', band(0, 76, 582, 604, 1, 1));
      if (view === 'front') {
        pair('foot', band(0, 76, 602, 640, 1, 0));
      } else {
        pair('heel', band(0, 76, 602, 640, 1, 0));
      }
      if (view === 'back') {
        pair('buttock', 'M 0 290 Q 32 282 64 294 L 68 330 Q 54 354 22 352 Q 4 350 0 344 Z');
      }
      // 髖部只在正面顯示（背面被垂下的手臂遮住）
      if (view === 'front') {
        pair('hip', 'M 44 286 Q 58 284 76 292 L 76 332 Q 66 322 58 314 Q 48 300 44 286 Z');
      }

      // ---- 上肢 ----
      pair('arm', band(54, 110, 184, 264, 0, 3));
      pair('elbow', band(57, 110, 262, 288, 3, 3));
      pair('forearm', band(67, 110, 286, 358, 3, 2));
      pair('wrist', band(67, 110, 356, 374, 2, 2));
      pair('hand', band(67, 110, 372, 416, 2, 5));
      pair('fingers', band(67, 110, 413, 446, 5, 0));
      pair('shoulder', `M 16 132 Q 40 140 ${male ? 106 : 98} 152 L ${male ? 106 : 98} 196 L 56 196 Q 50 172 44 154 Q 30 150 16 150 Z`);
      if (view === 'front') {
        pair('axilla', 'M 42 176 L 58 178 L 60 214 L 44 214 Z');
      }

      // ---- 胸腹細部 ----
      if (view === 'front') {
        const breast = male
          ? ellipse(26, 196, 13, 9)
          : 'M 8 188 Q 20 174 38 180 Q 52 192 46 214 Q 38 228 22 226 Q 8 222 8 206 Z';
        add('chest-breast', breast);
        add('chest-breast-r', breast, { mirror: true });
        add('abdomen-umbilical', ellipse(0, 272, 4, 5.5));
        add('groin-mons', ellipse(0, 318, 14, 8));
        if (male) {
          add('groin-scrotum', ellipse(0, 346, 12, 10), { clip: false });
          add('groin-penis', 'M -5 326 L -5 350 Q 0 358 5 350 L 5 326 Z', { clip: false });
        } else {
          add('groin-vulva', 'M 0 326 Q -5 336 0 346 Q 5 336 0 326 Z', { clip: false });
        }
      }

      // ---- 頭部 ----
      add('head', band(-52, 52, 0, 122));
      if (view === 'front') {
        add('head-forehead', band(-52, 52, 0, 50, 0, 3));
        add('head-chin', band(-24, 24, 104, 124, -2, 0));
        const brow = 'M 8 56 Q 17 50 27 54 L 27 57 Q 17 54 9 59 Z';
        add('head-eyebrow', brow, { clip: false });
        add('head-eyebrow-r', brow, { clip: false, mirror: true });
        const eye = 'M 9 67 Q 17 61 26 67 Q 17 72 9 67 Z';
        const eyeHit = { x: 7.5, y: 56.5, w: 20, h: 20 };
        add('head-eye', eye, { clip: false, cls: 'feature-eye', hitRect: eyeHit });
        add('head-eye-r', eye, { clip: false, cls: 'feature-eye', mirror: true, hitRect: eyeHit });
        add('head-cheek', ellipse(23, 87, 9, 7), { clip: false, cls: 'feature-cheek' });
        add('head-cheek-r', ellipse(23, 87, 9, 7), { clip: false, cls: 'feature-cheek', mirror: true });
        add('head-nose', 'M -3 66 Q -5 82 -9 88 Q 0 94 9 88 Q 5 82 3 66 Z', { clip: false });
        add('head-lips', 'M -11 102 Q -4 97 0 99 Q 4 97 11 102 Q 0 109 -11 102 Z', { clip: false, cls: 'feature-lips' });
      }
      const ear = 'M 37 62 Q 47 57 47 71 Q 47 86 38 88 Z';
      add(view === 'front' ? 'head-ear' : 'head-ear-r', ear, { clip: false });
      add(view === 'front' ? 'head-ear-r' : 'head-ear', ear, { clip: false, mirror: true });

      // ---- 輪廓與解剖線（不可點，只增加辨識度） ----
      const lines = el('g', { class: 'anatomy-lines', transform: `translate(${cx} 0)` }, root);
      el('path', { d: outline, class: 'outline', transform: `translate(${-cx} 0)` }, lines);
      const both = d => { el('path', { d }, lines); el('path', { d, transform: 'scale(-1 1)' }, lines); };
      if (view === 'front') {
        both('M 14 149 Q 32 156 52 150');                 // 鎖骨
        el('path', { d: 'M 0 160 L 0 230' }, lines);      // 胸骨
        el('path', { d: 'M 0 236 L 0 262' }, lines);      // 白線
        both('M 12 232 Q 30 238 46 232');                 // 肋弓
        both('M 30 452 Q 22 460 30 468 Q 38 460 30 452'); // 髕骨
        both('M 26 594 Q 30 590 34 594');                 // 踝
        both('M 9 67 Q 17 71 26 67');                     // 下眼瞼
      } else {
        el('path', { d: 'M 0 150 L 0 298' }, lines);      // 脊椎
        both('M 16 168 Q 34 160 46 176 Q 42 200 26 206'); // 肩胛骨
        el('path', { d: 'M 0 302 L 0 342' }, lines);      // 臀溝
        both('M 8 350 Q 28 356 56 346');                  // 臀下緣
        both('M 20 462 Q 30 456 40 462');                 // 膕窩
      }

      const tag = (text, x) => {
        const t = el('text', { x, y: 664, 'text-anchor': 'middle', class: 'side-label' }, root);
        t.textContent = text;
      };
      const patientRight = labels.patientRight || (lang === 'en' ? 'Patient Right' : '病人右側');
      const patientLeft = labels.patientLeft || (lang === 'en' ? 'Patient Left' : '病人左側');
      tag(view === 'front' ? patientRight : patientLeft, 70);
      tag(view === 'front' ? patientLeft : patientRight, 290);
    }

    figure('front', 10);
    figure('back', 390);

    let selected = null;
    /**
     * 選取部位
     * @param {string} id
     * @param {string} [view]
     * @param {{silent?: boolean}} [opts] - silent 時只更新樣式、不觸發 onSelect（還原狀態用）
     */
    function select(id, view, opts = {}) {
      if (selected && groups.has(selected)) {
        groups.get(selected).forEach(g => {
          g.classList.remove('is-selected');
          g.setAttribute('aria-pressed', 'false');
        });
      }
      selected = id;
      const list = groups.get(id);
      if (!list) return;
      list.forEach(g => {
        g.classList.add('is-selected');
        g.setAttribute('aria-pressed', 'true');
      });
      const nameZh = (names && names[id]) || NAMES[id] || id;
      if (!opts.silent && typeof options.onSelect === 'function') options.onSelect({ id, nameZh, view });
    }

    svg.addEventListener('click', e => {
      const g = e.target.closest('.region');
      if (g) select(g.dataset.region, g.dataset.view);
    });
    svg.addEventListener('keydown', e => {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      const g = e.target.closest('.region');
      if (g) { e.preventDefault(); select(g.dataset.region, g.dataset.view); }
    });
    svg.addEventListener('pointerover', e => {
      const g = e.target.closest('.region');
      svg.querySelectorAll('.region.is-hover').forEach(n => n.classList.remove('is-hover'));
      if (g && groups.has(g.dataset.region)) {
        groups.get(g.dataset.region).forEach(n => n.classList.add('is-hover'));
      }
    });
    svg.addEventListener('pointerleave', () => {
      svg.querySelectorAll('.region.is-hover').forEach(n => n.classList.remove('is-hover'));
    });

    function setRecords(countById) {
      const counts = countById || {};
      groups.forEach((list, id) => {
        const has = (counts[id] || 0) > 0;
        list.forEach(g => g.classList.toggle('has-record', has));
      });
    }

    function setRegionRecords(subIds) {
      const set = (subIds instanceof Set) ? subIds : new Set(subIds || []);
      groups.forEach((list, id) => {
        const has = set.has(id);
        list.forEach(g => g.classList.toggle('has-region-record', has));
      });
    }

    return { svg, select, setRecords, setRegionRecords, regions: [...groups.keys()] };
  }

  global.BodyMap = { render, NAMES };
})(typeof window !== 'undefined' ? window : this);
