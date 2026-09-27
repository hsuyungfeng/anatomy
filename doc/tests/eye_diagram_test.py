"""
Phase 9 眼睛 SVG 結構圖端到端測試
驗證眼睛系統改用 SVG 結構圖後的預期行為：
- 1. test_eye_view_is_svg：切到眼睛 → #eye-diagram-view 可見、#image-canvas 與 #odontogram-view 隱藏；可點結構數 = 22
- 2. test_every_eye_structure_opens_modal：OD／OS 各一次，對 22 個結構逐一用鍵盤選取（focus + Enter）→ 模態開啟、包含結構中文名稱
- 3. test_save_eye_record：OS 選角膜 → 儲存 → 記錄 system==='eye'、structureId==='left-eye-cornea'、side==='left'；.structure[data-structure="cornea"] 有 has-record；切到 OD 沒有 has-record
- 4. test_new_structure_saves：選黃斑部（新結構）→ 儲存 → structureId==='eye-macula'、side 為目前眼別
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

EYE_STRUCTURES_ZH = {
    "cornea": "角膜",
    "anterior-chamber": "前房",
    "iris": "虹膜",
    "dilator-pupillae": "瞳孔擴張肌",
    "pupil": "瞳孔",
    "lens": "水晶體",
    "ciliary-body": "睫狀體",
    "ciliary-muscle": "睫狀肌",
    "sclera": "鞏膜",
    "conjunctiva": "結膜",
    "choroid": "脈絡膜",
    "retina": "視網膜",
    "macula": "黃斑部",
    "optic-disc": "視神經盤",
    "vitreous": "玻璃體",
    "hyaloid-canal": "玻璃體管",
    "optic-nerve": "視神經",
    "vessels": "視網膜中央血管",
    "extraocular-muscles": "眼外肌",
    "eyelid": "眼瞼",
    "lacrimal-gland": "淚腺",
    "nasolacrimal-duct": "鼻淚管",
}


def test_eye_view_is_svg(browser, base_url: str):
    """
    1. test_eye_view_is_svg：
    切到眼睛 → #eye-diagram-view 可見、#image-canvas 與 #odontogram-view 隱藏；
    可點結構數 = 22。
    """
    context = browser.new_context()
    page = context.new_page()
    try:
        page.goto(f"{base_url}/index.html")
        page.wait_for_function("() => window.app !== undefined && window.app !== null", timeout=10000)

        page.click('.system-tab[data-system="eye"]')
        page.wait_for_function("() => window.app.currentSystemId === 'eye'", timeout=5000)
        page.wait_for_timeout(300)

        eye_view = page.locator("#eye-diagram-view")
        assert eye_view.is_visible(), "眼睛系統下 #eye-diagram-view 應可見"

        canvas = page.locator("#image-canvas")
        assert not canvas.is_visible(), "眼睛系統下 #image-canvas 應隱藏"

        odontogram = page.locator("#odontogram-view")
        assert not odontogram.is_visible(), "眼睛系統下 #odontogram-view 應隱藏"

        clickable_count = eye_view.locator('.structure[tabindex="0"]').count()
        assert clickable_count == 22, f"眼睛結構圖可點結構數應為 22，實際為 {clickable_count}"
    finally:
        context.close()


def test_every_eye_structure_opens_modal(browser, base_url: str):
    """
    2. test_every_eye_structure_opens_modal：
    OD、OS 各一次，對 22 個結構逐一用鍵盤選取（focus + Enter）→ 模態開啟、
    #modal-location 包含結構中文名稱 → 關閉。
    """
    context = browser.new_context()
    page = context.new_page()
    try:
        page.goto(f"{base_url}/index.html")
        page.wait_for_function("() => window.app !== undefined && window.app !== null", timeout=10000)
        page.click('.system-tab[data-system="eye"]')
        page.wait_for_function("() => window.app.currentSystemId === 'eye'", timeout=5000)
        page.wait_for_timeout(300)

        for side in ["right", "left"]:
            side_btn = page.locator(f'#eye-side-toggle button[data-side="{side}"]')
            side_btn.click()
            page.wait_for_selector(f'#eye-side-toggle button[data-side="{side}"][aria-pressed="true"]', timeout=3000)

            for key, name_zh in EYE_STRUCTURES_ZH.items():
                loc = page.locator(f'#eye-diagram-view .structure[data-structure="{key}"][tabindex="0"]')
                loc.focus()
                page.keyboard.press("Enter")
                page.wait_for_selector("#disease-modal[aria-hidden='false']", timeout=3000)

                location_text = page.inner_text("#modal-location")
                assert name_zh in location_text, (
                    f"[{side}] 結構 '{key}'（{name_zh}）開啟模態後，"
                    f"#modal-location 應包含 '{name_zh}'，實際為 '{location_text}'"
                )

                page.click("#modal-cancel-btn")
                page.wait_for_selector("#disease-modal[aria-hidden='true']", state="attached", timeout=3000)
    finally:
        context.close()


def test_save_eye_record(browser, base_url: str):
    """
    3. test_save_eye_record：
    OS 選角膜 → 勾第一個疾病 → 儲存 → 記錄 system==='eye'、structureId==='left-eye-cornea'、side==='left'；
    .structure[data-structure="cornea"] 有 has-record；切到 OD 後沒有 has-record。
    """
    context = browser.new_context()
    page = context.new_page()
    try:
        page.goto(f"{base_url}/index.html")
        page.wait_for_function("() => window.app !== undefined && window.app !== null", timeout=10000)
        page.click('.system-tab[data-system="eye"]')
        page.wait_for_function("() => window.app.currentSystemId === 'eye'", timeout=5000)
        page.wait_for_timeout(300)

        # 切到左眼 OS
        page.click('#eye-side-toggle button[data-side="left"]')
        page.wait_for_selector('#eye-side-toggle button[data-side="left"][aria-pressed="true"]', timeout=3000)

        # 點擊角膜
        cornea = page.locator('#eye-diagram-view .structure[data-structure="cornea"][tabindex="0"]')
        cornea.focus()
        page.keyboard.press("Enter")
        page.wait_for_selector("#disease-modal[aria-hidden='false']", timeout=3000)
        page.wait_for_selector(".disease-checkbox", timeout=3000)

        checkbox = page.locator(".disease-checkbox").first
        disease_name = checkbox.get_attribute("data-name")
        assert disease_name, "未能取得眼睛疾病名稱"
        checkbox.check()

        page.click("#modal-save-btn")
        page.wait_for_timeout(500)

        records = page.evaluate("() => JSON.parse(localStorage.getItem('medicalRecords') || '[]')")
        assert len(records) == 1, f"預期有 1 筆病歷，實際為 {len(records)}"

        rec = records[0]
        assert rec.get("system") == "eye", f"預期 system 為 'eye'，實際為 {rec.get('system')}"
        assert rec.get("structureId") == "left-eye-cornea", (
            f"預期 structureId 為 'left-eye-cornea'，實際為 {rec.get('structureId')}"
        )
        assert rec.get("side") == "left", f"預期 side 為 'left'，實際為 {rec.get('side')}"

        cornea_classes = page.locator('#eye-diagram-view .structure[data-structure="cornea"]').first.get_attribute("class") or ""
        assert "has-record" in cornea_classes.split(), f"OS 角膜應有 'has-record' class，實際為: {cornea_classes}"

        # 切到右眼 OD，確認沒有 has-record
        page.click('#eye-side-toggle button[data-side="right"]')
        page.wait_for_selector('#eye-side-toggle button[data-side="right"][aria-pressed="true"]', timeout=3000)
        page.wait_for_timeout(200)

        od_classes = page.locator('#eye-diagram-view .structure[data-structure="cornea"]').first.get_attribute("class") or ""
        assert "has-record" not in od_classes.split(), f"OD 角膜不應有 'has-record' class，實際為: {od_classes}"
    finally:
        context.close()


def test_new_structure_saves(browser, base_url: str):
    """
    4. test_new_structure_saves：
    選黃斑部（新結構）→ 儲存 → structureId==='eye-macula'、side 為目前眼別。
    """
    context = browser.new_context()
    page = context.new_page()
    try:
        page.goto(f"{base_url}/index.html")
        page.wait_for_function("() => window.app !== undefined && window.app !== null", timeout=10000)
        page.click('.system-tab[data-system="eye"]')
        page.wait_for_function("() => window.app.currentSystemId === 'eye'", timeout=5000)
        page.wait_for_timeout(300)

        # 預設為 OD（右眼）
        macula = page.locator('#eye-diagram-view .structure[data-structure="macula"][tabindex="0"]')
        macula.focus()
        page.keyboard.press("Enter")
        page.wait_for_selector("#disease-modal[aria-hidden='false']", timeout=3000)
        page.wait_for_selector(".disease-checkbox", timeout=3000)

        page.locator(".disease-checkbox").first.check()
        page.click("#modal-save-btn")
        page.wait_for_timeout(500)

        records = page.evaluate("() => JSON.parse(localStorage.getItem('medicalRecords') || '[]')")
        assert len(records) == 1, f"預期有 1 筆病歷，實際為 {len(records)}"

        rec = records[0]
        assert rec.get("structureId") == "eye-macula", (
            f"預期 structureId 為 'eye-macula'，實際為 {rec.get('structureId')}"
        )
        assert rec.get("side") == "right", f"預期 side 為 'right'，實際為 {rec.get('side')}"
    finally:
        context.close()


TESTS = [
    test_eye_view_is_svg,
    test_every_eye_structure_opens_modal,
    test_save_eye_record,
    test_new_structure_saves,
]
