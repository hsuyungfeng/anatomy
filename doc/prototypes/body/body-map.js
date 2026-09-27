/* ================================================
   身體部位圖產生器 — 結構化 SVG 原型（分節人形）
   正面＋背面，每個子部位是 <g class="region" data-region="arm-r">
   ID 與 data/body-systems.json 的 subRegions 一致
   ================================================ */

(function (global) {
  'use strict';

  const SVG_NS = 'http://www.w3.org/2000/svg';

  // 子部位名稱（與 data/body-systems.json 一致；正式整合時改由該檔提供）
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

  function el(name, attrs = {}, parent = null) {
    const node = document.createElementNS(SVG_NS, name);
    Object.entries(attrs).forEach(([k, v]) => node.setAttribute(k, v));
    if (parent) parent.appendChild(node);
    return node;
  }

  const f = n => n.toFixed(1);

  /**
   * 漸細膠囊：兩個圓（c1 半徑 r1、c2 半徑 r2）以外公切線相連
   * 以取樣點產生路徑，避免 arc 旗標的邊界情況
   */
  function capsule(x1, y1, r1, x2, y2, r2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const d = Math.hypot(dx, dy);
    const phi = Math.atan2(dy, dx);
    const alpha = Math.acos(Math.max(-1, Math.min(1, (r1 - r2) / d)));
    const pts = [];
    const N = 14;
    // c2 端：phi - alpha → phi + alpha（經過 phi）
    for (let i = 0; i <= N; i++) {
      const a = phi - alpha + (2 * alpha * i) / N;
      pts.push([x2 + r2 * Math.cos(a), y2 + r2 * Math.sin(a)]);
    }
    // c1 端：phi + alpha → phi - alpha + 2π（經過背面）
    for (let i = 0; i <= N; i++) {
      const a = phi + alpha + ((2 * Math.PI - 2 * alpha) * i) / N;
      pts.push([x1 + r1 * Math.cos(a), y1 + r1 * Math.sin(a)]);
    }
    return 'M ' + pts.map(([x, y]) => `${f(x)} ${f(y)}`).join(' L ') + ' Z';
  }

  const circle = (cx, cy, r) => `M ${f(cx - r)} ${f(cy)} a ${r} ${r} 0 1 0 ${2 * r} 0 a ${r} ${r} 0 1 0 ${-2 * r} 0 Z`;
  const ellipse = (cx, cy, rx, ry) => `M ${f(cx - rx)} ${f(cy)} a ${rx} ${ry} 0 1 0 ${2 * rx} 0 a ${rx} ${ry} 0 1 0 ${-2 * rx} 0 Z`;

  /**
   * 單側肢體（以畫面左側為準，mx 為鏡射函式）
   * patientSide：此肢體屬於病人的哪一側（'r' 或 'l'）
   */
  function limbs(add, mx, s, view) {
    // 上肢
    add(`shoulder-${s}`, circle(mx(132), 142, 17));
    add(`arm-${s}`, capsule(mx(128), 158, 14, mx(116), 248, 11));
    add(`forearm-${s}`, capsule(mx(116), 256, 11, mx(106), 338, 8));
    add(`elbow-${s}`, circle(mx(116), 252, 12));
    add(`wrist-${s}`, circle(mx(105), 344, 8.5));
    add(`hand-${s}`, ellipse(mx(103), 370, 13, 19));
    const fingers = [-8, -3, 2, 7].map((dx, i) =>
      capsule(mx(103 + dx), 384, 3.4, mx(103 + dx * 1.35), 406 - Math.abs(i - 1.5) * 3, 2.6)).join(' ');
    add(`fingers-${s}`, fingers);
    if (view === 'front') add(`axilla-${s}`, ellipse(mx(147), 170, 6, 13));

    // 下肢
    add(`thigh-${s}`, capsule(mx(160), 330, 24, mx(158), 446, 15));
    add(`leg-${s}`, capsule(mx(158), 462, 14, mx(157), 588, 9));
    add(`knee-${s}`, circle(mx(158), 454, 16));
    add(`ankle-${s}`, circle(mx(157), 594, 9));
    if (view === 'front') {
      add(`foot-${s}`, `M ${f(mx(148))} 602 Q ${f(mx(140))} 626 ${f(mx(146))} 632 L ${f(mx(170))} 632 Q ${f(mx(172))} 616 ${f(mx(166))} 602 Z`);
    } else {
      add(`foot-${s}`, `M ${f(mx(146))} 602 L ${f(mx(168))} 602 L ${f(mx(168))} 614 L ${f(mx(146))} 614 Z`);
      add(`heel-${s}`, ellipse(mx(157), 622, 11, 9));
    }
  }

  /**
   * 繪製身體部位圖
   * @param {HTMLElement} container
   * @param {object} options
   * @param {'female'|'male'} options.sex - 決定外生殖器區塊
   * @param {function} options.onSelect - 參數 { id, nameZh, view }
   */
  function render(container, options = {}) {
    const sex = options.sex || 'female';
    container.textContent = '';
    const svg = el('svg', { viewBox: '0 0 760 690', class: 'body-map', role: 'group', 'aria-label': '身體部位圖（正面與背面）' });
    container.appendChild(svg);

    const groups = new Map();

    function figure(view, offsetX) {
      const root = el('g', { transform: `translate(${offsetX} 20)`, class: `figure figure--${view}` }, svg);
      const title = el('text', { x: 180, y: 0, 'text-anchor': 'middle', class: 'view-label' }, root);
      title.textContent = view === 'front' ? '正面' : '背面';

      const add = (id, d) => {
        const g = el('g', {
          class: 'region',
          'data-region': id,
          'data-view': view,
          tabindex: 0,
          role: 'button',
          'aria-label': `${NAMES[id] || id}（${view === 'front' ? '正面' : '背面'}）`,
          'aria-pressed': 'false'
        }, root);
        el('path', { d, class: 'shape' }, g);
        if (!groups.has(id)) groups.set(id, []);
        groups.get(id).push(g);
        return g;
      };

      // 正面：病人右側在畫面左邊；背面：病人右側在畫面右邊
      const leftSide = view === 'front' ? 'r' : 'l';
      const rightSide = view === 'front' ? 'l' : 'r';
      const mirror = x => 360 - x;

      // 軀幹
      if (view === 'front') {
        add('chest', 'M 138 128 Q 180 118 222 128 L 226 204 L 134 204 Z');
        add('abdomen-upper', 'M 134 204 L 226 204 L 224 238 L 136 238 Z');
        add('abdomen', 'M 136 238 L 224 238 Q 228 262 222 284 L 138 284 Q 132 262 136 238 Z');
        add('groin', 'M 138 284 L 222 284 Q 222 304 206 318 L 180 326 L 154 318 Q 138 304 138 284 Z');
      } else {
        add('back', 'M 138 128 Q 180 118 222 128 L 226 204 Q 228 250 222 284 L 138 284 Q 132 250 134 204 Z');
        add(`buttock-${leftSide}`, 'M 138 284 L 180 284 L 180 326 Q 150 334 140 312 Q 136 298 138 284 Z');
        add(`buttock-${rightSide}`, 'M 180 284 L 222 284 Q 224 298 220 312 Q 210 334 180 326 Z');
      }
      add(`hip-${leftSide}`, circle(142, 292, 14));
      add(`hip-${rightSide}`, circle(218, 292, 14));

      // 四肢（畫面左、右）
      limbs(add, x => x, leftSide, view);
      limbs(add, mirror, rightSide, view);

      // 胸腹細部
      if (view === 'front') {
        add('chest-breast-r', circle(160, 178, 14));
        add('chest-breast', circle(200, 178, 14));
        add('abdomen-umbilical', circle(180, 256, 5.5));
        add('groin-mons', ellipse(180, 300, 13, 8));
        if (sex === 'female') {
          add('groin-vulva', ellipse(180, 318, 6, 8));
        } else {
          add('groin-penis', capsule(180, 312, 5, 180, 332, 4.5));
          add('groin-scrotum', ellipse(180, 326, 11, 8));
        }
      }

      // 頸部
      if (view === 'front') {
        add('neck', 'M 164 100 L 196 100 L 198 128 Q 180 134 162 128 Z');
      } else {
        add('neck-nape', 'M 164 100 L 196 100 L 198 128 Q 180 134 162 128 Z');
      }

      // 頭部
      if (view === 'front') {
        add('head', circle(180, 62, 40));
        add('head-ear-r', ellipse(139, 66, 6, 11));
        add('head-ear', ellipse(221, 66, 6, 11));
        add('head-forehead', 'M 143 48 A 40 40 0 0 1 217 48 Z');
        add('head-eyebrow-r', 'M 157 52 Q 166 47 175 52 L 174 55 Q 166 51 158 55 Z');
        add('head-eyebrow', 'M 185 52 Q 194 47 203 52 L 202 55 Q 194 51 186 55 Z');
        add('head-eye-r', ellipse(166, 62, 7, 4));
        add('head-eye', ellipse(194, 62, 7, 4));
        add('head-nose', 'M 180 62 L 172 82 Q 180 86 188 82 Z');
        add('head-cheek-r', circle(157, 80, 8));
        add('head-cheek', circle(203, 80, 8));
        add('head-lips', ellipse(180, 91, 10, 4));
        add('head-chin', 'M 164 97 Q 180 106 196 97 A 40 40 0 0 1 164 97 Z');
      } else {
        add('head', circle(180, 62, 40));
        add('head-ear', ellipse(139, 66, 6, 11));
        add('head-ear-r', ellipse(221, 66, 6, 11));
      }

      // 左右標示（避免混淆）
      const tag = (text, x) => {
        const t = el('text', { x, y: 670, 'text-anchor': 'middle', class: 'side-label' }, root);
        t.textContent = text;
      };
      tag(view === 'front' ? '病人右側' : '病人左側', 70);
      tag(view === 'front' ? '病人左側' : '病人右側', 290);
    }

    figure('front', 10);
    figure('back', 390);

    let selected = null;
    function select(id, view) {
      if (selected) groups.get(selected).forEach(g => { g.classList.remove('is-selected'); g.setAttribute('aria-pressed', 'false'); });
      selected = id;
      const list = groups.get(id);
      if (!list) return;
      list.forEach(g => { g.classList.add('is-selected'); g.setAttribute('aria-pressed', 'true'); });
      if (typeof options.onSelect === 'function') options.onSelect({ id, nameZh: NAMES[id] || id, view });
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

    function setRecords(countById) {
      groups.forEach((list, id) => list.forEach(g => g.classList.toggle('has-record', (countById[id] || 0) > 0)));
    }

    return { svg, select, setRecords, regions: [...groups.keys()] };
  }

  global.BodyMap = { render, NAMES };
})(window);
