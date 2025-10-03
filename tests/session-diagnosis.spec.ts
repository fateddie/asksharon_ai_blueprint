import { test, expect } from '@playwright/test';

/**
 * Session Diagnosis Test
 *
 * This test comprehensively diagnoses NextAuth session detection issues by:
 * 1. Checking the /api/auth/session endpoint response
 * 2. Examining browser cookies for NextAuth session cookies
 * 3. Checking localStorage/sessionStorage for any session data
 * 4. Logging the exact session state the frontend receives
 * 5. Monitoring console logs for useUser hook output
 */

test.describe('NextAuth Session Diagnosis', () => {
  test('should diagnose session detection issue', async ({ page, context }) => {
    console.log('\n========================================');
    console.log('NEXTAUTH SESSION DIAGNOSIS TEST');
    console.log('========================================\n');

    // Capture console logs from the page
    const consoleLogs: any[] = [];
    page.on('console', msg => {
      const text = msg.text();
      consoleLogs.push({
        type: msg.type(),
        text: text,
        timestamp: new Date().toISOString()
      });

      // Log useUser state changes
      if (text.includes('[useUser]') || text.includes('hasSession')) {
        console.log(`[CONSOLE] ${msg.type()}: ${text}`);
      }
    });

    // Navigate to the homepage
    console.log('1. Navigating to http://localhost:3000...');
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });

    // Wait for React to hydrate
    await page.waitForTimeout(2000);

    // ============================================
    // STEP 1: Check /api/auth/session endpoint
    // ============================================
    console.log('\n2. Checking /api/auth/session endpoint...');
    const sessionResponse = await page.request.get('http://localhost:3000/api/auth/session');
    const sessionData = await sessionResponse.json();

    console.log('\n[SESSION ENDPOINT RESPONSE]');
    console.log('Status:', sessionResponse.status());
    console.log('Headers:', sessionResponse.headers());
    console.log('Body:', JSON.stringify(sessionData, null, 2));
    console.log('Has session data:', Object.keys(sessionData).length > 0);
    console.log('Has user:', !!sessionData.user);
    console.log('Has access token:', !!sessionData.accessToken);

    // ============================================
    // STEP 2: Examine browser cookies
    // ============================================
    console.log('\n3. Examining browser cookies...');
    const cookies = await context.cookies();

    console.log('\n[BROWSER COOKIES]');
    console.log('Total cookies:', cookies.length);

    const nextAuthCookies = cookies.filter(c =>
      c.name.startsWith('next-auth') ||
      c.name.startsWith('__Secure-next-auth') ||
      c.name.includes('session')
    );

    console.log('NextAuth-related cookies:', nextAuthCookies.length);
    nextAuthCookies.forEach(cookie => {
      console.log('\nCookie:', {
        name: cookie.name,
        domain: cookie.domain,
        path: cookie.path,
        secure: cookie.secure,
        httpOnly: cookie.httpOnly,
        sameSite: cookie.sameSite,
        expires: cookie.expires,
        valueLength: cookie.value.length,
        value: cookie.value.substring(0, 50) + '...' // Show first 50 chars
      });
    });

    if (nextAuthCookies.length === 0) {
      console.log('\n⚠️  WARNING: No NextAuth cookies found!');
    }

    // ============================================
    // STEP 3: Check localStorage and sessionStorage
    // ============================================
    console.log('\n4. Checking localStorage and sessionStorage...');

    const localStorageData = await page.evaluate(() => {
      const data: Record<string, any> = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          data[key] = localStorage.getItem(key);
        }
      }
      return data;
    });

    const sessionStorageData = await page.evaluate(() => {
      const data: Record<string, any> = {};
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key) {
          data[key] = sessionStorage.getItem(key);
        }
      }
      return data;
    });

    console.log('\n[LOCAL STORAGE]');
    console.log(JSON.stringify(localStorageData, null, 2));

    console.log('\n[SESSION STORAGE]');
    console.log(JSON.stringify(sessionStorageData, null, 2));

    // ============================================
    // STEP 4: Check frontend session state
    // ============================================
    console.log('\n5. Checking frontend session state...');

    // Get the window object's NextAuth state
    const nextAuthState = await page.evaluate(() => {
      // @ts-ignore - accessing internal NextAuth state
      return {
        // Check if SessionProvider context is available
        hasSessionContext: typeof window !== 'undefined',
        // Check if there's any session data in the window
        windowKeys: Object.keys(window).filter(k => k.toLowerCase().includes('session') || k.toLowerCase().includes('auth'))
      };
    });

    console.log('\n[FRONTEND STATE]');
    console.log(JSON.stringify(nextAuthState, null, 2));

    // ============================================
    // STEP 5: Check page content
    // ============================================
    console.log('\n6. Checking page content...');

    const pageContent = await page.evaluate(() => {
      const bodyText = document.body.textContent || '';
      return {
        hasSignInButton: bodyText.includes('Sign In') || bodyText.includes('Sign in'),
        hasGoogleConnectButton: bodyText.includes('Connect Google Account') || bodyText.includes('Connect your Google account'),
        hasConnectedMessage: bodyText.includes('Connected to Google'),
        bodyTextSample: bodyText.substring(0, 500)
      };
    });

    console.log('\n[PAGE CONTENT]');
    console.log('Has Sign In button:', pageContent.hasSignInButton);
    console.log('Has Google Connect button:', pageContent.hasGoogleConnectButton);
    console.log('Has Connected message:', pageContent.hasConnectedMessage);
    console.log('Body text sample:', pageContent.bodyTextSample);

    // ============================================
    // STEP 6: Filter useUser console logs
    // ============================================
    console.log('\n7. useUser hook console logs...');

    const useUserLogs = consoleLogs.filter(log =>
      log.text.includes('[useUser]') ||
      log.text.includes('hasSession')
    );

    console.log('\n[USEUSER LOGS]');
    useUserLogs.forEach(log => {
      console.log(`[${log.timestamp}] ${log.type}: ${log.text}`);
    });

    // ============================================
    // STEP 7: Check network requests
    // ============================================
    console.log('\n8. Monitoring network requests...');

    const sessionRequests: any[] = [];
    page.on('request', request => {
      if (request.url().includes('/api/auth/session')) {
        sessionRequests.push({
          url: request.url(),
          method: request.method(),
          headers: request.headers(),
          timestamp: new Date().toISOString()
        });
      }
    });

    page.on('response', async response => {
      if (response.url().includes('/api/auth/session')) {
        console.log('\n[SESSION REQUEST DETECTED]');
        console.log('URL:', response.url());
        console.log('Status:', response.status());
        console.log('Headers:', response.headers());
        try {
          const body = await response.json();
          console.log('Response Body:', JSON.stringify(body, null, 2));
        } catch (e) {
          console.log('Could not parse response body');
        }
      }
    });

    // Wait a bit more to capture any delayed requests
    await page.waitForTimeout(3000);

    console.log('\n[SESSION REQUESTS]');
    console.log('Total session requests:', sessionRequests.length);
    sessionRequests.forEach(req => {
      console.log('\nRequest:', {
        url: req.url,
        method: req.method,
        timestamp: req.timestamp,
        hasCookie: !!req.headers.cookie
      });
    });

    // ============================================
    // ANALYSIS & DIAGNOSIS
    // ============================================
    console.log('\n========================================');
    console.log('DIAGNOSIS SUMMARY');
    console.log('========================================\n');

    const hasSessionData = Object.keys(sessionData).length > 0;
    const hasNextAuthCookies = nextAuthCookies.length > 0;
    const showsSignInButton = pageContent.hasSignInButton;
    const showsConnectedMessage = pageContent.hasConnectedMessage;

    console.log('Session endpoint has data:', hasSessionData);
    console.log('NextAuth cookies present:', hasNextAuthCookies);
    console.log('Page shows Sign In button:', showsSignInButton);
    console.log('Page shows Connected message:', showsConnectedMessage);

    console.log('\n[POTENTIAL ISSUES]');

    if (hasSessionData && !hasNextAuthCookies) {
      console.log('⚠️  Session endpoint returns data but NO cookies found!');
      console.log('    → Possible cookie configuration issue');
      console.log('    → Check NEXTAUTH_URL and cookie settings');
    }

    if (hasSessionData && showsSignInButton) {
      console.log('⚠️  Session endpoint has data but frontend shows Sign In!');
      console.log('    → Session not being detected by useSession hook');
      console.log('    → Check SessionProvider configuration');
      console.log('    → Check if cookies are being sent with requests');
    }

    if (!hasSessionData && !hasNextAuthCookies) {
      console.log('✓ No session data and no cookies - user not authenticated (expected)');
    }

    if (hasNextAuthCookies && !hasSessionData) {
      console.log('⚠️  Cookies exist but session endpoint returns empty!');
      console.log('    → Possible JWT decoding issue');
      console.log('    → Check NEXTAUTH_SECRET configuration');
    }

    console.log('\n========================================\n');

    // Take a screenshot for visual verification
    await page.screenshot({ path: 'test-results/session-diagnosis.png', fullPage: true });
    console.log('Screenshot saved to test-results/session-diagnosis.png');
  });
});
