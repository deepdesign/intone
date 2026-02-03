// Rule navigation definitions for secondary navigation
// These match the keys from seed files

export interface RuleNavItem {
  key: string;
  label: string;
  slug: string; // URL-friendly version
}

export const toneRuleNav: RuleNavItem[] = [
  { key: "tone.locale", label: "Language and locale", slug: "locale" },
  { key: "tone.formality", label: "Formality", slug: "formality" },
  { key: "tone.confidence", label: "Confidence vs caution", slug: "confidence" },
  { key: "tone.directness", label: "Directness", slug: "directness" },
  { key: "tone.enthusiasm", label: "Enthusiasm", slug: "enthusiasm" },
  { key: "tone.humour", label: "Humour", slug: "humour" },
  { key: "tone.empathy", label: "Empathy", slug: "empathy" },
  { key: "tone.personality.exclude_slang", label: "Avoid slang", slug: "avoid-slang" },
  { key: "tone.personality.exclude_emoji", label: "Avoid emojis", slug: "avoid-emoji" },
  { key: "tone.personality.exclude_exclamation", label: "Avoid exclamation marks", slug: "avoid-exclamation" },
  { key: "tone.personality.exclude_rhetorical", label: "Avoid rhetorical questions", slug: "avoid-rhetorical" },
  { key: "tone.sentence.prefer_short", label: "Prefer short sentences", slug: "prefer-short-sentences" },
  { key: "tone.sentence.one_idea", label: "One idea per sentence", slug: "one-idea-per-sentence" },
  { key: "tone.sentence.use_contractions", label: "Use contractions", slug: "use-contractions" },
  { key: "tone.sentence.active_voice", label: "Active voice only", slug: "active-voice" },
  { key: "tone.ui.buttons_start_verbs", label: "Buttons start with verbs", slug: "buttons-start-verbs" },
  { key: "tone.ui.use_select_not_click", label: "Use 'select' instead of 'click'", slug: "use-select-not-click" },
  { key: "tone.ui.use_view_not_see", label: "Use 'view' instead of 'see'", slug: "use-view-not-see" },
  { key: "tone.perspective.second_person", label: "Use second person perspective", slug: "second-person" },
  { key: "tone.boundaries.no_hype", label: "No hype", slug: "no-hype" },
  { key: "tone.boundaries.no_fear", label: "No fear", slug: "no-fear" },
];

