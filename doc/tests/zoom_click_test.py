"""
放大後滑鼠點擊測試 (Zoom + Mouse Click Tests)
使用者回報：放大縮小後點擊結構無法跳出填寫視窗。
原因：SvgViewport 在放大狀態下，pointerdown 就呼叫 setPointerCapture，
使 click 事件目標變成 <svg> 本身，結構圖模組以 closest() 找不到被點的結構。
既有縮放測試都用鍵盤選取或只測拖曳，所以沒有抓到。
1. test_mouse_click_opens_modal_when_zoomed：三個系統在 100%、放大 1 次、2 次、放大臉部後，以真實滑鼠點擊開啟正確的模態
2. test_drag_still_does_not_open_modal：放大後拖曳平移仍不會開啟模態（修正不可破壞拖曳）
"""

CASES = [
    ("teeth", '#odontogram-view .tooth[data-fdi="21"] .crown', "21"),
    ("eye", '#eye-diagram-view .structure[data-structure="lens"] ellipse', "水晶體"),
    ("body", '#body-map-view .region[data-region="chest"][data-view="front"] path', "胸"),
]


def _open(browser, base_url: str):
    context = browser.new_context(viewport={"width": 1366, "height": 768})
    page = context.new_page()
    page.goto(f"{base_url}/index.html")
    page.wait_for_function("() => window.app", timeout=10000)
    return context, page


def _click_center(page, selector: str):
    box = page.locator(selector).first.bounding_box()
    assert box, f"{selector} 不在畫面上"
    page.mouse.click(box["x"] + box["width"] / 2, box["y"] + box["height"] / 2)


def test_mouse_click_opens_modal_when_zoomed(browser, base_url: str):
    context, page = _open(browser, base_url)
    try:
        for system, selector, expected in CASES:
            page.click(f'.system-tab[data-system="{system}"]')
            page.wait_for_selector(selector)
            for label, clicks in [("100%", 0), ("放大 1 次", 1), ("放大 2 次", 1)]:
                for _ in range(clicks):
                    page.click("#zoom-in-btn")
                page.wait_for_timeout(150)
                _click_center(page, selector)
                modal = page.locator('#disease-modal[aria-hidden="false"]')
                assert modal.count() == 1, f"{system} {label}：滑鼠點擊後模態應開啟"
                location = page.inner_text("#modal-location")
                assert expected in location, f"{system} {label}：模態應顯示 {expected}，目前：{location!r}"
                page.click("#modal-cancel-btn")
                page.wait_for_timeout(150)
            page.click("#zoom-reset-btn")

        # 放大臉部後點右眼
        page.click('.system-tab[data-system="body"]')
        page.click("#focus-face-btn")
        page.wait_for_timeout(150)
        _click_center(page, '#body-map-view .region[data-region="head-eye-r"][data-view="front"] path')
        assert page.locator('#disease-modal[aria-hidden="false"]').count() == 1, "放大臉部後點右眼應開啟模態"
        assert "右眼" in page.inner_text("#modal-location")
    finally:
        context.close()


def test_drag_still_does_not_open_modal(browser, base_url: str):
    context, page = _open(browser, base_url)
    try:
        page.click('.system-tab[data-system="teeth"]')
        page.click("#zoom-in-btn")
        page.click("#zoom-in-btn")
        box = page.locator('#odontogram-view .tooth[data-fdi="21"] .crown').bounding_box()
        x, y = box["x"] + box["width"] / 2, box["y"] + box["height"] / 2
        before = page.get_attribute("#odontogram-view svg", "viewBox")
        page.mouse.move(x, y)
        page.mouse.down()
        page.mouse.move(x + 30, y + 10, steps=5)
        page.mouse.move(x + 60, y + 20, steps=5)
        page.mouse.up()
        page.wait_for_timeout(200)
        assert page.locator('#disease-modal[aria-hidden="false"]').count() == 0, "拖曳後不應開啟模態"
        assert page.get_attribute("#odontogram-view svg", "viewBox") != before, "拖曳應平移 viewBox"
    finally:
        context.close()


TESTS = [
    test_mouse_click_opens_modal_when_zoomed,
    test_drag_still_does_not_open_modal,
]
