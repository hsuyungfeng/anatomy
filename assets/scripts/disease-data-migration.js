/**
 * 牙科疾病數據遷移模組
 * 將舊版疾病分類系統遷移到 ICD-10 標準
 *
 * 功能：
 * - 舊疾病 ID 映射到新 ICD-10 代碼
 * - 自動遷移 localStorage 中的病歷數據
 * - 保留原始數據作為備份
 * - 去重重複的疾病
 */

const DiseaseDataMigration = (() => {
  // 疾病 ID 映射表：將舊 ID 映射到新 ICD-10 代碼
  const DISEASE_MAPPING = {
    // 舊的齲齒相關
    'caries': 'K02',
    'enamel_caries': 'K02',
    'dentin_caries': 'K02',
    'pulp_caries': 'K02',

    // 舊的牙周病相關
    'periodontal_disease': 'K05',
    'gingivitis': 'K05',
    'periodontitis': 'K05',
    'gum_recession': 'K05',

    // 舊的牙齒斷裂相關
    'tooth_fracture': 'K03',
    'enamel_fracture': 'K03',
    'crown_fracture': 'K03',
    'root_fracture': 'K03',

    // 舊的缺牙相關
    'missing_tooth': 'K08',
    'congenital_missing': 'K08',
    'extraction': 'K08',

    // 舊的根管治療相關
    'endodontic_treatment': 'K04',
    'treatment_needed': 'K04',
    'treatment_completed': 'K04',

    // 舊的變色相關
    'discoloration': 'K03',
    'extrinsic': 'K03',
    'intrinsic': 'K03',

    // 舊的咬合不正相關
    'malocclusion': 'K00',
    'crowding': 'K00',
    'spacing': 'K00',
    'crossbite': 'K00'
  };

  // ICD-10 疾病信息
  const ICD10_INFO = {
    'K00': {
      name: '牙齒發育及萌發疾患',
      nameEn: 'Disorders of tooth development and eruption'
    },
    'K01': {
      name: '埋伏牙',
      nameEn: 'Embedded teeth'
    },
    'K02': {
      name: '牙根齲齒',
      nameEn: 'Dental root caries'
    },
    'K03': {
      name: '牙齒硬組織其他疾病',
      nameEn: 'Other diseases of hard tissues of teeth'
    },
    'K04': {
      name: '齒髓性急性根尖牙周組織炎',
      nameEn: 'Acute apical periodontitis of pulpal origin'
    },
    'K05': {
      name: '齒齦炎及牙周疾病',
      nameEn: 'Gingivitis and periodontal diseases'
    },
    'K06': {
      name: '牙齦腫大',
      nameEn: 'Gingival enlargement'
    },
    'K08': {
      name: '牙齒及支持性構造其他疾患',
      nameEn: 'Other disorders of teeth and supporting structures'
    }
  };

  /**
   * 檢查是否需要進行數據遷移
   * @param {string} storageKeyPrefix - 存儲鍵前綴
   * @returns {boolean} 是否需要遷移
   */
  function needsMigration(storageKeyPrefix) {
    try {
      const recordsKey = `${storageKeyPrefix}dental_records`;
      const data = localStorage.getItem(recordsKey);

      if (!data) return false;

      const records = JSON.parse(data);

      // 檢查是否有舊版本的數據（包含舊疾病 ID）
      if (Array.isArray(records)) {
        return records.some(record => {
          if (record.teeth && Array.isArray(record.teeth)) {
            return record.teeth.some(tooth => {
              if (tooth.records && Array.isArray(tooth.records)) {
                return tooth.records.some(rec => {
                  // 檢查是否為舊格式（有 notes 欄位或使用舊疾病 ID）
                  return rec.notes !== undefined ||
                         (rec.diseases && Array.isArray(rec.diseases) &&
                          rec.diseases.some(d => !d.icd10 || d.icd10.startsWith('__old')));
                });
              }
              return false;
            });
          }
          return false;
        });
      }

      return false;
    } catch (error) {
      console.error('[DiseaseDataMigration] 檢查遷移狀態失敗:', error);
      return false;
    }
  }

  /**
   * 遷移單個病歷記錄
   * @param {object} record - 病歷記錄
   * @returns {object} 遷移後的記錄
   */
  function migrateRecord(record) {
    const newRecord = JSON.parse(JSON.stringify(record)); // 深複製

    if (newRecord.teeth && Array.isArray(newRecord.teeth)) {
      newRecord.teeth.forEach(tooth => {
        if (tooth.records && Array.isArray(tooth.records)) {
          tooth.records.forEach(rec => {
            // 遷移疾病列表
            if (rec.diseases && Array.isArray(rec.diseases)) {
              rec.diseases = rec.diseases.map(disease => {
                const newId = DISEASE_MAPPING[disease.id] || 'K08';
                const info = ICD10_INFO[newId];

                return {
                  id: newId,
                  icd10: newId,
                  name: info.name,
                  nameEn: info.nameEn,
                  _migratedFrom: disease.id
                };
              });

              // 去重重複的疾病
              rec.diseases = [...new Map(
                rec.diseases.map(d => [d.id, d])
              ).values()];
            }

            // 移除舊欄位
            delete rec.notes;
            delete rec.surfaces;

            // 添加遷移標記
            rec._migrated = true;
          });
        }
      });
    }

    // 添加記錄級別的遷移標記
    newRecord._migrated = true;
    newRecord._dataVersion = 2;
    newRecord._migratedAt = new Date().toISOString();

    return newRecord;
  }

  /**
   * 批量遷移所有病歷記錄
   * @param {string} storageKeyPrefix - 存儲鍵前綴
   * @returns {object} 遷移結果 {success, count, error}
   */
  function migrateAllRecords(storageKeyPrefix) {
    try {
      const recordsKey = `${storageKeyPrefix}dental_records`;
      const backupKey = `${recordsKey}-backup-${Date.now()}`;

      // 讀取舊數據
      const oldData = localStorage.getItem(recordsKey);
      if (!oldData) {
        return { success: true, count: 0 };
      }

      // 創建備份
      localStorage.setItem(backupKey, oldData);
      console.log(`[DiseaseDataMigration] 已創建備份: ${backupKey}`);

      // 解析舊數據
      const records = JSON.parse(oldData);

      // 遷移每條記錄
      const migratedRecords = Array.isArray(records)
        ? records.map(record => migrateRecord(record))
        : migrateRecord(records);

      // 保存遷移後的數據
      localStorage.setItem(recordsKey, JSON.stringify(migratedRecords));

      const count = Array.isArray(migratedRecords)
        ? migratedRecords.length
        : 1;

      console.log(`[DiseaseDataMigration] ✓ 成功遷移 ${count} 筆病歷記錄`);

      return { success: true, count };
    } catch (error) {
      console.error('[DiseaseDataMigration] ✗ 遷移失敗:', error);
      return {
        success: false,
        count: 0,
        error: error.message
      };
    }
  }

  /**
   * 獲取疾病映射信息
   * @param {string} oldId - 舊疾病 ID
   * @returns {string} 新 ICD-10 代碼
   */
  function getNewDiseaseId(oldId) {
    return DISEASE_MAPPING[oldId] || 'K08';
  }

  /**
   * 獲取 ICD-10 疾病信息
   * @param {string} icd10Code - ICD-10 代碼
   * @returns {object} 疾病信息
   */
  function getDiseaseInfo(icd10Code) {
    return ICD10_INFO[icd10Code] || null;
  }

  // 公開 API
  return {
    needsMigration,
    migrateRecord,
    migrateAllRecords,
    getNewDiseaseId,
    getDiseaseInfo,
    DISEASE_MAPPING,
    ICD10_INFO
  };
})();

// 支持 Node.js/模組導出
if (typeof module !== 'undefined' && module.exports) {
  module.exports = DiseaseDataMigration;
}
