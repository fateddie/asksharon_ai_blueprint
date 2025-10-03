# Prompt Templates

Pre-crafted prompts for different Claude Code session types, aligned with coaching principles.

---

## Start a Session

```
Load project memory from `principles.md` and `claude.md`. 

Today's goal: [SPECIFIC_GOAL]
Success criteria: [MEASURABLE_OUTCOMES]
Time constraint: [DURATION]

Please:
1. Summarize project constraints and current status
2. Propose a step-by-step plan with validation checkpoints
3. Identify any missing context or artifacts needed
4. Suggest appropriate git branch strategy
5. Start with small, reversible changes

Coach me through each step using principles (A,T,P,V,H).
```

---

## Design / Exploration

```
Before implementing [FEATURE/COMPONENT], help me explore the design space:

Context: [BRIEF_DESCRIPTION]
Requirements: [USER_NEEDS]
Constraints: [TECHNICAL_LIMITS]

Please:
1. Search existing codebase for similar patterns
2. Explain current behavior and architecture
3. Propose 2-3 alternative approaches with trade-offs
4. Identify testing strategy and validation points
5. Highlight security and performance considerations
6. Recommend the best path forward with rationale

Use tools to discover existing code rather than assumptions.
```

---

## Refactoring

```
I need to refactor [COMPONENT/MODULE] to [GOAL].

Current pain points: [ISSUES]
Success criteria: [OUTCOMES]
Risk tolerance: [LOW/MEDIUM/HIGH]

Please:
1. Analyze current implementation with tools (don't assume)
2. Identify hotspots and dependencies 
3. Propose minimal risky changes with clear diffs
4. Create backup/rollback strategy
5. Add regression tests before changes
6. Break into small, reviewable steps
7. Validate each step before proceeding

Keep existing functionality intact while improving [SPECIFIC_ASPECT].
```

---

## Debugging

```
I'm experiencing [PROBLEM_DESCRIPTION] in [COMPONENT/AREA].

Symptoms: [WHAT_YOU_SEE]
Expected: [WHAT_SHOULD_HAPPEN]
Context: [WHEN_IT_OCCURS]

Please:
1. Reproduce the issue using available tools
2. Form hypotheses about root causes
3. Create minimal test case to isolate problem
4. Propose targeted fix with explanation
5. Add regression tests to prevent recurrence
6. Verify fix doesn't break existing functionality

Use systematic debugging approach, not guesswork.
```

---

## Documentation

```
Generate developer documentation for [COMPONENT/API/FEATURE].

Audience: [TEAM_MEMBERS/NEW_DEVELOPERS/API_CONSUMERS]
Scope: [SPECIFIC_AREAS]

Please:
1. Analyze actual code implementation (don't assume)
2. Extract key concepts, patterns, and APIs
3. Create concise, practical documentation with examples
4. Include common gotchas and troubleshooting
5. Link to relevant tests and validation
6. Ensure docs stay in sync with code

Focus on what developers actually need to know to use/maintain this code.
```

---

## Testing

```
Help me add comprehensive testing for [COMPONENT/FEATURE].

Current coverage: [STATUS]
Testing goals: [UNIT/INTEGRATION/E2E]
Framework: [JEST/VITEST/PLAYWRIGHT/etc]

Please:
1. Analyze component behavior and edge cases
2. Identify critical paths and failure modes  
3. Create test strategy with clear scope
4. Generate tests with good assertions
5. Ensure tests are maintainable and fast
6. Validate tests actually catch regressions

Focus on meaningful tests that provide confidence, not just coverage.
```

---

## Code Review

```
Please review [COMPONENT/PR/CHANGE] against our project standards.

Changes: [SUMMARY]
Context: [WHY_CHANGED]

Please check:
1. Adherence to principles.md and claude.md guidelines
2. TypeScript/DaisyUI/Next.js best practices
3. Security and performance implications
4. Test coverage and validation
5. Documentation updates needed
6. Vercel deployment compatibility

Provide specific feedback with examples and suggest improvements.
```

---

## Feature Development

```
I want to build [FEATURE] for the Personal Assistant app.

User story: [AS_A_USER_I_WANT_SO_THAT]
Acceptance criteria: [SPECIFIC_REQUIREMENTS]
Technical constraints: [LIMITS/DEPENDENCIES]

Please:
1. Break down into implementable tasks
2. Design component architecture following our patterns
3. Plan API endpoints and data flow
4. Consider security, performance, and UX
5. Create development timeline with checkpoints
6. Start with smallest viable implementation
7. Plan testing and validation strategy

Follow our 23 development rules and use DaisyUI components.
```

---

## Quick Fix

```
I need a quick fix for [SPECIFIC_ISSUE].

Problem: [DESCRIPTION]
Urgency: [HIGH/MEDIUM/LOW]
Risk tolerance: [CONSERVATIVE/BALANCED/AGGRESSIVE]

Please:
1. Identify minimal change needed
2. Verify fix doesn't break existing functionality
3. Add quick test to validate solution
4. Document any technical debt created
5. Suggest follow-up improvements if needed

Prioritize safety over perfection for urgent fixes.
```

---

## Code Quality

```
Help me improve code quality in [AREA/FILE].

Current issues: [LINTING_ERRORS/PERFORMANCE/MAINTAINABILITY]
Standards: [SPECIFIC_METRICS]

Please:
1. Analyze current code quality with tools
2. Identify specific improvement opportunities
3. Prioritize changes by impact vs effort
4. Make incremental improvements with validation
5. Update relevant documentation/tests
6. Ensure changes align with project guidelines

Focus on sustainable improvements that add real value.
```

---

## Usage Notes

- **Customize** each template with specific project context
- **Start small** - prefer focused sessions over large changes  
- **Validate early** - include checkpoints and tests
- **Document learning** - update learning_log.md after sessions
- **Stay aligned** - reference principles.md and claude.md regularly

