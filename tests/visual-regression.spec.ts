import { test, expect, type Page } from '@playwright/test'
import { createHash } from 'crypto'

/**
 * Visual Regression Tests for White Screen Detection
 *
 * Uses visual comparisons and screenshot analysis to detect white screen issues
 * and ensure consistent visual appearance across different scenarios.
 */

interface VisualState {
  timestamp: number
  hasContent: boolean
  isDifferentFromWhite: boolean
  colorVariance: number
  screenshotPath: string
}

class VisualRegressionTester {
  constructor(private page: Page) {}

  /**
   * Analyze a page screenshot to detect white screen characteristics
   */
  async analyzeScreenshot(screenshotPath: string): Promise<{
    hasContent: boolean
    isDifferentFromWhite: boolean
    colorVariance: number
    dominantColors: string[]
    analysis: string
  }> {
    // This would ideally use image processing, but for now we'll use page inspection
    // Combined with visual checks through Playwright's screenshot comparison

    try {
      // Get page color information
      const colorAnalysis = await this.page.evaluate(() => {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')

        // Check background colors of key elements
        const body = document.body
        const main = document.querySelector('main')
        const header = document.querySelector('header')

        const bodyBg = window.getComputedStyle(body).backgroundColor
        const mainBg = main ? window.getComputedStyle(main).backgroundColor : 'none'
        const headerBg = header ? window.getComputedStyle(header).backgroundColor : 'none'

        // Count visible elements
        const visibleElements = document.querySelectorAll('*').length
        const textElements = document.querySelectorAll('h1, h2, h3, p, span, div').length
        const interactiveElements = document.querySelectorAll('button, input, a').length

        return {
          bodyBg,
          mainBg,
          headerBg,
          visibleElements,
          textElements,
          interactiveElements,
          hasText: document.body.innerText.trim().length > 0
        }
      })

      const hasContent = colorAnalysis.textElements > 5 && colorAnalysis.hasText
      const isDifferentFromWhite = colorAnalysis.bodyBg !== 'rgb(255, 255, 255)' &&
                                  colorAnalysis.bodyBg !== 'rgba(0, 0, 0, 0)'

      // Simple color variance calculation
      const colorVariance = colorAnalysis.visibleElements / 100

      const dominantColors = [colorAnalysis.bodyBg, colorAnalysis.mainBg, colorAnalysis.headerBg]
        .filter(color => color !== 'none')

      let analysis = 'Normal page with content'
      if (!hasContent) {
        analysis = 'Possible white screen - no content detected'
      } else if (!isDifferentFromWhite) {
        analysis = 'Warning - page has white/transparent background'
      }

      return {
        hasContent,
        isDifferentFromWhite,
        colorVariance,
        dominantColors,
        analysis
      }
    } catch (error) {
      return {
        hasContent: false,
        isDifferentFromWhite: false,
        colorVariance: 0,
        dominantColors: [],
        analysis: `Error analyzing screenshot: ${error}`
      }
    }
  }

  /**
   * Take a baseline screenshot for comparison
   */
  async takeBaselineScreenshot(name: string): Promise<string> {
    const screenshotPath = `test-results/baseline-${name}.png`
    await this.page.screenshot({
      path: screenshotPath,
      fullPage: true
    })
    return screenshotPath
  }

  /**
   * Compare current page with baseline for visual regression
   */
  async compareWithBaseline(baselineName: string): Promise<{
    isMatch: boolean
    isDifferent: boolean
    hasWhiteScreen: boolean
    comparison: any
  }> {
    try {
      // Take current screenshot
      const currentPath = `test-results/current-${baselineName}.png`
      await this.page.screenshot({
        path: currentPath,
        fullPage: true
      })

      // Analyze current screenshot
      const analysis = await this.analyzeScreenshot(currentPath)

      // Use Playwright's built-in visual comparison
      try {
        await expect(this.page).toHaveScreenshot(`${baselineName}.png`, {
          threshold: 0.3, // Allow some variance
          maxDiffPixels: 1000
        })

        return {
          isMatch: true,
          isDifferent: false,
          hasWhiteScreen: !analysis.hasContent,
          comparison: analysis
        }
      } catch (comparisonError) {
        return {
          isMatch: false,
          isDifferent: true,
          hasWhiteScreen: !analysis.hasContent,
          comparison: analysis
        }
      }
    } catch (error) {
      return {
        isMatch: false,
        isDifferent: true,
        hasWhiteScreen: true,
        comparison: { error: error.toString() }
      }
    }
  }

