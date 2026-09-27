"""
快取版本守門測試
確保靜態資產變更時，CACHE_NAME 必須升版且基準檔正確更新
"""

import json
from pathlib import Path
from bump_cache import (
    _PROJECT_ROOT,
    _BASELINE_PATH,
    _SW_PATH,
    compute_assets_hash,
    extract_cache_name,
)


def test_cache_name_bumped_when_assets_change(browser=None, base_url: str = ""):
    """
    驗證 assets/、data/、index.html 或 manifest.json 有變動時，
    sw.js 的 CACHE_NAME 必須升版，且 doc/tests/baseline/assets-hash.json 已正確同步。
    """
    if not _BASELINE_PATH.exists():
        raise AssertionError(
            f"基準檔不存在: {_BASELINE_PATH}，請先執行 `python3 doc/tests/bump_cache.py` 建立基準"
        )

    with open(_BASELINE_PATH, "r", encoding="utf-8") as f:
        baseline = json.load(f)

    base_cache = baseline.get("cacheName")
    base_hash = baseline.get("hash")

    current_cache_name = extract_cache_name(_SW_PATH)
    current_hash = compute_assets_hash(_PROJECT_ROOT)

    if current_hash != base_hash:
        if current_cache_name == base_cache:
            raise AssertionError(
                "assets/、data/ 或關鍵檔案已變更，但 CACHE_NAME 未升版！\n"
                "請執行 `python3 doc/tests/bump_cache.py` 升級快取版本並更新基準。"
            )
        else:
            raise AssertionError(
                "assets/ 已變更且 CACHE_NAME 已升版，但基準檔未更新！\n"
                "請執行 `python3 doc/tests/bump_cache.py` 更新基準檔。"
            )

    if current_cache_name != base_cache:
        raise AssertionError(
            f"assets 未變更但 CACHE_NAME ({current_cache_name}) 與基準 ({base_cache}) 不一致！\n"
            "請檢查 sw.js 或執行 `python3 doc/tests/bump_cache.py`。"
        )


TESTS = [
    test_cache_name_bumped_when_assets_change,
]
