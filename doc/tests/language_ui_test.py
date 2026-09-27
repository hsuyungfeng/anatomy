"""
語言切換保留按鈕結構測試 (Language UI Structure Tests)
utils.js 的 updateLanguageUI 曾以 textContent 整個改寫帶 data-en 的元素，
導致純圖示按鈕（縮放）變成空白、圖示＋文字按鈕（匯出、備份…）失去圖示、系統分頁失去內層結構。
1. test_icon_buttons_keep_icons：載入後縮放按鈕與匯出按鈕仍保有圖示
2. test_language_switch_preserves_structure：切到英文再切回中文，文字正確切換且圖示與內層結構都還在
3. test_text_only_elements_still_translate：只有文字的元素（取消按鈕）仍正常切換
"""

ZOOM_BUTTONS = ["zoom-in-btn", "zoom-out-btn", "zoom-reset-btn"]


def _open(browser, base_url: str):
    context = browser.new_context()
    page = context.new_page()
    page.goto(f"{base_url}/index.html")
    page.wait_for_function("() => window.app", timeout=10000)
    return context, page


def _icon_count(page, selector: str) -> int:
    return page.evaluate(f"() => document.querySelectorAll('{selector} i').length")


def _switch(page, lang: str):
    page.click(f'.language-btn[data-lang="{lang}"]')
    page.wait_for_timeout(200)


def test_icon_buttons_keep_icons(browser, base_url: str):
    context, page = _open(browser, base_url)
    try:
        for btn in ZOOM_BUTTONS:
            assert _icon_count(page, f"#{btn}") == 1, f"#{btn} 載入後應保有圖示，目前內容：{page.inner_html(f'#{btn}')!r}"
        assert _icon_count(page, "#export-csv-btn") == 1, "#export-csv-btn 載入後應保有圖示"
        assert "匯出 CSV" in page.inner_text("#export-csv-btn")
    finally:
        context.close()


def test_language_switch_preserves_structure(browser, base_url: str):
    context, page = _open(browser, base_url)
    try:
        _switch(page, "en")
        assert "Export CSV" in page.inner_text("#export-csv-btn"), "英文模式應顯示 Export CSV"
        assert _icon_count(page, "#export-csv-btn") == 1, "英文模式下 #export-csv-btn 應保有圖示"
        label = page.inner_text('.system-tab[data-system="teeth"] .system-tab__label')
        assert label.strip() == "Teeth/Gums", f"系統分頁標籤應為 Teeth/Gums，目前：{label!r}"
        assert page.locator('.system-tab[data-system="teeth"] .system-tab__icon').count() == 1, "系統分頁圖示應保留"
        for btn in ZOOM_BUTTONS:
            assert _icon_count(page, f"#{btn}") == 1, f"英文模式下 #{btn} 應保有圖示"

        _switch(page, "zh")
        assert "匯出 CSV" in page.inner_text("#export-csv-btn"), "切回中文應顯示 匯出 CSV"
        assert _icon_count(page, "#export-csv-btn") == 1, "切回中文後 #export-csv-btn 應保有圖示"
        label = page.inner_text('.system-tab[data-system="teeth"] .system-tab__label')
        assert label.strip() == "牙齒系統", f"系統分頁標籤應為 牙齒系統，目前：{label!r}"
        for btn in ZOOM_BUTTONS:
            assert _icon_count(page, f"#{btn}") == 1, f"切回中文後 #{btn} 應保有圖示"
    finally:
        context.close()


def test_text_only_elements_still_translate(browser, base_url: str):
    context, page = _open(browser, base_url)
    try:
        _switch(page, "en")
        assert page.text_content("#modal-cancel-btn").strip() == "Cancel", "英文模式取消按鈕應為 Cancel"
        _switch(page, "zh")
        assert page.text_content("#modal-cancel-btn").strip() == "取消", "切回中文取消按鈕應為 取消"
    finally:
        context.close()


TESTS = [
    test_icon_buttons_keep_icons,
    test_language_switch_preserves_structure,
    test_text_only_elements_still_translate,
]
