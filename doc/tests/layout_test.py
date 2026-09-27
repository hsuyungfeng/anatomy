"""
Phase 10 版面與顯示測試 (Layout & Display Tests)
驗證 Phase 10 的版面與顯示修正：
1. test_toolbar_fully_visible：在 4 種螢幕大小 (1366x768, 1280x720, 1200x800, 390x844)、3 個系統下，工具列上的每個按鈕都完整可見且可點
2. test_help_text_visible_and_updated：1366x768 下 .image-help__text 完整可見，中文/英文文案正確更新
3. test_diagram_not_clipped：4 種視窗大小下，結構圖 SVG 完整落在 .image-section 內未被裁切
"""

import os
from pathlib import Path

# 確保在 snap 環境下能找到相依函式庫
_SNAP_LIB = "/home/amd/snap/antigravity-cli/common/local/usr/lib/x86_64-linux-gnu"
if os.path.isdir(_SNAP_LIB):
    current_ld = os.environ.get("LD_LIBRARY_PATH", "")
    if _SNAP_LIB not in current_ld.split(":"):
        os.environ["LD_LIBRARY_PATH"] = f"{_SNAP_LIB}:{current_ld}" if current_ld else _SNAP_LIB

VIEWPORTS = [
    {"name": "1366x768", "width": 1366, "height": 768},
    {"name": "1280x720", "width": 1280, "height": 720},
    {"name": "1200x800", "width": 1200, "height": 800},
    {"name": "390x844", "width": 390, "height": 844},
]

SYSTEMS = ["teeth", "eye", "body"]


def test_toolbar_fully_visible(browser, base_url: str):
    """
    1. test_toolbar_fully_visible：
    視窗 1366×768、1280×720、1200×800、390×844，三個系統逐一切換：
    .image-toolbar 內每個可見的 button，中心點用 document.elementFromPoint 取得的元素必須是該按鈕或其子孫。
    眼睛系統要包含 #eye-side-toggle 的兩個按鈕；身體系統包含 #body-sex-toggle 與 #focus-face-btn。
    必要時先 scrollIntoView，但不得依賴捲動 .image-section 內部。
    """
    for vp in VIEWPORTS:
        context = browser.new_context(viewport={"width": vp["width"], "height": vp["height"]})
        page = context.new_page()
        try:
            page.goto(f"{base_url}/index.html")
            page.wait_for_function("() => window.app !== undefined && window.app !== null", timeout=10000)

            for sys in SYSTEMS:
                page.click(f'.system-tab[data-system="{sys}"]')
                page.wait_for_timeout(300)

                # 確保眼睛或身體特定按鈕出現
                if sys == "eye":
                    page.wait_for_selector("#eye-side-toggle:not([hidden])", timeout=3000)
                elif sys == "body":
                    page.wait_for_selector("#body-sex-toggle:not([hidden])", timeout=3000)
                    page.wait_for_selector("#focus-face-btn:not([hidden])", timeout=3000)

                res = page.evaluate("""() => {
                    const section = document.querySelector('.image-section');
                    if (section) {
                        section.scrollTop = 0;
                        section.scrollLeft = 0;
                    }

                    const toolbar = document.querySelector('.image-toolbar');
                    if (!toolbar) return { ok: false, message: '找不到 .image-toolbar' };

                    // 找出 toolbar 中所有應可見的按鈕
                    const buttons = Array.from(toolbar.querySelectorAll('button')).filter(btn => {
                        if (btn.hidden) return false;
                        if (btn.offsetParent === null) return false;
                        const style = window.getComputedStyle(btn);
                        if (style.display === 'none' || style.visibility === 'hidden') return false;
                        let parent = btn.parentElement;
                        while (parent && parent !== toolbar) {
                            if (parent.hidden || window.getComputedStyle(parent).display === 'none') return false;
                            parent = parent.parentElement;
                        }
                        return true;
                    });

                    if (buttons.length === 0) {
                        return { ok: false, message: '未找到任何可見按鈕' };
                    }

                    for (const btn of buttons) {
                        btn.scrollIntoView({ block: 'nearest', inline: 'nearest' });

                        // 驗證 .image-section 沒有被內部捲動
                        if (section && (section.scrollTop !== 0 || section.scrollLeft !== 0)) {
                            return {
                                ok: false,
                                message: `按鈕 ${btn.id || btn.textContent.trim()} 依賴了 .image-section 內部捲動 (scrollTop=${section.scrollTop})`
                            };
                        }

                        const rect = btn.getBoundingClientRect();
                        const cx = Math.floor(rect.left + rect.width / 2);
                        const cy = Math.floor(rect.top + rect.height / 2);

                        const hit = document.elementFromPoint(cx, cy);
                        const isHit = hit && (hit === btn || btn.contains(hit));
                        if (!isHit) {
                            return {
                                ok: false,
                                message: `按鈕 ${btn.id || btn.className || btn.textContent.trim()} 中心點 (${cx}, ${cy}) 被遮擋或超出，命中元素: ${hit ? (hit.tagName + '.' + hit.className) : 'null'}`
                            };
                        }
                    }

                    return { ok: true, count: buttons.length };
                }""")

                assert res["ok"], f"視窗 {vp['name']} 系統 {sys} 工具列按鈕檢測失敗: {res.get('message')}"
        finally:
            context.close()