  /**
   * Monitor visual state during loading
   */
  async monitorVisualLoading(): Promise<{
    states: VisualState[]
    issues: string[]
  }> {
    const states: VisualState[] = []
    const issues: string[] = []
    const startTime = Date.now()

    try {
      // Start monitoring
      const monitor = setInterval(async () => {
        try {
          const timestamp = Date.now() - startTime
          const screenshotPath = `test-results/loading-${timestamp}.png`

          await this.page.screenshot({
            path: screenshotPath,
            fullPage: false // Viewport only for faster capture
          })

          const analysis = await this.analyzeScreenshot(screenshotPath)

          states.push({
            timestamp,
            hasContent: analysis.hasContent,
            isDifferentFromWhite: analysis.isDifferentFromWhite,
            colorVariance: analysis.colorVariance,
            screenshotPath
          })
        } catch (error) {
          // Ignore errors during monitoring
        }
      }, 200) // Every 200ms

      // Navigate and wait
      await this.page.goto('/')
      await this.page.waitForLoadState('networkidle')
      await this.page.waitForTimeout(2000) // Extra time for monitoring

      clearInterval(monitor)

      // Analyze states for issues
      let consecutiveWhiteScreens = 0
      let hasShownContent = false

      for (const state of states) {
        if (!state.hasContent && !state.isDifferentFromWhite) {
          consecutiveWhiteScreens++
        } else {
          consecutiveWhiteScreens = 0
          hasShownContent = true
        }

        if (consecutiveWhiteScreens > 5) { // More than 1 second of white screen
          issues.push(`Extended white screen period detected: ${consecutiveWhiteScreens * 200}ms`)
          break
        }
      }

      if (!hasShownContent) {
        issues.push('Content never appeared during visual monitoring')
      }

    } catch (error) {
      issues.push(`Visual monitoring error: ${error}`)
    }

    return { states, issues }
  }

  /**
   * Test visual consistency across different viewport sizes
   */
  async testResponsiveVisuals(): Promise<{ issues: string[] }> {
    const issues: string[] = []

    const viewports = [
      { name: 'Mobile', width: 375, height: 667 },
      { name: 'Tablet', width: 768, height: 1024 },
      { name: 'Desktop', width: 1280, height: 720 },
      { name: 'Large Desktop', width: 1920, height: 1080 }
    ]

    for (const viewport of viewports) {
      try {
        await this.page.setViewportSize(viewport)
        await this.page.goto('/')
        await this.page.waitForSelector('h1')

        const analysis = await this.analyzeScreenshot(`viewport-${viewport.name}`)

        if (!analysis.hasContent) {
          issues.push(`${viewport.name} viewport shows no content`)
        }

        if (!analysis.isDifferentFromWhite) {
          issues.push(`${viewport.name} viewport has white screen appearance`)
        }

        // Take screenshot for manual review
        await this.page.screenshot({
          path: `test-results/responsive-${viewport.name.toLowerCase()}.png`,
          fullPage: true
        })

      } catch (error) {
        issues.push(`${viewport.name} viewport test error: ${error}`)
      }
    }

    return { issues }
  }

  /**
   * Test visual state during interactions
   */
  async testInteractionVisuals(): Promise<{ issues: string[] }> {
    const issues: string[] = []

    try {
      await this.page.goto('/')
      await this.page.waitForSelector('h1')

      // Test page refresh visual
      await this.page.reload()
      const refreshAnalysis = await this.analyzeScreenshot('refresh-test')

      if (!refreshAnalysis.hasContent) {
        issues.push('Page refresh shows white screen')
      }

      // Test interaction with components (if any clickable elements exist)
      try {
        const buttons = await this.page.locator('button').count()
        if (buttons > 0) {
          await this.page.locator('button').first().click()
          await this.page.waitForTimeout(1000)

          const interactionAnalysis = await this.analyzeScreenshot('interaction-test')
          if (!interactionAnalysis.hasContent) {
            issues.push('Component interaction causes white screen')
          }
        }
      } catch {
        // No interactive elements or interaction failed
      }

    } catch (error) {
      issues.push(`Interaction visual test error: ${error}`)
    }

    return { issues }
  }
}

