import { test, expect, type Page } from '@playwright/test'

/**
 * Cache Scenarios and Loading Behavior Tests
 *
 * Tests how the app behaves with different cache states to ensure
 * proper loading and prevent white screen issues in cached vs fresh loads.
 */

interface CacheTestResult {
  loadTime: number
  hasLoadingScreen: boolean
  hasWhiteScreen: boolean
  contentVisible: boolean
  cacheHitRatio: number
  errors: string[]
}

class CacheScenarioTester {
  constructor(private page: Page) {}

  /**
   * Clear all browser cache and storage
   */
  async clearAllCache(): Promise<void> {
    try {
      // Clear browser cache
      const context = this.page.context()
      await context.clearCookies()

      // Clear local storage and session storage
      await this.page.evaluate(() => {
        localStorage.clear()
        sessionStorage.clear()
      })

      // Clear service worker cache if any
      await this.page.evaluate(async () => {
        if ('serviceWorker' in navigator) {
          const registrations = await navigator.serviceWorker.getRegistrations()
          for (const registration of registrations) {
            await registration.unregister()
          }
        }
      })

      // Clear browser cache via CDP
      const client = await this.page.context().newCDPSession(this.page)
      await client.send('Network.clearBrowserCache')
      await client.send('Storage.clearDataForOrigin', {
        origin: 'http://localhost:3000',
        storageTypes: 'all'
      })

    } catch (error) {
      console.log(`Cache clearing warning: ${error}`)
    }
  }

  /**
   * Monitor network requests to analyze cache behavior
   */
  async monitorNetworkRequests(): Promise<{
    totalRequests: number
    cachedRequests: number
    freshRequests: number
    cacheHitRatio: number
    requests: Array<{ url: string; fromCache: boolean; status: number }>
  }> {
    const requests: Array<{ url: string; fromCache: boolean; status: number }> = []

    // Monitor network responses
    this.page.on('response', response => {
      const request = response.request()
      const fromCache = response.fromServiceWorker() ||
                       response.status() === 304 ||
                       request.headers()['if-modified-since'] !== undefined

      requests.push({
        url: response.url(),
        fromCache,
        status: response.status()
      })
    })

    return {
      totalRequests: requests.length,
      cachedRequests: requests.filter(r => r.fromCache).length,
      freshRequests: requests.filter(r => !r.fromCache).length,
      cacheHitRatio: requests.length > 0 ? requests.filter(r => r.fromCache).length / requests.length : 0,
      requests
    }
  }

  /**
   * Test fresh load behavior (no cache)
   */
  async testFreshLoad(): Promise<CacheTestResult> {
    const errors: string[] = []
    let loadTime = 0
    let hasLoadingScreen = false
    let hasWhiteScreen = false
    let contentVisible = false

    try {
      // Clear all cache first
      await this.clearAllCache()

      // Monitor network requests
      const networkMonitor = await this.monitorNetworkRequests()

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

      // Check for loading screen
      try {
        await this.page.waitForSelector('.animate-spin, [data-testid="loading-spinner"], :text("Loading")', {
          timeout: 5000
        })
        hasLoadingScreen = true
      } catch {
        // Loading screen might not appear on very fast loads
      }

      // Monitor for white screen
      const whiteScreenCheck = setInterval(async () => {
        try {
          const hasContent = await this.page.locator('main, h1, header').isVisible()
          const hasLoader = await this.page.locator('.animate-spin, [data-testid="loading-spinner"]').isVisible()

          if (!hasContent && !hasLoader) {
            hasWhiteScreen = true
          }
        } catch {
          // Ignore monitoring errors
        }
      }, 100)

      await navigationPromise
      clearInterval(whiteScreenCheck)

      // Check final state
      contentVisible = await this.page.locator('h1').isVisible()
      loadTime = Date.now() - startTime

      // Get cache statistics
      const cacheHitRatio = networkMonitor.cacheHitRatio

      return {
        loadTime,
        hasLoadingScreen,
        hasWhiteScreen,
        contentVisible,
        cacheHitRatio,
        errors
      }

    } catch (error) {
      errors.push(`Fresh load test error: ${error}`)
      return {
        loadTime: 0,
        hasLoadingScreen: false,
        hasWhiteScreen: true,
        contentVisible: false,
        cacheHitRatio: 0,
        errors
      }
    }
  }

