"""
Phase 9 SVG 視口縮放與平移測試
驗證通用 SVG 縮放、平移與局部放大行為：
- 11. test_zoom_changes_viewbox：在牙齒、眼睛、身體三個系統按放大 → viewBox 寬度變小；按重設 → 恢復原值
- 12. test_face_target_size_after_zoom：身體系統放大到最大或聚焦臉部後 → head-eye-r 的尺寸寬高均 ≥ 24px
- 13. test_drag_pan_does_not_click：放大後在 SVG 上拖曳 60px → 模態沒有開啟、viewBox x 或 y 改變
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


def _parse_viewbox(vb_str):
    if not vb_str:
        return None
    parts = [float(p) for p in vb_str.strip().split()]
    if len(parts) == 4:
        return {"x": parts[0], "y": parts[1], "w": parts[2], "h": parts[3]}
    return None


def test_zoom_changes_viewbox(browser, base_url: str):
    """
    11. test_zoom_changes_viewbox：
    在牙齒、眼睛、身體三個系統各按一次放大 → SVG 的 viewBox 寬度變小；按重設 → 恢復原值。
    """
    context = browser.new_context()
    page = context.new_page()
    try:
        page.goto(f"{base_url}/index.html")
        page.wait_for_function("() => window.app !== undefined && window.app !== null", timeout=10000)

        systems = [
            ("teeth", "#odontogram-view svg"),
            ("eye", "#eye-diagram-view svg"),
            ("body", "#body-map-view svg"),
        ]

        for sys_id, svg_selector in systems:
            page.click(f'.system-tab[data-system="{sys_id}"]')
            page.wait_for_function(f"() => window.app.currentSystemId === '{sys_id}'", timeout=5000)
            page.wait_for_timeout(300)

            svg_loc = page.locator(svg_selector)
            assert svg_loc.is_visible(), f"{sys_id} 系統的 SVG ({svg_selector}) 應可見"

            vb_init_str = svg_loc.get_attribute("viewBox")
            vb_init = _parse_viewbox(vb_init_str)
            assert vb_init, f"{sys_id} 系統未能解析初始 viewBox: '{vb_init_str}'"

            # 點擊放大按鈕
            page.click("#zoom-in-btn")
            page.wait_for_timeout(200)

            vb_zoomed_str = svg_loc.get_attribute("viewBox")
            vb_zoomed = _parse_viewbox(vb_zoomed_str)
            assert vb_zoomed, f"{sys_id} 系統未能解析放大後 viewBox: '{vb_zoomed_str}'"
            assert vb_zoomed["w"] < vb_init["w"], (
                f"{sys_id} 放大後 viewBox 寬度應小於初始值: 初始 {vb_init['w']} vs 放大 {vb_zoomed['w']}"
            )

            # 點擊重設按鈕
            page.click("#zoom-reset-btn")
            page.wait_for_timeout(200)

            vb_reset_str = svg_loc.get_attribute("viewBox")
            vb_reset = _parse_viewbox(vb_reset_str)
            assert vb_reset, f"{sys_id} 系統未能解析重設後 viewBox: '{vb_reset_str}'"
            assert abs(vb_reset["w"] - vb_init["w"]) < 1e-2, (
                f"{sys_id} 重設後 viewBox 寬度應恢復原值: 初始 {vb_init['w']} vs 重設 {vb_reset['w']}"
            )
    finally:
        context.close()


def test_face_target_size_after_zoom(browser, base_url: str):
    """
    12. test_face_target_size_after_zoom：
    身體系統放大到最大 → head-eye-r 的 getBoundingClientRect() 寬、高都 ≥ 24px
    （先把 viewBox 平移到臉部：用拖曳或提供的 API）。
    """
    context = browser.new_context()
    page = context.new_page()
    try:
        page.goto(f"{base_url}/index.html")
        page.wait_for_function("() => window.app !== undefined && window.app !== null", timeout=10000)
        page.click('.system-tab[data-system="body"]')
        page.wait_for_function("() => window.app.currentSystemId === 'body'", timeout=5000)
        page.wait_for_timeout(300)

        # 嘗試點擊放大臉部按鈕或呼叫 focusOn API
        focus_btn = page.locator("#focus-face-btn")
        if focus_btn.is_visible():
            focus_btn.click()
        else:
            page.evaluate("""() => {
                if (window.app && window.app.svgViewport) {
                    window.app.svgViewport.focusOn('head-eye-r');
                } else {
                    for (let i = 0; i < 5; i++) {
                        document.getElementById('zoom-in-btn')?.click();
                    }
                }
            }""")
        page.wait_for_timeout(300)

        eye_loc = page.locator('#body-map-view .region[data-region="head-eye-r"][data-view="front"]')
        rect = eye_loc.evaluate("el => el.getBoundingClientRect()")

        assert rect["width"] >= 24, f"放大後 head-eye-r 寬度應 >= 24px，實際為 {rect['width']}px"
        assert rect["height"] >= 24, f"放大後 head-eye-r 高度應 >= 24px，實際為 {rect['height']}px"
    finally:
        context.close()


def test_drag_pan_does_not_click(browser, base_url: str):
    """
    13. test_drag_pan_does_not_click：
    放大後在 SVG 上拖曳 60px → 模態沒有開啟、viewBox 的 x 或 y 改變。
    """
    context = browser.new_context()
    page = context.new_page()
    try:
        page.goto(f"{base_url}/index.html")
        page.wait_for_function("() => window.app !== undefined && window.app !== null", timeout=10000)
        page.click('.system-tab[data-system="teeth"]')
        page.wait_for_timeout(300)

        # 放大
        page.click("#zoom-in-btn")
        page.wait_for_timeout(200)

        svg = page.locator("#odontogram-view svg")
        box = svg.bounding_box()
        assert box, "未能取得 SVG 尺寸"

        vb_before_str = svg.get_attribute("viewBox")
        vb_before = _parse_viewbox(vb_before_str)

        start_x = box["x"] + box["width"] / 2
        start_y = box["y"] + box["height"] / 2

        # 拖曳 60px
        page.mouse.move(start_x, start_y)
        page.mouse.down()
        page.mouse.move(start_x + 60, start_y, steps=5)
        page.mouse.up()
        page.wait_for_timeout(300)

        # 模態不應開啟
        modal_visible = page.locator("#disease-modal[aria-hidden='false']").is_visible()
        assert not modal_visible, "拖曳後不應誤觸開啟疾病模態視窗"

        vb_after_str = svg.get_attribute("viewBox")
        vb_after = _parse_viewbox(vb_after_str)

        assert vb_before and vb_after, "未能解析拖曳前後 viewBox"
        assert (vb_after["x"] != vb_before["x"]) or (vb_after["y"] != vb_before["y"]), (
            f"拖曳後 viewBox x 或 y 應改變: 前 ({vb_before['x']}, {vb_before['y']}) vs 後 ({vb_after['x']}, {vb_after['y']})"
        )
    finally:
        context.close()


TESTS = [
    test_zoom_changes_viewbox,
    test_face_target_size_after_zoom,
    test_drag_pan_does_not_click,
]
