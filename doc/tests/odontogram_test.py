"""
Phase 8 結構化 SVG 牙位圖端到端測試 (Odontogram E2E Tests)
驗證 SVG-01 ~ SVG-04：
1. test_teeth_view_is_svg：#odontogram-view 可見、內有 32 個 .tooth，#image-canvas 不可見
2. test_primary_view：點乳齒分頁 → 20 個 .tooth，FDI 集合為 51-55, 61-65, 71-75, 81-85
3. test_every_tooth_opens_correct_modal：在 scale 1、1.25、2 下對永久牙 32 顆逐一點擊開啟正確模態，乳牙 20 顆亦同
4. test_save_via_odontogram：點擊 16 儲存疾病，檢查 medicalRecords 與 .tooth.has-record
5. test_marker_persists_after_reload：儲存病歷後重新整理，標記依然存在
6. test_legacy_record_marker：預先置入無 system 舊記錄，載入後能標記且計數為 1
7. test_keyboard_opens_modal：以鍵盤 Focus 並按 Enter 能開啟正確模態
8. test_reference_image_toggle：點擊「參考圖」按鈕切換 canvas/svg，且參考圖不可點擊開啟模態
9. test_other_systems_use_canvas：切至眼睛系統，牙位圖與切換按鈕隱藏，canvas 可見
"""

import json
import os
import sys
from pathlib import Path

# 確保在 snap 環境下能找到相依函式庫
_SNAP_LIB = "/home/amd/snap/antigravity-cli/common/local/usr/lib/x86_64-linux-gnu"
if os.path.isdir(_SNAP_LIB):
    current_ld = os.environ.get("LD_LIBRARY_PATH", "")
    if _SNAP_LIB not in current_ld.split(":"):
        os.environ["LD_LIBRARY_PATH"] = f"{_SNAP_LIB}:{current_ld}" if current_ld else _SNAP_LIB


def _get_tooth_name_zh(fdi: int) -> str:
    """從 data/tooth-numbering.json 讀取指定 FDI 編號的中文名稱"""
    json_path = Path(__file__).resolve().parent.parent.parent / "data" / "tooth-numbering.json"
    with open(json_path, "r", encoding="utf-8") as f:
        data = json.load(f)
    for sys_entry in data.get("systems", []):
        for tooth in sys_entry.get("teeth", []):
            if tooth.get("fdi") == fdi:
                return tooth.get("nameZh", "")
    return ""


def test_teeth_view_is_svg(browser, base_url: str):
    """
    1. test_teeth_view_is_svg：
    #odontogram-view 可見、內有 32 個 .tooth，#image-canvas 不可見。
    """
    context = browser.new_context()
    page = context.new_page()
    try:
        page.goto(f"{base_url}/index.html")
        page.wait_for_function("() => window.app !== undefined && window.app !== null", timeout=10000)
        page.click('.system-tab[data-system="teeth"]')
        page.wait_for_function("() => window.app.currentSystemId === 'teeth'", timeout=5000)

        odontogram = page.locator("#odontogram-view")
        assert odontogram.is_visible(), "牙齒系統下 #odontogram-view 應可見"

        tooth_count = odontogram.locator(".tooth").count()
        assert tooth_count == 32, f"永久牙應有 32 顆 .tooth，實際為 {tooth_count}"

        assert not page.locator("#image-canvas").is_visible(), "牙齒系統下 #image-canvas 應不可見"
    finally:
        context.close()


def test_primary_view(browser, base_url: str):
    """
    2. test_primary_view：
    點乳齒分頁（.teeth-tab[data-teeth-type="primary"]）→ 20 個 .tooth，
    FDI 集合為 51–55、61–65、71–75、81–85。
    """
    context = browser.new_context()
    page = context.new_page()
    try:
        page.goto(f"{base_url}/index.html")
        page.wait_for_function("() => window.app !== undefined && window.app !== null", timeout=10000)
        page.click('.system-tab[data-system="teeth"]')
        page.wait_for_function("() => window.app.currentSystemId === 'teeth'", timeout=5000)

        # 點擊乳齒分頁
        page.click('.teeth-tab[data-teeth-type="primary"]')
        page.wait_for_timeout(300)

        odontogram = page.locator("#odontogram-view")
        assert odontogram.is_visible(), "#odontogram-view 應可見"

        teeth_elements = odontogram.locator(".tooth")
        count = teeth_elements.count()
        assert count == 20, f"乳牙應有 20 顆 .tooth，實際為 {count}"

        fdis = set(page.evaluate(
            "() => Array.from(document.querySelectorAll('#odontogram-view .tooth')).map(el => Number(el.dataset.fdi))"
        ))
        expected_fdis = set(
            list(range(51, 56)) +
            list(range(61, 66)) +
            list(range(71, 76)) +
            list(range(81, 86))
        )
        assert fdis == expected_fdis, f"乳牙 FDI 集合不符，預期 {expected_fdis}，實際 {fdis}"
    finally:
        context.close()


