"""
Phase 10 國際化與英文介面測試 (i18n & Translation Tests)
驗證 Phase 10 的英文介面、時間戳與語言切換：
4. test_missing_timestamp_text：缺少時間的記錄顯示「時間不明」，切英文顯示「Unknown time」
5. test_no_chinese_in_english_mode：英文模式下完整走過三個系統、模態視窗與統計分頁，不殘留中文字元
6. test_switch_back_to_chinese：切回中文後，介面文字正確恢復中文
7. test_diagrams_rerender_on_language_change：停留在眼睛系統時切換語言，結構圖方向標籤立即切換語言
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


def test_missing_timestamp_text(browser, base_url: str):
    """
    4. test_missing_timestamp_text：
    預先放一筆沒有 createdAt / timestamp 的牙齒記錄 → 清單顯示「時間不明」；
    切英文 → 「Unknown time」；絕不顯示「無效的時間戳」。
    """
    seed = [
        {
            "annotationId": "no-time-rec-1",
            "system": "teeth",
            "fdiNumber": 16,
            "locationName": "右上第一大臼齒",
            "diseases": [{"name": "齲齒"}],
            # 刻意不提供 createdAt 與 timestamp
        }
    ]

    context = browser.new_context()
    page = context.new_page()
    page.add_init_script(f"""
        if (!sessionStorage.getItem('test_no_time_init')) {{
            sessionStorage.setItem('test_no_time_init', 'true');
            localStorage.setItem('medicalRecords', JSON.stringify({json.dumps(seed)}));
        }}
    """)
    try:
        page.goto(f"{base_url}/index.html")
        page.wait_for_function("() => window.app !== undefined && window.app !== null", timeout=10000)
        page.wait_for_selector(".record-item__title", timeout=3000)

        title_zh = page.inner_text(".record-item__title")
        assert "無效的時間戳" not in title_zh, f"病歷時間不應顯示 '無效的時間戳'，實際為: '{title_zh}'"
        assert "時間不明" in title_zh, f"中文模式下缺少時間應顯示 '時間不明'，實際為: '{title_zh}'"

        # 切換為英文
        page.click('.language-btn[data-lang="en"]')
        page.wait_for_timeout(300)

        title_en = page.inner_text(".record-item__title")
        assert "無效的時間戳" not in title_en, f"英文模式病歷時間不應顯示 '無效的時間戳'，實際為: '{title_en}'"
        assert "時間不明" not in title_en, f"英文模式病歷時間不應包含中文 '時間不明'，實際為: '{title_en}'"
        assert "Unknown time" in title_en, f"英文模式下缺少時間應顯示 'Unknown time'，實際為: '{title_en}'"
    finally:
        context.close()


def _scan_visible_chinese(page, step_name: str) -> list:
    """使用 TreeWalker 掃描當前頁面所有可見文字節點中的中日韓字元 (排除 .language-btn, .record-group, 輸入框)"""
    return page.evaluate(f"""() => {{
        const chineseRegex = /[\\u4e00-\\u9fff]/;
        const walker = document.createTreeWalker(
            document.body,
            NodeFilter.SHOW_TEXT,
            {{
                acceptNode(node) {{
                    const text = node.textContent.trim();
                    if (!text) return NodeFilter.FILTER_REJECT;
                    if (!chineseRegex.test(text)) return NodeFilter.FILTER_REJECT;

                    const el = node.parentElement;
                    if (!el) return NodeFilter.FILTER_REJECT;

                    // 例外排除：.language-btn、.record-group（已存病歷內容不翻譯）、input/textarea
                    if (el.closest('.language-btn') || el.closest('.record-group') || el.closest('input') || el.closest('textarea')) {{
                        return NodeFilter.FILTER_REJECT;
                    }}

                    // 檢查可見性
                    let cur = el;
                    while (cur && cur !== document.body) {{
                        if (cur.hidden) return NodeFilter.FILTER_REJECT;
                        const style = window.getComputedStyle(cur);
                        if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') {{
                            return NodeFilter.FILTER_REJECT;
                        }}
                        if (cur.getAttribute('aria-hidden') === 'true') {{
                            return NodeFilter.FILTER_REJECT;
                        }}
                        cur = cur.parentElement;
                    }}

                    return NodeFilter.FILTER_ACCEPT;
                }}
            }}
        );

        const items = [];
        while (walker.nextNode()) {{
            const node = walker.currentNode;
            const el = node.parentElement;
            const sel = el.tagName.toLowerCase() + (el.id ? '#' + el.id : '') + (el.className ? '.' + String(el.className).trim().replace(/\\s+/g, '.') : '');
            items.push({{
                step: '{step_name}',
                text: node.textContent.trim(),
                selector: sel
            }});
        }}
        return items;
    }}""")


def test_no_chinese_in_english_mode(browser, base_url: str):
    """
    5. test_no_chinese_in_english_mode：
    切英文後，依序走過：
    牙齒（永久、乳牙）、開牙齒模態、存一筆、眼睛（OD、OS）、開眼睛模態、身體（女、男）、開身體模態、參考圖切換、統計分頁；
    每一步用 TreeWalker 掃描可見文字節點（排除 context 的例外），斷言沒有中日韓字元。
    """
    context = browser.new_context()
    page = context.new_page()
    try:
        page.goto(f"{base_url}/index.html")
        page.wait_for_function("() => window.app !== undefined && window.app !== null", timeout=10000)

        # 切換到英文模式
        page.click('.language-btn[data-lang="en"]')
        page.wait_for_timeout(300)

        all_findings = []

        # 1. 牙齒系統（永久齒）
        all_findings.extend(_scan_visible_chinese(page, "1. 牙齒永久齒畫面"))

        # 2. 牙齒系統（乳齒）
        page.click('.teeth-tab[data-teeth-type="primary"]')
        page.wait_for_timeout(300)
        all_findings.extend(_scan_visible_chinese(page, "2. 牙齒乳齒畫面"))

        # 3. 開啟牙齒疾病模態視窗
        page.locator('#odontogram-view .tooth').first.click()
        page.wait_for_selector("#disease-modal[aria-hidden='false']", timeout=3000)
        page.wait_for_timeout(200)
        all_findings.extend(_scan_visible_chinese(page, "3. 牙齒疾病模態視窗"))

        # 4. 儲存一筆病歷
        page.wait_for_selector(".disease-checkbox", timeout=3000)
        page.locator(".disease-checkbox").first.check()
        page.click("#modal-save-btn")
        page.wait_for_timeout(300)
        all_findings.extend(_scan_visible_chinese(page, "4. 儲存病歷與通知"))

        # 5. 眼睛系統（OD 右眼）
        page.click('.system-tab[data-system="eye"]')
        page.wait_for_timeout(300)
        all_findings.extend(_scan_visible_chinese(page, "5. 眼睛系統 OD"))

        # 6. 眼睛系統（OS 左眼）
        page.click('#eye-side-toggle button[data-side="left"]')
        page.wait_for_timeout(300)
        all_findings.extend(_scan_visible_chinese(page, "6. 眼睛系統 OS"))

        # 7. 開啟眼睛模態視窗
        cornea = page.locator('#eye-diagram-view .structure[data-structure="cornea"][tabindex="0"]')
        cornea.focus()
        page.keyboard.press("Enter")
        page.wait_for_selector("#disease-modal[aria-hidden='false']", timeout=3000)
        page.wait_for_timeout(200)
        all_findings.extend(_scan_visible_chinese(page, "7. 眼睛疾病模態視窗"))
        page.click("#modal-cancel-btn")
        page.wait_for_timeout(200)

        # 8. 身體系統（女性）
        page.click('.system-tab[data-system="body"]')
        page.wait_for_timeout(300)
        all_findings.extend(_scan_visible_chinese(page, "8. 身體系統女性"))

        # 9. 身體系統（男性）
        page.click('#body-sex-toggle button[data-sex="male"]')
        page.wait_for_timeout(300)
        all_findings.extend(_scan_visible_chinese(page, "9. 身體系統男性"))

        # 10. 開啟身體操作模態視窗
        page.locator('#body-map-view .region[data-region="knee-r"][data-view="front"]').click()
        page.wait_for_selector("#disease-modal[aria-hidden='false']", timeout=3000)
        page.wait_for_timeout(200)
        all_findings.extend(_scan_visible_chinese(page, "10. 身體操作模態視窗"))
        page.click("#modal-cancel-btn")
        page.wait_for_timeout(200)

        # 11. 參考圖切換
        page.click('#reference-image-toggle')
        page.wait_for_timeout(300)
        all_findings.extend(_scan_visible_chinese(page, "11. 參考圖切換檢視"))
        page.click('#reference-image-toggle')
        page.wait_for_timeout(200)

        # 12. 統計分頁
        page.click('.record-tab[data-tab="statistics"]')
        page.wait_for_timeout(300)
        all_findings.extend(_scan_visible_chinese(page, "12. 統計分析分頁"))

        if all_findings:
            err_msg = f"英文模式下仍有 {len(all_findings)} 處殘留中文文字:\n"
            for item in all_findings:
                err_msg += f"  - [{item['step']}] '{item['text']}' (元素: <{item['selector']}>)\n"
            assert False, err_msg
    finally:
        context.close()


def test_switch_back_to_chinese(browser, base_url: str):
    """
    6. test_switch_back_to_chinese：
    切到英文後切回中文 → 介面元素正確顯示中文（抽查：#reference-image-toggle、#focus-face-btn、牙位圖象限標籤、.disease-form__title）。
    """
    context = browser.new_context()
    page = context.new_page()
    try:
        page.goto(f"{base_url}/index.html")
        page.wait_for_function("() => window.app !== undefined && window.app !== null", timeout=10000)

        # 切到英文
        page.click('.language-btn[data-lang="en"]')
        page.wait_for_timeout(300)

        # 切回中文
        page.click('.language-btn[data-lang="zh"]')
        page.wait_for_timeout(300)

        # 1. #reference-image-toggle 應為中文
        ref_btn_text = page.inner_text("#reference-image-toggle")
        assert "參考圖" in ref_btn_text or "結構圖" in ref_btn_text, f"#reference-image-toggle 應顯示中文，實際為: '{ref_btn_text}'"

        # 2. 切換到身體系統檢查 #focus-face-btn
        page.click('.system-tab[data-system="body"]')
        page.wait_for_timeout(300)
        focus_btn_text = page.inner_text("#focus-face-btn")
        assert "放大臉部" in focus_btn_text, f"#focus-face-btn 應顯示中文 '放大臉部'，實際為: '{focus_btn_text}'"

        # 3. 切換到牙齒系統檢查象限標籤
        page.click('.system-tab[data-system="teeth"]')
        page.wait_for_timeout(300)
        odonto_text = page.inner_text("#odontogram-view")
        assert any(k in odonto_text for k in ["右上", "左上", "右下", "左下"]), f"牙位圖象限標籤應為中文，實際內容為: '{odonto_text[:200]}'"

        # 4. 開啟牙齒模態視窗檢查表單標題
        page.locator('#odontogram-view .tooth').first.click()
        page.wait_for_selector("#disease-modal[aria-hidden='false']", timeout=3000)
        form_title = page.inner_text(".disease-form__title")
        assert any(k in form_title for k in ["選擇疾病診斷", "診斷", "疾病"]), f"表單標題應為中文，實際為: '{form_title}'"
    finally:
        context.close()


def test_diagrams_rerender_on_language_change(browser, base_url: str):
    """
    7. test_diagrams_rerender_on_language_change：
    停在眼睛系統，切換語言後 SVG 內的方向標籤立即改變，不需要切換系統。
    """
    context = browser.new_context()
    page = context.new_page()
    try:
        page.goto(f"{base_url}/index.html")
        page.wait_for_function("() => window.app !== undefined && window.app !== null", timeout=10000)

        # 切到眼睛系統
        page.click('.system-tab[data-system="eye"]')
        page.wait_for_timeout(300)

        # 初始中文模式下，SVG 應包含中文方向標籤
        svg_text_zh = page.locator("#eye-diagram-view svg").text_content() or ""
        has_zh_labels = any(k in svg_text_zh for k in ["正面", "角膜側", "視神經側", "右眼"])
        assert has_zh_labels, f"中文模式下眼睛 SVG 應包含中文方向標籤，實際文字為: '{svg_text_zh}'"

        # 切換語言為英文（不停留在其他系統，不重載頁面）
        page.click('.language-btn[data-lang="en"]')
        page.wait_for_timeout(300)

        # SVG 內應立即更新為英文，不包含中文方向標籤
        svg_text_en = page.locator("#eye-diagram-view svg").text_content() or ""
        assert "角膜側" not in svg_text_en, f"切換為英文後眼睛 SVG 不應再有 '角膜側'，實際為: '{svg_text_en}'"
        assert "視神經側" not in svg_text_en, f"切換為英文後眼睛 SVG 不應再有 '視神經側'，實際為: '{svg_text_en}'"
        has_en_labels = any(k in svg_text_en for k in ["Front", "Cornea", "Optic Nerve", "OD"])
        assert has_en_labels, f"英文模式下眼睛 SVG 應立即更新為英文方向標籤，實際文字為: '{svg_text_en}'"
    finally:
        context.close()


TESTS = [
    test_missing_timestamp_text,
    test_no_chinese_in_english_mode,
    test_switch_back_to_chinese,
    test_diagrams_rerender_on_language_change,
]
