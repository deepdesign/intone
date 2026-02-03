---
name: Complete Rules UI Scaffold
overview: Scaffold the entire rules UI system including updated onboarding wizard, advanced tone rules, complete grammar rules, new numbers/dates/money section, full terminology management, and all coming soon sections with proper microcopy and data models.
todos:
  - id: update-tone-onboarding
    content: "Update tone onboarding wizard: add Enthusiasm and Empathy steps, update all microcopy to match spec exactly, update summary page to generate tone summary"
    status: pending
  - id: add-advanced-tone-rules
    content: "Add advanced tone rules: voice boundaries (no hype, fear, guilt, sarcasm) and surface overrides"
    status: pending
  - id: complete-grammar-rules
    content: "Complete grammar rules: add missing rules (active voice, perspective, full stops, exclamation marks, emoji, brackets, bulleted lists, dashes) and update all microcopy"
    status: pending
  - id: create-numbers-section
    content: "Create new Numbers, dates, and money section: seed rules, create UI component, add to navigation"
    status: pending
  - id: implement-terminology
    content: "Implement full terminology section: preferred terms table, forbidden words split-panel UI, API routes, seed default data"
    status: pending
  - id: update-coming-soon
    content: Update all coming soon sections (logo rules, review/approval) with proper headers, explanations, and badges
    status: pending
  - id: update-editor-mock
    content: Update editor to show mock lint findings using rule schema with proper structure
    status: pending
  - id: update-seed-data
    content: Update all seed files to include new rules and ensure all rule definitions match spec
    status: pending
  - id: update-api-routes
    content: Update API routes to support all new rule categories and terminology CRUD operations
    status: pending
  - id: update-navigation
    content: Update sidebar navigation to include Numbers section and enable Terminology
    status: pending
---

#Complete Rules UI Scaffold

## Overview

Implement the complete rules system for intone with exact microcopy, proper data models, and full UI components. Keep existing onboarding structure but update all microcopy to match specifications. Add new Numbers/Dates/Money as a top-level section.

## Architecture

### Data Model Updates

- Update `RuleDefinition` seed data to include all specified rules
- Add new rule categories: `numbers`, `terminology`
- Extend `CustomRule` to support forbidden words with full metadata
- Ensure all rules have proper `appliesTo` scoping

### Navigation Structure

```javascript
Brand Rules
├── Tone of voice (active)
├── Grammar and punctuation (active)
├── Numbers, dates, and money (active - NEW)
├── Terminology (active - FULL IMPLEMENTATION)
└── Logo rules (coming soon)
```



## Implementation Tasks

### 1. Tone Onboarding Wizard Updates

**Files:**

- `lib/rules/onboarding.ts` - Update step definitions
- `prisma/seed/rules/tone-rules.ts` - Add new rules (enthusiasm, empathy)
- `app/brands/[brandId]/rules/tone/onboarding/steps/*.tsx` - Update all step components

**Changes:**

- Update microcopy for all 7 steps to match spec exactly
- Add new step: Enthusiasm (toggle: Low enthusiasm / Neutral)
- Add new step: Empathy (toggle: Allow empathetic phrasing - support only)
- Update existing steps with exact microcopy:
- Language/locale: "Choose the language and region your brand primarily writes in..."
- Formality: "Formality affects sentence structure, word choice..."
- Confidence: "Some brands make strong claims. Others are careful..."
- Directness: "Direct language helps users understand what to do next..."
- Keep personality constraints and sentence behavior steps but update microcopy
- Update summary page to generate one-paragraph tone summary

### 2. Advanced Tone Rules

**Files:**

- `prisma/seed/rules/tone-rules.ts` - Add voice boundaries rules
- `components/rules/tone-rules-settings.tsx` - Add advanced section
- `app/brands/[brandId]/rules/tone/settings/page.tsx` - Update layout

**New Rules:**

- Voice boundaries: no hype, no fear, no guilt, no sarcasm (toggles)
- Surface overrides: allow different tone settings per surface (UI, marketing, support)

### 3. Grammar Rules - Complete Implementation

**Files:**

- `prisma/seed/rules/grammar-rules.ts` - Add all missing rules
- `components/rules/grammar-rules-settings.tsx` - Complete UI with all rules
- `app/brands/[brandId]/rules/grammar/page.tsx` - Update layout

**New/Missing Rules to Add:**

- Active voice (toggle, default on)
- Perspective (radio: Second person / First person for help articles)
- Full stops (multi-toggle: Body copy On, Headings Off)
- Exclamation marks (select: Never / Rarely max one)
- Emoji (toggle, default off)
- Brackets (select: Restrict usage)
- Bulleted lists (multi-control: One idea per bullet, No full stops, Auto capitalisation)
- Dashes (select: Em dash for emphasis / En dash for ranges)

