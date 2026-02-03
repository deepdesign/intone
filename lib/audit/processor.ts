import { prisma } from "@/lib/db";
import { buildPromptFromRules } from "@/lib/rules/prompt-builder";
import { generateWithOpenAI } from "@/lib/ai/openai";
import { parseLintResponse } from "@/lib/ai/response-parser";

interface ProcessedPage {
  url: string;
  pageNumber?: number;
  content: string;
  title?: string;
}

/**
 * Process a URL audit - crawl and extract content
 */
export async function processUrlAudit(
  auditId: string,
  sourceUrl: string,
  crawlDepth: number,
  maxPages: number
): Promise<void> {
  const visitedUrls = new Set<string>();
  const urlsToVisit: Array<{ url: string; depth: number }> = [{ url: sourceUrl, depth: 0 }];
  const pages: ProcessedPage[] = [];

  // Normalize URL
  const baseUrl = new URL(sourceUrl);
  const baseDomain = `${baseUrl.protocol}//${baseUrl.host}`;

  while (urlsToVisit.length > 0 && pages.length < maxPages) {
    const { url, depth } = urlsToVisit.shift()!;

    if (depth > crawlDepth || visitedUrls.has(url)) {
      continue;
    }

    visitedUrls.add(url);

    try {
      // Update audit status
      await prisma.audit.update({
        where: { id: auditId },
        data: {
          status: "PROCESSING",
          totalPages: pages.length + 1,
        },
      });

      // Fetch page
      const response = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; IntoneAudit/1.0)",
        },
      });

      if (!response.ok) {
        continue;
      }

      const html = await response.text();
      const content = extractTextFromHTML(html);
      const title = extractTitleFromHTML(html);

      pages.push({
        url,
        content,
        title,
      });

      // Extract links for next depth level
      if (depth < crawlDepth) {
        const links = extractLinksFromHTML(html, baseDomain);
        for (const link of links) {
          if (!visitedUrls.has(link) && urlsToVisit.length + pages.length < maxPages) {
            urlsToVisit.push({ url: link, depth: depth + 1 });
          }
        }
      }

      // Process this page
      await processPageContent(auditId, url, content, undefined);
    } catch (error) {
      console.error(`Error processing URL ${url}:`, error);
      continue;
    }
  }

  // Update audit with final status
  await finalizeAudit(auditId, pages.length);
}

/**
 * Process a file upload audit
 */
export async function processFileAudit(
  auditId: string,
  fileBuffer: Buffer,
  fileName: string,
  fileType: string
): Promise<void> {
  try {
    await prisma.audit.update({
      where: { id: auditId },
      data: { status: "PROCESSING" },
    });

    let content = "";
    let pages: ProcessedPage[] = [];

    // Determine file type from extension or MIME type
    const extension = fileName.split(".").pop()?.toLowerCase() || "";

    if (extension === "pdf" || fileType.includes("pdf")) {
      pages = await parsePDF(fileBuffer);
    } else if (["docx", "doc"].includes(extension) || fileType.includes("word")) {
      content = await parseDOCX(fileBuffer);
      pages = [{ content, pageNumber: 1 }];
    } else if (["txt", "md", "html", "htm"].includes(extension)) {
      content = fileBuffer.toString("utf-8");
      if (extension === "html" || extension === "htm") {
        content = extractTextFromHTML(content);
      }
      pages = [{ content, pageNumber: 1 }];
    } else {
      // Fallback: try to read as text
      content = fileBuffer.toString("utf-8");
      pages = [{ content, pageNumber: 1 }];
    }

    // Update total pages
    await prisma.audit.update({
      where: { id: auditId },
      data: { totalPages: pages.length },
    });

    // Process each page
    for (const page of pages) {
      await processPageContent(auditId, fileName, page.content, page.pageNumber);
    }

    await finalizeAudit(auditId, pages.length);
  } catch (error) {
    console.error("Error processing file:", error);
    await prisma.audit.update({
      where: { id: auditId },
      data: { status: "FAILED" },
    });
    throw error;
  }
}

/**
 * Process a file link audit
 */
export async function processFileLinkAudit(
  auditId: string,
  fileUrl: string
): Promise<void> {
  try {
    await prisma.audit.update({
      where: { id: auditId },
      data: { status: "PROCESSING" },
    });

    // Fetch file
    const response = await fetch(fileUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; IntoneAudit/1.0)",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch file: ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const fileBuffer = Buffer.from(arrayBuffer);
    const contentType = response.headers.get("content-type") || "";
    const fileName = fileUrl.split("/").pop() || "file";

    // Process as file
    await processFileAudit(auditId, fileBuffer, fileName, contentType);
  } catch (error) {
    console.error("Error processing file link:", error);
    await prisma.audit.update({
      where: { id: auditId },
      data: { status: "FAILED" },
    });
    throw error;
  }
}

/**
 * Process a single page's content against brand rules
 */
