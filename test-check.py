from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()

    page.goto("http://localhost:9000")
    page.wait_for_load_state("networkidle")

    canvas = page.locator("#image-canvas")
    box = canvas.bounding_box()

    # Click nose
    click_x = box["x"] + box["width"] * 0.5
    click_y = box["y"] + box["height"] * 0.13
    page.mouse.click(click_x, click_y)
    page.wait_for_timeout(1500)

    # Take screenshot
    page.screenshot(path="/tmp/nose-click.png")

    # Get HTML content
    html = page.locator("#modal-location").inner_html()
    print(f"Modal location HTML:\n{html[:500]}")

    browser.close()
