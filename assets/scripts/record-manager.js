/* ================================================
   病歷管理模組 (RecordManager)
   以 localStorage['medicalRecords'] 為唯一資料來源
   提供唯讀巢狀檢視相容匯出、PDF 與統計模組
   ================================================ */

class RecordManager {
  /**
   * 初始化病歷管理器
   * @param {object} options - 配置選項
   */
  constructor(options = {}) {
    this.storageKey = 'medicalRecords';
    this.legacyBackupKey = 'anatomy-record-legacy-backup';
    this.storageKeyPrefix = options.storageKeyPrefix || 'anatomy-record';

    this.init();
  }

  /**
   * 系統 ID 正規化（例如 primary_teeth / tooth -> teeth）
   * @param {string} systemId - 原始系統 ID
   * @returns {string} 正規化後的系統 ID
   */
  static normalizeSystem(systemId) {
    if (!systemId) return '';
    if (systemId === 'primary_teeth' || systemId === 'tooth') return 'teeth';
    return systemId;
  }

  /**
   * 判定記錄是否符合特定系統（通用篩選規則）
   * @param {object} record - 標註記錄
   * @param {string} systemId - 欲比對的系統 ID
   * @returns {boolean} 是否符合
   */
  static matchesSystem(record, systemId) {
    if (!record) return false;
    const sys = RecordManager.normalizeSystem(systemId);
    if (record.system) {
      const recSys = RecordManager.normalizeSystem(record.system);
      return recSys === sys;
    }
    if (sys === 'teeth') return !!(record.fdiNumber || record.universalNumber);
    if (sys === 'eye')   return !!(record.structureId || (record.side && !record.fdiNumber)) && !record.bodyRegionId && !record.bodyPart && !record.operationType;
    if (sys === 'body')  return !!(record.bodyRegionId || record.operationType || record.bodyPart);
    return false;
  }

  /**
   * 初始化：執行舊版疾病資料遷移、Phase 6 舊 key 自動遷移與缺漏 system 欄位回填
   */
  init() {
    // 檢查是否需要舊版疾病數據遷移 (DiseaseDataMigration)
    if (typeof DiseaseDataMigration !== 'undefined' &&
        DiseaseDataMigration.needsMigration(this.storageKeyPrefix)) {
      try {
        DiseaseDataMigration.migrateAllRecords(this.storageKeyPrefix);
      } catch (err) {
        console.error('[RecordManager] DiseaseDataMigration 失敗:', err);
      }
    }

    // Phase 6 舊 key (anatomy-record-*) 自動遷移至 medicalRecords
    this.migrateLegacyData();

    // 資料回填：補齊 medicalRecords 中缺少 system 的記錄
    this.backfillMissingSystems();
  }

  /**
   * 解析標註所屬系統（若缺少 system 則依序推斷，body 優先）
   * @param {object} anno - 標註記錄
   * @returns {string} 系統 ID（teeth, eye, body 或 unknown）
   */
  static resolveSystem(anno) {
    if (!anno || typeof anno !== 'object') return 'unknown';
    if (anno.system) {
      return RecordManager.normalizeSystem(anno.system);
    }
    // 依序用 matchesSystem 推斷，body 必須最先判斷避免被 eye 規則誤判
    if (RecordManager.matchesSystem(anno, 'body')) return 'body';
    if (RecordManager.matchesSystem(anno, 'eye')) return 'eye';
    if (RecordManager.matchesSystem(anno, 'teeth')) return 'teeth';
    return 'unknown';
  }

  resolveSystem(anno) {
    return RecordManager.resolveSystem(anno);
  }

