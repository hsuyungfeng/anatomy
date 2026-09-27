from playwright.sync_api import sync_playwright
import re

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()

    # Capture console logs
    page.on(
        "console",
        lambda msg: print(f"[{msg.type}] {msg.text}")
        if "detectBodyRegion" in msg.text or "BodyImageMapper" in msg.text
        else None,
    )

    page.goto("http://localhost:9000")
    page.wait_for_load_state("networkidle")

    # Switch to body system
    page.click('button.system-tab[data-system="body"]')
    page.wait_for_timeout(1500)

    canvas = page.locator("#image-canvas")
    box = canvas.bounding_box()

    print(f"\n=== Testing nose at center-top ===")
    click_x = box["x"] + box["width"] * 0.5
    click_y = box["y"] + box["height"] * 0.13
    page.mouse.click(click_x, click_y)
    page.wait_for_timeout(1000)

    print(f"\n=== Testing chest at center ===")
    click_x = box["x"] + box["width"] * 0.5
    click_y = box["y"] + box["height"] * 0.30
    page.mouse.click(click_x, click_y)
    page.wait_for_timeout(1000)

    browser.close()
