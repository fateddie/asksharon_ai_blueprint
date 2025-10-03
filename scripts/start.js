#!/usr/bin/env node

/**
 * Personal Assistant Startup Script
 *
 * This script provides:
 * - Environment validation
 * - Database health checks
 * - Dependency verification
 * - Helpful debugging information
 * - Automatic issue detection and suggestions
 */

const { execSync, spawn } = require('child_process')
const fs = require('fs')
const path = require('path')
require('dotenv').config({ path: '.env.local' })

// ANSI color codes for beautiful output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  bgRed: '\x1b[41m',
  bgGreen: '\x1b[42m',
  bgYellow: '\x1b[43m',
  bgBlue: '\x1b[44m'
}

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

function logHeader(message) {
  log(`\n${'='.repeat(60)}`, 'cyan')
  log(`🚀 ${message}`, 'cyan')
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

function logTip(message) {
  log(`💡 ${message}`, 'cyan')
}

function logSeparator() {
  log('\n' + '-'.repeat(60), 'magenta')
}

async function checkPrerequisites() {
  logHeader('PERSONAL ASSISTANT STARTUP')
  logStep(1, 'Checking prerequisites...', 'loading')

  const checks = []

  // Check Node.js version
  try {
    const nodeVersion = process.version
    const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0])

    if (majorVersion >= 18) {
      checks.push({ name: 'Node.js', status: 'success', details: `${nodeVersion} (✓ v18+)` })
    } else {
      checks.push({ name: 'Node.js', status: 'warning', details: `${nodeVersion} (⚠️ recommend v18+)` })
    }
  } catch (error) {
    checks.push({ name: 'Node.js', status: 'error', details: 'Not found' })
  }

  // Check npm
  try {
    const npmVersion = execSync('npm --version', { encoding: 'utf8' }).trim()
    checks.push({ name: 'npm', status: 'success', details: `v${npmVersion}` })
  } catch (error) {
    checks.push({ name: 'npm', status: 'error', details: 'Not found' })
  }

  // Check package.json
  const packageJsonPath = path.join(process.cwd(), 'package.json')
  if (fs.existsSync(packageJsonPath)) {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'))
    checks.push({ name: 'Package.json', status: 'success', details: `v${packageJson.version}` })
  } else {
    checks.push({ name: 'Package.json', status: 'error', details: 'Not found' })
  }

  // Check dependencies
  const nodeModulesPath = path.join(process.cwd(), 'node_modules')
  if (fs.existsSync(nodeModulesPath)) {
    checks.push({ name: 'Dependencies', status: 'success', details: 'Installed' })
  } else {
    checks.push({ name: 'Dependencies', status: 'error', details: 'Run npm install' })
  }

  // Display results
  logSeparator()
  log('Prerequisites Check:', 'bright')
  checks.forEach(check => {
    const icon = check.status === 'success' ? '✅' : check.status === 'warning' ? '⚠️' : '❌'
    log(`  ${icon} ${check.name}: ${check.details}`)
  })

  return checks.every(check => check.status !== 'error')
}

async function checkEnvironment() {
  logSeparator()
  logStep(2, 'Checking environment configuration...', 'loading')

  const envPath = path.join(process.cwd(), '.env.local')

  if (!fs.existsSync(envPath)) {
    logStep('', 'No .env.local file found', 'warning')
    logTip('Create .env.local with your Supabase credentials for database features')
    logTip('The app will work with mock data without it!')
    return false
  }

  const requiredVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY'
  ]

  const optionalVars = [
    'OPENAI_API_KEY',
    'NEXT_PUBLIC_APP_URL'
  ]

  log('\nEnvironment Variables:', 'bright')

  let allRequired = true

  requiredVars.forEach(varName => {
    const value = process.env[varName]
    if (value) {
      const masked = value.length > 20 ? value.slice(0, 8) + '...' + value.slice(-4) : value
      log(`  ✅ ${varName}: ${masked}`)
    } else {
      log(`  ❌ ${varName}: Missing`)
      allRequired = false
    }
  })

  optionalVars.forEach(varName => {
    const value = process.env[varName]
    if (value) {
      const masked = value.length > 20 ? value.slice(0, 8) + '...' + value.slice(-4) : value
      log(`  ✅ ${varName}: ${masked}`)
    } else {
      log(`  ⚪ ${varName}: Optional (not set)`)
    }
  })

  if (!allRequired) {
    log('\n⚠️  Some required environment variables are missing', 'yellow')
    logTip('The app will use mock data instead of Supabase')
    logTip('See SETUP_CHECKLIST.md for configuration help')
  }

  return allRequired
}

