"""
Phase 6 儲存整併端到端測試
驗證以 medicalRecords 為單一儲存來源後的預期行為：
- 重新整理不增加 storage key
- 解剖圖標記重新整理後持久保留
- 備份格式為 v2.0
- 還原 v2 / v1 格式皆能在病歷清單中顯示
- 清空病歷清除 medicalRecords 與清單
- 統計總數與清單一致
- 舊 key (anatomy-record-*) 自動遷移與備份
- 單次儲存不寫入 anatomy-record-* 額外 key
- 匯出 CSV 包含已儲存病歷
"""

import json
import os
import tempfile
from pathlib import Path

# 確保在 snap 環境下能找到相依函式庫
_SNAP_LIB = "/home/amd/snap/antigravity-cli/common/local/usr/lib/x86_64-linux-gnu"
if os.path.isdir(_SNAP_LIB):
    current_ld = os.environ.get("LD_LIBRARY_PATH", "")
    if _SNAP_LIB not in current_ld.split(":"):
        os.environ["LD_LIBRARY_PATH"] = f"{_SNAP_LIB}:{current_ld}" if current_ld else _SNAP_LIB


def _save_teeth_record(page, checkbox_index: int = 0) -> str:
    """輔助函式：在牙齒系統透過 DOM 勾選疾病並點擊儲存"""
    page.click('.tooth[data-fdi="16"] .crown')
    page.wait_for_selector("#disease-modal[aria-hidden='false']", timeout=5000)
    page.wait_for_selector(".disease-checkbox", timeout=5000)
    checkbox = page.locator(".disease-checkbox").nth(checkbox_index)
    disease_name = checkbox.get_attribute("data-name")
    assert disease_name, f"未能取得第 {checkbox_index} 個牙齒疾病名稱"
    checkbox.check()
    page.click("#modal-save-btn")
    page.wait_for_timeout(500)
    return disease_name


def _save_eye_record(page, checkbox_index: int = 0) -> str:
    """輔助函式：在眼睛系統透過標籤開啟模態勾選疾病並點擊儲存"""
    page.click('.system-tab[data-system="eye"]')
    page.wait_for_function("() => window.app && window.app.currentSystemId === 'eye'", timeout=5000)
    page.wait_for_selector(".eye-label-btn", timeout=5000)
    page.locator(".eye-label-btn").first.click()
    page.wait_for_selector("#disease-modal[aria-hidden='false']", timeout=5000)
    page.wait_for_selector(".disease-checkbox", timeout=5000)
    checkbox = page.locator(".disease-checkbox").nth(checkbox_index)
    disease_name = checkbox.get_attribute("data-name")
    assert disease_name, f"未能取得第 {checkbox_index} 個眼睛疾病名稱"
    checkbox.check()
    page.click("#modal-save-btn")
    page.wait_for_timeout(500)
    return disease_name


def test_no_storage_growth_on_reload(browser, base_url: str):
    """
    1. test_no_storage_growth_on_reload：
    乾淨的 context 載入頁面 3 次（reload），斷言 localStorage 的 key 數量沒有增加。
    """
    context = browser.new_context()
    page = context.new_page()
    try:
        page.goto(f"{base_url}/index.html")
        page.wait_for_function("() => window.app !== undefined", timeout=10000)
        page.wait_for_timeout(500)
        keys_1 = set(page.evaluate("() => Object.keys(localStorage)"))

        page.reload()
        page.wait_for_function("() => window.app !== undefined", timeout=10000)
        page.wait_for_timeout(500)
        keys_2 = set(page.evaluate("() => Object.keys(localStorage)"))

        page.reload()
        page.wait_for_function("() => window.app !== undefined", timeout=10000)
        page.wait_for_timeout(500)
        keys_3 = set(page.evaluate("() => Object.keys(localStorage)"))

        assert keys_1 == keys_2 == keys_3, (
            f"重新整理後 localStorage keys 數量增加或不一致:\n"
            f"第 1 次 ({len(keys_1)} 個): {keys_1}\n"
            f"第 2 次 ({len(keys_2)} 個): {keys_2}\n"
            f"第 3 次 ({len(keys_3)} 個): {keys_3}"
        )
    finally:
        context.close()


