from playwright.sync_api import sync_playwright
import json

body_parts = [
    # Head sub-regions
    {"name": "前額 (forehead)", "x": 0.5, "y": 0.06},
    {"name": "眉毛 (eyebrow)", "x": 0.46, "y": 0.085},
    {"name": "右眉毛 (right eyebrow)", "x": 0.54, "y": 0.085},
    {"name": "眼睛 (eye)", "x": 0.46, "y": 0.11},
    {"name": "右眼 (right eye)", "x": 0.54, "y": 0.11},
    {"name": "耳朵 (ear)", "x": 0.37, "y": 0.11},
    {"name": "右耳朵 (right ear)", "x": 0.63, "y": 0.11},
    {"name": "鼻子 (nose)", "x": 0.5, "y": 0.135},
    {"name": "臉頰 (cheek)", "x": 0.43, "y": 0.145},
    {"name": "右臉頰 (right cheek)", "x": 0.57, "y": 0.145},
    {"name": "嘴唇 (lips)", "x": 0.5, "y": 0.165},
    {"name": "下巴 (chin)", "x": 0.5, "y": 0.19},
    # Neck
    {"name": "頸部 (neck)", "x": 0.5, "y": 0.21},
    {"name": "後頸 (nape)", "x": 0.5, "y": 0.235},
    # Back
    {"name": "背部 (back)", "x": 0.5, "y": 0.47},
    # Torso - Chest
    {"name": "胸部 (chest)", "x": 0.5, "y": 0.30},
    {"name": "左乳房 (left breast)", "x": 0.44, "y": 0.33},
    {"name": "右乳房 (right breast)", "x": 0.56, "y": 0.33},
    # Torso - Abdomen
    {"name": "上腹 (upper abdomen)", "x": 0.5, "y": 0.38},
    {"name": "腹部 (abdomen)", "x": 0.5, "y": 0.45},
    {"name": "肚臍 (umbilical)", "x": 0.5, "y": 0.485},
    # Groin
    {"name": "腹股溝 (groin)", "x": 0.5, "y": 0.54},
    {"name": "恥丘 (mons)", "x": 0.5, "y": 0.58},
    # Left Arm
    {"name": "左肩 (left shoulder)", "x": 0.15, "y": 0.26},
    {"name": "左腋下 (left axilla)", "x": 0.23, "y": 0.285},
    {"name": "左上臂 (left arm)", "x": 0.165, "y": 0.335},
    {"name": "左手肘 (left elbow)", "x": 0.16, "y": 0.42},
    {"name": "左前臂 (left forearm)", "x": 0.155, "y": 0.50},
    {"name": "左手腕 (left wrist)", "x": 0.145, "y": 0.57},
    {"name": "左手 (left hand)", "x": 0.14, "y": 0.62},
    {"name": "左手指 (left fingers)", "x": 0.125, "y": 0.66},
    # Right Arm
    {"name": "右肩 (right shoulder)", "x": 0.85, "y": 0.26},
    {"name": "右腋下 (right axilla)", "x": 0.77, "y": 0.285},
    {"name": "右上臂 (right arm)", "x": 0.835, "y": 0.335},
    {"name": "右手肘 (right elbow)", "x": 0.84, "y": 0.42},
    {"name": "右前臂 (right forearm)", "x": 0.845, "y": 0.50},
    {"name": "右手腕 (right wrist)", "x": 0.855, "y": 0.57},
    {"name": "右手 (right hand)", "x": 0.86, "y": 0.62},
    {"name": "右手指 (right fingers)", "x": 0.875, "y": 0.66},
    # Left Leg
    {"name": "左臀 (left hip)", "x": 0.37, "y": 0.59},
    {"name": "左臀部 (left buttock)", "x": 0.34, "y": 0.62},
    {"name": "左大腿 (left thigh)", "x": 0.37, "y": 0.67},
    {"name": "左膝蓋 (left knee)", "x": 0.37, "y": 0.77},
    {"name": "左小腿 (left calf)", "x": 0.37, "y": 0.87},
    {"name": "左腳踝 (left ankle)", "x": 0.37, "y": 0.94},
    {"name": "左腳 (left foot)", "x": 0.37, "y": 0.99},
    # Right Leg
    {"name": "右臀 (right hip)", "x": 0.63, "y": 0.59},
    {"name": "右臀部 (right buttock)", "x": 0.66, "y": 0.62},
    {"name": "右大腿 (right thigh)", "x": 0.63, "y": 0.67},
    {"name": "右膝蓋 (right knee)", "x": 0.63, "y": 0.77},
    {"name": "右小腿 (right calf)", "x": 0.63, "y": 0.87},
    {"name": "右腳踝 (right ankle)", "x": 0.63, "y": 0.94},
    {"name": "右腳 (right foot)", "x": 0.63, "y": 0.99},
]

results = []

with sync_playwright() as p:
    browser = p.chromium.launch(headless=False)
    page = browser.new_page()

    page.goto("http://localhost:9000")
    page.wait_for_load_state("networkidle")

    canvas = page.locator("#image-canvas")
    box = canvas.bounding_box()

    print(f"Canvas size: {box}")

    for part in body_parts:
        try:
            # Click at the position
            click_x = box["x"] + box["width"] * part["x"]
            click_y = box["y"] + box["height"] * part["y"]

            page.mouse.click(click_x, click_y)
            page.wait_for_timeout(1500)

            # Check if modal opened or error message
            error_msg = page.locator(
                ".structure-info__error, .body-region-info__error"
            ).text_content()

            if error_msg and "無法自動識別" in error_msg:
                results.append(
                    {"name": part["name"], "status": "FAIL", "error": error_msg}
                )
                print(f"❌ {part['name']}: {error_msg}")
            else:
                # Check what was detected
                region_text = page.locator(
                    ".body-region-info, .structure-info__main"
                ).text_content()
                if region_text:
                    results.append(
                        {
                            "name": part["name"],
                            "status": "OK",
                            "detected": region_text[:50],
                        }
                    )
                    print(f"✅ {part['name']}: {region_text[:50]}")
                else:
                    results.append(
                        {
                            "name": part["name"],
                            "status": "UNKNOWN",
                            "error": "No response",
                        }
                    )
                    print(f"⚠️ {part['name']}: No response")
        except Exception as e:
            results.append({"name": part["name"], "status": "ERROR", "error": str(e)})
            print(f"❌ {part['name']}: {str(e)}")

    browser.close()

# Save results
with open("/tmp/body-parts-test-results.json", "w", encoding="utf-8") as f:
    json.dump(results, f, ensure_ascii=False, indent=2)

print("\n=== Summary ===")
print(f"Total: {len(results)}")
print(f"OK: {len([r for r in results if r['status'] == 'OK'])}")
print(f"FAIL: {len([r for r in results if r['status'] == 'FAIL'])}")
print(f"Results saved to /tmp/body-parts-test-results.json")