async function processPageContent(
  auditId: string,
  pageUrl: string,
  content: string,
  pageNumber: number | undefined
): Promise<void> {
  // Get audit to find brand
  const audit = await prisma.audit.findUnique({
    where: { id: auditId },
    include: { brand: true },
  });

  if (!audit) {
    throw new Error("Audit not found");
  }

  // Get active rules for the brand
  const rules = await prisma.rule.findMany({
    where: {
      brandId: audit.brandId,
      status: "ACTIVE",
    },
    orderBy: [
      { priority: "asc" },
      { name: "asc" },
    ],
  });

  if (rules.length === 0) {
    return;
  }

  // Use the lint API logic to find issues
  // We'll call the OpenAI API directly here to analyze the content
  const issues = await analyzeContentWithRules(content, rules, audit.brandId, audit.brand.locale);

  // Create audit issues
  for (const issue of issues) {
    // Find the rule
    const rule = rules.find((r) => r.key === issue.ruleKey || r.name === issue.ruleKey);
    if (!rule) continue;

    // Extract context (50 chars before/after)
    const issueStart = issue.locationStart || 0;
    const issueEnd = issue.locationEnd || issueStart + issue.original.length;
    const contextBefore = content.substring(Math.max(0, issueStart - 50), issueStart);
    const contextAfter = content.substring(issueEnd, Math.min(content.length, issueEnd + 50));

    await prisma.auditIssue.create({
      data: {
        auditId,
        ruleId: rule.id,
        pageUrl: pageUrl,
        pageNumber: pageNumber || null,
        locationStart: issueStart,
        locationEnd: issueEnd,
        issueText: issue.original,
        contextBefore,
        contextAfter,
        severity: mapSeverity(issue.severity),
        message: issue.reason,
        suggestedFix: issue.revised || null,
        category: rule.category || null,
        status: "PENDING",
      },
    });
  }
}

/**
 * Analyze content against rules using OpenAI
 */
async function analyzeContentWithRules(
  content: string,
  rules: any[],
  brandId: string,
  locale: string
): Promise<Array<{
  ruleKey: string;
  original: string;
  revised?: string;
  reason: string;
  severity: string;
  locationStart: number;
  locationEnd: number;
}>> {
  // Check if OpenAI API key is configured
  if (!process.env.OPENAI_API_KEY) {
    console.warn("OpenAI API key not configured, skipping analysis");
    return [];
  }

  // Use the existing lint prompt builder
  // Split content into chunks if too large (OpenAI has token limits)
  const maxChunkSize = 8000; // Conservative chunk size
  const chunks: string[] = [];
  
  if (content.length > maxChunkSize) {
    // Split by sentences or paragraphs
    const sentences = content.match(/[^.!?]+[.!?]+/g) || [content];
    let currentChunk = "";
    
    for (const sentence of sentences) {
      if (currentChunk.length + sentence.length > maxChunkSize) {
        if (currentChunk) chunks.push(currentChunk);
        currentChunk = sentence;
      } else {
        currentChunk += sentence;
      }
    }
    if (currentChunk) chunks.push(currentChunk);
  } else {
    chunks.push(content);
  }

  const allIssues: Array<{
    ruleKey: string;
    original: string;
    revised?: string;
    reason: string;
    severity: string;
    locationStart: number;
    locationEnd: number;
  }> = [];

  let contentOffset = 0;

  for (const chunk of chunks) {
    try {
      // Build prompt using existing function
      const prompt = buildPromptFromRules(
        {
          rules: rules,
          locale: locale,
        },
        "ui", // Default context for audits
        chunk,
        "lint"
      );

      // Call OpenAI
      const response = await generateWithOpenAI(prompt);
      // generateWithOpenAI already returns parsed JSON
      // Ensure it has the issues array
      const result = parseLintResponse(response);

      // Map results to locations in content
      if (result.issues && Array.isArray(result.issues)) {
        for (const issue of result.issues) {
          // Find the original text in chunk
          const location = findTextLocation(chunk, issue.original);
          allIssues.push({
            ruleKey: issue.ruleKey || "unknown",
            original: issue.original,
            revised: issue.suggested || issue.revised,
            reason: issue.reason,
            severity: issue.severity || "minor",
            locationStart: contentOffset + location.start,
            locationEnd: contentOffset + location.end,
          });
        }
      }

      contentOffset += chunk.length;
    } catch (error) {
      console.error("Error analyzing content chunk with OpenAI:", error);
      // Continue with next chunk
    }
  }

  return allIssues;
}

/**
 * Find text location in content
 */
function findTextLocation(content: string, searchText: string): { start: number; end: number } {
  const index = content.toLowerCase().indexOf(searchText.toLowerCase());
  if (index === -1) {
    return { start: 0, end: searchText.length };
  }
  return { start: index, end: index + searchText.length };
}

// parseLintResponse is imported from @/lib/ai/response-parser

/**
 * Finalize audit and calculate metrics
 */
