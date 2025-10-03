#!/usr/bin/env node

/**
 * White Screen Detection Test Runner
 *
 * Automated script to run comprehensive white screen detection tests
 * and generate detailed reports for development and CI/CD.
 */

const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

class WhiteScreenTestRunner {
  constructor() {
    this.testResults = {
      timestamp: new Date().toISOString(),
      totalTests: 0,
      passedTests: 0,
      failedTests: 0,
      testSuites: [],
      summary: ''
    }
  }

  /**
   * Run a specific test suite
   */
  async runTestSuite(suiteName, testFile) {
    console.log(`\n🧪 Running ${suiteName}...`)
    console.log('━'.repeat(50))

    try {
      const command = `npx playwright test ${testFile} --reporter=json`
      const output = execSync(command, { encoding: 'utf8', cwd: process.cwd() })

      // Parse JSON output
      let results
      try {
        results = JSON.parse(output)
      } catch {
        // Fallback if JSON parsing fails
        results = { stats: { passed: 0, failed: 1 }, tests: [] }
      }

      const suite = {
        name: suiteName,
        file: testFile,
        passed: results.stats?.passed || 0,
        failed: results.stats?.failed || 0,
        skipped: results.stats?.skipped || 0,
        duration: results.stats?.duration || 0,
        status: (results.stats?.failed || 0) === 0 ? 'PASSED' : 'FAILED'
      }

      this.testResults.testSuites.push(suite)
      this.testResults.totalTests += suite.passed + suite.failed
      this.testResults.passedTests += suite.passed
      this.testResults.failedTests += suite.failed

      console.log(`✅ ${suite.passed} passed, ❌ ${suite.failed} failed, ⏭️ ${suite.skipped} skipped`)
      console.log(`⏱️ Duration: ${(suite.duration / 1000).toFixed(2)}s`)

      return suite.status === 'PASSED'
    } catch (error) {
      console.error(`❌ ${suiteName} failed:`, error.message)

      const suite = {
        name: suiteName,
        file: testFile,
        passed: 0,
        failed: 1,
        skipped: 0,
        duration: 0,
        status: 'FAILED',
        error: error.message
      }

      this.testResults.testSuites.push(suite)
      this.testResults.totalTests += 1
      this.testResults.failedTests += 1

      return false
    }
  }

  /**
   * Run all white screen detection tests
   */
  async runAllTests() {
    console.log('🚀 Starting White Screen Detection Test Suite')
    console.log('=' .repeat(60))

    const testSuites = [
      {
        name: 'White Screen Detection',
        file: 'tests/white-screen-detection.spec.ts'
      },
      {
        name: 'Loading Transitions',
        file: 'tests/loading-transitions.spec.ts'
      },
      {
        name: 'Network Conditions',
        file: 'tests/network-conditions.spec.ts'
      },
      {
        name: 'Visual Regression',
        file: 'tests/visual-regression.spec.ts'
      },
      {
        name: 'Cache Scenarios',
        file: 'tests/cache-scenarios.spec.ts'
      },
      {
        name: 'Automated Monitoring',
        file: 'tests/automated-monitoring.spec.ts'
      }
    ]

    const results = []

    for (const suite of testSuites) {
      const passed = await this.runTestSuite(suite.name, suite.file)
      results.push({ ...suite, passed })
    }

    this.generateSummary()
    this.saveResults()

    return this.testResults.failedTests === 0
  }

  /**
   * Run quick health check
   */
  async runQuickCheck() {
    console.log('⚡ Running Quick White Screen Health Check')
    console.log('━'.repeat(40))

    return await this.runTestSuite('Quick Health Check', 'tests/white-screen-detection.spec.ts')
  }

  /**
   * Run continuous monitoring
   */
  async runContinuousMonitoring() {
    console.log('🔄 Running Continuous Monitoring Tests')
    console.log('━'.repeat(40))

    return await this.runTestSuite('Continuous Monitoring', 'tests/automated-monitoring.spec.ts')
  }