  /**
   * 資料回填：補齊缺少 system 欄位的標註記錄
   */
  backfillMissingSystems() {
    try {
      const records = this.getAllAnnotations();
      if (!Array.isArray(records) || records.length === 0) return;

      let changed = false;
      const updated = records.map(anno => {
        if (!anno || typeof anno !== 'object') return anno;
        if (!anno.system) {
          const sys = this.resolveSystem(anno);
          if (sys !== 'unknown') {
            changed = true;
            return {
              ...anno,
              system: sys
            };
          }
        }
        return anno;
      });

      if (changed) {
        this.replaceAllAnnotations(updated);
      }
    } catch (e) {
      console.error('[RecordManager] 回填 system 欄位失敗:', e);
    }
  }

  /**
   * 自動遷移舊格式 anatomy-record-* 資料至 medicalRecords
   * 保留完整原始備份至 anatomy-record-legacy-backup，並清理舊 key
   */
  migrateLegacyData() {
    try {
      const idsRaw = localStorage.getItem(`${this.storageKeyPrefix}-ids`);
      const legacyKeys = Object.keys(localStorage).filter(k =>
        k.startsWith(`${this.storageKeyPrefix}-`) && k !== this.legacyBackupKey
      );

      if (legacyKeys.length === 0 && !idsRaw) {
        return;
      }

      // 1. 備份所有舊 key 的原始字串（已存在則合併，不覆蓋）
      const backupEntries = {};
      legacyKeys.forEach(k => {
        const val = localStorage.getItem(k);
        if (val !== null) backupEntries[k] = val;
      });
      if (idsRaw && !backupEntries[`${this.storageKeyPrefix}-ids`]) {
        backupEntries[`${this.storageKeyPrefix}-ids`] = idsRaw;
      }

      let existingBackup = null;
      try {
        const bRaw = localStorage.getItem(this.legacyBackupKey);
        if (bRaw) existingBackup = JSON.parse(bRaw);
      } catch (e) {
        console.error('[RecordManager] 讀取舊備份失敗:', e);
      }

      const legacyBackup = {
        migratedAt: new Date().toISOString(),
        entries: {
          ...(existingBackup?.entries || {}),
          ...backupEntries
        }
      };
      localStorage.setItem(this.legacyBackupKey, JSON.stringify(legacyBackup));

      // 2. 解析巢狀病歷並提取標註
      const migratedAnnotations = [];
      legacyKeys.forEach(k => {
        if (k === `${this.storageKeyPrefix}-ids`) return;
        try {
          const rec = JSON.parse(localStorage.getItem(k));
          if (rec && Array.isArray(rec.anatomicalSystems)) {
            rec.anatomicalSystems.forEach(sys => {
              const sysId = RecordManager.normalizeSystem(sys.systemId);
              if (Array.isArray(sys.annotations)) {
                sys.annotations.forEach(anno => {
                  if (!anno || typeof anno !== 'object') return;
                  migratedAnnotations.push({
                    ...anno,
                    system: RecordManager.normalizeSystem(anno.system || sysId),
                    annotationId: anno.annotationId || generateUUID(),
                    createdAt: anno.createdAt || rec.createdAt || new Date().toISOString(),
                    updatedAt: anno.updatedAt || rec.updatedAt || new Date().toISOString()
                  });
                });
              }
            });
          }
        } catch (e) {
          console.error(`[RecordManager] 解析舊病歷 ${k} 失敗:`, e);
        }
      });

      // 3. 併入現有 medicalRecords（以 medicalRecords 為準，依 annotationId 去重）
      let currentRecords = this.getAllAnnotations();
      const existingIdSet = new Set(currentRecords.map(r => r.annotationId).filter(Boolean));

      migratedAnnotations.forEach(anno => {
        if (!existingIdSet.has(anno.annotationId)) {
          currentRecords.push(anno);
          existingIdSet.add(anno.annotationId);
        }
      });

      const writeSuccess = this.replaceAllAnnotations(currentRecords);
      if (!writeSuccess) {
        return;
      }

      // 4. 清理舊 key（不刪除備份 key）
      legacyKeys.forEach(k => {
        localStorage.removeItem(k);
      });
      localStorage.removeItem(`${this.storageKeyPrefix}-ids`);

    } catch (error) {
      console.error('[RecordManager] 自動遷移舊資料失敗:', error);
    }
  }

