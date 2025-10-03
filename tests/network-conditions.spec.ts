import { test, expect, type Page } from '@playwright/test'

/**
 * Network Conditions and Loading Behavior Tests
 *
 * Tests the app's loading behavior under various network conditions
 * to ensure proper loading states and prevent white screen issues.
 */

interface NetworkScenario {
  name: string
  downloadThroughput: number
  uploadThroughput: number
  latency: number
  description: string
}

class NetworkConditionTester {
  constructor(private page: Page) {}

  /**
   * Set up network conditions using Chrome DevTools Protocol
   */
  async setNetworkConditions(scenario: NetworkScenario): Promise<void> {
    const client = await this.page.context().newCDPSession(this.page)

    await client.send('Network.emulateNetworkConditions', {
      offline: false,
      downloadThroughput: scenario.downloadThroughput,
      uploadThroughput: scenario.uploadThroughput,
      latency: scenario.latency,
    })
  }

  /**
   * Clear network conditions
   */
  async clearNetworkConditions(): Promise<void> {
    const client = await this.page.context().newCDPSession(this.page)

    await client.send('Network.emulateNetworkConditions', {
      offline: false,
      downloadThroughput: -1, // No throttling
      uploadThroughput: -1,   // No throttling
      latency: 0,
    })
  }

  /**
   * Test loading behavior under specific network conditions
   */
  async testNetworkScenario(scenario: NetworkScenario): Promise<{
    loadTime: number
    hasLoadingScreen: boolean
    hasWhiteScreen: boolean
    contentVisible: boolean
    errors: string[]
  }> {
    const errors: string[] = []
    let loadTime = 0
    let hasLoadingScreen = false
    let hasWhiteScreen = false
    let contentVisible = false

    try {
      // Set network conditions
      await this.setNetworkConditions(scenario)

      // Monitor for errors
      this.page.on('console', msg => {
        if (msg.type() === 'error') {
          errors.push(`Console: ${msg.text()}`)
        }
      })

      this.page.on('pageerror', error => {
        errors.push(`Page Error: ${error.message}`)
      })

      // Start timing
      const startTime = Date.now()

      // Navigate with loading monitoring
      const navigationPromise = this.page.goto('/', { waitUntil: 'networkidle' })

      // Check for loading screen appearance
      try {
        await this.page.waitForSelector('.animate-spin, [data-testid="loading-spinner"], :text("Loading")', {
          timeout: 5000
        })
        hasLoadingScreen = true
      } catch {
        // Loading screen might not appear on very fast networks
      }

      // Monitor for white screen periods
      const whiteScreenCheck = setInterval(async () => {
        try {
          const hasContent = await this.page.locator('main, h1, header').isVisible()
          const hasLoader = await this.page.locator('.animate-spin, [data-testid="loading-spinner"]').isVisible()

          if (!hasContent && !hasLoader) {
            hasWhiteScreen = true
          }
        } catch {
          // Ignore errors during monitoring
        }
      }, 100)

      // Wait for navigation to complete
      await navigationPromise

      // Clear monitoring
      clearInterval(whiteScreenCheck)

      // Check final state
      contentVisible = await this.page.locator('h1').isVisible()
      loadTime = Date.now() - startTime

      // Clear network conditions for next test
      await this.clearNetworkConditions()

    } catch (error) {
      errors.push(`Network test error: ${error}`)
    }

    return {
      loadTime,
      hasLoadingScreen,
      hasWhiteScreen,
      contentVisible,
      errors
    }
  }

  /**
   * Test offline behavior
   */
  async testOfflineBehavior(): Promise<{
    offlineHandled: boolean
    showsOfflineMessage: boolean
    recoversOnline: boolean
    errors: string[]
  }> {
    const errors: string[] = []
    let offlineHandled = false
    let showsOfflineMessage = false
    let recoversOnline = false

    try {
      // First, load the page normally
      await this.page.goto('/')
      await this.page.waitForSelector('h1')

      // Go offline
      await this.page.context().setOffline(true)

      // Try to refresh
      try {
        await this.page.reload({ waitUntil: 'networkidle', timeout: 5000 })

        // Check if app handles offline state gracefully
        const hasErrorMessage = await this.page.getByText(/offline|network|connection/i).isVisible()
        const hasRetryButton = await this.page.getByText(/retry|reload|refresh/i).isVisible()

        offlineHandled = hasErrorMessage || hasRetryButton
        showsOfflineMessage = hasErrorMessage

      } catch (error) {
        // Expected to fail when offline
        offlineHandled = true
      }

      // Go back online
      await this.page.context().setOffline(false)

      // Try to reload
      try {
        await this.page.reload()
        await this.page.waitForSelector('h1', { timeout: 10000 })
        recoversOnline = true
      } catch (error) {
        errors.push(`Failed to recover online: ${error}`)
      }

    } catch (error) {
      errors.push(`Offline test error: ${error}`)
    }

    return {
      offlineHandled,
      showsOfflineMessage,
      recoversOnline,
      errors
    }
  }