def test_every_tooth_opens_correct_modal(browser, base_url: str):
    """
    3. test_every_tooth_opens_correct_modal：
    用 device_scale_factor 分別為 1、1.25、2 的 context 各跑一次（對應 devicePixelRatio 的 bug）。
    對永久牙 32 顆逐一：點擊 .tooth[data-fdi="NN"] .crown → 等 #disease-modal[aria-hidden="false"]
    → 斷言 #modal-location 文字包含 NN → 關閉模態（#modal-cancel-btn）。
    對乳牙 20 顆也做一次（scale 1 即可）。
    """
    permanent_fdis = [
        18, 17, 16, 15, 14, 13, 12, 11,
        21, 22, 23, 24, 25, 26, 27, 28,
        38, 37, 36, 35, 34, 33, 32, 31,
        41, 42, 43, 44, 45, 46, 47, 48
    ]
    primary_fdis = [
        55, 54, 53, 52, 51,
        61, 62, 63, 64, 65,
        75, 74, 73, 72, 71,
        81, 82, 83, 84, 85
    ]

    for scale in [1.0, 1.25, 2.0]:
        context = browser.new_context(device_scale_factor=scale)
        page = context.new_page()
        try:
            page.goto(f"{base_url}/index.html")
            page.wait_for_function("() => window.app !== undefined && window.app !== null", timeout=10000)
            page.click('.system-tab[data-system="teeth"]')
            page.wait_for_function("() => window.app.currentSystemId === 'teeth'", timeout=5000)

            for fdi in permanent_fdis:
                crown = page.locator(f'#odontogram-view .tooth[data-fdi="{fdi}"] .crown')
                crown.click()
                page.wait_for_selector("#disease-modal[aria-hidden='false']", timeout=3000)
                location_text = page.inner_text("#modal-location")
                assert str(fdi) in location_text, (
                    f"[scale={scale}] 點擊 FDI {fdi} 後，#modal-location 應包含 '{fdi}'，實際為 '{location_text}'"
                )
                page.click("#modal-cancel-btn")
                page.wait_for_selector("#disease-modal[aria-hidden='true']", state="attached", timeout=3000)
        finally:
            context.close()

    # 乳牙 20 顆測試（scale 1.0）
    context = browser.new_context(device_scale_factor=1.0)
    page = context.new_page()
    try:
        page.goto(f"{base_url}/index.html")
        page.wait_for_function("() => window.app !== undefined && window.app !== null", timeout=10000)
        page.click('.system-tab[data-system="teeth"]')
        page.click('.teeth-tab[data-teeth-type="primary"]')
        page.wait_for_timeout(300)

        for fdi in primary_fdis:
            crown = page.locator(f'#odontogram-view .tooth[data-fdi="{fdi}"] .crown')
            crown.click()
            page.wait_for_selector("#disease-modal[aria-hidden='false']", timeout=3000)
            location_text = page.inner_text("#modal-location")
            assert str(fdi) in location_text, (
                f"[乳牙] 點擊 FDI {fdi} 後，#modal-location 應包含 '{fdi}'，實際為 '{location_text}'"
            )
            page.click("#modal-cancel-btn")
            page.wait_for_selector("#disease-modal[aria-hidden='true']", state="attached", timeout=3000)
    finally:
        context.close()


