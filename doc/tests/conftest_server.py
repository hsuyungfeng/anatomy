"""
測試伺服器輔助模組
啟動與停止本機 HTTP 伺服器供自動化測試使用
"""

import os
import sys
import time
import urllib.request
import subprocess
from pathlib import Path

# 確保在 snap 環境下能找到相依函式庫與模組
_SNAP_LIB = "/home/amd/snap/antigravity-cli/common/local/usr/lib/x86_64-linux-gnu"
if os.path.isdir(_SNAP_LIB):
    current_ld = os.environ.get("LD_LIBRARY_PATH", "")
    if _SNAP_LIB not in current_ld.split(":"):
        os.environ["LD_LIBRARY_PATH"] = f"{_SNAP_LIB}:{current_ld}" if current_ld else _SNAP_LIB

_PROJECT_ROOT = Path(__file__).resolve().parents[2]
DEFAULT_PORT = 8765


def get_port() -> int:
    return int(os.environ.get("ANATOMY_TEST_PORT", str(DEFAULT_PORT)))


def get_base_url() -> str:
    return f"http://127.0.0.1:{get_port()}"


def start_server(port: int = None, cwd: Path = None) -> subprocess.Popen:
    """啟動本機 HTTP 伺服器並輪詢直到就緒"""
    if port is None:
        port = get_port()
    if cwd is None:
        cwd = _PROJECT_ROOT

    server_proc = subprocess.Popen(
        [sys.executable, "-m", "http.server", str(port), "--bind", "127.0.0.1"],
        cwd=str(cwd),
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )

    url = f"http://127.0.0.1:{port}/index.html"
    deadline = time.time() + 10.0
    started = False

    while time.time() < deadline:
        if server_proc.poll() is not None:
            raise RuntimeError(f"HTTP 伺服器意外退出，結束代碼: {server_proc.returncode}")
        try:
            with urllib.request.urlopen(url, timeout=1.0) as resp:
                if resp.status == 200:
                    started = True
                    break
        except Exception:
            time.sleep(0.1)

    if not started:
        stop_server(server_proc)
        raise TimeoutError(f"HTTP 伺服器啟動逾時（10 秒內無法訪問 {url}）")

    return server_proc


def stop_server(proc: subprocess.Popen) -> None:
    """停止 HTTP 伺服器"""
    if proc is None:
        return
    try:
        proc.terminate()
        proc.wait(timeout=5)
    except Exception:
        try:
            proc.kill()
            proc.wait(timeout=2)
        except Exception:
            pass