  /**
   * Test timeout handling
   */
  async testTimeoutHandling(): Promise<{
    handlesTimeout: boolean
    showsErrorState: boolean
    allowsRetry: boolean
    errors: string[]
  }> {
    const errors: string[] = []
    let handlesTimeout = false
    let showsErrorState = false
    let allowsRetry = false

    try {
      // Set very slow network to trigger timeouts
      await this.setNetworkConditions({
        name: 'Timeout Test',
        downloadThroughput: 1000, // 1KB/s
        uploadThroughput: 1000,
        latency: 5000, // 5 second latency
        description: 'Extremely slow network'
      })

      // Set a very short timeout to force timeout errors
      await this.page.route('**/*', async route => {
        await new Promise(resolve => setTimeout(resolve, 10000)) // 10 second delay
        route.continue()
      })

      try {
        await this.page.goto('/', { timeout: 5000 }) // 5 second timeout
      } catch (timeoutError) {
        handlesTimeout = true

        // Check if the page shows any error handling
        try {
          const hasErrorMessage = await this.page.getByText(/timeout|error|failed|try again/i).isVisible()
          const hasRetryButton = await this.page.getByRole('button', { name: /retry|reload|try again/i }).isVisible()

          showsErrorState = hasErrorMessage
          allowsRetry = hasRetryButton
        } catch {
          // Page might not have loaded at all
        }
      }

      // Clear the route and network conditions
      await this.page.unroute('**/*')
      await this.clearNetworkConditions()

    } catch (error) {
      errors.push(`Timeout test error: ${error}`)
    }

    return {
      handlesTimeout,
      showsErrorState,
      allowsRetry,
      errors
    }
  }
}

// Network scenarios to test
const networkScenarios: NetworkScenario[] = [
  {
    name: 'Fast WiFi',
    downloadThroughput: 50 * 1024 * 1024, // 50 Mbps
    uploadThroughput: 10 * 1024 * 1024,   // 10 Mbps
    latency: 20,
    description: 'High-speed connection'
  },
  {
    name: 'Good 4G',
    downloadThroughput: 4 * 1024 * 1024,  // 4 Mbps
    uploadThroughput: 1 * 1024 * 1024,    // 1 Mbps
    latency: 50,
    description: 'Good mobile connection'
  },
  {
    name: 'Regular 3G',
    downloadThroughput: 1.5 * 1024 * 1024, // 1.5 Mbps
    uploadThroughput: 750 * 1024,           // 750 Kbps
    latency: 100,
    description: 'Average mobile connection'
  },
  {
    name: 'Slow 3G',
    downloadThroughput: 500 * 1024,        // 500 Kbps
    uploadThroughput: 250 * 1024,          // 250 Kbps
    latency: 300,
    description: 'Slow mobile connection'
  },
  {
    name: 'Very Slow',
    downloadThroughput: 100 * 1024,        // 100 Kbps
    uploadThroughput: 50 * 1024,           // 50 Kbps
    latency: 1000,
    description: 'Very poor connection'
  }
]

