#!/usr/bin/env python3
"""
Comprehensive Frontend Testing with Playwright
Tests UI accessibility, interactions, and visual regression
"""
from playwright.sync_api import sync_playwright
from datetime import datetime
import sys
import os
from pathlib import Path

# Test results tracking
test_results = []

def log_test(name, passed, message=""):
    """Log test result"""
    status = "✅" if passed else "❌"
    result = {"name": name, "passed": passed, "message": message}
    test_results.append(result)
    print(f"{status} {name}", end="")
    if message:
        print(f" - {message}")
    else:
        print()
    return passed

def compare_screenshots(current_path, baseline_path, diff_path):
    """Compare current screenshot with baseline"""
    if not os.path.exists(baseline_path):
        return "no_baseline"

    try:
        from PIL import Image, ImageChops
        baseline = Image.open(baseline_path)
        current = Image.open(current_path)

        # Ensure same size
        if baseline.size != current.size:
            return "size_mismatch"

        # Calculate difference
        diff = ImageChops.difference(baseline, current)

        # Check if images are identical
        if diff.getbbox() is None:
            return "identical"

        # Save diff image
        diff.save(diff_path)
        return "different"

    except ImportError:
        return "pillow_not_installed"
    except Exception as e:
        return f"error: {e}"

def test_streamlit_frontend():
    """Comprehensive frontend testing"""
    print("🧪 Frontend Testing Suite")
    print("=" * 50)
    print()

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Capture console errors
        console_errors = []
        page.on("console", lambda msg: console_errors.append(msg.text) if msg.type == "error" else None)

        try:
            # Test 1: Page Accessibility
            print("🌐 Test 1: Page Accessibility")
            response = page.goto("http://localhost:8501", wait_until="networkidle", timeout=10000)

            if not response or not response.ok:
                log_test("Page loads", False, f"HTTP {response.status if response else 'timeout'}")
                browser.close()
                return False

            log_test("Page loads", True, f"HTTP {response.status}")

            # Test 2: Page Title
            print("\n📄 Test 2: Page Metadata")
            title = page.title()
            log_test("Page has title", len(title) > 0, f"'{title}'")

            # Test 3: Key UI Elements
            print("\n🎨 Test 3: UI Elements Present")
            has_heading = page.locator("text=AskSharon.ai").count() > 0
            log_test("AskSharon.ai heading", has_heading)

            has_caption = page.locator("text=Your modular personal assistant").count() > 0
            log_test("Caption text", has_caption)

            has_input = page.locator('input[type="text"]').count() > 0
            log_test("Text input field", has_input)

            has_button = page.locator('button:has-text("Send")').count() > 0
            log_test("Send button", has_button)

            # Test 4: Input Interaction
            print("\n⌨️  Test 4: Input Interaction")
            if has_input:
                input_field = page.locator('input[type="text"]').first
                input_field.fill("Test message from Playwright")
                input_value = input_field.input_value()
                log_test("Input accepts text", input_value == "Test message from Playwright")
            else:
                log_test("Input accepts text", False, "Input field not found")

            # Test 5: Button Click
            print("\n🖱️  Test 5: Button Functionality")
            if has_button and has_input:
                try:
                    page.locator('button:has-text("Send")').click()
                    page.wait_for_timeout(1000)  # Wait for response
                    log_test("Button click works", True)

                    # Check if message appears
                    message_count = page.locator("text=Test message from Playwright").count()
                    log_test("Message rendered", message_count > 0)
                except Exception as e:
                    log_test("Button click works", False, str(e))
            else:
                log_test("Button click works", False, "Button or input not found")

            # Test 6: Console Errors
            print("\n🐛 Test 6: Console Errors")
            if console_errors:
                log_test("No console errors", False, f"{len(console_errors)} errors found")
                for error in console_errors[:3]:  # Show first 3
                    print(f"    ⚠️  {error}")
            else:
                log_test("No console errors", True)

            # Test 7: Screenshot & Visual Regression
            print("\n📸 Test 7: Visual Regression")
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            current_screenshot = f"tests/failures/frontend_{timestamp}.png"
            baseline_screenshot = "tests/baselines/frontend_baseline.png"
            diff_screenshot = f"tests/diffs/frontend_diff_{timestamp}.png"

            # Take screenshot
            page.screenshot(path=current_screenshot, full_page=True)
            log_test("Screenshot captured", True, current_screenshot)

            # Compare with baseline
            comparison_result = compare_screenshots(
                current_screenshot,
                baseline_screenshot,
                diff_screenshot
            )

            if comparison_result == "no_baseline":
                print("    ⚠️  No baseline found - creating first baseline")
                os.rename(current_screenshot, baseline_screenshot)
                log_test("Baseline created", True, baseline_screenshot)
            elif comparison_result == "identical":
                log_test("Visual regression check", True, "UI unchanged")
                os.remove(current_screenshot)  # Clean up
            elif comparison_result == "different":
                log_test("Visual regression check", False, "UI changed - review diff")
                print(f"    📊 Diff saved: {diff_screenshot}")
                print(f"    🔍 Current: {current_screenshot}")
                print(f"    📋 Baseline: {baseline_screenshot}")
                print(f"    💡 To approve: ./scripts/approve_frontend_changes.sh")
            elif comparison_result == "pillow_not_installed":
                print("    ⚠️  PIL/Pillow not installed - visual comparison skipped")
                print("    💡 Install: pip install Pillow")
            elif comparison_result == "size_mismatch":
                log_test("Visual regression check", False, "Screenshot size changed")
            else:
                log_test("Visual regression check", False, comparison_result)

            browser.close()

            # Summary
            print("\n" + "=" * 50)
            passed = sum(1 for r in test_results if r["passed"])
            total = len(test_results)
            print(f"Results: {passed}/{total} tests passed")

            if passed == total:
                print("✅ All frontend tests passed!")
                return True
            else:
                print(f"❌ {total - passed} test(s) failed")
                return False

        except Exception as e:
            print(f"\n❌ Fatal error: {e}")
            browser.close()
            return False

def check_services():
    """Check if backend and frontend are running"""
    import socket

    def is_port_open(port):
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        result = sock.connect_ex(('localhost', port))
        sock.close()
        return result == 0

    print("🔍 Checking services...")
    backend_running = is_port_open(8000)
    frontend_running = is_port_open(8501)

    if not backend_running:
        print("❌ Backend not running on port 8000")
    else:
        print("✅ Backend running on port 8000")

    if not frontend_running:
        print("❌ Frontend not running on port 8501")
        print("💡 Start services: ./scripts/start.sh")
        return False
    else:
        print("✅ Frontend running on port 8501")

    print()
    return backend_running and frontend_running

if __name__ == "__main__":
    # Check services first
    if not check_services():
        sys.exit(1)

    # Run tests
    success = test_streamlit_frontend()
    sys.exit(0 if success else 1)
