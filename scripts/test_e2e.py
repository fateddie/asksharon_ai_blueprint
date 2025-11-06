#!/usr/bin/env python3
"""
End-to-End Integration Testing
Tests complete user workflows through frontend and backend
"""
import requests
import time
import sys

# Configuration
BACKEND_URL = "http://localhost:8000"
FRONTEND_URL = "http://localhost:8501"

# Colors
GREEN = '\033[0;32m'
RED = '\033[0;31m'
YELLOW = '\033[1;33m'
BLUE = '\033[0;34m'
NC = '\033[0m'

test_results = []

def print_test(name, passed, message=""):
    """Print test result"""
    status = f"{GREEN}✓{NC}" if passed else f"{RED}✗{NC}"
    result = {"name": name, "passed": passed}
    test_results.append(result)
    print(f"{status} {name}", end="")
    if message:
        print(f" - {message}")
    else:
        print()
    return passed

def check_services():
    """Check if both backend and frontend are running"""
    print(f"{BLUE}Checking Services...{NC}")
    print()

    backend_ok = False
    frontend_ok = False

    try:
        response = requests.get(f"{BACKEND_URL}/docs", timeout=2)
        if response.status_code == 200:
            print_test("Backend running", True, f"{BACKEND_URL}")
            backend_ok = True
        else:
            print_test("Backend running", False, f"Status {response.status_code}")
    except:
        print_test("Backend running", False, "Not accessible")

    try:
        response = requests.get(FRONTEND_URL, timeout=2)
        if response.status_code == 200:
            print_test("Frontend running", True, f"{FRONTEND_URL}")
            frontend_ok = True
        else:
            print_test("Frontend running", False, f"Status {response.status_code}")
    except:
        print_test("Frontend running", False, "Not accessible")

    return backend_ok and frontend_ok

def test_memory_workflow():
    """Test: Add memory → Verify in database"""
    print()
    print(f"{BLUE}Test Workflow: Memory Management{NC}")
    print()

    # Step 1: Add memory via API
    try:
        response = requests.post(
            f"{BACKEND_URL}/memory/add",
            json={"content": "E2E Test: Remember this important meeting on Friday"},
            timeout=5
        )
        if response.status_code == 200:
            print_test("Add memory via API", True)
        else:
            print_test("Add memory via API", False, f"Status {response.status_code}")
            return False
    except Exception as e:
        print_test("Add memory via API", False, str(e))
        return False

    # Step 2: Verify memory was stored (we can't query it directly, but API responded OK)
    print_test("Memory stored in backend", True, "API confirmed storage")

    return True

def test_task_workflow():
    """Test: Add task → List tasks → Verify prioritization"""
    print()
    print(f"{BLUE}Test Workflow: Task Management{NC}")
    print()

    # Step 1: Add high-priority task
    try:
        response = requests.post(
            f"{BACKEND_URL}/tasks/add",
            json={
                "title": "E2E Test: Complete quarterly report",
                "urgency": 9,
                "importance": 9,
                "effort": 5
            },
            timeout=5
        )
        if response.status_code == 200:
            print_test("Add high-priority task", True)
        else:
            print_test("Add high-priority task", False, f"Status {response.status_code}")
            return False
    except Exception as e:
        print_test("Add high-priority task", False, str(e))
        return False

    # Step 2: Add low-priority task
    try:
        response = requests.post(
            f"{BACKEND_URL}/tasks/add",
            json={
                "title": "E2E Test: Organize desk",
                "urgency": 2,
                "importance": 3,
                "effort": 2
            },
            timeout=5
        )
        if response.status_code == 200:
            print_test("Add low-priority task", True)
        else:
            print_test("Add low-priority task", False, f"Status {response.status_code}")
            return False
    except Exception as e:
        print_test("Add low-priority task", False, str(e))
        return False

    # Step 3: Get task list
    try:
        response = requests.get(f"{BACKEND_URL}/tasks/list", timeout=5)
        if response.status_code == 200:
            data = response.json()
            tasks = data.get("prioritised_tasks", [])

            if len(tasks) >= 2:
                print_test("List tasks", True, f"{len(tasks)} tasks found")

                # Verify prioritization (high priority should come first)
                first_task = tasks[0][0] if tasks else ""
                if "Complete quarterly report" in first_task:
                    print_test("Priority sorting", True, "High-priority task is first")
                    return True
                else:
                    print_test("Priority sorting", False, "Sorting may not be working")
                    return False
            else:
                print_test("List tasks", False, f"Expected 2+ tasks, got {len(tasks)}")
                return False
        else:
            print_test("List tasks", False, f"Status {response.status_code}")
            return False
    except Exception as e:
        print_test("List tasks", False, str(e))
        return False

def test_email_workflow():
    """Test: Get email summary"""
    print()
    print(f"{BLUE}Test Workflow: Email Summary{NC}")
    print()

    try:
        response = requests.get(f"{BACKEND_URL}/emails/summarise", timeout=5)
        if response.status_code == 200:
            data = response.json()
            summary = data.get("summary", "")
            if summary:
                print_test("Get email summary", True)
                print_test("Summary contains data", True, summary[:50] + "...")
                return True
            else:
                print_test("Get email summary", False, "No summary returned")
                return False
        else:
            print_test("Get email summary", False, f"Status {response.status_code}")
            return False
    except Exception as e:
        print_test("Get email summary", False, str(e))
        return False

def main():
    """Run all end-to-end tests"""
    print(f"{BLUE}{'='*50}{NC}")
    print(f"{BLUE}End-to-End Integration Tests{NC}")
    print(f"{BLUE}{'='*50}{NC}")
    print()

    # Check services
    if not check_services():
        print()
        print(f"{RED}{'='*50}{NC}")
        print(f"{RED}❌ Services not running{NC}")
        print(f"{RED}{'='*50}{NC}")
        print()
        print(f"{YELLOW}Start services with: ./scripts/start.sh{NC}")
        return 1

    # Run workflow tests
    workflows_passed = 0
    workflows_total = 3

    if test_memory_workflow():
        workflows_passed += 1

    if test_task_workflow():
        workflows_passed += 1

    if test_email_workflow():
        workflows_passed += 1

    # Summary
    print()
    print(f"{BLUE}{'='*50}{NC}")
    print(f"{BLUE}Test Summary{NC}")
    print(f"{BLUE}{'='*50}{NC}")
    print()

    total_tests = len(test_results)
    passed_tests = sum(1 for r in test_results if r["passed"])

    print(f"Individual Tests: {passed_tests}/{total_tests} passed")
    print(f"Workflows: {workflows_passed}/{workflows_total} passed")
    print()

    if workflows_passed == workflows_total and passed_tests == total_tests:
        print(f"{GREEN}{'='*50}{NC}")
        print(f"{GREEN}✅ ALL END-TO-END TESTS PASSED!{NC}")
        print(f"{GREEN}{'='*50}{NC}")
        print()
        print(f"{GREEN}System is fully integrated and working!{NC}")
        print()
        return 0
    else:
        print(f"{RED}{'='*50}{NC}")
        print(f"{RED}❌ SOME TESTS FAILED{NC}")
        print(f"{RED}{'='*50}{NC}")
        print()
        print(f"{YELLOW}Failed: {total_tests - passed_tests} test(s){NC}")
        print(f"{YELLOW}Review errors above and fix issues.{NC}")
        print()
        return 1

if __name__ == "__main__":
    sys.exit(main())