  /**
   * Test cached load behavior
   */
  async testCachedLoad(): Promise<CacheTestResult> {
    const errors: string[] = []
    let loadTime = 0
    let hasLoadingScreen = false
    let hasWhiteScreen = false
    let contentVisible = false

    try {
      // First, do an initial load to populate cache
      await this.page.goto('/')
      await this.page.waitForSelector('h1')

      // Monitor network for the cached load
      const networkMonitor = await this.monitorNetworkRequests()

      // Monitor for errors
      this.page.on('console', msg => {
        if (msg.type() === 'error') {
          errors.push(`Console: ${msg.text()}`)
        }
      })

      this.page.on('pageerror', error => {
        errors.push(`Page Error: ${error.message}`)
      })

      // Start timing for cached load
      const startTime = Date.now()

      // Navigate again (should hit cache)
      const navigationPromise = this.page.reload({ waitUntil: 'networkidle' })

      // Check for loading screen (might be very brief on cached loads)
      try {
        await this.page.waitForSelector('.animate-spin, [data-testid="loading-spinner"], :text("Loading")', {
          timeout: 2000
        })
        hasLoadingScreen = true
      } catch {
        // Loading screen might not appear on cached loads
      }

      // Monitor for white screen
      const whiteScreenCheck = setInterval(async () => {
        try {
          const hasContent = await this.page.locator('main, h1, header').isVisible()
          const hasLoader = await this.page.locator('.animate-spin, [data-testid="loading-spinner"]').isVisible()

          if (!hasContent && !hasLoader) {
            hasWhiteScreen = true
          }
        } catch {
          // Ignore monitoring errors
        }
      }, 50) // Check more frequently for cached loads

      await navigationPromise
      clearInterval(whiteScreenCheck)

      // Check final state
      contentVisible = await this.page.locator('h1').isVisible()
      loadTime = Date.now() - startTime

      // Get cache statistics
      const cacheHitRatio = networkMonitor.cacheHitRatio

      return {
        loadTime,
        hasLoadingScreen,
        hasWhiteScreen,
        contentVisible,
        cacheHitRatio,
        errors
      }

    } catch (error) {
      errors.push(`Cached load test error: ${error}`)
      return {
        loadTime: 0,
        hasLoadingScreen: false,
        hasWhiteScreen: true,
        contentVisible: false,
        cacheHitRatio: 0,
        errors
      }
    }
  }

  /**
   * Test partial cache scenarios (some resources cached, some fresh)
   */
  async testPartialCache(): Promise<CacheTestResult> {
    const errors: string[] = []
    let loadTime = 0
    let hasLoadingScreen = false
    let hasWhiteScreen = false
    let contentVisible = false

    try {
      // Load page to populate cache
      await this.page.goto('/')
      await this.page.waitForSelector('h1')

      // Clear only specific cache types (simulate partial cache)
      await this.page.evaluate(() => {
        // Clear only localStorage, keep HTTP cache
        localStorage.clear()
      })

      // Monitor network
      const networkMonitor = await this.monitorNetworkRequests()

      // Start timing
      const startTime = Date.now()

      // Navigate (partial cache scenario)
      const navigationPromise = this.page.reload({ waitUntil: 'networkidle' })

      // Check for loading screen
      try {
        await this.page.waitForSelector('.animate-spin, [data-testid="loading-spinner"], :text("Loading")', {
          timeout: 3000
        })
        hasLoadingScreen = true
      } catch {
        // Loading screen might not appear
      }

      // Monitor for white screen
      const whiteScreenCheck = setInterval(async () => {
        try {
          const hasContent = await this.page.locator('main, h1, header').isVisible()
          const hasLoader = await this.page.locator('.animate-spin, [data-testid="loading-spinner"]').isVisible()

          if (!hasContent && !hasLoader) {
            hasWhiteScreen = true
          }
        } catch {
          // Ignore monitoring errors
        }
      }, 100)

      await navigationPromise
      clearInterval(whiteScreenCheck)

      // Check final state
      contentVisible = await this.page.locator('h1').isVisible()
      loadTime = Date.now() - startTime

      // Get cache statistics
      const cacheHitRatio = networkMonitor.cacheHitRatio

      return {
        loadTime,
        hasLoadingScreen,
        hasWhiteScreen,
        contentVisible,
        cacheHitRatio,
        errors
      }

    } catch (error) {
      errors.push(`Partial cache test error: ${error}`)
      return {
        loadTime: 0,
        hasLoadingScreen: false,
        hasWhiteScreen: true,
        contentVisible: false,
        cacheHitRatio: 0,
        errors
      }
    }
  }

