# White Screen Detection Test Suite

Comprehensive Playwright test suite designed to detect and prevent white screen issues in the Personal Assistant app.

## Overview

This test suite monitors loading states, transitions, and content visibility across different scenarios to ensure users never encounter white screens during app usage.

## Test Files

### Core Detection Tests

- **`white-screen-detection.spec.ts`** - Primary white screen detection and prevention tests
- **`loading-transitions.spec.ts`** - Loading screen behavior and smooth transitions
- **`network-conditions.spec.ts`** - Network condition testing (slow, fast, offline)
- **`visual-regression.spec.ts`** - Visual comparison and regression testing
- **`cache-scenarios.spec.ts`** - Cache behavior and fresh/cached loads
- **`automated-monitoring.spec.ts`** - Continuous monitoring and health checks

### Support Files

- **`test-helpers.ts`** - Utility functions and test helpers
- **`README.md`** - This documentation

## Quick Start

### Run All White Screen Tests
```bash
npm run test:white-screen
```

### Run Quick Health Check
```bash
npm run test:white-screen:quick
```

### Start Continuous Monitoring
```bash
npm run test:white-screen:watch
```

### Run Individual Test Suites
```bash
npm run test:detection     # Basic white screen detection
npm run test:loading       # Loading transitions
npm run test:network       # Network conditions
npm run test:visual        # Visual regression
npm run test:cache         # Cache scenarios
npm run test:monitoring    # Automated monitoring
```

## Test Scenarios Covered

### 1. White Screen Detection (`white-screen-detection.spec.ts`)
- Initial page load validation
- Page refresh behavior
- Loading sequence monitoring
- Network condition handling
- Essential UI component presence
- JavaScript error resilience
- Cross-browser consistency

### 2. Loading Transitions (`loading-transitions.spec.ts`)
- Loading screen appearance timing
- Smooth transitions between states
- Connection speed adaptation
- Cache behavior impact
- Interactive loading scenarios
- Mobile device testing

### 3. Network Conditions (`network-conditions.spec.ts`)
- Fast WiFi behavior
- 4G/3G mobile connections
- Slow network handling
- Offline state management
- Timeout handling
- Network recovery testing

### 4. Visual Regression (`visual-regression.spec.ts`)
- Screenshot analysis
- Visual state monitoring
- Responsive design consistency
- Interaction visual stability
- Cross-browser visual comparison
- White screen vs loading detection

### 5. Cache Scenarios (`cache-scenarios.spec.ts`)
- Fresh load behavior
- Cached load performance
- Partial cache scenarios
- Cache invalidation
- Storage persistence
- Rapid reload handling

### 6. Automated Monitoring (`automated-monitoring.spec.ts`)
- Continuous health checks
- Performance regression detection
- Multi-scenario validation
- Error resilience testing
- Production readiness checks

## Test Results and Reporting

### Generated Reports
- **`test-results/white-screen-report.json`** - Detailed JSON results
- **`test-results/white-screen-summary.txt`** - Human-readable summary
- **`test-results/*.png`** - Screenshots from failed tests

### Key Metrics Tracked
- Total load time
- Time to first content
- Time to interactive
- Loading screen duration
- White screen flash detection
- Cache hit ratios
- Error counts

## Continuous Integration

### Pre-commit Hook Example
```bash
#!/bin/sh
npm run test:white-screen:quick
```

### CI/CD Pipeline Integration
```yaml
- name: White Screen Detection Tests
  run: npm run test:white-screen

- name: Upload Test Results
  uses: actions/upload-artifact@v3
  with:
    name: white-screen-test-results
    path: test-results/
```

## Development Workflow

### During Development
```bash
# Start watch mode for continuous testing
npm run test:white-screen:watch

# Quick check after changes
npm run test:white-screen:quick
```

### Before Deployment
```bash
# Full test suite
npm run test:white-screen

# Check specific scenarios
npm run test:network
npm run test:cache
```

### Debugging Failed Tests
```bash
# Debug mode with browser
npm run test-debug

# UI mode for interactive debugging
npm run test-ui
```

## Browser Support

Tests run across multiple browsers:
- **Chromium** (Chrome/Edge)
- **Firefox**
- **WebKit** (Safari)
- **Mobile Chrome** (Pixel 5 simulation)
- **Mobile Safari** (iPhone 12 simulation)

## Performance Thresholds

### Load Time Limits
- **Total load time**: < 15 seconds
- **Time to first content**: > 0 (must show content)
- **Cache hit improvement**: Cached loads should be faster

### Quality Gates
- **No white screen flashes**: Zero tolerance
- **Loading indicators**: Must appear on slow connections
- **Content visibility**: 100% success rate
- **Error resilience**: Pass with console errors present

## Troubleshooting

### Common Issues

#### Tests Failing Locally
1. Ensure app is running: `npm run dev`
2. Check port 3000 is available
3. Clear browser cache: `npm run test -- --ignore-default-args --disable-web-security`

#### Network Tests Failing
1. Verify CDP support in browser
2. Check firewall/proxy settings
3. Run with single browser: `npx playwright test --project=chromium`

#### Visual Tests Failing
1. Update baselines: `npx playwright test --update-snapshots`
2. Check display scaling/resolution
3. Run in headed mode: `npx playwright test --headed`

### Debug Commands
```bash
# Verbose output
npm run test:white-screen -- --verbose

# Single test file
npx playwright test tests/white-screen-detection.spec.ts

# Specific test
npx playwright test -g "Initial page load"

# Generate trace
npx playwright test --trace on
```

## Configuration

### Playwright Config
Tests use the main `playwright.config.ts` with:
- Base URL: `http://localhost:3000`
- Timeout: 30 seconds per test
- Retries: 2 on CI, 0 locally
- Screenshots: On failure
- Videos: On failure

### Environment Variables
```bash
# Optional: Adjust test timeouts
PLAYWRIGHT_TIMEOUT=30000

# Optional: Enable debug logging
DEBUG=pw:api
```

## Best Practices

### Test Writing
1. Use the `test-helpers.ts` utilities
2. Always check for both loading and error states
3. Take screenshots on failures
4. Use descriptive test names
5. Add console logging for debugging

### Maintenance
1. Update visual baselines when UI changes
2. Adjust performance thresholds as needed
3. Review test results regularly
4. Update browser versions periodically

## Support

For issues with the white screen detection tests:
1. Check the test results in `test-results/`
2. Review console output for error details
3. Use debug mode for step-by-step investigation
4. Update test expectations if app behavior changes

## Future Enhancements

Planned improvements:
- Real-time monitoring dashboard
- Performance trend analysis
- Automated test scheduling
- Integration with error tracking
- A/B testing support