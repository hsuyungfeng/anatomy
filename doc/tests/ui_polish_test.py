"""
Phase 9 介面細節與體驗優化測試 (UI Polish)
驗證 5 個介面小問題的修正：
- 14. test_teeth_subtabs_visible_on_load：載入後不點任何分頁，.teeth-tab[data-teeth-type="primary"] 可見
- 15. test_save_notification_text：用牙位圖存一筆 → 通知文字不含「信心度」且不重複打勾符號
- 16. test_zoom_buttons_work_in_svg：牙齒系統按放大 → #odontogram-view svg 的 viewBox 改變
- 17. test_dark_mode_record_cards：切深色模式、預先放一筆牙齒記錄 → 病歷卡片（.record-group）的計算背景色亮度 < 0.5
- 18. test_eye_list_no_duplicate_side：預先放一筆 structureId:'left-eye', side:'left', locationName:'左眼' → 眼睛清單群組標題中「左眼」只出現 1 次
"""

import json
import os
import re
from pathlib import Path

# 確保在 snap 環境下能找到相依函式庫
_SNAP_LIB = "/home/amd/snap/antigravity-cli/common/local/usr/lib/x86_64-linux-gnu"
if os.path.isdir(_SNAP_LIB):
    current_ld = os.environ.get("LD_LIBRARY_PATH", "")
    if _SNAP_LIB not in current_ld.split(":"):
        os.environ["LD_LIBRARY_PATH"] = f"{_SNAP_LIB}:{current_ld}" if current_ld else _SNAP_LIB


def test_teeth_subtabs_visible_on_load(browser, base_url: str):
    """
    14. test_teeth_subtabs_visible_on_load：
    載入後不點任何分頁，.teeth-tab[data-teeth-type="primary"] 可見。
    """
    context = browser.new_context()
    page = context.new_page()
    try:
        page.goto(f"{base_url}/index.html")
        page.wait_for_function("() => window.app !== undefined && window.app !== null", timeout=10000)
        page.wait_for_timeout(300)

        primary_tab = page.locator('.teeth-tab[data-teeth-type="primary"]')
        assert primary_tab.is_visible(), "首次載入預設為牙齒系統，乳齒分頁 .teeth-tab[data-teeth-type='primary'] 應直接可見"
    finally:
        context.close()


def test_save_notification_text(browser, base_url: str):
    """
    15. test_save_notification_text：
    用牙位圖存一筆 → 通知文字不含「信心度」且不重複打勾符號。
    """
    context = browser.new_context()
    page = context.new_page()
    try:
        page.goto(f"{base_url}/index.html")
        page.wait_for_function("() => window.app !== undefined && window.app !== null", timeout=10000)
        page.click('.system-tab[data-system="teeth"]')
        page.wait_for_timeout(300)

        page.click('#odontogram-view .tooth[data-fdi="16"] .crown')
        page.wait_for_selector("#disease-modal[aria-hidden='false']", timeout=3000)
        page.wait_for_selector(".disease-checkbox", timeout=3000)
        page.locator(".disease-checkbox").first.check()

        page.click("#modal-save-btn")
        page.wait_for_selector("#notification-container > div, .notification", timeout=3000)

        notif_text = page.inner_text("#notification-container > div, .notification")
        assert "信心度" not in notif_text, f"通知訊息不應包含 '信心度'，實際為: '{notif_text}'"
        assert notif_text.count("✓") <= 1, f"通知訊息不應有重複的打勾符號: '{notif_text}'"
    finally:
        context.close()


def test_zoom_buttons_work_in_svg(browser, base_url: str):
    """
    16. test_zoom_buttons_work_in_svg：
    牙齒系統按放大 → #odontogram-view svg 的 viewBox 改變。
    """
    context = browser.new_context()
    page = context.new_page()
    try:
        page.goto(f"{base_url}/index.html")
        page.wait_for_function("() => window.app !== undefined && window.app !== null", timeout=10000)
        page.click('.system-tab[data-system="teeth"]')
        page.wait_for_timeout(300)

        svg = page.locator("#odontogram-view svg")
        assert svg.is_visible(), "牙位圖 SVG 應可見"

        vb_before = svg.get_attribute("viewBox")
        assert vb_before, "未能取得初始 viewBox"

        page.click("#zoom-in-btn")
        page.wait_for_timeout(200)

        vb_after = svg.get_attribute("viewBox")
        assert vb_after, "未能取得放大後 viewBox"
        assert vb_after != vb_before, f"放大後 viewBox 應改變: 初始 '{vb_before}' vs 放大後 '{vb_after}'"

        # 確認寬度變小
        w_before = float(vb_before.strip().split()[2])
        w_after = float(vb_after.strip().split()[2])
        assert w_after < w_before, f"放大後 viewBox 寬度應變小: {w_before} -> {w_after}"
    finally:
        context.close()