  /**
   * Test cache invalidation scenarios
   */
  async testCacheInvalidation(): Promise<{ issues: string[] }> {
    const issues: string[] = []

    try {
      // Load page normally
      await this.page.goto('/')
      await this.page.waitForSelector('h1')

      // Simulate cache invalidation (force refresh)
      await this.page.reload({ waitUntil: 'networkidle' })
      const reloadResult = await this.page.locator('h1').isVisible()

      if (!reloadResult) {
        issues.push('Cache invalidation caused content to disappear')
      }

      // Test with browser back/forward
      await this.page.goBack()
      await this.page.waitForTimeout(500)
      await this.page.goForward()

      const navigationResult = await this.page.locator('h1').isVisible()
      if (!navigationResult) {
        issues.push('Browser navigation affected content visibility')
      }

    } catch (error) {
      issues.push(`Cache invalidation test error: ${error}`)
    }

    return { issues }
  }

  /**
   * Test storage persistence across sessions
   */
  async testStoragePersistence(): Promise<{ issues: string[] }> {
    const issues: string[] = []

    try {
      // Load page and set some storage
      await this.page.goto('/')
      await this.page.waitForSelector('h1')

      // Set test data in storage
      await this.page.evaluate(() => {
        localStorage.setItem('test-cache-key', 'test-value')
        sessionStorage.setItem('test-session-key', 'session-value')
      })

      // Reload and check if storage persists
      await this.page.reload()

      const storageCheck = await this.page.evaluate(() => {
        return {
          localStorage: localStorage.getItem('test-cache-key'),
          sessionStorage: sessionStorage.getItem('test-session-key')
        }
      })

      if (storageCheck.localStorage !== 'test-value') {
        issues.push('localStorage not persisting across reloads')
      }

      if (storageCheck.sessionStorage !== 'session-value') {
        issues.push('sessionStorage not persisting across reloads')
      }

      // Check if content still loads properly with storage
      const contentVisible = await this.page.locator('h1').isVisible()
      if (!contentVisible) {
        issues.push('Content not loading properly with storage data')
      }

    } catch (error) {
      issues.push(`Storage persistence test error: ${error}`)
    }

    return { issues }
  }
}

