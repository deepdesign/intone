#!/usr/bin/env tsx

import { readFileSync, readdirSync, statSync } from "fs";
import { join, relative, dirname, basename } from "path";

type Severity = "error" | "warning" | "info";

interface Issue {
  file: string;
  line: number;
  column?: number;
  message: string;
  severity: Severity;
  category: string;
  code?: string;
}

interface Report {
  summary: {
    totalFiles: number;
    totalIssues: number;
    errors: number;
    warnings: number;
    info: number;
  };
  issues: Issue[];
  byCategory: Record<string, Issue[]>;
}

class CodeHygieneChecker {
  private issues: Issue[] = [];
  private filesChecked: Set<string> = new Set();
  private rootDir: string;

  constructor(rootDir: string = process.cwd()) {
    this.rootDir = rootDir;
  }

  private addIssue(
    file: string,
    line: number,
    message: string,
    severity: Severity,
    category: string,
    code?: string,
    column?: number
  ) {
    this.issues.push({
      file: relative(this.rootDir, file),
      line,
      column,
      message,
      severity,
      category,
      code,
    });
  }

  private getAllFiles(dir: string, extensions: string[] = [".ts", ".tsx"]): string[] {
    const files: string[] = [];
    const items = readdirSync(dir);

    for (const item of items) {
      const fullPath = join(dir, item);
      const stat = statSync(fullPath);

      // Skip node_modules, .next, and other build directories
      if (
        item === "node_modules" ||
        item === ".next" ||
        item === "out" ||
        item === "build" ||
        item.startsWith(".")
      ) {
        continue;
      }

      if (stat.isDirectory()) {
        files.push(...this.getAllFiles(fullPath, extensions));
      } else if (stat.isFile()) {
        const ext = item.substring(item.lastIndexOf("."));
        if (extensions.includes(ext)) {
          files.push(fullPath);
        }
      }
    }

    return files;
  }

  private getFileContent(file: string): string {
    try {
      return readFileSync(file, "utf-8");
    } catch (error) {
      this.addIssue(file, 1, `Failed to read file: ${error}`, "error", "File System");
      return "";
    }
  }

  private getLineNumber(content: string, index: number): number {
    return content.substring(0, index).split("\n").length;
  }

  // Project Structure Checks
  checkProjectStructure() {
    const apiFiles = this.getAllFiles(join(this.rootDir, "app/api"), [".ts"]);
    const pageFiles = this.getAllFiles(join(this.rootDir, "app"), [".tsx"]);

    // Check API route naming
    for (const file of apiFiles) {
      this.filesChecked.add(file);
      const fileName = basename(file);
      const dir = dirname(file);

      if (fileName !== "route.ts") {
        this.addIssue(
          file,
          1,
          `API route file should be named 'route.ts', found '${fileName}'`,
          "error",
          "Project Structure"
        );
      }

      // Check for [brandId] instead of [brandSlug] in dynamic routes
      if (dir.includes("[brandId]")) {
        this.addIssue(
          file,
          1,
          "Dynamic route should use [brandSlug] instead of [brandId]",
          "error",
          "Project Structure"
        );
      }
    }

    // Check page file naming
    for (const file of pageFiles) {
      this.filesChecked.add(file);
      const fileName = basename(file);
      const dir = dirname(file);

      if (fileName === "page.tsx" || fileName === "layout.tsx") {
        // Valid
      } else if (fileName.endsWith(".tsx") && !dir.includes("app/api")) {
        // Check if it's a component file (should be in components/)
        if (!dir.includes("components")) {
          this.addIssue(
            file,
            1,
            `Page file should be named 'page.tsx' or 'layout.tsx', found '${fileName}'`,
            "warning",
            "Project Structure"
          );
        }
      }
    }

    // Check component organization
    const componentFiles = this.getAllFiles(join(this.rootDir, "components"), [".tsx", ".ts"]);
    for (const file of componentFiles) {
      this.filesChecked.add(file);
      const fileName = basename(file);
      // Components should be PascalCase
      if (fileName.includes("-") && !fileName.startsWith("use-")) {
        this.addIssue(
          file,
          1,
          `Component file should use PascalCase, found '${fileName}'`,
          "warning",
          "Project Structure"
        );
      }
    }
  }

