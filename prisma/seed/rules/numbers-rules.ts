// Rule definitions - static metadata (not stored in database)

export interface NumbersRuleDefinition {
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

export const numbersRuleDefinitions: NumbersRuleDefinition[] = [
  {
    key: "numbers.use_numerals",
    category: "numbers",
    controlType: "select",
    label: "Numbers",
    description: "Numerals are easier to scan on screens.",
    options: {
      options: [
        { value: "numerals", label: "Use numerals by default" },
        { value: "spell_out", label: "Spell out at sentence start" },
      ],
    },
    defaultValue: "numerals",
    examplesGood: {
      examples: [
        {
          usage: "numerals",
          text: "There are 9 offices. Nine offices help us deliver our mission.",
        },
        {
          usage: "spell_out",
          text: "Nine offices help us deliver our mission. There are 9 offices.",
        },
      ],
    },
    appliesToOptions: ["ui", "marketing", "support"],
  },
  {
    key: "numbers.large_abbreviations",
    category: "numbers",
    controlType: "toggle",
    label: "Large Numbers",
    description: "When space is tight, abbreviations improve readability.",
    defaultValue: true,
    examplesGood: {
      examples: [
        {
          enabled: true,
          text: "1k, 5m, 2bn",
        },
        {
          enabled: false,
          text: "1,000, 5,000,000, 2,000,000,000",
        },
      ],
    },
    appliesToOptions: ["ui", "marketing"],
  },
  {
    key: "numbers.ranges",
    category: "numbers",
    controlType: "select",
    label: "Ranges",
    description: "Words are easier to scan and work better for screen readers.",
    options: {
      options: [
        { value: "words", label: "Use 'From...to...' and 'Between...and...' (default)" },
        { value: "dashes", label: "Use dashes" },
      ],
    },
    defaultValue: "words",
    examplesGood: {
      examples: [
        {
          usage: "words",
          text: "From 1 to 7 October 2023, Between 3 and 5 working days",
        },
        {
          usage: "dashes",
          text: "1–7 October 2023, 3–5 working days",
        },
      ],
    },
    examplesBad: {
      examples: [
        {
          usage: "words",
          text: "1–7 October 2023, 3–5 working days",
        },
        {
          usage: "dashes",
          text: "From 1 to 7 October 2023, Between 3 and 5 working days",
        },
      ],
    },
    appliesToOptions: ["ui", "marketing", "support"],
  },
  {
    key: "dates.format",
    category: "numbers",
    controlType: "toggle",
    label: "Dates",
    description: "Dates should match regional expectations.",
    defaultValue: true,
    examplesGood: {
      examples: [
        {
          locale: "en-GB",
          text: "1 March 2023, 12/03/2025",
        },
        {
          locale: "en-US",
          text: "March 1, 2023, 03/12/2025",
        },
      ],
    },
    appliesToOptions: ["ui", "marketing", "support"],
  },
  {
    key: "dates.include_day_name",
    category: "numbers",
    controlType: "toggle",
    label: "Include Day Name",
    description: "Include day name in long copy.",
    defaultValue: false,
    examplesGood: {
      examples: [
        {
          enabled: true,
          text: "Wednesday 1 March 2023",
        },
        {
          enabled: false,
          text: "1 March 2023",
        },
      ],
    },
    appliesToOptions: ["ui", "marketing", "support"],
  },
  {
    key: "time.format",
    category: "numbers",
    controlType: "list",
    label: "Time",
    description: "Consistent time formatting reduces confusion.",
    options: {
      options: [
        { key: "twelve_hour", label: "12-hour clock", defaultValue: true },
        { key: "space_before_ampm", label: "Space before am/pm", defaultValue: true },
        { key: "en_dash_ranges", label: "En dash for ranges", defaultValue: true },
      ],
    },
    defaultValue: { twelve_hour: true, space_before_ampm: true, en_dash_ranges: true },
    examplesGood: {
      examples: [
        {
          text: "8:00 am, 8:45 pm, 7:00-11:30 pm",
        },
      ],
    },
    examplesBad: {
      examples: [
        {
          text: "8am, 8:45pm, 7am-11:30pm",
        },
      ],
    },
    appliesToOptions: ["ui", "marketing", "support"],
  },
  {
    key: "currency.naming",
    category: "numbers",
    controlType: "toggle",
    label: "Currency Naming",
    description: "Currency codes avoid ambiguity.",
    defaultValue: true,
    examplesGood: {
      examples: [
        {
          enabled: true,
          text: "10,000 SGD (Singapore dollars)",
        },
        {
          enabled: false,
          text: "10,000 Singapore dollars",
        },
      ],
    },
    appliesToOptions: ["ui", "marketing", "support"],
  },
  {
    key: "currency.formatting",
    category: "numbers",
    controlType: "select",
    label: "Currency Formatting",
    description: "Put currency codes after the number with a space.",
    options: {
      options: [
        { value: "code_after", label: "Code after number (default)" },
        { value: "symbol_before", label: "Symbol before number" },
      ],
    },
    defaultValue: "code_after",
    examplesGood: {
      examples: [
        {
          usage: "code_after",
          text: "10,000 SGD, 50 BRL",
        },
        {
          usage: "symbol_before",
          text: "$10,000, £50",
        },
      ],
    },
    examplesBad: {
      examples: [
        {
          usage: "code_after",
          text: "$10,000, £50",
        },
        {
          usage: "symbol_before",
          text: "10,000 SGD, 50 BRL",
        },
      ],
    },
    appliesToOptions: ["ui", "marketing", "support"],
  },
  {
    key: "currency.symbols",
    category: "numbers",
    controlType: "toggle",
    label: "Currency Symbols",
    description: "Symbols disallowed unless market-specific.",
    defaultValue: true,
    examplesGood: {
      examples: [
        {
          enabled: true,
          text: "Use codes: 10,000 SGD",
        },
        {
          enabled: false,
          text: "Use symbols: $10,000 (US market only)",
        },
      ],
    },
    appliesToOptions: ["ui", "marketing", "support"],
  },
];