  /**
   * Generate summary report
   */
  generateSummary() {
    const successRate = this.testResults.totalTests > 0
      ? (this.testResults.passedTests / this.testResults.totalTests * 100).toFixed(1)
      : 0

    let summary = `\n📊 White Screen Detection Test Summary\n`
    summary += `${'='.repeat(50)}\n`
    summary += `Timestamp: ${this.testResults.timestamp}\n`
    summary += `Total Tests: ${this.testResults.totalTests}\n`
    summary += `Passed: ${this.testResults.passedTests} ✅\n`
    summary += `Failed: ${this.testResults.failedTests} ❌\n`
    summary += `Success Rate: ${successRate}%\n\n`

    summary += `Test Suites:\n`
    this.testResults.testSuites.forEach(suite => {
      const status = suite.status === 'PASSED' ? '✅' : '❌'
      summary += `  ${status} ${suite.name} (${suite.passed}/${suite.passed + suite.failed})\n`
    })

    if (this.testResults.failedTests > 0) {
      summary += `\n⚠️ Failed Test Suites:\n`
      this.testResults.testSuites
        .filter(suite => suite.status === 'FAILED')
        .forEach(suite => {
          summary += `  • ${suite.name}: ${suite.error || 'Tests failed'}\n`
        })
    }

    summary += `\n📁 Detailed results saved to: test-results/white-screen-report.json\n`
    summary += `📷 Screenshots available in: test-results/\n`

    this.testResults.summary = summary
    console.log(summary)
  }

  /**
   * Save results to file
   */
  saveResults() {
    const resultsDir = path.join(process.cwd(), 'test-results')
    if (!fs.existsSync(resultsDir)) {
      fs.mkdirSync(resultsDir, { recursive: true })
    }

    const reportFile = path.join(resultsDir, 'white-screen-report.json')
    const summaryFile = path.join(resultsDir, 'white-screen-summary.txt')

    fs.writeFileSync(reportFile, JSON.stringify(this.testResults, null, 2))
    fs.writeFileSync(summaryFile, this.testResults.summary)

    console.log(`📁 Results saved to ${reportFile}`)
  }

  /**
   * Watch mode for continuous testing
   */
  async runWatchMode() {
    console.log('👁️ Starting Watch Mode - Continuous White Screen Monitoring')
    console.log('Press Ctrl+C to stop')

    const runTest = async () => {
      console.log(`\n🔄 ${new Date().toLocaleTimeString()} - Running health check...`)
      const passed = await this.runQuickCheck()

      if (!passed) {
        console.log('🚨 WHITE SCREEN ISSUE DETECTED!')
        // In watch mode, we continue running even if tests fail
      }
    }

    // Run initial test
    await runTest()

    // Set up interval for continuous monitoring
    const interval = setInterval(runTest, 30000) // Every 30 seconds

    // Handle graceful shutdown
    process.on('SIGINT', () => {
      clearInterval(interval)
      console.log('\n👋 Watch mode stopped')
      process.exit(0)
    })
  }
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2)
  const command = args[0] || 'all'

  const runner = new WhiteScreenTestRunner()

  try {
    switch (command) {
      case 'all':
        const allPassed = await runner.runAllTests()
        process.exit(allPassed ? 0 : 1)
        break

      case 'quick':
        const quickPassed = await runner.runQuickCheck()
        process.exit(quickPassed ? 0 : 1)
        break

      case 'monitor':
        const monitorPassed = await runner.runContinuousMonitoring()
        process.exit(monitorPassed ? 0 : 1)
        break

      case 'watch':
        await runner.runWatchMode()
        break

      default:
        console.log('White Screen Detection Test Runner')
        console.log('')
        console.log('Usage:')
        console.log('  node scripts/run-white-screen-tests.js [command]')
        console.log('')
        console.log('Commands:')
        console.log('  all     - Run all white screen detection tests (default)')
        console.log('  quick   - Run quick health check')
        console.log('  monitor - Run continuous monitoring tests')
        console.log('  watch   - Start watch mode for continuous testing')
        console.log('')
        process.exit(0)
    }
  } catch (error) {
    console.error('❌ Test runner error:', error.message)
    process.exit(1)
  }
}

// Run if called directly
if (require.main === module) {
  main()
}

module.exports = WhiteScreenTestRunner