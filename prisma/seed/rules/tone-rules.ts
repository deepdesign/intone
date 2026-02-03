// Rule definitions - static metadata (not stored in database)
// These are used to generate the UI and controls

export interface ToneRuleDefinition {
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

export const toneRuleDefinitions: ToneRuleDefinition[] = [
  {
    key: "tone.locale",
    category: "tone",
    controlType: "select",
    label: "Language and Locale",
    description: "Sets the default language and regional variant. This affects spelling, date formats, punctuation norms, and currency formats.",
    options: {
      options: [
        { value: "en-GB", label: "English (UK)" },
        { value: "en-US", label: "English (US)" },
        { value: "en-AU", label: "English (AU)" },
      ],
    },
    defaultValue: "en-GB",
    examplesGood: {
      examples: [
        {
          locale: "en-GB",
          text: "organisation, colour, 12/03/2025",
        },
        {
          locale: "en-US",
          text: "organization, color, 03/12/2025",
        },
        {
          locale: "en-AU",
          text: "organisation, colour, 12/03/2025",
        },
      ],
    },
    appliesToOptions: ["ui", "marketing", "support", "internal"],
  },
  {
    key: "tone.formality",
    category: "tone",
    controlType: "slider",
    label: "Formality",
    description: "How formal should your brand sound? This affects sentence structure, vocabulary choice, and address style. Formal doesn't mean unfriendly—it means structured and professional.",
    options: {
      options: [
        { value: "formal", label: "Formal" },
        { value: "neutral", label: "Neutral" },
        { value: "conversational", label: "Conversational" },
      ],
    },
    defaultValue: "neutral",
    examplesGood: {
      examples: [
        {
          level: 1,
          text: "We've processed your request.",
        },
        {
          level: 1,
          text: "Done! Your payment went through.",
        },
        {
          level: 1,
          text: "All set! We've updated your account.",
        },
        {
          level: 2,
          text: "Your request has been processed.",
        },
        {
          level: 2,
          text: "Your payment was successful.",
        },
        {
          level: 2,
          text: "Your account has been updated.",
        },
        {
          level: 3,
          text: "We have processed your request.",
        },
        {
          level: 3,
          text: "We have successfully completed your payment.",
        },
        {
          level: 3,
          text: "We have updated your account details.",
        },
        {
          level: 4,
          text: "We are pleased to inform you that your request has been processed.",
        },
        {
          level: 4,
          text: "We are pleased to confirm that your payment has been successfully processed.",
        },
        {
          level: 4,
          text: "We are pleased to inform you that your account has been updated accordingly.",
        },
        {
          level: 5,
          text: "We are pleased to inform you that your request has been processed in accordance with our standard procedures.",
        },
        {
          level: 5,
          text: "We are pleased to confirm that your payment transaction has been successfully processed in accordance with our established protocols.",
        },
        {
          level: 5,
          text: "We are pleased to inform you that your account information has been updated in accordance with our standard operating procedures.",
        },
      ],
    },
    examplesBad: {
      examples: [
        {
          level: 1,
          text: "We are pleased to inform you that your request has been processed in accordance with our standard procedures.", // Too formal for conversational
        },
        {
          level: 5,
          text: "Hey! We did the thing you asked for.", // Too casual for formal
        },
      ],
    },
    appliesToOptions: ["ui", "marketing", "support", "internal"],
  },
  {
    key: "tone.confidence",
    category: "tone",
    controlType: "slider",
    label: "Confidence vs Caution",
    description: "How confidently should your brand speak? Assertive statements build trust but must be accurate. Careful language is essential for regulatory compliance and risk management.",
    options: {
      min: 1,
      max: 5,
      step: 1,
      labels: ["Very Careful", "Careful", "Balanced", "Assertive", "Very Assertive"],
    },
    defaultValue: 3,
    examplesGood: {
      examples: [
        {
          level: 1,
          text: "This might help improve your results.",
        },
        {
          level: 1,
          text: "This could potentially enhance your outcomes.",
        },
        {
          level: 1,
          text: "This may possibly contribute to better performance.",
        },
        {
          level: 2,
          text: "This may help improve your results.",
        },
        {
          level: 2,
          text: "This could help enhance your outcomes.",
        },
        {
          level: 2,
          text: "This may contribute to better performance.",
        },
        {
          level: 3,
          text: "This should help improve your results.",
        },
        {
          level: 3,
          text: "This should enhance your outcomes.",
        },
        {
          level: 3,
          text: "This should contribute to better performance.",
        },
        {
          level: 4,
          text: "This will help improve your results.",
        },
        {
          level: 4,
          text: "This will enhance your outcomes.",
        },
        {
          level: 4,
          text: "This will contribute to better performance.",
        },
        {
          level: 5,
          text: "This will improve your results.",
        },
        {
          level: 5,
          text: "This improves your outcomes.",
        },
        {
          level: 5,
          text: "This enhances your performance.",
        },
      ],
    },
    examplesBad: {
      examples: [
        {
          level: 1,
          text: "This definitely will improve your results.", // Too assertive for careful
        },
        {
          level: 5,
          text: "This might possibly help improve your results.", // Too careful for assertive
        },
      ],
    },
    appliesToOptions: ["ui", "marketing", "support"],
  },
  {
    key: "tone.directness",
    category: "tone",
    controlType: "slider",
    label: "Directness",
    description: "How directly should your brand communicate? Direct and concise saves time, while expressive adds personality and context.",
    options: {
      min: 1,
      max: 5,
      step: 1,
      labels: ["Very Expressive", "Expressive", "Neutral", "Direct", "Very Direct"],
    },
    defaultValue: 3,
    examplesGood: {
      examples: [
        {
          level: 1,
          text: "Oops! That email address doesn't look quite right. Could you double-check it for us?",
        },
        {
          level: 1,
          text: "Hmm, that email doesn't seem quite right. Mind taking another look?",
        },
        {
          level: 1,
          text: "That email address looks a bit off. Could you give it another check?",
        },
        {
          level: 2,
          text: "That email address doesn't look quite right. Could you double-check it?",
        },
        {
          level: 2,
          text: "That email doesn't appear to be valid. Please check it again.",
        },
        {
          level: 2,
          text: "The email address seems incorrect. Please verify it.",
        },
        {
          level: 3,
          text: "Please enter a valid email address.",
        },
        {
          level: 3,
          text: "Please provide a valid email address.",
        },
        {
          level: 3,
          text: "Please check your email address and try again.",
        },
        {
          level: 4,
          text: "Invalid email address.",
        },
        {
          level: 4,
          text: "Email address is invalid.",
        },
        {
          level: 4,
          text: "The email address provided is not valid.",
        },
        {
          level: 5,
          text: "Email invalid.",
        },
        {
          level: 5,
          text: "Invalid email.",
        },
        {
          level: 5,
          text: "Email format error.",
        },
      ],
    },
    examplesBad: {
      examples: [
        {
          level: 1,
          text: "Email invalid.", // Too direct for expressive
        },
        {
          level: 5,
          text: "Oops! That email address doesn't look quite right. Could you double-check it for us?", // Too expressive for direct
        },
      ],
    },
    appliesToOptions: ["ui", "marketing", "support"],
  },
  {
    key: "tone.personality.exclude_slang",
    category: "tone",
    controlType: "toggle",
    label: "Avoid Slang",
    description: "When enabled, the brand uses standard, formal language and avoids casual slang terms.",
    defaultValue: true,
    examplesGood: {
      examples: [
        {
          enabled: true,
          text: "That's great! Let's get started.",
        },
        {
          enabled: false,
          text: "That's awesome! Let's get cracking.",
        },
      ],
    },
    appliesToOptions: ["ui", "marketing", "support"],
  },
  {
    key: "tone.personality.exclude_emoji",
    category: "tone",
    controlType: "toggle",
    label: "Avoid Emojis",
    description: "Emojis are hard to localise and aren't very accessible. When enabled, the brand uses words instead of emojis.",
    defaultValue: true,
    examplesGood: {
      examples: [
        {
          enabled: true,
          text: "Great job! Your profile is complete.",
        },
        {
          enabled: false,
          text: "Great job! Your profile is complete. ✨",
        },
      ],
    },
    appliesToOptions: ["ui", "marketing", "support"],
  },
  {
    key: "tone.personality.exclude_exclamation",
    category: "tone",
    controlType: "toggle",
    label: "Avoid Exclamation Marks",
    description: "Exclamation marks rarely work in professional tone. When enabled, the brand uses periods or question marks instead.",
    defaultValue: true,
    examplesGood: {
      examples: [
        {
          enabled: true,
          text: "Welcome to our platform.",
        },
        {
          enabled: false,
          text: "Welcome to our platform!",
        },
      ],
    },
    appliesToOptions: ["ui", "marketing", "support"],
  },
  {
    key: "tone.personality.exclude_rhetorical",
    category: "tone",
    controlType: "toggle",
    label: "Avoid Rhetorical Questions",
    description: "Rhetorical questions can feel manipulative. When enabled, the brand makes direct statements instead.",
    defaultValue: true,
    examplesGood: {
      examples: [
        {
          enabled: true,
          text: "This feature helps you save time.",
        },
        {
          enabled: false,
          text: "Want to save time? This feature helps.",
        },
      ],
    },
    appliesToOptions: ["ui", "marketing"],
  },
  {
    key: "tone.sentence.prefer_short",
    category: "tone",
    controlType: "toggle",
    label: "Prefer Short Sentences",
    description: "Short sentences are easier to scan and understand, especially on small screens.",
    defaultValue: true,
    examplesGood: {
      examples: [
        {
          enabled: true,
          text: "Your payment was successful. You'll receive a confirmation email shortly.",
        },
        {
          enabled: false,
          text: "Your payment was successful and you'll receive a confirmation email shortly.",
        },
      ],
    },
    appliesToOptions: ["ui", "marketing", "support"],
  },
  {
    key: "tone.sentence.one_idea",
    category: "tone",
    controlType: "toggle",
    label: "One Idea Per Sentence",
    description: "Each sentence should express a single, clear idea. This improves clarity and readability.",
    defaultValue: true,
    examplesGood: {
      examples: [
        {
          enabled: true,
          text: "We've updated your account. Check your email for details.",
        },
        {
          enabled: false,
          text: "We've updated your account, so check your email for details.",
        },
      ],
    },
    appliesToOptions: ["ui", "marketing", "support"],
  },
  {
    key: "tone.sentence.use_contractions",
    category: "tone",
    controlType: "toggle",
    label: "Use Contractions",
    description: "Contractions make writing conversational and human. We're instead of we are, can't instead of cannot.",
    defaultValue: true,
    examplesGood: {
      examples: [
        {
          enabled: true,
          text: "We're here to help. You can't go wrong with this option.",
        },
        {
          enabled: false,
          text: "We are here to help. You cannot go wrong with this option.",
        },
      ],
    },
    appliesToOptions: ["ui", "marketing", "support"],
  },
  {
    key: "tone.sentence.active_voice",
    category: "tone",
    controlType: "radio",
    label: "Active voice",
    description: "Choose between active voice and passive voice. In active voice, the subject does the action. This makes it clear who is doing what.",
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
          text: "Jon broke the sauna.",
        },
        {
          value: "passive",
          text: "The sauna was broken by Jon.",
        },
      ],
    },
    examplesBad: {
      examples: [
        {
          value: "active",
          text: "The sauna got broken by Jon.",
        },
        {
          value: "passive",
          text: "Jon broke the sauna.",
        },
      ],
    },
    appliesToOptions: ["ui", "marketing", "support", "internal"],
  },
  {
    key: "tone.ui.buttons_start_verbs",
    category: "tone",
    controlType: "toggle",
    label: "Buttons Start with Verbs",
    description: "Action buttons should start with verbs to clearly indicate what will happen. Save changes, not Changes.",
    defaultValue: true,
    examplesGood: {
      examples: [
        {
          enabled: true,
          text: "Save changes, Delete account, Update profile",
        },
        {
          enabled: false,
          text: "Changes, Delete, Profile update",
        },
      ],
    },
    appliesToOptions: ["ui"],
  },
  {
    key: "tone.ui.use_select_not_click",
    category: "tone",
    controlType: "toggle",
    label: "Use 'Select' Instead of 'Click'",
    description: "'Select' is more inclusive than 'Click' as it works for all input methods, not just manual clicks.",
    defaultValue: true,
    examplesGood: {
      examples: [
        {
          enabled: true,
          text: "Select 'Add new' to continue.",
        },
        {
          enabled: false,
          text: "Click 'Add new' to continue.",
        },
      ],
    },
    appliesToOptions: ["ui", "support"],
  },
  {
    key: "tone.ui.use_view_not_see",
    category: "tone",
    controlType: "toggle",
    label: "Use 'View' Instead of 'See'",
    description: "When giving the user an option or instruction to look at something, use 'View' rather than 'See'.",
    defaultValue: true,
    examplesGood: {
      examples: [
        {
          enabled: true,
          text: "View recipients, View details",
        },
        {
          enabled: false,
          text: "See recipients, See details",
        },
      ],
    },
    appliesToOptions: ["ui", "support"],
  },
  {
    key: "tone.perspective.second_person",
    category: "tone",
    controlType: "toggle",
    label: "Use Second Person Perspective",
    description: "When writing for product screens, refer to the user using 'you', 'your', 'yours'—not 'me', 'my', 'mine'. This creates a consistent perspective throughout the product.",
    defaultValue: true,
    examplesGood: {
      examples: [
        {
          enabled: true,
          text: "Your address, Update your profile",
        },
        {
          enabled: false,
          text: "My address, Update my profile",
        },
      ],
    },
    appliesToOptions: ["ui"],
  },
  {
    key: "tone.enthusiasm",
    category: "tone",
    controlType: "slider",
    label: "Enthusiasm",
    description: "Overuse of excitement can reduce trust. Most brands benefit from restraint.",
    options: {
      min: 1,
      max: 5,
      step: 1,
      labels: ["Very Low", "Low", "Neutral", "High", "Very High"],
    },
    defaultValue: 1,
    examplesGood: {
      examples: [
        {
          level: 1,
          text: "Your request has been processed.",
        },
        {
          level: 1,
          text: "Payment completed.",
        },
        {
          level: 1,
          text: "Account updated.",
        },
        {
          level: 2,
          text: "We've processed your request.",
        },
        {
          level: 2,
          text: "We've completed your payment.",
        },
        {
          level: 2,
          text: "We've updated your account.",
        },
        {
          level: 3,
          text: "Great! We've processed your request.",
        },
        {
          level: 3,
          text: "Great! Your payment went through.",
        },
        {
          level: 3,
          text: "Great! We've updated your account.",
        },
        {
          level: 4,
          text: "Excellent! We've successfully processed your request.",
        },
        {
          level: 4,
          text: "Excellent! Your payment has been processed successfully.",
        },
        {
          level: 4,
          text: "Excellent! We've successfully updated your account.",
        },
        {
          level: 5,
          text: "Amazing! We're thrilled to let you know your request has been processed successfully!",
        },
        {
          level: 5,
          text: "Amazing! We're so excited to tell you your payment went through perfectly!",
        },
        {
          level: 5,
          text: "Fantastic! We're absolutely delighted that your account update was successful!",
        },
      ],
    },
    examplesBad: {
      examples: [
        {
          level: 1,
          text: "Amazing! We're thrilled to let you know your request has been processed successfully!", // Too enthusiastic for low
        },
        {
          level: 5,
          text: "Your request has been processed.", // Too low for high enthusiasm
        },
      ],
    },
    appliesToOptions: ["ui", "marketing", "support"],
  },
  {
    key: "tone.humour",
    category: "tone",
    controlType: "slider",
    label: "Humour",
    description: "Humour is hard to scale and harder to localise. Use it only if it's core to your brand.",
    options: {
      min: 1,
      max: 5,
      step: 1,
      labels: ["None", "Minimal", "Occasional", "Moderate", "Frequent"],
    },
    defaultValue: 1,
    examplesGood: {
      examples: [
        {
          level: 1,
          text: "An error occurred. Our team has been notified.",
        },
        {
          level: 1,
          text: "A problem was detected. We've been alerted.",
        },
        {
          level: 1,
          text: "An issue has been identified. Our team is aware.",
        },
        {
          level: 2,
          text: "Something went wrong. Our team has been notified and will fix it soon.",
        },
        {
          level: 2,
          text: "A problem occurred. We've been notified and are working on it.",
        },
        {
          level: 2,
          text: "An issue was detected. Our team has been alerted and will resolve it.",
        },
        {
          level: 3,
          text: "Oops! Something went wrong. Our team has been notified.",
        },
        {
          level: 3,
          text: "Oops! A problem occurred. We've been alerted and are on it.",
        },
        {
          level: 3,
          text: "Oops! Something didn't work. Don't worry, we've been notified.",
        },
        {
          level: 4,
          text: "Oops! Something went wrong. Don't worry, we've got your back!",
        },
        {
          level: 4,
          text: "Oops! A problem occurred, but don't worry—we're here to help!",
        },
        {
          level: 4,
          text: "Oops! Something didn't work, but we've got you covered!",
        },
        {
          level: 5,
          text: "Well, that's embarrassing! Something went wrong, but don't worry—we've got your back and our team is on it!",
        },
        {
          level: 5,
          text: "Whoops! That's on us. Something went wrong, but we're already fixing it and we've got you covered!",
        },
        {
          level: 5,
          text: "Oops-a-daisy! That didn't go as planned, but no worries—we're on it and we've got your back!",
        },
      ],
    },
    examplesBad: {
      examples: [
        {
          level: 1,
          text: "Well, that's embarrassing! Something went wrong, but don't worry—we've got your back and our team is on it!", // Too humorous for none
        },
        {
          level: 5,
          text: "An error occurred. Our team has been notified.", // Too serious for frequent humour
        },
      ],
    },
    appliesToOptions: ["ui", "marketing", "support"],
  },
  {
    key: "tone.empathy",
    category: "tone",
    controlType: "slider",
    label: "Empathy",
    description: "Empathetic language is especially useful in support and error states.",
    options: {
      min: 1,
      max: 5,
      step: 1,
      labels: ["None", "Minimal", "Neutral", "Moderate", "High"],
    },
    defaultValue: 3,
    examplesGood: {
      examples: [
        {
          level: 1,
          text: "Error: Invalid email address.",
        },
        {
          level: 1,
          text: "Error: Payment failed.",
        },
        {
          level: 1,
          text: "Error: Account not found.",
        },
        {
          level: 2,
          text: "Invalid email address.",
        },
        {
          level: 2,
          text: "Payment could not be processed.",
        },
        {
          level: 2,
          text: "Account not found.",
        },
        {
          level: 3,
          text: "Please enter a valid email address.",
        },
        {
          level: 3,
          text: "Please check your payment details and try again.",
        },
        {
          level: 3,
          text: "Please verify your account information.",
        },
        {
          level: 4,
          text: "We couldn't validate that email address. Please check and try again.",
        },
        {
          level: 4,
          text: "We couldn't process your payment. Please check your details and try again.",
        },
        {
          level: 4,
          text: "We couldn't find your account. Please verify your information and try again.",
        },
        {
          level: 5,
          text: "We understand how frustrating it can be when something doesn't work. Let's get that email address sorted together.",
        },
        {
          level: 5,
          text: "We know how frustrating payment issues can be. Let's work together to get this sorted out.",
        },
        {
          level: 5,
          text: "We understand how annoying account problems can be. We're here to help you get this resolved.",
        },
      ],
    },
    examplesBad: {
      examples: [
        {
          level: 1,
          text: "We understand how frustrating it can be when something doesn't work. Let's get that email address sorted together.", // Too empathetic for none
        },
        {
          level: 5,
          text: "Error: Invalid email address.", // Too cold for high empathy
        },
      ],
    },
    appliesToOptions: ["support"],
  },
  {
    key: "tone.boundaries.no_hype",
    category: "tone",
    controlType: "toggle",
    label: "No Hype",
    description: "Avoid exaggerated claims and marketing hype. Focus on factual, clear communication.",
    defaultValue: true,
    examplesGood: {
      examples: [
        {
          enabled: true,
          text: "This feature helps you save time.",
        },
        {
          enabled: false,
          text: "This revolutionary feature will transform your workflow!",
        },
      ],
    },
    appliesToOptions: ["ui", "marketing", "support"],
  },
  {
    key: "tone.boundaries.no_fear",
    category: "tone",
    controlType: "toggle",
    label: "No Fear",
    description: "Avoid fear-based messaging or creating anxiety. Use positive, helpful language.",
    defaultValue: true,
    examplesGood: {
      examples: [
        {
          enabled: true,
          text: "Secure your account with two-factor authentication.",
        },
        {
          enabled: false,
          text: "Your account is at risk! Enable two-factor authentication now!",
        },
      ],
    },
    appliesToOptions: ["ui", "marketing", "support"],
  },
];
