"""
工具頁載入測試
驗證 doc/tools/ 下的所有工具頁面開啟時無同源 404 與無 JavaScript 執行期錯誤
"""

import os
import urllib.parse
from pathlib import Path

# 確保在 snap 環境下能找到相依函式庫
_SNAP_LIB = "/home/amd/snap/antigravity-cli/common/local/usr/lib/x86_64-linux-gnu"
if os.path.isdir(_SNAP_LIB):
    current_ld = os.environ.get("LD_LIBRARY_PATH", "")
    if _SNAP_LIB not in current_ld.split(":"):
        os.environ["LD_LIBRARY_PATH"] = f"{_SNAP_LIB}:{current_ld}" if current_ld else _SNAP_LIB

_TOOLS_DIR = Path(__file__).resolve().parents[1] / "tools"

TOOL_FILES = [
    "auto-calibrate-teeth.html",
    "auto-tooth-detection.html",
    "debug-tooth-detection.html",
    "eye-calibration.html",
    "eye-label-mapping-tool.html",
    "eye-text-recognition.html",
    "tooth-calibration.html",
    "visualize-coordinates.html",
    "index-simplified.html",
]


def test_tools_load_without_404_or_errors(browser, base_url: str):
    """
    對 doc/tools/ 的每一頁，用 playwright 開啟並監聽 response 事件，
    斷言所有同源請求都沒有 404（或其他 4xx/5xx 錯誤），而且沒有 pageerror。
    """
    base_parsed = urllib.parse.urlparse(base_url)
    base_origin = f"{base_parsed.scheme}://{base_parsed.netloc}"

    ignored_err_patterns = [
        "Failed to load resource",
        "ERR_NAME_NOT_RESOLVED",
        "ERR_CONNECTION_REFUSED",
        "net::ERR_",
        "cdn.jsdelivr.net",
        "cdnjs.cloudflare.com",
        "tesseract",
        "opencv",
    ]

    for tool_name in TOOL_FILES:
        tool_path = _TOOLS_DIR / tool_name
        assert tool_path.exists(), f"工具檔案不存在: {tool_path}"

        context = browser.new_context()
        page = context.new_page()

        not_found_same_origin = []
        page_errors = []

        def on_response(response):
            # 只檢查同源請求
            if response.url.startswith(base_origin):
                if response.status >= 400:
                    not_found_same_origin.append((response.url, response.status))

        def on_pageerror(err):
            err_str = str(err)
            if not any(pattern in err_str for pattern in ignored_err_patterns):
                page_errors.append(err_str)

        page.on("response", on_response)
        page.on("pageerror", on_pageerror)

        try:
            url = f"{base_url}/doc/tools/{tool_name}"
            page.goto(url, wait_until="load", timeout=10000)
            page.wait_for_timeout(500)

            assert len(not_found_same_origin) == 0, (
                f"工具頁 {tool_name} 發生同源請求錯誤: {not_found_same_origin}"
            )
            assert len(page_errors) == 0, (
                f"工具頁 {tool_name} 發生 pageerror: {page_errors}"
            )
        finally:
            context.close()


TESTS = [
    test_tools_load_without_404_or_errors,
]
