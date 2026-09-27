"""
Phase 6-03 儲存安全與資料一致性測試
測試還原無效檔案、遷移失敗舊 key 保留與重試冪等性、無 system 記錄之系統歸類
"""

import json
from playwright.sync_api import Browser


def test_restore_invalid_content_keeps_data(browser: Browser, base_url: str):
    """
    1. 還原結構正確但內容全無效的備份檔時，現有資料完全不變，並回傳 success === false。
    涵蓋 v2.0 與 v1.0 兩種格式。
    """
    context = browser.new_context()
    page = context.new_page()
    try:
        page.goto(f"{base_url}/index.html")
        page.wait_for_function("() => window.app !== undefined", timeout=10000)

        # 預先寫入 1 筆有效資料
        page.evaluate("""() => {
            localStorage.setItem('medicalRecords', JSON.stringify([{
                annotationId: 'original-rec-1',
                system: 'teeth',
                locationName: '門牙',
                diseases: [{id: 'c1', name: '齲齒'}]
            }]));
        }""")

        # 測試 A: v2.0 格式，records 全為無效值 [1, "x", null]
        eval_v2 = page.evaluate("""async () => {
            const invalidV2 = JSON.stringify({
                version: "2.0",
                records: [1, "x", null]
            });
            const file = new File([invalidV2], "invalid_v2.json", { type: "application/json" });
            const result = await window.app.recordManager.restoreFromBackup(file);
            const records = JSON.parse(localStorage.getItem('medicalRecords') || '[]');
            return { result, records };
        }""")

        assert eval_v2["result"].get("success") is False, (
            f"v2 全無效還原應回傳 success === false，但收到: {eval_v2['result']}"
        )
        assert len(eval_v2["records"]) == 1, (
            f"v2 全無效還原後現有資料被清空，當前資料: {eval_v2['records']}"
        )
        assert eval_v2["records"][0].get("annotationId") == "original-rec-1", (
            f"v2 全無效還原後原有資料不符: {eval_v2['records']}"
        )

        # 測試 B: v1.0 格式，annotations 全為無效值 [null, 5]
        eval_v1 = page.evaluate("""async () => {
            const invalidV1 = JSON.stringify({
                version: "1.0",
                records: [{
                    recordId: "r",
                    anatomicalSystems: [{
                        systemId: "teeth",
                        annotations: [null, 5]
                    }]
                }]
            });
            const file = new File([invalidV1], "invalid_v1.json", { type: "application/json" });
            const result = await window.app.recordManager.restoreFromBackup(file);
            const records = JSON.parse(localStorage.getItem('medicalRecords') || '[]');
            return { result, records };
        }""")

        assert eval_v1["result"].get("success") is False, (
            f"v1 全無效還原應回傳 success === false，但收到: {eval_v1['result']}"
        )
        assert len(eval_v1["records"]) == 1, (
            f"v1 全無效還原後現有資料被清空，當前資料: {eval_v1['records']}"
        )
        assert eval_v1["records"][0].get("annotationId") == "original-rec-1", (
            f"v1 全無效還原後原有資料不符: {eval_v1['records']}"
        )
    finally:
        context.close()


def test_restore_empty_backup_replaces(browser: Browser, base_url: str):
    """
    2. 刻意的空備份（records: []）還原時，維持現在的取代行為，回傳 success === true 且清空資料。
    """
    context = browser.new_context()
    page = context.new_page()
    try:
        page.goto(f"{base_url}/index.html")
        page.wait_for_function("() => window.app !== undefined", timeout=10000)

        # 預先寫入 1 筆
        page.evaluate("""() => {
            localStorage.setItem('medicalRecords', JSON.stringify([{
                annotationId: 'rec-to-clear',
                system: 'teeth',
                locationName: '犬齒'
            }]));
        }""")

        # 還原空備份
        res = page.evaluate("""async () => {
            const emptyV2 = JSON.stringify({
                version: "2.0",
                records: []
            });
            const file = new File([emptyV2], "empty_v2.json", { type: "application/json" });
            const result = await window.app.recordManager.restoreFromBackup(file);
            const records = JSON.parse(localStorage.getItem('medicalRecords') || '[]');
            return { result, records };
        }""")

        assert res["result"].get("success") is True, f"還原空備份應成功: {res['result']}"
        assert res["records"] == [], f"還原空備份後資料應清空: {res['records']}"
    finally:
        context.close()


