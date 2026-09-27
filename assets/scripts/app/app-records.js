/* ================================================
   病歷管理與匯出模組 (Records Management)
   ================================================ */

defineAppMethods({
  /**
   * 更新病歷列表顯示
   * @param {string} systemId - 系統 ID
   */
  updateRecordList(systemId) {
    return this.loadAndDisplayRecords();
  },

  /**
   * 導出病歷
   * @param {string} format - 格式
   */
  exportRecord(format) {
    try {
      this.recordManager.downloadRecord(format);
      showNotification(`已導出 ${format.toUpperCase()} 格式`, 'success');
    } catch (error) {
      console.error('導出失敗:', error);
      showNotification('導出失敗', 'error');
    }
  },

  /**
   * 清空病歷
   */
  async clearRecords() {
    if (this.recordManager && this.recordManager.clearAll()) {
      this.loadAnnotations(this.currentSystemId);
      await this.loadAndDisplayRecords();
      if (this.recordStatistics) {
        this.recordStatistics.updateDisplay();
      }
      showNotification('已清空所有病歷', 'info');
    }
  },

  /**
   * 處理病歷標籤頁切換
   * @param {Event} e - 事件
   */
  handleRecordTabClick(e) {
    const tab = e.currentTarget;
    const tabName = tab.dataset.tab;

    // 更新標籤頁 UI
    $$('.record-tab').forEach(t => t.classList.remove('record-tab--active'));
    tab.classList.add('record-tab--active');

    // 更新面板 UI
    $$('.record-panel').forEach(p => p.classList.remove('record-panel--active'));
    const panelId = tab.getAttribute('aria-controls');
    const panel = $(`#${panelId}`);
    if (panel) {
      panel.classList.add('record-panel--active');
    }

    // 如果切換到統計標籤，更新統計數據
    if (tabName === 'statistics' && this.recordStatistics) {
      this.recordStatistics.updateDisplay();
    }
  },

  /**
   * 按結構位置對病例進行分組
   * @param {Array} records - 所有病例記錄
   * @returns {Array} 分組後的病例組 (依降序排列)
   */
  groupRecordsByStructure(records) {
    const grouped = {};

    // 按 structureId 分組
    records.forEach(record => {
      // 區分身體、牙齒和眼睛系統
      let groupKey = '';
      let structureId = '';
      let structureName = '';
      let structureSide = '';

      if (record.bodyRegionId || record.bodyPart) {
        // 身體系統：按 bodyRegionId/bodyPart 和 side 分組
        const regionId = record.bodyRegionId || record.bodyPart;
        groupKey = `${regionId}-${record.side || ''}`;
        structureId = regionId;
        structureName = record.locationName || record.nameZh || (this.getChineseBodyRegionName ? this.getChineseBodyRegionName(record.bodyPart, record.side) : record.bodyPart);
        structureSide = record.side;
      } else if (record.fdiNumber) {
        // 牙齒系統：按 FDI 編號分組
        groupKey = record.fdiNumber || record.locationName;
        structureId = groupKey;
        structureName = record.locationName;
        structureSide = 'tooth';
      } else if (record.structureId) {
        // 眼睛系統：按 structureId 分組
        groupKey = record.structureId;
        structureId = record.structureId;
        structureName = record.locationName;
        structureSide = record.side;
      } else {
        // 其他系統：按 locationName 分組
        groupKey = record.locationName;
        structureId = groupKey;
        structureName = record.locationName;
        structureSide = 'other';
      }

      if (!grouped[groupKey]) {
        grouped[groupKey] = {
          structureId,
          structureName,
          structureSide,
          records: []
        };
      }

      grouped[groupKey].records.push(record);
    });

    // 每組內按時間排序（最新在前）
    Object.values(grouped).forEach(group => {
      group.records.sort((a, b) => {
        return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
      });
    });

    // 轉換為陣列並依據最新記錄排序
    const groupedArray = Object.values(grouped);
    groupedArray.sort((a, b) => {
      const latestA = new Date(a.records[0].createdAt || 0);
      const latestB = new Date(b.records[0].createdAt || 0);
      return latestB - latestA;
    });

    return groupedArray;
  },

  /**
   * 格式化 ISO 時間戳為可讀格式
   * @param {string} isoString - ISO 格式的時間戳 (如 "2026-01-15T10:30:45.000Z")
   * @returns {string} 格式化後的時間字符串 (如 "2026-01-15 10:30:45")
   */
  formatTimestamp(isoString) {
    try {
      const date = new Date(isoString);

      if (isNaN(date.getTime())) {
        return '無效的時間戳';
      }

      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      const seconds = String(date.getSeconds()).padStart(2, '0');

      return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    } catch (error) {
      console.error('[formatTimestamp] 格式化失敗:', error);
      return '時間戳格式化錯誤';
    }
  },

  /**
   * 修復舊格式的醫療記錄
   * @param {Array} records - 原始記錄陣列
   * @returns {Array} 修復後的記錄陣列
   */
  fixLegacyRecords(records) {
    return records.map(record => {
      // 修復疾病數據格式
      if (Array.isArray(record.diseases) && record.diseases.length > 0) {
        // 如果疾病是陣列，取第一項
        const firstDisease = record.diseases[0];
        if (typeof firstDisease === 'object' && !firstDisease.name) {
          // 如果疾病對象結構不完整，嘗試修復
          console.warn('[fixLegacyRecords] 發現不完整的疾病對象:', firstDisease);
        }
      }

      // 修復時間戳格式
      if (!record.timestamp && record.createdAt) {
        record.timestamp = record.createdAt;
      }

      // 確保眼睛系統記錄有 side 信息
      if (record.structureId && !record.side) {
        record.side = this.getStructureSide(record.structureId);
      }

      return record;
    });
  },

  /**
   * 渲染分組的病例列表
   * @param {Array} groupedRecords - 分組後的病例陣列
   */
  renderGroupedRecords(groupedRecords) {
    const container = document.getElementById('record-list-container');
    if (!container) {
      console.warn('[renderGroupedRecords] 找不到 record-list-container 容器');
      return;
    }

    // 清空現有內容
    container.innerHTML = '';

    if (!groupedRecords || groupedRecords.length === 0) {
      container.innerHTML = '<p class="empty-message">暫無病例記錄</p>';
      return;
    }

    // 為每個結構群組創建 HTML
    groupedRecords.forEach(group => {
      const groupDiv = document.createElement('div');
      groupDiv.className = 'record-group';

      // 群組標題
      const headerDiv = document.createElement('h4');
      headerDiv.className = 'record-group__header';

      let sideText = '';
      if (group.structureSide === 'left') {
        sideText = '左眼';
      } else if (group.structureSide === 'right') {
        sideText = '右眼';
      } else if (group.structureSide === 'bilateral') {
        sideText = '雙眼';
      } else if (group.structureSide === 'tooth') {
        sideText = '';
      } else if (group.structureSide === 'mid') {
        sideText = '中線';
      } else if (group.structureSide === 'left') {
        sideText = '左側';
      } else if (group.structureSide === 'right') {
        sideText = '右側';
      } else {
        sideText = '';
      }

      const sideBadge = sideText ? `<span class="structure-location">${sideText}</span>` : '';

      headerDiv.innerHTML = `
        <span class="structure-name">${escapeHtml(group.structureName)}</span>
        ${sideBadge}
      `;
      groupDiv.appendChild(headerDiv);

      // 記錄項目容器
      const itemsDiv = document.createElement('div');
      itemsDiv.className = 'record-group__items';

      // 為每筆記錄創建項目
      group.records.forEach((record) => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'record-item';

        const timestamp = this.formatTimestamp(record.createdAt || record.timestamp);

        // 構建 HTML
        let html = `<div class="record-item__title">${escapeHtml(record.locationName)}`;

        // 為眼睛和身體系統添加側邊信息
        if (record.side && record.side !== 'tooth') {
          let sideLabel = '';
          if (['left', 'right', 'bilateral'].includes(record.side)) {
            // 眼睛系統
            sideLabel = record.side === 'left' ? '左眼' :
                       record.side === 'right' ? '右眼' :
                       record.side === 'bilateral' ? '雙眼' : '';
          } else if (['mid', 'left', 'right'].includes(record.side)) {
            // 身體系統
            sideLabel = record.side === 'mid' ? '中線' :
                       record.side === 'left' ? '左側' :
                       record.side === 'right' ? '右側' : '';
          }
          if (sideLabel) {
            html += ` <span class="record-item__side">(${sideLabel})</span>`;
          }
        }
        html += `</div>`;
        html += `<div class="record-item__timestamp">⏰ ${timestamp}</div>`;

        // 處理疾病信息或操作類型
        if (record.operationType) {
          // 身體系統操作記錄
          const operationTypes = {
            'surgery': '手術',
            'therapy': '治療',
            'procedure': '程序',
            'examination': '檢查',
            'medication': '用藥',
            'other': '其他'
          };
          const operationName = operationTypes[record.operationType] || record.operationType;
          html += `<div class="record-item__disease">🏥 ${escapeHtml(operationName)}</div>`;
          if (record.description) {
            html += `<div class="record-item__description">📋 ${escapeHtml(record.description)}</div>`;
          }
        } else if (record.diseases && Array.isArray(record.diseases)) {
          // 牙齒和眼睛系統疾病記錄
          if (record.diseases.length > 0) {
            const disease = record.diseases[0];  // 只取第一個疾病
            let diseaseText = '';
            if (typeof disease === 'object' && disease.name) {
              diseaseText = escapeHtml(disease.name);
              if (disease.id) {
                diseaseText += ` (${escapeHtml(disease.id)})`;
              }
            } else if (typeof disease === 'string') {
              diseaseText = escapeHtml(disease);
            }
            if (diseaseText) {
              html += `<div class="record-item__disease">🏥 ${diseaseText}</div>`;
            }
          }
        }

        // 顯示備註（疾病系統使用 treatmentNotes，操作系統使用 notes）
        const notes = record.treatmentNotes || record.notes || '';
        if (notes) {
          html += `<div class="record-item__notes">📝 ${escapeHtml(notes)}</div>`;
        }

        itemDiv.innerHTML = html;
        itemsDiv.appendChild(itemDiv);
      });

      groupDiv.appendChild(itemsDiv);
      container.appendChild(groupDiv);
    });

  },

  /**
   * 保存醫療記錄（委派給 RecordManager）
   * @param {object} record - 醫療記錄
   * @returns {boolean} 是否成功
   */
  saveMedicalRecord(record) {
    return this.recordManager ? this.recordManager.addAnnotation(record.system, record) : false;
  },

  /**
   * 加載醫療記錄（委派給 RecordManager）
   * @returns {Array} 記錄陣列
   */
  loadMedicalRecords() {
    return this.recordManager ? this.recordManager.getAllAnnotations() : [];
  },

  /**
   * 加載並顯示當前系統的病例記錄
   */
  async loadAndDisplayRecords() {
    try {
      // 加載所有記錄
      let allRecords = this.loadMedicalRecords();

      if (!allRecords || allRecords.length === 0) {
        const container = document.getElementById('record-list-container');
        if (container) {
          container.innerHTML = '<p class="empty-message">暫無病例記錄</p>';
        }
        return;
      }

      // 修復舊格式的記錄
      allRecords = this.fixLegacyRecords(allRecords);

      // 重新保存修復後的記錄
      if (this.recordManager) {
        this.recordManager.replaceAllAnnotations(allRecords);
      }

      // 按當前系統過濾記錄（只顯示該系統的記錄）
      let records = this.filterRecordsBySystem(allRecords, this.currentSystemId);

      if (!records || records.length === 0) {
        const container = document.getElementById('record-list-container');
        if (container) {
          let systemName = '';
          if (this.currentSystemId === 'eye') {
            systemName = '眼睛';
          } else if (this.currentSystemId === 'body') {
            systemName = '身體';
          } else if (this.currentSystemId === 'teeth' || this.currentSystemId === 'primary_teeth') {
            systemName = '牙齒';
          } else {
            systemName = '目前';
          }
          container.innerHTML = `<p class="empty-message">暫無${systemName}系統的病例記錄</p>`;
        }
        return;
      }

      // 分組
      const groupedRecords = this.groupRecordsByStructure(records);

      // 渲染
      this.renderGroupedRecords(groupedRecords);
    } catch (error) {
      console.error('[loadAndDisplayRecords] 加載失敗:', error);
      const container = document.getElementById('record-list-container');
      if (container) {
        container.innerHTML = '<p class="empty-message">病例加載失敗</p>';
      }
    }
  },

  /**
   * 根據系統類型過濾記錄（委派給 RecordManager）
   * @param {Array} records - 所有記錄陣列
   * @param {string} systemId - 系統 ID ('teeth', 'primary_teeth', 'eye', 'body')
   * @returns {Array} 過濾後的記錄陣列
   */
  filterRecordsBySystem(records, systemId) {
    if (!records || !Array.isArray(records)) return [];
    return records.filter(r => RecordManager.matchesSystem(r, systemId));
  },

});
