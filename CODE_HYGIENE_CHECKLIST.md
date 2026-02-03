# Code Hygiene and Project Structure Checklist

This comprehensive checklist should be used for manual code reviews, pull request reviews, and periodic code audits. Use this in conjunction with the automated `npm run check:hygiene` script.

## How to Use This Checklist

- **Before Committing**: Review relevant sections for your changes
- **Pull Request Reviews**: Use as a guide for reviewing code
- **Weekly/Monthly Audits**: Complete full checklist periodically
- **Onboarding**: New team members should familiarize themselves with all sections

---

## 📁 Project Structure

### File Organization

- [ ] All API routes follow `/app/api/.../route.ts` pattern
- [ ] Dynamic route segments use `[brandSlug]` consistently (not `[brandId]`)
- [ ] Page files use `page.tsx` naming convention
- [ ] Layout files use `layout.tsx` naming convention
- [ ] Components are organized by feature in `components/` directory
- [ ] Shared utilities are in `lib/` directory
- [ ] Custom hooks are in `hooks/` directory
- [ ] No files in root directory except config files (package.json, tsconfig.json, etc.)
- [ ] Related files are grouped together (e.g., component + its types + its tests)
- [ ] No orphaned files or misplaced components

### Naming Conventions

- [ ] Component files use PascalCase (e.g., `BrandSelector.tsx`, `UserProfile.tsx`)
- [ ] Hook files use camelCase with `use` prefix (e.g., `useBrandData.ts`)
- [ ] Utility files use kebab-case or camelCase (e.g., `format-date.ts` or `formatDate.ts`)
- [ ] API route files are named `route.ts`
- [ ] Type definition files use descriptive names (e.g., `types.ts`, `api-types.ts`)

### Directory Structure

- [ ] `app/` directory follows Next.js App Router conventions
- [ ] `components/` directory is organized by feature/domain
- [ ] `lib/` directory contains only shared utilities and helpers
- [ ] `public/` directory contains only static assets
- [ ] No circular dependencies between modules

---

## 💻 Code Quality

### TypeScript

- [ ] TypeScript strict mode is enabled and compliant
- [ ] No `any` types (except where necessary with explanatory comments)
- [ ] All function parameters and return types are explicitly typed
- [ ] Interfaces/types are defined for complex objects
- [ ] Generic types are used appropriately
- [ ] Type assertions are minimal and justified

### Error Handling

- [ ] All API routes have proper error handling (try-catch blocks)
- [ ] Error responses follow consistent format
- [ ] Error messages are user-friendly in production
- [ ] Detailed error information is available in development mode
- [ ] Zod validation errors are properly formatted
- [ ] Async operations have error handling

### Authentication & Authorization

- [ ] All protected API routes check authentication using `getCurrentUser`
- [ ] Brand access is verified using `hasBrandAccess` where applicable
- [ ] User permissions are checked before sensitive operations
- [ ] Unauthorized access attempts return proper 401/403 status codes

### Input Validation

- [ ] All API route inputs are validated using Zod schemas
- [ ] Validation schemas are defined near the route handlers
- [ ] Validation error messages are clear and actionable
- [ ] File uploads are validated for type and size
- [ ] URL parameters are validated and sanitized

### Code Organization

- [ ] Related code is grouped together
- [ ] Functions are single-purpose and focused
- [ ] No code duplication (DRY principle)
- [ ] Complex logic is extracted into helper functions
- [ ] Comments explain "why", not "what"
- [ ] Dead code is removed

### Imports

- [ ] Import paths use `@/` alias consistently (not relative paths like `../../`)
- [ ] Imports are organized (external → internal, alphabetical)
- [ ] Unused imports are removed
- [ ] Barrel exports are used where appropriate
- [ ] No circular import dependencies

### Logging

- [ ] No `console.log` in production code
- [ ] Proper logging is used for errors (`console.error`)
- [ ] Sensitive information is not logged
- [ ] Log levels are appropriate (error, warn, info, debug)

---

## 🎨 Styling Compliance

### shadcn/ui Usage