def test_markers_persist_after_reload(browser, base_url: str):
    """
    2. test_markers_persist_after_reload：
    牙齒系統存一筆 → reload → 斷言 window.app.annotator 上的標註數量 ≥ 1。
    """
    context = browser.new_context()
    page = context.new_page()
    try:
        page.goto(f"{base_url}/index.html")
        page.wait_for_function("() => window.app !== undefined", timeout=10000)

        # 存一筆牙齒記錄
        _save_teeth_record(page)

        # 重新整理頁面
        page.reload()
        page.wait_for_function("() => window.app !== undefined", timeout=10000)
        page.wait_for_function(
            "() => Boolean(window.app.annotator && window.app.annotator.isImageLoaded)",
            timeout=5000,
        )
        page.wait_for_timeout(500)

        # 斷言標註器上的標註數量 >= 1
        count = page.evaluate("() => window.app.annotator ? window.app.annotator.annotations.length : 0")
        assert count >= 1, f"重新整理後解剖圖標記消失，預期標註數 >= 1，實際為 {count}"
    finally:
        context.close()


def test_backup_contains_saved_record(browser, base_url: str):
    """
    3. test_backup_contains_saved_record：
    存一筆牙齒記錄 → 點備份按鈕 → 解析下載的 JSON →
    斷言 version === '2.0'，且 records 中有一筆 annotationId 等於 localStorage 中那筆。
    """
    context = browser.new_context()
    page = context.new_page()
    try:
        page.goto(f"{base_url}/index.html")
        page.wait_for_function("() => window.app !== undefined", timeout=10000)

        _save_teeth_record(page)
        saved_records = page.evaluate("() => JSON.parse(localStorage.getItem('medicalRecords') || '[]')")
        assert len(saved_records) >= 1, "未在 localStorage['medicalRecords'] 找到儲存記錄"
        target_id = saved_records[0].get("annotationId")
        assert target_id, f"儲存記錄缺少 annotationId: {saved_records[0]}"

        with page.expect_download() as download_info:
            page.click("#backup-btn")
        download = download_info.value
        backup_content = json.loads(Path(download.path()).read_text(encoding="utf-8"))

        assert backup_content.get("version") == "2.0", (
            f"備份版本預期為 '2.0'，實際為 '{backup_content.get('version')}'"
        )
        records = backup_content.get("records", [])
        assert any(r.get("annotationId") == target_id for r in records), (
            f"備份 records 中未包含已儲存的 annotationId '{target_id}'，備份內容: {backup_content}"
        )
    finally:
        context.close()


def test_restore_v2_shows_in_list(browser, base_url: str):
    """
    4. test_restore_v2_shows_in_list：
    用 set_input_files 上傳一個 v2 備份檔（含牙齒一筆、身體一筆）→
    牙齒分頁清單顯示牙齒那筆，身體分頁顯示身體那筆。
    """
    context = browser.new_context()
    page = context.new_page()
    temp_path = None
    try:
        page.goto(f"{base_url}/index.html")
        page.wait_for_function("() => window.app !== undefined", timeout=10000)

        v2_data = {
            "version": "2.0",
            "createdAt": "2026-09-27T08:00:00.000Z",
            "appName": "Anatomy Medical System",
            "recordCount": 2,
            "records": [
                {
                    "annotationId": "v2-teeth-item",
                    "system": "teeth",
                    "locationName": "右上第一臼齒",
                    "fdiNumber": "16",
                    "diseases": [{"id": "caries", "name": "深層齲齒"}],
                    "createdAt": "2026-09-27T08:00:00.000Z",
                },
                {
                    "annotationId": "v2-body-item",
                    "system": "body",
                    "locationName": "頭部",
                    "bodyRegionId": "head",
                    "side": "mid",
                    "operationType": "surgery",
                    "description": "頭部微創手術治療",
                    "createdAt": "2026-09-27T08:00:00.000Z",
                },
            ],
        }

        with tempfile.NamedTemporaryFile("w", suffix=".json", delete=False, encoding="utf-8") as tf:
            json.dump(v2_data, tf, ensure_ascii=False)
            temp_path = tf.name

        page.on("dialog", lambda d: d.accept())
        page.set_input_files("#restore-file", temp_path)
        page.wait_for_timeout(1000)

        # 牙齒分頁應顯示牙齒記錄
        teeth_text = page.inner_text("#record-list-container")
        assert "深層齲齒" in teeth_text, f"還原 v2 後牙齒清單未顯示 '深層齲齒'，當前內容: {teeth_text}"

        # 切換至身體分頁
        page.click('.system-tab[data-system="body"]')
        page.wait_for_function("() => window.app && window.app.currentSystemId === 'body'", timeout=5000)
        page.wait_for_timeout(500)

        body_text = page.inner_text("#record-list-container")
        assert "頭部微創手術治療" in body_text, f"還原 v2 後身體清單未顯示 '頭部微創手術治療'，當前內容: {body_text}"
    finally:
        if temp_path and os.path.exists(temp_path):
            os.unlink(temp_path)
        context.close()


