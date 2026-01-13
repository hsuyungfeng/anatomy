/**
 * 眼睛結構說明
 * 提供各眼睛結構的解剖學資訊（中文和英文）
 */
const eyeStructureDescriptions = {
    'left-eye': {
        name: '左眼',
        nameEn: 'Left Eye',
        description: '眼睛的主要器官，負責光線感知和視覺處理。',
        descriptionEn: 'The primary organ of vision, responsible for light perception and visual processing.'
    },
    'left-eye-cornea': {
        name: '角膜（左眼）',
        nameEn: 'Left Cornea',
        description: '眼球最外層透明膜，主要負責光線折射。',
        descriptionEn: 'Transparent outer layer of the eye that refracts light and protects inner structures.'
    },
    'left-eye-iris': {
        name: '虹膜（左眼）',
        nameEn: 'Left Iris',
        description: '決定眼睛顏色的部分，控制瞳孔大小以調節光線進入量。',
        descriptionEn: 'Colored part of the eye that controls pupil size to regulate light entering the eye.'
    },
    'left-eye-lens': {
        name: '水晶體（左眼）',
        nameEn: 'Left Lens',
        description: '透明的凸透鏡，能夠改變形狀以調節焦點。',
        descriptionEn: 'Clear, adjustable lens that focuses light onto the retina for clear vision.'
    },
    'left-eye-retina': {
        name: '視網膜（左眼）',
        nameEn: 'Left Retina',
        description: '眼球後部的感光組織，將光轉換為神經信號。',
        descriptionEn: 'Light-sensitive tissue at the back of the eye that converts light to neural signals.'
    },
    'right-eye': {
        name: '右眼',
        nameEn: 'Right Eye',
        description: '眼睛的主要器官，負責光線感知和視覺處理。',
        descriptionEn: 'The primary organ of vision, responsible for light perception and visual processing.'
    },
    'right-eye-cornea': {
        name: '角膜（右眼）',
        nameEn: 'Right Cornea',
        description: '眼球最外層透明膜，主要負責光線折射。',
        descriptionEn: 'Transparent outer layer of the eye that refracts light and protects inner structures.'
    },
    'right-eye-iris': {
        name: '虹膜（右眼）',
        nameEn: 'Right Iris',
        description: '決定眼睛顏色的部分，控制瞳孔大小以調節光線進入量。',
        descriptionEn: 'Colored part of the eye that controls pupil size to regulate light entering the eye.'
    },
    'right-eye-lens': {
        name: '水晶體（右眼）',
        nameEn: 'Right Lens',
        description: '透明的凸透鏡，能夠改變形狀以調節焦點。',
        descriptionEn: 'Clear, adjustable lens that focuses light onto the retina for clear vision.'
    },
    'right-eye-retina': {
        name: '視網膜（右眼）',
        nameEn: 'Right Retina',
        description: '眼球後部的感光組織，將光轉換為神經信號。',
        descriptionEn: 'Light-sensitive tissue at the back of the eye that converts light to neural signals.'
    }
};

/**
 * 取得眼睛結構的說明
 * @param {string} structureId - 結構識別符
 * @returns {object} 結構說明物件或 null
 */
function getEyeStructureDescription(structureId) {
    return eyeStructureDescriptions[structureId] || null;
}
