"""
Phase 4 測試執行器
零額外相依套件（僅使用 Python 標準庫與 playwright）
自動管理本機測試伺服器生命週期並執行所有測試
"""

import argparse
import os
import sys
import traceback
from pathlib import Path

# 確保在 snap 環境下能找到相依函式庫
_SNAP_LIB = "/home/amd/snap/antigravity-cli/common/local/usr/lib/x86_64-linux-gnu"
if os.path.isdir(_SNAP_LIB):
    current_ld = os.environ.get("LD_LIBRARY_PATH", "")
    if _SNAP_LIB not in current_ld.split(":"):
        os.environ["LD_LIBRARY_PATH"] = f"{_SNAP_LIB}:{current_ld}" if current_ld else _SNAP_LIB

_TESTS_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(_TESTS_DIR))

import conftest_server as server
import smoke_test
import tools_load_test
import xss_test
import records_flow_test
import ocr_match_test
import snapshot_prototype
from playwright.sync_api import sync_playwright


def main():
    parser = argparse.ArgumentParser(description="執行專案自動化測試")
    parser.add_argument(
        "--with-snapshot",
        action="store_true",
        help="額外執行 MedicalRecordApp.prototype 原型方法快照比對",
    )
    args = parser.parse_args()

    print("==================================================")
    print(" 醫療病歷系統 — Phase 4 自動化測試")
    print("==================================================")

    # 1. 啟動測試伺服器
    print("啟動本機測試伺服器...")
    server_proc = server.start_server()
    base_url = server.get_base_url()
    print(f"測試伺服器就緒: {base_url}")

    passed = 0
    failed = 0
    skipped = 0

    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)
            try:
                print("\n--- 執行冒煙測試 ---")
                for test_func in smoke_test.TESTS:
                    test_name = test_func.__name__
                    skip_reason = getattr(test_func, "SKIP_REASON", None)

                    if skip_reason:
                        print(f"[SKIP] {test_name}\n       原因: {skip_reason}")
                        skipped += 1
                        continue

                    try:
                        test_func(browser, base_url)
                        print(f"[PASS] {test_name}")
                        passed += 1
                    except Exception as err:
                        print(f"[FAIL] {test_name}")
                        print(f"       錯誤訊息: {err}")
                        failed += 1
                print("\n--- 執行工具頁載入測試 ---")
                for test_func in tools_load_test.TESTS:
                    test_name = test_func.__name__
                    skip_reason = getattr(test_func, "SKIP_REASON", None)

                    if skip_reason:
                        print(f"[SKIP] {test_name}\n       原因: {skip_reason}")
                        skipped += 1
                        continue

                    try:
                        test_func(browser, base_url)
                        print(f"[PASS] {test_name}")
                        passed += 1
                    except Exception as err:
                        print(f"[FAIL] {test_name}")
                        print(f"       錯誤訊息: {err}")
                        failed += 1
                print("\n--- 執行 XSS 安全性測試 ---")
                for test_func in xss_test.TESTS:
                    test_name = test_func.__name__
                    skip_reason = getattr(test_func, "SKIP_REASON", None)

                    if skip_reason:
                        print(f"[SKIP] {test_name}\n       原因: {skip_reason}")
                        skipped += 1
                        continue

                    try:
                        test_func(browser, base_url)
                        print(f"[PASS] {test_name}")
                        passed += 1
                    except Exception as err:
                        print(f"[FAIL] {test_name}")
                        print(f"       錯誤訊息: {err}")
                        failed += 1
                print("\n--- 執行病歷流程端到端測試 ---")
                for test_func in records_flow_test.TESTS:
                    test_name = test_func.__name__
                    skip_reason = getattr(test_func, "SKIP_REASON", None)

                    if skip_reason:
                        print(f"[SKIP] {test_name}\n       原因: {skip_reason}")
                        skipped += 1
                        continue

                    try:
                        test_func(browser, base_url)
                        print(f"[PASS] {test_name}")
                        passed += 1
                    except Exception as err:
                        print(f"[FAIL] {test_name}")
                        print(f"       錯誤訊息: {err}")
                        failed += 1

                print("\n--- 執行 OCR 疾病比對測試 ---")
                for test_func in ocr_match_test.TESTS:
                    test_name = test_func.__name__
                    skip_reason = getattr(test_func, "SKIP_REASON", None)

                    if skip_reason:
                        print(f"[SKIP] {test_name}\n       原因: {skip_reason}")
                        skipped += 1
                        continue

                    try:
                        test_func(browser, base_url)
                        print(f"[PASS] {test_name}")
                        passed += 1
                    except Exception as err:
                        print(f"[FAIL] {test_name}")
                        print(f"       錯誤訊息: {err}")
                        failed += 1

                if args.with_snapshot:
                    print("\n--- 執行原型方法快照比對 ---")
                    success = snapshot_prototype.check_snapshot(browser, base_url)
                    if success:
                        passed += 1
                    else:
                        failed += 1
            finally:
                browser.close()
    finally:
        print("\n停止本機測試伺服器...")
        server.stop_server(server_proc)

    print("\n==================================================")
    print(f" 測試結果: 通過 {passed}, 失敗 {failed}, 跳過 {skipped}")
    print("==================================================")

    sys.exit(1 if failed > 0 else 0)


if __name__ == "__main__":
    main()
