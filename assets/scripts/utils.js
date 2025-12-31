/* ================================================
   工具函數模組
   ================================================ */

/**
 * 生成唯一 UUID
 * @returns {string} UUID v4 格式的字串
 */
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * 格式化日期時間
 * @param {Date} date - 日期對象
 * @param {string} format - 格式字串 (預設: 'YYYY-MM-DD HH:mm:ss')
 * @returns {string} 格式化後的日期字串
 */
function formatDateTime(date = new Date(), format = 'YYYY-MM-DD HH:mm:ss') {
  const pad = (num) => String(num).padStart(2, '0');

  const replacements = {
    'YYYY': date.getFullYear(),
    'MM': pad(date.getMonth() + 1),
    'DD': pad(date.getDate()),
    'HH': pad(date.getHours()),
    'mm': pad(date.getMinutes()),
    'ss': pad(date.getSeconds())
  };

  let result = format;
  Object.forEach((key, value) => {
    result = result.replace(key, value);
  }, replacements);

  return result;
}

/**
 * 深度複製對象
 * @param {object} obj - 要複製的對象
 * @returns {object} 複製後的對象
 */
function deepClone(obj) {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj.getTime());
  if (obj instanceof Array) return obj.map(item => deepClone(item));
  if (obj instanceof Object) {
    const cloned = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        cloned[key] = deepClone(obj[key]);
      }
    }
    return cloned;
  }
}

/**
 * 讀取 JSON 檔案
 * @param {string} path - 檔案路徑
 * @returns {Promise<object>} JSON 資料
 */
async function loadJSON(path) {
  try {
    const response = await fetch(path);
    if (!response.ok) {
      throw new Error(`Failed to load ${path}: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Error loading JSON from ${path}:`, error);
    throw error;
  }
}

/**
 * 保存資料到 localStorage
 * @param {string} key - 儲存鍵
 * @param {*} value - 要儲存的值
 */
function saveToLocalStorage(key, value) {
  try {
    const serialized = JSON.stringify(value);
    localStorage.setItem(key, serialized);
  } catch (error) {
    console.error(`Error saving to localStorage (key: ${key}):`, error);
  }
}

/**
 * 從 localStorage 讀取資料
 * @param {string} key - 儲存鍵
 * @param {*} defaultValue - 預設值
 * @returns {*} 讀取的值
 */
function getFromLocalStorage(key, defaultValue = null) {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error(`Error reading from localStorage (key: ${key}):`, error);
    return defaultValue;
  }
}

/**
 * 從 localStorage 刪除資料
 * @param {string} key - 儲存鍵
 */
function removeFromLocalStorage(key) {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error(`Error removing from localStorage (key: ${key}):`, error);
  }
}

/**
 * 計算兩點之間的距離
 * @param {object} point1 - 點 1 {x, y}
 * @param {object} point2 - 點 2 {x, y}
 * @returns {number} 距離
 */