def test_dark_mode_record_cards(browser, base_url: str):
    """
    17. test_dark_mode_record_cards：
    切深色模式、預先放一筆牙齒記錄 → 病歷卡片（.record-group）的計算背景色亮度 < 0.5。
    """
    seed = [
        {"annotationId": "dark-test-1", "system": "teeth", "fdiNumber": 16, "diseases": [{"name": "齲齒"}]}
    ]
    context = browser.new_context()
    page = context.new_page()
    page.add_init_script(f"""
        if (!sessionStorage.getItem('test_dark_card_init')) {{
            sessionStorage.setItem('test_dark_card_init', 'true');
            localStorage.setItem('medicalRecords', JSON.stringify({json.dumps(seed)}));
        }}
    """)
    try:
        page.goto(f"{base_url}/index.html")
        page.wait_for_function("() => window.app !== undefined && window.app !== null", timeout=10000)

        # 切到深色模式
        page.evaluate("() => window.app.setTheme('dark', true)")
        page.wait_for_timeout(300)

        group_loc = page.locator(".record-group")
        page.wait_for_selector(".record-group", timeout=3000)

        rgb_str = page.evaluate("""() => {
            const el = document.querySelector('.record-group');
            return window.getComputedStyle(el).backgroundColor;
        }""")

        # 解析 rgb / rgba
        m = re.search(r"rgba?\((\d+),\s*(\d+),\s*(\d+)", rgb_str)
        assert m, f"無法解析背景色彩: '{rgb_str}'"
        r, g, b = int(m.group(1)), int(m.group(2)), int(m.group(3))
        lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255.0

        assert lum < 0.5, f"深色模式下 .record-group 背景亮度應 < 0.5，實際為 {lum:.3f} (rgb: {r},{g},{b})"
    finally:
        context.close()


def test_eye_list_no_duplicate_side(browser, base_url: str):
    """
    18. test_eye_list_no_duplicate_side：
    預先放一筆 structureId:'left-eye', side:'left', locationName:'左眼' → 眼睛清單群組標題中「左眼」只出現 1 次。
    """
    seed = [
        {
            "annotationId": "dup-eye-1",
            "system": "eye",
            "structureId": "left-eye",
            "side": "left",
            "locationName": "左眼",
            "diseases": [{"name": "結膜炎"}],
            "createdAt": "2026-01-01T00:00:00.000Z",
        }
    ]
    context = browser.new_context()
    page = context.new_page()
    page.add_init_script(f"""
        if (!sessionStorage.getItem('test_eye_dup_init')) {{
            sessionStorage.setItem('test_eye_dup_init', 'true');
            localStorage.setItem('medicalRecords', JSON.stringify({json.dumps(seed)}));
        }}
    """)
    try:
        page.goto(f"{base_url}/index.html")
        page.wait_for_function("() => window.app !== undefined && window.app !== null", timeout=10000)
        page.click('.system-tab[data-system="eye"]')
        page.wait_for_timeout(300)

        header_loc = page.locator(".record-group__header")
        page.wait_for_selector(".record-group__header", timeout=3000)
        header_text = header_loc.inner_text()

        count = header_text.count("左眼")
        assert count == 1, f"群組標題中 '左眼' 應只出現 1 次，實際出現 {count} 次: '{header_text}'"
    finally:
        context.close()


TESTS = [
    test_teeth_subtabs_visible_on_load,
    test_save_notification_text,
    test_zoom_buttons_work_in_svg,
    test_dark_mode_record_cards,
    test_eye_list_no_duplicate_side,
]