def test_restore_v1_legacy_backup(browser, base_url: str):
    """
    5. test_restore_v1_legacy_backup：
    上傳 v1 格式（巢狀，anatomicalSystems:[{systemId:'eye', annotations:[...]}]）→
    眼睛分頁清單顯示該筆，而且 localStorage['medicalRecords'] 中那筆的 system === 'eye'。
    """
    context = browser.new_context()
    page = context.new_page()
    temp_path = None
    try:
        page.goto(f"{base_url}/index.html")
        page.wait_for_function("() => window.app !== undefined", timeout=10000)

        v1_data = {
            "version": "1.0",
            "createdAt": "2026-09-27T08:00:00.000Z",
            "appName": "Anatomy Medical System",
            "recordCount": 1,
            "records": [
                {
                    "recordId": "rec-v1-legacy",
                    "patientId": "P001",
                    "createdAt": "2026-09-27T08:00:00.000Z",
                    "updatedAt": "2026-09-27T08:00:00.000Z",
                    "notes": "舊格式備註",
                    "anatomicalSystems": [
                        {
                            "systemId": "eye",
                            "annotations": [
                                {
                                    "annotationId": "anno-v1-eye",
                                    "structureId": "left-eye",
                                    "locationName": "左眼",
                                    "side": "left",
                                    "diseases": [{"id": "glaucoma", "name": "慢性青光眼"}],
                                    "createdAt": "2026-09-27T08:00:00.000Z",
                                }
                            ],
                        }
                    ],
                }
            ],
        }

        with tempfile.NamedTemporaryFile("w", suffix=".json", delete=False, encoding="utf-8") as tf:
            json.dump(v1_data, tf, ensure_ascii=False)
            temp_path = tf.name

        page.on("dialog", lambda d: d.accept())
        page.set_input_files("#restore-file", temp_path)
        page.wait_for_timeout(1000)

        # 切換至眼睛分頁
        page.click('.system-tab[data-system="eye"]')
        page.wait_for_function("() => window.app && window.app.currentSystemId === 'eye'", timeout=5000)
        page.wait_for_timeout(500)

        eye_text = page.inner_text("#record-list-container")
        assert "慢性青光眼" in eye_text, f"還原 v1 後眼睛清單未顯示 '慢性青光眼'，當前內容: {eye_text}"

        records = page.evaluate("() => JSON.parse(localStorage.getItem('medicalRecords') || '[]')")
        matched = [r for r in records if r.get("annotationId") == "anno-v1-eye"]
        assert len(matched) == 1, f"localStorage['medicalRecords'] 未找到 anno-v1-eye: {records}"
        assert matched[0].get("system") == "eye", f"還原後記錄的 system 欄位非 'eye': {matched[0]}"
    finally:
        if temp_path and os.path.exists(temp_path):
            os.unlink(temp_path)
        context.close()


