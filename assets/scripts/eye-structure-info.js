/**
 * 眼睛結構詳細資訊
 * Eye Structure Detailed Information
 */

const EyeStructureInfo = {
  /**
   * 左眼結構詳細資訊
   */
  leftEye: {
    "left-eye": {
      name: "左眼",
      nameEn: "Left Eye",
      description: "眼睛的左側眼球結構，包含眼球壁、內容物及附屬結構。",
      descriptionEn: "The left eyeball structure including the eye wall, contents, and adnexal structures.",
      function: "視覺形成的主要器官",
      functionEn: "Primary organ for visual perception",
      diseases: ["結膜炎", "角膜潰瘍", "白內障", "青光眼"],
      treatment: "依病因進行藥物或手術治療"
    },
    "left-eye-cornea": {
      name: "角膜",
      nameEn: "Cornea",
      description: "眼球前部透明圓頂狀結構，負責折射光線。",
      descriptionEn: "Transparent dome-shaped structure at the front of the eye that refracts light.",
      function: "光線折射，主要屈光力來源",
      functionEn: "Light refraction, primary refractive power",
      diseases: ["角膜潰瘍", "角膜炎", "角膜水腫"],
      treatment: "抗生素、抗病毒藥物、角膜移植"
    },
    "left-eye-iris": {
      name: "虹膜",
      nameEn: "Iris",
      description: "眼球中部的有色結構，控制瞳孔大小。",
      descriptionEn: "Colored part of the eye that controls pupil size.",
      function: "調節瞳孔大小，控制進入眼內光量",
      functionEn: "Regulates pupil size, controlling light entry",
      diseases: ["虹膜炎", "虹膜萎縮"],
      treatment: "類固醇、免疫抑制劑"
    },
    "left-eye-lens": {
      name: "水晶體",
      nameEn: "Lens",
      description: "位於虹膜後方的透明雙凸透鏡。",
      descriptionEn: "Transparent biconvex lens behind the iris.",
      function: "對焦調節，看近看遠",
      functionEn: "Focus adjustment for near and far vision",
      diseases: ["白內障", "水晶體脫位"],
      treatment: "手術置換人工水晶體"
    },
    "left-eye-retina": {
      name: "視網膜",
      nameEn: "Retina",
      description: "眼球內部的感光層，將光線轉換為神經信號。",
      descriptionEn: "Light-sensitive layer at the back of the eye that converts light to neural signals.",
      function: "光感受，形成視覺圖像",
      functionEn: "Photoreception, visual image formation",
      diseases: ["視網膜脫離", "黃斑部病變", "糖尿病視網膜病變"],
      treatment: "雷射、玻璃體切除術、抗 VEGF 注射"
    },
    "left-eye-lacrimal-gland": {
      name: "淚腺",
      nameEn: "Lacrimal Gland",
      description: "分泌淚液保持眼球濕潤的腺體。",
      descriptionEn: "Gland that produces tears to keep the eye moist.",
      function: "分泌淚液，潤滑眼球表面",
      functionEn: "Tear production to lubricate eye surface",
      diseases: ["乾眼症", "淚腺炎"],
      treatment: "人工淚液、抗發炎藥物"
    },
    "left-eye-choroid": {
      name: "脈絡膜",
      nameEn: "Choroid",
      description: "視網膜和鞏膜之間的血管層。",
      descriptionEn: "Vascular layer between the retina and sclera.",
      function: "供應視網膜營養，散熱",
      functionEn: "Retinal nutrition supply, heat dissipation",
      diseases: ["脈絡膜炎", "脈絡膜血管瘤"],
      treatment: "類固醇、免疫抑制劑"
    },
    "left-eye-sclera": {
      name: "鞏膜",
      nameEn: "Sclera",
      description: "眼球外層的白色纖維組織。",
      descriptionEn: "White fibrous outer layer of the eyeball.",
      function: "保護眼球，維持形狀",
      functionEn: "Eye protection, maintains shape",
      diseases: ["鞏膜炎", "鞏膜變色"],
      treatment: "類固醇、免疫抑制劑"
    }
  },

  /**
   * 右眼結構詳細資訊
   */
  rightEye: {
    "right-eye": {
      name: "右眼",
      nameEn: "Right Eye",
      description: "眼睛的右側眼球結構，包含眼球壁、內容物及附屬結構。",
      descriptionEn: "The right eyeball structure including the eye wall, contents, and adnexal structures.",
      function: "視覺形成的主要器官",
      functionEn: "Primary organ for visual perception",
      diseases: ["結膜炎", "角膜潰瘍", "白內障", "青光眼"],
      treatment: "依病因進行藥物或手術治療"
    },
    "right-eye-cornea": {
      name: "角膜",
      nameEn: "Cornea",
      description: "眼球前部透明圓頂狀結構，負責折射光線。",
      descriptionEn: "Transparent dome-shaped structure at the front of the eye that refracts light.",
      function: "光線折射，主要屈光力來源",
      functionEn: "Light refraction, primary refractive power",
      diseases: ["角膜潰瘍", "角膜炎", "角膜水腫"],
      treatment: "抗生素、抗病毒藥物、角膜移植"
    },
    "right-eye-iris": {
      name: "虹膜",
      nameEn: "Iris",
      description: "眼球中部的有色結構，控制瞳孔大小。",
      descriptionEn: "Colored part of the eye that controls pupil size.",
      function: "調節瞳孔大小，控制進入眼內光量",
      functionEn: "Regulates pupil size, controlling light entry",
      diseases: ["虹膜炎", "虹膜萎縮"],
      treatment: "類固醇、免疫抑制劑"
    },
    "right-eye-lens": {
      name: "水晶體",
      nameEn: "Lens",
      description: "位於虹膜後方的透明雙凸透鏡。",
      descriptionEn: "Transparent biconvex lens behind the iris.",
      function: "對焦調節，看近看遠",
      functionEn: "Focus adjustment for near and far vision",
      diseases: ["白內障", "水晶體脫位"],
      treatment: "手術置換人工水晶體"
    },
    "right-eye-retina": {
      name: "視網膜",
      nameEn: "Retina",
      description: "眼球內部的感光層，將光線轉換為神經信號。",
      descriptionEn: "Light-sensitive layer at the back of the eye that converts light to neural signals.",
      function: "光感受，形成視覺圖像",
      functionEn: "Photoreception, visual image formation",
      diseases: ["視網膜脫離", "黃斑部病變", "糖尿病視網膜病變"],
      treatment: "雷射、玻璃體切除術、抗 VEGF 注射"
    },
    "right-eye-lacrimal-gland": {
      name: "淚腺",
      nameEn: "Lacrimal Gland",
      description: "分泌淚液保持眼球濕潤的腺體。",
      descriptionEn: "Gland that produces tears to keep the eye moist.",
      function: "分泌淚液，潤滑眼球表面",
      functionEn: "Tear production to lubricate eye surface",
      diseases: ["乾眼症", "淚腺炎"],
      treatment: "人工淚液、抗發炎藥物"
    },
    "right-eye-choroid": {
      name: "脈絡膜",
      nameEn: "Choroid",
      description: "視網膜和鞏膜之間的血管層。",
      descriptionEn: "Vascular layer between the retina and sclera.",
      function: "供應視網膜營養，散熱",
      functionEn: "Retinal nutrition supply, heat dissipation",
      diseases: ["脈絡膜炎", "脈絡膜血管瘤"],
      treatment: "類固醇、免疫抑制劑"
    },
    "right-eye-sclera": {
      name: "鞏膜",
      nameEn: "Sclera",
      description: "眼球外層的白色纖維組織。",
      descriptionEn: "White fibrous outer layer of the eyeball.",
      function: "保護眼球，維持形狀",
      functionEn: "Eye protection, maintains shape",
      diseases: ["鞏膜炎", "鞏膜變色"],
      treatment: "類固醇、免疫抑制劑"
    }
  },

  /**
   * 共用結構詳細資訊
   */
  common: {
    "cranial-nerve": {
      name: "視神經",
      nameEn: "Optic Nerve (Cranial Nerve II)",
      description: "將視網膜信號傳遞到大腦的神經。",
      descriptionEn: "Nerve that transmits visual signals from retina to brain.",
      function: "傳導視覺神經信號",
      functionEn: "Conduction of visual neural signals",
      diseases: ["視神經炎", "視神經萎縮", "青光眼性視神經損傷"],
      treatment: "類固醇、神經保護劑"
    },
    "vitreous-body": {
      name: "玻璃體",
      nameEn: "Vitreous Body",
      description: "填充眼球後部的透明膠狀物質。",
      descriptionEn: "Transparent gel-like substance filling the back of the eye.",
      function: "支撐視網膜，維持眼球形狀",
      functionEn: "Retinal support, maintains eye shape",
      diseases: ["玻璃體混濁", "玻璃體剝離", "玻璃體出血"],
      treatment: "觀察、玻璃體切除術"
    },
    "ciliary-processes": {
      name: "睫狀突",
      nameEn: "Ciliary Processes",
      description: "產生房水並連接懸韌帶到水晶體。",
      descriptionEn: "Produce aqueous humor and connect suspensory ligaments to the lens.",
      function: "產生房水，調節水晶體形狀",
      functionEn: "Aqueous humor production, lens shape accommodation",
      diseases: ["睫狀體炎", "睫狀體囊腫"],
      treatment: "類固醇、非類固醇抗發炎藥"
    },
    "muscle": {
      name: "眼外肌",
      nameEn: "Extraocular Muscles",
      description: "控制眼球運動的六條肌肉。",
      descriptionEn: "Six muscles that control eye movements.",
      function: "控制眼球向各方向移動",
      functionEn: "Control eye movement in all directions",
      diseases: ["斜視", "眼肌麻痺", "甲狀腺眼病變"],
      treatment: "手術、藥物治療、視力訓練"
    },
    "blood-vessels": {
      name: "眼部血管",
      nameEn: "Ocular Blood Vessels",
      description: "供應眼球血液的血管網絡。",
      descriptionEn: "Network of blood vessels supplying the eye.",
      function: "供應眼球組織營養和氧氣",
      functionEn: "Supply nutrients and oxygen to eye tissues",
      diseases: ["視網膜血管阻塞", "糖尿病視網膜病變", "高血壓視網膜病變"],
      treatment: "雷射、抗 VEGF 注射、藥物治療"
    },
    "pupil": {
      name: "瞳孔",
      nameEn: "Pupil",
      description: "虹膜中央的開口，允許光線進入。",
      descriptionEn: "Central opening in the iris that allows light to enter.",
      function: "調節進入眼內的光量",
      functionEn: "Regulates amount of light entering the eye",
      diseases: ["瞳孔散大", "瞳孔縮小", "瞳孔變形"],
      treatment: "依病因治療"
    },
    "papillary-dilator": {
      name: "瞳孔擴張肌",
      nameEn: "Papillary Dilator Muscle",
      description: "控制瞳孔放大的肌肉。",
      descriptionEn: "Muscle that controls pupil dilation.",
      function: "瞳孔放大",
      functionEn: "Pupil dilation",
      diseases: ["瞳孔擴張障礙"],
      treatment: "藥物治療"
    },
    "nasolacrimal-duct": {
      name: "鼻淚管",
      nameEn: "Nasolacrimal Duct",
      description: "淚液排出的通道。",
      descriptionEn: "Channel for tear drainage.",
      function: "淚液排出",
      functionEn: "Tear drainage",
      diseases: ["鼻淚管阻塞", "淚囊炎"],
      treatment: "沖洗、手术疏通"
    },
    "hyaloid-canal": {
      name: "玻璃管",
      nameEn: "Hyaloid Canal",
      description: "胚胎發育時存在的管道。",
      descriptionEn: "Canal present during embryonic development.",
      function: "發育過程中的臨時結構",
      functionEn: "Temporary structure during development",
      diseases: ["持續性玻璃體血管"],
      treatment: "觀察或手術"
    },
    "ciliary-muscle": {
      name: "睫狀肌",
      nameEn: "Ciliary Muscle",
      description: "控制水晶體形狀以進行對焦的肌肉。",
      descriptionEn: "Muscle that controls lens shape for focusing.",
      function: "調節水晶體厚度，看近看遠",
      functionEn: "Lens thickness adjustment for near/far vision",
      diseases: ["睫狀肌痙攣", "調節障礙"],
      treatment: "視力訓練、藥物治療"
    }
  },

  /**
   * 獲取結構詳細資訊
   * @param {string} structureId 結構 ID
   * @returns {Object|null} 結構詳細資訊
   */
  getInfo(structureId) {
    if (structureId.startsWith('left-eye-')) {
      return this.leftEye[structureId] || null;
    } else if (structureId.startsWith('right-eye-')) {
      return this.rightEye[structureId] || null;
    } else {
      return this.common[structureId] || null;
    }
  },

  /**
   * 獲取所有結構 ID 清單
   * @returns {Array} 結構 ID 清單
   */
  getAllStructureIds() {
    return {
      left: Object.keys(this.leftEye),
      right: Object.keys(this.rightEye),
      common: Object.keys(this.common)
    };
  }
};

// 導出
if (typeof module !== 'undefined' && module.exports) {
  module.exports = EyeStructureInfo;
}
