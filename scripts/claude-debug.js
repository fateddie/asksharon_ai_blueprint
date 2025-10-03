#!/usr/bin/env node

/**
 * Claude Automated Debugging Assistant
 *
 * This script integrates Playwright testing with Claude's ability to automatically
 * fix issues by testing the app, identifying problems, and providing detailed
 * error reports that Claude can use to make corrections.
 */

const { execSync } = require('child_process')
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
  log(`\n${'='.repeat(70)}`, 'cyan')
  log(`🤖 ${message}`, 'cyan')
  log(`${'='.repeat(70)}`, 'cyan')
}

async function analyzeAppHealth() {
  logHeader('CLAUDE AUTOMATED DEBUGGING SESSION')

  log('\n🎯 Phase 1: Quick Health Assessment', 'blue')

  try {
    // Run the automated debugging script
    const debugOutput = execSync('npm run auto-debug', {
      encoding: 'utf8',
      stdio: 'pipe'
    })

    log(debugOutput)

    // Load the generated report
    const reportPath = path.join(process.cwd(), 'test-results', 'claude-debug-report.json')

    if (fs.existsSync(reportPath)) {
      const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'))
      return analyzeReportForFixes(report)
    } else {
      log('❌ No debug report generated', 'red')
      return null
    }

  } catch (error) {
    log(`⚠️ Testing completed with issues`, 'yellow')

    // Try to load report anyway
    const reportPath = path.join(process.cwd(), 'test-results', 'claude-debug-report.json')

    if (fs.existsSync(reportPath)) {
      const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'))
      return analyzeReportForFixes(report)
    } else {
      log('❌ Unable to analyze app health', 'red')
      return null
    }
  }
}

function analyzeReportForFixes(report) {
  log('\n🔍 Phase 2: Analyzing Issues for Automated Fixes', 'blue')

  const fixableIssues = []
  const manualIssues = []

  report.errors.forEach(error => {
    const issue = {
      test: error.test,
      spec: error.spec,
      error: error.error,
      type: categorizeError(error.error),
      priority: determinePriority(error.error),
      fixable: isAutoFixable(error.error),
      suggestions: generateFixSuggestions(error.error)
    }

    if (issue.fixable) {
      fixableIssues.push(issue)
    } else {
      manualIssues.push(issue)
    }
  })

  displayAnalysisResults(fixableIssues, manualIssues, report)

  return {
    report,
    fixableIssues,
    manualIssues,
    shouldFix: fixableIssues.length > 0
  }
}

function categorizeError(errorMessage) {
  const errorLower = errorMessage.toLowerCase()

  if (errorLower.includes('not found') || errorLower.includes('locator')) {
    return 'MISSING_ELEMENT'
  }
  if (errorLower.includes('timeout')) {
    return 'TIMEOUT'
  }
  if (errorLower.includes('console') || errorLower.includes('javascript')) {
    return 'JAVASCRIPT_ERROR'
  }
  if (errorLower.includes('network') || errorLower.includes('fetch')) {
    return 'NETWORK_ERROR'
  }
  if (errorLower.includes('responsive') || errorLower.includes('viewport')) {
    return 'RESPONSIVE_ISSUE'
  }

  return 'OTHER'
}

function determinePriority(errorMessage) {
  const errorLower = errorMessage.toLowerCase()

  if (errorLower.includes('page error') || errorLower.includes('javascript')) {
    return 'HIGH'
  }
  if (errorLower.includes('not found') || errorLower.includes('missing')) {
    return 'HIGH'
  }
  if (errorLower.includes('timeout') || errorLower.includes('slow')) {
    return 'MEDIUM'
  }

  return 'LOW'
}

function isAutoFixable(errorMessage) {
  const errorLower = errorMessage.toLowerCase()

  // Issues that Claude can potentially fix automatically
  if (errorLower.includes('placeholder') && errorLower.includes('not found')) {
    return true // Missing placeholder text
  }
  if (errorLower.includes('test-id') || errorLower.includes('data-testid')) {
    return true // Missing test IDs
  }
  if (errorLower.includes('text') && errorLower.includes('not found')) {
    return true // Changed text content
  }

  return false
}

function generateFixSuggestions(errorMessage) {
  const suggestions = []
  const errorLower = errorMessage.toLowerCase()

  if (errorLower.includes('placeholder') && errorLower.includes('add a new task')) {
    suggestions.push({
      type: 'ADD_PLACEHOLDER',
      file: 'src/components/features/TaskManager.tsx',
      change: 'Add placeholder="Add a new task..." to input field',
      code: '<Input placeholder="Add a new task..." ... />'
    })
  }

  if (errorLower.includes('placeholder') && errorLower.includes('add a new habit')) {
    suggestions.push({
      type: 'ADD_PLACEHOLDER',
      file: 'src/components/features/HabitTracker.tsx',
      change: 'Add placeholder="Add a new habit..." to input field',
      code: '<Input placeholder="Add a new habit..." ... />'
    })
  }

  if (errorLower.includes('data-testid') || errorLower.includes('test-id')) {
    suggestions.push({
      type: 'ADD_TEST_ID',
      file: 'Component files',
      change: 'Add data-testid attributes for testing',
      code: '<button data-testid="task-circle" ... />'
    })
  }

  return suggestions
}

