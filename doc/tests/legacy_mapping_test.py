"""
Phase 9 舊記錄 ID 對應端到端測試
驗證眼睛與身體歷史舊記錄的讀取期動態對應行為：
- 8. test_eye_legacy_ids：涵蓋 context 表格中每一類眼睛舊記錄 → OD／OS 正確標示，整隻眼睛在眼別按鈕顯示徽章
- 9. test_body_legacy_ids：涵蓋 context 列出的每一種身體舊記錄 → 對應子部位有 has-record，大區域記錄讓該區所有子部位有 has-region-record
- 10. test_legacy_records_unchanged：載入與切換後，localStorage 中舊記錄原始欄位原封不動
"""

import json
import os
from pathlib import Path

# 確保在 snap 環境下能找到相依函式庫
_SNAP_LIB = "/home/amd/snap/antigravity-cli/common/local/usr/lib/x86_64-linux-gnu"
if os.path.isdir(_SNAP_LIB):
    current_ld = os.environ.get("LD_LIBRARY_PATH", "")
    if _SNAP_LIB not in current_ld.split(":"):
        os.environ["LD_LIBRARY_PATH"] = f"{_SNAP_LIB}:{current_ld}" if current_ld else _SNAP_LIB


def test_eye_legacy_ids(browser, base_url: str):
    """
    8. test_eye_legacy_ids：
    預先放入 context 表格中每一類的眼睛舊記錄（各一筆，含一筆 eye-cornea 無 side、一筆 right-eye 整隻眼睛）
    → 逐一斷言 OD／OS 視圖的標示結果符合表格（整隻眼睛：#eye-side-toggle button[data-side="right"] 的 data-record-count ≥ 1）。
    """
    legacy_eye_records = [
        {"annotationId": "eye-leg-1", "system": "eye", "structureId": "right-eye-cornea", "diseases": [{"name": "角膜炎"}]},
        {"annotationId": "eye-leg-2", "system": "eye", "structureId": "left-eye-iris", "diseases": [{"name": "虹膜炎"}]},
        {"annotationId": "eye-leg-3", "system": "eye", "structureId": "right-eye-lacrimal", "diseases": [{"name": "淚腺炎"}]},
        {"annotationId": "eye-leg-4", "system": "eye", "structureId": "left-eye-lacrimal", "diseases": [{"name": "淚腺炎"}]},
        {"annotationId": "eye-leg-5", "system": "eye", "structureId": "eye-cornea", "diseases": [{"name": "角膜潰瘍"}]},
        {"annotationId": "eye-leg-6", "system": "eye", "structureId": "eye-iris", "side": "right", "diseases": [{"name": "虹膜缺損"}]},
        {"annotationId": "eye-leg-7", "system": "eye", "structureId": "eye-vitreous-hyaloid", "side": "left", "diseases": [{"name": "玻璃體混濁"}]},
        {"annotationId": "eye-leg-8", "system": "eye", "structureId": "eye-blood-vessels", "side": "right", "diseases": [{"name": "視網膜血管阻塞"}]},
        {"annotationId": "eye-leg-9", "system": "eye", "structureId": "eye-choroid", "diseases": [{"name": "脈絡膜病變"}]},
        {"annotationId": "eye-leg-10", "system": "eye", "structureId": "eye-extraocular-muscles", "side": "left", "diseases": [{"name": "斜視"}]},
        {"annotationId": "eye-leg-11", "system": "eye", "structureId": "right-eye", "diseases": [{"name": "全眼炎"}]},
    ]

    context = browser.new_context()
    page = context.new_page()
    page.add_init_script(f"""
        if (!sessionStorage.getItem('test_legacy_eye_init')) {{
            sessionStorage.setItem('test_legacy_eye_init', 'true');
            localStorage.setItem('medicalRecords', JSON.stringify({json.dumps(legacy_eye_records)}));
        }}
    """)
    try:
        page.goto(f"{base_url}/index.html")
        page.wait_for_function("() => window.app !== undefined && window.app !== null", timeout=10000)
        page.click('.system-tab[data-system="eye"]')
        page.wait_for_function("() => window.app.currentSystemId === 'eye'", timeout=5000)
        page.wait_for_timeout(300)

        # 1. 檢查 OD（右眼）視圖
        page.click('#eye-side-toggle button[data-side="right"]')
        page.wait_for_timeout(200)

        od_structures = page.locator("#eye-diagram-view")
        assert "has-record" in (od_structures.locator('.structure[data-structure="cornea"]').first.get_attribute("class") or "").split(), "OD 角膜應有 has-record"
        assert "has-record" in (od_structures.locator('.structure[data-structure="lacrimal-gland"]').first.get_attribute("class") or "").split(), "OD 淚腺應有 has-record"
        assert "has-record" in (od_structures.locator('.structure[data-structure="iris"]').first.get_attribute("class") or "").split(), "OD 虹膜應有 has-record"
        assert "has-record" in (od_structures.locator('.structure[data-structure="vessels"]').first.get_attribute("class") or "").split(), "OD 血管應有 has-record"
        assert "has-record" in (od_structures.locator('.structure[data-structure="choroid"]').first.get_attribute("class") or "").split(), "OD 脈絡膜應有 has-record"

        # 整隻眼睛筆數徽章
        right_btn = page.locator('#eye-side-toggle button[data-side="right"]')
        count_attr = right_btn.get_attribute("data-record-count") or "0"
        assert int(count_attr) >= 1, f"OD 按鈕 data-record-count 應 >= 1，實際為 {count_attr}"

        # 2. 檢查 OS（左眼）視圖
        page.click('#eye-side-toggle button[data-side="left"]')
        page.wait_for_timeout(200)

        os_structures = page.locator("#eye-diagram-view")
        assert "has-record" in (os_structures.locator('.structure[data-structure="iris"]').first.get_attribute("class") or "").split(), "OS 虹膜應有 has-record"
        assert "has-record" in (os_structures.locator('.structure[data-structure="lacrimal-gland"]').first.get_attribute("class") or "").split(), "OS 淚腺應有 has-record"
        assert "has-record" in (os_structures.locator('.structure[data-structure="cornea"]').first.get_attribute("class") or "").split(), "OS 角膜應有 has-record（無 side 舊記錄兩眼都標）"
        assert "has-record" in (os_structures.locator('.structure[data-structure="hyaloid-canal"]').first.get_attribute("class") or "").split(), "OS 玻璃體管應有 has-record"
        assert "has-record" in (os_structures.locator('.structure[data-structure="extraocular-muscles"]').first.get_attribute("class") or "").split(), "OS 眼外肌應有 has-record"
        assert "has-record" in (os_structures.locator('.structure[data-structure="choroid"]').first.get_attribute("class") or "").split(), "OS 脈絡膜應有 has-record"
    finally:
        context.close()


