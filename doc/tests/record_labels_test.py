"""
病歷清單標籤與重複名稱測試 (Record Labels & Deduplication Tests)
驗證 Phase 7 UI-01 & UI-02：
1. test_body_side_label：身體分頁清單包含「右側」，不包含「右眼」
2. test_eye_side_label：眼睛分頁清單包含「左眼」
3. test_location_name_not_repeated：牙齒分頁清單文字中「右上第一大臼齒」只出現 1 次（兩筆記錄在同一個群組）
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


INITIAL_RECORDS = [
    {
        "id": "rec-body-1",
        "system": "body",
        "bodyRegionId": "arm",
        "side": "right",
        "locationName": "右手臂",
        "operationType": "抽血",
        "description": "例行抽血檢驗",
        "createdAt": "2026-03-01T10:00:00.000Z",
    },
    {
        "id": "rec-eye-1",
        "system": "eye",
        "structureId": "cornea",
        "side": "left",
        "locationName": "角膜",
        "diseases": [{"name": "角膜炎"}],
        "createdAt": "2026-03-01T11:00:00.000Z",
    },
    {
        "id": "rec-tooth-1",
        "system": "teeth",
        "fdiNumber": 16,
        "locationName": "右上第一大臼齒",
        "diseases": [{"name": "齲齒"}],
        "createdAt": "2026-03-01T12:00:00.000Z",
    },
    {
        "id": "rec-tooth-2",
        "system": "teeth",
        "fdiNumber": 16,
        "locationName": "右上第一大臼齒",
        "diseases": [{"name": "牙髓炎"}],
        "createdAt": "2026-03-01T13:00:00.000Z",
    },
]


def _setup_page_with_records(browser, base_url: str):
    context = browser.new_context()
    page = context.new_page()
    page.add_init_script(
        f"localStorage.setItem('medicalRecords', JSON.stringify({json.dumps(INITIAL_RECORDS)}));"
    )
    page.goto(f"{base_url}/index.html")
    page.wait_for_function("() => window.app !== undefined && window.app !== null", timeout=10000)
    return context, page


def test_body_side_label(browser, base_url: str):
    """
    身體系統側別標籤測試：
    切換到身體系統，病歷清單應顯示「右側」，絕不能顯示「右眼」。
    """
    context, page = _setup_page_with_records(browser, base_url)
    try:
        # 切換到身體系統
        page.click('.system-tab[data-system="body"]')
        page.wait_for_function("() => window.app && window.app.currentSystemId === 'body'", timeout=5000)
        page.wait_for_timeout(300)

        container_text = page.inner_text("#record-list-container")
        assert "右側" in container_text, f"身體病歷清單應包含「右側」，當前文字為:\n{container_text}"
        assert "右眼" not in container_text, f"身體病歷清單不應包含「右眼」，當前文字為:\n{container_text}"
    finally:
        context.close()


def test_eye_side_label(browser, base_url: str):
    """
    眼睛系統側別標籤測試：
    切換到眼睛系統，病歷清單應顯示「左眼」。
    """
    context, page = _setup_page_with_records(browser, base_url)
    try:
        # 切換到眼睛系統
        page.click('.system-tab[data-system="eye"]')
        page.wait_for_function("() => window.app && window.app.currentSystemId === 'eye'", timeout=5000)
        page.wait_for_timeout(300)

        container_text = page.inner_text("#record-list-container")
        assert "左眼" in container_text, f"眼睛病歷清單應包含「左眼」，當前文字為:\n{container_text}"
    finally:
        context.close()


def test_location_name_not_repeated(browser, base_url: str):
    """
    位置名稱不重複測試：
    牙齒分頁清單文字中「右上第一大臼齒」只出現 1 次（在群組標題，記錄項目不再重複位置名稱）。
    """
    context, page = _setup_page_with_records(browser, base_url)
    try:
        # 預設為牙齒系統，等待清單渲染
        page.wait_for_function("() => window.app && window.app.currentSystemId === 'teeth'", timeout=5000)
        page.wait_for_timeout(300)

        container_text = page.inner_text("#record-list-container")
        count = container_text.count("右上第一大臼齒")
        assert count == 1, f"牙齒病歷清單中「右上第一大臼齒」應只出現 1 次，實際出現 {count} 次。內容:\n{container_text}"
    finally:
        context.close()


TESTS = [
    test_body_side_label,
    test_eye_side_label,
    test_location_name_not_repeated,
]