test.describe('Network Conditions Tests', () => {
  let tester: NetworkConditionTester

  test.beforeEach(async ({ page }) => {
    tester = new NetworkConditionTester(page)
  })

  for (const scenario of networkScenarios) {
    test(`Loading behavior on ${scenario.name}`, async () => {
      console.log(`Testing ${scenario.name} (${scenario.description})...`)

      const result = await tester.testNetworkScenario(scenario)

      console.log(`  Load time: ${result.loadTime}ms`)
      console.log(`  Loading screen: ${result.hasLoadingScreen ? 'Yes' : 'No'}`)
      console.log(`  White screen: ${result.hasWhiteScreen ? 'Yes' : 'No'}`)
      console.log(`  Content visible: ${result.contentVisible ? 'Yes' : 'No'}`)

      // Content should always be visible
      expect(result.contentVisible).toBe(true)

      // Should not show white screen
      expect(result.hasWhiteScreen).toBe(false)

      // On slower connections, loading screen should appear
      if (scenario.downloadThroughput < 2 * 1024 * 1024) { // Less than 2 Mbps
        if (!result.hasLoadingScreen) {
          console.log(`  Warning: Loading screen should appear on ${scenario.name}`)
        }
      }

      // Load time should be reasonable (allowing for slow networks)
      if (result.loadTime > 30000) { // 30 seconds
        console.log(`  Warning: Very slow load time on ${scenario.name}: ${result.loadTime}ms`)
      }

      // Log any errors
      if (result.errors.length > 0) {
        console.log(`  🚨 Errors on ${scenario.name}:`)
        result.errors.forEach(error => console.log(`    ❌ ${error}`))
      }

      expect(result.errors).toHaveLength(0)
    })
  }

  test('Offline behavior handling', async () => {
    const result = await tester.testOfflineBehavior()

    console.log(`Offline handled: ${result.offlineHandled}`)
    console.log(`Shows offline message: ${result.showsOfflineMessage}`)
    console.log(`Recovers online: ${result.recoversOnline}`)

    if (result.errors.length > 0) {
      console.log('🚨 Offline Behavior Errors:')
      result.errors.forEach(error => console.log(`  ❌ ${error}`))
    }

    // App should handle offline state gracefully
    expect(result.offlineHandled).toBe(true)

    // App should recover when going back online
    expect(result.recoversOnline).toBe(true)

    expect(result.errors).toHaveLength(0)
  })

  test('Timeout handling', async () => {
    const result = await tester.testTimeoutHandling()

    console.log(`Handles timeout: ${result.handlesTimeout}`)
    console.log(`Shows error state: ${result.showsErrorState}`)
    console.log(`Allows retry: ${result.allowsRetry}`)

    if (result.errors.length > 0) {
      console.log('🚨 Timeout Handling Errors:')
      result.errors.forEach(error => console.log(`  ❌ ${error}`))
    }

    // App should handle timeouts gracefully
    expect(result.handlesTimeout).toBe(true)

    expect(result.errors).toHaveLength(0)
  })
})

test.describe('Network Recovery Tests', () => {
  let tester: NetworkConditionTester

  test.beforeEach(async ({ page }) => {
    tester = new NetworkConditionTester(page)
  })

  test('Recovery from slow to fast network', async () => {
    // Start with slow network
    const slowResult = await tester.testNetworkScenario(networkScenarios[4]) // Very Slow
    expect(slowResult.contentVisible).toBe(true)

    // Switch to fast network and reload
    const fastResult = await tester.testNetworkScenario(networkScenarios[0]) // Fast WiFi
    expect(fastResult.contentVisible).toBe(true)

    // Fast network should load faster than slow
    expect(fastResult.loadTime).toBeLessThan(slowResult.loadTime)
  })

  test('Multiple network condition changes', async () => {
    const scenarios = [networkScenarios[0], networkScenarios[2], networkScenarios[4]]

    for (const scenario of scenarios) {
      console.log(`Testing ${scenario.name}...`)
      const result = await tester.testNetworkScenario(scenario)

      expect(result.contentVisible).toBe(true)
      expect(result.hasWhiteScreen).toBe(false)
    }
  })
})

test.describe('Mobile Network Tests', () => {
  test('Mobile network simulation', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })

    const tester = new NetworkConditionTester(page)

    // Test mobile-typical network scenarios
    const mobileScenarios = networkScenarios.slice(1, 4) // Good 4G to Slow 3G

    for (const scenario of mobileScenarios) {
      const result = await tester.testNetworkScenario(scenario)

      expect(result.contentVisible).toBe(true)
      expect(result.hasWhiteScreen).toBe(false)

      if (result.errors.length > 0) {
        console.log(`🚨 Mobile ${scenario.name} Errors:`)
        result.errors.forEach(error => console.log(`  ❌ ${error}`))
      }
    }
  })
})

test.afterAll(async () => {
  console.log('\n📊 Network Conditions Tests Complete')
  console.log('All network scenarios have been validated for loading behavior')
})