"""
OCR 疾病比對模組測試
驗證 OCRHandler.matchDiseases 是否正常比對疾病名稱且不拋出 TypeError: Object.forEach is not a function
"""

import os
from pathlib import Path

# 確保在 snap 環境下能找到相依函式庫
_SNAP_LIB = "/home/amd/snap/antigravity-cli/common/local/usr/lib/x86_64-linux-gnu"
if os.path.isdir(_SNAP_LIB):
    current_ld = os.environ.get("LD_LIBRARY_PATH", "")
    if _SNAP_LIB not in current_ld.split(":"):
        os.environ["LD_LIBRARY_PATH"] = f"{_SNAP_LIB}:{current_ld}" if current_ld else _SNAP_LIB


def test_ocr_match_diseases(browser, base_url: str):
    """
    驗證 OCRHandler.matchDiseases:
    1. 開啟頁面確認 window.app 與 OCRHandler 存在
    2. 取得 data/disease-categories.json 疾病資料庫
    3. 傳入含有疾病名稱的文字比對
    4. 斷言未拋出例外，且回傳陣列包含該疾病
    """
    context = browser.new_context()
    page = context.new_page()

    try:
        page.goto(f"{base_url}/index.html")
        page.wait_for_function("() => window.app !== undefined && window.app !== null", timeout=10000)

        # 執行 matchDiseases 測試
        result = page.evaluate(
            """async () => {
            const handler = window.app.ocrHandler || new OCRHandler();
            const resp = await fetch('/data/disease-categories.json');
            const diseaseDatabase = await resp.json();
            const targetDisease = "牙周炎";
            const matches = handler.matchDiseases("病人主訴 " + targetDisease, diseaseDatabase);
            return {
                targetDisease,
                matches
            };
        }"""
        )

        target = result["targetDisease"]
        matches = result["matches"]
        assert isinstance(matches, list), f"預期 matches 為 list，實際為 {type(matches)}"
        assert len(matches) > 0, f"預期比對到至少一筆疾病，實際回傳空陣列: {matches}"
        assert any(m.get("name") == target for m in matches), (
            f"回傳疾病未包含預期的 '{target}'，比對結果: {matches}"
        )
    finally:
        context.close()


TESTS = [
    test_ocr_match_diseases,
]