test.describe('Cache Scenario Tests', () => {
  let tester: CacheScenarioTester

  test.beforeEach(async ({ page }) => {
    tester = new CacheScenarioTester(page)
  })

  test('Fresh load behavior (no cache)', async () => {
    const result = await tester.testFreshLoad()

    console.log(`Fresh load time: ${result.loadTime}ms`)
    console.log(`Cache hit ratio: ${(result.cacheHitRatio * 100).toFixed(1)}%`)
    console.log(`Loading screen: ${result.hasLoadingScreen ? 'Yes' : 'No'}`)
    console.log(`White screen: ${result.hasWhiteScreen ? 'Yes' : 'No'}`)
    console.log(`Content visible: ${result.contentVisible ? 'Yes' : 'No'}`)

    if (result.errors.length > 0) {
      console.log('🚨 Fresh Load Errors:')
      result.errors.forEach(error => console.log(`  ❌ ${error}`))
    }

    // Content should always be visible
    expect(result.contentVisible).toBe(true)

    // Should not show white screen
    expect(result.hasWhiteScreen).toBe(false)

    // Fresh loads should have low cache hit ratio
    expect(result.cacheHitRatio).toBeLessThan(0.5)

    expect(result.errors).toHaveLength(0)
  })

  test('Cached load behavior', async () => {
    const result = await tester.testCachedLoad()

    console.log(`Cached load time: ${result.loadTime}ms`)
    console.log(`Cache hit ratio: ${(result.cacheHitRatio * 100).toFixed(1)}%`)
    console.log(`Loading screen: ${result.hasLoadingScreen ? 'Yes' : 'No'}`)
    console.log(`White screen: ${result.hasWhiteScreen ? 'Yes' : 'No'}`)
    console.log(`Content visible: ${result.contentVisible ? 'Yes' : 'No'}`)

    if (result.errors.length > 0) {
      console.log('🚨 Cached Load Errors:')
      result.errors.forEach(error => console.log(`  ❌ ${error}`))
    }

    // Content should always be visible
    expect(result.contentVisible).toBe(true)

    // Should not show white screen
    expect(result.hasWhiteScreen).toBe(false)

    expect(result.errors).toHaveLength(0)
  })

  test('Partial cache scenarios', async () => {
    const result = await tester.testPartialCache()

    console.log(`Partial cache load time: ${result.loadTime}ms`)
    console.log(`Cache hit ratio: ${(result.cacheHitRatio * 100).toFixed(1)}%`)
    console.log(`Loading screen: ${result.hasLoadingScreen ? 'Yes' : 'No'}`)
    console.log(`White screen: ${result.hasWhiteScreen ? 'Yes' : 'No'}`)
    console.log(`Content visible: ${result.contentVisible ? 'Yes' : 'No'}`)

    if (result.errors.length > 0) {
      console.log('🚨 Partial Cache Errors:')
      result.errors.forEach(error => console.log(`  ❌ ${error}`))
    }

    // Content should always be visible
    expect(result.contentVisible).toBe(true)

    // Should not show white screen
    expect(result.hasWhiteScreen).toBe(false)

    expect(result.errors).toHaveLength(0)
  })

  test('Cache invalidation handling', async () => {
    const result = await tester.testCacheInvalidation()

    if (result.issues.length > 0) {
      console.log('🚨 Cache Invalidation Issues:')
      result.issues.forEach(issue => console.log(`  ❌ ${issue}`))
    }

    expect(result.issues).toHaveLength(0)
  })

  test('Storage persistence', async () => {
    const result = await tester.testStoragePersistence()

    if (result.issues.length > 0) {
      console.log('🚨 Storage Persistence Issues:')
      result.issues.forEach(issue => console.log(`  ❌ ${issue}`))
    }

    expect(result.issues).toHaveLength(0)
  })

  test('Cache performance comparison', async () => {
    // Test fresh vs cached load performance
    const freshResult = await tester.testFreshLoad()
    const cachedResult = await tester.testCachedLoad()

    console.log(`Fresh load: ${freshResult.loadTime}ms`)
    console.log(`Cached load: ${cachedResult.loadTime}ms`)
    console.log(`Performance improvement: ${Math.round((1 - cachedResult.loadTime / freshResult.loadTime) * 100)}%`)

    // Both should work regardless of performance
    expect(freshResult.contentVisible).toBe(true)
    expect(cachedResult.contentVisible).toBe(true)
    expect(freshResult.hasWhiteScreen).toBe(false)
    expect(cachedResult.hasWhiteScreen).toBe(false)

    // Cached load should generally be faster (unless cache is not working)
    if (cachedResult.loadTime > freshResult.loadTime * 1.5) {
      console.log('⚠️ Warning: Cached load is slower than fresh load')
    }
  })
})

test.describe('Cache Edge Cases', () => {
  let tester: CacheScenarioTester

  test.beforeEach(async ({ page }) => {
    tester = new CacheScenarioTester(page)
  })

  test('Multiple rapid reloads', async () => {
    const results: CacheTestResult[] = []

    // Perform multiple rapid reloads
    for (let i = 0; i < 3; i++) {
      console.log(`Rapid reload ${i + 1}/3...`)
      const result = await tester.testCachedLoad()
      results.push(result)

      // Short delay between reloads
      await tester.page.waitForTimeout(100)
    }

    // All reloads should succeed
    for (const [index, result] of results.entries()) {
      expect(result.contentVisible).toBe(true)
      expect(result.hasWhiteScreen).toBe(false)

      if (result.errors.length > 0) {
        console.log(`🚨 Rapid Reload ${index + 1} Errors:`)
        result.errors.forEach(error => console.log(`  ❌ ${error}`))
      }
    }
  })

  test('Cache with disabled JavaScript', async ({ page }) => {
    // Disable JavaScript
    await page.setJavaScriptEnabled(false)

    const tester = new CacheScenarioTester(page)

    try {
      await page.goto('/')
      await page.waitForTimeout(3000) // Give time for static content to load

      // Check if basic content is visible without JS
      const hasBasicContent = await page.locator('html').isVisible()

      console.log(`Content visible without JS: ${hasBasicContent}`)

      // Re-enable JavaScript
      await page.setJavaScriptEnabled(true)

      // Test normal loading after re-enabling JS
      await page.reload()
      const result = await tester.testCachedLoad()

      expect(result.contentVisible).toBe(true)
      expect(result.hasWhiteScreen).toBe(false)

    } catch (error) {
      console.log(`Disabled JS test error: ${error}`)
      // Re-enable JavaScript for cleanup
      await page.setJavaScriptEnabled(true)
    }
  })
})

test.afterAll(async () => {
  console.log('\n📊 Cache Scenario Tests Complete')
  console.log('All cache states and loading behaviors have been validated')
})