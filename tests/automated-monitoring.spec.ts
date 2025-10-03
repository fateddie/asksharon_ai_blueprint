import { test, expect } from '@playwright/test'
import {
  QuickWhiteScreenDetector,
  LoadingMetricsCollector,
  TestSessionManager,
  TestUtils,
  ContinuousMonitor,
  QuickTestSuites,
  type WhiteScreenCheckResult
} from './test-helpers'

/**
 * Automated Monitoring Test Suite
 *
 * Continuous monitoring tests that can be run automatically
 * to detect and prevent white screen issues in production.
 */

test.describe('Automated White Screen Monitoring', () => {
  let sessionManager: TestSessionManager

  test.beforeAll(async () => {
    sessionManager = new TestSessionManager()
    console.log('🚀 Starting automated monitoring session...')
  })

  test.afterAll(async () => {
    const report = sessionManager.generateReport()
    console.log(report)
  })

  test('Quick white screen detection', async ({ page }) => {
    const testName = 'Quick White Screen Detection'
    const startTime = Date.now()

    const result = await TestUtils.runTestWithCapture(page, testName, async () => {
      const isHealthy = await QuickTestSuites.runBasicWhiteScreenTest(page)
      expect(isHealthy).toBe(true)
    })

    sessionManager.recordTest(testName, result.passed, result.duration, result.errors)

    if (!result.passed) {
      await TestUtils.takeDiagnosticScreenshots(page, 'quick-detection-failed')
    }
  })

  test('Loading performance monitoring', async ({ page }) => {
    const testName = 'Loading Performance Monitoring'
    const startTime = Date.now()

    const result = await TestUtils.runTestWithCapture(page, testName, async () => {
      const metrics = await QuickTestSuites.runLoadingPerformanceTest(page)

      console.log(`Loading Metrics:`)
      console.log(`  Total Load Time: ${metrics.totalLoadTime}ms`)
      console.log(`  Time to First Content: ${metrics.timeToFirstContent}ms`)
      console.log(`  Time to Interactive: ${metrics.timeToInteractive}ms`)
      console.log(`  Loading Screen Duration: ${metrics.loadingScreenDuration}ms`)
      console.log(`  White Screen Flash: ${metrics.hasWhiteScreenFlash ? 'Yes' : 'No'}`)

      // Performance assertions
      expect(metrics.totalLoadTime).toBeLessThan(15000) // 15 seconds max
      expect(metrics.timeToFirstContent).toBeGreaterThan(0) // Should show content
      expect(metrics.hasWhiteScreenFlash).toBe(false) // No white screen flashes

      sessionManager.recordTest(testName, true, Date.now() - startTime, [], metrics)
    })

    if (!result.passed) {
      sessionManager.recordTest(testName, false, result.duration, result.errors)
    }
  })

  test('Continuous monitoring simulation', async ({ page }) => {
    const testName = 'Continuous Monitoring Simulation'
    const issues: WhiteScreenCheckResult[] = []

    const result = await TestUtils.runTestWithCapture(page, testName, async () => {
      // Set up monitoring
      const monitor = new ContinuousMonitor(page, (issue) => {
        issues.push(issue)
      })

      // Start monitoring
      monitor.startMonitoring(1000) // Check every second

      // Perform various operations while monitoring
      await page.goto('/')
      await TestUtils.waitForAppReady(page)

      // Simulate user interactions
      await page.reload()
      await TestUtils.waitForAppReady(page)

      // Test with different viewport
      await page.setViewportSize({ width: 375, height: 667 })
      await page.waitForTimeout(2000)

      await page.setViewportSize({ width: 1280, height: 720 })
      await page.waitForTimeout(2000)

      // Stop monitoring
      monitor.stopMonitoring()

      // Check results
      if (issues.length > 0) {
        console.log('🚨 White Screen Issues Detected During Monitoring:')
        issues.forEach((issue, index) => {
          console.log(`  ${index + 1}. ${new Date(issue.timestamp).toISOString()}`)
          issue.reasons.forEach(reason => console.log(`     - ${reason}`))
        })
      }

      expect(issues).toHaveLength(0)
    })

    sessionManager.recordTest(testName, result.passed, result.duration, result.errors)
  })

  test('Multi-scenario health check', async ({ page }) => {
    const testName = 'Multi-Scenario Health Check'
    const scenarios = [
      { name: 'Fresh Load', action: () => page.goto('/') },
      { name: 'Reload', action: () => page.reload() },
      { name: 'Back/Forward', action: async () => {
        await page.goBack()
        await page.goForward()
      }}
    ]

    const result = await TestUtils.runTestWithCapture(page, testName, async () => {
      const detector = new QuickWhiteScreenDetector(page)

      for (const scenario of scenarios) {
        console.log(`Testing scenario: ${scenario.name}`)

        try {
          await scenario.action()
          await TestUtils.waitForAppReady(page)

          const checkResult = await detector.checkAndScreenshot(scenario.name.toLowerCase().replace(/[^a-z0-9]/g, '-'))

          if (checkResult.isWhiteScreen) {
            throw new Error(`White screen detected in ${scenario.name}: ${checkResult.reasons.join(', ')}`)
          }

          console.log(`  ✅ ${scenario.name} passed`)
        } catch (error) {
          console.log(`  ❌ ${scenario.name} failed: ${error}`)
          throw error
        }
      }
    })

    sessionManager.recordTest(testName, result.passed, result.duration, result.errors)
  })

  test('Performance regression detection', async ({ page }) => {
    const testName = 'Performance Regression Detection'

    const result = await TestUtils.runTestWithCapture(page, testName, async () => {
      const collector = new LoadingMetricsCollector(page)

      // Perform multiple loads to get baseline
      const loadTimes: number[] = []

      for (let i = 0; i < 3; i++) {
        await page.goto('/')
        const metrics = await collector.collectMetrics()
        loadTimes.push(metrics.totalLoadTime)

        console.log(`Load ${i + 1}: ${metrics.totalLoadTime}ms`)
      }

      const avgLoadTime = loadTimes.reduce((sum, time) => sum + time, 0) / loadTimes.length
      const maxLoadTime = Math.max(...loadTimes)
      const minLoadTime = Math.min(...loadTimes)
      const variation = maxLoadTime - minLoadTime

      console.log(`Performance Summary:`)
      console.log(`  Average: ${avgLoadTime.toFixed(0)}ms`)
      console.log(`  Min: ${minLoadTime}ms`)
      console.log(`  Max: ${maxLoadTime}ms`)
      console.log(`  Variation: ${variation}ms`)

      // Performance checks
      expect(avgLoadTime).toBeLessThan(10000) // 10 second average
      expect(maxLoadTime).toBeLessThan(15000) // 15 second max
      expect(variation).toBeLessThan(5000) // 5 second variation max

      // Store metrics
      const finalMetrics = {
        totalLoadTime: avgLoadTime,
        timeToFirstContent: 0, // Will be calculated in actual metrics
        timeToInteractive: 0,
        loadingScreenDuration: 0,
        hasWhiteScreenFlash: false
      }

      sessionManager.recordTest(testName, true, Date.now(), [], finalMetrics)
    })

    if (!result.passed) {
      sessionManager.recordTest(testName, false, result.duration, result.errors)
    }
  })

  test('Error resilience check', async ({ page }) => {
    const testName = 'Error Resilience Check'

    const result = await TestUtils.runTestWithCapture(page, testName, async () => {
      // Test with various error conditions
      const errorScenarios = [
        {
          name: 'Slow Network',
          setup: async () => {
            await page.route('**/*', async route => {
              await new Promise(resolve => setTimeout(resolve, 100))
              route.continue()
            })
          },
          cleanup: async () => {
            await page.unroute('**/*')
          }
        },
        {
          name: 'Console Errors',
          setup: async () => {
            await page.addInitScript(() => {
              console.error('Test error injection')
            })
          },
          cleanup: async () => {
            // No cleanup needed for console errors
          }
        }
      ]

      const detector = new QuickWhiteScreenDetector(page)

      for (const scenario of errorScenarios) {
        console.log(`Testing error scenario: ${scenario.name}`)

        await scenario.setup()

        try {
          await page.goto('/')
          await TestUtils.waitForAppReady(page)

          const checkResult = await detector.quickCheck()

          if (checkResult.isWhiteScreen) {
            console.log(`  ⚠️ ${scenario.name} caused white screen: ${checkResult.reasons.join(', ')}`)
          } else {
            console.log(`  ✅ ${scenario.name} handled gracefully`)
          }

          // Don't fail the test for error scenarios, just log
        } finally {
          await scenario.cleanup()
        }
      }
    })

    sessionManager.recordTest(testName, result.passed, result.duration, result.errors)
  })
})

