import { test, expect, type Page } from '@playwright/test'

/**
 * White Screen Detection Test Suite
 *
 * Comprehensive tests to detect and prevent white screen issues in the Personal Assistant app.
 * These tests validate loading states, transitions, and content visibility across different scenarios.
 */

class WhiteScreenDetector {
  constructor(private page: Page) {}

  /**
   * Check if the page is showing a white screen (no visible content)
   */
  async detectWhiteScreen(): Promise<{ isWhiteScreen: boolean; reasons: string[] }> {
    const reasons: string[] = []
    let isWhiteScreen = false

    try {
      // Wait a moment for initial rendering
      await this.page.waitForTimeout(500)

      // Check 1: Look for essential content elements
      const hasMainContent = await this.page.locator('main').isVisible()
      const hasHeader = await this.page.locator('header').isVisible()
      const hasH1 = await this.page.locator('h1').isVisible()

      if (!hasMainContent) {
        reasons.push('Main content element not visible')
        isWhiteScreen = true
      }

      if (!hasHeader) {
        reasons.push('Header element not visible')
      }

      if (!hasH1) {
        reasons.push('Main heading (h1) not visible')
        isWhiteScreen = true
      }

      // Check 2: Look for loading indicators vs content
      const hasLoadingSpinner = await this.page.locator('[data-testid="loading-spinner"], .animate-spin').isVisible()
      const hasLoadingText = await this.page.getByText(/loading|Loading/i).isVisible()

      if (hasLoadingSpinner || hasLoadingText) {
        // Loading state is acceptable, not a white screen
        return { isWhiteScreen: false, reasons: ['Loading state detected - acceptable'] }
      }

      // Check 3: Verify specific content exists
      const expectedTexts = [
        'Personal Assistant',
        'Voice Assistant',
        'Task Manager',
        'Habit Tracker'
      ]

      let visibleTexts = 0
      for (const text of expectedTexts) {
        const isVisible = await this.page.getByText(text).isVisible()
        if (isVisible) visibleTexts++
      }

      if (visibleTexts === 0) {
        reasons.push('No expected app content found')
        isWhiteScreen = true
      }

      // Check 4: Verify page background isn't pure white
      const bodyBackgroundColor = await this.page.evaluate(() => {
        const body = document.body
        return window.getComputedStyle(body).backgroundColor
      })

      // Check if it's pure white or transparent (which defaults to white)
      if (bodyBackgroundColor === 'rgba(0, 0, 0, 0)' || bodyBackgroundColor === 'rgb(255, 255, 255)') {
        const hasStyledContent = await this.page.locator('[style*="background"], [class*="bg-"]').count()
        if (hasStyledContent === 0) {
          reasons.push('Page appears to have white/transparent background with no styled content')
          isWhiteScreen = true
        }
      }

      // Check 5: Console errors that might cause white screen
      const consoleErrors = await this.page.evaluate(() => {
        return (window as any).__consoleErrors || []
      })

      if (consoleErrors.length > 0) {
        reasons.push(`Console errors detected: ${consoleErrors.join(', ')}`)
      }

    } catch (error) {
      reasons.push(`Error during white screen detection: ${error}`)
      isWhiteScreen = true
    }

    return { isWhiteScreen, reasons }
  }

  /**
   * Monitor the loading sequence to detect white screen flashes
   */
  async monitorLoadingSequence(): Promise<{ issues: string[] }> {
    const issues: string[] = []
    const timeline: string[] = []

    try {
      // Start monitoring before navigation
      let hasShownContent = false
      let hasShownWhiteScreen = false
      let loadingStartTime = Date.now()

      // Monitor for content visibility over time
      const checkInterval = setInterval(async () => {
        try {
          const hasContent = await this.page.locator('main, h1, header').isVisible()
          const hasLoading = await this.page.locator('[data-testid="loading-spinner"], .animate-spin').isVisible()
          const timestamp = Date.now() - loadingStartTime

          if (hasLoading) {
            timeline.push(`${timestamp}ms: Loading indicator visible`)
          } else if (hasContent) {
            timeline.push(`${timestamp}ms: Main content visible`)
            hasShownContent = true
          } else {
            timeline.push(`${timestamp}ms: No content or loading indicator visible`)
            hasShownWhiteScreen = true
          }
        } catch (error) {
          timeline.push(`Error checking content: ${error}`)
        }
      }, 100)

      // Navigate and wait for completion
      await this.page.goto('/')
      await this.page.waitForLoadState('networkidle')

      // Clear the interval
      clearInterval(checkInterval)

      // Analyze the timeline
      if (hasShownWhiteScreen && !hasShownContent) {
        issues.push('White screen detected during loading without content ever appearing')
      }

      if (timeline.length === 0) {
        issues.push('No loading sequence data captured')
      }

      // Log timeline for debugging
      console.log('Loading Timeline:', timeline)

    } catch (error) {
      issues.push(`Error monitoring loading sequence: ${error}`)
    }

    return { issues }
  }

