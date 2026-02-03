---
name: Code Hygiene Check System
overview: Create a comprehensive code hygiene and project structure check system consisting of an automated TypeScript script and a detailed markdown checklist document. The system will validate project structure, code quality, styling consistency, API patterns, TypeScript usage, React patterns, and file organization.
todos:
  - id: create-check-script
    content: Create the main TypeScript check script (scripts/check-code-hygiene.ts) with file system traversal, AST parsing, and pattern matching capabilities
    status: completed
  - id: implement-structure-checks
    content: Implement project structure validation (API routes, dynamic segments, file organization)
    status: completed
    dependencies:
      - create-check-script
  - id: implement-code-quality-checks
    content: Implement code quality checks (TypeScript, error handling, authentication, imports)
    status: completed
    dependencies:
      - create-check-script
  - id: implement-styling-checks
    content: Implement styling compliance checks (inline styles, hardcoded colors, Tailwind usage, shadcn/ui)
    status: completed
    dependencies:
      - create-check-script
  - id: implement-api-pattern-checks
    content: Implement API route pattern validation (params consistency, error handling, authentication)
    status: completed
    dependencies:
      - create-check-script
  - id: create-checklist-doc
    content: Create comprehensive CODE_HYGIENE_CHECKLIST.md document with all manual review items
    status: completed
  - id: add-package-script
    content: Add check:hygiene script to package.json
    status: completed
    dependencies:
      - create-check-script
  - id: create-report-formatter
    content: Implement report formatting with color-coded output, statistics, and JSON export option
    status: completed
    dependencies:
      - create-check-script
---

# Code Hygiene and Project Structure Check System

## Overview

Create a comprehensive, reusable code hygiene check system that can be run on-demand to validate project structure, code quality, styling consistency, and adherence to project standards.

## Components

### 1. Automated Check Script (`scripts/check-code-hygiene.ts`)

A TypeScript script that performs automated checks and generates a report. The script will:

- **Project Structure Checks**:
- Verify Next.js App Router structure (`app/` directory organization)
- Check API route naming conventions (`route.ts` files in correct locations)
- Validate dynamic route segments (`[brandSlug]` vs `[brandId]` consistency)
- Ensure component organization (`components/` structure)
- Verify lib utilities organization
- Check for orphaned files or misplaced components
- **Code Quality Checks**:
- API route parameter consistency (all `[brandSlug]` routes should use `brandSlug` in params type)
- Error handling patterns (consistent try-catch, Zod validation, proper status codes)
- Authentication checks (all protected routes use `getCurrentUser`)
- TypeScript strict mode compliance
- Import path consistency (`@/` alias usage)
- Unused imports detection
- Missing error boundaries
- **Styling Compliance Checks**:
- Detect inline styles (`style={{...}}`)
- Find hardcoded colors (`bg-blue-500`, `text-[#ff0000]`, etc.)
- Detect custom spacing values outside Tailwind scale (`p-[13px]`, `m-[7px]`)
- Verify shadcn/ui component usage (`@/components/ui/*` imports)
- Check for forbidden UI libraries
- Validate CSS variable usage for colors
- Detect missing `space-y-2` on Label + Input/Select combinations
- **File Naming Conventions**:
- Component files: PascalCase (e.g., `BrandSelector.tsx`)
- API routes: `route.ts`
- Utility files: kebab-case or camelCase
- Page files: `page.tsx`, `layout.tsx`
- **React Patterns**:
- Client component directives (`"use client"`)
- Server component usage (no unnecessary client components)
- Hook usage patterns
- Props type definitions

The script will output:

- Summary statistics (total files checked, issues found)
- Categorized issue list with file paths and line numbers
- Severity levels (error, warning, info)
- JSON report option for CI/CD integration

### 2. Detailed Checklist Document (`CODE_HYGIENE_CHECKLIST.md`)

A comprehensive markdown document organized by category:

#### Project Structure

