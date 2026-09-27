from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()

    # Capture console logs
    def log_handler(msg):
        text = msg.text
        if "detectBodyRegion" in text or "BodyImageMapper" in text or "識別" in text:
            print(f"[{msg.type}] {text}")

    page.on("console", log_handler)

    page.goto("http://localhost:9000")
    page.wait_for_load_state("networkidle")

    # Switch to body system
    page.click('button.system-tab[data-system="body"]')
    page.wait_for_timeout(1500)

    canvas = page.locator("#image-canvas")
    box = canvas.bounding_box()

    print(f"\n=== Test: chest click ===")
    # Chest is around center, slightly above middle
    click_x = box["x"] + box["width"] * 0.5
    click_y = box["y"] + box["height"] * 0.30
    print(f"Click at: {click_x}, {click_y}")
    page.mouse.click(click_x, click_y)
    page.wait_for_timeout(1000)

    # Check result
    html = page.locator("#modal-location").inner_html()
    if "無法自動識別" in html:
        print("Result: FAIL - Cannot identify")
    else:
        print(f"Result: {html[:200]}")

    browser.close()
