/* ================================================
   病歷管理模組
   ================================================ */

class RecordManager {
  /**
   * 初始化病歷管理器
   * @param {object} options - 配置選項
   */
  constructor(options = {}) {
    this.storageKeyPrefix = options.storageKeyPrefix || 'anatomy-record';
    this.currentRecordId = options.currentRecordId || null;
    this.records = [];
    this.currentRecord = null;

    this.init();
  }

  /**
   * 初始化
   */
  init() {
    // 檢查是否需要數據遷移
    if (typeof DiseaseDataMigration !== 'undefined' &&
        DiseaseDataMigration.needsMigration(this.storageKeyPrefix)) {

      console.log('[RecordManager] 檢測到舊版本數據，開始自動遷移...');
      const result = DiseaseDataMigration.migrateAllRecords(this.storageKeyPrefix);

      if (result.success) {
        console.log(`✓ 成功遷移 ${result.count} 筆病歷記錄`);
      } else {
        console.error(`✗ 遷移失敗: ${result.error}`);
      }
    }

    this.loadRecords();
  }

  /**
   * 加載所有病歷
   */
  loadRecords() {
    try {
      const recordIds = getFromLocalStorage(`${this.storageKeyPrefix}-ids`, []);
      this.records = recordIds.map(id =>
        getFromLocalStorage(`${this.storageKeyPrefix}-${id}`)
      ).filter(r => r !== null);
    } catch (error) {
      console.error('Error loading records:', error);
      this.records = [];
    }
  }

  /**
   * 創建新病歷
   * @param {object} recordData - 病歷資料
   * @returns {string} 病歷 ID
   */
  createRecord(recordData = {}) {
    const recordId = generateUUID();
    const now = new Date().toISOString();

    const record = {
      recordId,
      patientId: recordData.patientId || '',
      createdAt: now,
      updatedAt: now,
      anatomicalSystems: recordData.anatomicalSystems || [],
      notes: recordData.notes || ''
    };

    this.currentRecordId = recordId;
    this.currentRecord = record;
    this.saveRecord(record);
    this.updateRecordIds();

    dispatchEvent('record:created', { recordId });
    return recordId;
  }

  /**
   * 獲取當前病歷
   * @returns {object} 當前病歷
   */
  getCurrentRecord() {
    if (!this.currentRecordId) {
      this.createRecord();
    }

    if (!this.currentRecord) {
      this.currentRecord = getFromLocalStorage(
        `${this.storageKeyPrefix}-${this.currentRecordId}`
      );
    }

    return this.currentRecord;
  }

  /**
   * 添加標註到病歷
   * @param {string} systemId - 解剖系統 ID
   * @param {object} annotation - 標註資料
   */
  addAnnotation(systemId, annotation) {
    const record = this.getCurrentRecord();
    if (!record) return;

    let system = record.anatomicalSystems.find(s => s.systemId === systemId);

    if (!system) {
      system = {
        systemId,
        systemName: systemId,
        imageId: '',
        annotations: []
      };
      record.anatomicalSystems.push(system);
    }

    system.annotations.push(annotation);
    record.updatedAt = new Date().toISOString();

    this.saveRecord(record);
    dispatchEvent('annotation:added', { systemId, annotation });
  }

  /**
   * 更新標註
   * @param {string} systemId - 解剖系統 ID
   * @param {string} annotationId - 標註 ID
   * @param {object} updates - 更新資料
   */
  updateAnnotation(systemId, annotationId, updates) {
    const record = this.getCurrentRecord();
    if (!record) return;

    const system = record.anatomicalSystems.find(s => s.systemId === systemId);
    if (!system) return;

    const annotation = system.annotations.find(a => a.annotationId === annotationId);
    if (!annotation) return;

    Object.assign(annotation, updates);
    record.updatedAt = new Date().toISOString();

    this.saveRecord(record);
    dispatchEvent('annotation:updated', { systemId, annotationId, updates });
  }

