import { Rule, RuleType, RuleStatus, RuleScope } from "./types";

export interface GenerateBrief {
  topic: string;
  keyPoints: string[];
  cta?: string;
  offer?: string;
  links?: string[];
}

interface BrandRules {
  rules: Rule[];
  locale: string;
}

export function buildPromptFromRules(
  brandRules: BrandRules,
  context: string,
  input: string,
  mode: "rewrite" | "lint" | "generate"
): string {
  // Filter rules by status, scope, and surface
  const applicableRules = brandRules.rules.filter((rule) => {
    // Must be active
    if (rule.status !== RuleStatus.ACTIVE) return false;
    
    // Check if rule applies to this context/surface
    if (rule.surfaces && rule.surfaces.length > 0) {
      if (!rule.surfaces.includes(context)) return false;
    }
    
    // Check locale if specified
    if (rule.locales && rule.locales.length > 0) {
      if (!rule.locales.includes(brandRules.locale)) return false;
    }
    
    return true;
  });

  let prompt = `You are a brand language governance assistant. Your task is to ${mode === "rewrite" ? "rewrite" : mode === "lint" ? "analyze and suggest improvements for" : "generate"} text according to the brand's tone of voice and grammar rules.\n\n`;
  prompt += `**CRITICAL INSTRUCTIONS:**\n`;
  prompt += `- You MUST strictly follow ALL brand rules provided below. These are requirements, not suggestions.\n`;
  prompt += `- Every rule value shown is the user's explicit configuration - you must apply it exactly.\n`;
  prompt += `- If a rule is marked as ENABLED or has a specific value, you MUST apply it.\n`;
  prompt += `- If a word or phrase is FORBIDDEN, you MUST NOT use it and MUST use the suggested alternative.\n`;
  prompt += `- If a rule has a numeric value (1-5), apply that level of the rule consistently.\n`;
  prompt += `- **PRESERVE THE ORIGINAL VOICE AND PERSPECTIVE**: Do NOT change first person ("I", "I'm", "I own") to third person ("he", "James is", "he owns"). Do NOT change second person ("you", "your") to third person. Only change perspective if a specific rule explicitly requires it AND the context makes sense (e.g., UI text should use second person, but personal bios/introductions should keep their original perspective).\n`;
  prompt += `- **MINIMAL CHANGES FOR NEUTRAL SETTINGS**: When formality or other tone settings are set to "neutral" or level 3, make MINIMAL changes. Preserve the original style, voice, and structure unless there are clear violations of brand rules.\n`;
  prompt += `- **NATURAL LANGUAGE**: Your output must sound natural and human-written. Avoid robotic, overly formal, or stilted language. If the original text is conversational and natural, keep it that way.\n`;
  prompt += `- Do not deviate from these rules. Consistency is critical.\n\n`;

  // Add locale context
  prompt += `Locale: ${brandRules.locale}\n`;
  prompt += `Context: ${context}\n\n`;

  // Group rules by type
  const toneRules = applicableRules.filter((r) => r.type === RuleType.TONE_VOICE);
  const grammarRules = applicableRules.filter((r) => r.type === RuleType.GRAMMAR_STYLE);
  const formattingRules = applicableRules.filter((r) => r.type === RuleType.FORMATTING);
  const terminologyRules = applicableRules.filter((r) => r.type === RuleType.TERMINOLOGY || r.type === RuleType.FORBIDDEN_WORDS);
  const otherRules = applicableRules.filter((r) => 
    !toneRules.includes(r) && 
    !grammarRules.includes(r) && 
    !formattingRules.includes(r) && 
    !terminologyRules.includes(r)
  );

  // Add tone rules
  if (toneRules.length > 0) {
    prompt += `## Tone of Voice Rules\n\n`;
    prompt += `**CRITICAL: You MUST strictly follow these tone rules. They are not suggestions - they are requirements.**\n\n`;
    
    // Separate custom variant from other tone rules
    const customVariantRule = toneRules.find((r) => r.key === "tone.custom_variant");
    const otherToneRules = toneRules.filter((r) => r.key !== "tone.custom_variant");
    
    // Add standard tone rules first
    for (const rule of otherToneRules) {
      prompt += `- **${rule.name}**: ${rule.description}\n`;
      
      // CRITICAL: Include the user's actual value/configuration
      if (rule.value !== undefined && rule.value !== null) {
        if (typeof rule.value === "number") {
          // Special handling for formality rule
          if (rule.key === "tone.formality") {
            const formalityLabels: { [key: number]: string } = {
              1: "Very Conversational",
              2: "Conversational",
              3: "Neutral",
              4: "Formal",
              5: "Very Formal"
            };
            const label = formalityLabels[rule.value] || `Level ${rule.value}`;
            prompt += `  **Value: ${rule.value} (${label})**\n`;
            
            // Add critical instructions for neutral formality
            if (rule.value === 3) {
              prompt += `  **CRITICAL: Neutral formality means PRESERVE the existing formality level of the text. Do NOT make text more formal or more conversational. If the text is already neutral/conversational (e.g., "Hi, I'm James"), keep it as is. Only change formality if the text is clearly too formal or too casual for the context.**\n`;
            } else if (rule.value <= 2) {
              prompt += `  **CRITICAL: Conversational formality means use contractions, casual greetings (Hi, Hey), and natural speech patterns. Make formal text more conversational.**\n`;
            } else if (rule.value >= 4) {
              prompt += `  **CRITICAL: Formal formality means avoid contractions, use full words (I am instead of I'm), and more structured language. Make casual text more formal.**\n`;
            }
          } else {
            // For other sliders, include the numeric value and what it means
            prompt += `  **Value: ${rule.value}** (on a scale where 1 = least, 5 = most)\n`;
          }
        } else if (typeof rule.value === "boolean") {
          prompt += `  **Value: ${rule.value ? "ENABLED" : "DISABLED"}**\n`;
        } else if (typeof rule.value === "string") {
          prompt += `  **Value: "${rule.value}"**\n`;
        } else {
          prompt += `  **Value: ${JSON.stringify(rule.value)}**\n`;
        }
      }
      
      if (rule.rationale) {
        prompt += `  Why: ${rule.rationale}\n`;
      }
      if (rule.examples) {
        if (rule.examples.do && rule.examples.do.length > 0) {
          prompt += `  Do: ${rule.examples.do.join(", ")}\n`;
        }
        if (rule.examples.dont && rule.examples.dont.length > 0) {
          prompt += `  Don't: ${rule.examples.dont.join(", ")}\n`;
        }
      }
      if (rule.suggestions && rule.suggestions.length > 0) {
        prompt += `  Suggestions: ${rule.suggestions.join(", ")}\n`;
      }
      prompt += `\n`;
    }
    
    // Add custom variant as a special section if it exists
    if (customVariantRule && customVariantRule.value) {
      prompt += `## Custom Tone Variant\n\n`;
      prompt += `The brand has the following specific tone characteristics that must be incorporated:\n`;
      prompt += `${customVariantRule.value}\n\n`;
      prompt += `These characteristics should be applied consistently across all content and take precedence over general tone guidelines when they conflict.\n\n`;
    }
  }

  // Add grammar rules
  if (grammarRules.length > 0) {
    prompt += `## Grammar and Style Rules\n\n`;
    prompt += `**CRITICAL: You MUST strictly follow these grammar rules. They are not suggestions - they are requirements.**\n\n`;
    
    // Check for acronyms rule and fetch allowed acronyms if enabled
    const acronymsRule = grammarRules.find((r) => r.key === "grammar.acronyms");
    let allowedAcronyms: Array<{ acronym: string; fullMeaning: string }> = [];
    
    if (acronymsRule && acronymsRule.value && typeof acronymsRule.value === "object") {
      const acronymValue = acronymsRule.value as any;
      if (acronymValue.allowCommonAllowlist === true) {
        // Fetch allowed acronyms from brand rules
        const acronymRules = brandRules.rules.filter(
          (r) => r.key === "grammar.acronyms.allowed" && r.status === RuleStatus.ACTIVE
        );
        allowedAcronyms = acronymRules.map((r) => {
          const value = r.value as any;
          return {
            acronym: value?.acronym || r.name,
            fullMeaning: value?.fullMeaning || r.description,
          };
        });
      }
    }
    
    for (const rule of grammarRules) {
      prompt += `- **${rule.name}**: ${rule.description}\n`;
      
      // Special handling for perspective rule
      if (rule.key === "grammar.perspective") {
        prompt += `  **IMPORTANT: This rule ONLY applies to UI/product interface text. Do NOT apply it to personal bios, introductions, marketing copy, or any text where first person is appropriate and natural. Only change perspective for actual UI elements (buttons, labels, form fields, etc.).**\n`;
      }
      
      // CRITICAL: Include the user's actual value/configuration
      if (rule.value !== undefined && rule.value !== null) {
        if (typeof rule.value === "number") {
          prompt += `  **Value: ${rule.value}** (on a scale where 1 = least, 5 = most)\n`;
        } else if (typeof rule.value === "boolean") {
          prompt += `  **Value: ${rule.value ? "ENABLED" : "DISABLED"}**\n`;
        } else if (typeof rule.value === "string") {
          prompt += `  **Value: "${rule.value}"**\n`;
        } else {
          prompt += `  **Value: ${JSON.stringify(rule.value)}**\n`;
        }
      }
      
      // Add allowed acronyms list if this is the acronyms rule and allowlist is enabled
      if (rule.key === "grammar.acronyms" && allowedAcronyms.length > 0) {
        prompt += `  **Allowed Acronyms and Abbreviations:**\n`;
        allowedAcronyms.forEach((acronym) => {
          prompt += `    - ${acronym.acronym}: ${acronym.fullMeaning}\n`;
        });
        prompt += `  You MAY use these acronyms without spelling them out. Use them when appropriate and when they improve readability.\n`;
      }
      
      if (rule.rationale) {
        prompt += `  Why: ${rule.rationale}\n`;
      }
      if (rule.examples) {
        if (rule.examples.do && rule.examples.do.length > 0) {
          prompt += `  Do: ${rule.examples.do.join(", ")}\n`;
        }
        if (rule.examples.dont && rule.examples.dont.length > 0) {
          prompt += `  Don't: ${rule.examples.dont.join(", ")}\n`;
        }
      }
      if (rule.suggestions && rule.suggestions.length > 0) {
        prompt += `  Use instead: ${rule.suggestions.join(", ")}\n`;
      }
      prompt += `\n`;
    }
  }

  // Add formatting rules
  if (formattingRules.length > 0) {
    prompt += `## Formatting Rules\n\n`;
    prompt += `**CRITICAL: You MUST strictly follow these formatting rules. They are not suggestions - they are requirements.**\n\n`;
    for (const rule of formattingRules) {
      prompt += `- **${rule.name}**: ${rule.description}\n`;
      
      // CRITICAL: Include the user's actual value/configuration
      if (rule.value !== undefined && rule.value !== null) {
        if (typeof rule.value === "number") {
          prompt += `  **Value: ${rule.value}**\n`;
        } else if (typeof rule.value === "boolean") {
          prompt += `  **Value: ${rule.value ? "ENABLED" : "DISABLED"}**\n`;
        } else if (typeof rule.value === "string") {
          prompt += `  **Value: "${rule.value}"**\n`;
        } else {
          prompt += `  **Value: ${JSON.stringify(rule.value)}**\n`;
        }
      }
      
      if (rule.examples) {
        if (rule.examples.do && rule.examples.do.length > 0) {
          prompt += `  Do: ${rule.examples.do.join(", ")}\n`;
        }
        if (rule.examples.dont && rule.examples.dont.length > 0) {
          prompt += `  Don't: ${rule.examples.dont.join(", ")}\n`;
        }
      }
      prompt += `\n`;
    }
  }

  // Add brand rules (check for terminology.brand rule)
  const brandRule = brandRules.rules.find(
    (r) => r.key === "terminology.brand" && r.status === RuleStatus.ACTIVE
  );
  
  if (brandRule && brandRule.value && typeof brandRule.value === "object") {
    const brandValue = brandRule.value as any;
    const brandName = brandValue.brandName || brandRule.name || "";
    const brandNameSymbol = brandValue.brandNameSymbol || "none";
    const copyrightUsage = brandValue.copyrightUsage || "first_mention";
    const productNameSymbol = brandValue.productNameSymbol || "none";
    const otherBrandRules = brandValue.otherBrandRules || "";

    prompt += `## Brand Rules\n\n`;
    prompt += `**CRITICAL: You MUST strictly follow these brand rules. They are not suggestions - they are requirements.**\n\n`;

    // Brand name usage
    if (brandName) {
      let brandNameWithSymbol = brandName;
      if (brandNameSymbol === "tm") {
        brandNameWithSymbol = `${brandName}™`;
      } else if (brandNameSymbol === "r") {
        brandNameWithSymbol = `${brandName}®`;
      }

      prompt += `- **Brand Name**: ${brandNameWithSymbol}\n`;
      prompt += `  When referring to the brand, you MUST use "${brandNameWithSymbol}" (not just "${brandName}").\n`;
      
      if (productNameSymbol && productNameSymbol !== "none") {
        const productSymbol = productNameSymbol === "tm" ? "™" : "®";
        prompt += `  Product names should use the ${productSymbol} symbol.\n`;
      }
    }

    // Copyright usage
    if (copyrightUsage === "always") {
      prompt += `- **Copyright Symbol**: Always add © when mentioning copyright.\n`;
      prompt += `  Example: "© ${new Date().getFullYear()} ${brandName || "Brand"}. All rights reserved."\n`;
    } else if (copyrightUsage === "first_mention") {
      prompt += `- **Copyright Symbol**: Add © only on the first mention of copyright per document.\n`;
      prompt += `  Example: "© ${new Date().getFullYear()} ${brandName || "Brand"}." (only on first mention)\n`;
    } else {
      prompt += `- **Copyright Symbol**: Do not add copyright symbol automatically.\n`;
    }

    // Other brand rules
    if (otherBrandRules && otherBrandRules.trim()) {
      prompt += `- **Additional Brand Rules**:\n`;
      prompt += `  ${otherBrandRules}\n`;
    }

    prompt += `\n`;
  }

  // Add terminology rules
  if (terminologyRules.length > 0) {
    prompt += `## Terminology Rules\n\n`;
    prompt += `**CRITICAL: You MUST strictly follow these terminology rules. They are not suggestions - they are requirements.**\n\n`;
    for (const rule of terminologyRules) {
      // Skip brand rule as it's already handled above
      if (rule.key === "terminology.brand") continue;

      if (rule.type === RuleType.FORBIDDEN_WORDS) {
        prompt += `- **FORBIDDEN: ${rule.name}**\n`;
        prompt += `  ${rule.description}\n`;
        if (rule.suggestions && rule.suggestions.length > 0) {
          prompt += `  **MUST use instead: ${rule.suggestions.join(", ")}**\n`;
        }
      } else {
        prompt += `- **PREFERRED: ${rule.name}**\n`;
        prompt += `  ${rule.description}\n`;
      }
      
      // CRITICAL: Include the user's actual value/configuration
      if (rule.value !== undefined && rule.value !== null) {
        if (typeof rule.value === "boolean") {
          prompt += `  **Value: ${rule.value ? "ENABLED" : "DISABLED"}**\n`;
        } else if (typeof rule.value === "string") {
          prompt += `  **Value: "${rule.value}"**\n`;
        }
      }
      
      if (rule.examples) {
        if (rule.examples.do && rule.examples.do.length > 0) {
          prompt += `  Do: ${rule.examples.do.join(", ")}\n`;
        }
        if (rule.examples.dont && rule.examples.dont.length > 0) {
          prompt += `  Don't: ${rule.examples.dont.join(", ")}\n`;
        }
      }
      prompt += `\n`;
    }
  }

  // Add other rules
  if (otherRules.length > 0) {
    prompt += `## Other Rules\n\n`;
    for (const rule of otherRules) {
      prompt += `- ${rule.name}: ${rule.description}\n`;
      if (rule.rationale) {
        prompt += `  Why: ${rule.rationale}\n`;
      }
      prompt += `\n`;
    }
  }

  // Add input text
  prompt += `## Text to ${mode === "rewrite" ? "Rewrite" : mode === "lint" ? "Analyze" : "Generate"}\n\n`;
  prompt += `${input}\n\n`;

  // Add output format instructions
  if (mode === "rewrite" || mode === "lint") {
    prompt += `Return your response as JSON in this format:\n`;
    prompt += `{\n`;
    prompt += `  "output": "the revised or generated text",\n`;
    prompt += `  "changes": [\n`;
    prompt += `    {\n`;
    prompt += `      "ruleKey": "tone.formality",\n`;
    prompt += `      "reason": "explanation of the change with specific rule reference",\n`;
    prompt += `      "original": "original text snippet",\n`;
    prompt += `      "revised": "revised text snippet"\n`;
    prompt += `    }\n`;
    prompt += `  ],\n`;
    prompt += `  "noChanges": false,\n`;
    prompt += `  "noChangesReason": null\n`;
    prompt += `}\n`;
    prompt += `\n`;
    prompt += `**CRITICAL INSTRUCTIONS FOR RESPONSE:**\n`;
    prompt += `- If you make ANY changes, you MUST include them in the "changes" array with:\n`;
    prompt += `  - "ruleKey": The exact rule key/slug that triggered the change (e.g., "tone.formality", "grammar.active_voice", "terminology.brand")\n`;
    prompt += `  - "reason": A clear explanation of why this change was made, referencing the specific rule\n`;
    prompt += `  - "original": The exact text snippet that was changed\n`;
    prompt += `  - "revised": The exact text snippet after the change\n`;
    prompt += `- If you make NO changes (the text already follows all brand rules), set:\n`;
    prompt += `  - "noChanges": true\n`;
    prompt += `  - "noChangesReason": A clear explanation of why no changes were needed (e.g., "Text already follows all brand rules. Formality is neutral, uses active voice, and includes proper brand terminology.")\n`;
    prompt += `  - "changes": [] (empty array)\n`;
    prompt += `- Every change MUST reference a specific rule key from the rules provided above.\n`;
  } else {
    prompt += `Return your response as JSON in this format:\n`;
    prompt += `{\n`;
    prompt += `  "issues": [\n`;
    prompt += `    {\n`;
    prompt += `      "ruleKey": "tone.formality",\n`;
    prompt += `      "reason": "explanation of the issue",\n`;
    prompt += `      "original": "problematic text snippet",\n`;
    prompt += `      "suggested": "suggested improvement",\n`;
    prompt += `      "severity": "error" | "warning" | "suggestion"\n`;
    prompt += `    }\n`;
    prompt += `  ]\n`;
    prompt += `}\n`;
  }

  return prompt;
}