  /**
   * Test loading behavior under different network conditions
   */
  async testNetworkConditions(): Promise<{ issues: string[] }> {
    const issues: string[] = []

    try {
      // Test slow network
      await this.page.route('**/*', route => {
        setTimeout(() => route.continue(), 100) // 100ms delay
      })

      await this.page.goto('/')
      const slowResult = await this.detectWhiteScreen()
      if (slowResult.isWhiteScreen) {
        issues.push(`White screen on slow network: ${slowResult.reasons.join(', ')}`)
      }

      // Remove route handler
      await this.page.unroute('**/*')

      // Test normal network
      await this.page.goto('/')
      const normalResult = await this.detectWhiteScreen()
      if (normalResult.isWhiteScreen) {
        issues.push(`White screen on normal network: ${normalResult.reasons.join(', ')}`)
      }

    } catch (error) {
      issues.push(`Network condition test error: ${error}`)
    }

    return { issues }
  }
}

test.describe('White Screen Detection Suite', () => {
  let detector: WhiteScreenDetector

  test.beforeEach(async ({ page }) => {
    detector = new WhiteScreenDetector(page)

    // Capture console errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        page.evaluate((error) => {
          (window as any).__consoleErrors = (window as any).__consoleErrors || []
          ;(window as any).__consoleErrors.push(error)
        }, msg.text())
      }
    })
  })

  test('Initial page load should not show white screen', async () => {
    await detector.page.goto('/')

    const result = await detector.detectWhiteScreen()

    if (result.isWhiteScreen) {
      console.log('🚨 White Screen Detected on Initial Load:')
      result.reasons.forEach(reason => console.log(`  ❌ ${reason}`))

      // Take screenshot for debugging
      await detector.page.screenshot({
        path: 'test-results/white-screen-initial-load.png',
        fullPage: true
      })
    }

    expect(result.isWhiteScreen).toBe(false)
  })

  test('Page refresh should not cause white screen', async () => {
    // Load page first
    await detector.page.goto('/')
    await detector.page.waitForSelector('h1')

    // Refresh and check
    await detector.page.reload()
    await detector.page.waitForTimeout(1000) // Give time for content to load

    const result = await detector.detectWhiteScreen()

    if (result.isWhiteScreen) {
      console.log('🚨 White Screen Detected After Refresh:')
      result.reasons.forEach(reason => console.log(`  ❌ ${reason}`))

      await detector.page.screenshot({
        path: 'test-results/white-screen-refresh.png',
        fullPage: true
      })
    }

    expect(result.isWhiteScreen).toBe(false)
  })

  test('Loading sequence should be smooth without white screen flashes', async () => {
    const result = await detector.monitorLoadingSequence()

    if (result.issues.length > 0) {
      console.log('🚨 Loading Sequence Issues:')
      result.issues.forEach(issue => console.log(`  ❌ ${issue}`))
    }

    expect(result.issues).toHaveLength(0)
  })

  test('Different network conditions should not cause white screen', async () => {
    const result = await detector.testNetworkConditions()

    if (result.issues.length > 0) {
      console.log('🚨 Network Condition Issues:')
      result.issues.forEach(issue => console.log(`  ❌ ${issue}`))
    }

    expect(result.issues).toHaveLength(0)
  })

  test('Loading screen should appear before main content', async () => {
    let loadingDetected = false
    let contentDetected = false
    let loadingBeforeContent = false

    // Navigate with monitoring
    const navigationPromise = detector.page.goto('/')

    // Check for loading screen appearance
    try {
      await detector.page.waitForSelector('[data-testid="loading-spinner"], .animate-spin, :text("Loading")', {
        timeout: 2000
      })
      loadingDetected = true

      // Wait for content to appear
      await detector.page.waitForSelector('h1', { timeout: 10000 })
      contentDetected = true

      // Check if loading screen is now gone
      const stillLoading = await detector.page.locator('[data-testid="loading-spinner"], .animate-spin').isVisible()
      loadingBeforeContent = !stillLoading

    } catch (error) {
      // Loading screen might not appear if page loads very quickly
      console.log('Note: Loading screen may not have appeared (fast load)')
    }

    await navigationPromise

    // At minimum, content should be visible
    expect(contentDetected).toBe(true)

    // If loading was detected, it should transition properly
    if (loadingDetected) {
      expect(loadingBeforeContent).toBe(true)
    }
  })

  test('Essential UI components should be visible after load', async () => {
    await detector.page.goto('/')
    await detector.page.waitForLoadState('networkidle')

    const components = [
      { name: 'Header', selector: 'header' },
      { name: 'Main Content', selector: 'main' },
      { name: 'Page Title', selector: 'h1' },
      { name: 'Voice Control', selector: ':text("Voice Assistant")' },
      { name: 'Task Manager', selector: ':text("Task Manager")' },
      { name: 'Habit Tracker', selector: ':text("Habit Tracker")' }
    ]

    const missingComponents: string[] = []

    for (const component of components) {
      const isVisible = await detector.page.locator(component.selector).isVisible()
      if (!isVisible) {
        missingComponents.push(component.name)
      }
    }

    if (missingComponents.length > 0) {
      console.log('🚨 Missing UI Components:')
      missingComponents.forEach(component => console.log(`  ❌ ${component}`))

      await detector.page.screenshot({
        path: 'test-results/missing-components.png',
        fullPage: true
      })
    }

    expect(missingComponents).toHaveLength(0)
  })

  test('No JavaScript errors should cause white screen', async () => {
    const errors: string[] = []

    detector.page.on('pageerror', error => {
      errors.push(error.message)
    })

    detector.page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text())
      }
    })

    await detector.page.goto('/')
    await detector.page.waitForLoadState('networkidle')

    // Check if page is showing content despite any errors
    const result = await detector.detectWhiteScreen()

    if (errors.length > 0) {
      console.log('🚨 JavaScript Errors Detected:')
      errors.forEach(error => console.log(`  ❌ ${error}`))
    }

    if (result.isWhiteScreen && errors.length > 0) {
      console.log('🚨 White screen likely caused by JavaScript errors')
      await detector.page.screenshot({
        path: 'test-results/white-screen-js-errors.png',
        fullPage: true
      })
    }

    // White screen should not occur regardless of JS errors
    expect(result.isWhiteScreen).toBe(false)
  })
})

