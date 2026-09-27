"""
XSS 安全性測試
驗證儲存型 XSS（病歷資料）與 DOM 型 XSS（通知訊息）之防禦機制
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

XSS_PAYLOAD = '<img src=x onerror="window.__xss=(window.__xss||0)+1">'


def test_stored_xss_records(browser, base_url: str):
    """
    驗證儲存型 XSS：在 localStorage 中寫入包含 XSS payload 的病歷資料，
    依序切換 teeth / eye / body 系統並開啟統計面板搜尋，
    斷言 window.__xss 保持 undefined，且 payload 以跳脫後的字面純文字顯示。
    """
    context = browser.new_context()

    record_id = "rec-xss-test"
    teeth_eye_record = {
        "recordId": record_id,
        "patientId": XSS_PAYLOAD,
        "createdAt": "2026-09-27T08:00:00.000Z",
        "notes": XSS_PAYLOAD,
        "anatomicalSystems": [
            {
                "systemId": "teeth",
                "annotations": [
                    {
                        "annotationId": "anno-teeth-xss",
                        "system": "teeth",
                        "locationName": XSS_PAYLOAD,
                        "structureName": XSS_PAYLOAD,
                        "fdiNumber": "11",
                        "diseases": [
                            {"id": "d1", "name": XSS_PAYLOAD}
                        ],
                        "treatmentNotes": XSS_PAYLOAD,
                        "notes": XSS_PAYLOAD,
                        "description": XSS_PAYLOAD,
                        "createdAt": "2026-09-27T08:00:00.000Z"
                    }
                ]
            },
            {
                "systemId": "eye",
                "annotations": [
                    {
                        "annotationId": "anno-eye-xss",
                        "system": "eye",
                        "locationName": XSS_PAYLOAD,
                        "structureName": XSS_PAYLOAD,
                        "structureId": "left-eye",
                        "diseases": [
                            {"id": "d2", "name": XSS_PAYLOAD}
                        ],
                        "treatmentNotes": XSS_PAYLOAD,
                        "notes": XSS_PAYLOAD,
                        "description": XSS_PAYLOAD,
                        "createdAt": "2026-09-27T08:00:00.000Z"
                    }
                ]
            }
        ]
    }

    body_records = [
        {
            "annotationId": "anno-body-xss",
            "system": "body",
            "bodyPart": "head",
            "side": "front",
            "nameZh": XSS_PAYLOAD,
            "nameEn": XSS_PAYLOAD,
            "diseases": [
                {"name": XSS_PAYLOAD, "icd10": "R51"}
            ],
            "treatmentNotes": XSS_PAYLOAD,
            "createdAt": "2026-09-27T08:00:00.000Z"
        }
    ]

    init_script = f"""
    localStorage.setItem('anatomy-record-ids', JSON.stringify({json.dumps([record_id])}));
    localStorage.setItem('anatomy-record-{record_id}', JSON.stringify({json.dumps(teeth_eye_record)}));
    localStorage.setItem('medicalRecords', JSON.stringify({json.dumps(body_records)}));
    """
    context.add_init_script(init_script)

    page = context.new_page()
    try:
        page.goto(f"{base_url}/index.html")
        page.wait_for_function("() => window.app !== undefined && window.app !== null", timeout=10000)

        # 1. 牙齒系統（預設），設定當前病歷並更新病歷列表
        page.evaluate(f"() => {{ if (window.app && window.app.recordManager) {{ window.app.recordManager.currentRecordId = '{record_id}'; window.app.recordManager.currentRecord = null; }} }}")
        page.evaluate("() => { if (window.app.updateRecordList) window.app.updateRecordList('teeth'); }")
        page.wait_for_timeout(300)

        # 2. 切換至眼睛系統
        page.click('.system-tab[data-system="eye"]')
        page.wait_for_function("() => window.app && window.app.currentSystemId === 'eye'", timeout=5000)
        page.wait_for_function("() => Boolean(window.app && window.app.annotator && window.app.annotator.imageData && window.app.annotator.imageData.naturalWidth > 0)", timeout=5000)
        page.evaluate("() => { if (window.app.updateRecordList) window.app.updateRecordList('eye'); }")
        page.wait_for_timeout(300)

        # 3. 切換至身體系統並觸發病歷渲染
        page.click('.system-tab[data-system="body"]')
        page.wait_for_function("() => window.app && window.app.currentSystemId === 'body'", timeout=5000)
        page.wait_for_function("() => Boolean(window.app && window.app.annotator && window.app.annotator.imageData && window.app.annotator.imageData.naturalWidth > 0)", timeout=5000)
        page.evaluate("() => { if (window.app.loadAndDisplayRecords) window.app.loadAndDisplayRecords(); }")
        page.wait_for_timeout(300)

        # 4. 打開統計分析面板並搜尋
        page.click('.record-tab[data-tab="statistics"]')
        page.wait_for_selector("#search-input", timeout=5000)
        page.fill("#search-input", "img")
        page.click("#search-btn")
        page.wait_for_timeout(300)

        # 斷言 XSS 未被執行
        xss_val = page.evaluate("() => window.__xss")
        assert xss_val is None, f"偵測到儲存型 XSS 腳本被執行！window.__xss = {xss_val}"

        # 斷言頁面以純文字方式顯示跳脫後的字串（非被直接執行或剝除）
        body_text = page.inner_text("body")
        assert "<img src=x" in body_text, "病歷資料應以跳脫後的純文字顯示 '<img src=x'，但未在頁面中找到"
    finally:
        context.close()


def test_notification_xss(browser, base_url: str):
    """
    驗證通知訊息 XSS：呼叫 showNotification(payload)，
    斷言 window.__xss 保持 undefined，且訊息未執行惡意腳本。
    """
    context = browser.new_context()
    page = context.new_page()
    try:
        page.goto(f"{base_url}/index.html")
        page.wait_for_function("() => window.app !== undefined && window.app !== null", timeout=10000)

        page.evaluate("(p) => showNotification(p, 'info')", XSS_PAYLOAD)
        page.wait_for_timeout(500)

        xss_val = page.evaluate("() => window.__xss")
        assert xss_val is None, f"showNotification 觸發了 XSS 腳本執行！window.__xss = {xss_val}"
    finally:
        context.close()


TESTS = [
    test_stored_xss_records,
    test_notification_xss,
]