- [ ] All API routes follow `/app/api/.../route.ts` pattern
- [ ] Dynamic routes use `[brandSlug]` consistently (not `[brandId]`)
- [ ] Components are organized by feature in `components/`
- [ ] Shared utilities are in `lib/`
- [ ] Hooks are in `hooks/`
- [ ] No files in root except config files
- [ ] Page files use `page.tsx` naming
- [ ] Layout files use `layout.tsx` naming

#### Code Quality

- [ ] All API routes have proper error handling
- [ ] All protected routes check authentication
- [ ] Zod schemas for all API inputs
- [ ] Consistent error response format
- [ ] TypeScript strict mode enabled
- [ ] No `any` types (except where necessary with comments)
- [ ] Proper async/await usage
- [ ] No console.log in production code (use proper logging)

#### Styling Compliance

- [ ] No inline styles
- [ ] All colors use CSS variables or semantic tokens
- [ ] All spacing uses Tailwind utilities
- [ ] All components use shadcn/ui base components
- [ ] No hardcoded color values
- [ ] No custom spacing outside Tailwind scale
- [ ] Label + Input/Select combinations have `space-y-2` wrapper

#### API Route Patterns

- [ ] All `[brandSlug]` routes use `brandSlug` in params type
- [ ] Brand access checks using `hasBrandAccess`
- [ ] Consistent error response structure
- [ ] Proper HTTP status codes
- [ ] Runtime export for Node.js routes when needed

#### React Patterns

- [ ] Client components marked with `"use client"`
- [ ] Server components used when possible
- [ ] Proper hook usage (no conditional hooks)
- [ ] Props properly typed
- [ ] No prop drilling (use context when needed)

#### File Organization

- [ ] Related files grouped together
- [ ] No circular dependencies
- [ ] Barrel exports where appropriate
- [ ] Consistent import ordering

### 3. Package.json Script

Add a new script to run the check:

```json
"check:hygiene": "tsx scripts/check-code-hygiene.ts"
```

### 4. Integration Points

- **Pre-commit hook** (optional): Run checks before commits
- **CI/CD**: Run in GitHub Actions or similar
- **Manual**: Run via `npm run check:hygiene`

## Implementation Details

### Script Architecture

The script will use:

- `fs` and `path` for file system operations
- AST parsing (via `@typescript-eslint/parser` or similar) for code analysis
- Regex patterns for pattern matching where AST is overkill
- Color-coded terminal output for readability
- Exit codes for CI/CD integration (0 = success, 1 = issues found)

### Check Categories

1. **Critical Errors** (must fix):

- Inline styles
- Hardcoded colors
- Missing authentication checks
- TypeScript errors
- Incorrect API route params

2. **Warnings** (should fix):

- Inconsistent patterns
- Missing error handling
- Unused imports
- Custom spacing values

3. **Info** (nice to have):

- Code organization suggestions
- Performance optimizations
- Best practice recommendations

### Output Format

```javascript
Code Hygiene Check Report
==========================

📁 Project Structure: 45 files checked
   ✅ All API routes follow conventions
   ⚠️  2 files with inconsistent naming
   ❌ 1 file in wrong location

💻 Code Quality: 132 files checked
   ✅ TypeScript strict mode compliant
   ⚠️  5 files missing error handling
   ❌ 2 files with 'any' types

🎨 Styling: 89 files checked
   ✅ shadcn/ui usage correct
   ⚠️  3 files with custom spacing
   ❌ 1 file with inline styles

Total Issues: 15 (3 errors, 8 warnings, 4 info)
```

## Files to Create/Modify

1. **Create**: `scripts/check-code-hygiene.ts` - Main check script ✅
2. **Create**: `CODE_HYGIENE_CHECKLIST.md` - Manual checklist document ✅
3. **Modify**: `package.json` - Add `check:hygiene` script ✅
4. **Create**: `.github/workflows/code-hygiene.yml` (optional) - CI/CD integration ✅

## Usage

- **Manual check**: `npm run check:hygiene`
- **Before commit**: Run checklist manually or via hook
- **CI/CD**: Automatically run on PRs
- **Periodic review**: Weekly/monthly full checklist review

## Future Enhancements

- Auto-fix capability for simple issues (formatting, import ordering)