def test_migration_write_failure_keeps_legacy_keys(browser: Browser, base_url: str):
    """
    3. 遷移時寫入 medicalRecords 失敗，舊的 anatomy-record-* key 一個都不刪；
       下次載入不注入失敗時，自動重試並成功遷移，舊 key 刪除且無重複。
    """
    context = browser.new_context()
    page = context.new_page()
    try:
        # init script：寫入舊格式資料，並在第一次載入時攔截 medicalRecords 寫入模擬 QuotaExceededError
        init_script = """
        if (!sessionStorage.getItem('init_migration_done')) {
            sessionStorage.setItem('init_migration_done', '1');
            localStorage.clear();
            localStorage.setItem('anatomy-record-ids', JSON.stringify(['r1']));
            localStorage.setItem('anatomy-record-r1', JSON.stringify({
                recordId: 'r1',
                anatomicalSystems: [{
                    systemId: 'teeth',
                    annotations: [{ annotationId: 'L1', fdiNumber: '11', locationName: '右上正中門齒' }]
                }]
            }));
        }

        if (!sessionStorage.getItem('injected_fail')) {
            sessionStorage.setItem('injected_fail', '1');
            const originalSetItem = Storage.prototype.setItem;
            Storage.prototype.setItem = function(key, val) {
                if (key === 'medicalRecords') {
                    throw new DOMException('quota', 'QuotaExceededError');
                }
                return originalSetItem.apply(this, arguments);
            };
        }
        """
        page.add_init_script(init_script)

        # 第一次載入（寫入失敗）
        page.goto(f"{base_url}/index.html")
        page.wait_for_function("() => window.app !== undefined", timeout=10000)

        r1_raw = page.evaluate("() => localStorage.getItem('anatomy-record-r1')")
        ids_raw = page.evaluate("() => localStorage.getItem('anatomy-record-ids')")

        assert r1_raw is not None, "遷移寫入失敗時 anatomy-record-r1 被錯誤刪除！"
        assert ids_raw is not None, "遷移寫入失敗時 anatomy-record-ids 被錯誤刪除！"

        # 重新整理（本次不注入失敗，應自動重試成功）
        page.reload()
        page.wait_for_function("() => window.app !== undefined", timeout=10000)

        records = page.evaluate("() => JSON.parse(localStorage.getItem('medicalRecords') || '[]')")
        assert len(records) == 1, f"重試遷移後 medicalRecords 筆數應為 1，實際為: {len(records)}"
        assert records[0].get("annotationId") == "L1", f"重試遷移後記錄不符: {records}"

        r1_after = page.evaluate("() => localStorage.getItem('anatomy-record-r1')")
        ids_after = page.evaluate("() => localStorage.getItem('anatomy-record-ids')")
        assert r1_after is None, f"重試成功後 anatomy-record-r1 應被清除: {r1_after}"
        assert ids_after is None, f"重試成功後 anatomy-record-ids 應被清除: {ids_after}"
    finally:
        context.close()


def test_view_classifies_records_without_system(browser: Browser, base_url: str):
    """
    4. 沒有 system 欄位的記錄（如 Phase 5 舊資料），在巢狀檢視（統計／匯出）的歸類應與清單一致，
       且在 init 後應自動回填 system 欄位。
    """
    context = browser.new_context()
    page = context.new_page()
    try:
        # 預先放置兩筆沒有 system 的記錄
        init_script = """
        if (!sessionStorage.getItem('init_sys_done')) {
            sessionStorage.setItem('init_sys_done', '1');
            localStorage.setItem('medicalRecords', JSON.stringify([
                {
                    annotationId: 'body-op-1',
                    bodyRegionId: 'head',
                    operationType: '抽血',
                    side: 'left',
                    locationName: '頭部'
                },
                {
                    annotationId: 'eye-op-1',
                    structureId: 'cornea',
                    side: 'right',
                    locationName: '角膜'
                }
            ]));
        }
        """
        page.add_init_script(init_script)

        page.goto(f"{base_url}/index.html")
        page.wait_for_function("() => window.app !== undefined", timeout=10000)

        # 檢驗 getCurrentRecord 巢狀檢視之系統分組
        systems = page.evaluate("""() => {
            const cur = window.app.recordManager.getCurrentRecord();
            return cur.anatomicalSystems.map(s => s.systemId);
        }""")

        assert set(systems) == {"body", "eye"}, (
            f"getCurrentRecord 系統分類錯誤: {systems} (期望為 {{'body', 'eye'}})"
        )

        # 檢驗 localStorage 回填
        stored_records = page.evaluate("() => JSON.parse(localStorage.getItem('medicalRecords') || '[]')")
        body_rec = next((r for r in stored_records if r.get("annotationId") == "body-op-1"), None)
        eye_rec = next((r for r in stored_records if r.get("annotationId") == "eye-op-1"), None)

        assert body_rec is not None, "未找到 body-op-1"
        assert eye_rec is not None, "未找到 eye-op-1"
        assert body_rec.get("system") == "body", f"body-op-1 未正確回填 system 欄位: {body_rec}"
        assert eye_rec.get("system") == "eye", f"eye-op-1 未正確回填 system 欄位: {eye_rec}"
    finally:
        context.close()


TESTS = [
    test_restore_invalid_content_keeps_data,
    test_restore_empty_backup_replaces,
    test_migration_write_failure_keeps_legacy_keys,
    test_view_classifies_records_without_system,
]