def test_save_via_odontogram(browser, base_url: str):
    """
    4. test_save_via_odontogram：
    點 16 → 勾選第一個疾病 checkbox → 按 #modal-save-btn
    → 斷言 localStorage medicalRecords 有一筆 fdiNumber === 16、system === 'teeth'、
      universalNumber 為 3（字串或數字都接受）、locationName 等於 data/tooth-numbering.json 中 FDI 16 的 nameZh；
      .tooth[data-fdi="16"] 有 has-record class；病歷清單顯示該疾病。
    """
    expected_name_zh = _get_tooth_name_zh(16)
    assert expected_name_zh, "未能取得 FDI 16 的 nameZh"

    context = browser.new_context()
    page = context.new_page()
    try:
        page.goto(f"{base_url}/index.html")
        page.wait_for_function("() => window.app !== undefined && window.app !== null", timeout=10000)
        page.click('.system-tab[data-system="teeth"]')

        # 點擊 FDI 16 的牙冠
        page.click('#odontogram-view .tooth[data-fdi="16"] .crown')
        page.wait_for_selector("#disease-modal[aria-hidden='false']", timeout=5000)
        page.wait_for_selector(".disease-checkbox", timeout=5000)

        checkbox = page.locator(".disease-checkbox").first
        disease_name = checkbox.get_attribute("data-name")
        assert disease_name, "未能取得疾病名稱"
        checkbox.check()

        page.click("#modal-save-btn")
        page.wait_for_timeout(500)

        records = page.evaluate("() => JSON.parse(localStorage.getItem('medicalRecords') || '[]')")
        assert len(records) == 1, f"預期有 1 筆病歷，實際為 {len(records)}"

        rec = records[0]
        assert rec.get("fdiNumber") == 16, f"預期 fdiNumber 為 16，實際為 {rec.get('fdiNumber')}"
        assert rec.get("system") == "teeth", f"預期 system 為 'teeth'，實際為 {rec.get('system')}"
        assert str(rec.get("universalNumber")) == "3", f"預期 universalNumber 為 3，實際為 {rec.get('universalNumber')}"
        assert rec.get("locationName") == expected_name_zh, (
            f"預期 locationName 為 '{expected_name_zh}'，實際為 '{rec.get('locationName')}'"
        )

        tooth_classes = page.locator('#odontogram-view .tooth[data-fdi="16"]').get_attribute("class") or ""
        assert "has-record" in tooth_classes.split(), f"FDI 16 應包含 'has-record' class，實際為: {tooth_classes}"

        container_text = page.inner_text("#record-list-container")
        assert disease_name in container_text, f"病歷清單應顯示疾病 '{disease_name}'"
    finally:
        context.close()


def test_marker_persists_after_reload(browser, base_url: str):
    """
    5. test_marker_persists_after_reload：
    接續 4 的做法存一筆後 reload → .tooth[data-fdi="16"].has-record 存在。
    """
    context = browser.new_context()
    page = context.new_page()
    try:
        page.goto(f"{base_url}/index.html")
        page.wait_for_function("() => window.app !== undefined && window.app !== null", timeout=10000)
        page.click('.system-tab[data-system="teeth"]')

        page.click('#odontogram-view .tooth[data-fdi="16"] .crown')
        page.wait_for_selector("#disease-modal[aria-hidden='false']", timeout=5000)
        page.wait_for_selector(".disease-checkbox", timeout=5000)
        page.locator(".disease-checkbox").first.check()
        page.click("#modal-save-btn")
        page.wait_for_timeout(500)

        # 重新整理
        page.reload()
        page.wait_for_function("() => window.app !== undefined && window.app !== null", timeout=10000)
        page.click('.system-tab[data-system="teeth"]')
        page.wait_for_timeout(300)

        tooth_classes = page.locator('#odontogram-view .tooth[data-fdi="16"]').get_attribute("class") or ""
        assert "has-record" in tooth_classes.split(), f"重新整理後 FDI 16 應仍有 'has-record' class，實際為: {tooth_classes}"
    finally:
        context.close()


def test_legacy_record_marker(browser, base_url: str):
    """
    6. test_legacy_record_marker：
    用 add_init_script（sessionStorage 旗標）預先放一筆沒有 system 欄位、fdiNumber: 36、
    有 position: {x: 120, y: 300} 的舊記錄 → 載入後 .tooth[data-fdi="36"] 有 has-record，data-record-count="1"。
    """
    legacy_record = [
        {
            "id": "legacy-tooth-36",
            "fdiNumber": 36,
            "position": {"x": 120, "y": 300},
            "locationName": "左下第一臼齒",
            "diseases": [{"id": "k02", "name": "齲齒"}],
            "createdAt": "2025-01-01T00:00:00.000Z"
        }
    ]
    context = browser.new_context()
    page = context.new_page()
    page.add_init_script(f"""
        if (!sessionStorage.getItem('test_legacy_init')) {{
            sessionStorage.setItem('test_legacy_init', 'true');
            localStorage.setItem('medicalRecords', JSON.stringify({json.dumps(legacy_record)}));
        }}
    """)
    try:
        page.goto(f"{base_url}/index.html")
        page.wait_for_function("() => window.app !== undefined && window.app !== null", timeout=10000)
        page.click('.system-tab[data-system="teeth"]')
        page.wait_for_timeout(300)

        tooth_loc = page.locator('#odontogram-view .tooth[data-fdi="36"]')
        tooth_classes = tooth_loc.get_attribute("class") or ""
        assert "has-record" in tooth_classes.split(), f"舊病歷 FDI 36 應有 'has-record' class，實際為: {tooth_classes}"

        count_attr = tooth_loc.get_attribute("data-record-count")
        assert count_attr == "1", f"舊病歷 FDI 36 的 data-record-count 應為 '1'，實際為 '{count_attr}'"
    finally:
        context.close()