async function checkDatabase() {
  logSeparator()
  logStep(3, 'Testing database connection...', 'loading')

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    log('  ⚪ Skipping database test (no Supabase URL)', 'yellow')
    return false
  }

  try {
    // Use our existing test script
    const testResult = execSync('npm run test-db', {
      encoding: 'utf8',
      timeout: 10000
    })

    if (testResult.includes('All tests passed')) {
      log('  ✅ Database connection successful', 'green')
      log('  ✅ All tables accessible', 'green')
      logTip('Your data will persist between sessions!')
      return true
    } else if (testResult.includes('Connection failed')) {
      log('  ❌ Database connection failed', 'red')
      log('  📋 App will use mock data instead', 'yellow')
      return false
    }
  } catch (error) {
    log('  ⚠️  Database test encountered issues', 'yellow')
    log('  📋 App will gracefully fall back to mock data', 'blue')

    if (error.message.includes('table') && error.message.includes('does not exist')) {
      logTip('Run the schema SQL in your Supabase dashboard')
      logTip('Check SETUP_CHECKLIST.md for detailed instructions')
    }
  }

  return false
}

async function checkBuildHealth() {
  logSeparator()
  logStep(4, 'Checking code health...', 'loading')

  const checks = []

  // TypeScript check
  try {
    execSync('npm run type-check', { encoding: 'utf8', timeout: 30000 })
    checks.push({ name: 'TypeScript', status: 'success' })
  } catch (error) {
    checks.push({ name: 'TypeScript', status: 'error', details: 'Type errors found' })
  }

  // ESLint check
  try {
    execSync('npm run lint', { encoding: 'utf8', timeout: 30000 })
    checks.push({ name: 'ESLint', status: 'success' })
  } catch (error) {
    if (error.message.includes('warning')) {
      checks.push({ name: 'ESLint', status: 'warning', details: 'Warnings found' })
    } else {
      checks.push({ name: 'ESLint', status: 'error', details: 'Errors found' })
    }
  }

  // Display results
  log('\nCode Health:', 'bright')
  checks.forEach(check => {
    const icon = check.status === 'success' ? '✅' : check.status === 'warning' ? '⚠️' : '❌'
    const details = check.details ? ` (${check.details})` : ''
    log(`  ${icon} ${check.name}${details}`)
  })

  return checks.every(check => check.status !== 'error')
}

function displayStartupSummary(dbConnected, envConfigured) {
  logSeparator()
  log('🎯 STARTUP SUMMARY', 'bright')

  log('\nYour Personal Assistant is starting with:', 'cyan')

  if (dbConnected) {
    log('  ✅ Live Supabase database', 'green')
    log('    • Tasks and habits will persist', 'green')
    log('    • Real-time data synchronization', 'green')
  } else {
    log('  📋 Mock data mode', 'yellow')
    log('    • Full functionality available', 'yellow')
    log('    • Data resets on page refresh', 'yellow')
    log('    • Perfect for testing and demo', 'yellow')
  }

  if (envConfigured) {
    log('  ✅ Environment fully configured', 'green')
  } else {
    log('  ⚪ Basic configuration (sufficient for demo)', 'yellow')
  }

  log('\n🚀 Features Available:', 'bright')
  log('  • Voice-first task management', 'green')
  log('  • Habit tracking with streaks', 'green')
  log('  • Today\'s Focus dashboard', 'green')
  log('  • Responsive design', 'green')
  log('  • Real-time speech recognition', 'green')

  logSeparator()
}

