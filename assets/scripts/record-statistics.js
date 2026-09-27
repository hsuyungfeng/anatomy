/* ================================================
   病歷統計模組
   ================================================ */

class RecordStatistics {
  constructor(recordManager = null) {
    this.recordManager = recordManager;
    this.dateFrom = null;
    this.dateTo = null;
    this.systemFilter = '';
    this.barChart = null;
    this.pieChart = null;
  }

  /**
   * 獲取所有病歷數據（委派給 RecordManager）
   * @returns {Array} 病歷陣列
   */
  getAllRecords() {
    return this.recordManager ? this.recordManager.getAllRecords() : [];
  }

  /**
   * 按系統篩選病歷
   * @param {Array} records 病歷陣列
   * @returns {Array} 篩選後的病歷
   */
  filterBySystem(records) {
    if (!this.systemFilter) {
      return records;
    }

    return records.map(record => {
      if (!record.anatomicalSystems) return null;
      
      const filteredSystems = record.anatomicalSystems.filter(
        system => system.systemId === this.systemFilter
      );
      
      return {
        ...record,
        anatomicalSystems: filteredSystems
      };
    }).filter(r => r && r.anatomicalSystems && r.anatomicalSystems.length > 0);
  }

  /**
   * 按時間範圍篩選病歷
   * @param {Array} records 病歷陣列
   * @returns {Array} 篩選後的病歷
   */
  filterByDateRange(records) {
    if (!this.dateFrom && !this.dateTo) {
      return records;
    }

    return records.filter(record => {
      const recordDate = new Date(record.createdAt);
      
      if (this.dateFrom) {
        const from = new Date(this.dateFrom);
        from.setHours(0, 0, 0, 0);
        if (recordDate < from) return false;
      }
      
      if (this.dateTo) {
        const to = new Date(this.dateTo);
        to.setHours(23, 59, 59, 999);
        if (recordDate > to) return false;
      }
      
      return true;
    });
  }

  /**
   * 計算疾病統計
   * @param {Array} records 病歷陣列
   * @returns {Object} 統計結果
   */
  calculateStatistics(records) {
    const diseaseCount = {};
    let totalAnnotations = 0;
    const systems = new Set();

    records.forEach(record => {
      if (record.anatomicalSystems) {
        record.anatomicalSystems.forEach(system => {
          systems.add(system.systemName || system.id);
          
          if (system.annotations) {
            system.annotations.forEach(anno => {
              totalAnnotations++;
              
              if (anno.diseases) {
                anno.diseases.forEach(disease => {
                  const key = `${disease.id} ${disease.name}`;
                  diseaseCount[key] = (diseaseCount[key] || 0) + 1;
                });
              }
            });
          }
        });
      }
    });

    return {
      totalRecords: records.length,
      totalAnnotations,
      totalDiseases: Object.keys(diseaseCount).length,
      totalSystems: systems.size,
      diseaseCount
    };
  }

  /**
   * 獲取圖表數據
   * @param {Object} stats 統計結果
   * @returns {Object} 圖表數據
   */
  getChartData(stats) {
    const sortedDiseases = Object.entries(stats.diseaseCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);

    const labels = sortedDiseases.map(([name]) => name);
    const data = sortedDiseases.map(([, count]) => count);

    const colors = [
      '#3498db', '#e74c3c', '#2ecc71', '#f39c12', '#9b59b6',
      '#1abc9c', '#34495e', '#e67e22', '#2c3e50', '#7f8c8d'
    ];

    return {
      barChart: {
        labels,
        datasets: [{
          label: '發生次數',
          data,
          backgroundColor: colors.slice(0, labels.length),
          borderWidth: 1
        }]
      },
      pieChart: {
        labels,
        datasets: [{
          data,
          backgroundColor: colors.slice(0, labels.length),
          borderWidth: 1
        }]
      }
    };
  }

