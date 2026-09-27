"""
Phase 9 身體寫實輪廓 SVG 端到端測試
驗證身體系統改用寫實輪廓 SVG 後的預期行為：
- 5. test_body_view_is_svg：切到身體 → #body-map-view 可見；女性正面＋背面可點區域涵蓋 body-systems.json（排除男性部位）；切男性後包含男性部位、不含女性部位
- 6. test_every_body_region_opens_modal：對每個 .region 逐一用鍵盤選取 → 模態開啟、包含該子部位中文名稱
- 7. test_save_body_operation：點 knee-r（正面）→ 操作表單填寫並儲存 → 記錄 system==='body'、bodyRegionId==='knee-r'、side==='right'；正面與背面的 knee-r 都有 has-record
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

_PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent


def _get_body_subregions():
    json_path = _PROJECT_ROOT / "data" / "body-systems.json"
    with open(json_path, "r", encoding="utf-8") as f:
        data = json.load(f)
    subregions = {}
    for region in data.get("bodyRegions", []):
        for sub in region.get("subRegions", []):
            subregions[sub["id"]] = sub["nameZh"]
    return subregions


def test_body_view_is_svg(browser, base_url: str):
    """
    5. test_body_view_is_svg：
    切到身體 → #body-map-view 可見；女性正面＋背面的可點區域都存在，
    data-region 集合 ⊇ body-systems.json 的所有子部位（排除 groin-penis、groin-scrotum）；
    切男性後包含 groin-penis、groin-scrotum，不含 groin-vulva。
    """
    all_subregions = _get_body_subregions()
    expected_female = set(all_subregions.keys()) - {"groin-penis", "groin-scrotum"}

    context = browser.new_context()
    page = context.new_page()
    try:
        page.goto(f"{base_url}/index.html")
        page.wait_for_function("() => window.app !== undefined && window.app !== null", timeout=10000)

        page.click('.system-tab[data-system="body"]')
        page.wait_for_function("() => window.app.currentSystemId === 'body'", timeout=5000)
        page.wait_for_timeout(300)

        body_view = page.locator("#body-map-view")
        assert body_view.is_visible(), "身體系統下 #body-map-view 應可見"

        canvas = page.locator("#image-canvas")
        assert not canvas.is_visible(), "身體系統下 #image-canvas 應隱藏"

        odontogram = page.locator("#odontogram-view")
        assert not odontogram.is_visible(), "身體系統下 #odontogram-view 應隱藏"

        # 預設為女性
        female_regions = set(page.evaluate(
            "() => Array.from(document.querySelectorAll('#body-map-view .region')).map(el => el.dataset.region)"
        ))
        assert expected_female.issubset(female_regions), (
            f"女性視圖缺少子部位: {expected_female - female_regions}"
        )
        assert "groin-penis" not in female_regions, "女性視圖不應包含 groin-penis"
        assert "groin-scrotum" not in female_regions, "女性視圖不應包含 groin-scrotum"
        assert "groin-vulva" in female_regions, "女性視圖應包含 groin-vulva"

        # 切換到男性
        page.click('#body-sex-toggle button[data-sex="male"]')
        page.wait_for_selector('#body-sex-toggle button[data-sex="male"][aria-pressed="true"]', timeout=3000)
        page.wait_for_timeout(300)

        male_regions = set(page.evaluate(
            "() => Array.from(document.querySelectorAll('#body-map-view .region')).map(el => el.dataset.region)"
        ))
        assert "groin-penis" in male_regions, "男性視圖應包含 groin-penis"
        assert "groin-scrotum" in male_regions, "男性視圖應包含 groin-scrotum"
        assert "groin-vulva" not in male_regions, "男性視圖不應包含 groin-vulva"
    finally:
        context.close()


def test_every_body_region_opens_modal(browser, base_url: str):
    """
    6. test_every_body_region_opens_modal：
    對每個 .region（正面與背面，女性）逐一用鍵盤選取 → 模態開啟、
    #modal-location 包含 body-systems.json 中該子部位的 nameZh → 關閉。
    """
    all_subregions = _get_body_subregions()

    context = browser.new_context()
    page = context.new_page()
    try:
        page.goto(f"{base_url}/index.html")
        page.wait_for_function("() => window.app !== undefined && window.app !== null", timeout=10000)
        page.click('.system-tab[data-system="body"]')
        page.wait_for_function("() => window.app.currentSystemId === 'body'", timeout=5000)
        page.wait_for_timeout(300)

        # 取得所有唯一的 (region_id, view) 組合
        region_nodes = page.evaluate("""() => {
            return Array.from(document.querySelectorAll('#body-map-view .region[tabindex]')).map(el => ({
                id: el.dataset.region,
                view: el.dataset.view
            }));
        }""")
        assert len(region_nodes) > 0, "未能找到任何可點選的身體部位 #body-map-view .region[tabindex]"

        for item in region_nodes:
            rid = item["id"]
            rview = item["view"]
            expected_name = all_subregions.get(rid, rid)

            loc = page.locator(f'#body-map-view .region[data-region="{rid}"][data-view="{rview}"]')
            loc.focus()
            page.keyboard.press("Enter")
            page.wait_for_selector("#disease-modal[aria-hidden='false']", timeout=3000)

            location_text = page.inner_text("#modal-location")
            # 檢查部位名稱關鍵字（去除「左」「右」或直接比對名稱）
            assert (expected_name in location_text) or (rid in location_text), (
                f"[{rview}] 部位 '{rid}' 開啟模態後，#modal-location 應包含 '{expected_name}'，實際為 '{location_text}'"
            )

            page.click("#modal-cancel-btn")
            page.wait_for_selector("#disease-modal[aria-hidden='true']", state="attached", timeout=3000)
    finally:
        context.close()


def test_save_body_operation(browser, base_url: str):
    """
    7. test_save_body_operation：
    點 knee-r（正面）→ 在操作表單選第一個操作類型、填描述 → 儲存 →
    記錄 system==='body'、bodyRegionId==='knee-r'、side==='right'；
    正面與背面的 knee-r 都有 has-record。
    """
    context = browser.new_context()
    page = context.new_page()
    try:
        page.goto(f"{base_url}/index.html")
        page.wait_for_function("() => window.app !== undefined && window.app !== null", timeout=10000)
        page.click('.system-tab[data-system="body"]')
        page.wait_for_function("() => window.app.currentSystemId === 'body'", timeout=5000)
        page.wait_for_timeout(300)

        knee = page.locator('#body-map-view .region[data-region="knee-r"][data-view="front"]')
        knee.click()
        page.wait_for_selector("#disease-modal[aria-hidden='false']", timeout=3000)
        page.wait_for_selector(".operation-type-input", timeout=3000)

        page.locator(".operation-type-input").first.check()
        desc = "關節鏡檢查程序測試"
        page.fill(".operation-description", desc)

        page.click("#modal-save-btn")
        page.wait_for_timeout(500)

        records = page.evaluate("() => JSON.parse(localStorage.getItem('medicalRecords') || '[]')")
        assert len(records) == 1, f"預期有 1 筆病歷，實際為 {len(records)}"

        rec = records[0]
        assert rec.get("system") == "body", f"預期 system 為 'body'，實際為 {rec.get('system')}"
        assert rec.get("bodyRegionId") == "knee-r", (
            f"預期 bodyRegionId 為 'knee-r'，實際為 {rec.get('bodyRegionId')}"
        )
        assert rec.get("side") == "right", f"預期 side 為 'right'，實際為 {rec.get('side')}"

        front_classes = page.locator('#body-map-view .region[data-region="knee-r"][data-view="front"]').get_attribute("class") or ""
        assert "has-record" in front_classes.split(), f"正面 knee-r 應有 'has-record' class，實際為: {front_classes}"

        back_classes = page.locator('#body-map-view .region[data-region="knee-r"][data-view="back"]').get_attribute("class") or ""
        assert "has-record" in back_classes.split(), f"背面 knee-r 應有 'has-record' class，實際為: {back_classes}"
    finally:
        context.close()


TESTS = [
    test_body_view_is_svg,
    test_every_body_region_opens_modal,
    test_save_body_operation,
]
