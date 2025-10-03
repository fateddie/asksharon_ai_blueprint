import { test, expect } from '@playwright/test'

test.describe('Google OAuth Authentication Test', () => {
  test('Test Google OAuth flow', async ({ page }) => {
    console.log('=== GOOGLE OAUTH TEST ===')

    // Navigate to the homepage
    console.log('1. Navigating to homepage...')
    await page.goto('http://localhost:3000')

    // Wait for page to load
    await page.waitForTimeout(2000)

    // Take a screenshot of current state
    await page.screenshot({ path: 'before-auth.png', fullPage: true })

    // Check if user is already signed in
    console.log('2. Checking current authentication state...')
    const session = await page.request.get('http://localhost:3000/api/auth/session')
    const sessionData = await session.json()
    console.log('Current session:', sessionData)

    // Look for sign in button
    console.log('3. Looking for authentication buttons...')
    const signInButton = page.locator('text=Sign In')
    const connectButton = page.locator('text=Connect Google Account', { hasText: /connect.*google/i })
    const profileArea = page.locator('[data-testid="user-profile"]')

    console.log('Sign In Button visible:', await signInButton.isVisible())
    console.log('Connect Button visible:', await connectButton.isVisible())
    console.log('User Profile visible:', await profileArea.isVisible())

    // If not signed in, try to sign in
    if (Object.keys(sessionData).length === 0) {
      console.log('4. User not authenticated, attempting to sign in...')

      // Look for any button that might trigger authentication
      const authButtons = [
        page.locator('text=Sign In'),
        page.locator('text=Connect Google Account'),
        page.locator('button:has-text("Connect")'),
        page.locator('button:has-text("Google")'),
        page.locator('[data-testid="google-signin"]'),
      ]

      let foundButton = null
      for (const button of authButtons) {
        if (await button.isVisible()) {
          foundButton = button
          console.log('Found auth button:', await button.textContent())
          break
        }
      }

      if (foundButton) {
        console.log('5. Clicking authentication button...')
        await foundButton.click()

        // Wait for navigation or popup
        await page.waitForTimeout(3000)

        // Take screenshot after clicking
        await page.screenshot({ path: 'after-click.png', fullPage: true })

        // Check if redirected to Google or if anything changed
        const currentUrl = page.url()
        console.log('Current URL after click:', currentUrl)

        // Check session again
        const newSession = await page.request.get('http://localhost:3000/api/auth/session')
        const newSessionData = await newSession.json()
        console.log('Session after auth attempt:', newSessionData)

      } else {
        console.log('❌ No authentication buttons found')

        // Take screenshot to see what's actually on the page
        await page.screenshot({ path: 'no-auth-buttons.png', fullPage: true })

        // Print page content for debugging
        const pageContent = await page.textContent('body')
        console.log('Page content preview:', pageContent?.substring(0, 500))
      }
    } else {
      console.log('✅ User is already authenticated')
    }

    console.log('=== AUTH TEST COMPLETE ===')
  })
})