async function finalizeAudit(auditId: string, totalPages: number): Promise<void> {
  const issues = await prisma.auditIssue.findMany({
    where: { auditId },
  });

  // Calculate metrics
  const issuesByCategory: Record<string, number> = {};
  const issuesBySeverity: Record<string, number> = {};

  issues.forEach((issue) => {
    const category = issue.category || "other";
    issuesByCategory[category] = (issuesByCategory[category] || 0) + 1;
    issuesBySeverity[issue.severity] = (issuesBySeverity[issue.severity] || 0) + 1;
  });

  // Calculate overall score
  const criticalCount = issuesBySeverity.CRITICAL || 0;
  const majorCount = issuesBySeverity.MAJOR || 0;
  const minorCount = issuesBySeverity.MINOR || 0;
  const infoCount = issuesBySeverity.INFO || 0;
  const penaltyScore = (criticalCount * 10 + majorCount * 5 + minorCount * 2 + infoCount * 1) / totalPages;
  const overallScore = Math.max(0, Math.min(100, 100 - penaltyScore));
  const compliancePercentage = issues.length === 0 ? 100 : Math.max(0, 100 - (issues.length / totalPages) * 10);

  await prisma.audit.update({
    where: { id: auditId },
    data: {
      status: "COMPLETED",
      totalPages,
      totalIssues: issues.length,
      overallScore,
      compliancePercentage,
      issuesByCategory,
      issuesBySeverity,
      completedAt: new Date(),
    },
  });
}

// HTML parsing utilities
function extractTextFromHTML(html: string): string {
  // Simple HTML to text extraction
  // Remove script and style tags
  let text = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "");
  text = text.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "");
  // Remove HTML tags
  text = text.replace(/<[^>]+>/g, " ");
  // Decode HTML entities
  text = text.replace(/&nbsp;/g, " ");
  text = text.replace(/&amp;/g, "&");
  text = text.replace(/&lt;/g, "<");
  text = text.replace(/&gt;/g, ">");
  text = text.replace(/&quot;/g, '"');
  text = text.replace(/&#39;/g, "'");
  // Clean up whitespace
  text = text.replace(/\s+/g, " ").trim();
  return text;
}

function extractTitleFromHTML(html: string): string | undefined {
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return titleMatch ? titleMatch[1].trim() : undefined;
}

function extractLinksFromHTML(html: string, baseDomain: string): string[] {
  const links: string[] = [];
  const linkRegex = /<a[^>]+href=["']([^"']+)["'][^>]*>/gi;
  let match;

  while ((match = linkRegex.exec(html)) !== null) {
    let url = match[1];
    try {
      // Handle relative URLs
      if (url.startsWith("/")) {
        url = `${baseDomain}${url}`;
      } else if (!url.startsWith("http")) {
        url = `${baseDomain}/${url}`;
      }
      // Only include same-domain links
      if (url.startsWith(baseDomain)) {
        links.push(url);
      }
    } catch {
      // Invalid URL, skip
    }
  }

  return [...new Set(links)]; // Remove duplicates
}

// File parsing utilities
async function parsePDF(buffer: Buffer): Promise<ProcessedPage[]> {
  try {
    // Try to import pdf-parse, but handle gracefully if not installed
    let pdfParse;
    try {
      pdfParse = await import("pdf-parse");
    } catch {
      throw new Error("pdf-parse package not installed. Run: npm install pdf-parse");
    }
    
    const data = await pdfParse.default(buffer);
    
    // Split by pages if available
    if (data.numpages > 1) {
      const pages: ProcessedPage[] = [];
      // pdf-parse gives us all text, we'll split by approximate page length
      const textPerPage = Math.ceil(data.text.length / data.numpages);
      for (let i = 0; i < data.numpages; i++) {
        pages.push({
          content: data.text.substring(i * textPerPage, (i + 1) * textPerPage),
          pageNumber: i + 1,
        });
      }
      return pages;
    }
    
    return [{ content: data.text, pageNumber: 1 }];
  } catch (error) {
    console.error("Error parsing PDF:", error);
    throw new Error(`Failed to parse PDF file: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

async function parseDOCX(buffer: Buffer): Promise<string> {
  try {
    // Try to import mammoth, but handle gracefully if not installed
    let mammoth;
    try {
      mammoth = await import("mammoth");
    } catch {
      throw new Error("mammoth package not installed. Run: npm install mammoth");
    }
    
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  } catch (error) {
    console.error("Error parsing DOCX:", error);
    throw new Error(`Failed to parse DOCX file: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

function mapSeverity(severity: string): "CRITICAL" | "MAJOR" | "MINOR" | "INFO" {
  const lower = severity.toLowerCase();
  if (lower.includes("critical") || lower.includes("error")) return "CRITICAL";
  if (lower.includes("major") || lower.includes("warning")) return "MAJOR";
  if (lower.includes("minor")) return "MINOR";
  return "INFO";
}

