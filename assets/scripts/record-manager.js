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
   * 匯出病歷為 CSV 格式
   * @param {string} recordId - 病歷 ID（若為空則匯出當前病歷）
   * @returns {string} CSV 字串
   */
  exportAsCSV(recordId = null) {
    const record = recordId
      ? getFromLocalStorage(`${this.storageKeyPrefix}-${recordId}`)
      : this.getCurrentRecord();

    if (!record) return '';

    const rows = [];
    
    rows.push(['病歷ID', '患者ID', '創建時間', '更新時間']);
    rows.push([
      record.recordId,
      record.patientId || '',
      record.createdAt,
      record.updatedAt
    ]);

    rows.push([]);
    rows.push(['系統', '位置', '疾病ID', '疾病名稱', '療程摘要', '時間']);

    if (record.anatomicalSystems && record.anatomicalSystems.length > 0) {
      record.anatomicalSystems.forEach(system => {
        if (system.annotations && system.annotations.length > 0) {
          system.annotations.forEach(anno => {
            if (anno.diseases && anno.diseases.length > 0) {
              anno.diseases.forEach(disease => {
                rows.push([
                  system.systemName || system.id || '',
                  anno.locationName || '',
                  disease.id || '',
                  disease.name || '',
                  anno.treatmentNotes || '',
                  anno.createdAt || ''
                ]);
              });
            } else {
              rows.push([
                system.systemName || system.id || '',
                anno.locationName || '',
                '',
                '',
                anno.treatmentNotes || '',
                anno.createdAt || ''
              ]);
            }
          });
        }
      });
    }

    const csvContent = rows.map(row => 
      row.map(cell => {
        const str = String(cell);
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      }).join(',')
    ).join('\r\n');

    return '\ufeff' + csvContent;
  }

  /**
   * 下載病歷
   * @param {string} format - 格式 ('json', 'text', 'csv', 'pdf')
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
    } else if (format === 'csv') {
      const content = this.exportAsCSV(recordId);
      downloadFile(content, `${filename}.csv`, 'text/csv;charset=utf-8');
    } else if (format === 'pdf') {
      this.exportAsPDF(recordId, filename);
    }

    dispatchEvent('record:downloaded', { recordId, format });
  }

  /**
   * 匯出病歷為 PDF 並下載
   * @param {string} recordId - 病歷 ID
   * @param {string} filename - 檔案名稱
   */
  exportAsPDF(recordId = null, filename = '') {
    const record = recordId
      ? getFromLocalStorage(`${this.storageKeyPrefix}-${recordId}`)
      : this.getCurrentRecord();

    if (!record) return;

    const printContent = this.generatePDFContent(record);
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('無法開啟新視窗，請檢查瀏覽器設定');
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>醫療病歷報告</title>
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { 
            font-family: "Microsoft JhengHei", "Heiti TC", sans-serif; 
            padding: 40px; 
            max-width: 800px; 
            margin: 0 auto; 
            line-height: 1.6;
            color: #333;
          }
          h1 { 
            text-align: center; 
            color: #2c3e50; 
            border-bottom: 3px solid #3498db; 
            padding-bottom: 15px; 
            margin-bottom: 30px;
          }
          h2 { 
            color: #2980b9; 
            margin-top: 25px; 
            margin-bottom: 15px;
            border-left: 4px solid #3498db;
            padding-left: 10px;
          }
          .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10px;
            margin-bottom: 25px;
            background: #f8f9fa;
            padding: 15px;
            border-radius: 5px;
          }
          .info-item { display: flex; }
          .info-label { font-weight: bold; min-width: 80px; }
          .timeline { border-left: 2px solid #3498db; padding-left: 20px; margin-left: 10px; }
          .timeline-item { 
            margin-bottom: 20px; 
            position: relative;
            padding: 10px 15px;
            background: #f8f9fa;
            border-radius: 5px;
          }
          .timeline-item::before {
            content: '';
            position: absolute;
            left: -26px;
            top: 15px;
            width: 10px;
            height: 10px;
            background: #3498db;
            border-radius: 50%;
          }
          .timeline-date { color: #7f8c8d; font-size: 0.9em; }
          .timeline-location { font-weight: bold; color: #2c3e50; }
          .timeline-diseases { color: #e74c3c; margin: 5px 0; }
          .timeline-notes { color: #27ae60; font-style: italic; }
          .stats { 
            display: grid; 
            grid-template-columns: repeat(3, 1fr); 
            gap: 15px;
            margin-top: 20px;
          }
          .stat-box { 
            text-align: center; 
            padding: 15px; 
            background: #ecf0f1; 
            border-radius: 5px;
          }
          .stat-value { font-size: 2em; font-weight: bold; color: #3498db; }
          .stat-label { color: #7f8c8d; }
          .footer { 
            text-align: center; 
            margin-top: 40px; 
            padding-top: 20px; 
            border-top: 1px solid #ddd;
            color: #7f8c8d;
            font-size: 0.9em;
          }
          @media print {
            body { padding: 20px; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        ${printContent}
        <div class="footer">
          <p>此報告由牙科解剖學習與診斷系統生成</p>
          <p>生成時間: ${new Date().toLocaleString('zh-TW')}</p>
        </div>
        <div class="no-print" style="text-align: center; margin-top: 30px;">
          <button onclick="window.print()" style="padding: 10px 20px; font-size: 16px; cursor: pointer;">
            列印 / 另存為 PDF
          </button>
        </div>
      </body>
      </html>
    `);
    printWindow.document.close();
  }

  /**
   * 生成 PDF 內容 HTML
   * @param {object} record - 病歷資料
   * @returns {string} HTML 內容
   */
  generatePDFContent(record) {
    let html = `<h1>醫療結構化病歷報告</h1>`;
    
    html += `<div class="info-grid">`;
    html += `<div class="info-item"><span class="info-label">病歷ID:</span> ${record.recordId}</div>`;
    html += `<div class="info-item"><span class="info-label">患者ID:</span> ${record.patientId || '未指定'}</div>`;
    html += `<div class="info-item"><span class="info-label">創建時間:</span> ${formatDateTime(new Date(record.createdAt))}</div>`;
    html += `<div class="info-item"><span class="info-label">更新時間:</span> ${formatDateTime(new Date(record.updatedAt))}</div>`;
    html += `</div>`;

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

            if (anno.diseases && anno.diseases.length > 0) {
              anno.diseases.forEach(disease => {
                diseaseSet.add(disease.name);
              });
            }
          });
        }
      });
    }

    allAnnotations.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    html += `<h2>治療時間軸</h2>`;
    html += `<div class="timeline">`;

    if (allAnnotations.length > 0) {
      allAnnotations.forEach((anno, index) => {
        const timestamp = formatDateTime(new Date(anno.createdAt), 'YYYY-MM-DD HH:mm');
        html += `<div class="timeline-item">`;
        html += `<div class="timeline-date">${timestamp}</div>`;
        html += `<div class="timeline-location">${anno.systemName} - ${anno.locationName || '未知位置'}</div>`;
        
        if (anno.diseases && anno.diseases.length > 0) {
          const diseaseList = anno.diseases.map(d => `${d.id} ${d.name}`).join(', ');
          html += `<div class="timeline-diseases">疾病: ${diseaseList}</div>`;
        }
        
        if (anno.treatmentNotes) {
          html += `<div class="timeline-notes">摘要: ${anno.treatmentNotes}</div>`;
        }
        html += `</div>`;
      });
    } else {
      html += `<p>(尚無治療記錄)</p>`;
    }

    html += `</div>`;

    html += `<h2>統計資訊</h2>`;
    html += `<div class="stats">`;
    html += `<div class="stat-box"><div class="stat-value">${totalAnnotations}</div><div class="stat-label">總標註數</div></div>`;
    html += `<div class="stat-box"><div class="stat-value">${record.anatomicalSystems ? record.anatomicalSystems.length : 0}</div><div class="stat-label">系統數量</div></div>`;
    html += `<div class="stat-box"><div class="stat-value">${diseaseSet.size}</div><div class="stat-label">疾病種類</div></div>`;
    html += `</div>`;

    return html;
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

  /**
   * 備份所有病歷數據
   * @returns {Object} 備份資料
   */
  backupAllData() {
    try {
      const recordIds = getFromLocalStorage(`${this.storageKeyPrefix}-ids`, []);
      const records = recordIds.map(id => 
        getFromLocalStorage(`${this.storageKeyPrefix}-${id}`)
      ).filter(r => r !== null);

      const backupData = {
        version: '1.0',
        createdAt: new Date().toISOString(),
        appName: 'Anatomy Medical System',
        recordCount: records.length,
        records: records
      };

      return backupData;
    } catch (error) {
      console.error('[backupAllData] 備份失敗:', error);
      return null;
    }
  }

  /**
   * 下載備份檔案
   */
  downloadBackup() {
    const backupData = this.backupAllData();
    if (!backupData) {
      showNotification('備份失敗', 'error');
      return;
    }

    const content = JSON.stringify(backupData, null, 2);
    const timestamp = formatDateTime(new Date(), 'YYYY-MM-DD-HH-mm');
    const filename = `anatomy-backup-${timestamp}.json`;
    
    downloadFile(content, filename, 'application/json');
    showNotification(`已備份 ${backupData.recordCount} 筆病歷`, 'success');
  }

  /**
   * 還原病歷數據
   * @param {File} file 備份檔案
   * @returns {Object} 還原結果
   */
  async restoreFromBackup(file) {
    try {
      const text = await file.text();
      const backupData = JSON.parse(text);

      if (!backupData.version || !backupData.records) {
        throw new Error('無效的備份檔案格式');
      }

      let restoredCount = 0;

      backupData.records.forEach(record => {
        if (record.recordId) {
          const storageKey = `${this.storageKeyPrefix}-${record.recordId}`;
          saveToLocalStorage(storageKey, record);
          restoredCount++;
        }
      });

      const recordIds = backupData.records
        .filter(r => r.recordId)
        .map(r => r.recordId);
      saveToLocalStorage(`${this.storageKeyPrefix}-ids`, recordIds);

      this.loadRecords();
      
      showNotification(`已還原 ${restoredCount} 筆病歷`, 'success');
      
      return { success: true, count: restoredCount };
    } catch (error) {
      console.error('[restoreFromBackup] 還原失敗:', error);
      showNotification('還原失敗: ' + error.message, 'error');
      return { success: false, error: error.message };
    }
  }
}