def test_help_text_visible_and_updated(browser, base_url: str):
    """
    2. test_help_text_visible_and_updated：
    1366×768 下 .image-help__text 完整可見，中文文案等於新文案；切英文後等於英文文案。
    新文案：
    中文：點選圖上的結構以新增病歷；可用縮放按鈕或滾輪放大，拖曳平移
    英文：Click a structure on the diagram to add a record. Zoom with the buttons or wheel, drag to pan.
    """
    context = browser.new_context(viewport={"width": 1366, "height": 768})
    page = context.new_page()
    try:
        page.goto(f"{base_url}/index.html")
        page.wait_for_function("() => window.app !== undefined && window.app !== null", timeout=10000)
        page.wait_for_selector(".image-help__text", timeout=3000)

        # 檢測可見性
        res = page.evaluate("""() => {
            const section = document.querySelector('.image-section');
            if (section) {
                section.scrollTop = 0;
                section.scrollLeft = 0;
            }
            const el = document.querySelector('.image-help__text');
            if (!el) return { ok: false, message: '找不到 .image-help__text' };
            const rect = el.getBoundingClientRect();
            const cx = Math.floor(rect.left + rect.width / 2);
            const cy = Math.floor(rect.top + rect.height / 2);
            const hit = document.elementFromPoint(cx, cy);
            const isHit = hit && (hit === el || el.contains(hit));
            return { ok: isHit, text: el.textContent.trim() };
        }""")
        assert res["ok"], f"說明文字 .image-help__text 被遮擋或裁切: {res}"

        expected_zh = "點選圖上的結構以新增病歷；可用縮放按鈕或滾輪放大，拖曳平移"
        assert expected_zh in res["text"], f"中文文案應包含 '{expected_zh}'，實際為: '{res['text']}'"

        # 切換英文
        page.click('.language-btn[data-lang="en"]')
        page.wait_for_timeout(200)

        text_en = page.inner_text(".image-help__text").strip()
        expected_en = "Click a structure on the diagram to add a record. Zoom with the buttons or wheel, drag to pan."
        assert expected_en in text_en, f"英文文案應包含 '{expected_en}'，實際為: '{text_en}'"
    finally:
        context.close()


def test_diagram_not_clipped(browser, base_url: str):
    """
    3. test_diagram_not_clipped：
    視窗 1366×768、1280×720、1200×800、390×844，目前系統的 SVG 的 getBoundingClientRect() 完全落在 .image-section 內。
    """
    for vp in VIEWPORTS:
        context = browser.new_context(viewport={"width": vp["width"], "height": vp["height"]})
        page = context.new_page()
        try:
            page.goto(f"{base_url}/index.html")
            page.wait_for_function("() => window.app !== undefined && window.app !== null", timeout=10000)

            for sys in SYSTEMS:
                page.click(f'.system-tab[data-system="{sys}"]')
                page.wait_for_timeout(300)

                svg_sel = (
                    "#odontogram-view svg" if sys == "teeth" else
                    "#eye-diagram-view svg" if sys == "eye" else
                    "#body-map-view svg"
                )
                page.wait_for_selector(svg_sel, timeout=3000)

                res = page.evaluate(f"""() => {{
                    const section = document.querySelector('.image-section');
                    const svg = document.querySelector('{svg_sel}');
                    if (!section || !svg) return {{ ok: false, message: '找不到元素' }};

                    const secRect = section.getBoundingClientRect();
                    const svgRect = svg.getBoundingClientRect();

                    const clippedTop = svgRect.top < secRect.top - 1;
                    const clippedBottom = svgRect.bottom > secRect.bottom + 1;
                    const clippedLeft = svgRect.left < secRect.left - 1;
                    const clippedRight = svgRect.right > secRect.right + 1;

                    if (clippedTop || clippedBottom || clippedLeft || clippedRight) {{
                        return {{
                            ok: false,
                            message: `SVG 超出 .image-section 邊界: SVG [${{svgRect.top.toFixed(1)}}, ${{svgRect.bottom.toFixed(1)}}, ${{svgRect.left.toFixed(1)}}, ${{svgRect.right.toFixed(1)}}] vs Section [${{secRect.top.toFixed(1)}}, ${{secRect.bottom.toFixed(1)}}, ${{secRect.left.toFixed(1)}}, ${{secRect.right.toFixed(1)}}]`
                        }};
                    }}
                    return {{ ok: true }};
                }}""")

                assert res["ok"], f"視窗 {vp['name']} 系統 {sys} 結構圖超出 .image-section: {res.get('message')}"
        finally:
            context.close()


TESTS = [
    test_toolbar_fully_visible,
    test_help_text_visible_and_updated,
    test_diagram_not_clipped,
]
