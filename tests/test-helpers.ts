import { test, expect, type Page, type BrowserContext } from '@playwright/test'

/**
 * Automated Test Helpers for Continuous White Screen Monitoring
 *
 * Utility functions and helpers for automated testing and monitoring
 * of white screen issues in the Personal Assistant app.
 */

export interface WhiteScreenCheckResult {
  isWhiteScreen: boolean
  reasons: string[]
  timestamp: number
  screenshot?: string
}

export interface LoadingMetrics {
  totalLoadTime: number
  timeToFirstContent: number
  timeToInteractive: number
  loadingScreenDuration: number
  hasWhiteScreenFlash: boolean
}

export interface TestSession {
  sessionId: string
  startTime: number
  endTime?: number
  tests: Array<{
    name: string
    passed: boolean
    duration: number
    errors: string[]
    metrics?: LoadingMetrics
  }>
}

/**
 * Quick white screen detection utility
 */
export class QuickWhiteScreenDetector {
  constructor(private page: Page) {}

  /**
   * Fast white screen check (under 1 second)
   */
  async quickCheck(): Promise<WhiteScreenCheckResult> {
    const timestamp = Date.now()
    const reasons: string[] = []
    let isWhiteScreen = false

    try {
      // Quick checks for essential elements
      const checks = await Promise.all([
        this.page.locator('main').isVisible(),
        this.page.locator('h1').isVisible(),
        this.page.locator('header').isVisible(),
        this.page.getByText('Personal Assistant').isVisible()
      ])

      const [hasMain, hasH1, hasHeader, hasTitle] = checks

      if (!hasMain) reasons.push('Main element missing')
      if (!hasH1) reasons.push('H1 element missing')
      if (!hasHeader) reasons.push('Header element missing')
      if (!hasTitle) reasons.push('App title missing')

      isWhiteScreen = !hasMain || !hasH1

      return {
        isWhiteScreen,
        reasons,
        timestamp
      }
    } catch (error) {
      return {
        isWhiteScreen: true,
        reasons: [`Error during quick check: ${error}`],
        timestamp
      }
    }
  }

  /**
   * Take screenshot if white screen detected
   */
  async checkAndScreenshot(testName: string): Promise<WhiteScreenCheckResult> {
    const result = await this.quickCheck()

    if (result.isWhiteScreen) {
      const screenshotPath = `test-results/white-screen-${testName}-${Date.now()}.png`
      await this.page.screenshot({
        path: screenshotPath,
        fullPage: true
      })
      result.screenshot = screenshotPath
    }

    return result
  }
}

/**
 * Loading metrics collector
 */
export class LoadingMetricsCollector {
  constructor(private page: Page) {}

  /**
   * Collect comprehensive loading metrics
   */
  async collectMetrics(): Promise<LoadingMetrics> {
    const startTime = Date.now()
    let timeToFirstContent = 0
    let timeToInteractive = 0
    let loadingScreenDuration = 0
    let hasWhiteScreenFlash = false

    try {
      // Monitor for first content
      const firstContentPromise = this.page.waitForSelector('h1', { timeout: 10000 })
        .then(() => Date.now() - startTime)
        .catch(() => 0)

      // Monitor for interactive elements
      const interactivePromise = this.page.waitForLoadState('networkidle', { timeout: 15000 })
        .then(() => Date.now() - startTime)
        .catch(() => 0)

      // Monitor loading screen
      const loadingStart = Date.now()
      try {
        await this.page.waitForSelector('.animate-spin, [data-testid="loading-spinner"]', { timeout: 3000 })
        await this.page.waitForSelector('.animate-spin, [data-testid="loading-spinner"]', {
          state: 'hidden',
          timeout: 10000
        })
        loadingScreenDuration = Date.now() - loadingStart
      } catch {
        // Loading screen might not appear
        loadingScreenDuration = 0
      }

      // Check for white screen flashes
      const whiteScreenCheck = setInterval(async () => {
        try {
          const hasContent = await this.page.locator('main, h1').isVisible()
          const hasLoader = await this.page.locator('.animate-spin').isVisible()
          if (!hasContent && !hasLoader) {
            hasWhiteScreenFlash = true
          }
        } catch {
          // Ignore errors
        }
      }, 100)

      // Wait for all metrics
      const [firstContent, interactive] = await Promise.all([
        firstContentPromise,
        interactivePromise
      ])

      clearInterval(whiteScreenCheck)

      timeToFirstContent = firstContent
      timeToInteractive = interactive

      return {
        totalLoadTime: Date.now() - startTime,
        timeToFirstContent,
        timeToInteractive,
        loadingScreenDuration,
        hasWhiteScreenFlash
      }
    } catch (error) {
      return {
        totalLoadTime: Date.now() - startTime,
        timeToFirstContent: 0,
        timeToInteractive: 0,
        loadingScreenDuration: 0,
        hasWhiteScreenFlash: true
      }
    }
  }
}

