/* ================================================
   OCR 處理模組
   ================================================ */

class OCRHandler {
  /**
   * 初始化 OCR 處理器
   * @param {object} options - 配置選項
   */
  constructor(options = {}) {
    this.isReady = false;
    this.language = options.language || 'chi_tra+eng'; // 繁體中文 + 英文
    this.diseaseKeywords = options.diseaseKeywords || [];
    this.progressCallback = options.progressCallback || null;

    this.checkTesseract();
  }

  /**
   * 檢查 Tesseract.js 是否可用
   */
  checkTesseract() {
    if (typeof Tesseract !== 'undefined') {
      this.isReady = true;
      console.log('Tesseract.js 已就位');
    } else {
      console.warn('Tesseract.js 未加載');
      this.isReady = false;
    }
  }

  /**
   * 識別圖像中的文字
   * @param {string|File} image - 圖像路徑或文件對象
   * @returns {Promise<string>} 識別的文字
   */
  async recognize(image) {
    if (!this.isReady) {
      throw new Error('Tesseract.js 未就位');
    }

    try {
      const { data: { text } } = await Tesseract.recognize(
        image,
        this.language,
        {
          logger: (message) => this.handleProgress(message)
        }
      );

      return text;
    } catch (error) {
      console.error('OCR 識別失敗:', error);
      throw error;
    }
  }

  /**
   * 處理進度更新
   * @param {object} message - 進度訊息
   */
  handleProgress(message) {
    if (this.progressCallback) {
      this.progressCallback(message);
    }
    console.log(`[OCR] ${message.status}: ${Math.round(message.progress * 100)}%`);
  }

  /**
   * 從檔案識別文字
   * @param {File} file - 圖像文件
   * @returns {Promise<string>} 識別的文字
   */
  async recognizeFromFile(file) {
    return this.recognize(file);
  }

  /**
   * 從 URL 識別文字
   * @param {string} url - 圖像 URL
   * @returns {Promise<string>} 識別的文字
   */
  async recognizeFromURL(url) {
    return this.recognize(url);
  }

  /**
   * 匹配疾病名稱
   * @param {string} text - 識別的文字
   * @param {object} diseaseDatabase - 疾病資料庫
   * @returns {array} 匹配的疾病列表
   */
  matchDiseases(text, diseaseDatabase) {
    const matches = [];
    const lowerText = text.toLowerCase();

    if (!diseaseDatabase) return matches;

    // 簡單的關鍵字匹配 (實際應使用更複雜的 NLP)
    const searchCategories = (categories) => {
      if (!categories) return;

      const processCategory = (categoryId, category) => {
        if (!category || !category.diseases) return;
        category.diseases.forEach(disease => {
          // 檢查中文名稱
          if (disease.name && lowerText.includes(disease.name.toLowerCase())) {
            matches.push({
              id: disease.id,
              name: disease.name,
              nameEn: disease.nameEn,
              category: categoryId,
              confidence: 0.9
            });
          }

          // 檢查英文名稱
          if (disease.nameEn && lowerText.includes(disease.nameEn.toLowerCase())) {
            const existingMatch = matches.find(m => m.id === disease.id);
            if (!existingMatch) {
              matches.push({
                id: disease.id,
                name: disease.name,
                nameEn: disease.nameEn,
                category: categoryId,
                confidence: 0.85
              });
            }
          }

          // 檢查子分類
          if (disease.subcategories) {
            disease.subcategories.forEach(sub => {
              if (sub.name && lowerText.includes(sub.name.toLowerCase())) {
                matches.push({
                  id: sub.id,
                  name: sub.name,
                  nameEn: sub.nameEn,
                  category: categoryId,
                  parentId: disease.id,
                  confidence: 0.85
                });
              }
            });
          }
        });
      };

      if (categories.anatomicalSystems && Array.isArray(categories.anatomicalSystems)) {
        categories.anatomicalSystems.forEach(category => {
          processCategory(category.systemId || category.id, category);
        });
      } else if (Array.isArray(categories)) {
        categories.forEach((category, idx) => {
          processCategory(category.systemId || category.id || idx, category);
        });
      } else if (typeof categories === 'object') {
        Object.entries(categories).forEach(([categoryId, category]) => {
          processCategory(categoryId, category);
        });
      }
    };

    searchCategories(diseaseDatabase);

    // 移除重複項並按信心度排序
    const uniqueMatches = matches.filter(
      (match, index, arr) =>
        arr.findIndex(m => m.id === match.id) === index
    );

    return uniqueMatches.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * 完整的 OCR 流程：識別 → 匹配疾病
   * @param {File|string} image - 圖像文件或 URL
   * @param {object} diseaseDatabase - 疾病資料庫
   * @returns {Promise<object>} {text, diseases}
   */
  async processImage(image, diseaseDatabase) {
    try {
      // 第 1 步：識別文字
      const text = await this.recognize(image);

      // 第 2 步：匹配疾病
      const diseases = this.matchDiseases(text, diseaseDatabase);

      return {
        text,
        diseases,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('OCR 處理失敗:', error);
      throw error;
    }
  }

  /**
   * 設置疾病關鍵字庫
   * @param {array} keywords - 關鍵字列表
   */
  setDiseaseKeywords(keywords) {
    this.diseaseKeywords = keywords;
  }

  /**
   * 獲取 OCR 就緒狀態
   * @returns {boolean}
   */
  isAvailable() {
    return this.isReady;
  }

  /**
   * 取消 OCR 識別 (如果支持)
   */
  cancel() {
    // Tesseract.js 預設不支持取消，但可在此預留介面
    console.log('OCR 識別取消');
  }
}
