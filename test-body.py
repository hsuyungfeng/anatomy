from playwright.sync_api import sync_playwright

body_parts = [
    {"name": "鼻子 (nose)", "x": 0.5, "y": 0.13},
    {"name": "前額 (forehead)", "x": 0.5, "y": 0.06},
    {"name": "眼睛 (eye)", "x": 0.46, "y": 0.11},
    {"name": "耳朵 (ear)", "x": 0.37, "y": 0.11},
    {"name": "下巴 (chin)", "x": 0.5, "y": 0.19},
    {"name": "頸部 (neck)", "x": 0.5, "y": 0.21},
    {"name": "胸部 (chest)", "x": 0.5, "y": 0.30},
    {"name": "腹部 (abdomen)", "x": 0.5, "y": 0.45},
    {"name": "左肩 (left shoulder)", "x": 0.15, "y": 0.26},
    {"name": "左手 (left hand)", "x": 0.14, "y": 0.62},
    {"name": "右肩 (right shoulder)", "x": 0.85, "y": 0.26},
    {"name": "右手 (right hand)", "x": 0.86, "y": 0.62},
    {"name": "左膝蓋 (left knee)", "x": 0.37, "y": 0.77},
    {"name": "右膝蓋 (right knee)", "x": 0.63, "y": 0.77},
    {"name": "左腳 (left foot)", "x": 0.37, "y": 0.99},
    {"name": "右腳 (right foot)", "x": 0.63, "y": 0.99},
]

results = []

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()

    page.goto("http://localhost:9000")
    page.wait_for_load_state("networkidle")

    # Switch to body system
    page.click('button.system-tab[data-system="body"]')
    page.wait_for_timeout(1000)

    canvas = page.locator("#image-canvas")
    box = canvas.bounding_box()

    print(f"Canvas: {box['width']}x{box['height']}")

    for part in body_parts:
        click_x = box["x"] + box["width"] * part["x"]
        click_y = box["y"] + box["height"] * part["y"]

        page.mouse.click(click_x, click_y)
        page.wait_for_timeout(1000)

        # Check for error
        has_error = page.locator(".structure-info__error").count() > 0

        if has_error:
            results.append({"name": part["name"], "status": "FAIL"})
            print(f"❌ {part['name']}")
        else:
            # Get detected region - try different selectors
            try:
                detected = page.locator(
                    ".body-region-info strong, .structure-info__main strong, .body-region-info"
                ).first.text_content(timeout=2000)
                if detected:
                    results.append(
                        {"name": part["name"], "status": "OK", "detected": detected}
                    )
                    print(f"✅ {part['name']} -> {detected}")
                else:
                    results.append({"name": part["name"], "status": "NO_RESPONSE"})
                    print(f"⚠️ {part['name']} -> No response")
            except:
                results.append({"name": part["name"], "status": "NO_RESPONSE"})
                print(f"⚠️ {part['name']} -> No response")

    browser.close()

# Summary
ok = len([r for r in results if r["status"] == "OK"])
fail = len([r for r in results if r["status"] == "FAIL"])
print(f"\nTotal: {len(results)}, OK: {ok}, Fail: {fail}")

failed = [r for r in results if r["status"] == "FAIL"]
if failed:
    print("\nFailed parts:")
    for f in failed:
        print(f"  - {f['name']}")