  /**
   * 刪除標註
   * @param {string} systemId - 解剖系統 ID
   * @param {string} annotationId - 標註 ID
   */
  deleteAnnotation(systemId, annotationId) {
    const record = this.getCurrentRecord();
    if (!record) return;

    const system = record.anatomicalSystems.find(s => s.systemId === systemId);
    if (!system) return;

    system.annotations = system.annotations.filter(
      a => a.annotationId !== annotationId
    );
    record.updatedAt = new Date().toISOString();

    this.saveRecord(record);
    dispatchEvent('annotation:deleted', { systemId, annotationId });
  }

  /**
   * 獲取系統的所有標註
   * @param {string} systemId - 解剖系統 ID
   * @returns {array} 標註列表
   */
  getAnnotationsBySystem(systemId) {
    const record = this.getCurrentRecord();
    if (!record) return [];

    const system = record.anatomicalSystems.find(s => s.systemId === systemId);
    return system ? system.annotations : [];
  }

  /**
   * 保存病歷到 localStorage
   * @param {object} record - 病歷對象
   */
  saveRecord(record) {
    try {
      this.currentRecord = record;
      saveToLocalStorage(`${this.storageKeyPrefix}-${record.recordId}`, record);
      this.updateRecordIds();
    } catch (error) {
      console.error('Error saving record:', error);
    }
  }

  /**
   * 更新病歷 ID 列表
   */
  updateRecordIds() {
    const ids = this.records.map(r => r.recordId);
    if (this.currentRecord && !ids.includes(this.currentRecord.recordId)) {
      ids.push(this.currentRecord.recordId);
    }
    saveToLocalStorage(`${this.storageKeyPrefix}-ids`, ids);
  }

  /**
   * 刪除病歷
   * @param {string} recordId - 病歷 ID
   */
  deleteRecord(recordId) {
    try {
      removeFromLocalStorage(`${this.storageKeyPrefix}-${recordId}`);
      this.records = this.records.filter(r => r.recordId !== recordId);

      if (this.currentRecordId === recordId) {
        this.currentRecordId = null;
        this.currentRecord = null;
      }

      this.updateRecordIds();
      dispatchEvent('record:deleted', { recordId });
    } catch (error) {
      console.error('Error deleting record:', error);
    }
  }

  /**
   * 匯出病歷為 JSON
   * @param {string} recordId - 病歷 ID（若為空則匯出當前病歷）
   * @returns {string} JSON 字串
   */
  exportAsJSON(recordId = null) {
    const record = recordId
      ? getFromLocalStorage(`${this.storageKeyPrefix}-${recordId}`)
      : this.getCurrentRecord();

    if (!record) return null;

    return JSON.stringify(record, null, 2);
  }

