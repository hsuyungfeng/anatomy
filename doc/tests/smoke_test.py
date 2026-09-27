"""
Phase 4 冒煙測試
涵蓋頁面載入、解剖系統切換、病歷渲染與主題切換
"""

import json
import os
import sys

# 確保在 snap 環境下能找到相依函式庫
_SNAP_LIB = "/home/amd/snap/antigravity-cli/common/local/usr/lib/x86_64-linux-gnu"
if os.path.isdir(_SNAP_LIB):
    current_ld = os.environ.get("LD_LIBRARY_PATH", "")
    if _SNAP_LIB not in current_ld.split(":"):
        os.environ["LD_LIBRARY_PATH"] = f"{_SNAP_LIB}:{current_ld}" if current_ld else _SNAP_LIB


def test_page_loads_without_errors(browser, base_url: str):
    """
    開啟 index.html，收集 pageerror 事件與 console type=error 的訊息，
    等待 window.app 存在後斷言沒有 pageerror（過濾掉網路/CDN 載入錯誤）。
    """
    context = browser.new_context()
    page = context.new_page()

    page_errors = []
    console_errors = []

    page.on("pageerror", lambda err: page_errors.append(str(err)))
    page.on("console", lambda msg: console_errors.append(msg.text) if msg.type == "error" else None)

    try:
        page.goto(f"{base_url}/index.html")
        page.wait_for_function("() => window.app !== undefined && window.app !== null", timeout=10000)

        # 過濾掉 CDN / 網路離線錯誤
        ignored_patterns = [
            "Failed to load resource",
            "ERR_NAME_NOT_RESOLVED",
            "ERR_CONNECTION_REFUSED",
            "net::ERR_",
            "cdn.jsdelivr.net",
            "cdnjs.cloudflare.com",
            "tesseract",
            "chart.js",
        ]

        real_page_errors = [
            err for err in page_errors
            if not any(pattern in err for pattern in ignored_patterns)
        ]
        real_console_errors = [
            err for err in console_errors
            if not any(pattern in err for pattern in ignored_patterns)
        ]

        assert len(real_page_errors) == 0, f"頁面發生未預期的 pageerror: {real_page_errors}"
        assert len(real_console_errors) == 0, f"頁面發生未預期的 console error: {real_console_errors}"
    finally:
        context.close()


def test_switch_systems(browser, base_url: str):
    """
    依序切換到 teeth / eye / body 系統，
    每次切換後斷言 window.app.currentSystemId 等於預期值，
    且解剖圖已載入（naturalWidth > 0）。
    """
    context = browser.new_context()
    page = context.new_page()

    try:
        page.goto(f"{base_url}/index.html")
        page.wait_for_function("() => window.app !== undefined && window.app !== null", timeout=10000)

        systems = ["teeth", "eye", "body"]
        for sys_id in systems:
            tab_selector = f'.system-tab[data-system="{sys_id}"]'
            page.wait_for_selector(tab_selector, timeout=5000)
            page.click(tab_selector)

            # 等待當前系統 ID 更新
            page.wait_for_function(
                f"() => window.app && window.app.currentSystemId === '{sys_id}'",
                timeout=5000,
            )

            # 等待解剖圖載入完成且 naturalWidth > 0
            page.wait_for_function(
                "() => Boolean(window.app && window.app.annotator && window.app.annotator.imageData && window.app.annotator.imageData.naturalWidth > 0)",
                timeout=5000,
            )

            current_id = page.evaluate("() => window.app.currentSystemId")
            assert current_id == sys_id, f"預期 currentSystemId 為 {sys_id}，但得到 {current_id}"

            natural_width = page.evaluate("() => window.app.annotator.imageData.naturalWidth")
            assert natural_width > 0, f"系統 {sys_id} 解剖圖 naturalWidth 應大於 0，當前為 {natural_width}"
    finally:
        context.close()


def test_records_render_from_storage(browser, base_url: str):
    """
    在頁面載入前用 context.add_init_script 寫入一筆 body 系統病歷到 localStorage['medicalRecords']，
    載入後切到 body 系統，斷言病歷清單容器內出現該疾病名稱文字。
    """
    context = browser.new_context()
    try:
        test_record = [
            {
                "annotationId": "test-body-record-001",
                "system": "body",
                "bodyPart": "head",
                "side": "front",
                "nameZh": "頭部",
                "nameEn": "Head",
                "diseases": [
                    {"name": "偏頭痛", "icd10": "G43.9"}
                ],
                "treatmentNotes": "測試療程備註說明",
                "createdAt": "2026-09-27T08:00:00.000Z",
                "updatedAt": "2026-09-27T08:00:00.000Z",
            }
        ]

        init_script = f"localStorage.setItem('medicalRecords', JSON.stringify({json.dumps(test_record)}));"
        context.add_init_script(init_script)

        page = context.new_page()
        page.goto(f"{base_url}/index.html")
        page.wait_for_function("() => window.app !== undefined && window.app !== null", timeout=10000)

        # 切換至身體系統
        page.click('.system-tab[data-system="body"]')
        page.wait_for_function("() => window.app && window.app.currentSystemId === 'body'", timeout=5000)

        # 等待列表容器更新
        page.wait_for_timeout(500)

        container_text = page.inner_text("#record-list-container")
        assert "偏頭痛" in container_text, (
            f"病歷清單容器未包含預期的疾病名稱 '偏頭痛'，當前內容: {container_text}"
        )
    finally:
        context.close()





def test_theme_toggle(browser, base_url: str):
    """
    點擊主題切換按鈕後，localStorage['theme'] 改變。
    """
    context = browser.new_context()
    page = context.new_page()

    try:
        page.goto(f"{base_url}/index.html")
        page.wait_for_function("() => window.app !== undefined && window.app !== null", timeout=10000)

        theme_before = page.evaluate("() => localStorage.getItem('theme')")

        page.wait_for_selector("#theme-toggle", timeout=5000)
        page.click("#theme-toggle")

        theme_after = page.evaluate("() => localStorage.getItem('theme')")

        assert theme_before != theme_after, (
            f"主題切換後 localStorage['theme'] 未改變（切換前: {theme_before}, 切換後: {theme_after}）"
        )
        assert theme_after in ["dark", "light"], f"主題值非預期: {theme_after}"
    finally:
        context.close()


TESTS = [
    test_page_loads_without_errors,
    test_switch_systems,
    test_records_render_from_storage,
    test_theme_toggle,
]