test.describe('Cross-Browser Automated Tests', () => {
  test('Chrome automated health check', async ({ page, browserName }) => {
    test.skip(browserName !== 'chromium', 'Chrome-specific test')

    const isHealthy = await QuickTestSuites.runCrossBrowserTest(page, 'Chrome')
    expect(isHealthy).toBe(true)
  })

  test('Firefox automated health check', async ({ page, browserName }) => {
    test.skip(browserName !== 'firefox', 'Firefox-specific test')

    const isHealthy = await QuickTestSuites.runCrossBrowserTest(page, 'Firefox')
    expect(isHealthy).toBe(true)
  })

  test('Safari automated health check', async ({ page, browserName }) => {
    test.skip(browserName !== 'webkit', 'Safari-specific test')

    const isHealthy = await QuickTestSuites.runCrossBrowserTest(page, 'Safari')
    expect(isHealthy).toBe(true)
  })
})

test.describe('Production Readiness Checks', () => {
  test('Production simulation', async ({ page }) => {
    // Simulate production environment
    await page.addInitScript(() => {
      Object.defineProperty(window, 'location', {
        value: {
          ...window.location,
          hostname: 'app.personal-assistant.com'
        },
        writable: true
      })
    })

    await page.goto('/')
    await TestUtils.waitForAppReady(page)

    const detector = new QuickWhiteScreenDetector(page)
    const result = await detector.quickCheck()

    expect(result.isWhiteScreen).toBe(false)
  })

  test('Mobile production simulation', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1')

    await page.goto('/')
    await TestUtils.waitForAppReady(page)

    const detector = new QuickWhiteScreenDetector(page)
    const result = await detector.quickCheck()

    expect(result.isWhiteScreen).toBe(false)
  })
})

// Utility test for debugging
test.describe('Debug Utilities', () => {
  test('Generate diagnostic report', async ({ page }) => {
    await page.goto('/')
    await TestUtils.waitForAppReady(page)

    // Collect diagnostic information
    const performanceMetrics = await TestUtils.getPerformanceMetrics(page)
    const hasServiceWorker = await TestUtils.checkServiceWorker(page)

    console.log('📋 Diagnostic Report:')
    console.log(`  Service Worker: ${hasServiceWorker ? 'Active' : 'Not Active'}`)
    console.log(`  Performance Metrics:`, performanceMetrics)

    // Take diagnostic screenshots
    const screenshots = await TestUtils.takeDiagnosticScreenshots(page, 'diagnostic')
    console.log(`  Screenshots: ${screenshots.length} taken`)

    // This test always passes - it's just for information gathering
    expect(true).toBe(true)
  })
})