def test_body_legacy_ids(browser, base_url: str):
    """
    9. test_body_legacy_ids：
    預先放入 context 列出的每一種身體舊記錄 → 斷言對應子部位有 has-record；
    大區域記錄讓該區所有子部位有 has-region-record。
    """
    legacy_body_records = [
        {"annotationId": "b-leg-1", "system": "body", "bodyRegionId": "arm-left-elbow", "description": "左肘"},
        {"annotationId": "b-leg-2", "system": "body", "bodyRegionId": "leg-right-calf", "description": "右小腿"},
        {"annotationId": "b-leg-3", "system": "body", "bodyRegionId": "head-eye-left", "description": "左眼"},
        {"annotationId": "b-leg-4", "system": "body", "bodyRegionId": "chest-breast-right", "description": "右乳"},
        {"annotationId": "b-leg-5", "system": "body", "bodyRegionId": "neck-posterior", "description": "後頸"},
        {"annotationId": "b-leg-6", "system": "body", "bodyRegionId": "abdomen-inguinal", "description": "腹股溝"},
        {"annotationId": "b-leg-7", "system": "body", "bodyRegionId": "head-mouth", "description": "嘴唇"},
        {"annotationId": "b-leg-8", "system": "body", "bodyRegionId": "knee-r", "description": "右膝"},
        {"annotationId": "b-leg-9", "system": "body", "bodyRegionId": "arm-left", "description": "左上肢大區域"},
        {"annotationId": "b-leg-10", "system": "body", "bodyPart": "arm", "side": "left", "description": "舊格式左臂"},
    ]

    context = browser.new_context()
    page = context.new_page()
    page.add_init_script(f"""
        if (!sessionStorage.getItem('test_legacy_body_init')) {{
            sessionStorage.setItem('test_legacy_body_init', 'true');
            localStorage.setItem('medicalRecords', JSON.stringify({json.dumps(legacy_body_records)}));
        }}
    """)
    try:
        page.goto(f"{base_url}/index.html")
        page.wait_for_function("() => window.app !== undefined && window.app !== null", timeout=10000)
        page.click('.system-tab[data-system="body"]')
        page.wait_for_function("() => window.app.currentSystemId === 'body'", timeout=5000)
        page.wait_for_timeout(300)

        # 斷言精確對應子部位有 has-record
        exact_subregions = [
            "elbow-l",
            "leg-r",
            "head-eye",
            "chest-breast-r",
            "neck-nape",
            "groin",
            "head-lips",
            "knee-r",
        ]
        for sub_id in exact_subregions:
            classes = page.locator(f'#body-map-view .region[data-region="{sub_id}"]').first.get_attribute("class") or ""
            assert "has-record" in classes.split(), f"部位 '{sub_id}' 應有 'has-record' class，實際為: {classes}"

        # 斷言大區域 arm-left / upper-limb-l 之所有子部位有 has-region-record
        upper_limb_l_subs = [
            "shoulder-l",
            "axilla-l",
            "arm-l",
            "elbow-l",
            "forearm-l",
            "wrist-l",
            "hand-l",
            "fingers-l",
        ]
        for sub_id in upper_limb_l_subs:
            classes = page.locator(f'#body-map-view .region[data-region="{sub_id}"]').first.get_attribute("class") or ""
            assert "has-region-record" in classes.split(), (
                f"大區域子部位 '{sub_id}' 應有 'has-region-record' class，實際為: {classes}"
            )
    finally:
        context.close()


