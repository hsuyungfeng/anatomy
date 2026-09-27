from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()

    page.on("console", lambda msg: print(f"[CONSOLE] {msg.type}: {msg.text}"))

    page.goto("http://localhost:9000")
    page.wait_for_load_state("networkidle")

    # Click on the body image area (approximate nose position)
    # The canvas is around center of the page
    canvas = page.locator("#image-canvas")
    box = canvas.bounding_box()

    if box:
        # Click at nose position (center-top area of body image)
        page.mouse.click(box["x"] + box["width"] * 0.5, box["y"] + box["height"] * 0.1)
        page.wait_for_timeout(2000)

        print(
            f"Clicked at: {box['x'] + box['width'] * 0.5}, {box['y'] + box['height'] * 0.1}"
        )

    browser.close()
