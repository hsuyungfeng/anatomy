/**
 * 解剖部位 ID 映射模組 (AnatomyMapping)
 * 
 * 歷史背景說明：
 * 本專案在演進過程中，身體座標檔與病歷標註格式歷經了三套命名規範：
 * 1. 早期版本：使用 bodyPart + side（例如 { bodyPart: 'arm', side: 'left' }），或未分左右的部位名稱。
 * 2. 中期版本：使用複合階層 ID（例如 arm-left-elbow, leg-right-calf, head-eye-left）。
 * 3. 現行規範：使用與 body-systems.json 一致的扁平子部位 ID（例如 elbow-l, leg-r, head-eye）。
 * 
 * 為確保既有病歷資料的相容性，本模組在讀取時動態解析舊 ID，
 * 嚴格遵循「讀取時計算、絕不改寫 localStorage 已存病歷」的原則。
 */

(function(root) {
  'use strict';

  // 目前系統的 58 個子部位 ID（body-systems.json）
  const CURRENT_SUB_REGIONS = new Set([
    'head-forehead', 'head-eyebrow', 'head-eyebrow-r', 'head-eye', 'head-eye-r',
    'head-ear', 'head-ear-r', 'head-nose', 'head-cheek', 'head-cheek-r', 'head-lips', 'head-chin',
    'neck', 'neck-nape',
    'back',
    'chest', 'chest-breast', 'chest-breast-r', 'abdomen-upper', 'abdomen', 'abdomen-umbilical',
    'groin-mons', 'groin', 'groin-vulva', 'groin-penis', 'groin-scrotum',
    'shoulder-l', 'axilla-l', 'arm-l', 'elbow-l', 'forearm-l', 'wrist-l', 'hand-l', 'fingers-l',
    'shoulder-r', 'axilla-r', 'arm-r', 'elbow-r', 'forearm-r', 'wrist-r', 'hand-r', 'fingers-r',
    'hip-l', 'buttock-l', 'thigh-l', 'knee-l', 'leg-l', 'ankle-l', 'foot-l', 'heel-l',
    'hip-r', 'buttock-r', 'thigh-r', 'knee-r', 'leg-r', 'ankle-r', 'foot-r', 'heel-r'
  ]);

  // 目前系統的 8 個大區域 ID（body-systems.json）
  const CURRENT_REGIONS = new Set([
    'head', 'neck', 'back', 'torso',
    'upper-limb-l', 'upper-limb-r', 'lower-limb-l', 'lower-limb-r'
  ]);

  // 舊格式無 -r 後綴但現行代表病人左側的成對部位
  const LEFT_PAIRED_WITHOUT_SUFFIX = new Set([
    'head-eyebrow', 'head-eye', 'head-ear', 'head-cheek', 'chest-breast'
  ]);

  const AnatomyMapping = {
    /**
     * 推斷部位的邊別 (left / right / mid)
     * 規則：
     * - -r 結尾 → right
     * - -l 結尾 → left
     * - 沒有後綴的成對部位 (head-eyebrow, head-eye, head-ear, head-cheek, chest-breast) → left
     * - 其他 → mid
     * @param {string} subId
     * @returns {'left'|'right'|'mid'}
     */
    bodySide(subId) {
      if (!subId || typeof subId !== 'string') return 'mid';
      if (subId.endsWith('-r')) return 'right';
      if (subId.endsWith('-l')) return 'left';
      if (LEFT_PAIRED_WITHOUT_SUFFIX.has(subId)) return 'left';
      return 'mid';
    },

    /**
     * 解析眼睛病歷的 structureId
     * @param {object} record - 病歷物件
     * @returns {{ key: string|null, side: 'left'|'right'|null, wholeEye: boolean }}
     */
    resolveEye(record) {
      if (!record) return { key: null, side: null, wholeEye: false };
      const rawId = record.structureId || record.structure || record.id || '';

      // 1. 整隻眼睛：/^(left|right)-eye$/ 或 structureId === 'eye'
      const wholeEyeMatch = rawId.match(/^(left|right)-eye$/);
      if (wholeEyeMatch) {
        return { key: null, side: wholeEyeMatch[1], wholeEye: true };
      }
      if (rawId === 'eye') {
        const side = (record.side === 'left' || record.side === 'right') ? record.side : null;
        return { key: null, side, wholeEye: true };
      }

      // 2. 帶眼別前綴：/^(left|right)-eye-(.+)$/
      const sidePrefixMatch = rawId.match(/^(left|right)-eye-(.+)$/);
      if (sidePrefixMatch) {
        const side = sidePrefixMatch[1];
        let part = sidePrefixMatch[2];
        if (part === 'lacrimal') {
          part = 'lacrimal-gland';
        }
        return { key: part, side, wholeEye: false };
      }

      // 3. 通用 eye- 前綴：/^eye-(.+)$/
      const eyePrefixMatch = rawId.match(/^eye-(.+)$/);
      if (eyePrefixMatch) {
        let part = eyePrefixMatch[1];
        if (part === 'vitreous-hyaloid') {
          part = 'hyaloid-canal';
        } else if (part === 'blood-vessels') {
          part = 'vessels';
        }
        const side = (record.side === 'left' || record.side === 'right') ? record.side : null;
        return { key: part, side, wholeEye: false };
      }

      // 無法辨識
      return { key: null, side: null, wholeEye: false };
    },

    /**
     * 解析身體病歷的部位 ID
     * @param {object} record - 病歷物件
     * @param {object} legacyMap - body-legacy-map.json 的內容
     * @returns {{ subId: string|null, regionId: string|null }}
     */
    resolveBody(record, legacyMap) {
      if (!record) return { subId: null, regionId: null };

      // 優先順序：bodyRegionId → bodyPart
      const id = record.bodyRegionId || record.bodyPart || record.regionId || '';
      if (!id) return { subId: null, regionId: null };

      // 1. 處理 5 個無後綴成對部位的歧義（若舊記錄有 side === 'right'，轉為 -r）
      if (LEFT_PAIRED_WITHOUT_SUFFIX.has(id)) {
        if (record.side === 'right') {
          return { subId: `${id}-r`, regionId: null };
        }
        return { subId: id, regionId: null };
      }

      // 2. 處理最舊版本不分左右的 arm / leg
      if (id === 'arm') {
        if (record.side === 'left') return { subId: null, regionId: 'upper-limb-l' };
        if (record.side === 'right') return { subId: null, regionId: 'upper-limb-r' };
        return { subId: null, regionId: null };
      }
      if (id === 'leg') {
        if (record.side === 'left') return { subId: null, regionId: 'lower-limb-l' };
        if (record.side === 'right') return { subId: null, regionId: 'lower-limb-r' };
        return { subId: null, regionId: null };
      }

      // 3. 查閱 legacyMap.subRegion
      if (legacyMap && legacyMap.subRegion && Object.prototype.hasOwnProperty.call(legacyMap.subRegion, id)) {
        return { subId: legacyMap.subRegion[id], regionId: null };
      }

      // 4. 查閱 legacyMap.region
      if (legacyMap && legacyMap.region && Object.prototype.hasOwnProperty.call(legacyMap.region, id)) {
        return { subId: null, regionId: legacyMap.region[id] };
      }

      // 5. 是否為現行 58 個子部位之一
      if (CURRENT_SUB_REGIONS.has(id)) {
        return { subId: id, regionId: null };
      }

      // 6. 是否為現行 8 個大區域之一
      if (CURRENT_REGIONS.has(id)) {
        return { subId: null, regionId: id };
      }

      return { subId: null, regionId: null };
    }
  };

  root.AnatomyMapping = AnatomyMapping;
})(typeof window !== 'undefined' ? window : globalThis);
