# Coding Guidelines - Strict Rules

## 🚨 CRITICAL RULE: Use shadcn/ui and Tailwind Only

**All components, styling, spacing, colors, font sizes, and design tokens MUST use shadcn/ui components and Tailwind CSS utilities.**

## ✅ Approved Sources

### Components
- **MUST** use components from `@/components/ui/*` (shadcn/ui components)
- **MUST** install new components via: `npx shadcn@latest add [component-name]`
- **MUST NOT** create custom styled components without using shadcn/ui base components
- **MUST NOT** use other UI libraries (Material UI, Ant Design, etc.)

### Spacing
- **MUST** use Tailwind spacing utilities: `p-*`, `m-*`, `px-*`, `py-*`, `gap-*`, `space-x-*`, `space-y-*`
- **MUST** use standard Tailwind spacing scale: `1`, `2`, `3`, `4`, `6`, `8`, `12`, `16`, `24`, etc.
- **MUST NOT** use custom spacing values (e.g., `p-[13px]`, `margin: 7px`)
- **MUST NOT** use inline styles for spacing

### Colors
- **MUST** use CSS variable-based color utilities: `bg-background`, `text-foreground`, `bg-primary`, `text-primary-foreground`, etc.
- **MUST** use semantic color tokens: `bg-card`, `text-muted-foreground`, `border-border`, etc.
- **MUST NOT** use hardcoded colors: `bg-blue-500`, `text-[#ff0000]`, etc.
- **MUST NOT** use inline styles for colors

### Typography
- **MUST** use Tailwind typography utilities: `text-sm`, `text-base`, `text-lg`, `text-xl`, `font-medium`, `font-bold`, etc.
- **MUST** use semantic text utilities: `text-muted-foreground`, `text-foreground`, etc.
- **MUST NOT** use custom font sizes: `text-[13px]`, `font-size: 15px`
- **MUST NOT** use inline styles for typography

### Layout & Display
- **MUST** use Tailwind layout utilities: `flex`, `grid`, `block`, `inline-block`, `hidden`, etc.
- **MUST** use Tailwind responsive utilities: `md:`, `lg:`, `xl:`, etc.
- **MUST** use Tailwind container utilities: `container`, `mx-auto`, etc.

### Borders & Effects
- **MUST** use Tailwind border utilities: `border`, `rounded-md`, `shadow-sm`, etc.
- **MUST** use semantic border colors: `border-border`
- **MUST NOT** use custom border styles: `border-[2px]`, `border-solid`

### Sizing
- **MUST** use Tailwind sizing utilities: `w-full`, `h-10`, `max-w-2xl`, etc.
- **MUST** use standard Tailwind size scale

## ❌ Forbidden Practices

### Never Use:
- ❌ Inline styles: `style={{ margin: '10px', color: 'blue' }}`
- ❌ CSS modules for styling (only for component-specific logic)
- ❌ Custom CSS classes that duplicate Tailwind utilities
- ❌ Other UI libraries (Material UI, Ant Design, Chakra UI, etc.)
- ❌ Custom styled-components without shadcn/ui base
- ❌ Hardcoded color values
- ❌ Custom spacing values outside Tailwind scale
- ❌ CSS-in-JS libraries for styling

### Exception Cases:
The only exception is when shadcn/ui doesn't provide a component and you need to:
1. Create a custom component that **extends** a shadcn/ui component
2. Use only Tailwind utilities within that component
3. Follow all other spacing, color, and typography rules

## ✅ Correct Examples

```tsx
// ✅ CORRECT: Using shadcn/ui components and Tailwind utilities
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function MyComponent() {
  return (
    <Card className="p-6 space-y-4">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-foreground">
          Title
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <p className="text-sm text-muted-foreground">
          Description text
        </p>
        <Button variant="default" className="mt-4">
          Click me
        </Button>
      </CardContent>
    </Card>
  );
}
```

```tsx
// ✅ CORRECT: Proper spacing and layout
<div className="container mx-auto px-4 py-8 space-y-6">
  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
    {/* Content */}
  </div>
</div>
```

## ❌ Incorrect Examples

```tsx
// ❌ WRONG: Inline styles
<div style={{ padding: '24px', margin: '16px', color: '#333' }}>
  Content
</div>

// ❌ WRONG: Hardcoded colors
<div className="bg-blue-500 text-[#ff0000]">
  Content
</div>

// ❌ WRONG: Custom spacing values
<div className="p-[13px] m-[7px]">
  Content
</div>

// ❌ WRONG: Other UI library
import { Button } from "@mui/material";

// ❌ WRONG: Custom CSS classes for styling
<div className="my-custom-spacing">
  Content
</div>
```

## Component Installation Checklist

Before creating any new UI element, ask:
1. ✅ Does shadcn/ui have this component? → Use `npx shadcn@latest add [component]`
2. ✅ Can I build this with existing shadcn/ui components? → Compose them
3. ✅ Do I need a custom component? → Extend shadcn/ui base, use Tailwind only

## Verification

Before committing code, verify:
- [ ] All components imported from `@/components/ui/*`
- [ ] No inline styles used
- [ ] All spacing uses Tailwind utilities
- [ ] All colors use CSS variables or semantic tokens
- [ ] All typography uses Tailwind utilities
- [ ] No hardcoded color values
- [ ] No custom spacing outside Tailwind scale

## References

- [shadcn/ui Components](https://ui.shadcn.com/docs/components)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [shadcn/ui Theming](https://ui.shadcn.com/docs/theming)

