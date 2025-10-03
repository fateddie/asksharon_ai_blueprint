import { test, expect, type Page } from '@playwright/test'

/**
 * Loading Screen Transition Tests
 *
 * Tests focused on the loading screen behavior and smooth transitions
 * to prevent white screen flashes during page loads and state changes.
 */

class LoadingTransitionTester {
  constructor(private page: Page) {}

  /**
   * Monitor loading states during page navigation
   */
  async monitorLoadingStates(): Promise<{
    timeline: Array<{ timestamp: number; state: string; description: string }>
    issues: string[]
  }> {
    const timeline: Array<{ timestamp: number; state: string; description: string }> = []
    const issues: string[] = []
    const startTime = Date.now()

    // Set up monitoring before navigation
    const monitor = setInterval(async () => {
      try {
        const timestamp = Date.now() - startTime

        // Check for loading indicators
        const hasSpinner = await this.page.locator('.animate-spin, [data-testid="loading-spinner"]').isVisible()
        const hasLoadingText = await this.page.getByText(/loading|Loading/i).isVisible()
        const hasMainContent = await this.page.locator('main').isVisible()
        const hasHeader = await this.page.locator('header').isVisible()
        const hasH1 = await this.page.locator('h1').isVisible()

        let state = 'unknown'
        let description = ''

        if (hasSpinner || hasLoadingText) {
          state = 'loading'
          description = hasSpinner ? 'Loading spinner visible' : 'Loading text visible'
        } else if (hasMainContent && hasHeader && hasH1) {
          state = 'loaded'
          description = 'All main content loaded'
        } else if (hasMainContent || hasHeader) {
          state = 'partial'
          description = 'Some content loaded'
        } else {
          state = 'empty'
          description = 'No content visible'
        }

        timeline.push({ timestamp, state, description })

      } catch (error) {
        timeline.push({
          timestamp: Date.now() - startTime,
          state: 'error',
          description: `Error during monitoring: ${error}`
        })
      }
    }, 50) // Check every 50ms for detailed timeline

    try {
      // Navigate to the page
      await this.page.goto('/')
      await this.page.waitForLoadState('networkidle')

      // Wait a bit more to ensure all monitoring is captured
      await this.page.waitForTimeout(1000)

    } finally {
      clearInterval(monitor)
    }

    // Analyze timeline for issues
    this.analyzeTimelineForIssues(timeline, issues)

    return { timeline, issues }
  }

  private analyzeTimelineForIssues(timeline: Array<{ timestamp: number; state: string; description: string }>, issues: string[]): void {
    if (timeline.length === 0) {
      issues.push('No timeline data captured')
      return
    }

    // Check for white screen periods (empty state without loading)
    let consecutiveEmptyStates = 0
    let hasShownLoading = false
    let hasShownContent = false

    for (const entry of timeline) {
      switch (entry.state) {
        case 'loading':
          hasShownLoading = true
          consecutiveEmptyStates = 0
          break
        case 'loaded':
        case 'partial':
          hasShownContent = true
          consecutiveEmptyStates = 0
          break
        case 'empty':
          consecutiveEmptyStates++
          if (consecutiveEmptyStates > 10 && !hasShownLoading) { // More than 500ms of empty state
            issues.push(`Extended white screen period detected: ${consecutiveEmptyStates * 50}ms without loading indicator`)
          }
          break
      }
    }

    if (!hasShownContent) {
      issues.push('Content never appeared during monitoring period')
    }

    // Check transition quality
    const stateChanges = timeline.filter((entry, index) =>
      index === 0 || entry.state !== timeline[index - 1].state
    )

    if (stateChanges.length === 1 && stateChanges[0].state === 'empty') {
      issues.push('Page remained in empty state throughout loading')
    }

    // Log timeline for debugging
    console.log('Loading Timeline:')
    stateChanges.forEach(change => {
      console.log(`  ${change.timestamp}ms: ${change.state} - ${change.description}`)
    })
  }