export interface ChannelPromptOptions {
  charLimit?: number;
  strict?: boolean;
  intent?: string;
  audience?: string;
  formality?: string;
  energy?: string;
  variants?: number;
}

/**
 * Build prompt with channel awareness and additional options
 */
export function buildPromptFromRulesWithChannel(
  brandRules: BrandRules,
  channelId: string | undefined,
  input: string | GenerateBrief,
  mode: "rewrite" | "generate",
  options: ChannelPromptOptions = {}
): string {
  // Start with base prompt
  let prompt = `You are a brand language governance assistant. Your task is to ${mode === "rewrite" ? "rewrite" : "generate"} text according to the brand's tone of voice and grammar rules.\n\n`;
  prompt += `**CRITICAL INSTRUCTIONS:**\n`;
  prompt += `- You MUST strictly follow ALL brand rules provided below. These are requirements, not suggestions.\n`;
  prompt += `- Every rule value shown is the user's explicit configuration - you must apply it exactly.\n`;
  prompt += `- If a rule is marked as ENABLED or has a specific value, you MUST apply it.\n`;
  prompt += `- If a word or phrase is FORBIDDEN, you MUST NOT use it and MUST use the suggested alternative.\n`;
  prompt += `- If a rule has a numeric value (1-5), apply that level of the rule consistently.\n`;
  prompt += `- **PRESERVE THE ORIGINAL VOICE AND PERSPECTIVE**: Do NOT change first person ("I", "I'm", "I own") to third person ("he", "James is", "he owns"). Do NOT change second person ("you", "your") to third person. Only change perspective if a specific rule explicitly requires it AND the context makes sense (e.g., UI text should use second person, but personal bios/introductions should keep their original perspective).\n`;
  prompt += `- **MINIMAL CHANGES FOR NEUTRAL SETTINGS**: When formality or other tone settings are set to "neutral" or level 3, make MINIMAL changes. Preserve the original style, voice, and structure unless there are clear violations of brand rules.\n`;
  prompt += `- **NATURAL LANGUAGE**: Your output must sound natural and human-written. Avoid robotic, overly formal, or stilted language. If the original text is conversational and natural, keep it that way.\n`;
  prompt += `- Do not deviate from these rules. Consistency is critical.\n\n`;

  // Add locale context
  prompt += `Locale: ${brandRules.locale}\n`;

  // Add channel constraints if provided
  if (channelId) {
    const { getChannel, getDefaultCharLimit } = require("@/lib/channels/config");
    const channel = getChannel(channelId);
    if (channel) {
      prompt += `Channel: ${channel.name}\n`;
      const effectiveLimit = options.charLimit ?? channel.defaultCharLimit;
      if (effectiveLimit !== null) {
        prompt += `Character limit: ${effectiveLimit} characters`;
        if (options.strict || channel.strictLimit) {
          prompt += ` (STRICT - must not exceed)\n`;
        } else {
          prompt += ` (guideline - aim for this length)\n`;
        }
      }
      if (channel.formatting !== "plain") {
        prompt += `Formatting: ${channel.formatting}\n`;
      }
      prompt += `\n`;
    }
  }

  // Add intent, audience, and style parameters
  if (options.intent) {
    prompt += `Intent: ${options.intent}\n`;
  }
  if (options.audience) {
    prompt += `Target audience: ${options.audience}\n`;
  }
  if (options.formality) {
    prompt += `Formality level: ${options.formality}\n`;
  }
  if (options.energy) {
    prompt += `Energy level: ${options.energy}\n`;
  }
  if (options.variants && options.variants > 1) {
    prompt += `Generate ${options.variants} distinct variants\n`;
  }
  if (Object.keys(options).length > 0) {
    prompt += `\n`;
  }

  // Filter rules by status, scope, and surface
  const applicableRules = brandRules.rules.filter((rule) => {
    // Must be active
    if (rule.status !== RuleStatus.ACTIVE) return false;
    
    // Check if rule applies to this channel
    if (channelId && rule.channels && rule.channels.length > 0) {
      if (!rule.channels.includes(channelId)) return false;
    }
    
    // Check locale if specified
    if (rule.locales && rule.locales.length > 0) {
      if (!rule.locales.includes(brandRules.locale)) return false;
    }
    
    return true;
  });

  // Group rules by type (same as original function)
  const toneRules = applicableRules.filter((r) => r.type === RuleType.TONE_VOICE);
  const grammarRules = applicableRules.filter((r) => r.type === RuleType.GRAMMAR_STYLE);
  const formattingRules = applicableRules.filter((r) => r.type === RuleType.FORMATTING);
  const terminologyRules = applicableRules.filter((r) => r.type === RuleType.TERMINOLOGY || r.type === RuleType.FORBIDDEN_WORDS);
  const otherRules = applicableRules.filter((r) => 
    !toneRules.includes(r) && 
    !grammarRules.includes(r) && 
    !formattingRules.includes(r) && 
    !terminologyRules.includes(r)
  );

  // Add tone rules (same as original)
  if (toneRules.length > 0) {
    prompt += `## Tone of Voice Rules\n\n`;
    
    const customVariantRule = toneRules.find((r) => r.key === "tone.custom_variant");
    const otherToneRules = toneRules.filter((r) => r.key !== "tone.custom_variant");
    
    for (const rule of otherToneRules) {
      prompt += `- **${rule.name}**: ${rule.description}\n`;
      
      // CRITICAL: Include the user's actual value/configuration
      if (rule.value !== undefined && rule.value !== null) {
        if (typeof rule.value === "number") {
          // Special handling for formality rule
          if (rule.key === "tone.formality") {
            const formalityLabels: { [key: number]: string } = {
              1: "Very Conversational",
              2: "Conversational",
              3: "Neutral",
              4: "Formal",
              5: "Very Formal"
            };
            const label = formalityLabels[rule.value] || `Level ${rule.value}`;
            prompt += `  **Value: ${rule.value} (${label})**\n`;
            
            // Add critical instructions for neutral formality
            if (rule.value === 3) {
              prompt += `  **CRITICAL: Neutral formality means PRESERVE the existing formality level of the text. Do NOT make text more formal or more conversational. If the text is already neutral/conversational (e.g., "Hi, I'm James"), keep it as is. Only change formality if the text is clearly too formal or too casual for the context.**\n`;
            } else if (rule.value <= 2) {
              prompt += `  **CRITICAL: Conversational formality means use contractions, casual greetings (Hi, Hey), and natural speech patterns. Make formal text more conversational.**\n`;
            } else if (rule.value >= 4) {
              prompt += `  **CRITICAL: Formal formality means avoid contractions, use full words (I am instead of I'm), and more structured language. Make casual text more formal.**\n`;
            }
          } else {
            // For other sliders, include the numeric value and what it means
            prompt += `  **Value: ${rule.value}** (on a scale where 1 = least, 5 = most)\n`;
          }
        } else if (typeof rule.value === "boolean") {
          prompt += `  **Value: ${rule.value ? "ENABLED" : "DISABLED"}**\n`;
        } else if (typeof rule.value === "string") {
          prompt += `  **Value: "${rule.value}"**\n`;
        } else {
          prompt += `  **Value: ${JSON.stringify(rule.value)}**\n`;
        }
      }
      
      if (rule.rationale) {
        prompt += `  Why: ${rule.rationale}\n`;
      }
      if (rule.examples) {
        if (rule.examples.do && rule.examples.do.length > 0) {
          prompt += `  Do: ${rule.examples.do.join(", ")}\n`;
        }
        if (rule.examples.dont && rule.examples.dont.length > 0) {
          prompt += `  Don't: ${rule.examples.dont.join(", ")}\n`;
        }
      }
      if (rule.suggestions && rule.suggestions.length > 0) {
        prompt += `  Suggestions: ${rule.suggestions.join(", ")}\n`;
      }
      prompt += `\n`;
    }
    
    if (customVariantRule && customVariantRule.value) {
      prompt += `## Custom Tone Variant\n\n`;
      prompt += `The brand has the following specific tone characteristics that must be incorporated:\n`;
      prompt += `${customVariantRule.value}\n\n`;
      prompt += `These characteristics should be applied consistently across all content and take precedence over general tone guidelines when they conflict.\n\n`;
    }
  }

  // Add grammar rules (same as original)
  if (grammarRules.length > 0) {
    prompt += `## Grammar and Style Rules\n\n`;
    prompt += `**CRITICAL: You MUST strictly follow these grammar rules. They are not suggestions - they are requirements.**\n\n`;
    
    // Check for acronyms rule and fetch allowed acronyms if enabled
    const acronymsRule = grammarRules.find((r) => r.key === "grammar.acronyms");
    let allowedAcronyms: Array<{ acronym: string; fullMeaning: string }> = [];
    
    if (acronymsRule && acronymsRule.value && typeof acronymsRule.value === "object") {
      const acronymValue = acronymsRule.value as any;
      if (acronymValue.allowCommonAllowlist === true) {
        // Fetch allowed acronyms from brand rules
        const acronymRules = brandRules.rules.filter(
          (r) => r.key === "grammar.acronyms.allowed" && r.status === RuleStatus.ACTIVE
        );
        allowedAcronyms = acronymRules.map((r) => {
          const value = r.value as any;
          return {
            acronym: value?.acronym || r.name,
            fullMeaning: value?.fullMeaning || r.description,
          };
        });
      }
    }
    
    for (const rule of grammarRules) {
      prompt += `- **${rule.name}**: ${rule.description}\n`;
      
      // Special handling for perspective rule
      if (rule.key === "grammar.perspective") {
        prompt += `  **IMPORTANT: This rule ONLY applies to UI/product interface text. Do NOT apply it to personal bios, introductions, marketing copy, or any text where first person is appropriate and natural. Only change perspective for actual UI elements (buttons, labels, form fields, etc.).**\n`;
      }
      
      // CRITICAL: Include the user's actual value/configuration
      if (rule.value !== undefined && rule.value !== null) {
        if (typeof rule.value === "number") {
          prompt += `  **Value: ${rule.value}** (on a scale where 1 = least, 5 = most)\n`;
        } else if (typeof rule.value === "boolean") {
          prompt += `  **Value: ${rule.value ? "ENABLED" : "DISABLED"}**\n`;
        } else if (typeof rule.value === "string") {
          prompt += `  **Value: "${rule.value}"**\n`;
        } else {
          prompt += `  **Value: ${JSON.stringify(rule.value)}**\n`;
        }
      }
      
      // Add allowed acronyms list if this is the acronyms rule and allowlist is enabled
      if (rule.key === "grammar.acronyms" && allowedAcronyms.length > 0) {
        prompt += `  **Allowed Acronyms and Abbreviations:**\n`;
        allowedAcronyms.forEach((acronym) => {
          prompt += `    - ${acronym.acronym}: ${acronym.fullMeaning}\n`;
        });
        prompt += `  You MAY use these acronyms without spelling them out. Use them when appropriate and when they improve readability.\n`;
      }
      
      if (rule.rationale) {
        prompt += `  Why: ${rule.rationale}\n`;
      }
      if (rule.examples) {
        if (rule.examples.do && rule.examples.do.length > 0) {
          prompt += `  Do: ${rule.examples.do.join(", ")}\n`;
        }
        if (rule.examples.dont && rule.examples.dont.length > 0) {
          prompt += `  Don't: ${rule.examples.dont.join(", ")}\n`;
        }
      }
      if (rule.suggestions && rule.suggestions.length > 0) {
        prompt += `  Use instead: ${rule.suggestions.join(", ")}\n`;
      }
      prompt += `\n`;
    }
  }

  // Add formatting rules (same as original)
  if (formattingRules.length > 0) {
    prompt += `## Formatting Rules\n\n`;
    prompt += `**CRITICAL: You MUST strictly follow these formatting rules. They are not suggestions - they are requirements.**\n\n`;
    for (const rule of formattingRules) {
      prompt += `- **${rule.name}**: ${rule.description}\n`;
      
      // CRITICAL: Include the user's actual value/configuration
      if (rule.value !== undefined && rule.value !== null) {
        if (typeof rule.value === "number") {
          prompt += `  **Value: ${rule.value}**\n`;
        } else if (typeof rule.value === "boolean") {
          prompt += `  **Value: ${rule.value ? "ENABLED" : "DISABLED"}**\n`;
        } else if (typeof rule.value === "string") {
          prompt += `  **Value: "${rule.value}"**\n`;
        } else {
          prompt += `  **Value: ${JSON.stringify(rule.value)}**\n`;
        }
      }
      
      if (rule.examples) {
        if (rule.examples.do && rule.examples.do.length > 0) {
          prompt += `  Do: ${rule.examples.do.join(", ")}\n`;
        }
        if (rule.examples.dont && rule.examples.dont.length > 0) {
          prompt += `  Don't: ${rule.examples.dont.join(", ")}\n`;
        }
      }
      prompt += `\n`;
    }
  }

  // Add brand rules (check for terminology.brand rule)
  const brandRule = brandRules.rules.find(
    (r) => r.key === "terminology.brand" && r.status === RuleStatus.ACTIVE
  );
  
  if (brandRule && brandRule.value && typeof brandRule.value === "object") {
    const brandValue = brandRule.value as any;
    const brandName = brandValue.brandName || brandRule.name || "";
    const brandNameSymbol = brandValue.brandNameSymbol || "none";
    const copyrightUsage = brandValue.copyrightUsage || "first_mention";
    const productNameSymbol = brandValue.productNameSymbol || "none";
    const otherBrandRules = brandValue.otherBrandRules || "";

    prompt += `## Brand Rules\n\n`;
    prompt += `**CRITICAL: You MUST strictly follow these brand rules. They are not suggestions - they are requirements.**\n\n`;

    // Brand name usage
    if (brandName) {
      let brandNameWithSymbol = brandName;
      if (brandNameSymbol === "tm") {
        brandNameWithSymbol = `${brandName}™`;
      } else if (brandNameSymbol === "r") {
        brandNameWithSymbol = `${brandName}®`;
      }

      prompt += `- **Brand Name**: ${brandNameWithSymbol}\n`;
      prompt += `  When referring to the brand, you MUST use "${brandNameWithSymbol}" (not just "${brandName}").\n`;
      
      if (productNameSymbol && productNameSymbol !== "none") {
        const productSymbol = productNameSymbol === "tm" ? "™" : "®";
        prompt += `  Product names should use the ${productSymbol} symbol.\n`;
      }
    }

    // Copyright usage
    if (copyrightUsage === "always") {
      prompt += `- **Copyright Symbol**: Always add © when mentioning copyright.\n`;
      prompt += `  Example: "© ${new Date().getFullYear()} ${brandName || "Brand"}. All rights reserved."\n`;
    } else if (copyrightUsage === "first_mention") {
      prompt += `- **Copyright Symbol**: Add © only on the first mention of copyright per document.\n`;
      prompt += `  Example: "© ${new Date().getFullYear()} ${brandName || "Brand"}." (only on first mention)\n`;
    } else {
      prompt += `- **Copyright Symbol**: Do not add copyright symbol automatically.\n`;
    }

    // Other brand rules
    if (otherBrandRules && otherBrandRules.trim()) {
      prompt += `- **Additional Brand Rules**:\n`;
      prompt += `  ${otherBrandRules}\n`;
    }

    prompt += `\n`;
  }

  // Add terminology rules (same as original)
  if (terminologyRules.length > 0) {
    prompt += `## Terminology Rules\n\n`;
    prompt += `**CRITICAL: You MUST strictly follow these terminology rules. They are not suggestions - they are requirements.**\n\n`;
    for (const rule of terminologyRules) {
      // Skip brand rule as it's already handled above
      if (rule.key === "terminology.brand") continue;

      if (rule.type === RuleType.FORBIDDEN_WORDS) {
        prompt += `- **FORBIDDEN: ${rule.name}**\n`;
        prompt += `  ${rule.description}\n`;
        if (rule.suggestions && rule.suggestions.length > 0) {
          prompt += `  **MUST use instead: ${rule.suggestions.join(", ")}**\n`;
        }
      } else {
        prompt += `- **PREFERRED: ${rule.name}**\n`;
        prompt += `  ${rule.description}\n`;
      }
      
      // CRITICAL: Include the user's actual value/configuration
      if (rule.value !== undefined && rule.value !== null) {
        if (typeof rule.value === "boolean") {
          prompt += `  **Value: ${rule.value ? "ENABLED" : "DISABLED"}**\n`;
        } else if (typeof rule.value === "string") {
          prompt += `  **Value: "${rule.value}"**\n`;
        }
      }
      
      if (rule.examples) {
        if (rule.examples.do && rule.examples.do.length > 0) {
          prompt += `  Do: ${rule.examples.do.join(", ")}\n`;
        }
        if (rule.examples.dont && rule.examples.dont.length > 0) {
          prompt += `  Don't: ${rule.examples.dont.join(", ")}\n`;
        }
      }
      prompt += `\n`;
    }
  }

  // Add other rules (same as original)
  if (otherRules.length > 0) {
    prompt += `## Other Rules\n\n`;
    for (const rule of otherRules) {
      prompt += `- ${rule.name}: ${rule.description}\n`;
      if (rule.rationale) {
        prompt += `  Why: ${rule.rationale}\n`;
      }
      prompt += `\n`;
    }
  }

  // Add input text or brief
  if (mode === "generate" && typeof input === "object") {
    prompt += `## Content Brief\n\n`;
    prompt += `Topic: ${input.topic}\n\n`;
    prompt += `Key points:\n`;
    for (const point of input.keyPoints) {
      prompt += `- ${point}\n`;
    }
    if (input.cta) {
      prompt += `\nCall to action: ${input.cta}\n`;
    }
    if (input.offer) {
      prompt += `Offer: ${input.offer}\n`;
    }
    if (input.links && input.links.length > 0) {
      prompt += `\nLinks to include: ${input.links.join(", ")}\n`;
    }
    prompt += `\n`;
  } else {
    prompt += `## Text to ${mode === "rewrite" ? "Rewrite" : "Generate"}\n\n`;
    prompt += `${typeof input === "string" ? input : ""}\n\n`;
  }

  // Add output format instructions
  if (mode === "rewrite" || mode === "generate") {
    prompt += `Return your response as JSON in this format:\n`;
    prompt += `{\n`;
    prompt += `  "output": "the revised or generated text",\n`;
    prompt += `  "charCount": ${typeof input === "string" ? input.length : 0},\n`;
    if (options.variants && options.variants > 1) {
      prompt += `  "variants": ["variant 1", "variant 2", ...],\n`;
    }
    prompt += `  "changes": [\n`;
    prompt += `    {\n`;
    prompt += `      "ruleKey": "tone.formality",\n`;
    prompt += `      "reason": "explanation of the change with specific rule reference",\n`;
    prompt += `      "original": "original text snippet",\n`;
    prompt += `      "revised": "revised text snippet"\n`;
    prompt += `    }\n`;
    prompt += `  ],\n`;
    prompt += `  "noChanges": false,\n`;
    prompt += `  "noChangesReason": null,\n`;
    prompt += `  "appliedRules": [\n`;
    prompt += `    {"ruleId": "rule_id", "action": "applied|removed|rewrote", "count": 1}\n`;
    prompt += `  ],\n`;
    prompt += `  "violationsInInput": [\n`;
    prompt += `    {"ruleId": "rule_id", "snippet": "text", "severity": "warn|error"}\n`;
    prompt += `  ]\n`;
    prompt += `}\n`;
    prompt += `\n`;
    prompt += `**CRITICAL INSTRUCTIONS FOR RESPONSE:**\n`;
    prompt += `- If you make ANY changes, you MUST include them in the "changes" array with:\n`;
    prompt += `  - "ruleKey": The exact rule key/slug that triggered the change (e.g., "tone.formality", "grammar.active_voice", "terminology.brand")\n`;
    prompt += `  - "reason": A clear explanation of why this change was made, referencing the specific rule\n`;
    prompt += `  - "original": The exact text snippet that was changed\n`;
    prompt += `  - "revised": The exact text snippet after the change\n`;
    prompt += `- If you make NO changes (the text already follows all brand rules), set:\n`;
    prompt += `  - "noChanges": true\n`;
    prompt += `  - "noChangesReason": A clear explanation of why no changes were needed (e.g., "Text already follows all brand rules. Formality is neutral, uses active voice, and includes proper brand terminology.")\n`;
    prompt += `  - "changes": [] (empty array)\n`;
    prompt += `- Every change MUST reference a specific rule key from the rules provided above.\n`;
  }

  return prompt;
}