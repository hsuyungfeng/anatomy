"""
Phase 9 舊記錄 ID 對應單元測試 (Node / 無瀏覽器環境)
驗證 AnatomyMapping 模組在純 JavaScript 環境下的解析邏輯：
- 眼睛舊記錄 structureId 對應
- 身體舊記錄 bodyRegionId / bodyPart 對應
- 身體部位 side 推斷 (bodySide)
"""

import json
import os
import shutil
import subprocess
from pathlib import Path


def _find_node():
    # 1. 系統 PATH
    node_bin = shutil.which("node") or shutil.which("nodejs")
    if node_bin:
        return node_bin

    # 2. Playwright 內建 driver node
    try:
        import playwright
        pw_node = Path(playwright.__file__).parent / "driver" / "node"
        if pw_node.is_file() and os.access(pw_node, os.X_OK):
            return str(pw_node)
    except ImportError:
        pass

    # 3. 常見本機 snap 路徑
    snap_node = Path("/home/amd/snap/antigravity-cli/common/local/lib/python3.14/dist-packages/playwright/driver/node")
    if snap_node.is_file() and os.access(snap_node, os.X_OK):
        return str(snap_node)

    raise RuntimeError("找不到可用的 Node.js 執行檔以執行單元測試")


def test_anatomy_mapping_unit(*args, **kwargs):
    """
    使用 Node.js 執行單元測試腳本，驗證 AnatomyMapping 的各項對應與規則。
    """
    node_bin = _find_node()
    root_dir = Path(__file__).resolve().parent.parent.parent

    test_js = f"""
    const fs = require('fs');
    const path = require('path');
    const assert = require('assert');

    // 載入 anatomy-mapping.js
    const mappingCode = fs.readFileSync(path.join({json.dumps(str(root_dir))}, 'assets/scripts/anatomy-mapping.js'), 'utf8');
    eval(mappingCode);
    const AM = globalThis.AnatomyMapping;
    assert(AM, 'AnatomyMapping 應成功掛載於 globalThis');

    // 載入 body-legacy-map.json
    const legacyMap = JSON.parse(fs.readFileSync(path.join({json.dumps(str(root_dir))}, 'data/body-legacy-map.json'), 'utf8'));

    // --- 1. 眼睛解析測試 ---
    // 整隻眼睛
    assert.deepStrictEqual(AM.resolveEye({{ structureId: 'right-eye' }}), {{ key: null, side: 'right', wholeEye: true }});
    assert.deepStrictEqual(AM.resolveEye({{ structureId: 'left-eye' }}), {{ key: null, side: 'left', wholeEye: true }});
    assert.deepStrictEqual(AM.resolveEye({{ structureId: 'eye', side: 'left' }}), {{ key: null, side: 'left', wholeEye: true }});

    // 帶邊 ID (right-eye-xxx, left-eye-xxx)
    assert.deepStrictEqual(AM.resolveEye({{ structureId: 'right-eye-cornea' }}), {{ key: 'cornea', side: 'right', wholeEye: false }});
    assert.deepStrictEqual(AM.resolveEye({{ structureId: 'left-eye-iris' }}), {{ key: 'iris', side: 'left', wholeEye: false }});
    assert.deepStrictEqual(AM.resolveEye({{ structureId: 'right-eye-lacrimal' }}), {{ key: 'lacrimal-gland', side: 'right', wholeEye: false }});
    assert.deepStrictEqual(AM.resolveEye({{ structureId: 'left-eye-lacrimal' }}), {{ key: 'lacrimal-gland', side: 'left', wholeEye: false }});

    // 通用 eye- 前綴 (取自 record.side)
    assert.deepStrictEqual(AM.resolveEye({{ structureId: 'eye-cornea' }}), {{ key: 'cornea', side: null, wholeEye: false }});
    assert.deepStrictEqual(AM.resolveEye({{ structureId: 'eye-iris', side: 'right' }}), {{ key: 'iris', side: 'right', wholeEye: false }});
    assert.deepStrictEqual(AM.resolveEye({{ structureId: 'eye-vitreous-hyaloid', side: 'left' }}), {{ key: 'hyaloid-canal', side: 'left', wholeEye: false }});
    assert.deepStrictEqual(AM.resolveEye({{ structureId: 'eye-blood-vessels', side: 'right' }}), {{ key: 'vessels', side: 'right', wholeEye: false }});
    assert.deepStrictEqual(AM.resolveEye({{ structureId: 'eye-choroid' }}), {{ key: 'choroid', side: null, wholeEye: false }});
    assert.deepStrictEqual(AM.resolveEye({{ structureId: 'eye-extraocular-muscles', side: 'left' }}), {{ key: 'extraocular-muscles', side: 'left', wholeEye: false }});
    assert.deepStrictEqual(AM.resolveEye({{ structureId: 'eye-sclera', side: 'right' }}), {{ key: 'sclera', side: 'right', wholeEye: false }});

    // 無法辨識
    assert.deepStrictEqual(AM.resolveEye({{ structureId: 'unknown-part' }}), {{ key: null, side: null, wholeEye: false }});


    // --- 2. 身體部位 side 推斷 (bodySide) 測試 ---
    assert.strictEqual(AM.bodySide('elbow-r'), 'right');
    assert.strictEqual(AM.bodySide('knee-r'), 'right');
    assert.strictEqual(AM.bodySide('head-eye-r'), 'right');
    assert.strictEqual(AM.bodySide('chest-breast-r'), 'right');

    assert.strictEqual(AM.bodySide('elbow-l'), 'left');
    assert.strictEqual(AM.bodySide('knee-l'), 'left');
    assert.strictEqual(AM.bodySide('shoulder-l'), 'left');

    // 5 個無後綴的左側成對部位
    assert.strictEqual(AM.bodySide('head-eyebrow'), 'left');
    assert.strictEqual(AM.bodySide('head-eye'), 'left');
    assert.strictEqual(AM.bodySide('head-ear'), 'left');
    assert.strictEqual(AM.bodySide('head-cheek'), 'left');
    assert.strictEqual(AM.bodySide('chest-breast'), 'left');

    // 中線部位
    assert.strictEqual(AM.bodySide('head-forehead'), 'mid');
    assert.strictEqual(AM.bodySide('head-nose'), 'mid');
    assert.strictEqual(AM.bodySide('head-lips'), 'mid');
    assert.strictEqual(AM.bodySide('head-chin'), 'mid');
    assert.strictEqual(AM.bodySide('neck'), 'mid');
    assert.strictEqual(AM.bodySide('neck-nape'), 'mid');
    assert.strictEqual(AM.bodySide('back'), 'mid');
    assert.strictEqual(AM.bodySide('chest'), 'mid');
    assert.strictEqual(AM.bodySide('abdomen'), 'mid');
    assert.strictEqual(AM.bodySide('groin'), 'mid');
    assert.strictEqual(AM.bodySide('groin-mons'), 'mid');
    assert.strictEqual(AM.bodySide('groin-vulva'), 'mid');
    assert.strictEqual(AM.bodySide('groin-penis'), 'mid');
    assert.strictEqual(AM.bodySide('groin-scrotum'), 'mid');


    // --- 3. 身體解析測試 ---
    // 精確子部位對應
    assert.deepStrictEqual(AM.resolveBody({{ bodyRegionId: 'arm-left-elbow' }}, legacyMap), {{ subId: 'elbow-l', regionId: null }});
    assert.deepStrictEqual(AM.resolveBody({{ bodyRegionId: 'leg-right-calf' }}, legacyMap), {{ subId: 'leg-r', regionId: null }});
    assert.deepStrictEqual(AM.resolveBody({{ bodyRegionId: 'head-eye-left' }}, legacyMap), {{ subId: 'head-eye', regionId: null }});
    assert.deepStrictEqual(AM.resolveBody({{ bodyRegionId: 'chest-breast-right' }}, legacyMap), {{ subId: 'chest-breast-r', regionId: null }});
    assert.deepStrictEqual(AM.resolveBody({{ bodyRegionId: 'neck-posterior' }}, legacyMap), {{ subId: 'neck-nape', regionId: null }});
    assert.deepStrictEqual(AM.resolveBody({{ bodyRegionId: 'abdomen-inguinal' }}, legacyMap), {{ subId: 'groin', regionId: null }});
    assert.deepStrictEqual(AM.resolveBody({{ bodyRegionId: 'head-mouth' }}, legacyMap), {{ subId: 'head-lips', regionId: null }});
    assert.deepStrictEqual(AM.resolveBody({{ bodyRegionId: 'knee-r' }}, legacyMap), {{ subId: 'knee-r', regionId: null }});

    // 大區域對應
    assert.deepStrictEqual(AM.resolveBody({{ bodyRegionId: 'arm-left' }}, legacyMap), {{ subId: null, regionId: 'upper-limb-l' }});
    assert.deepStrictEqual(AM.resolveBody({{ bodyRegionId: 'arm-right' }}, legacyMap), {{ subId: null, regionId: 'upper-limb-r' }});
    assert.deepStrictEqual(AM.resolveBody({{ bodyRegionId: 'leg-left' }}, legacyMap), {{ subId: null, regionId: 'lower-limb-l' }});
    assert.deepStrictEqual(AM.resolveBody({{ bodyRegionId: 'leg-right' }}, legacyMap), {{ subId: null, regionId: 'lower-limb-r' }});
    assert.deepStrictEqual(AM.resolveBody({{ bodyRegionId: 'head-scalp' }}, legacyMap), {{ subId: null, regionId: 'head' }});
    assert.deepStrictEqual(AM.resolveBody({{ bodyRegionId: 'head-skull' }}, legacyMap), {{ subId: null, regionId: 'head' }});
    assert.deepStrictEqual(AM.resolveBody({{ bodyRegionId: 'head-face' }}, legacyMap), {{ subId: null, regionId: 'head' }});
    assert.deepStrictEqual(AM.resolveBody({{ bodyRegionId: 'torso' }}, legacyMap), {{ subId: null, regionId: 'torso' }});

    // 舊格式 bodyPart + side
    assert.deepStrictEqual(AM.resolveBody({{ bodyPart: 'arm', side: 'left' }}, legacyMap), {{ subId: null, regionId: 'upper-limb-l' }});
    assert.deepStrictEqual(AM.resolveBody({{ bodyPart: 'arm', side: 'right' }}, legacyMap), {{ subId: null, regionId: 'upper-limb-r' }});
    assert.deepStrictEqual(AM.resolveBody({{ bodyPart: 'arm' }}, legacyMap), {{ subId: null, regionId: null }});
    assert.deepStrictEqual(AM.resolveBody({{ bodyPart: 'leg', side: 'left' }}, legacyMap), {{ subId: null, regionId: 'lower-limb-l' }});
    assert.deepStrictEqual(AM.resolveBody({{ bodyPart: 'leg', side: 'right' }}, legacyMap), {{ subId: null, regionId: 'lower-limb-r' }});
    assert.deepStrictEqual(AM.resolveBody({{ bodyPart: 'leg' }}, legacyMap), {{ subId: null, regionId: null }});

    // 5 個成對部位的 side 歧義處理
    assert.deepStrictEqual(AM.resolveBody({{ bodyRegionId: 'head-eyebrow', side: 'right' }}, legacyMap), {{ subId: 'head-eyebrow-r', regionId: null }});
    assert.deepStrictEqual(AM.resolveBody({{ bodyRegionId: 'head-eyebrow', side: 'left' }}, legacyMap), {{ subId: 'head-eyebrow', regionId: null }});
    assert.deepStrictEqual(AM.resolveBody({{ bodyRegionId: 'head-eyebrow' }}, legacyMap), {{ subId: 'head-eyebrow', regionId: null }});
    assert.deepStrictEqual(AM.resolveBody({{ bodyRegionId: 'head-eye', side: 'right' }}, legacyMap), {{ subId: 'head-eye-r', regionId: null }});
    assert.deepStrictEqual(AM.resolveBody({{ bodyRegionId: 'head-eye' }}, legacyMap), {{ subId: 'head-eye', regionId: null }});
    assert.deepStrictEqual(AM.resolveBody({{ bodyRegionId: 'head-ear', side: 'right' }}, legacyMap), {{ subId: 'head-ear-r', regionId: null }});
    assert.deepStrictEqual(AM.resolveBody({{ bodyRegionId: 'head-ear' }}, legacyMap), {{ subId: 'head-ear', regionId: null }});
    assert.deepStrictEqual(AM.resolveBody({{ bodyRegionId: 'head-cheek', side: 'right' }}, legacyMap), {{ subId: 'head-cheek-r', regionId: null }});
    assert.deepStrictEqual(AM.resolveBody({{ bodyRegionId: 'head-cheek' }}, legacyMap), {{ subId: 'head-cheek', regionId: null }});
    assert.deepStrictEqual(AM.resolveBody({{ bodyRegionId: 'chest-breast', side: 'right' }}, legacyMap), {{ subId: 'chest-breast-r', regionId: null }});
    assert.deepStrictEqual(AM.resolveBody({{ bodyRegionId: 'chest-breast' }}, legacyMap), {{ subId: 'chest-breast', regionId: null }});

    console.log('ALL ANATOMY MAPPING UNIT TESTS PASSED');
    """

    res = subprocess.run([node_bin, "-e", test_js], capture_output=True, text=True)
    assert res.returncode == 0, f"Node.js 執行單元測試失敗:\n{res.stderr}\n輸出:\n{res.stdout}"
    assert "ALL ANATOMY MAPPING UNIT TESTS PASSED" in res.stdout


TESTS = [
    test_anatomy_mapping_unit,
]


if __name__ == "__main__":
    test_anatomy_mapping_unit()
    print("test_anatomy_mapping_unit: PASS")