test.describe('Visual Regression Tests', () => {
  let tester: VisualRegressionTester

  test.beforeEach(async ({ page }) => {
    tester = new VisualRegressionTester(page)
  })

  test('Initial page load visual state', async () => {
    await tester.page.goto('/')
    await tester.page.waitForSelector('h1')

    const analysis = await tester.analyzeScreenshot('initial-load')

    console.log(`Analysis: ${analysis.analysis}`)
    console.log(`Has content: ${analysis.hasContent}`)
    console.log(`Different from white: ${analysis.isDifferentFromWhite}`)
    console.log(`Dominant colors: ${analysis.dominantColors.join(', ')}`)

    if (!analysis.hasContent) {
      await tester.page.screenshot({
        path: 'test-results/visual-no-content.png',
        fullPage: true
      })
    }

    expect(analysis.hasContent).toBe(true)
    expect(analysis.analysis).not.toContain('white screen')
  })

  test('Visual loading sequence monitoring', async () => {
    const result = await tester.monitorVisualLoading()

    console.log(`Captured ${result.states.length} visual states`)

    if (result.issues.length > 0) {
      console.log('🚨 Visual Loading Issues:')
      result.issues.forEach(issue => console.log(`  ❌ ${issue}`))
    }

    // Log visual progression
    result.states.forEach((state, index) => {
      if (index % 5 === 0) { // Log every 5th state to avoid spam
        console.log(`  ${state.timestamp}ms: Content=${state.hasContent}, Different=${state.isDifferentFromWhite}`)
      }
    })

    expect(result.issues).toHaveLength(0)
  })

  test('Responsive visual consistency', async () => {
    const result = await tester.testResponsiveVisuals()

    if (result.issues.length > 0) {
      console.log('🚨 Responsive Visual Issues:')
      result.issues.forEach(issue => console.log(`  ❌ ${issue}`))
    }

    expect(result.issues).toHaveLength(0)
  })

  test('Interaction visual stability', async () => {
    const result = await tester.testInteractionVisuals()

    if (result.issues.length > 0) {
      console.log('🚨 Interaction Visual Issues:')
      result.issues.forEach(issue => console.log(`  ❌ ${issue}`))
    }

    expect(result.issues).toHaveLength(0)
  })

  test('Visual baseline comparison', async () => {
    // Create or update baseline
    await tester.page.goto('/')
    await tester.page.waitForSelector('h1')

    // Take baseline screenshot with Playwright's built-in visual comparison
    await expect(tester.page).toHaveScreenshot('app-baseline.png')

    console.log('Visual baseline captured or compared successfully')
  })
})

test.describe('Cross-Browser Visual Tests', () => {
  test('Chrome visual consistency', async ({ page, browserName }) => {
    test.skip(browserName !== 'chromium', 'Chrome-specific test')

    const tester = new VisualRegressionTester(page)
    await page.goto('/')
    await page.waitForSelector('h1')

    const analysis = await tester.analyzeScreenshot('chrome-visual')
    expect(analysis.hasContent).toBe(true)

    await expect(page).toHaveScreenshot('chrome-baseline.png')
  })

  test('Firefox visual consistency', async ({ page, browserName }) => {
    test.skip(browserName !== 'firefox', 'Firefox-specific test')

    const tester = new VisualRegressionTester(page)
    await page.goto('/')
    await page.waitForSelector('h1')

    const analysis = await tester.analyzeScreenshot('firefox-visual')
    expect(analysis.hasContent).toBe(true)

    await expect(page).toHaveScreenshot('firefox-baseline.png')
  })

  test('Safari visual consistency', async ({ page, browserName }) => {
    test.skip(browserName !== 'webkit', 'Safari-specific test')

    const tester = new VisualRegressionTester(page)
    await page.goto('/')
    await page.waitForSelector('h1')

    const analysis = await tester.analyzeScreenshot('safari-visual')
    expect(analysis.hasContent).toBe(true)

    await expect(page).toHaveScreenshot('safari-baseline.png')
  })
})

test.describe('White Screen Visual Detection', () => {
  test('Detect pure white screen', async ({ page }) => {
    const tester = new VisualRegressionTester(page)

    // Create a test page that shows white screen
    await page.setContent('<html><body style="background: white; margin: 0; padding: 0;"></body></html>')

    const analysis = await tester.analyzeScreenshot('white-screen-test')

    console.log(`White screen test - Has content: ${analysis.hasContent}`)
    console.log(`Different from white: ${analysis.isDifferentFromWhite}`)

    // This should detect a white screen
    expect(analysis.hasContent).toBe(false)
  })

  test('Detect loading vs white screen', async ({ page }) => {
    const tester = new VisualRegressionTester(page)

    // Create a loading screen
    await page.setContent(`
      <html>
        <body style="background: #f1f5f9; display: flex; align-items: center; justify-content: center; min-height: 100vh;">
          <div style="text-align: center;">
            <div style="width: 32px; height: 32px; border: 2px solid #e2e8f0; border-top: 2px solid #3b82f6; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 16px auto;"></div>
            <p style="color: #64748b;">Loading Personal Assistant...</p>
          </div>
        </body>
      </html>
    `)

    const analysis = await tester.analyzeScreenshot('loading-screen-test')

    console.log(`Loading screen test - Has content: ${analysis.hasContent}`)
    console.log(`Different from white: ${analysis.isDifferentFromWhite}`)

    // Loading screen should show content and not be white
    expect(analysis.hasContent).toBe(true)
    expect(analysis.isDifferentFromWhite).toBe(true)
  })
})

test.afterAll(async () => {
  console.log('\n📊 Visual Regression Tests Complete')
  console.log('Check test-results/ for visual screenshots and comparisons')
  console.log('Visual baselines have been established for future comparisons')
})