def test_keyboard_opens_modal(browser, base_url: str):
    """
    7. test_keyboard_opens_modal：
    page.focus('.tooth[data-fdi="21"]') → page.keyboard.press('Enter') → 模態開啟且包含 21。
    """
    context = browser.new_context()
    page = context.new_page()
    try:
        page.goto(f"{base_url}/index.html")
        page.wait_for_function("() => window.app !== undefined && window.app !== null", timeout=10000)
        page.click('.system-tab[data-system="teeth"]')
        page.wait_for_timeout(300)

        page.focus('#odontogram-view .tooth[data-fdi="21"]')
        page.keyboard.press("Enter")
        page.wait_for_selector("#disease-modal[aria-hidden='false']", timeout=3000)

        location_text = page.inner_text("#modal-location")
        assert "21" in location_text, f"鍵盤 Enter 開啟模態後，#modal-location 應包含 '21'，實際為 '{location_text}'"
    finally:
        context.close()


def test_reference_image_toggle(browser, base_url: str):
    """
    8. test_reference_image_toggle：
    按 #reference-image-toggle → #image-canvas 可見、#odontogram-view 隱藏
    → 點擊 canvas 中央 → 斷言模態沒有開啟 → 再按一次切回 → #odontogram-view 可見。
    """
    context = browser.new_context()
    page = context.new_page()
    try:
        page.goto(f"{base_url}/index.html")
        page.wait_for_function("() => window.app !== undefined && window.app !== null", timeout=10000)
        page.click('.system-tab[data-system="teeth"]')
        page.wait_for_timeout(300)

        toggle_btn = page.locator("#reference-image-toggle")
        assert toggle_btn.is_visible(), "牙齒系統下 #reference-image-toggle 應可見"
        toggle_btn.click()

        canvas = page.locator("#image-canvas")
        odontogram = page.locator("#odontogram-view")
        assert canvas.is_visible(), "切換參考圖後 #image-canvas 應可見"
        assert not odontogram.is_visible(), "切換參考圖後 #odontogram-view 應隱藏"

        box = canvas.bounding_box()
        assert box, "未能取得 #image-canvas 尺寸"
        page.mouse.click(box["x"] + box["width"] / 2, box["y"] + box["height"] / 2)
        page.wait_for_timeout(500)

        modal_visible = page.locator("#disease-modal[aria-hidden='false']").is_visible()
        assert not modal_visible, "參考圖模式下點擊 canvas 不應開啟疾病模態"

        toggle_btn.click()
        assert odontogram.is_visible(), "切回後 #odontogram-view 應可見"
        assert not canvas.is_visible(), "切回後 #image-canvas 應隱藏"
    finally:
        context.close()


def test_other_systems_hide_odontogram(browser, base_url: str):
    """
    9. test_other_systems_hide_odontogram：
    切到眼睛系統 → #odontogram-view 隱藏、#eye-diagram-view 可見、#reference-image-toggle 可見。
    """
    context = browser.new_context()
    page = context.new_page()
    try:
        page.goto(f"{base_url}/index.html")
        page.wait_for_function("() => window.app !== undefined && window.app !== null", timeout=10000)

        page.click('.system-tab[data-system="eye"]')
        page.wait_for_function("() => window.app && window.app.currentSystemId === 'eye'", timeout=5000)
        page.wait_for_timeout(300)

        odontogram = page.locator("#odontogram-view")
        assert not odontogram.is_visible(), "眼睛系統下 #odontogram-view 應隱藏"

        assert page.locator("#eye-diagram-view").is_visible(), "眼睛系統下 #eye-diagram-view 應可見"

        # 確認 #reference-image-toggle 可見
        toggle_btn = page.locator("#reference-image-toggle")
        assert toggle_btn.is_visible(), "眼睛系統下 #reference-image-toggle 應可見"
    finally:
        context.close()


TESTS = [
    test_teeth_view_is_svg,
    test_primary_view,
    test_every_tooth_opens_correct_modal,
    test_save_via_odontogram,
    test_marker_persists_after_reload,
    test_legacy_record_marker,
    test_keyboard_opens_modal,
    test_reference_image_toggle,
    test_other_systems_hide_odontogram,
]