  /**
   * 渲染長條圖
   * @param {Object} chartData 圖表數據
   */
  renderBarChart(chartData) {
    const ctx = document.getElementById('disease-bar-chart');
    if (!ctx) return;

    if (this.barChart) {
      this.barChart.destroy();
    }

    this.barChart = new Chart(ctx, {
      type: 'bar',
      data: chartData,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: { stepSize: 1 }
          }
        }
      }
    });
  }

  /**
   * 渲染圓餅圖
   * @param {Object} chartData 圖表數據
   */
  renderPieChart(chartData) {
    const ctx = document.getElementById('disease-pie-chart');
    if (!ctx) return;

    if (this.pieChart) {
      this.pieChart.destroy();
    }

    this.pieChart = new Chart(ctx, {
      type: 'pie',
      data: chartData,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'right',
            labels: { font: { size: 10 } }
          }
        }
      }
    });
  }

  /**
   * 更新統計顯示
   */
  updateDisplay() {
    const records = this.getAllRecords();
    let filteredRecords = this.filterBySystem(records);
    filteredRecords = this.filterByDateRange(filteredRecords);
    const stats = this.calculateStatistics(filteredRecords);
    const chartData = this.getChartData(stats);

    document.getElementById('total-records').textContent = stats.totalRecords;
    document.getElementById('total-diseases').textContent = stats.totalDiseases;
    document.getElementById('total-annotations').textContent = stats.totalAnnotations;

    this.renderBarChart(chartData.barChart);
    this.renderPieChart(chartData.pieChart);
  }

  /**
   * 設定系統篩選
   * @param {string} system 系統 ID
   */
  setSystemFilter(system) {
    this.systemFilter = system;
    this.updateDisplay();
  }

  /**
   * 設定日期範圍
   * @param {string} from 開始日期
   * @param {string} to 結束日期
   */
  setDateRange(from, to) {
    this.dateFrom = from;
    this.dateTo = to;
    this.updateDisplay();
  }

  /**
   * 搜尋病歷
   * @param {string} keyword 搜尋關鍵字
   * @returns {Array} 搜尋結果
   */
  searchRecords(keyword) {
    if (!keyword || keyword.trim() === '') {
      return [];
    }

    const searchTerm = keyword.toLowerCase().trim();
    const records = this.getAllRecords();
    const results = [];

    records.forEach(record => {
      const matchedAnnotations = [];

      if (record.anatomicalSystems) {
        record.anatomicalSystems.forEach(system => {
          if (system.annotations) {
            system.annotations.forEach(anno => {
              let isMatch = false;
              const matchReasons = [];

              // 搜尋位置名稱
              if (anno.locationName && anno.locationName.toLowerCase().includes(searchTerm)) {
                isMatch = true;
                matchReasons.push('位置');
              }

              // 搜尋疾病名稱
              if (anno.diseases && anno.diseases.length > 0) {
                anno.diseases.forEach(disease => {
                  if (disease.name && disease.name.toLowerCase().includes(searchTerm)) {
                    isMatch = true;
                    matchReasons.push('疾病');
                  }
                  if (disease.id && disease.id.toLowerCase().includes(searchTerm)) {
                    isMatch = true;
                    matchReasons.push('疾病');
                  }
                });
              }

              // 搜尋療程摘要
              if (anno.treatmentNotes && anno.treatmentNotes.toLowerCase().includes(searchTerm)) {
                isMatch = true;
                matchReasons.push('備註');
              }

              // 搜尋系統名稱
              if (system.systemName && system.systemName.toLowerCase().includes(searchTerm)) {
                isMatch = true;
                matchReasons.push('系統');
              }

              if (isMatch) {
                matchedAnnotations.push({
                  ...anno,
                  systemName: system.systemName,
                  matchReasons: [...new Set(matchReasons)]
                });
              }
            });
          }
        });
      }

      if (matchedAnnotations.length > 0) {
        results.push({
          record: record,
          matchedAnnotations: matchedAnnotations,
          matchCount: matchedAnnotations.length
        });
      }
    });

    return results;
  }

  /**
   * 顯示搜尋結果
   * @param {Array} results 搜尋結果
   */
  displaySearchResults(results) {
    const container = document.getElementById('search-results');
    const listContainer = document.getElementById('search-results-list');
    
    if (!container || !listContainer) return;

    if (results.length === 0) {
      container.hidden = false;
      listContainer.innerHTML = `
        <div class="search-result-item__empty">
          沒有找到符合的病歷記錄
        </div>
      `;
      return;
    }

    let html = '';
    results.forEach(result => {
      const record = result.record;
      const annotations = result.matchedAnnotations;
      const patientIdDisplay = escapeHtml(record.patientId || '未命名病歷');
      const diseaseText = annotations.map(a => {
        const loc = escapeHtml(a.locationName || '');
        const dis = a.diseases?.map(d => escapeHtml(d.name)).join(', ') || '無疾病';
        return `${loc}: ${dis}`;
      }).join(' | ');

      html += `
        <div class="search-result-item">
          <div class="search-result-item__title">
            ${patientIdDisplay} (${annotations.length} 筆匹配)
          </div>
          <div class="search-result-item__info">
            建立時間: ${formatDateTime(new Date(record.createdAt))}
          </div>
          <div class="search-result-item__diseases">
            ${diseaseText}
          </div>
        </div>
      `;
    });

    container.hidden = false;
    listContainer.innerHTML = html;
  }

  /**
   * 隱藏搜尋結果
   */
  hideSearchResults() {
    const container = document.getElementById('search-results');
    if (container) {
      container.hidden = true;
    }
  }

  /**
   * 清除篩選
   */
  clearFilter() {
    this.dateFrom = null;
    this.dateTo = null;
    this.systemFilter = '';
    document.getElementById('date-from').value = '';
    document.getElementById('date-to').value = '';
    document.getElementById('system-filter').value = '';
    document.getElementById('search-input').value = '';
    this.hideSearchResults();
    this.updateDisplay();
  }
}

// 導出
if (typeof module !== 'undefined' && module.exports) {
  module.exports = RecordStatistics;
}