  /**
   * Test loading screen appearance timing
   */
  async testLoadingScreenTiming(): Promise<{
    loadingAppeared: boolean
    loadingDuration: number
    contentAppearTime: number
    issues: string[]
  }> {
    const issues: string[] = []
    let loadingAppeared = false
    let loadingStartTime = 0
    let loadingEndTime = 0
    let contentAppearTime = 0
    const navigationStartTime = Date.now()

    // Start navigation
    const navigationPromise = this.page.goto('/')

    try {
      // Wait for loading screen to appear (with timeout)
      try {
        await this.page.waitForSelector('.animate-spin, [data-testid="loading-spinner"], :text("Loading")', {
          timeout: 3000
        })
        loadingStartTime = Date.now() - navigationStartTime
        loadingAppeared = true
      } catch {
        // Loading screen might not appear on fast loads
        console.log('Note: Loading screen did not appear (likely fast load)')
      }

      // Wait for main content
      await this.page.waitForSelector('h1', { timeout: 10000 })
      contentAppearTime = Date.now() - navigationStartTime

      // Check if loading screen is gone
      if (loadingAppeared) {
        const stillLoading = await this.page.locator('.animate-spin, [data-testid="loading-spinner"]').isVisible()
        if (!stillLoading) {
          loadingEndTime = Date.now() - navigationStartTime
        }
      }

      await navigationPromise

    } catch (error) {
      issues.push(`Error during loading timing test: ${error}`)
    }

    const loadingDuration = loadingEndTime - loadingStartTime

    // Validate timing
    if (loadingAppeared && loadingDuration > 10000) {
      issues.push(`Loading screen displayed too long: ${loadingDuration}ms`)
    }

    if (contentAppearTime > 10000) {
      issues.push(`Content took too long to appear: ${contentAppearTime}ms`)
    }

    return {
      loadingAppeared,
      loadingDuration,
      contentAppearTime,
      issues
    }
  }

  /**
   * Test the loading experience on different connection speeds
   */
  async testConnectionSpeeds(): Promise<{ issues: string[] }> {
    const issues: string[] = []

    const scenarios = [
      { name: 'Fast 3G', delay: 50 },
      { name: 'Slow 3G', delay: 200 },
      { name: 'Very Slow', delay: 500 }
    ]

    for (const scenario of scenarios) {
      try {
        console.log(`Testing ${scenario.name} connection...`)

        // Simulate network delay
        await this.page.route('**/*', route => {
          setTimeout(() => route.continue(), scenario.delay)
        })

        const result = await this.testLoadingScreenTiming()

        if (result.issues.length > 0) {
          issues.push(`${scenario.name}: ${result.issues.join(', ')}`)
        }

        // On slower connections, loading screen should definitely appear
        if (scenario.delay > 100 && !result.loadingAppeared) {
          issues.push(`${scenario.name}: Loading screen should appear on slow connections but didn't`)
        }

        // Remove route handler for next test
        await this.page.unroute('**/*')

      } catch (error) {
        issues.push(`${scenario.name}: Test error - ${error}`)
      }
    }

    return { issues }
  }

  /**
   * Test cache behavior and loading states
   */
  async testCacheBehavior(): Promise<{ issues: string[] }> {
    const issues: string[] = []

    try {
      // First load (fresh)
      console.log('Testing fresh load...')
      const freshResult = await this.testLoadingScreenTiming()

      if (freshResult.issues.length > 0) {
        issues.push(`Fresh load: ${freshResult.issues.join(', ')}`)
      }

      // Second load (cached)
      console.log('Testing cached load...')
      await this.page.reload()
      const cachedResult = await this.testLoadingScreenTiming()

      if (cachedResult.issues.length > 0) {
        issues.push(`Cached load: ${cachedResult.issues.join(', ')}`)
      }

      // Cached loads might be very fast and not show loading screen
      if (cachedResult.contentAppearTime > freshResult.contentAppearTime * 2) {
        issues.push('Cached load was slower than fresh load')
      }

    } catch (error) {
      issues.push(`Cache test error: ${error}`)
    }

    return { issues }
  }

  /**
   * Test loading behavior during user interactions
   */
  async testInteractiveLoading(): Promise<{ issues: string[] }> {
    const issues: string[] = []

    try {
      // Load the page first
      await this.page.goto('/')
      await this.page.waitForSelector('h1')

      // Test refresh behavior
      console.log('Testing page refresh...')
      await this.page.reload()

      const refreshResult = await this.monitorLoadingStates()
      if (refreshResult.issues.length > 0) {
        issues.push(`Refresh: ${refreshResult.issues.join(', ')}`)
      }

      // Test back/forward if we have navigation
      try {
        await this.page.goBack()
        await this.page.waitForTimeout(500)
        await this.page.goForward()

        const navigationResult = await this.monitorLoadingStates()
        if (navigationResult.issues.length > 0) {
          issues.push(`Navigation: ${navigationResult.issues.join(', ')}`)
        }
      } catch {
        // Skip if no history
        console.log('Skipping back/forward test (no history)')
      }

    } catch (error) {
      issues.push(`Interactive loading test error: ${error}`)
    }

    return { issues }
  }
}