def test_legacy_records_unchanged(browser, base_url: str):
    """
    10. test_legacy_records_unchanged：
    載入後 localStorage 中這些舊記錄的 structureId／bodyRegionId／bodyPart 原封不動
    （對應是讀取時計算，不改寫資料）。
    """
    original_records = [
        {"annotationId": "eye-raw-1", "system": "eye", "structureId": "eye-cornea", "diseases": [{"name": "角膜炎"}]},
        {"annotationId": "body-raw-1", "system": "body", "bodyRegionId": "arm-left-elbow", "description": "左肘"},
        {"annotationId": "body-raw-2", "system": "body", "bodyPart": "arm", "side": "left", "description": "舊格式"},
    ]

    context = browser.new_context()
    page = context.new_page()
    page.add_init_script(f"""
        if (!sessionStorage.getItem('test_legacy_raw_init')) {{
            sessionStorage.setItem('test_legacy_raw_init', 'true');
            localStorage.setItem('medicalRecords', JSON.stringify({json.dumps(original_records)}));
        }}
    """)
    try:
        page.goto(f"{base_url}/index.html")
        page.wait_for_function("() => window.app !== undefined && window.app !== null", timeout=10000)

        # 切換分頁觸發讀取與對應計算
        page.click('.system-tab[data-system="eye"]')
        page.wait_for_timeout(200)
        page.click('.system-tab[data-system="body"]')
        page.wait_for_timeout(200)

        records_after = page.evaluate("() => JSON.parse(localStorage.getItem('medicalRecords') || '[]')")
        rec_map = {r["annotationId"]: r for r in records_after}

        r1 = rec_map.get("eye-raw-1")
        assert r1 and r1.get("structureId") == "eye-cornea", f"舊眼睛記錄 structureId 被改寫: {r1}"

        r2 = rec_map.get("body-raw-1")
        assert r2 and r2.get("bodyRegionId") == "arm-left-elbow", f"舊身體記錄 bodyRegionId 被改寫: {r2}"

        r3 = rec_map.get("body-raw-2")
        assert r3 and r3.get("bodyPart") == "arm" and r3.get("side") == "left", f"舊格式 bodyPart 被改寫: {r3}"
    finally:
        context.close()


TESTS = [
    test_eye_legacy_ids,
    test_body_legacy_ids,
    test_legacy_records_unchanged,
]
