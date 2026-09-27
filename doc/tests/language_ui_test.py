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


VIEWS = {
    "teeth": ("#odontogram-view", '.tooth[data-fdi="16"]', "fdi"),
    "eye": ("#eye-diagram-view", '.structure[data-structure="lens"][tabindex]', "structure"),
    "body": ("#body-map-view", '.region[data-region="knee-r"][data-view="front"]', "region"),
}


def test_language_switch_keeps_zoom_and_selection(browser, base_url: str):
    """切換語言重繪結構圖時，縮放、平移與選取狀態都要保留（Phase 10-03 計畫要求）"""
    context, page = _open(browser, base_url)
    try:
        for system, (view, target, attr) in VIEWS.items():
            page.click(f'.system-tab[data-system="{system}"]')
            page.wait_for_selector(f"{view} {target}")
            page.focus(f"{view} {target}")
            page.keyboard.press("Enter")
            page.wait_for_selector('#disease-modal[aria-hidden="false"]')
            page.click("#modal-cancel-btn")
            page.click("#zoom-in-btn")
            page.click("#zoom-in-btn")
            before = page.evaluate(f"""() => ({{
                viewBox: document.querySelector('{view} svg').getAttribute('viewBox'),
                zoom: document.getElementById('zoom-level').textContent.trim(),
                selected: [...document.querySelectorAll('{view} .is-selected')].map(e => e.dataset.{attr}).sort()
            }})""")
            assert before["selected"], f"{system}：選取後應有 .is-selected"

            for lang in ["en", "zh"]:
                _switch(page, lang)
                after = page.evaluate(f"""() => ({{
                    viewBox: document.querySelector('{view} svg').getAttribute('viewBox'),
                    zoom: document.getElementById('zoom-level').textContent.trim(),
                    selected: [...document.querySelectorAll('{view} .is-selected')].map(e => e.dataset.{attr}).sort()
                }})""")
                assert after == before, f"{system} 切換到 {lang} 後狀態改變：{before} → {after}"
                assert page.locator('#disease-modal[aria-hidden="false"]').count() == 0, f"{system}：還原選取不應開啟模態"
            page.click("#zoom-reset-btn")
    finally:
        context.close()


def test_region_level_body_name_in_english(browser, base_url: str):
    """點選身體大區域（頭部）時，英文模式應顯示 body-systems.json 的英文名稱，而不是 ID"""
    context, page = _open(browser, base_url)
    try:
        _switch(page, "en")
        page.click('.system-tab[data-system="body"]')
        target = '#body-map-view .region[data-region="head"][data-view="front"]'
        page.wait_for_selector(target)
        page.focus(target)
        page.keyboard.press("Enter")
        page.wait_for_selector('#disease-modal[aria-hidden="false"]')
        # 名稱欄位（<strong>）應是英文名稱；下方另有一行刻意顯示的病歷 ID（head），不在檢查範圍
        name = page.inner_text("#modal-location strong").strip()
        assert name == "Head", f"英文模式名稱應為 Head，目前：{name!r}"
    finally:
        context.close()


def test_close_button_keeps_symbol(browser, base_url: str):
    """模態關閉按鈕是符號按鈕：切換語言只改 aria-label，不把 ✕ 換成文字"""
    context, page = _open(browser, base_url)
    try:
        for lang, label in [("en", "Close"), ("zh", "關閉")]:
            _switch(page, lang)
            symbol = page.text_content(".modal__close").strip()
            aria = page.get_attribute(".modal__close", "aria-label")
            assert symbol == "✕", f"{lang}：關閉按鈕應維持 ✕，目前：{symbol!r}"
            assert aria == label, f"{lang}：aria-label 應為 {label}，目前：{aria!r}"
    finally:
        context.close()


TESTS = [
    test_icon_buttons_keep_icons,
    test_language_switch_preserves_structure,
    test_text_only_elements_still_translate,
    test_language_switch_keeps_zoom_and_selection,
    test_region_level_body_name_in_english,
    test_close_button_keeps_symbol,
]
