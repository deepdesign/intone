// Rule definitions - static metadata (not stored in database)

export interface GrammarRuleDefinition {
  key: string;
  category: string;
  controlType: string;
  label: string;
  description: string;
  options?: any;
  defaultValue?: any;
  examplesGood?: any;
  examplesBad?: any;
  appliesToOptions?: string[];
}

export const grammarRuleDefinitions: GrammarRuleDefinition[] = [
  {
    key: "grammar.active_voice",
    category: "grammar",
    controlType: "radio",
    label: "Active voice",
    description: "Choose between active voice and passive voice.",
    options: {
      options: [
        { value: "active", label: "Active voice" },
        { value: "passive", label: "Passive voice" },
      ],
    },
    defaultValue: "active",
    examplesGood: {
      examples: [
        {
          value: "active",
          text: "Jon broke the sauna",
        },
        {
          value: "passive",
          text: "The sauna was broken by Jon",
        },
      ],
    },
    examplesBad: {
      examples: [
        {
          value: "active",
          text: "The sauna got broken by Jon",
        },
        {
          value: "passive",
          text: "Jon broke the sauna",
        },
      ],
    },
    appliesToOptions: ["ui", "marketing", "support"],
  },
  {
    key: "grammar.select",
    category: "grammar",
    controlType: "list",
    label: "Select",
    description: "Use 'Select' instead of 'Click' for inclusivity. Use Select for single-choice lists.",
    options: {
      options: [
        { key: "preferSelectOverClick", label: "Use 'Select' instead of 'Click' in instructions", defaultValue: true },
        { key: "useSelectForSingleChoice", label: "Use Select for choosing one option where only one can be true", defaultValue: true },
      ],
    },
    defaultValue: { preferSelectOverClick: true, useSelectForSingleChoice: true },
    examplesGood: {
      examples: [
        {
          text: "Select 'Add new'.",
        },
      ],
    },
    examplesBad: {
      examples: [
        {
          text: "Click 'Add new'.",
        },
      ],
    },
    appliesToOptions: ["ui", "support"],
  },
  {
    key: "grammar.perspective",
    category: "grammar",
    controlType: "list",
    label: "Perspective",
    description: "Use second person for product UI. Avoid mixing first and second person on the same screen.",
    options: {
      options: [
        { key: "preferSecondPerson", label: "Use second person for product UI", defaultValue: true },
        { key: "allowFirstPersonInHelpHeadings", label: "Allow first person for help article headings", defaultValue: true },
      ],
    },
    defaultValue: { preferSecondPerson: true, allowFirstPersonInHelpHeadings: true },
    examplesGood: {
      examples: [
        {
          text: "Your address",
        },
      ],
    },
    examplesBad: {
      examples: [
        {
          text: "My address",
        },
      ],
    },
    appliesToOptions: ["ui"],
  },
  {
    key: "grammar.cases",
    category: "grammar",
    controlType: "toggle",
    label: "Cases",
    description: "Use sentence case for body copy, headings, subheadings, links and buttons.",
    defaultValue: true,
    examplesGood: {
      examples: [
        {
          text: "Sending money internationally",
        },
      ],
    },
    examplesBad: {
      examples: [
        {
          text: "Sending Money Internationally",
        },
      ],
    },
    appliesToOptions: ["ui", "marketing"],
  },
  {
    key: "grammar.acronyms",
    category: "grammar",
    controlType: "list",
    label: "Acronyms and abbreviations",
    description: "Avoid acronyms unless commonly used and spelling out adds confusion.",
    options: {
      options: [
        { key: "avoidAcronyms", label: "Avoid acronyms unless commonly used", defaultValue: true },
        { key: "allowCommonAllowlist", label: "Allow common acronyms list", defaultValue: true },
      ],
    },
    defaultValue: { avoidAcronyms: true, allowCommonAllowlist: true },
    examplesGood: {
      examples: [
        {
          text: "PDF is fine. Portable Document Format (PDF) on first mention if needed.",
        },
      ],
    },
    appliesToOptions: ["ui", "marketing", "support"],
  },
  {
    key: "grammar.contractions",
    category: "grammar",
    controlType: "list",
    label: "Contractions",
    description: "Use contractions to keep writing conversational and human.",
    options: {
      options: [
        { key: "useContractions", label: "Use contractions", defaultValue: true },
        { key: "disallowInLegal", label: "Disallow in legal copy", defaultValue: true },
      ],
    },
    defaultValue: { useContractions: true, disallowInLegal: true },
    examplesGood: {
      examples: [
        {
          text: "We're, you're, can't",
        },
      ],
    },
    examplesBad: {
      examples: [
        {
          text: "We are, you are, cannot",
        },
      ],
    },
    appliesToOptions: ["ui", "marketing", "support"],
  },
  {
    key: "grammar.full_stops",
    category: "grammar",
    controlType: "list",
    label: "Full stops",
    description: "Use full stops in body copy. Avoid full stops in headings/subheadings.",
    options: {
      options: [
        { key: "useInBody", label: "Use full stops in body copy", defaultValue: true },
        { key: "disallowInHeadings", label: "No full stops in headings/subheadings", defaultValue: true },
      ],
    },
    defaultValue: { useInBody: true, disallowInHeadings: true },
    examplesGood: {
      examples: [
        {
          text: "Bold heading\nAnd some body copy.",
        },
      ],
    },
    examplesBad: {
      examples: [
        {
          text: "Bold heading.\nAnd some body copy",
        },
      ],
    },
    appliesToOptions: ["ui", "marketing", "support"],
  },
  {
    key: "grammar.exclamation_marks",
    category: "grammar",
    controlType: "radio",
    label: "Exclamation marks",
    description: "Choose how to handle exclamation marks.",
    options: {
      options: [
        { value: "avoid", label: "Avoid exclamation marks" },
        { value: "allow_single", label: "Allow single exclamation mark when necessary" },
      ],
    },
    defaultValue: "avoid",
    examplesGood: {
      examples: [
        {
          value: "avoid",
          text: "Thanks for your message.",
        },
        {
          value: "allow_single",
          text: "Congratulations!",
        },
      ],
    },
    examplesBad: {
      examples: [
        {
          value: "avoid",
          text: "Thanks for your message!",
        },
        {
          value: "allow_single",
          text: "Congratulations!!!",
        },
      ],
    },
    appliesToOptions: ["ui", "marketing", "support"],
  },
  {
    key: "grammar.emoji",
    category: "grammar",
    controlType: "toggle",
    label: "Emoji",
    description: "Avoid emojis for accessibility and localisation.",
    defaultValue: true,
    examplesGood: {
      examples: [
        {
          text: "Words are the way forward",
        },
      ],
    },
    examplesBad: {
      examples: [
        {
          text: "❌",
        },
      ],
    },
    appliesToOptions: ["ui", "marketing", "support"],
  },
  {
    key: "grammar.ampersands",
    category: "grammar",
    controlType: "list",
    label: "Ampersands",
    description: "Use 'and' in copy - allow '&' in brand names and in titles/labels to shorten.",
    options: {
      options: [
        { key: "avoidAmpersandsInBody", label: "Avoid ampersands in body copy", defaultValue: true },
        { key: "allowInBrandNames", label: "Allow ampersands in brand names", defaultValue: true },
        { key: "allowInTitlesAndLabels", label: "Allow ampersands in titles and labels to shorten", defaultValue: true },
      ],
    },
    defaultValue: { avoidAmpersandsInBody: true, allowInBrandNames: true, allowInTitlesAndLabels: true },
    examplesGood: {
      examples: [
        {
          text: "Send and receive money",
        },
        {
          text: "Title: Send & receive money",
        },
      ],
    },
    examplesBad: {
      examples: [
        {
          text: "Send & receive money in body copy",
        },
      ],
    },
    appliesToOptions: ["ui", "marketing", "support"],
  },
  {
    key: "grammar.brackets",
    category: "grammar",
    controlType: "list",
    label: "Brackets",
    description: "Use brackets only for abbreviations or data. Place punctuation outside for partial clauses.",
    options: {
      options: [
        { key: "restrictBracketsUsage", label: "Use brackets only for abbreviations or data", defaultValue: true },
        { key: "punctuationOutsidePartial", label: "Punctuation outside brackets for partial clauses", defaultValue: true },
      ],
    },
    defaultValue: { restrictBracketsUsage: true, punctuationOutsidePartial: true },
    examplesGood: {
      examples: [
        {
          text: "Punctuation sits outside brackets (like this).",
        },
      ],
    },
    examplesBad: {
      examples: [
        {
          text: "Don't put punctuation inside brackets (if only part of the sentence is in the brackets.)",
        },
      ],
    },
    appliesToOptions: ["ui", "marketing", "support"],
  },
  {
    key: "grammar.bullets",
    category: "grammar",
    controlType: "list",
    label: "Bullet points",
    description: "One point per bullet. No full stops at end. Capitalisation depends on lead-in sentence.",
    options: {
      options: [
        { key: "oneIdeaPerBullet", label: "One point per bullet", defaultValue: true },
        { key: "noFullStopsAtEnd", label: "No full stops at end", defaultValue: true },
        { key: "leadInCapitalisationRule", label: "Capitalisation based on lead-in sentence completeness", defaultValue: true },
      ],
    },
    defaultValue: { oneIdeaPerBullet: true, noFullStopsAtEnd: true, leadInCapitalisationRule: true },
    examplesGood: {
      examples: [
        {
          text: "We'll need:\n• A copy of your passport\n• Proof of your address\n• Proof of your income",
        },
      ],
    },
    examplesBad: {
      examples: [
        {
          text: "We'll need:\n• A copy of your passport.\n• Proof of your address.\n• Proof of your income.",
        },
      ],
    },
    appliesToOptions: ["ui", "marketing", "support"],
  },
  {
    key: "grammar.numbers",
    category: "grammar",
    controlType: "list",
    label: "Numbers",
    description: "Use numerals for readability. Spell out if starting a sentence. Use k/m/bn when short on space.",
    options: {
      options: [
        { key: "preferNumerals", label: "Use numerals (10 not ten)", defaultValue: true },
        { key: "spellOutAtSentenceStart", label: "Spell out number when starting a sentence", defaultValue: true },
        { key: "allowCompactSuffixes", label: "Allow k/m/bn for compact marketing contexts", defaultValue: true },
        { key: "preferFullNumberForMoney", label: "Prefer full number for money amounts", defaultValue: true },
        { key: "preferWordsForRanges", label: "Use words instead of dashes for ranges (From/To, Between/And)", defaultValue: true },
      ],
    },
    defaultValue: {
      preferNumerals: true,
      spellOutAtSentenceStart: true,
      allowCompactSuffixes: true,
      preferFullNumberForMoney: true,
      preferWordsForRanges: true,
    },
    examplesGood: {
      examples: [
        {
          text: "There are 9 Bolt offices. Nine offices help us deliver our mission.",
        },
      ],
    },
    examplesBad: {
      examples: [
        {
          text: "We have fourteen new Bolt members...",
        },
      ],
    },
    appliesToOptions: ["ui", "marketing", "support"],
  },
  {
    key: "grammar.currencies",
    category: "grammar",
    controlType: "list",
    label: "Currencies",
    description: "Use currency code conventions and avoid symbols unless market-specific.",
    options: {
      options: [
        { key: "namePlusCodeFirstMention", label: "Use currency name + code in brackets on first mention", defaultValue: true },
        { key: "codeAfterAmountWithSpace", label: "Currency code after amount with a space", defaultValue: true },
        { key: "avoidSymbols", label: "Avoid symbols unless market-specific", defaultValue: true },
      ],
    },
    defaultValue: { namePlusCodeFirstMention: true, codeAfterAmountWithSpace: true, avoidSymbols: true },
    examplesGood: {
      examples: [
        {
          text: "New Zealand dollar (NZD), 10,000 SGD",
        },
      ],
    },
    examplesBad: {
      examples: [
        {
          text: "10,000sgd",
        },
      ],
    },
    appliesToOptions: ["ui", "marketing"],
  },
  {
    key: "grammar.percentages",
    category: "grammar",
    controlType: "toggle",
    label: "Percentages",
    description: "Use % symbol instead of the word 'percent'.",
    defaultValue: true,
    examplesGood: {
      examples: [
        {
          text: "You're about 75% of the way through this page.",
        },
      ],
    },
    examplesBad: {
      examples: [
        {
          text: "25 percent",
        },
      ],
    },
    appliesToOptions: ["ui", "marketing", "support"],
  },
  {
    key: "grammar.dates",
    category: "grammar",
    controlType: "list",
    label: "Dates",
    description: "Format dates per locale. Avoid cardinals. Optionally include day of week when relevant.",
    options: {
      options: [
        { key: "avoidCardinals", label: "No cardinals in dates", defaultValue: true },
        { key: "includeDayOfWeekWhenRelevant", label: "Include day of week when relevant in long-form comms", defaultValue: false },
      ],
    },
    defaultValue: { avoidCardinals: true, includeDayOfWeekWhenRelevant: false },
    examplesGood: {
      examples: [
        {
          text: "1 March 2023",
        },
      ],
    },
    examplesBad: {
      examples: [
        {
          text: "1st March 2023",
        },
      ],
    },
    appliesToOptions: ["ui", "marketing", "support"],
  },
  {
    key: "grammar.dashes",
    category: "grammar",
    controlType: "list",
    label: "Dashes",
    description: "Use correct dash forms. Avoid dash ranges - prefer words for ranges.",
    options: {
      options: [
        { key: "useEmDashForInterruption", label: "Use em dash with spaces for interruptions/emphasis", defaultValue: true },
        { key: "useEnDashForRanges", label: "Use en dash for ranges", defaultValue: true },
        { key: "preferWordsForRanges", label: "Avoid dash ranges - prefer 'From/To' or 'Between/And'", defaultValue: true },
      ],
    },
    defaultValue: { useEmDashForInterruption: true, useEnDashForRanges: true, preferWordsForRanges: true },
    examplesGood: {
      examples: [
        {
          text: "Use emphasis like this. Use an en dash for 1–10.",
        },
      ],
    },
    examplesBad: {
      examples: [
        {
          text: "Don't use 4—8 for a range.",
        },
      ],
    },
    appliesToOptions: ["ui", "marketing", "support"],
  },
  {
    key: "grammar.slashes",
    category: "grammar",
    controlType: "toggle",
    label: "Slashes",
    description: "No spaces either side of slashes.",
    defaultValue: true,
    examplesGood: {
      examples: [
        {
          text: "BIC/SWIFT",
        },
      ],
    },
    examplesBad: {
      examples: [
        {
          text: "BIC / SWIFT",
        },
      ],
    },
    appliesToOptions: ["ui", "marketing", "support"],
  },
  {
    key: "grammar.ellipses",
    category: "grammar",
    controlType: "list",
    label: "Ellipses",
    description: "Use ellipses only for unfinished thoughts or omission. No spaces around them.",
    options: {
      options: [
        { key: "noSpacesAroundEllipses", label: "No spaces around ellipses", defaultValue: true },
        { key: "restrictedUsage", label: "Use ellipses only for unfinished thoughts or omission", defaultValue: true },
      ],
    },
    defaultValue: { noSpacesAroundEllipses: true, restrictedUsage: true },
    examplesGood: {
      examples: [
        {
          text: "I'm not sure about it...but I'll work it out.",
        },
      ],
    },
    examplesBad: {
      examples: [
        {
          text: "This doesn't look right ... because it isn't.",
        },
      ],
    },
    appliesToOptions: ["ui", "marketing", "support"],
  },
  {
    key: "grammar.email",
    category: "grammar",
    controlType: "toggle",
    label: "Email",
    description: "Use 'Email' without hyphen.",
    defaultValue: true,
    examplesGood: {
      examples: [
        {
          text: "Email",
        },
      ],
    },
    examplesBad: {
      examples: [
        {
          text: "E-mail",
        },
      ],
    },
    appliesToOptions: ["ui", "marketing", "support"],
  },
  {
    key: "grammar.wifi",
    category: "grammar",
    controlType: "toggle",
    label: "Wifi",
    description: "Write wifi all lowercase, no spaces or hyphens.",
    defaultValue: true,
    examplesGood: {
      examples: [
        {
          text: "wifi",
        },
      ],
    },
    examplesBad: {
      examples: [
        {
          text: "Wi-Fi, WIFI",
        },
      ],
    },
    appliesToOptions: ["ui", "marketing", "support"],
  },
  {
    key: "grammar.dropdown",
    category: "grammar",
    controlType: "toggle",
    label: "Dropdown",
    description: "Use 'Dropdown' as one word.",
    defaultValue: true,
    examplesGood: {
      examples: [
        {
          text: "Dropdown",
        },
      ],
    },
    examplesBad: {
      examples: [
        {
          text: "Drop-down",
        },
      ],
    },
    appliesToOptions: ["ui", "support"],
  },
  {
    key: "grammar.driver_licence",
    category: "grammar",
    controlType: "toggle",
    label: "Driver licence",
    description: "Use 'Driver licence' spelling.",
    defaultValue: true,
    examplesGood: {
      examples: [
        {
          text: "Driver licence",
        },
      ],
    },
    examplesBad: {
      examples: [
        {
          text: "Driver's licence",
        },
      ],
    },
    appliesToOptions: ["ui", "marketing", "support"],
  },
  {
    key: "grammar.text",
    category: "grammar",
    controlType: "toggle",
    label: "Text",
    description: "Say text, not SMS or text message.",
    defaultValue: true,
    examplesGood: {
      examples: [
        {
          text: "Contact us by text.",
        },
      ],
    },
    examplesBad: {
      examples: [
        {
          text: "Send us a text message.",
        },
      ],
    },
    appliesToOptions: ["ui", "marketing", "support"],
  },
  {
    key: "grammar.time",
    category: "grammar",
    controlType: "list",
    label: "Time",
    description: "Use numbers + am/pm with a space. Use 00 on-the-hour. Use en dash for ranges. Put time zone in brackets.",
    options: {
      options: [
        { key: "spaceBeforeAmPm", label: "Use numbers + am/pm with a space", defaultValue: true },
        { key: "use00OnHour", label: "Use '00' on-the-hour", defaultValue: true },
        { key: "useEnDashForRanges", label: "Use en dash for time ranges", defaultValue: true },
        { key: "timezoneInBrackets", label: "Time zone in brackets", defaultValue: true },
      ],
    },
    defaultValue: { spaceBeforeAmPm: true, use00OnHour: true, useEnDashForRanges: true, timezoneInBrackets: true },
    examplesGood: {
      examples: [
        {
          text: "8:00 am, 7:00–11:30 pm, 7:00 am (GMT)",
        },
      ],
    },
    examplesBad: {
      examples: [
        {
          text: "8am, 7am-11:30pm, 7:00 am GMT",
        },
      ],
    },
    appliesToOptions: ["ui", "marketing", "support"],
  },
  {
    key: "grammar.oxford_comma",
    category: "grammar",
    controlType: "toggle",
    label: "Oxford comma",
    description: "Use Oxford comma only when needed for clarity.",
    defaultValue: true,
    examplesGood: {
      examples: [
        {
          text: "…two employees, an accountant, and a director.",
        },
      ],
    },
    examplesBad: {
      examples: [
        {
          text: "…two employees, an accountant and a director.",
        },
      ],
    },
    appliesToOptions: ["ui", "marketing", "support"],
  },
  {
    key: "grammar.change",
    category: "grammar",
    controlType: "toggle",
    label: "Change",
    description: "Use 'Change' for switching from one option to another.",
    defaultValue: true,
    examplesGood: {
      examples: [
        {
          text: "Change how this balance is held",
        },
      ],
    },
    examplesBad: {
      examples: [
        {
          text: "Edit how this balance is held",
        },
      ],
    },
    appliesToOptions: ["ui"],
  },
  {
    key: "grammar.choose",
    category: "grammar",
    controlType: "toggle",
    label: "Choose",
    description: "Use 'Choose' when the user needs a decision where any option could be true.",
    defaultValue: true,
    examplesGood: {
      examples: [
        {
          enabled: true,
          text: "Choose how people can pay you",
        },
      ],
    },
    examplesBad: {
      examples: [
        {
          enabled: false,
          text: "Select how people can pay you",
        },
      ],
    },
    appliesToOptions: ["ui"],
  },
  {
    key: "grammar.countries",
    category: "grammar",
    controlType: "toggle",
    label: "Countries",
    description: "Abbreviate commonly spoken country names without full stops.",
    defaultValue: true,
    examplesGood: {
      examples: [
        {
          text: "UK, US, UAE",
        },
      ],
    },
    examplesBad: {
      examples: [
        {
          text: "U.K, U.S, U.A.E",
        },
      ],
    },
    appliesToOptions: ["ui", "marketing", "support"],
  },
  {
    key: "grammar.edit",
    category: "grammar",
    controlType: "toggle",
    label: "Edit",
    description: "Use 'Edit' when the user can modify something that already exists.",
    defaultValue: true,
    examplesGood: {
      examples: [
        {
          text: "Edit personal information",
        },
      ],
    },
    examplesBad: {
      examples: [
        {
          text: "Change personal information",
        },
      ],
    },
    appliesToOptions: ["ui"],
  },
  {
    key: "grammar.eg",
    category: "grammar",
    controlType: "toggle",
    label: "For example (avoid e.g.)",
    description: "Avoid 'e.g.'. Prefer 'for example' or 'like'.",
    defaultValue: true,
    examplesGood: {
      examples: [
        {
          text: "For example, email and chat support.",
        },
      ],
    },
    examplesBad: {
      examples: [
        {
          text: "Support options, e.g., email and chat.",
        },
      ],
    },
    appliesToOptions: ["ui", "marketing", "support"],
  },
  {
    key: "grammar.etc",
    category: "grammar",
    controlType: "toggle",
    label: "Etc.",
    description: "Avoid 'etc.' or 'and more' in external communications - give examples instead.",
    defaultValue: true,
    examplesGood: {
      examples: [
        {
          text: "We offer email, chat, and phone support.",
        },
      ],
    },
    examplesBad: {
      examples: [
        {
          text: "We offer email, chat, phone, etc.",
        },
      ],
    },
    appliesToOptions: ["marketing", "support"],
  },
  {
    key: "grammar.login",
    category: "grammar",
    controlType: "toggle",
    label: "Login vs log in",
    description: "Login is a noun/adjective. Log in is a verb.",
    defaultValue: true,
    examplesGood: {
      examples: [
        {
          text: "Put in your login details. Log in to your account.",
        },
      ],
    },
    examplesBad: {
      examples: [
        {
          text: "Put in your log in details. Login to your account.",
        },
      ],
    },
    appliesToOptions: ["ui"],
  },
  {
    key: "grammar.markup",
    category: "grammar",
    controlType: "toggle",
    label: "Markup vs mark up",
    description: "Markup is a noun. Mark up is a verb.",
    defaultValue: true,
    examplesGood: {
      examples: [
        {
          text: "There are no markups on the exchange rate. We don't mark up exchange rates.",
        },
      ],
    },
    examplesBad: {
      examples: [
        {
          text: "mark ups, markup (verb)",
        },
      ],
    },
    appliesToOptions: ["ui", "marketing", "support"],
  },
  {
    key: "grammar.view",
    category: "grammar",
    controlType: "toggle",
    label: "View",
    description: "Use 'View' rather than 'See' for instructions.",
    defaultValue: true,
    examplesGood: {
      examples: [
        {
          text: "View recipients, View details",
        },
      ],
    },
    examplesBad: {
      examples: [
        {
          text: "See recipients, See details",
        },
      ],
    },
    appliesToOptions: ["ui", "support"],
  },
  {
    key: "grammar.hyphenation",
    category: "grammar",
    controlType: "list",
    label: "Hyphenation",
    description: "Use hyphens for compound words and modifiers. Avoid hyphens in common compound words.",
    options: {
      options: [
        { key: "useHyphensForModifiers", label: "Use hyphens for compound modifiers (e.g., 'real-time data')", defaultValue: true },
        { key: "avoidHyphensInCommonWords", label: "Avoid hyphens in common compound words (e.g., 'wellbeing' not 'well-being')", defaultValue: true },
      ],
    },
    defaultValue: { useHyphensForModifiers: true, avoidHyphensInCommonWords: true },
    examplesGood: {
      examples: [
        {
          text: "Real-time updates, user-friendly interface, wellbeing",
        },
      ],
    },
    examplesBad: {
      examples: [
        {
          text: "Real time updates, user friendly interface, well-being",
        },
      ],
    },
    appliesToOptions: ["ui", "marketing", "support"],
  },
  {
    key: "grammar.quotation_marks",
    category: "grammar",
    controlType: "radio",
    label: "Quotation marks",
    description: "Choose between single and double quotation marks.",
    options: {
      options: [
        { value: "double", label: "Use double quotation marks" },
        { value: "single", label: "Use single quotation marks" },
      ],
    },
    defaultValue: "double",
    examplesGood: {
      examples: [
        {
          value: "double",
          text: 'He said "Hello" to me.',
        },
        {
          value: "single",
          text: "He said 'Hello' to me.",
        },
      ],
    },
    examplesBad: {
      examples: [
        {
          value: "double",
          text: "He said 'Hello' to me.",
        },
        {
          value: "single",
          text: 'He said "Hello" to me.',
        },
      ],
    },
    appliesToOptions: ["ui", "marketing", "support"],
  },
  {
    key: "grammar.apostrophes",
    category: "grammar",
    controlType: "list",
    label: "Apostrophes",
    description: "Use apostrophes correctly for possessives and contractions. Avoid apostrophes in plural forms.",
    options: {
      options: [
        { key: "useForPossessives", label: "Use apostrophes for possessives", defaultValue: true },
        { key: "useForContractions", label: "Use apostrophes for contractions", defaultValue: true },
        { key: "avoidInPlurals", label: "Avoid apostrophes in plural forms", defaultValue: true },
      ],
    },
    defaultValue: { useForPossessives: true, useForContractions: true, avoidInPlurals: true },
    examplesGood: {
      examples: [
        {
          text: "It's working. The company's policy. The 1990s were great.",
        },
      ],
    },
    examplesBad: {
      examples: [
        {
          text: "Its working. The companys policy. The 1990's were great.",
        },
      ],
    },
    appliesToOptions: ["ui", "marketing", "support"],
  },
  {
    key: "grammar.semicolons_colons",
    category: "grammar",
    controlType: "list",
    label: "Semicolons and colons",
    description: "Use semicolons to connect related independent clauses. Use colons to introduce lists or explanations.",
    options: {
      options: [
        { key: "useSemicolonsForRelatedClauses", label: "Use semicolons to connect related independent clauses", defaultValue: true },
        { key: "useColonsForLists", label: "Use colons to introduce lists or explanations", defaultValue: true },
        { key: "avoidInSimpleSentences", label: "Avoid semicolons and colons in simple sentences", defaultValue: true },
      ],
    },
    defaultValue: { useSemicolonsForRelatedClauses: true, useColonsForLists: true, avoidInSimpleSentences: true },
    examplesGood: {
      examples: [
        {
          text: "We need three things: time, money, and support. The deadline is tomorrow; we must act quickly.",
        },
      ],
    },
    examplesBad: {
      examples: [
        {
          text: "We need three things, time, money, and support. The deadline is tomorrow, we must act quickly.",
        },
      ],
    },
    appliesToOptions: ["ui", "marketing", "support"],
  },
  {
    key: "grammar.capitalization",
    category: "grammar",
    controlType: "list",
    label: "Capitalization",
    description: "Beyond sentence case, handle title case, proper nouns, and all caps appropriately.",
    options: {
      options: [
        { key: "capitalizeProperNouns", label: "Capitalize proper nouns", defaultValue: true },
        { key: "avoidAllCaps", label: "Avoid all caps except for acronyms", defaultValue: true },
        { key: "titleCaseForHeadings", label: "Use title case for headings when appropriate", defaultValue: false },
      ],
    },
    defaultValue: { capitalizeProperNouns: true, avoidAllCaps: true, titleCaseForHeadings: false },
    examplesGood: {
      examples: [
        {
          text: "Send money to John in New York. API endpoint. Heading: Send Money",
        },
      ],
    },
    examplesBad: {
      examples: [
        {
          text: "Send money to john in new york. API ENDPOINT. heading: send money",
        },
      ],
    },
    appliesToOptions: ["ui", "marketing", "support"],
  },
  {
    key: "grammar.possessives",
    category: "grammar",
    controlType: "toggle",
    label: "Common possessive errors",
    description: "Distinguish between its/it's, your/you're, their/they're/there.",
    defaultValue: true,
    examplesGood: {
      examples: [
        {
          text: "It's working. Your account. They're here. Their money.",
        },
      ],
    },
    examplesBad: {
      examples: [
        {
          text: "Its working. You're account. There here. They're money.",
        },
      ],
    },
    appliesToOptions: ["ui", "marketing", "support"],
  },
  {
    key: "grammar.technical_terms",
    category: "grammar",
    controlType: "list",
    label: "Technical terms",
    description: "Standardize capitalization and spelling of technical terms like API, URL, HTTP, etc.",
    options: {
      options: [
        { key: "capitalizeAcronyms", label: "Capitalize acronyms (API, URL, HTTP)", defaultValue: true },
        { key: "lowercaseWhenGeneric", label: "Lowercase when used generically (api, url)", defaultValue: false },
      ],
    },
    defaultValue: { capitalizeAcronyms: true, lowercaseWhenGeneric: false },
    examplesGood: {
      examples: [
        {
          text: "API endpoint, URL structure, HTTP request",
        },
      ],
    },
    examplesBad: {
      examples: [
        {
          text: "api endpoint, url structure, http request",
        },
      ],
    },
    appliesToOptions: ["ui", "marketing", "support"],
  },
  {
    key: "grammar.abbreviations",
    category: "grammar",
    controlType: "list",
    label: "Abbreviations with periods",
    description: "Use periods for titles (Dr., Mr., etc.) and avoid periods for common abbreviations.",
    options: {
      options: [
        { key: "usePeriodsForTitles", label: "Use periods for titles (Dr., Mr., Mrs.)", defaultValue: true },
        { key: "avoidPeriodsForCommonAbbrev", label: "Avoid periods for common abbreviations (etc, eg)", defaultValue: true },
      ],
    },
    defaultValue: { usePeriodsForTitles: true, avoidPeriodsForCommonAbbrev: true },
    examplesGood: {
      examples: [
        {
          text: "Dr. Smith, Mr. Jones, etc (not etc.)",
        },
      ],
    },
    examplesBad: {
      examples: [
        {
          text: "Dr Smith, Mr Jones, etc.",
        },
      ],
    },
    appliesToOptions: ["ui", "marketing", "support"],
  },
  {
    key: "grammar.parallel_structure",
    category: "grammar",
    controlType: "toggle",
    label: "Parallel structure",
    description: "Maintain consistent grammatical structure in lists and series.",
    defaultValue: true,
    examplesGood: {
      examples: [
        {
          text: "We need to write, edit, and publish the content.",
        },
      ],
    },
    examplesBad: {
      examples: [
        {
          text: "We need to write, editing, and publish the content.",
        },
      ],
    },
    appliesToOptions: ["ui", "marketing", "support"],
  },
  {
    key: "grammar.comma_usage",
    category: "grammar",
    controlType: "list",
    label: "Comma usage",
    description: "Use commas for introductory clauses, separating items in lists, and clarity.",
    options: {
      options: [
        { key: "commaAfterIntroductory", label: "Use comma after introductory clauses", defaultValue: true },
        { key: "commaInSeries", label: "Use commas to separate items in a series", defaultValue: true },
        { key: "commaForClarity", label: "Use commas for clarity when needed", defaultValue: true },
      ],
    },
    defaultValue: { commaAfterIntroductory: true, commaInSeries: true, commaForClarity: true },
    examplesGood: {
      examples: [
        {
          text: "After you log in, you'll see the dashboard. We need apples, oranges, and bananas.",
        },
      ],
    },
    examplesBad: {
      examples: [
        {
          text: "After you log in you'll see the dashboard. We need apples oranges and bananas.",
        },
      ],
    },
    appliesToOptions: ["ui", "marketing", "support"],
  },
];