  /**
   * 獲取所有扁平標註記錄（複本）
   * @returns {Array} 標註陣列
   */
  getAllAnnotations() {
    try {
      const data = localStorage.getItem(this.storageKey);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('[RecordManager] 讀取 medicalRecords 失敗:', error);
      return [];
    }
  }

  /**
   * 整批替換所有標註記錄
   * @param {Array} list - 新的標註陣列
   * @returns {boolean} 是否成功
   */
  replaceAllAnnotations(list) {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(list || []));
      return true;
    } catch (error) {
      console.error('[RecordManager] 寫入 medicalRecords 失敗:', error);
      return false;
    }
  }

  /**
   * 獲取特定系統的所有標註
   * @param {string} systemId - 解剖系統 ID
   * @returns {Array} 標註陣列
   */
  getAnnotationsBySystem(systemId) {
    const records = this.getAllAnnotations();
    return records.filter(r => RecordManager.matchesSystem(r, systemId));
  }

  /**
   * 新增標註到病歷
   * @param {string} systemId - 解剖系統 ID
   * @param {object} annotation - 標註物件
   * @returns {object} 新增後的完整標註
   */
  addAnnotation(systemId, annotation) {
    const normalizedSys = RecordManager.normalizeSystem(systemId || annotation.system);
    const now = new Date().toISOString();
    const newAnno = {
      ...annotation,
      system: normalizedSys,
      annotationId: annotation.annotationId || generateUUID(),
      createdAt: annotation.createdAt || now,
      updatedAt: annotation.updatedAt || now
    };

    const records = this.getAllAnnotations();
    records.push(newAnno);
    this.replaceAllAnnotations(records);

    dispatchEvent('annotation:added', { systemId: normalizedSys, annotation: newAnno });
    return newAnno;
  }

  /**
   * 更新現有標註
   * @param {string} systemId - 解剖系統 ID
   * @param {string} annotationId - 標註 ID
   * @param {object} updates - 更新內容
   * @returns {boolean} 是否更新成功
   */
  updateAnnotation(systemId, annotationId, updates) {
    const records = this.getAllAnnotations();
    const idx = records.findIndex(a => a.annotationId === annotationId);
    if (idx === -1) return false;

    records[idx] = {
      ...records[idx],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    if (systemId) {
      records[idx].system = RecordManager.normalizeSystem(systemId);
    }
    this.replaceAllAnnotations(records);

    dispatchEvent('annotation:updated', { systemId, annotationId, updates });
    return true;
  }

  /**
   * 刪除標註
   * @param {string} systemId - 解剖系統 ID
   * @param {string} annotationId - 標註 ID
   * @returns {boolean} 是否刪除成功
   */
  deleteAnnotation(systemId, annotationId) {
    const records = this.getAllAnnotations();
    const filtered = records.filter(a => a.annotationId !== annotationId);
    if (filtered.length === records.length) return false;

    this.replaceAllAnnotations(filtered);
    dispatchEvent('annotation:deleted', { systemId, annotationId });
    return true;
  }

  /**
   * 唯讀巢狀檢視：將扁平標註組成一筆虛擬病歷，相容舊有匯出、統計、PDF 與搜尋
   * @returns {object} 虛擬巢狀病歷物件
   */
  getCurrentRecord() {
    const annotations = this.getAllAnnotations();
    if (annotations.length === 0) {
      return {
        recordId: 'all',
        patientId: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        notes: '',
        anatomicalSystems: []
      };
    }

    let earliestCreated = null;
    let latestUpdated = null;
    const systemsMap = {};

    annotations.forEach(anno => {
      const cTime = anno.createdAt ? new Date(anno.createdAt).getTime() : null;
      const uTime = anno.updatedAt ? new Date(anno.updatedAt).getTime() : cTime;

      if (cTime && (!earliestCreated || cTime < earliestCreated)) {
        earliestCreated = cTime;
      }
      if (uTime && (!latestUpdated || uTime > latestUpdated)) {
        latestUpdated = uTime;
      }

      const sysId = this.resolveSystem(anno);
      if (!systemsMap[sysId]) {
        systemsMap[sysId] = {
          systemId: sysId,
          systemName: sysId === 'teeth' ? '牙齒系統' : sysId === 'eye' ? '眼睛系統' : sysId === 'body' ? '身體系統' : (sysId === 'unknown' ? '未分類' : sysId),
          imageId: '',
          annotations: []
        };
      }
      systemsMap[sysId].annotations.push(anno);
    });

    const now = new Date().toISOString();
    return {
      recordId: 'all',
      patientId: '',
      createdAt: earliestCreated ? new Date(earliestCreated).toISOString() : now,
      updatedAt: latestUpdated ? new Date(latestUpdated).toISOString() : now,
      notes: '',
      anatomicalSystems: Object.values(systemsMap)
    };
  }

  /**
   * 獲取所有病歷（巢狀檢視相容介面）
   * @returns {Array} 病歷陣列，無標註時回傳空陣列，有標註時回傳包含單一虛擬病歷之陣列
   */
  getAllRecords() {
    const annotations = this.getAllAnnotations();
    if (annotations.length === 0) return [];
    return [this.getCurrentRecord()];
  }

  /**
   * 舊方法相容實作（不寫入任何 anatomy-record-* key）
   */
  createRecord(recordData = {}) { return 'all'; }
  saveRecord(record) {}
  updateRecordIds() {}
  deleteRecord(recordId) {}
  loadRecords() {}

  /**
   * 匯出病歷為 JSON 字串
   * @param {string} recordId - 病歷 ID
   * @returns {string|null} JSON 字串
   */
  exportAsJSON(recordId = null) {
    const record = this.getCurrentRecord();
    if (!record) return null;
    return JSON.stringify(record, null, 2);
  }

  /**
   * 匯出病歷為人類可讀文字格式
   * @param {string} recordId - 病歷 ID
   * @returns {string} 文字內容
   */
  exportAsText(recordId = null) {
    const record = this.getCurrentRecord();
    if (!record) return '';

    let text = '醫療結構化病歷報告\n';
    text += '=====================================\n\n';
    text += `病歷 ID: ${record.recordId}\n`;
    text += `患者 ID: ${record.patientId || '未指定'}\n`;
    text += `創建時間: ${formatDateTime(new Date(record.createdAt))}\n`;
    text += `更新時間: ${formatDateTime(new Date(record.updatedAt))}\n\n`;

    const allAnnotations = [];
    let totalAnnotations = 0;
    const diseaseSet = new Set();

    if (record.anatomicalSystems && record.anatomicalSystems.length > 0) {
      record.anatomicalSystems.forEach(system => {
        if (system.annotations && system.annotations.length > 0) {
          system.annotations.forEach(anno => {
            totalAnnotations++;
            allAnnotations.push({
              ...anno,
              systemName: system.systemName,
              createdAt: anno.createdAt || new Date().toISOString()
            });

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

    text += '[治療時間軸]\n';
    text += '=====================================\n\n';

    if (allAnnotations.length > 0) {
      allAnnotations.forEach((anno, index) => {
        const timestamp = formatDateTime(new Date(anno.createdAt), 'YYYY-MM-DD HH:mm');
        text += `${timestamp} - ${anno.locationName || '未知位置'}\n`;

        if (anno.diseases && anno.diseases.length > 0) {
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

    text += '\n[統計信息]\n';
    text += '=====================================\n';
    text += `總標註數: ${totalAnnotations}\n`;
    text += `系統數量: ${record.anatomicalSystems ? record.anatomicalSystems.length : 0}\n`;
    text += `疾病種類: ${diseaseSet.size}\n`;

    return text;
  }

  /**
   * 匯出病歷為 CSV 格式
   * @param {string} recordId - 病歷 ID
   * @returns {string} CSV 字串
   */
  exportAsCSV(recordId = null) {
    const record = this.getCurrentRecord();
    if (!record) return '';

    const rows = [];
    rows.push(['病歷 ID', '患者 ID', '系統', '位置', '疾病代碼', '疾病名稱', '備註', '記錄時間']);

    if (record.anatomicalSystems) {
      record.anatomicalSystems.forEach(system => {
        if (system.annotations) {
          system.annotations.forEach(anno => {
            const diseaseNames = (anno.diseases || []).map(d => d.name).join('; ');
            const diseaseIds = (anno.diseases || []).map(d => d.id).join('; ');
            const location = anno.locationName || (anno.fdiNumber ? `FDI: ${anno.fdiNumber}` : '');

            rows.push([
              record.recordId,
              record.patientId || '',
              system.systemName || system.systemId,
              location,
              diseaseIds,
              diseaseNames,
              anno.treatmentNotes || anno.notes || anno.description || '',
              formatDateTime(new Date(anno.createdAt || record.createdAt))
            ]);
          });
        }
      });
    }

    return rows.map(row =>
      row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')
    ).join('\n');
  }

  /**
   * 匯出病歷為 PDF 並開啟列印視窗
   * @param {string} recordId - 病歷 ID
   * @param {string} filename - 檔案名稱
   */
  exportAsPDF(recordId = null, filename = '') {
    const record = this.getCurrentRecord();
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
            color: #34495e; 
            margin-top: 30px; 
            margin-bottom: 15px; 
            border-left: 4px solid #3498db; 
            padding-left: 10px;
          }
          .info-table { 
            width: 100%; 
            border-collapse: collapse; 
            margin-bottom: 30px;
          }
          .info-table td { 
            padding: 10px; 
            border: 1px solid #ddd;
          }
          .info-table td:first-child { 
            font-weight: bold; 
            background: #f8f9fa; 
            width: 150px;
          }
          .timeline-item { 
            margin-bottom: 20px; 
            padding-bottom: 15px; 
            border-bottom: 1px solid #eee;
          }
          .timeline-date { 
            color: #7f8c8d; 
            font-size: 14px; 
            margin-bottom: 5px;
          }
          .timeline-location { 
            font-size: 16px; 
            font-weight: bold; 
            color: #2c3e50; 
            margin-bottom: 8px;
          }
          .timeline-diseases { 
            margin-bottom: 5px; 
            color: #e74c3c;
          }
          .timeline-notes { 
            color: #555; 
            font-size: 14px; 
            background: #f8f9fa; 
            padding: 8px 12px; 
            border-radius: 4px;
          }
          .stats { 
            display: flex; 
            gap: 20px; 
            margin-top: 20px;
          }
          .stat-box { 
            flex: 1; 
            padding: 15px; 
            background: #f8f9fa; 
            border-radius: 4px; 
            text-align: center;
          }
          .stat-value { 
            font-size: 24px; 
            font-weight: bold; 
            color: #3498db;
          }
          .stat-label { 
            color: #7f8c8d; 
            font-size: 12px; 
            margin-top: 5px;
          }
          @media print {
            body { padding: 0; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        ${printContent}
      </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();

    setTimeout(() => {
      printWindow.print();
    }, 250);
  }

  /**
   * 產生 PDF HTML 內容
   * @param {object} record - 病歷資料
   * @returns {string} HTML 內容
   */
  generatePDFContent(record) {
    let html = `<h1>醫療結構化病歷報告</h1>`;

    html += `<table class="info-table">`;
    html += `<tr><td>病歷 ID</td><td>${escapeHtml(record.recordId)}</td></tr>`;
    html += `<tr><td>患者 ID</td><td>${escapeHtml(record.patientId || '未指定')}</td></tr>`;
    html += `<tr><td>創建時間</td><td>${escapeHtml(formatDateTime(new Date(record.createdAt)))}</td></tr>`;
    html += `<tr><td>更新時間</td><td>${escapeHtml(formatDateTime(new Date(record.updatedAt)))}</td></tr>`;
    html += `</table>`;

    const allAnnotations = [];
    let totalAnnotations = 0;
    const diseaseSet = new Set();

    if (record.anatomicalSystems && record.anatomicalSystems.length > 0) {
      record.anatomicalSystems.forEach(system => {
        if (system.annotations && system.annotations.length > 0) {
          system.annotations.forEach(anno => {
            totalAnnotations++;
            allAnnotations.push({
              ...anno,
              systemName: system.systemName,
              createdAt: anno.createdAt || new Date().toISOString()
            });

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
      allAnnotations.forEach(anno => {
        const timestamp = formatDateTime(new Date(anno.createdAt), 'YYYY-MM-DD HH:mm');
        html += `<div class="timeline-item">`;
        html += `<div class="timeline-date">${escapeHtml(timestamp)}</div>`;
        html += `<div class="timeline-location">${escapeHtml(anno.systemName)} - ${escapeHtml(anno.locationName || '未知位置')}</div>`;

        if (anno.diseases && anno.diseases.length > 0) {
          const diseaseList = anno.diseases.map(d => `${escapeHtml(d.id)} ${escapeHtml(d.name)}`).join(', ');
          html += `<div class="timeline-diseases">疾病: ${diseaseList}</div>`;
        }

        if (anno.treatmentNotes) {
          html += `<div class="timeline-notes">摘要: ${escapeHtml(anno.treatmentNotes)}</div>`;
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
   * 搜尋病歷標註
   * @param {string} query - 關鍵字
   * @returns {Array} 搜尋結果陣列
   */
  searchRecords(query) {
    const record = this.getCurrentRecord();
    if (!record || !query) return [];

    const lowerQuery = query.toLowerCase();
    const results = [];

    (record.anatomicalSystems || []).forEach(system => {
      (system.annotations || []).forEach(anno => {
        let matched = false;
        if (anno.locationName && anno.locationName.toLowerCase().includes(lowerQuery)) matched = true;
        if (anno.treatmentNotes && anno.treatmentNotes.toLowerCase().includes(lowerQuery)) matched = true;
        if (anno.description && anno.description.toLowerCase().includes(lowerQuery)) matched = true;
        if (anno.diseases) {
          anno.diseases.forEach(d => {
            if (d.name && d.name.toLowerCase().includes(lowerQuery)) matched = true;
            if (d.nameEn && d.nameEn.toLowerCase().includes(lowerQuery)) matched = true;
            if (d.id && d.id.toLowerCase().includes(lowerQuery)) matched = true;
          });
        }
        if (matched) {
          results.push({
            recordId: record.recordId,
            patientId: record.patientId,
            annotation: anno,
            systemName: system.systemName
          });
        }
      });
    });

    return results;
  }

  /**
   * 獲取統計資訊
   * @returns {object} 統計物件
   */
  getStatistics() {
    const record = this.getCurrentRecord();
    if (!record) return { totalAnnotations: 0, systems: 0 };

    let totalAnnotations = 0;
    (record.anatomicalSystems || []).forEach(system => {
      totalAnnotations += (system.annotations || []).length;
    });

    return {
      totalAnnotations,
      systems: (record.anatomicalSystems || []).length,
      createdAt: record.createdAt,
      lastUpdated: record.updatedAt
    };
  }

  /**
   * 下載病歷記錄（支援 json, text, csv, pdf）
   * @param {string} format - 格式
   * @param {string} recordId - 病歷 ID（可省略）
   */
  downloadRecord(format = 'json', recordId = null) {
    const record = this.getCurrentRecord();
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

    dispatchEvent('record:downloaded', { recordId: record.recordId, format });
  }

  /**
   * 清除所有病歷
   * @returns {boolean} 是否成功
   */
  clearAll() {
    if (confirm('確認清空所有病歷？')) {
      this.replaceAllAnnotations([]);
      dispatchEvent('records:cleared');
      return true;
    }
    return false;
  }

  /**
   * 備份所有病歷數據（v2.0 格式）
   * @returns {object|null} 備份物件
   */
  backupAllData() {
    try {
      const records = this.getAllAnnotations();
      return {
        version: '2.0',
        createdAt: new Date().toISOString(),
        appName: 'Anatomy Medical System',
        recordCount: records.length,
        records: records
      };
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
    const filename = `anatomy-backup-v2-${timestamp}.json`;

    downloadFile(content, filename, 'application/json');
    showNotification(`已備份 ${backupData.recordCount} 筆病歷`, 'success');
  }

  /**
   * 還原病歷數據（相容 v1.0 巢狀格式與 v2.0 扁平格式）
   * @param {File} file - 備份檔案
   * @returns {Promise<object>} 還原結果 { success, count }
   */
  async restoreFromBackup(file) {
    try {
      const text = await file.text();
      const backupData = JSON.parse(text);

      if (!backupData || typeof backupData !== 'object' || !backupData.records) {
        throw new Error('無效的備份檔案格式');
      }

      let restoredAnnotations = [];

      if (backupData.version && String(backupData.version).startsWith('2.')) {
        // v2.0 扁平格式
        if (!Array.isArray(backupData.records)) {
          throw new Error('v2 備份缺少 records 陣列');
        }
        restoredAnnotations = backupData.records.map(anno => {
          if (!anno || typeof anno !== 'object') return null;
          return {
            ...anno,
            system: RecordManager.normalizeSystem(anno.system),
            annotationId: anno.annotationId || generateUUID(),
            createdAt: anno.createdAt || new Date().toISOString(),
            updatedAt: anno.updatedAt || new Date().toISOString()
          };
        }).filter(Boolean);
      } else if (backupData.version && String(backupData.version).startsWith('1.')) {
        // v1.0 舊巢狀格式
        if (!Array.isArray(backupData.records)) {
          throw new Error('v1 備份缺少 records 陣列');
        }
        backupData.records.forEach(rec => {
          if (rec && Array.isArray(rec.anatomicalSystems)) {
            rec.anatomicalSystems.forEach(sys => {
              const sysId = RecordManager.normalizeSystem(sys.systemId);
              if (Array.isArray(sys.annotations)) {
                sys.annotations.forEach(anno => {
                  if (!anno || typeof anno !== 'object') return;
                  restoredAnnotations.push({
                    ...anno,
                    system: RecordManager.normalizeSystem(anno.system || sysId),
                    annotationId: anno.annotationId || generateUUID(),
                    createdAt: anno.createdAt || rec.createdAt || new Date().toISOString(),
                    updatedAt: anno.updatedAt || rec.updatedAt || new Date().toISOString()
                  });
                });
              }
            });
          }
        });
      } else {
        throw new Error('未知的備份版本');
      }

      if (restoredAnnotations.length === 0 && backupData.records.length > 0) {
        throw new Error('備份檔中沒有任何有效的病歷記錄');
      }

      // 取代寫入
      const writeSuccess = this.replaceAllAnnotations(restoredAnnotations);
      if (!writeSuccess) {
        throw new Error('寫入本機存儲失敗');
      }

      dispatchEvent('records:restored', { count: restoredAnnotations.length });
      showNotification(`已成功還原 ${restoredAnnotations.length} 筆病歷記錄`, 'success');

      return { success: true, count: restoredAnnotations.length };
    } catch (error) {
      console.error('[restoreFromBackup] 還原失敗:', error);
      showNotification('還原失敗: ' + error.message, 'error');
      return { success: false, error: error.message };
    }
  }
}
