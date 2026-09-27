from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(headless=False)
    page = browser.new_page()

    page.on("console", lambda msg: print(f"[CONSOLE] {msg.type}: {msg.text}"))
    page.on("pageerror", lambda err: print(f"[ERROR] {err}"))

    page.goto("http://localhost:9000")
    page.wait_for_load_state("networkidle")

    print("Opened. Click nose on body image and check console.")
    input("Press Enter to close...")
    browser.close()
