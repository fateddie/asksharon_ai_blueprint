#!/usr/bin/env node

/**
 * Automated Debugging Script for Personal Assistant
 *
 * This script uses Playwright to automatically test the app and provides
 * detailed error reports that Claude can use to fix issues automatically.
 */

const { execSync, spawn } = require('child_process')
const fs = require('fs')
const path = require('path')

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
}

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

function logHeader(message) {
  log(`\n${'='.repeat(60)}`, 'cyan')
  log(`🤖 ${message}`, 'cyan')
  log(`${'='.repeat(60)}`, 'cyan')
}

function logStep(step, message, status = 'info') {
  const icons = {
    info: '📋',
    success: '✅',
    warning: '⚠️',
    error: '❌',
    loading: '⏳'
  }

  const statusColors = {
    info: 'blue',
    success: 'green',
    warning: 'yellow',
    error: 'red',
    loading: 'yellow'
  }

  log(`${icons[status]} ${step}. ${message}`, statusColors[status])
}

async function checkDevServer() {
  logStep(1, 'Checking if development server is running...', 'loading')

  try {
    const response = await fetch('http://localhost:3000')
    if (response.ok) {
      logStep('', 'Development server is running', 'success')
      return true
    }
  } catch (error) {
    logStep('', 'Development server is not running', 'error')
    log('💡 Start the server with: npm run dev', 'cyan')
    return false
  }

  return false
}

function startDevServer() {
  logStep(2, 'Starting development server...', 'loading')

  return new Promise((resolve, reject) => {
    const server = spawn('npm', ['run', 'dev'], {
      stdio: 'pipe',
      shell: true
    })

    let serverStarted = false

    server.stdout.on('data', (data) => {
      const output = data.toString()
      if (output.includes('Ready in') && !serverStarted) {
        serverStarted = true
        logStep('', 'Development server started successfully', 'success')
        setTimeout(() => resolve(server), 2000) // Give it a moment to fully start
      }
    })

    server.stderr.on('data', (data) => {
      console.error(`Server error: ${data}`)
    })

    server.on('error', (error) => {
      reject(error)
    })

    // Timeout after 30 seconds
    setTimeout(() => {
      if (!serverStarted) {
        reject(new Error('Server failed to start within 30 seconds'))
      }
    }, 30000)
  })
}

async function runPlaywrightTests() {
  logStep(3, 'Running comprehensive Playwright tests...', 'loading')

  try {
    // Create test-results directory
    const resultsDir = path.join(process.cwd(), 'test-results')
    if (!fs.existsSync(resultsDir)) {
      fs.mkdirSync(resultsDir, { recursive: true })
    }

    // Run Playwright tests
    const testOutput = execSync('npx playwright test --reporter=json', {
      encoding: 'utf8',
      stdio: 'pipe'
    })

    logStep('', 'Playwright tests completed', 'success')
    return { success: true, output: testOutput }

  } catch (error) {
    logStep('', 'Playwright tests found issues', 'warning')
    return { success: false, output: error.stdout || error.message }
  }
}

function parseTestResults(output) {
  try {
    const results = JSON.parse(output)
    const summary = {
      total: 0,
      passed: 0,
      failed: 0,
      skipped: 0,
      errors: [],
      warnings: [],
      screenshots: [],
      videos: []
    }

    if (results.suites) {
      results.suites.forEach(suite => {
        suite.specs.forEach(spec => {
          spec.tests.forEach(test => {
            summary.total++

            if (test.results) {
              test.results.forEach(result => {
                if (result.status === 'passed') {
                  summary.passed++
                } else if (result.status === 'failed') {
                  summary.failed++

                  // Extract error details
                  if (result.error) {
                    summary.errors.push({
                      test: test.title,
                      spec: spec.title,
                      error: result.error.message,
                      stack: result.error.stack
                    })
                  }

                  // Collect attachments (screenshots, videos)
                  if (result.attachments) {
                    result.attachments.forEach(attachment => {
                      if (attachment.name === 'screenshot') {
                        summary.screenshots.push(attachment.path)
                      } else if (attachment.name === 'video') {
                        summary.videos.push(attachment.path)
                      }
                    })
                  }
                } else if (result.status === 'skipped') {
                  summary.skipped++
                }
              })
            }
          })
        })
      })
    }

    return summary
  } catch (error) {
    console.error('Failed to parse test results:', error)
    return null
  }
}