def test_clear_all_clears_list(browser, base_url: str):
    """
    6. test_clear_all_clears_list：
    存一筆 → 清除全部（接受 confirm）→ 清單顯示空狀態，localStorage.medicalRecords 是空陣列或不存在。
    """
    context = browser.new_context()
    page = context.new_page()
    try:
        page.goto(f"{base_url}/index.html")
        page.wait_for_function("() => window.app !== undefined", timeout=10000)

        _save_teeth_record(page)
        records_before = page.evaluate("() => JSON.parse(localStorage.getItem('medicalRecords') || '[]')")
        assert len(records_before) >= 1, "儲存牙齒記錄失敗"

        # 接受 confirm 並點擊清除全部
        page.on("dialog", lambda d: d.accept())
        page.click("#clear-records-btn")
        page.wait_for_timeout(500)

        # 清單顯示空狀態提示文字
        container_text = page.inner_text("#record-list-container")
        assert "暫無" in container_text or "尚無" in container_text, (
            f"清除全部後清單未顯示空狀態，當前內容: {container_text}"
        )

        # localStorage.medicalRecords 是空陣列或不存在
        raw = page.evaluate("() => localStorage.getItem('medicalRecords')")
        assert raw is None or json.loads(raw) == [], (
            f"清除全部後 localStorage['medicalRecords'] 仍存在資料: {raw}"
        )
    finally:
        context.close()


def test_statistics_match_list(browser, base_url: str):
    """
    7. test_statistics_match_list：
    存牙齒 2 筆、眼睛 1 筆 → 統計總數 === 3。
    """
    context = browser.new_context()
    page = context.new_page()
    try:
        page.goto(f"{base_url}/index.html")
        page.wait_for_function("() => window.app !== undefined", timeout=10000)

        # 牙齒存 2 筆
        _save_teeth_record(page, checkbox_index=0)
        _save_teeth_record(page, checkbox_index=1)

        # 眼睛存 1 筆
        _save_eye_record(page, checkbox_index=0)

        # 統計模組計算總數
        stats = page.evaluate("""() => {
            const statsMgr = window.app.recordStatistics;
            if (!statsMgr) return null;
            const records = statsMgr.getAllRecords();
            return statsMgr.calculateStatistics(records);
        }""")
        assert stats is not None, "window.app.recordStatistics 未初始化"
        total = stats.get("totalAnnotations", 0)
        assert total == 3, f"統計標註總數預期為 3，實際為 {total} (stats: {stats})"
    finally:
        context.close()


