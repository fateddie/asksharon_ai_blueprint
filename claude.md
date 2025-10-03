# Personal Assistant - Project Context

## Project Overview
A full-stack Personal Assistant application built with Next.js 14, designed to be scalable, secure, and user-friendly. The app serves as a comprehensive personal productivity platform with modern UI/UX patterns.

**Core Technologies:**
- **Frontend:** Next.js 14 with App Router, TypeScript, SSR
- **Backend:** Supabase (PostgreSQL, Auth, Real-time)
- **Styling:** Tailwind CSS + DaisyUI components
- **Deployment:** Vercel (Free Plan)
- **Payment:** Stripe (future integration)

## Development Guidelines

### Code Standards
- **Always use TypeScript** - No JavaScript files
- **Component-first architecture** - Break down into small, reusable components
- **DaisyUI for all UI** - Maintain consistent styling
- **Document every component** - Include purpose, functionality, and location comments
- **Vercel-compatible endpoints** - All APIs must work on Vercel deployment

### File Structure Rules
- **All UI components** → `/components` folder (root level only)
- **No nested component folders** - Keep flat structure
- **Consistent naming** - Use PascalCase for components, kebab-case for files
- **SSR-first approach** - Leverage Next.js App Router features

### Performance & Scalability
- **Async operations** - Use streaming for long API calls (OpenAI, external APIs)
- **Client-side rendering** when appropriate for quick data display
- **Optimize database queries** - Use Supabase efficiently
- **Error handling & logging** - Comprehensive error management
- **Rate limiting & security** - Protect all exposed endpoints

### Security Requirements
- **Secure database access** - Follow Supabase best practices
- **API key protection** - Never expose secrets
- **Input validation** - Validate all user inputs
- **Authentication flows** - Secure user management

## Architecture Patterns

### Component Strategy
```
/components
  ├── ui/           # DaisyUI-based UI primitives
  ├── forms/        # Form components with validation
  ├── layout/       # Layout and navigation components
  └── features/     # Feature-specific components
```

### API Design
- **RESTful endpoints** under `/app/api/`
- **Async/await patterns** for external API calls
- **Structured error responses** with proper HTTP codes
- **Response type definitions** for TypeScript

### State Management
- **Server components first** - Leverage SSR
- **Client state** with React hooks: `useState`, `useEffect`, `useRef`
- **No complex state management** - Keep it simple

## Testing Strategy
- **Component testing** - Test UI components in isolation
- **API endpoint testing** - Verify all endpoints work correctly
- **Integration testing** - Test full user flows
- **Vercel deployment testing** - Always test on actual deployment

## Development Workflow
1. **Plan** → Create detailed step-by-step approach
2. **Read existing code** → Understand current implementation
3. **Implement incrementally** → Small, testable changes
4. **Test locally** → Verify functionality at localhost:3000
5. **Deploy & verify** → Test on Vercel deployment

## Environment Configuration
```bash
# Required environment variables
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
STRIPE_SECRET_KEY= (future)
STRIPE_PUBLISHABLE_KEY= (future)
```

## Common Commands
```bash
# Development
npm run dev              # Start development server
npm run build           # Build for production
npm run start           # Start production server
npm run lint            # Run ESLint
npm run type-check      # TypeScript checking

# Deployment
vercel --prod           # Deploy to production
```

## Quality Gates
- [ ] TypeScript compilation passes
- [ ] ESLint passes with no errors
- [ ] All components have proper documentation
- [ ] DaisyUI components used consistently
- [ ] Responsive design implemented
- [ ] Error handling implemented
- [ ] Performance optimized
- [ ] Vercel deployment successful

## Current Status
- ✅ Claude CLI installed and configured
- ✅ Project principles established
- 🔄 Next.js project setup (pending)
- ⏳ Supabase integration (planned)
- ⏳ DaisyUI styling setup (planned)
- ⏳ Component library creation (planned)

## Notes
- Prioritize user experience and fast loading times
- Maintain clean, readable, and maintainable code
- Follow the 23 rules specified in user requirements
- Always preserve existing functionality when adding features
- Use consistent styling patterns from existing components