function displayAnalysisResults(fixableIssues, manualIssues, report) {
  log('\n📊 Analysis Results:', 'bright')

  if (fixableIssues.length > 0) {
    log(`\n🔧 Auto-Fixable Issues (${fixableIssues.length}):`, 'green')
    fixableIssues.forEach((issue, index) => {
      log(`\n  ${index + 1}. ${issue.test}`, 'bright')
      log(`     Type: ${issue.type} (${issue.priority} priority)`, 'yellow')
      log(`     Error: ${issue.error}`, 'red')

      if (issue.suggestions.length > 0) {
        log(`     🔧 Suggested Fixes:`, 'cyan')
        issue.suggestions.forEach(suggestion => {
          log(`       • ${suggestion.change}`, 'green')
          log(`         File: ${suggestion.file}`, 'blue')
          if (suggestion.code) {
            log(`         Code: ${suggestion.code}`, 'magenta')
          }
        })
      }
    })
  }

  if (manualIssues.length > 0) {
    log(`\n⚠️ Manual Review Required (${manualIssues.length}):`, 'yellow')
    manualIssues.forEach((issue, index) => {
      log(`\n  ${index + 1}. ${issue.test}`, 'bright')
      log(`     Type: ${issue.type} (${issue.priority} priority)`, 'yellow')
      log(`     Error: ${issue.error}`, 'red')
    })
  }

  if (report.evidence.screenshots.length > 0) {
    log(`\n📸 Visual Evidence Available:`, 'blue')
    log(`   Screenshots: ${report.evidence.screenshots.length}`)
    log(`   Videos: ${report.evidence.videos.length}`)
    log(`   Location: test-results/`, 'cyan')
  }
}

function generateClaudePrompt(analysis) {
  if (!analysis || !analysis.shouldFix) {
    return null
  }

  const prompt = {
    type: 'AUTOMATED_FIX_REQUEST',
    timestamp: new Date().toISOString(),
    summary: `Found ${analysis.fixableIssues.length} auto-fixable issues in Personal Assistant app`,
    issues: analysis.fixableIssues.map(issue => ({
      test: issue.test,
      error: issue.error,
      type: issue.type,
      priority: issue.priority,
      suggestions: issue.suggestions
    })),
    evidence: {
      reportPath: 'test-results/claude-debug-report.json',
      screenshots: analysis.report.evidence.screenshots,
      videos: analysis.report.evidence.videos
    },
    instructions: [
      '1. Review the failed tests and error messages',
      '2. Apply the suggested fixes to the appropriate files',
      '3. Run the tests again to verify fixes',
      '4. Iterate until all auto-fixable issues are resolved'
    ]
  }

  // Save prompt to file for Claude to read
  const promptPath = path.join(process.cwd(), 'test-results', 'claude-fix-prompt.json')
  fs.writeFileSync(promptPath, JSON.stringify(prompt, null, 2))

  log('\n🤖 Claude Fix Prompt Generated:', 'green')
  log(`   File: ${promptPath}`, 'cyan')

  return prompt
}

async function main() {
  try {
    const analysis = await analyzeAppHealth()

    if (!analysis) {
      log('\n❌ Unable to analyze app health', 'red')
      return
    }

    const prompt = generateClaudePrompt(analysis)

    if (prompt) {
      log('\n🎯 Phase 3: Ready for Automated Fixes', 'blue')
      log('\n✨ Claude can now automatically fix the following:', 'green')

      analysis.fixableIssues.forEach((issue, index) => {
        log(`\n  ${index + 1}. ${issue.type}: ${issue.test}`, 'bright')
        issue.suggestions.forEach(suggestion => {
          log(`     → ${suggestion.change}`, 'cyan')
        })
      })

      log('\n🚀 Next Steps:', 'blue')
      log('  1. Claude will read the generated report', 'green')
      log('  2. Apply suggested fixes automatically', 'green')
      log('  3. Re-run tests to verify fixes', 'green')
      log('  4. Repeat until all issues are resolved', 'green')

      log('\n💡 Manual Review Needed:', 'yellow')
      log(`  ${analysis.manualIssues.length} issues require human attention`)

    } else {
      log('\n🎉 No Auto-Fixable Issues Found!', 'green')
      log('Your Personal Assistant app is working great!', 'cyan')
    }

    // Exit code indicates if fixes are needed
    process.exit(analysis.shouldFix ? 1 : 0)

  } catch (error) {
    log(`\n❌ Claude debugging session failed: ${error.message}`, 'red')
    console.error(error)
    process.exit(1)
  }
}

if (require.main === module) {
  main()
}

module.exports = { main, analyzeAppHealth }