export const grammarRuleNav: RuleNavItem[] = [
  { key: "grammar.active_voice", label: "Active voice", slug: "active-voice" },
  { key: "grammar.select", label: "Select", slug: "select" },
  { key: "grammar.perspective", label: "Perspective", slug: "perspective" },
  { key: "grammar.cases", label: "Sentence case", slug: "sentence-case" },
  { key: "grammar.acronyms", label: "Acronyms and abbreviations", slug: "acronyms" },
  { key: "grammar.contractions", label: "Contractions", slug: "contractions" },
  { key: "grammar.full_stops", label: "Full stops", slug: "full-stops" },
  { key: "grammar.exclamation_marks", label: "Exclamation marks", slug: "exclamation-marks" },
  { key: "grammar.emoji", label: "Emoji", slug: "emoji" },
  { key: "grammar.ampersands", label: "Ampersands", slug: "ampersands" },
  { key: "grammar.brackets", label: "Brackets", slug: "brackets" },
  { key: "grammar.bullets", label: "Bulleted lists", slug: "bulleted-lists" },
  { key: "grammar.numbers", label: "Numbers", slug: "numbers" },
  { key: "grammar.currencies", label: "Currencies", slug: "currencies" },
  { key: "grammar.percentages", label: "Percentages", slug: "percentages" },
  { key: "grammar.dates", label: "Dates", slug: "dates" },
  { key: "grammar.dashes", label: "Dashes", slug: "dashes" },
  { key: "grammar.slashes", label: "Slashes", slug: "slashes" },
  { key: "grammar.ellipses", label: "Ellipses", slug: "ellipses" },
  { key: "grammar.email", label: "Email", slug: "email" },
  { key: "grammar.wifi", label: "Wi-Fi", slug: "wifi" },
  { key: "grammar.dropdown", label: "Dropdown", slug: "dropdown" },
  { key: "grammar.driver_licence", label: "Driver licence", slug: "driver-licence" },
  { key: "grammar.text", label: "Text", slug: "text" },
  { key: "grammar.time", label: "Time", slug: "time" },
  { key: "grammar.oxford_comma", label: "Oxford comma", slug: "oxford-comma" },
  { key: "grammar.change", label: "Change", slug: "change" },
  { key: "grammar.choose", label: "Choose", slug: "choose" },
  { key: "grammar.countries", label: "Countries", slug: "countries" },
  { key: "grammar.edit", label: "Edit", slug: "edit" },
  { key: "grammar.eg", label: "e.g.", slug: "eg" },
  { key: "grammar.etc", label: "etc.", slug: "etc" },
  { key: "grammar.login", label: "Login / Log in", slug: "login" },
  { key: "grammar.markup", label: "Markup / Mark up", slug: "markup" },
  { key: "grammar.view", label: "View", slug: "view" },
  { key: "grammar.hyphenation", label: "Hyphenation", slug: "hyphenation" },
  { key: "grammar.quotation_marks", label: "Quotation marks", slug: "quotation-marks" },
  { key: "grammar.apostrophes", label: "Apostrophes", slug: "apostrophes" },
  { key: "grammar.semicolons_colons", label: "Semicolons and colons", slug: "semicolons-colons" },
  { key: "grammar.capitalization", label: "Capitalization", slug: "capitalization" },
  { key: "grammar.possessives", label: "Common possessive errors", slug: "possessives" },
  { key: "grammar.technical_terms", label: "Technical terms", slug: "technical-terms" },
  { key: "grammar.abbreviations", label: "Abbreviations with periods", slug: "abbreviations" },
  { key: "grammar.parallel_structure", label: "Parallel structure", slug: "parallel-structure" },
  { key: "grammar.comma_usage", label: "Comma usage", slug: "comma-usage" },
];

export const numbersRuleNav: RuleNavItem[] = [
  { key: "numbers.use_numerals", label: "Use numerals", slug: "use-numerals" },
  { key: "numbers.large_abbreviations", label: "Large number abbreviations", slug: "large-abbreviations" },
  { key: "numbers.ranges", label: "Ranges", slug: "ranges" },
  { key: "dates.format", label: "Date format", slug: "date-format" },
  { key: "dates.include_day_name", label: "Include day name", slug: "include-day-name" },
  { key: "time.format", label: "Time format", slug: "time-format" },
  { key: "currency.naming", label: "Currency naming", slug: "currency-naming" },
  { key: "currency.formatting", label: "Currency formatting", slug: "currency-formatting" },
  { key: "currency.symbols", label: "Currency symbols", slug: "currency-symbols" },
];

export const terminologyRuleNav: RuleNavItem[] = [
  // Terminology is handled differently with tabs for Preferred Terms and Forbidden Words
  // Individual rules would be managed within those sections
];

export function getRuleNavForCategory(category: "tone" | "grammar" | "numbers" | "terminology"): RuleNavItem[] {
  switch (category) {
    case "tone":
      return toneRuleNav;
    case "grammar":
      return grammarRuleNav;
    case "numbers":
      return numbersRuleNav;
    case "terminology":
      return terminologyRuleNav;
    default:
      return [];
  }
}

export function getRuleBySlug(category: string, slug: string): RuleNavItem | undefined {
  const nav = getRuleNavForCategory(category as any);
  return nav.find((item) => item.slug === slug);
}

export function getRuleByKey(category: string, key: string): RuleNavItem | undefined {
  const nav = getRuleNavForCategory(category as any);
  return nav.find((item) => item.key === key);
}