- [ ] All UI components are from `@/components/ui/*` (shadcn/ui)
- [ ] New components are installed via `npx shadcn@latest add [component-name]`
- [ ] Custom components extend shadcn/ui base components
- [ ] No other UI libraries are used (Material UI, Ant Design, Chakra UI, etc.)
- [ ] shadcn/ui components are not modified directly

### Tailwind CSS

- [ ] All styling uses Tailwind CSS utilities
- [ ] No inline styles (`style={{...}}`)
- [ ] No CSS modules for styling (only for component-specific logic if needed)
- [ ] All spacing uses Tailwind utilities (`p-*`, `m-*`, `gap-*`, `space-*`)
- [ ] Spacing values use standard Tailwind scale (0, 0.5, 1, 1.5, 2, 3, 4, 6, 8, 12, 16, 24, etc.)
- [ ] No custom spacing values outside Tailwind scale (e.g., `p-[13px]`)

### Colors

- [ ] All colors use CSS variables or semantic tokens
- [ ] No hardcoded colors (`bg-blue-500`, `text-[#ff0000]`, etc.)
- [ ] Color utilities use semantic names (`bg-primary`, `text-foreground`, `bg-card`, etc.)
- [ ] Dark mode colors are considered and tested
- [ ] Color contrast meets accessibility standards

### Typography

- [ ] All typography uses Tailwind utilities (`text-sm`, `text-base`, `font-medium`, etc.)
- [ ] No custom font sizes (`text-[13px]`, `font-size: 15px`)
- [ ] Semantic text utilities are used (`text-muted-foreground`, `text-foreground`)
- [ ] Font weights use Tailwind scale (`font-normal`, `font-medium`, `font-semibold`, `font-bold`)

### Layout & Spacing

- [ ] Label + Input/Select/Textarea combinations are wrapped in `div` with `space-y-2` class
- [ ] Consistent spacing patterns throughout the application
- [ ] Responsive design uses Tailwind breakpoints (`md:`, `lg:`, `xl:`)
- [ ] Grid and flexbox layouts use Tailwind utilities

### Borders & Effects

- [ ] Borders use Tailwind utilities (`border`, `rounded-md`, etc.)
- [ ] Border colors use semantic tokens (`border-border`)
- [ ] Shadows use Tailwind utilities (`shadow-sm`, `shadow-md`, etc.)
- [ ] No custom border styles (`border-[2px]`, `border-solid`)

---

## 🔌 API Route Patterns

### Route Structure

- [ ] All API routes are in `/app/api/` directory
- [ ] Route files are named `route.ts`
- [ ] Dynamic segments use `[brandSlug]` (not `[brandId]`)
- [ ] Route parameters match directory structure (e.g., `[brandSlug]` directory → `brandSlug` in params)

### Route Handlers

- [ ] HTTP methods are properly exported (`GET`, `POST`, `PUT`, `PATCH`, `DELETE`)
- [ ] Route handlers are async functions
- [ ] `runtime = "nodejs"` is exported for routes that need it
- [ ] Request parameters are properly typed

### Authentication

- [ ] All protected routes call `getCurrentUser()` or `getCurrentUser(req)`
- [ ] Unauthorized requests return 401 status
- [ ] Brand access is verified using `hasBrandAccess` for brand-specific routes
- [ ] Forbidden requests return 403 status

### Error Handling

- [ ] All route handlers are wrapped in try-catch blocks
- [ ] Error responses follow consistent format:
  ```typescript
  {
    error: "Error message",
    message?: "Detailed message (dev only)",
    details?: "Additional info"
  }
  ```
- [ ] Proper HTTP status codes are used (400, 401, 403, 404, 500)
- [ ] Zod validation errors return 400 with details
- [ ] Development mode includes stack traces where appropriate

### Input Validation

- [ ] POST/PUT/PATCH handlers validate input with Zod schemas
- [ ] Request body is parsed and validated before use
- [ ] Query parameters are validated when used
- [ ] File uploads are validated for type, size, and content

### Response Format

- [ ] Success responses use `NextResponse.json()`
- [ ] Response status codes are appropriate (200, 201, 204)
- [ ] Error responses include proper Content-Type headers
- [ ] JSON responses are properly formatted

---

## ⚛️ React Patterns

### Component Types

