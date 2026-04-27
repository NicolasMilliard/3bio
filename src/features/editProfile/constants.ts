import type { ComponentType } from 'react';

import {
  BlueskyIcon,
  DiscordIcon,
  FacebookIcon,
  FarcasterIcon,
  GithubIcon,
  InstagramIcon,
  MastodonIcon,
  ThreadsIcon,
  TikTokIcon,
  TwitchIcon,
  TwitterIcon,
  YouTubeIcon,
} from '@/components/icons';

export type SocialValue =
  | 'discord'
  | 'farcaster'
  | 'instagram'
  | 'twitter'
  | 'threads'
  | 'twitch'
  | 'youtube'
  | 'bluesky'
  | 'github'
  | 'facebook'
  | 'mastodon'
  | 'tiktok';

export type SocialPlatform = {
  value: SocialValue;
  label: string;
  Icon: ComponentType<{ className?: string }>;
  placeholder: string;
  validateUrl: (url: string) => boolean;
};

export const POPULAR_SOCIAL_PLATFORMS: SocialPlatform[] = [
  {
    value: 'instagram',
    label: 'Instagram',
    Icon: InstagramIcon,
    placeholder: 'https://instagram.com/yourhandle',
    validateUrl: (url: string) => url.startsWith('https://instagram.com/'),
  },
  {
    value: 'tiktok',
    label: 'TikTok',
    Icon: TikTokIcon,
    placeholder: 'https://tiktok.com/@yourhandle',
    validateUrl: (url: string) => url.startsWith('https://tiktok.com/'),
  },
  {
    value: 'twitter',
    label: 'Twitter / X',
    Icon: TwitterIcon,
    placeholder: 'https://x.com/yourhandle',
    validateUrl: (url: string) =>
      url.startsWith('https://x.com/') ||
      url.startsWith('https://twitter.com/'),
  },
  {
    value: 'facebook',
    label: 'Facebook',
    Icon: FacebookIcon,
    placeholder: 'https://facebook.com/yourpage',
    validateUrl: (url: string) => url.startsWith('https://facebook.com/'),
  },
];

export const SOCIAL_PLATFORMS: SocialPlatform[] = [
  {
    value: 'bluesky',
    label: 'Bluesky',
    Icon: BlueskyIcon,
    placeholder: 'https://bsky.app/profile/yourhandle',
    validateUrl: (url: string) => url.startsWith('https://bsky.app/profile/'),
  },
  {
    value: 'discord',
    label: 'Discord',
    Icon: DiscordIcon,
    placeholder: 'https://discord.gg/yourserver',
    validateUrl: (url: string) =>
      url.startsWith('https://discord.gg/') ||
      url.startsWith('https://discord.com/'),
  },
  {
    value: 'farcaster',
    label: 'Farcaster',
    Icon: FarcasterIcon,
    placeholder: 'https://farcaster.xyz/yourhandle',
    validateUrl: (url: string) => url.startsWith('https://farcaster.xyz/'),
  },
  {
    value: 'github',
    label: 'GitHub',
    Icon: GithubIcon,
    placeholder: 'https://github.com/yourhandle',
    validateUrl: (url: string) => url.startsWith('https://github.com/'),
  },
  {
    value: 'mastodon',
    label: 'Mastodon',
    Icon: MastodonIcon,
    placeholder: 'https://mastodon.social/@yourhandle',
    validateUrl: (url: string) => url.startsWith('https://mastodon.social/@'),
  },
  {
    value: 'threads',
    label: 'Threads',
    Icon: ThreadsIcon,
    placeholder: 'https://threads.net/@yourhandle',
    validateUrl: (url: string) => url.startsWith('https://threads.net/@'),
  },
  {
    value: 'twitch',
    label: 'Twitch',
    Icon: TwitchIcon,
    placeholder: 'https://twitch.tv/yourhandle',
    validateUrl: (url: string) => url.startsWith('https://twitch.tv/'),
  },
  {
    value: 'youtube',
    label: 'YouTube',
    Icon: YouTubeIcon,
    placeholder: 'https://youtube.com/@yourchannel',
    validateUrl: (url: string) => url.startsWith('https://youtube.com/@'),
  },
];

export const ALL_SOCIAL_PLATFORMS = [
  ...POPULAR_SOCIAL_PLATFORMS,
  ...SOCIAL_PLATFORMS,
] as const;

export const SOCIAL_MAP = Object.fromEntries(
  ALL_SOCIAL_PLATFORMS.map((item) => [item.value, item]),
) as Record<SocialValue, SocialPlatform>;

// How many pill badges to show before collapsing into "+ N more"
export const MAX_VISIBLE_BADGES = 2;