  /**
   * 匯出病歷為人類可讀格式
   * @param {string} recordId - 病歷 ID（若為空則匯出當前病歷）
   * @returns {string} 文本
   */
  exportAsText(recordId = null) {
    const record = recordId
      ? getFromLocalStorage(`${this.storageKeyPrefix}-${recordId}`)
      : this.getCurrentRecord();

    if (!record) return '';

    // 標題
    let text = '醫療結構化病歷報告\n';
    text += '=====================================\n\n';

    // 病歷信息
    text += `病歷 ID: ${record.recordId}\n`;
    text += `患者 ID: ${record.patientId || '未指定'}\n`;
    text += `創建時間: ${formatDateTime(new Date(record.createdAt))}\n`;
    text += `更新時間: ${formatDateTime(new Date(record.updatedAt))}\n\n`;

    // 收集所有標註（用於時間軸）
    const allAnnotations = [];
    let totalAnnotations = 0;
    let diseaseSet = new Set();

    if (record.anatomicalSystems && record.anatomicalSystems.length > 0) {
      record.anatomicalSystems.forEach(system => {
        if (system.annotations && system.annotations.length > 0) {
          system.annotations.forEach(anno => {
            totalAnnotations++;
            const annotation = {
              ...anno,
              systemName: system.systemName,
              createdAt: anno.createdAt || new Date().toISOString()
            };
            allAnnotations.push(annotation);

            // 收集所有疾病類型
            if (anno.diseases && anno.diseases.length > 0) {
              anno.diseases.forEach(disease => {
                diseaseSet.add(disease.name);
              });
            }
          });
        }
      });
    }

    // 按時間倒序排列（最新在前）
    allAnnotations.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // 治療時間軸部分
    text += '[治療時間軸]\n';
    text += '=====================================\n\n';

    if (allAnnotations.length > 0) {
      allAnnotations.forEach((anno, index) => {
        const timestamp = formatDateTime(new Date(anno.createdAt), 'YYYY-MM-DD HH:mm');
        text += `${timestamp} - ${anno.locationName || '未知位置'}\n`;

        if (anno.diseases && anno.diseases.length > 0) {
          // 合併疾病顯示
          const diseaseList = anno.diseases.map(d => `${d.id} ${d.name}`).join(', ');
          text += `  疾病: ${diseaseList}\n`;
        }

        if (anno.treatmentNotes) {
          text += `  摘要: ${anno.treatmentNotes}\n`;
        }

        if (index < allAnnotations.length - 1) {
          text += '  ─────────────────────────\n\n';
        }
      });
    } else {
      text += '(尚無治療記錄)\n';
    }

    text += '\n';

    // 統計信息部分
    text += '[統計信息]\n';
    text += '=====================================\n';
    text += `總標註數: ${totalAnnotations}\n`;
    text += `系統數量: ${record.anatomicalSystems ? record.anatomicalSystems.length : 0}\n`;
    text += `疾病種類: ${diseaseSet.size}\n`;

    return text;
  }

  /**
   * 下載病歷
   * @param {string} format - 格式 ('json' 或 'text')
   * @param {string} recordId - 病歷 ID
   */
  downloadRecord(format = 'json', recordId = null) {
    const record = recordId
      ? getFromLocalStorage(`${this.storageKeyPrefix}-${recordId}`)
      : this.getCurrentRecord();

    if (!record) return;

    const timestamp = formatDateTime(new Date(), 'YYYY-MM-DD-HH-mm-ss');
    const filename = `medical-record-${record.recordId.substring(0, 8)}-${timestamp}`;

    if (format === 'json') {
      const content = this.exportAsJSON(recordId);
      downloadFile(content, `${filename}.json`, 'application/json');
    } else if (format === 'text') {
      const content = this.exportAsText(recordId);
      downloadFile(content, `${filename}.txt`, 'text/plain');
    }

    dispatchEvent('record:downloaded', { recordId, format });
  }

  /**
   * 清除所有病歷
   */
  clearAll() {
    if (confirm('確認刪除所有病歷？此操作無法復原。')) {
      const recordIds = getFromLocalStorage(`${this.storageKeyPrefix}-ids`, []);
      recordIds.forEach(id => {
        removeFromLocalStorage(`${this.storageKeyPrefix}-${id}`);
      });
      removeFromLocalStorage(`${this.storageKeyPrefix}-ids`);

      this.records = [];
      this.currentRecordId = null;
      this.currentRecord = null;

      dispatchEvent('records:cleared');
    }
  }

  /**
   * 獲取所有病歷
   * @returns {array} 病歷列表
   */
  getAllRecords() {
    this.loadRecords();
    return this.records;
  }

  /**
   * 獲取統計資訊
   * @returns {object} 統計資訊
   */
  getStatistics() {
    const record = this.getCurrentRecord();
    if (!record) return { totalAnnotations: 0, systems: 0 };

    let totalAnnotations = 0;
    record.anatomicalSystems.forEach(system => {
      totalAnnotations += (system.annotations || []).length;
    });

    return {
      totalAnnotations,
      systems: record.anatomicalSystems.length,
      createdAt: record.createdAt,
      lastUpdated: record.updatedAt
    };
  }
}
