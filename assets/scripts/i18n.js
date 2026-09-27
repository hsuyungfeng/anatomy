/* ================================================
   國際化與翻譯模組 (i18n)
   集中管理繁體中文 (zh) 與英文 (en) 介面字典
   ================================================ */

(function (global) {
  'use strict';

  const DICTIONARY = {
    zh: {
      // 工具列
      'toolbar.reference': '參考圖',
      'toolbar.diagram': '結構圖',
      'toolbar.odontogram': '牙位圖',
      'toolbar.focusFace': '放大臉部',
      'toolbar.female': '女性',
      'toolbar.male': '男性',
      'toolbar.eyeOD': '右眼 OD',
      'toolbar.eyeOS': '左眼 OS',
      'toolbar.zoomIn': '放大圖像',
      'toolbar.zoomOut': '縮小圖像',
      'toolbar.zoomReset': '重置縮放',

      // 系統名稱
      'system.teeth': '牙齒',
      'system.primary_teeth': '乳齒',
      'system.eye': '眼睛',
      'system.body': '身體',

      // 病歷列表
      'list.title': '病歷列表',
      'list.statistics': '統計分析',
      'list.empty': '暫無病例記錄',
      'list.emptySystem': '暫無{system}系統的病例記錄',
      'list.loadFailed': '病例加載失敗',

      // 時間
      'time.unknown': '時間不明',

      // 模態視窗
      'modal.addDiseaseRecord': '新增疾病記錄',
      'modal.addEyeInfo': '新增眼睛結構信息',
      'modal.recordOperation': '記錄操作/治療',
      'modal.structureType': '結構類型: ',
      'modal.save': '保存記錄',
      'modal.cancel': '取消',
      'modal.edit': '編輯',
      'modal.delete': '刪除',
      'modal.sideRightEye': '右眼',
      'modal.sideLeftEye': '左眼',
      'modal.sideRight': '右側',
      'modal.sideLeft': '左側',
      'modal.sideMid': '中線',

      // 疾病表單
      'form.selectDiagnosis': '選擇疾病診斷',
      'form.multipleAllowed': '可複選多個疾病',
      'form.treatmentSummary': '療程摘要',
      'form.treatmentSummaryPlaceholder': '輸入療程摘要或其他備註...',

      // 身體操作表單
      'body.sideLabel': '側邊：',
      'body.sideLeft': '左',
      'body.sideMid': '中',
      'body.sideRight': '右',
      'body.sideLeftFull': '左側',
      'body.sideCenterFull': '中央',
      'body.sideRightFull': '右側',
      'body.operationType': '操作類型',
      'body.typeSurgery': '手術',
      'body.typeTreatment': '治療',
      'body.typeProcedure': '程序',
      'body.typeExam': '檢查',
      'body.typeMedication': '用藥',
      'body.typeOther': '其他',
      'body.description': '操作描述',
      'body.descPlaceholder': '詳細記錄進行的操作、治療或程序...',
      'body.doctorNotes': '醫生備註（可選）',
      'body.notesPlaceholder': '額外備註或觀察...',
      'body.front': '正面',
      'body.back': '背面',
      'body.patientRight': '病人右側',
      'body.patientLeft': '病人左側',

      // 眼睛圖方向標籤
      'eye.anterior': '前（角膜側）',
      'eye.posterior': '後（視神經側）',
      'eye.frontOD': '正面（右眼 OD）',
      'eye.frontOS': '正面（左眼 OS）',

      // 牙位圖象限
      'teeth.permanent': '永久齒',
      'teeth.primary': '乳齒',
      'teeth.quadrant1': '右上 (1)',
      'teeth.quadrant2': '左上 (2)',
      'teeth.quadrant3': '左下 (3)',
      'teeth.quadrant4': '右下 (4)',

      // 通知訊息
      'notify.saveSuccess': '疾病記錄已保存',
      'notify.eyeSaveSuccess': '眼睛病例已成功保存',
      'notify.bodySaveSuccess': '身體系統操作記錄已成功保存',
      'notify.saveFailed': '保存失敗，請重試',
      'notify.selectDisease': '請選擇至少一種疾病',
      'notify.selectEyeStructure': '請先選擇眼睛結構',
      'notify.formNotInit': '表單未初始化',
      'notify.clearAllSuccess': '已清空所有病歷',
      'notify.exportSuccess': '已導出 {format} 格式',
      'notify.exportFailed': '導出失敗',
      'notify.backupFailed': '備份失敗',
      'notify.backupSuccess': '已備份 {count} 筆病歷',
      'notify.restoreSuccess': '已成功還原 {count} 筆病歷記錄',
      'notify.restoreFailed': '還原失敗: {error}',
      'notify.refImageTip': '參考圖僅供檢視，請切回結構圖點選',
      'notify.primaryNoRef': '乳牙沒有參考圖',
      'notify.appInitFailed': '應用初始化失敗',
      'notify.switchTeethFailed': '無法切換牙齒系統: {error}',
      'notify.loadImageFailed': '無法加載圖像: {error}',
      'notify.shortcutSave': '快捷鍵: 儲存'
    },

    en: {
      // Toolbar
      'toolbar.reference': 'Reference Image',
      'toolbar.diagram': 'Diagram',
      'toolbar.odontogram': 'Odontogram',
      'toolbar.focusFace': 'Focus Face',
      'toolbar.female': 'Female',
      'toolbar.male': 'Male',
      'toolbar.eyeOD': 'Right Eye OD',
      'toolbar.eyeOS': 'Left Eye OS',
      'toolbar.zoomIn': 'Zoom In',
      'toolbar.zoomOut': 'Zoom Out',
      'toolbar.zoomReset': 'Reset',

      // System names
      'system.teeth': 'Teeth',
      'system.primary_teeth': 'Primary Teeth',
      'system.eye': 'Eye',
      'system.body': 'Body',

      // Records list
      'list.title': 'Records',
      'list.statistics': 'Statistics',
      'list.empty': 'No medical records yet',
      'list.emptySystem': 'No records for {system} system yet',
      'list.loadFailed': 'Failed to load records',

      // Time
      'time.unknown': 'Unknown time',

      // Modal
      'modal.addDiseaseRecord': 'Add Disease Record',
      'modal.addEyeInfo': 'Add Eye Structure Info',
      'modal.recordOperation': 'Record Operation/Treatment',
      'modal.structureType': 'Structure Type: ',
      'modal.save': 'Save Record',
      'modal.cancel': 'Cancel',
      'modal.edit': 'Edit',
      'modal.delete': 'Delete',
      'modal.sideRightEye': 'Right Eye',
      'modal.sideLeftEye': 'Left Eye',
      'modal.sideRight': 'Right',
      'modal.sideLeft': 'Left',
      'modal.sideMid': 'Center',

      // Disease form
      'form.selectDiagnosis': 'Select Diagnosis',
      'form.multipleAllowed': 'Multiple selections allowed',
      'form.treatmentSummary': 'Treatment Summary',
      'form.treatmentSummaryPlaceholder': 'Enter treatment summary or other notes...',

      // Body operation form
      'body.sideLabel': 'Side:',
      'body.sideLeft': 'Left',
      'body.sideMid': 'Mid',
      'body.sideRight': 'Right',
      'body.sideLeftFull': 'Left',
      'body.sideCenterFull': 'Center',
      'body.sideRightFull': 'Right',
      'body.operationType': 'Operation Type',
      'body.typeSurgery': 'Surgery',
      'body.typeTreatment': 'Treatment',
      'body.typeProcedure': 'Procedure',
      'body.typeExam': 'Examination',
      'body.typeMedication': 'Medication',
      'body.typeOther': 'Other',
      'body.description': 'Operation Description',
      'body.descPlaceholder': 'Describe the operation, treatment or procedure...',
      'body.doctorNotes': 'Doctor Notes (Optional)',
      'body.notesPlaceholder': 'Additional notes or observations...',
      'body.front': 'Front',
      'body.back': 'Back',
      'body.patientRight': 'Patient Right',
      'body.patientLeft': 'Patient Left',

      // Eye diagram direction labels
      'eye.anterior': 'Front (Cornea)',
      'eye.posterior': 'Back (Optic Nerve)',
      'eye.frontOD': 'Front (Right Eye OD)',
      'eye.frontOS': 'Front (Left Eye OS)',

      // Odontogram quadrants
      'teeth.permanent': 'Permanent Teeth',
      'teeth.primary': 'Primary Teeth',
      'teeth.quadrant1': 'Upper Right (1)',
      'teeth.quadrant2': 'Upper Left (2)',
      'teeth.quadrant3': 'Lower Left (3)',
      'teeth.quadrant4': 'Lower Right (4)',

      // Notifications
      'notify.saveSuccess': 'Disease record saved',
      'notify.eyeSaveSuccess': 'Eye record saved successfully',
      'notify.bodySaveSuccess': 'Body operation record saved successfully',
      'notify.saveFailed': 'Save failed, please retry',
      'notify.selectDisease': 'Please select at least one disease',
      'notify.selectEyeStructure': 'Please select an eye structure first',
      'notify.formNotInit': 'Form not initialized',
      'notify.clearAllSuccess': 'All records cleared',
      'notify.exportSuccess': 'Exported {format} successfully',
      'notify.exportFailed': 'Export failed',
      'notify.backupFailed': 'Backup failed',
      'notify.backupSuccess': 'Backed up {count} records',
      'notify.restoreSuccess': 'Restored {count} records successfully',
      'notify.restoreFailed': 'Restore failed: {error}',
      'notify.refImageTip': 'Reference image is view-only, switch to diagram to select',
      'notify.primaryNoRef': 'Primary teeth have no reference image',
      'notify.appInitFailed': 'Application initialization failed',
      'notify.switchTeethFailed': 'Failed to switch teeth system: {error}',
      'notify.loadImageFailed': 'Failed to load image: {error}',
      'notify.shortcutSave': 'Shortcut: Save'
    }
  };

  const I18N = {
    /**
     * 取得當前語言代碼 ('zh' 或 'en')
     * 讀取 utils.js 既有的 getCurrentLanguage()，不重複存儲狀態
     */
    lang() {
      if (typeof global.getCurrentLanguage === 'function') {
        const l = global.getCurrentLanguage();
        return l === 'en' ? 'en' : 'zh';
      }
      if (document.documentElement && document.documentElement.lang) {
        return document.documentElement.lang.startsWith('en') ? 'en' : 'zh';
      }
      return 'zh';
    },

    /**
     * 取得本地化文字
     * @param {string} key - 字典鍵
     * @param {Record<string, any>} [params] - 佔位符參數
     * @returns {string} 本地化字串
     */
    t(key, params) {
      const currentLang = this.lang();
      let text = DICTIONARY[currentLang]?.[key];
      if (text === undefined) {
        text = DICTIONARY.zh?.[key];
      }

      if (text === undefined) {
        console.warn(`[i18n] Missing translation for key: "${key}"`);
        return key;
      }

      if (params && typeof params === 'object') {
        text = text.replace(/\{(\w+)\}/g, (match, paramName) => {
          return params[paramName] !== undefined ? params[paramName] : match;
        });
      }

      return text;
    }
  };

  // 全域暴露
  global.I18N = I18N;
  global.t = I18N.t.bind(I18N);

})(typeof window !== 'undefined' ? window : this);