test.describe('Cross-Browser White Screen Tests', () => {
  test('Chrome should not show white screen', async ({ page, browserName }) => {
    test.skip(browserName !== 'chromium', 'Chrome-specific test')

    const detector = new WhiteScreenDetector(page)
    await page.goto('/')

    const result = await detector.detectWhiteScreen()
    expect(result.isWhiteScreen).toBe(false)
  })

  test('Firefox should not show white screen', async ({ page, browserName }) => {
    test.skip(browserName !== 'firefox', 'Firefox-specific test')

    const detector = new WhiteScreenDetector(page)
    await page.goto('/')

    const result = await detector.detectWhiteScreen()
    expect(result.isWhiteScreen).toBe(false)
  })

  test('Safari should not show white screen', async ({ page, browserName }) => {
    test.skip(browserName !== 'webkit', 'Safari-specific test')

    const detector = new WhiteScreenDetector(page)
    await page.goto('/')

    const result = await detector.detectWhiteScreen()
    expect(result.isWhiteScreen).toBe(false)
  })
})

// Generate detailed report after all tests
test.afterAll(async () => {
  console.log('\n📊 White Screen Detection Tests Complete')
  console.log('Check test-results/ for screenshots and detailed reports')
  console.log('Any white screen issues have been captured and documented')
})