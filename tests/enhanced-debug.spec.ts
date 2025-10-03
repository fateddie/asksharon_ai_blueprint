/**
 * Enhanced Automated debugging with Playwright
 * Captures console logs, network requests, errors, and screenshots
 */

import { test, expect } from '@playwright/test';

test.describe('Enhanced Personal Assistant Debugging', () => {

  test('Comprehensive Server and Connection Debug', async ({ page }) => {
    // Arrays to capture logs and network data
    const consoleLogs: string[] = [];
    const networkRequests: string[] = [];
    const networkErrors: string[] = [];
    const pageErrors: string[] = [];

    // Capture console logs
    page.on('console', msg => {
      const logMessage = `[${msg.type().toUpperCase()}] ${msg.text()}`;
      consoleLogs.push(logMessage);
      console.log('Browser Console:', logMessage);
    });

    // Capture network requests
    page.on('request', request => {
      const requestInfo = `${request.method()} ${request.url()}`;
      networkRequests.push(requestInfo);
      console.log('Network Request:', requestInfo);
    });

    // Capture network responses
    page.on('response', response => {
      const responseInfo = `${response.status()} ${response.url()}`;
      if (response.status() >= 400) {
        networkErrors.push(responseInfo);
        console.log('Network Error:', responseInfo);
      } else {
        console.log('Network Response:', responseInfo);
      }
    });

    // Capture page errors
    page.on('pageerror', error => {
      const errorMessage = error.message;
      pageErrors.push(errorMessage);
      console.log('Page Error:', errorMessage);
    });

    console.log('\n=== STARTING ENHANCED DEBUG ===\n');

    // Step 1: Check if server is responsive
    console.log('Step 1: Testing server connectivity...');

    try {
      const response = await page.goto('http://localhost:3000', {
        waitUntil: 'networkidle',
        timeout: 10000
      });

      console.log('Server Response Status:', response?.status());
      console.log('Server Response Headers:', await response?.allHeaders());

      await page.screenshot({ path: 'enhanced-debug-01-homepage.png', fullPage: true });

      // Check page title and basic content
      const title = await page.title();
      console.log('Page Title:', title);

      const bodyText = await page.textContent('body');
      console.log('Page Body Text (first 200 chars):', bodyText?.substring(0, 200));

    } catch (error) {
      console.log('ERROR: Could not load homepage:', error);
      await page.screenshot({ path: 'enhanced-debug-01-homepage-error.png', fullPage: true });

      // Try to get more info about the connection
      console.log('Network Requests so far:', networkRequests);
      console.log('Network Errors so far:', networkErrors);
      console.log('Console Logs so far:', consoleLogs);

      return; // Exit early if we can't even load the page
    }

    // Step 2: Test API endpoints directly
    console.log('\nStep 2: Testing API endpoints...');

    const apiEndpoints = [
      '/api/auth/session',
      '/api/auth/providers',
      '/api/test-calendar'
    ];

    for (const endpoint of apiEndpoints) {
      console.log(`Testing endpoint: ${endpoint}`);
      try {
        const response = await page.goto(`http://localhost:3000${endpoint}`, {
          waitUntil: 'networkidle',
          timeout: 5000
        });

        const content = await page.textContent('body');
        const status = response?.status();

        console.log(`${endpoint} - Status: ${status}`);
        console.log(`${endpoint} - Content: ${content?.substring(0, 200)}`);

        await page.screenshot({
          path: `enhanced-debug-api-${endpoint.replace(/\//g, '-')}.png`,
          fullPage: true
        });

      } catch (error) {
        console.log(`ERROR testing ${endpoint}:`, error);
      }
    }

    // Step 3: Test authentication flow
    console.log('\nStep 3: Testing authentication...');

    try {
      await page.goto('http://localhost:3000');

      // Look for sign-in elements
      const signInButton = page.locator('button:has-text("Sign In")');
      const connectButton = page.locator('button:has-text("Connect Google")');
      const userProfile = page.locator('text=Robert Freyne');

      console.log('Sign In Button visible:', await signInButton.isVisible().catch(() => false));
      console.log('Connect Button visible:', await connectButton.isVisible().catch(() => false));
      console.log('User Profile visible:', await userProfile.isVisible().catch(() => false));

      await page.screenshot({ path: 'enhanced-debug-03-auth-state.png', fullPage: true });

    } catch (error) {
      console.log('ERROR testing authentication:', error);
    }

    // Step 4: Detailed network analysis
    console.log('\nStep 4: Network Analysis Summary...');
    console.log('Total Requests:', networkRequests.length);
    console.log('Network Errors:', networkErrors.length);
    console.log('Console Logs:', consoleLogs.length);
    console.log('Page Errors:', pageErrors.length);

    // Print all captured data
    console.log('\n=== CONSOLE LOGS ===');
    consoleLogs.forEach((log, index) => console.log(`${index + 1}. ${log}`));

    console.log('\n=== NETWORK REQUESTS ===');
    networkRequests.forEach((req, index) => console.log(`${index + 1}. ${req}`));

    console.log('\n=== NETWORK ERRORS ===');
    networkErrors.forEach((err, index) => console.log(`${index + 1}. ${err}`));

    console.log('\n=== PAGE ERRORS ===');
    pageErrors.forEach((err, index) => console.log(`${index + 1}. ${err}`));

    // Step 5: Final diagnostic
    console.log('\n=== DIAGNOSTIC SUMMARY ===');

    if (networkErrors.length === 0 && pageErrors.length === 0) {
      console.log('✅ No critical errors detected');
    } else {
      console.log('❌ Issues detected:');
      if (networkErrors.length > 0) {
        console.log(`- ${networkErrors.length} network errors`);
      }
      if (pageErrors.length > 0) {
        console.log(`- ${pageErrors.length} page errors`);
      }
    }

    console.log('\n=== DEBUG COMPLETE ===\n');
  });

  test('Server Process Debug', async ({ page }) => {
    console.log('\n=== SERVER PROCESS DEBUG ===\n');

    // Try different approaches to connect
    const approaches = [
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      'http://0.0.0.0:3000'
    ];

    for (const url of approaches) {
      console.log(`Testing connection to: ${url}`);

      try {
        const response = await page.goto(url, {
          waitUntil: 'domcontentloaded',
          timeout: 5000
        });

        console.log(`✅ ${url} - Status: ${response?.status()}`);
        await page.screenshot({
          path: `server-debug-${url.replace(/[^a-zA-Z0-9]/g, '-')}.png`,
          fullPage: true
        });

        break; // If one works, we're good

      } catch (error) {
        console.log(`❌ ${url} - Error:`, error.message);
      }
    }
  });

});