  // Code Quality Checks
  checkCodeQuality() {
    const files = this.getAllFiles(this.rootDir, [".ts", ".tsx"]);

    for (const file of files) {
      // Skip node_modules and build directories
      if (
        file.includes("node_modules") ||
        file.includes(".next") ||
        file.includes("out") ||
        file.includes("build")
      ) {
        continue;
      }

      this.filesChecked.add(file);
      const content = this.getFileContent(file);
      if (!content) continue;

      const lines = content.split("\n");

      // Check for 'any' types
      const anyTypeRegex = /:\s*any\b/g;
      let match;
      while ((match = anyTypeRegex.exec(content)) !== null) {
        const line = this.getLineNumber(content, match.index);
        const lineContent = lines[line - 1];
        // Allow 'any' in catch blocks and with explanatory comments
        if (
          !lineContent.includes("catch") &&
          !lineContent.includes("//") &&
          !lineContent.includes("/*")
        ) {
          this.addIssue(
            file,
            line,
            "Avoid using 'any' type. Use proper TypeScript types instead.",
            "warning",
            "Code Quality",
            lineContent.trim()
          );
        }
      }

      // Check for console.log (should use proper logging)
      if (file.includes("/app/") && !file.includes("/app/api/")) {
        // Only check app directory, not API routes (they might need console.error)
        const consoleLogRegex = /console\.log\(/g;
        while ((match = consoleLogRegex.exec(content)) !== null) {
          const line = this.getLineNumber(content, match.index);
          this.addIssue(
            file,
            line,
            "Avoid console.log in production code. Use proper logging or remove.",
            "info",
            "Code Quality"
          );
        }
      }

      // Check import path consistency (should use @/ alias)
      const relativeImportRegex = /from\s+['"]\.\.\/\.\.\//g;
      while ((match = relativeImportRegex.exec(content)) !== null) {
        const line = this.getLineNumber(content, match.index);
        this.addIssue(
          file,
          line,
          "Use @/ alias instead of relative imports (../../)",
          "warning",
          "Code Quality"
        );
      }
    }
  }

  // Styling Compliance Checks
  checkStyling() {
    const files = this.getAllFiles(this.rootDir, [".tsx", ".ts"]);

    for (const file of files) {
      if (
        file.includes("node_modules") ||
        file.includes(".next") ||
        file.includes("out") ||
        file.includes("build") ||
        file.includes("/ui/") // Skip shadcn/ui components themselves
      ) {
        continue;
      }

      this.filesChecked.add(file);
      const content = this.getFileContent(file);
      if (!content) continue;

      const lines = content.split("\n");

      // Check for inline styles
      const inlineStyleRegex = /style=\{\{/g;
      let match;
      while ((match = inlineStyleRegex.exec(content)) !== null) {
        const line = this.getLineNumber(content, match.index);
        this.addIssue(
          file,
          line,
          "Inline styles detected. Use Tailwind CSS utilities instead.",
          "error",
          "Styling",
          lines[line - 1].trim()
        );
      }

      // Check for hardcoded colors (bg-blue-500, text-[#ff0000], etc.)
      const hardcodedColorRegex = /(?:bg|text|border)-(?:blue|red|green|yellow|purple|pink|indigo|gray|slate|zinc|neutral|stone|orange|amber|lime|emerald|teal|cyan|sky|violet|fuchsia|rose)-\d{2,3}|(?:bg|text|border)-\[#[0-9a-fA-F]{3,6}\]/g;
      while ((match = hardcodedColorRegex.exec(content)) !== null) {
        const line = this.getLineNumber(content, match.index);
        const matched = match[0];
        // Allow some exceptions (like destructive colors)
        if (!matched.includes("destructive") && !matched.includes("muted")) {
          this.addIssue(
            file,
            line,
            `Hardcoded color detected: '${matched}'. Use CSS variables or semantic tokens instead.`,
            "error",
            "Styling",
            lines[line - 1].trim()
          );
        }
      }

      // Check for custom spacing values outside Tailwind scale
      const customSpacingRegex = /(?:p|m|px|py|pt|pb|pl|pr|mt|mb|ml|mr|mx|my|gap|space-[xy])-\[(\d+)px\]/g;
      while ((match = customSpacingRegex.exec(content)) !== null) {
        const line = this.getLineNumber(content, match.index);
        const spacingValue = parseInt(match[1]);
        // Tailwind scale: 0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 5, 6, 7, 8, 9, 10, 11, 12, 14, 16, 20, 24, 28, 32, 36, 40, 44, 48, 52, 56, 60, 64, 72, 80, 96
        const tailwindScale = [
          0, 2, 4, 6, 8, 10, 12, 14, 16, 20, 24, 28, 32, 36, 40, 44, 48, 52, 56, 60, 64, 72, 80,
          96,
        ];
        if (!tailwindScale.includes(spacingValue)) {
          this.addIssue(
            file,
            line,
            `Custom spacing value '${match[0]}' detected. Use standard Tailwind spacing scale.`,
            "warning",
            "Styling",
            lines[line - 1].trim()
          );
        }
      }

      // Check for shadcn/ui component usage
      if (file.includes("/components/") && !file.includes("/ui/")) {
        // Check if importing from other UI libraries
        const forbiddenLibs = [
          "@mui",
          "@material-ui",
          "@chakra-ui",
          "antd",
          "react-bootstrap",
          "@headlessui",
        ];
        for (const lib of forbiddenLibs) {
          if (content.includes(`from "${lib}`) || content.includes(`from '${lib}`)) {
            const line = content.split("\n").findIndex((l) => l.includes(lib)) + 1;
            this.addIssue(
              file,
              line,
              `Forbidden UI library detected: '${lib}'. Use shadcn/ui components instead.`,
              "error",
              "Styling"
            );
          }
        }
      }

      // Check for Label + Input/Select combinations without space-y-2
      // This is a complex check - look for Label followed by Input/Select/Textarea without space-y-2 wrapper
      const labelInputPattern =
        /<Label[^>]*>[\s\S]{0,200}?<\/Label>[\s\S]{0,50}?<(?:Input|Select|Textarea)/g;
      let labelMatch;
      while ((labelMatch = labelInputPattern.exec(content)) !== null) {
        const beforeLabel = content.substring(0, labelMatch.index);
        const lastDiv = beforeLabel.lastIndexOf("<div");
        if (lastDiv !== -1) {
          const divContent = content.substring(lastDiv, labelMatch.index + labelMatch[0].length);
          if (!divContent.includes("space-y-2") && !divContent.includes("space-y-")) {
            const line = this.getLineNumber(content, labelMatch.index);
            this.addIssue(
              file,
              line,
              "Label + Input/Select/Textarea combination should be wrapped in a div with 'space-y-2' class.",
              "warning",
              "Styling"
            );
          }
        } else {
          const line = this.getLineNumber(content, labelMatch.index);
          this.addIssue(
            file,
            line,
            "Label + Input/Select/Textarea combination should be wrapped in a div with 'space-y-2' class.",
            "warning",
            "Styling"
          );
        }
      }
    }
  }

  // API Route Pattern Checks
  checkAPIPatterns() {
    const apiFiles = this.getAllFiles(join(this.rootDir, "app/api"), [".ts"]);

    for (const file of apiFiles) {
      this.filesChecked.add(file);
      const content = this.getFileContent(file);
      if (!content) continue;

      const lines = content.split("\n");

      // Check if route is in [brandSlug] directory but uses brandId in params
      if (file.includes("[brandSlug]")) {
        const brandIdInParams = /params.*:\s*\{[^}]*brandId[^}]*\}/g;
        if (brandIdInParams.test(content)) {
          const match = content.match(/params.*:\s*\{[^}]*brandId[^}]*\}/);
          if (match) {
            const line = this.getLineNumber(content, content.indexOf(match[0]));
            this.addIssue(
              file,
              line,
              "Route in [brandSlug] directory should use 'brandSlug' in params type, not 'brandId'.",
              "error",
              "API Patterns",
              match[0].trim()
            );
          }
        }
      }

      // Check for authentication
      const hasGetCurrentUser = content.includes("getCurrentUser");
      const isPublicRoute = file.includes("/api/public/") || file.includes("/api/auth/");
      if (!hasGetCurrentUser && !isPublicRoute && content.includes("export async function")) {
        const exportMatch = content.match(/export async function (GET|POST|PUT|PATCH|DELETE)/);
        if (exportMatch) {
          const line = this.getLineNumber(content, content.indexOf(exportMatch[0]));
          this.addIssue(
            file,
            line,
            `API route handler '${exportMatch[1]}' should check authentication using getCurrentUser.`,
            "warning",
            "API Patterns"
          );
        }
      }

      // Check for error handling
      const hasTryCatch = content.includes("try {") && content.includes("catch");
      const hasErrorHandling = hasTryCatch || content.includes("NextResponse.json");
      if (content.includes("export async function") && !hasErrorHandling) {
        const exportMatch = content.match(/export async function (GET|POST|PUT|PATCH|DELETE)/);
        if (exportMatch) {
          const line = this.getLineNumber(content, content.indexOf(exportMatch[0]));
          this.addIssue(
            file,
            line,
            `API route handler '${exportMatch[1]}' should have proper error handling (try-catch).`,
            "warning",
            "API Patterns"
          );
        }
      }

      // Check for Zod validation on POST/PUT/PATCH
      const hasZod = content.includes("z.object") || content.includes("zod");
      const hasPostPutPatch =
        content.includes("export async function POST") ||
        content.includes("export async function PUT") ||
        content.includes("export async function PATCH");
      if (hasPostPutPatch && !hasZod) {
        const line = content.split("\n").findIndex((l) => l.includes("export async function")) + 1;
        this.addIssue(
          file,
          line,
          "POST/PUT/PATCH handlers should validate input using Zod schemas.",
          "warning",
          "API Patterns"
        );
      }
    }
  }

  // React Pattern Checks
  checkReactPatterns() {
    const componentFiles = this.getAllFiles(this.rootDir, [".tsx"]);

    for (const file of componentFiles) {
      if (
        file.includes("node_modules") ||
        file.includes(".next") ||
        file.includes("out") ||
        file.includes("build")
      ) {
        continue;
      }

      this.filesChecked.add(file);
      const content = this.getFileContent(file);
      if (!content) continue;

      const lines = content.split("\n");

      // Check for client component directive
      const hasUseClient = content.includes('"use client"') || content.includes("'use client'");
      const hasHooks =
        content.includes("useState") ||
        content.includes("useEffect") ||
        content.includes("useContext") ||
        content.includes("useRouter") ||
        content.includes("useParams");

      if (hasHooks && !hasUseClient && file.includes("/app/")) {
        const hookMatch = content.match(/(useState|useEffect|useContext|useRouter|useParams)/);
        if (hookMatch) {
          const line = this.getLineNumber(content, content.indexOf(hookMatch[0]));
          this.addIssue(
            file,
            line,
            `Component uses '${hookMatch[0]}' hook but missing 'use client' directive.`,
            "error",
            "React Patterns"
          );
        }
      }

      // Check for props type definitions
      if (content.includes("export function") || content.includes("export default function")) {
        const functionMatch = content.match(
          /(export\s+(?:default\s+)?function\s+\w+)\s*\([^)]*\)\s*\{/
        );
        if (functionMatch && !content.includes(": {") && !content.includes(": React")) {
          const line = this.getLineNumber(content, content.indexOf(functionMatch[0]));
          // Check if it actually has props
          const propsMatch = functionMatch[0].match(/\(([^)]+)\)/);
          if (propsMatch && propsMatch[1].trim() && propsMatch[1].trim() !== "") {
            this.addIssue(
              file,
              line,
              "Component props should be properly typed with TypeScript interface or type.",
              "warning",
              "React Patterns"
            );
          }
        }
      }
    }
  }