/**
 * Automated test session manager
 */
export class TestSessionManager {
  private session: TestSession

  constructor() {
    this.session = {
      sessionId: `session-${Date.now()}`,
      startTime: Date.now(),
      tests: []
    }
  }

  /**
   * Record test result
   */
  recordTest(name: string, passed: boolean, duration: number, errors: string[] = [], metrics?: LoadingMetrics): void {
    this.session.tests.push({
      name,
      passed,
      duration,
      errors,
      metrics
    })
  }

  /**
   * End session and generate report
   */
  endSession(): TestSession {
    this.session.endTime = Date.now()
    return this.session
  }

  /**
   * Generate summary report
   */
  generateReport(): string {
    const totalTests = this.session.tests.length
    const passedTests = this.session.tests.filter(t => t.passed).length
    const failedTests = totalTests - passedTests
    const avgDuration = this.session.tests.reduce((sum, t) => sum + t.duration, 0) / totalTests

    let report = `\n📊 Test Session Report (${this.session.sessionId})\n`
    report += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`
    report += `Total Tests: ${totalTests}\n`
    report += `Passed: ${passedTests} ✅\n`
    report += `Failed: ${failedTests} ❌\n`
    report += `Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%\n`
    report += `Average Duration: ${avgDuration.toFixed(0)}ms\n`
    report += `Session Duration: ${((this.session.endTime! - this.session.startTime) / 1000).toFixed(1)}s\n\n`

    if (failedTests > 0) {
      report += `❌ Failed Tests:\n`
      this.session.tests
        .filter(t => !t.passed)
        .forEach(test => {
          report += `  • ${test.name} (${test.duration}ms)\n`
          test.errors.forEach(error => {
            report += `    - ${error}\n`
          })
        })
      report += `\n`
    }

    // Metrics summary
    const testsWithMetrics = this.session.tests.filter(t => t.metrics)
    if (testsWithMetrics.length > 0) {
      const avgLoadTime = testsWithMetrics.reduce((sum, t) => sum + t.metrics!.totalLoadTime, 0) / testsWithMetrics.length
      const whiteScreenFlashes = testsWithMetrics.filter(t => t.metrics!.hasWhiteScreenFlash).length

      report += `📈 Performance Metrics:\n`
      report += `Average Load Time: ${avgLoadTime.toFixed(0)}ms\n`
      report += `White Screen Flashes: ${whiteScreenFlashes}/${testsWithMetrics.length}\n\n`
    }

    return report
  }
}

/**
 * Utility functions for test automation
 */
export class TestUtils {
  /**
   * Wait for app to be ready
   */
  static async waitForAppReady(page: Page, timeout = 10000): Promise<boolean> {
    try {
      await page.waitForSelector('h1', { timeout })
      await page.waitForLoadState('networkidle', { timeout })
      return true
    } catch {
      return false
    }
  }

  /**
   * Run a test with automatic error capturing
   */
  static async runTestWithCapture(
    page: Page,
    testName: string,
    testFn: () => Promise<void>
  ): Promise<{ passed: boolean; duration: number; errors: string[] }> {
    const errors: string[] = []
    const startTime = Date.now()

    // Capture console errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(`Console: ${msg.text()}`)
      }
    })

    page.on('pageerror', error => {
      errors.push(`Page: ${error.message}`)
    })

    try {
      await testFn()
      return {
        passed: true,
        duration: Date.now() - startTime,
        errors
      }
    } catch (error) {
      errors.push(`Test Error: ${error}`)
      return {
        passed: false,
        duration: Date.now() - startTime,
        errors
      }
    }
  }

  /**
   * Take diagnostic screenshots
   */
  static async takeDiagnosticScreenshots(page: Page, prefix: string): Promise<string[]> {
    const screenshots: string[] = []

    try {
      // Full page screenshot
      const fullPagePath = `test-results/${prefix}-full-page.png`
      await page.screenshot({ path: fullPagePath, fullPage: true })
      screenshots.push(fullPagePath)

      // Viewport screenshot
      const viewportPath = `test-results/${prefix}-viewport.png`
      await page.screenshot({ path: viewportPath, fullPage: false })
      screenshots.push(viewportPath)

    } catch (error) {
      console.log(`Error taking screenshots: ${error}`)
    }

    return screenshots
  }

  /**
   * Get page performance metrics
   */
  static async getPerformanceMetrics(page: Page): Promise<any> {
    try {
      return await page.evaluate(() => {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
        return {
          domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
          loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
          firstPaint: performance.getEntriesByName('first-paint')[0]?.startTime || 0,
          firstContentfulPaint: performance.getEntriesByName('first-contentful-paint')[0]?.startTime || 0
        }
      })
    } catch {
      return null
    }
  }

  /**
   * Check if service worker is active
   */
  static async checkServiceWorker(page: Page): Promise<boolean> {
    try {
      return await page.evaluate(() => {
        return 'serviceWorker' in navigator && navigator.serviceWorker.controller !== null
      })
    } catch {
      return false
    }
  }

  /**
   * Clear all browser data
   */
  static async clearBrowserData(context: BrowserContext): Promise<void> {
    try {
      await context.clearCookies()
      await context.clearPermissions()
    } catch (error) {
      console.log(`Error clearing browser data: ${error}`)
    }
  }
}

/**
 * Continuous monitoring functions
 */
export class ContinuousMonitor {
  private isMonitoring = false
  private monitoringInterval?: NodeJS.Timeout

  constructor(private page: Page, private onIssueDetected?: (issue: WhiteScreenCheckResult) => void) {}

  /**
   * Start continuous monitoring
   */
  startMonitoring(intervalMs = 5000): void {
    if (this.isMonitoring) return

    this.isMonitoring = true
    const detector = new QuickWhiteScreenDetector(this.page)

    this.monitoringInterval = setInterval(async () => {
      try {
        const result = await detector.quickCheck()
        if (result.isWhiteScreen && this.onIssueDetected) {
          this.onIssueDetected(result)
        }
      } catch (error) {
        console.log(`Monitoring error: ${error}`)
      }
    }, intervalMs)
  }

  /**
   * Stop continuous monitoring
   */
  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval)
      this.monitoringInterval = undefined
    }
    this.isMonitoring = false
  }
}

/**
 * Pre-built test suites for common scenarios
 */
export class QuickTestSuites {
  /**
   * Run basic white screen detection
   */
  static async runBasicWhiteScreenTest(page: Page): Promise<boolean> {
    const detector = new QuickWhiteScreenDetector(page)
    await page.goto('/')
    const result = await detector.quickCheck()
    return !result.isWhiteScreen
  }

  /**
   * Run loading performance test
   */
  static async runLoadingPerformanceTest(page: Page): Promise<LoadingMetrics> {
    const collector = new LoadingMetricsCollector(page)
    await page.goto('/')
    return await collector.collectMetrics()
  }

  /**
   * Run cross-browser consistency test
   */
  static async runCrossBrowserTest(page: Page, browserName: string): Promise<boolean> {
    console.log(`Testing ${browserName}...`)
    await page.goto('/')
    await TestUtils.waitForAppReady(page)

    const detector = new QuickWhiteScreenDetector(page)
    const result = await detector.quickCheck()

    return !result.isWhiteScreen
  }
}

// All classes are already exported above with 'export class' declarations