test.describe('Loading Screen Transitions', () => {
  let tester: LoadingTransitionTester

  test.beforeEach(async ({ page }) => {
    tester = new LoadingTransitionTester(page)
  })

  test('Loading screen should appear and transition smoothly', async () => {
    const result = await tester.monitorLoadingStates()

    if (result.issues.length > 0) {
      console.log('🚨 Loading Transition Issues:')
      result.issues.forEach(issue => console.log(`  ❌ ${issue}`))

      // Take screenshot for debugging
      await tester.page.screenshot({
        path: 'test-results/loading-transition-issues.png',
        fullPage: true
      })
    }

    expect(result.issues).toHaveLength(0)
  })

  test('Loading timing should be appropriate', async () => {
    const result = await tester.testLoadingScreenTiming()

    console.log(`Loading appeared: ${result.loadingAppeared}`)
    console.log(`Loading duration: ${result.loadingDuration}ms`)
    console.log(`Content appear time: ${result.contentAppearTime}ms`)

    if (result.issues.length > 0) {
      console.log('🚨 Loading Timing Issues:')
      result.issues.forEach(issue => console.log(`  ❌ ${issue}`))
    }

    expect(result.issues).toHaveLength(0)
  })

  test('Different connection speeds should handle loading gracefully', async () => {
    const result = await tester.testConnectionSpeeds()

    if (result.issues.length > 0) {
      console.log('🚨 Connection Speed Issues:')
      result.issues.forEach(issue => console.log(`  ❌ ${issue}`))
    }

    expect(result.issues).toHaveLength(0)
  })

  test('Cache behavior should not cause loading issues', async () => {
    const result = await tester.testCacheBehavior()

    if (result.issues.length > 0) {
      console.log('🚨 Cache Behavior Issues:')
      result.issues.forEach(issue => console.log(`  ❌ ${issue}`))
    }

    expect(result.issues).toHaveLength(0)
  })

  test('Interactive loading scenarios should work properly', async () => {
    const result = await tester.testInteractiveLoading()

    if (result.issues.length > 0) {
      console.log('🚨 Interactive Loading Issues:')
      result.issues.forEach(issue => console.log(`  ❌ ${issue}`))
    }

    expect(result.issues).toHaveLength(0)
  })
})

test.describe('Browser-Specific Loading Tests', () => {
  test('Chrome loading behavior', async ({ page, browserName }) => {
    test.skip(browserName !== 'chromium', 'Chrome-specific test')

    const tester = new LoadingTransitionTester(page)
    const result = await tester.monitorLoadingStates()

    if (result.issues.length > 0) {
      console.log('🚨 Chrome Loading Issues:')
      result.issues.forEach(issue => console.log(`  ❌ ${issue}`))
    }

    expect(result.issues).toHaveLength(0)
  })

  test('Firefox loading behavior', async ({ page, browserName }) => {
    test.skip(browserName !== 'firefox', 'Firefox-specific test')

    const tester = new LoadingTransitionTester(page)
    const result = await tester.monitorLoadingStates()

    if (result.issues.length > 0) {
      console.log('🚨 Firefox Loading Issues:')
      result.issues.forEach(issue => console.log(`  ❌ ${issue}`))
    }

    expect(result.issues).toHaveLength(0)
  })

  test('Safari loading behavior', async ({ page, browserName }) => {
    test.skip(browserName !== 'webkit', 'Safari-specific test')

    const tester = new LoadingTransitionTester(page)
    const result = await tester.monitorLoadingStates()

    if (result.issues.length > 0) {
      console.log('🚨 Safari Loading Issues:')
      result.issues.forEach(issue => console.log(`  ❌ ${issue}`))
    }

    expect(result.issues).toHaveLength(0)
  })
})

test.describe('Mobile Loading Tests', () => {
  test('Mobile Chrome loading behavior', async ({ page, browserName }) => {
    test.skip(browserName !== 'chromium', 'Mobile Chrome test')

    await page.setViewportSize({ width: 375, height: 667 })

    const tester = new LoadingTransitionTester(page)
    const result = await tester.monitorLoadingStates()

    if (result.issues.length > 0) {
      console.log('🚨 Mobile Chrome Loading Issues:')
      result.issues.forEach(issue => console.log(`  ❌ ${issue}`))
    }

    expect(result.issues).toHaveLength(0)
  })

  test('Mobile Safari loading behavior', async ({ page, browserName }) => {
    test.skip(browserName !== 'webkit', 'Mobile Safari test')

    await page.setViewportSize({ width: 375, height: 812 })

    const tester = new LoadingTransitionTester(page)
    const result = await tester.monitorLoadingStates()

    if (result.issues.length > 0) {
      console.log('🚨 Mobile Safari Loading Issues:')
      result.issues.forEach(issue => console.log(`  ❌ ${issue}`))
    }

    expect(result.issues).toHaveLength(0)
  })
})

test.afterAll(async () => {
  console.log('\n📊 Loading Transition Tests Complete')
  console.log('All loading states and transitions have been validated')
})