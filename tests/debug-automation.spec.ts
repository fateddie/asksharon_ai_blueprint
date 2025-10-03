/**
 * Automated debugging with Playwright
 * This will handle screenshots and API testing automatically
 */

import { test, expect } from '@playwright/test';

test.describe('Personal Assistant Debugging', () => {

  test('Test Google OAuth and Calendar Access', async ({ page }) => {
    // Go to the main app
    await page.goto('http://localhost:3000');

    // Take screenshot of initial state
    await page.screenshot({ path: 'debug-01-initial.png', fullPage: true });

    // Check if user is already signed in
    const signedIn = await page.locator('text=Robert Freyne').isVisible().catch(() => false);

    if (!signedIn) {
      // Look for Google connect button and click it
      const connectButton = page.locator('button:has-text("Connect Google Account")');
      if (await connectButton.isVisible()) {
        await page.screenshot({ path: 'debug-02-before-connect.png', fullPage: true });
        await connectButton.click();

        // Wait for OAuth redirect (may go to Google)
        await page.waitForLoadState('networkidle');
        await page.screenshot({ path: 'debug-03-after-connect-click.png', fullPage: true });
      }
    }

    // Test the calendar API endpoint directly
    console.log('Testing calendar API endpoint...');

    try {
      const response = await page.goto('http://localhost:3000/api/test-calendar');
      await page.screenshot({ path: 'debug-04-calendar-api-response.png', fullPage: true });

      const content = await page.textContent('body');
      console.log('Calendar API Response:', content);

      // Try to parse as JSON
      if (content) {
        try {
          const jsonData = JSON.parse(content);
          console.log('Parsed Calendar Data:', JSON.stringify(jsonData, null, 2));

          if (jsonData.todaysMeetings) {
            console.log(`Found ${jsonData.todaysMeetings.length} meetings today:`, jsonData.todaysMeetings);
          }
        } catch (e) {
          console.log('Response is not JSON:', content.substring(0, 200));
        }
      }
    } catch (error) {
      console.error('Error testing calendar API:', error);
      await page.screenshot({ path: 'debug-04-calendar-api-error.png', fullPage: true });
    }

    // Test sync status endpoint
    try {
      await page.goto('http://localhost:3000/api/sync');
      await page.screenshot({ path: 'debug-05-sync-status.png', fullPage: true });

      const syncContent = await page.textContent('body');
      console.log('Sync API Response:', syncContent?.substring(0, 200));
    } catch (error) {
      console.error('Error testing sync API:', error);
      await page.screenshot({ path: 'debug-05-sync-error.png', fullPage: true });
    }

    // Go back to main dashboard
    await page.goto('http://localhost:3000');
    await page.screenshot({ path: 'debug-06-final-dashboard.png', fullPage: true });

    // Check for any error messages on the page
    const errorElements = await page.locator('text=/error|Error|ERROR/i').all();
    if (errorElements.length > 0) {
      console.log('Found error messages on page:');
      for (const element of errorElements) {
        const text = await element.textContent();
        console.log(' -', text);
      }
    }

    // Check auth session endpoint
    try {
      await page.goto('http://localhost:3000/api/auth/session');
      const sessionContent = await page.textContent('body');
      console.log('Session data:', sessionContent?.substring(0, 300));
      await page.screenshot({ path: 'debug-07-session-data.png', fullPage: true });
    } catch (error) {
      console.error('Error checking session:', error);
    }
  });

  test('Check Token Scopes Issue', async ({ page }) => {
    // This test will help identify the scope issue
    console.log('Testing OAuth token scopes...');

    // Go to Google OAuth consent screen by triggering sign-in
    await page.goto('http://localhost:3000');

    // Try to initiate OAuth flow to see what scopes are being requested
    const signInButton = page.locator('button:has-text("Connect Google Account")');
    if (await signInButton.isVisible()) {
      // Right click to inspect the OAuth URL being generated
      await signInButton.click();

      // Capture the redirect URL from network requests
      page.on('request', request => {
        const url = request.url();
        if (url.includes('accounts.google.com/o/oauth2')) {
          console.log('OAuth URL:', url);

          // Extract scopes from URL
          const scopeMatch = url.match(/scope=([^&]+)/);
          if (scopeMatch) {
            const scopes = decodeURIComponent(scopeMatch[1]);
            console.log('Requested scopes:', scopes);
          }
        }
      });

      await page.waitForTimeout(3000);
      await page.screenshot({ path: 'debug-oauth-flow.png', fullPage: true });
    }
  });

});