  // Run all checks
  runAllChecks(): Report {
    console.log("🔍 Running code hygiene checks...\n");

    console.log("📁 Checking project structure...");
    this.checkProjectStructure();

    console.log("💻 Checking code quality...");
    this.checkCodeQuality();

    console.log("🎨 Checking styling compliance...");
    this.checkStyling();

    console.log("🔌 Checking API patterns...");
    this.checkAPIPatterns();

    console.log("⚛️  Checking React patterns...");
    this.checkReactPatterns();

    // Organize issues by category
    const byCategory: Record<string, Issue[]> = {};
    for (const issue of this.issues) {
      if (!byCategory[issue.category]) {
        byCategory[issue.category] = [];
      }
      byCategory[issue.category].push(issue);
    }

    const errors = this.issues.filter((i) => i.severity === "error").length;
    const warnings = this.issues.filter((i) => i.severity === "warning").length;
    const info = this.issues.filter((i) => i.severity === "info").length;

    return {
      summary: {
        totalFiles: this.filesChecked.size,
        totalIssues: this.issues.length,
        errors,
        warnings,
        info,
      },
      issues: this.issues,
      byCategory,
    };
  }

  // Format and print report
  printReport(report: Report, json: boolean = false) {
    if (json) {
      console.log(JSON.stringify(report, null, 2));
      return;
    }

    console.log("\n" + "=".repeat(60));
    console.log("Code Hygiene Check Report");
    console.log("=".repeat(60) + "\n");

    console.log(`📊 Summary:`);
    console.log(`   Files checked: ${report.summary.totalFiles}`);
    console.log(`   Total issues: ${report.summary.totalIssues}`);
    console.log(`   ❌ Errors: ${report.summary.errors}`);
    console.log(`   ⚠️  Warnings: ${report.summary.warnings}`);
    console.log(`   ℹ️  Info: ${report.summary.info}\n`);

    if (report.issues.length === 0) {
      console.log("✅ No issues found! Code hygiene looks good.\n");
      return;
    }

    // Print by category
    const categories = Object.keys(report.byCategory).sort();
    for (const category of categories) {
      const categoryIssues = report.byCategory[category];
      const categoryErrors = categoryIssues.filter((i) => i.severity === "error").length;
      const categoryWarnings = categoryIssues.filter((i) => i.severity === "warning").length;
      const categoryInfo = categoryIssues.filter((i) => i.severity === "info").length;

      console.log(`\n📂 ${category}: ${categoryIssues.length} issues`);
      console.log(`   ❌ ${categoryErrors} errors | ⚠️  ${categoryWarnings} warnings | ℹ️  ${categoryInfo} info`);

      // Show first 10 issues per category
      for (const issue of categoryIssues.slice(0, 10)) {
        const icon = issue.severity === "error" ? "❌" : issue.severity === "warning" ? "⚠️" : "ℹ️";
        console.log(`   ${icon} ${issue.file}:${issue.line} - ${issue.message}`);
        if (issue.code) {
          console.log(`      ${issue.code}`);
        }
      }

      if (categoryIssues.length > 10) {
        console.log(`   ... and ${categoryIssues.length - 10} more issues`);
      }
    }

    console.log("\n" + "=".repeat(60));
  }
}

// Main execution
const args = process.argv.slice(2);
const jsonOutput = args.includes("--json") || args.includes("-j");
const rootDir = process.cwd();

const checker = new CodeHygieneChecker(rootDir);
const report = checker.runAllChecks();
checker.printReport(report, jsonOutput);

// Exit with error code if there are critical issues
process.exit(report.summary.errors > 0 ? 1 : 0);