function getDistance(point1, point2) {
  const dx = point2.x - point1.x;
  const dy = point2.y - point1.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * 檢查點是否在矩形內
 * @param {object} point - 點 {x, y}
 * @param {object} rect - 矩形 {x, y, width, height}
 * @returns {boolean}
 */
function isPointInRect(point, rect) {
  return (
    point.x >= rect.x &&
    point.x <= rect.x + rect.width &&
    point.y >= rect.y &&
    point.y <= rect.y + rect.height
  );
}

/**
 * 防抖函數
 * @param {function} func - 要防抖的函數
 * @param {number} delay - 延遲時間（毫秒）
 * @returns {function} 防抖後的函數
 */
function debounce(func, delay = 300) {
  let timeoutId;
  return function(...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
}

/**
 * 節流函數
 * @param {function} func - 要節流的函數
 * @param {number} delay - 限制時間（毫秒）
 * @returns {function} 節流後的函數
 */
function throttle(func, delay = 300) {
  let lastCallTime = 0;
  return function(...args) {
    const now = Date.now();
    if (now - lastCallTime >= delay) {
      func(...args);
      lastCallTime = now;
    }
  };
}

/**
 * 根據選擇器查詢單一元素
 * @param {string} selector - CSS 選擇器
 * @param {Element} parent - 父元素（預設: document）
 * @returns {Element|null}
 */
function $(selector, parent = document) {
  return parent.querySelector(selector);
}

/**
 * 根據選擇器查詢多個元素
 * @param {string} selector - CSS 選擇器
 * @param {Element} parent - 父元素（預設: document）
 * @returns {NodeList}
 */
function $$(selector, parent = document) {
  return parent.querySelectorAll(selector);
}

/**
 * 為元素添加事件監聽
 * @param {Element} element - 目標元素
 * @param {string} eventType - 事件類型
 * @param {function} handler - 事件處理函數
 * @param {object} options - 事件選項
 */
function on(element, eventType, handler, options = {}) {
  if (!element) return;
  element.addEventListener(eventType, handler, options);
}

/**
 * 移除元素事件監聽
 * @param {Element} element - 目標元素
 * @param {string} eventType - 事件類型
 * @param {function} handler - 事件處理函數
 */
function off(element, eventType, handler) {
  if (!element) return;
  element.removeEventListener(eventType, handler);
}

/**
 * 分派自訂事件
 * @param {string} eventName - 事件名稱
 * @param {*} detail - 事件詳情資料
 * @param {Element} target - 目標元素（預設: document）
 */
function dispatchEvent(eventName, detail = {}, target = document) {
  const event = new CustomEvent(eventName, {
    detail,
    bubbles: true,
    cancelable: true
  });
  target.dispatchEvent(event);
}

/**
 * 顯示通知訊息
 * @param {string} message - 訊息文本
 * @param {string} type - 訊息類型 ('success', 'error', 'info', 'warning')
 * @param {number} duration - 顯示時長（毫秒）
 */
function showNotification(message, type = 'info', duration = 3000) {
  // 控制台輸出
  console.log(`[${type.toUpperCase()}] ${message}`);

  // 創建通知容器（如果不存在）
  let notificationContainer = document.getElementById('notification-container');
  if (!notificationContainer) {
    notificationContainer = document.createElement('div');
    notificationContainer.id = 'notification-container';
    notificationContainer.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 10000;
      display: flex;
      flex-direction: column;
      gap: 10px;
      pointer-events: none;
      max-width: 300px;
    `;
    document.body.appendChild(notificationContainer);
  }

  // 創建通知元素
  const notification = document.createElement('div');
  const colors = {
    success: '#4caf50',
    error: '#f44336',
    warning: '#ff9800',
    info: '#2196f3'
  };

  const icons = {
    success: '✓',
    error: '✕',
    warning: '⚠',
    info: 'ℹ'
  };

  const bgColor = colors[type] || colors.info;
  const icon = icons[type] || icons.info;

  notification.style.cssText = `
    background: ${bgColor};
    color: white;
    padding: 12px 16px;
    border-radius: 4px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    display: flex;
    align-items: center;
    gap: 12px;
    font-size: 14px;
    animation: slideIn 0.3s ease-out;
    pointer-events: auto;
  `;

  notification.innerHTML = `
    <span style="flex-shrink: 0; font-size: 16px; font-weight: bold;">${icon}</span>
    <span style="flex: 1;">${message}</span>
  `;

  // 添加到容器
  notificationContainer.appendChild(notification);

  // 動畫樣式（如果不存在）
  if (!document.getElementById('notification-styles')) {
    const style = document.createElement('style');
    style.id = 'notification-styles';
    style.textContent = `
      @keyframes slideIn {
        from {
          transform: translateX(400px);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }
      @keyframes slideOut {
        from {
          transform: translateX(0);
          opacity: 1;
        }
        to {
          transform: translateX(400px);
          opacity: 0;
        }
      }
    `;
    document.head.appendChild(style);
  }

  // 設置自動移除
  setTimeout(() => {
    notification.style.animation = 'slideOut 0.3s ease-out forwards';
    setTimeout(() => {
      notification.remove();
      // 如果容器為空則移除
      if (notificationContainer.children.length === 0) {
        notificationContainer.remove();
      }
    }, 300);
  }, duration);
}

/**
 * 檢查瀏覽器是否支持 WebAssembly
 * @returns {boolean}
 */
function supportsWebAssembly() {
  return typeof WebAssembly !== 'undefined';
}

/**
 * 獲取當前語言設置
 * @returns {string} 語言代碼 ('zh' 或 'en')
 */
function getCurrentLanguage() {
  return getFromLocalStorage('app-language', 'zh');
}

/**
 * 設置語言
 * @param {string} lang - 語言代碼
 */
function setLanguage(lang) {
  saveToLocalStorage('app-language', lang);
  updateLanguageUI(lang);
}

/**
 * 更新 UI 語言顯示
 * @param {string} lang - 語言代碼 ('zh' 或 'en')
 */
function updateLanguageUI(lang) {
  const elements = $$('[data-en]');
  elements.forEach(el => {
    // 保存原始中文文本（如果還未保存）
    if (!el.dataset.zh && el.textContent) {
      el.dataset.zh = el.textContent;
    }

    // 切換語言
    if (lang === 'en') {
      // 切換到英文
      if (el.dataset.en) {
        el.textContent = el.dataset.en;
        el.lang = 'en';
      }
    } else {
      // 切換回中文
      if (el.dataset.zh) {
        el.textContent = el.dataset.zh;
        el.lang = 'zh-Hant';
      }
    }
  });

  // 更新 HTML lang 屬性
  document.documentElement.lang = lang === 'en' ? 'en' : 'zh-Hant';

  // 觸發語言變更事件
  dispatchEvent('language:changed', { language: lang });
}

/**
 * 獲取指定語言的文本
 * @param {Element} element - 元素
 * @param {string} lang - 語言代碼
 * @returns {string} 文本
 */
function getElementText(element, lang = 'zh') {
  if (lang === 'en') {
    return element.dataset.en || element.textContent;
  }
  return element.dataset.zh || element.textContent;
}

/**
 * 轉換文件為 Data URL
 * @param {File} file - 檔案對象
 * @returns {Promise<string>} Data URL
 */
function fileToDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * 下載檔案
 * @param {string} content - 檔案內容
 * @param {string} filename - 檔案名稱
 * @param {string} mimeType - MIME 類型
 */
function downloadFile(content, filename, mimeType = 'text/plain') {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// 導出所有函數
const Utils = {
  generateUUID,
  formatDateTime,
  deepClone,
  loadJSON,
  saveToLocalStorage,
  getFromLocalStorage,
  removeFromLocalStorage,
  getDistance,
  isPointInRect,
  debounce,
  throttle,
  $,
  $$,
  on,
  off,
  dispatchEvent,
  showNotification,
  supportsWebAssembly,
  getCurrentLanguage,
  setLanguage,
  updateLanguageUI,
  getElementText,
  fileToDataURL,
  downloadFile
};