- [ ] Client components are marked with `"use client"` directive
- [ ] Server components are used when possible (no unnecessary client components)
- [ ] Client components are only used when needed (hooks, interactivity, browser APIs)
- [ ] Component files are properly organized (one component per file, or related components together)

### Hooks

- [ ] React hooks are used correctly (Rules of Hooks)
- [ ] No conditional hook calls
- [ ] Custom hooks are properly named with `use` prefix
- [ ] Hook dependencies are correctly specified in dependency arrays
- [ ] useEffect cleanup functions are used when needed

### Props & State

- [ ] Component props are properly typed with TypeScript interfaces or types
- [ ] Props are destructured appropriately
- [ ] Default props are used when appropriate
- [ ] State is managed at the appropriate level (local vs. global)
- [ ] No unnecessary prop drilling (use context when needed)

### Performance

- [ ] `useMemo` is used for expensive computations
- [ ] `useCallback` is used for functions passed as props
- [ ] Components are memoized when appropriate (`React.memo`)
- [ ] Large lists use virtualization if needed
- [ ] Images use Next.js `Image` component with proper optimization

### Data Fetching

- [ ] Server components fetch data directly
- [ ] Client components use proper data fetching patterns (useEffect, SWR, React Query, etc.)
- [ ] Loading states are handled
- [ ] Error states are handled
- [ ] Data is cached appropriately

---

## 📦 File Organization

### Imports

- [ ] Imports are organized logically:
  1. External libraries
  2. Internal utilities (`@/lib/*`)
  3. Components (`@/components/*`)
  4. Types
  5. Relative imports (if any)
- [ ] Imports within each group are alphabetical
- [ ] Unused imports are removed
- [ ] Type-only imports use `import type`

### Exports

- [ ] Default exports are used for page components and main components
- [ ] Named exports are used for utilities and shared components
- [ ] Barrel exports (`index.ts`) are used where appropriate
- [ ] Exports are clearly named and documented

### Code Structure

- [ ] Related functions and types are grouped together
- [ ] Complex logic is extracted into separate functions
- [ ] Constants are defined at the top of files or in separate files
- [ ] Type definitions are near their usage or in separate type files

---

## 🔍 Additional Checks

### Security

- [ ] No sensitive data in client-side code
- [ ] API keys and secrets are in environment variables
- [ ] User input is sanitized and validated
- [ ] SQL injection prevention (using Prisma parameterized queries)
- [ ] XSS prevention (React escapes by default, but be cautious with `dangerouslySetInnerHTML`)

### Accessibility

- [ ] Semantic HTML elements are used
- [ ] ARIA labels are used when needed
- [ ] Keyboard navigation is supported
- [ ] Focus management is handled properly
- [ ] Color contrast meets WCAG standards
- [ ] Alt text is provided for images

### Performance

- [ ] Images are optimized (Next.js Image component)
- [ ] Code splitting is used appropriately
- [ ] Large dependencies are lazy-loaded when possible
- [ ] Database queries are optimized (select only needed fields)
- [ ] No unnecessary re-renders

### Testing (if applicable)

- [ ] Critical paths have test coverage
- [ ] Tests are up to date with code changes
- [ ] Test files follow naming conventions (`*.test.ts`, `*.spec.ts`)

---

## 🚀 Quick Reference

### Run Automated Checks

```bash
npm run check:hygiene
```

### Common Issues to Watch For

1. **Inline styles** → Use Tailwind utilities
2. **Hardcoded colors** → Use CSS variables/semantic tokens
3. **Missing authentication** → Add `getCurrentUser()` check
4. **No error handling** → Wrap in try-catch
5. **Missing `"use client"`** → Add directive for client components
6. **Wrong route params** → Use `brandSlug` not `brandId` in `[brandSlug]` routes
7. **Custom spacing** → Use Tailwind scale values
8. **Missing `space-y-2`** → Wrap Label + Input/Select combinations

---

## 📝 Notes

- This checklist should be reviewed and updated as the project evolves
- Not all items may apply to every change
- Use your judgment for edge cases
- When in doubt, refer to `CODING_GUIDELINES.md` for styling rules

---

**Last Updated**: Generated as part of code hygiene check system implementation