def test_migrate_legacy_keys(browser, base_url: str):
    """
    8. test_migrate_legacy_keys：
    用 add_init_script 預先寫入：
    - anatomy-record-ids = ["r1"]、anatomy-record-r1 = 巢狀病歷，包含 teeth 標註 a1、eye 標註 a2
    - medicalRecords = [a1 的副本]（模擬重複）
    用 sessionStorage 確保只寫入一次。
    載入後斷言：
    - medicalRecords 恰好 2 筆（a1 不重複）
    - a2 的 system === 'eye'
    - anatomy-record-ids、anatomy-record-r1 已經不存在
    - anatomy-record-legacy-backup 存在
    """
    context = browser.new_context()
    init_script = """
    if (!sessionStorage.getItem('__phase6_legacy_init')) {
        sessionStorage.setItem('__phase6_legacy_init', '1');
        localStorage.setItem('anatomy-record-ids', JSON.stringify(['r1']));
        localStorage.setItem('anatomy-record-r1', JSON.stringify({
            recordId: 'r1',
            patientId: 'P001',
            createdAt: '2026-09-27T08:00:00.000Z',
            updatedAt: '2026-09-27T08:00:00.000Z',
            anatomicalSystems: [
                {
                    systemId: 'teeth',
                    annotations: [
                        {
                            annotationId: 'a1',
                            system: 'teeth',
                            locationName: '右上第一臼齒',
                            fdiNumber: '16',
                            diseases: [{id: 'd1', name: '牙周炎'}]
                        }
                    ]
                },
                {
                    systemId: 'eye',
                    annotations: [
                        {
                            annotationId: 'a2',
                            structureId: 'left-eye',
                            locationName: '左眼',
                            side: 'left',
                            diseases: [{id: 'd2', name: '白內障'}]
                        }
                    ]
                }
            ]
        }));
        localStorage.setItem('medicalRecords', JSON.stringify([
            {
                annotationId: 'a1',
                system: 'teeth',
                locationName: '右上第一臼齒',
                fdiNumber: '16',
                diseases: [{id: 'd1', name: '牙周炎'}]
            }
        ]));
    }
    """
    context.add_init_script(init_script)
    page = context.new_page()
    try:
        page.goto(f"{base_url}/index.html")
        page.wait_for_function("() => window.app !== undefined", timeout=10000)
        page.wait_for_timeout(500)

        res = page.evaluate("""() => {
            return {
                records: JSON.parse(localStorage.getItem('medicalRecords') || '[]'),
                hasIds: localStorage.getItem('anatomy-record-ids') !== null,
                hasR1: localStorage.getItem('anatomy-record-r1') !== null,
                hasBackup: localStorage.getItem('anatomy-record-legacy-backup') !== null
            };
        }""")

        records = res["records"]
        assert len(records) == 2, f"遷移去重後預期恰好 2 筆，實際為 {len(records)}: {records}"
        a2 = next((r for r in records if r.get("annotationId") == "a2"), None)
        assert a2 is not None, f"未找到遷移後的 a2 標註: {records}"
        assert a2.get("system") == "eye", f"a2 的 system 欄位預期為 'eye'，實際為 '{a2.get('system')}'"
        assert not res["hasIds"], "舊 key 'anatomy-record-ids' 仍存在，未被清理"
        assert not res["hasR1"], "舊 key 'anatomy-record-r1' 仍存在，未被清理"
        assert res["hasBackup"], "備份 key 'anatomy-record-legacy-backup' 不存在"
    finally:
        context.close()


def test_single_write_per_save(browser, base_url: str):
    """
    9. test_single_write_per_save：
    存一筆後，斷言沒有任何 anatomy-record- 開頭的 key（anatomy-record-legacy-backup 除外）。
    """
    context = browser.new_context()
    page = context.new_page()
    try:
        page.goto(f"{base_url}/index.html")
        page.wait_for_function("() => window.app !== undefined", timeout=10000)

        _save_teeth_record(page)

        legacy_keys = page.evaluate("""() => {
            return Object.keys(localStorage).filter(k => 
                k.startsWith('anatomy-record-') && k !== 'anatomy-record-legacy-backup'
            );
        }""")
        assert len(legacy_keys) == 0, f"儲存時不應寫入 anatomy-record-* key，實際發現: {legacy_keys}"
    finally:
        context.close()


def test_export_csv_contains_saved(browser, base_url: str):
    """
    10. test_export_csv_contains_saved：
    存一筆 → 用 app.exportRecord('csv')（點擊 #export-csv-btn）下載 → CSV 內容包含該疾病名稱。
    """
    context = browser.new_context()
    page = context.new_page()
    try:
        page.goto(f"{base_url}/index.html")
        page.wait_for_function("() => window.app !== undefined", timeout=10000)

        disease_name = _save_teeth_record(page)

        with page.expect_download() as download_info:
            page.click("#export-csv-btn")
        download = download_info.value
        csv_text = Path(download.path()).read_text(encoding="utf-8")

        assert disease_name in csv_text, (
            f"匯出的 CSV 內容未包含已儲存的疾病名稱 '{disease_name}'，CSV 內容:\n{csv_text}"
        )
    finally:
        context.close()


TESTS = [
    test_no_storage_growth_on_reload,
    test_markers_persist_after_reload,
    test_backup_contains_saved_record,
    test_restore_v2_shows_in_list,
    test_restore_v1_legacy_backup,
    test_clear_all_clears_list,
    test_statistics_match_list,
    test_migrate_legacy_keys,
    test_single_write_per_save,
    test_export_csv_contains_saved,
]