function displayUsageInstructions() {
  log('📖 QUICK START GUIDE', 'bright')

  log('\n🎤 Voice Commands (Chrome recommended):', 'cyan')
  log('  • "Add task: Review quarterly reports"')
  log('  • "Mark habit workout as complete"')
  log('  • "What\'s on my schedule today?"')

  log('\n✅ Task Management:', 'cyan')
  log('  • Add: Type in input box, press Enter')
  log('  • Complete: Click circle icon')
  log('  • Delete: Click trash icon')
  log('  • Filter: Use All/Pending/Completed tabs')

  log('\n💪 Habit Tracking:', 'cyan')
  log('  • Add: Type habit name, press Enter')
  log('  • Complete: Click completion button')
  log('  • View streaks: Check badge counters')
  log('  • Weekly grid: See 7-day progress')

  log('\n🔧 Development Commands:', 'cyan')
  log('  • npm run dev        - Start development server')
  log('  • npm run test-db     - Test database connection')
  log('  • npm run type-check  - Check TypeScript')
  log('  • npm run lint        - Check code quality')

  logSeparator()
}

function displayTroubleshootingGuide() {
  log('🔧 TROUBLESHOOTING', 'bright')

  log('\n❓ Common Issues & Solutions:', 'yellow')

  log('\n📱 Voice not working:', 'cyan')
  log('  • Use Chrome browser (best support)')
  log('  • Check microphone permissions')
  log('  • Ensure HTTPS in production')

  log('\n🗄️ Database not connecting:', 'cyan')
  log('  • Check .env.local configuration')
  log('  • Verify Supabase project is active')
  log('  • Run: npm run test-db for diagnosis')
  log('  • See SETUP_CHECKLIST.md for setup')

  log('\n🔨 Build errors:', 'cyan')
  log('  • Run: npm run type-check')
  log('  • Run: npm run lint')
  log('  • Check browser console for errors')

  log('\n📞 Need Help?', 'cyan')
  log('  • Check: PROJECT_README.md')
  log('  • Review: SUPABASE_SETUP.md')
  log('  • Follow: SETUP_CHECKLIST.md')

  logSeparator()
}

async function startDevelopmentServer() {
  log('🚀 STARTING DEVELOPMENT SERVER', 'bright')
  log('\nLaunching Next.js development server...', 'cyan')

  // Start the dev server
  const devServer = spawn('npm', ['run', 'dev'], {
    stdio: 'inherit',
    shell: true
  })

  // Display server info
  setTimeout(() => {
    log('\n🌐 Your Personal Assistant is now running!', 'green')
    log('\n📍 Access your app:', 'bright')
    log('  🔗 Local:   http://localhost:3000', 'cyan')
    log('  📱 Mobile:  Check terminal for network URL', 'cyan')

    log('\n⚡ Live reload enabled - changes update automatically', 'green')
    log('\n🛑 To stop: Press Ctrl+C', 'yellow')

    logSeparator()
    log('Happy coding! 🎉', 'green')
  }, 2000)

  // Handle server shutdown
  process.on('SIGINT', () => {
    log('\n\n🛑 Shutting down development server...', 'yellow')
    devServer.kill('SIGINT')
    process.exit(0)
  })

  return devServer
}

// Main startup function
async function main() {
  try {
    console.clear() // Clear terminal for clean startup

    const prereqsOk = await checkPrerequisites()
    if (!prereqsOk) {
      log('\n❌ Prerequisites check failed. Please fix the issues above.', 'red')
      process.exit(1)
    }

    const envConfigured = await checkEnvironment()
    const dbConnected = await checkDatabase()
    const codeHealthy = await checkBuildHealth()

    if (!codeHealthy) {
      log('\n⚠️  Code health issues detected. The app may not work correctly.', 'yellow')
      logTip('Fix TypeScript/ESLint errors before starting')
    }

    displayStartupSummary(dbConnected, envConfigured)
    displayUsageInstructions()

    // Ask user if they want to see troubleshooting
    log('\n❓ Show troubleshooting guide? (y/N): ', 'yellow')

    // For now, just start the server
    setTimeout(() => {
      displayTroubleshootingGuide()
      startDevelopmentServer()
    }, 2000)

  } catch (error) {
    log(`\n❌ Startup failed: ${error.message}`, 'red')
    log('\n🔧 Try these steps:', 'yellow')
    log('  1. Check you\'re in the project directory')
    log('  2. Run: npm install')
    log('  3. Check Node.js version (need v18+)')
    process.exit(1)
  }
}

// Run the startup script
if (require.main === module) {
  main()
}

module.exports = { main }