**Update Existing:**

- Sentence case, Contractions, Ellipses, Slashes, Ampersands - ensure exact microcopy

### 4. Numbers, Dates, Money - New Section

**Files:**

- `prisma/seed/rules/numbers-rules.ts` - NEW: Create seed file
- `components/rules/numbers-rules-settings.tsx` - NEW: Create component
- `app/brands/[brandId]/rules/numbers/page.tsx` - NEW: Create page
- `components/app-sidebar.tsx` - Add navigation item
- `app/api/brands/[brandId]/rules/route.ts` - Support numbers category

**Rules to Implement:**

- Numbers (select: Use numerals / Spell out at sentence start)
- Large numbers (toggle: Allow k/m/bn)
- Ranges (select: Use 'From...to...' and 'Between...and...')
- Dates (locale-driven, optional toggle: Include day name)
- Time (controls: 12-hour clock, Space before am/pm, En dash for ranges)
- Currency naming (toggle: Explain currency codes on first mention)
- Currency formatting (select: Code after number, Symbols disallowed unless market-specific)

### 5. Terminology - Full Implementation

**Files:**

- `app/brands/[brandId]/rules/terminology/page.tsx` - Replace ComingSoon
- `components/rules/terminology/preferred-terms.tsx` - NEW: Table component
- `components/rules/terminology/forbidden-words.tsx` - NEW: Split-panel UI
- `app/api/brands/[brandId]/rules/terminology/route.ts` - NEW: API routes
- `prisma/seed/rules/terminology-rules.ts` - NEW: Seed default forbidden words

**Preferred Terms Table:**

- Columns: Preferred term, Allowed alternatives, Notes
- Default terms: login/log in, markup/mark up, dropdown, email, wifi, driver licence, text, view, select vs choose
- Editable table with add/edit/delete

**Forbidden Words UI:**

- Left panel: Searchable vertical list of forbidden words
- Right panel: Detail view with:
- Why this word is avoided
- What to use instead
- Do / Don't examples
- Scope selector (multi-select)
- Severity selector (warn / block)
- Exceptions field
- Default forbidden words: etc., and more, e.g., click (UI), percent, SMS/text message, Wi-Fi/WIFI, driver's licence, emojis (global), excessive punctuation

**Data Model:**

- Extend `CustomRule` usage for forbidden words
- Add API routes for CRUD operations
- Support search and filtering

### 6. Coming Soon Sections

**Files:**

- `app/brands/[brandId]/rules/logo/page.tsx` - Update with proper coming soon
- `app/brands/[brandId]/review/page.tsx` - NEW: Review and approval
- `components/coming-soon.tsx` - Update component

**Requirements:**

- Section header
- Short explanation
- "Coming soon" badge
- No broken links
- Consistent styling

### 7. Editor Updates

**Files:**

- `components/editor/editor-panel.tsx` - Update with mock lint
- `app/api/brands/[brandId]/lint/route.ts` - Return structured mock findings

**Mock Lint Findings:**

- Use rule schema to structure findings
- Show triggered rules with explanations
- Display severity (warn/block)
- Show suggested fixes
- Surface selector (UI, marketing, support)

### 8. Seed Data Updates

**Files:**

- `prisma/seed/rules/tone-rules.ts` - Add enthusiasm, empathy, voice boundaries
- `prisma/seed/rules/grammar-rules.ts` - Add all missing grammar rules
- `prisma/seed/rules/numbers-rules.ts` - NEW: All numbers/dates/money rules
- `prisma/seed/rules/terminology-rules.ts` - NEW: Default forbidden words
- `prisma/seed.ts` - Update to seed all new rule categories

### 9. API Routes

**Files:**

- `app/api/brands/[brandId]/rules/route.ts` - Support all categories
- `app/api/brands/[brandId]/rules/terminology/route.ts` - NEW: Terminology CRUD
- `app/api/rule-definitions/route.ts` - Support numbers category

### 10. Navigation Updates

**Files:**

- `components/app-sidebar.tsx` - Add Numbers section, enable Terminology
- Ensure all routes are properly linked

## Microcopy Standards

All microcopy must match the specification exactly:

- Educational tone
- Explain why rules exist
- Include Do / Don't examples
- Clear scope indicators
- Severity indicators where applicable

## UI Component Standards

- Use shadcn/ui components exclusively
- Follow shadcn blocks patterns for layouts
- Collapsible cards for advanced rules
- Proper spacing using Tailwind tokens
- Responsive design
- Dark mode support

## Testing Considerations

- Verify all rule definitions seed correctly
- Test onboarding flow end-to-end