function generateErrorReport(summary) {
  logStep(4, 'Generating error report for Claude...', 'loading')

  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      total: summary.total,
      passed: summary.passed,
      failed: summary.failed,
      skipped: summary.skipped,
      success_rate: summary.total > 0 ? Math.round((summary.passed / summary.total) * 100) : 0
    },
    errors: summary.errors,
    evidence: {
      screenshots: summary.screenshots,
      videos: summary.videos
    },
    recommendations: []
  }

  // Generate recommendations based on errors
  summary.errors.forEach(error => {
    if (error.error.includes('not found') || error.error.includes('locator')) {
      report.recommendations.push({
        type: 'UI_ELEMENT_MISSING',
        description: `UI element not found in ${error.test}`,
        suggestion: 'Check if component is rendering correctly and has proper test IDs',
        priority: 'high'
      })
    }

    if (error.error.includes('timeout')) {
      report.recommendations.push({
        type: 'PERFORMANCE_ISSUE',
        description: `Timeout in ${error.test}`,
        suggestion: 'Check for slow loading components or network issues',
        priority: 'medium'
      })
    }

    if (error.error.includes('console') || error.error.includes('error')) {
      report.recommendations.push({
        type: 'JAVASCRIPT_ERROR',
        description: `JavaScript error in ${error.test}`,
        suggestion: 'Check browser console for runtime errors',
        priority: 'high'
      })
    }
  })

  // Save report to file
  const reportPath = path.join(process.cwd(), 'test-results', 'claude-debug-report.json')
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2))

  logStep('', `Error report saved to: ${reportPath}`, 'success')
  return report
}

function displayReport(report) {
  log('\n📊 AUTOMATED DEBUGGING REPORT', 'bright')
  log('================================', 'cyan')

  // Summary
  log(`\n📈 Test Summary:`, 'blue')
  log(`  Total Tests: ${report.summary.total}`)
  log(`  ✅ Passed: ${report.summary.passed}`, 'green')
  log(`  ❌ Failed: ${report.summary.failed}`, 'red')
  log(`  ⏭️ Skipped: ${report.summary.skipped}`, 'yellow')
  log(`  📊 Success Rate: ${report.summary.success_rate}%`,
      report.summary.success_rate >= 80 ? 'green' : 'red')

  // Errors
  if (report.errors.length > 0) {
    log(`\n🚨 Issues Detected:`, 'red')
    report.errors.forEach((error, index) => {
      log(`\n  ${index + 1}. ${error.test}`, 'bright')
      log(`     Spec: ${error.spec}`, 'blue')
      log(`     Error: ${error.error}`, 'red')
    })
  }

  // Recommendations
  if (report.recommendations.length > 0) {
    log(`\n💡 Recommendations for Claude:`, 'cyan')
    report.recommendations.forEach((rec, index) => {
      const priorityColor = rec.priority === 'high' ? 'red' : rec.priority === 'medium' ? 'yellow' : 'green'
      log(`\n  ${index + 1}. [${rec.priority.toUpperCase()}] ${rec.type}`, priorityColor)
      log(`     ${rec.description}`, 'white')
      log(`     💡 ${rec.suggestion}`, 'cyan')
    })
  }

  // Evidence
  if (report.evidence.screenshots.length > 0 || report.evidence.videos.length > 0) {
    log(`\n📸 Evidence Available:`, 'blue')
    if (report.evidence.screenshots.length > 0) {
      log(`  Screenshots: ${report.evidence.screenshots.length}`)
    }
    if (report.evidence.videos.length > 0) {
      log(`  Videos: ${report.evidence.videos.length}`)
    }
    log(`  Check test-results/ directory for files`, 'cyan')
  }

  log('\n🤖 Claude can now use this report to automatically fix issues!', 'green')
}

async function main() {
  try {
    logHeader('AUTOMATED DEBUGGING WITH PLAYWRIGHT')

    // Check if server is running
    const serverRunning = await checkDevServer()
    let server = null

    if (!serverRunning) {
      server = await startDevServer()
    }

    // Run tests
    const testResults = await runPlaywrightTests()

    // Parse results
    const summary = parseTestResults(testResults.output)
    if (!summary) {
      log('❌ Failed to parse test results', 'red')
      return
    }

    // Generate report
    const report = generateErrorReport(summary)

    // Display results
    displayReport(report)

    // Cleanup
    if (server) {
      logStep(5, 'Stopping development server...', 'loading')
      server.kill('SIGINT')
    }

    // Exit with appropriate code
    process.exit(summary.failed > 0 ? 1 : 0)

  } catch (error) {
    log(`\n❌ Automated debugging failed: ${error.message}`, 'red')
    console.error(error)
    process.exit(1)
  }
}

// Handle interrupts
process.on('SIGINT', () => {
  log('\n🛑 Automated debugging interrupted', 'yellow')
  process.exit(0)
})

if (require.main === module) {
  main()
}

module.exports = { main }