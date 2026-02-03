// Channel configuration utilities

export interface Channel {
  id: string;
  name: string;
  charLimit?: number;
  strictLimit?: boolean;
  description?: string;
}

// Channel definitions from brief
export const CHANNELS: Channel[] = [
  { id: "x_post", name: "X post (Tweet)", charLimit: 280, strictLimit: true, description: "280 character limit" },
  { id: "bluesky_post", name: "Bluesky post", charLimit: 300, strictLimit: true, description: "300 character limit" },
  { id: "linkedin_post", name: "LinkedIn post", charLimit: 3000, strictLimit: false, description: "3,000 character limit" },
  { id: "instagram_caption", name: "Instagram caption", charLimit: 2200, strictLimit: false, description: "2,200 character limit" },
  { id: "threads_post", name: "Threads post", charLimit: 500, strictLimit: true, description: "500 character limit" },
  { id: "sms", name: "SMS", charLimit: 160, strictLimit: true, description: "160 characters (single segment)" },
  { id: "push_notification", name: "Push notification", charLimit: 120, strictLimit: false, description: "Title 30, body 90 characters" },
  { id: "email_subject", name: "Email subject line", charLimit: 60, strictLimit: false, description: "45-60 characters recommended" },
  { id: "hero_headline", name: "Hero headline", charLimit: 70, strictLimit: false, description: "40-70 characters" },
  { id: "cta_button", name: "CTA button label", charLimit: 18, strictLimit: false, description: "12-18 characters" },
  { id: "error_message", name: "Error message", charLimit: 120, strictLimit: false, description: "60-120 characters" },
  { id: "print_ad_half", name: "Print ad (half page)", charLimit: undefined, strictLimit: false, description: "80-180 words" },
  { id: "web_banner", name: "Web banner", charLimit: 120, strictLimit: false, description: "Headline 25-40, subcopy 40-80 characters" },
  { id: "press_release", name: "Press release", charLimit: undefined, strictLimit: false, description: "400-700 words recommended" },
  { id: "website", name: "Website", charLimit: undefined, strictLimit: false, description: "General website content" },
  { id: "ui", name: "Product UI", charLimit: undefined, strictLimit: false, description: "User interface copy" },
  { id: "support", name: "Support", charLimit: undefined, strictLimit: false, description: "Support documentation" },
  { id: "marketing", name: "Marketing", charLimit: undefined, strictLimit: false, description: "Marketing content" },
];

export function getChannel(channelId: string): Channel | null {
  return CHANNELS.find((ch) => ch.id === channelId) || null;
}

export function getAllChannels(): Channel[] {
  return CHANNELS;
}

export function getDefaultCharLimit(channelId?: string): number | undefined {
  const channel = channelId ? getChannel(channelId) : null;
  return channel?.charLimit;
}

export function isStrictLimit(channelId?: string): boolean {
  const channel = channelId ? getChannel(channelId) : null;
  return channel?.strictLimit ?? false;
}



