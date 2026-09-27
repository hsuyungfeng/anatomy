"""
病歷流程端到端測試 (Records Flow E2E Tests)
驗證 Phase 5 FIX-01 ~ FIX-03：
1. 牙齒系統正常儲存並顯示病歷
2. 眼睛系統正常儲存並顯示病歷
3. 身體系統正常儲存操作並顯示記錄
4. 切換系統分頁時病歷隔離不混雜
5. 重新整理頁面後病歷仍然持久化顯示
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


def test_save_teeth_record(browser, base_url: str):
    """
    牙齒系統儲存測試：
    在牙齒系統開啟疾病模態視窗，透過 DOM 勾選疾病並點擊真正的「儲存」按鈕，
    斷言 localStorage['medicalRecords'] 增加一筆記錄，且病歷清單立刻顯示該疾病名稱。
    """
    context = browser.new_context()
    page = context.new_page()

    try:
        page.goto(f"{base_url}/index.html")
        page.wait_for_function("() => window.app !== undefined && window.app !== null", timeout=10000)

        # 點擊牙位圖上的一顆牙開啟模態
        page.click('.tooth[data-fdi="16"] .crown')
        page.wait_for_selector("#disease-modal[aria-hidden='false']", timeout=5000)
        page.wait_for_selector(".disease-checkbox", timeout=5000)

        # 透過 DOM 勾選第一個疾病
        checkbox = page.locator(".disease-checkbox").first
        disease_name = checkbox.get_attribute("data-name")
        assert disease_name, "未能取得牙齒疾病名稱"
        checkbox.check()

        # 點擊真正的儲存按鈕
        page.click("#modal-save-btn")
        page.wait_for_timeout(500)

        # 斷言 localStorage.medicalRecords 有一筆記錄
        records = page.evaluate("() => JSON.parse(localStorage.getItem('medicalRecords') || '[]')")
        assert len(records) == 1, f"預期 localStorage['medicalRecords'] 有 1 筆記錄，實際為 {len(records)}"

        # 斷言病歷清單立刻顯示該疾病名稱
        container_text = page.inner_text("#record-list-container")
        assert disease_name in container_text, (
            f"牙齒病歷清單未顯示疾病名稱 '{disease_name}'，當前內容: {container_text}"
        )
    finally:
        context.close()


def test_save_eye_record(browser, base_url: str):
    """
    眼睛系統儲存測試：
    切換到眼睛系統，點擊眼睛標籤按鈕開啟模態，透過 DOM 勾選疾病並點擊「儲存」按鈕，
    斷言 localStorage['medicalRecords'] 增加一筆記錄，且病歷清單立刻顯示該疾病名稱。
    """
    context = browser.new_context()
    page = context.new_page()

    try:
        page.goto(f"{base_url}/index.html")
        page.wait_for_function("() => window.app !== undefined && window.app !== null", timeout=10000)

        # 切換到眼睛系統
        page.click('.system-tab[data-system="eye"]')
        page.wait_for_function("() => window.app && window.app.currentSystemId === 'eye'", timeout=5000)
        page.wait_for_function(
            "() => Boolean(window.app && window.app.annotator && window.app.annotator.imageData && window.app.annotator.imageData.naturalWidth > 0)",
            timeout=5000,
        )

        # 點擊眼睛標籤按鈕開啟模態
        page.wait_for_selector(".eye-label-btn", timeout=5000)
        page.locator(".eye-label-btn").first.click()
        page.wait_for_selector("#disease-modal[aria-hidden='false']", timeout=5000)
        page.wait_for_selector(".disease-checkbox", timeout=5000)

        # 勾選疾病
        checkbox = page.locator(".disease-checkbox").first
        disease_name = checkbox.get_attribute("data-name")
        assert disease_name, "未能取得眼睛疾病名稱"
        checkbox.check()

        # 點擊儲存按鈕
        page.click("#modal-save-btn")
        page.wait_for_timeout(500)

        # 斷言 localStorage.medicalRecords 有一筆記錄
        records = page.evaluate("() => JSON.parse(localStorage.getItem('medicalRecords') || '[]')")
        assert len(records) == 1, f"預期 localStorage['medicalRecords'] 有 1 筆記錄，實際為 {len(records)}"

        # 斷言病歷清單立刻顯示該疾病名稱
        container_text = page.inner_text("#record-list-container")
        assert disease_name in container_text, (
            f"眼睛病歷清單未顯示疾病名稱 '{disease_name}'，當前內容: {container_text}"
        )
    finally:
        context.close()


def test_save_body_operation(browser, base_url: str):
    """
    身體系統儲存測試：
    切換到身體系統，開啟操作模態視窗，填寫操作類型與描述並點擊「儲存」按鈕，
    斷言 localStorage['medicalRecords'] 增加一筆記錄，且病歷清單立刻顯示該操作資訊。
    """
    context = browser.new_context()
    page = context.new_page()

    try:
        page.goto(f"{base_url}/index.html")
        page.wait_for_function("() => window.app !== undefined && window.app !== null", timeout=10000)

        # 切換到身體系統
        page.click('.system-tab[data-system="body"]')
        page.wait_for_function("() => window.app && window.app.currentSystemId === 'body'", timeout=5000)
        page.wait_for_function(
            "() => Boolean(window.app && window.app.annotator && window.app.annotator.imageData && window.app.annotator.imageData.naturalWidth > 0)",
            timeout=5000,
        )

        # 等待 bodyImageMapper 載入完成
        page.wait_for_function("() => window.app.bodyImageMapper && window.app.bodyImageMapper.isLoaded", timeout=5000)

        # 開啟身體部位（胸部區域）操作模態視窗
        page.evaluate("""() => {
            const canvas = document.getElementById('image-canvas');
            const rect = canvas.getBoundingClientRect();
            window.app.openDiseaseModal({x: rect.width / 2, y: rect.height * 0.35});
        }""")
        page.wait_for_selector("#disease-modal[aria-hidden='false']", timeout=5000)
        page.wait_for_selector(".operation-type-input", timeout=5000)

        # 選擇操作類型
        page.locator(".operation-type-input").first.check()
        op_desc = "身體手術程序測試說明"
        page.fill(".operation-description", op_desc)

        # 點擊儲存按鈕
        page.click("#modal-save-btn")
        page.wait_for_timeout(500)

        # 斷言 localStorage.medicalRecords 有一筆記錄
        records = page.evaluate("() => JSON.parse(localStorage.getItem('medicalRecords') || '[]')")
        assert len(records) == 1, f"預期 localStorage['medicalRecords'] 有 1 筆記錄，實際為 {len(records)}"

        # 斷言清單立刻顯示該操作
        container_text = page.inner_text("#record-list-container")
        assert op_desc in container_text, (
            f"身體病歷清單未顯示操作描述 '{op_desc}'，當前內容: {container_text}"
        )
    finally:
        context.close()


def test_records_isolated_per_system(browser, base_url: str):
    """
    系統間病歷隔離測試：
    預先寫入牙齒、眼睛、身體各一筆記錄，依序切換三個系統分頁，
    斷言每個分頁的清單只顯示自己系統的記錄，絕不混雜其他系統的記錄。
    """
    context = browser.new_context()

    teeth_sig = "齲齒-牙齒專用標記"
    eye_sig = "角膜炎-眼睛專用標記"
    body_sig = "胸部手術-身體專用標記"

    records = [
        {
            "annotationId": "teeth-iso-1",
            "system": "teeth",
            "locationName": "右上中門齒",
            "fdiNumber": "11",
            "universalNumber": "8",
            "diseases": [{"id": "d-t1", "name": teeth_sig}],
            "treatmentNotes": "補牙治療",
            "createdAt": "2026-09-27T08:00:00.000Z",
            "updatedAt": "2026-09-27T08:00:00.000Z",
        },
        {
            "annotationId": "eye-iso-1",
            "system": "eye",
            "locationName": "角膜",
            "structureId": "left-eye-cornea",
            "side": "left",
            "diseases": [{"id": "d-e1", "name": eye_sig}],
            "treatmentNotes": "點眼藥水",
            "createdAt": "2026-09-27T08:05:00.000Z",
            "updatedAt": "2026-09-27T08:05:00.000Z",
        },
        {
            "annotationId": "body-iso-1",
            "system": "body",
            "locationName": "胸部",
            "bodyRegionId": "chest-mid",
            "side": "mid",
            "operationType": "surgery",
            "description": body_sig,
            "notes": "手術順利",
            "createdAt": "2026-09-27T08:10:00.000Z",
            "updatedAt": "2026-09-27T08:10:00.000Z",
        },
    ]

    init_script = f"localStorage.setItem('medicalRecords', JSON.stringify({json.dumps(records)}));"
    context.add_init_script(init_script)

    page = context.new_page()
    try:
        page.goto(f"{base_url}/index.html")
        page.wait_for_function("() => window.app !== undefined && window.app !== null", timeout=10000)

        # 1. 牙齒系統（預設）
        page.wait_for_function(
            "() => Boolean(window.app && window.app.annotator && window.app.annotator.imageData && window.app.annotator.imageData.naturalWidth > 0)",
            timeout=5000,
        )
        page.wait_for_timeout(300)
        teeth_text = page.inner_text("#record-list-container")
        assert teeth_sig in teeth_text, f"牙齒系統應顯示 '{teeth_sig}'，當前: {teeth_text}"
        assert eye_sig not in teeth_text, f"牙齒系統不應顯示眼睛記錄 '{eye_sig}'"
        assert body_sig not in teeth_text, f"牙齒系統不應顯示身體記錄 '{body_sig}'"

        # 2. 切換至眼睛系統
        page.click('.system-tab[data-system="eye"]')
        page.wait_for_function("() => window.app && window.app.currentSystemId === 'eye'", timeout=5000)
        page.wait_for_function(
            "() => Boolean(window.app && window.app.annotator && window.app.annotator.imageData && window.app.annotator.imageData.naturalWidth > 0)",
            timeout=5000,
        )
        page.wait_for_timeout(300)
        eye_text = page.inner_text("#record-list-container")
        assert eye_sig in eye_text, f"眼睛系統應顯示 '{eye_sig}'，當前: {eye_text}"
        assert teeth_sig not in eye_text, f"眼睛系統不應顯示牙齒記錄 '{teeth_sig}'"
        assert body_sig not in eye_text, f"眼睛系統不應顯示身體記錄 '{body_sig}'"

        # 3. 切換至身體系統
        page.click('.system-tab[data-system="body"]')
        page.wait_for_function("() => window.app && window.app.currentSystemId === 'body'", timeout=5000)
        page.wait_for_function(
            "() => Boolean(window.app && window.app.annotator && window.app.annotator.imageData && window.app.annotator.imageData.naturalWidth > 0)",
            timeout=5000,
        )
        page.wait_for_timeout(300)
        body_text = page.inner_text("#record-list-container")
        assert body_sig in body_text, f"身體系統應顯示 '{body_sig}'，當前: {body_text}"
        assert teeth_sig not in body_text, f"身體系統不應顯示牙齒記錄 '{teeth_sig}'"
        assert eye_sig not in body_text, f"身體系統不應顯示眼睛記錄 '{eye_sig}'"

    finally:
        context.close()


def test_records_persist_after_reload(browser, base_url: str):
    """
    重新整理持久化測試：
    在牙齒系統透過 UI 儲存一筆病歷後重新整理頁面，驗證病歷仍然顯示在清單中。
    """
    context = browser.new_context()
    page = context.new_page()

    try:
        page.goto(f"{base_url}/index.html")
        page.wait_for_function("() => window.app !== undefined && window.app !== null", timeout=10000)

        # 開啟牙齒模態並勾選儲存
        page.click('.tooth[data-fdi="16"] .crown')
        page.wait_for_selector("#disease-modal[aria-hidden='false']", timeout=5000)
        page.wait_for_selector(".disease-checkbox", timeout=5000)

        checkbox = page.locator(".disease-checkbox").first
        disease_name = checkbox.get_attribute("data-name")
        checkbox.check()

        page.click("#modal-save-btn")
        page.wait_for_timeout(500)

        # 重新整理頁面
        page.reload()
        page.wait_for_function("() => window.app !== undefined && window.app !== null", timeout=10000)
        page.wait_for_function(
            "() => Boolean(window.app && window.app.annotator && window.app.annotator.imageData && window.app.annotator.imageData.naturalWidth > 0)",
            timeout=5000,
        )
        page.wait_for_timeout(300)

        # 驗證重新整理後記錄仍然顯示
        container_text = page.inner_text("#record-list-container")
        assert disease_name in container_text, (
            f"重新整理後病歷清單未顯示 '{disease_name}'，當前內容: {container_text}"
        )
    finally:
        context.close()


TESTS = [
    test_save_teeth_record,
    test_save_eye_record,
    test_save_body_operation,
    test_records_isolated_per_system,
    test_records_persist_after_reload,
]
