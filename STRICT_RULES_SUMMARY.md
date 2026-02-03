# Strict Rules Summary

## 🎯 Core Principle

**ALL components, styling, spacing, colors, font sizes, and design tokens MUST use shadcn/ui components and Tailwind CSS utilities ONLY.**

## ✅ Current Status

### Codebase Audit Results
- ✅ **No inline styles** in application code (only in shadcn/ui core components, which is expected)
- ✅ **No other UI libraries** detected (Material UI, Ant Design, Chakra UI, etc.)
- ✅ **All components** imported from `@/components/ui/*`
- ✅ **All spacing** uses Tailwind utilities
- ✅ **All colors** use CSS variables/semantic tokens
- ✅ **All typography** uses Tailwind utilities

### What Was Found
The only inline styles detected are in:
- `components/ui/sidebar.tsx` - Official shadcn/ui component (do not modify)
- `components/ui/progress.tsx` - Official shadcn/ui component (do not modify)

These are part of the official shadcn/ui library and are acceptable exceptions.

## 📋 Rules Checklist

When adding or modifying code, verify:

- [ ] Components from `@/components/ui/*` only
- [ ] New components installed via: `npx shadcn@latest add [name]`
- [ ] Spacing uses Tailwind: `p-4`, `gap-6`, `space-y-8`, etc.
- [ ] Colors use CSS variables: `bg-background`, `text-foreground`, etc.
- [ ] Typography uses Tailwind: `text-sm`, `font-medium`, etc.
- [ ] No inline styles: `style={{ ... }}`
- [ ] No hardcoded colors: `bg-blue-500`, `text-[#ff0000]`
- [ ] No custom spacing: `p-[13px]`, `margin: 7px`
- [ ] Layout uses Tailwind: `flex`, `grid`, `container`, etc.

## 🚨 Violation Examples

**Never do this:**
```tsx
// ❌ Inline styles
<div style={{ padding: '24px', color: '#333' }}>Content</div>

// ❌ Hardcoded colors
<div className="bg-blue-500 text-[#ff0000]">Content</div>

// ❌ Custom spacing
<div className="p-[13px] m-[7px]">Content</div>

// ❌ Other UI library
import { Button } from "@mui/material";
```

**Always do this:**
```tsx
// ✅ shadcn/ui + Tailwind
import { Button } from "@/components/ui/button";

<div className="p-6 bg-background text-foreground">
  <Button variant="default">Click me</Button>
</div>
```

## 📚 Reference Documents

- **Full Guidelines**: See `CODING_GUIDELINES.md` for complete rules
- **shadcn/ui Components**: https://ui.shadcn.com/docs/components
- **Tailwind CSS**: https://tailwindcss.com/docs

## 🔍 Code Review Checklist

Before submitting code:
1. Run: `npm run lint`
2. Verify: No inline styles in application code
3. Verify: All imports from `@/components/ui/*`
4. Verify: All styling uses Tailwind classes
5. Verify: All colors use CSS variables

---

**This rule is STRICT and NON-NEGOTIABLE. All code must comply.**

