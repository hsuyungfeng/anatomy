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
    },
    'eye-conjunctiva': {
        name: '結膜',
        nameEn: 'Conjunctiva',
        description: '覆蓋於鞏膜前表面與眼瞼內側的薄透明黏膜，分泌黏液潤滑眼球並防禦外來病原體。',
        descriptionEn: 'Thin transparent mucous membrane covering the anterior sclera and lining the eyelids, lubricating and protecting the eye.'
    },
    'eye-anterior-chamber': {
        name: '前房',
        nameEn: 'Anterior Chamber',
        description: '位於角膜後表面與虹膜之間的充滿房水之腔室，負責維持眼內壓及供給無血管組織營養。',
        descriptionEn: 'Aqueous humor-filled space between the posterior cornea and iris, maintaining intraocular pressure and nourishing avascular tissues.'
    },
    'macula': {
        name: '黃斑部',
        nameEn: 'Macula',
        description: '位於視網膜中心的感光敏感區，含有高度密集的錐狀細胞，負責精細中心視力與色彩辨別。',
        descriptionEn: 'High-acuity area near the center of the retina packed with cone photoreceptors, essential for sharp central vision and color perception.'
    },
    'eye-macula': {
        name: '黃斑部',
        nameEn: 'Macula',
        description: '位於視網膜中心的感光敏感區，含有高度密集的錐狀細胞，負責精細中心視力與色彩辨別。',
        descriptionEn: 'High-acuity area near the center of the retina packed with cone photoreceptors, essential for sharp central vision and color perception.'
    },
    'eye-optic-disc': {
        name: '視神經盤',
        nameEn: 'Optic Disc',
        description: '視神經纖維匯聚並穿出眼球的起點，亦為視網膜中央動靜脈進出之孔道，因無感光細胞而構成生理盲點。',
        descriptionEn: 'Circular area where ganglion cell axons converge to form the optic nerve and retinal vessels enter/exit, forming the physiological blind spot.'
    },
    'eye-eyelid': {
        name: '眼瞼',
        nameEn: 'Eyelid',
        description: '覆蓋於眼球前方的可活動皮瓣組織，藉由眨眼均勻塗布淚膜並物理阻擋外界異物與強光。',
        descriptionEn: 'Movable folds of skin protecting the globe from physical injury and spreading tears across the cornea during blinking.'
    }
};

/**
 * 取得眼睛結構的說明
 * @param {string} structureId - 結構識別符
 * @returns {object} 結構說明物件或 null
 */
function getEyeStructureDescription(structureId) {
    if (!structureId) return null;
    if (eyeStructureDescriptions[structureId]) {
        return eyeStructureDescriptions[structureId];
    }
    // 去掉 left- 或 right- 前綴再查一次 (例如 left-eye-cornea -> eye-cornea 或 cornea)
    const stripped = structureId.replace(/^(left|right)-/, '');
    if (eyeStructureDescriptions[stripped]) {
        return eyeStructureDescriptions[stripped];
    }
    const withEye = stripped.startsWith('eye-') ? stripped : `eye-${stripped}`;
    if (eyeStructureDescriptions[withEye]) {
        return eyeStructureDescriptions[withEye];
    }
    return null;
}
