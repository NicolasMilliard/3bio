import type { ComponentType, SVGProps } from 'react';

import { isSocialProfileUrl } from '@/helpers/isSocialProfileUrl';
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

export type PlatformName =
  | 'bluesky'
  | 'discord'
  | 'facebook'
  | 'farcaster'
  | 'instagram'
  | 'github'
  | 'mastodon'
  | 'tiktok'
  | 'threads'
  | 'twitch'
  | 'twitter'
  | 'youtube';

type PlatformLabel =
  | 'Bluesky'
  | 'Discord'
  | 'Facebook'
  | 'Farcaster'
  | 'Instagram'
  | 'GitHub'
  | 'Mastodon'
  | 'TikTok'
  | 'Threads'
  | 'Twitch'
  | 'Twitter / X'
  | 'YouTube';

export type SocialPlatform = {
  value: PlatformName;
  label: PlatformLabel;
  Icon: ComponentType<SVGProps<SVGSVGElement>>;
  placeholder: string;
  validateUrl: (url: string) => boolean;
};

export const POPULAR_SOCIAL_PLATFORMS: SocialPlatform[] = [
  {
    value: 'instagram',
    label: 'Instagram',
    Icon: InstagramIcon,
    placeholder: 'https://instagram.com/yourhandle',
    validateUrl: (url: string) =>
      isSocialProfileUrl(url, { hostnames: ['instagram.com'] }),
  },
  {
    value: 'tiktok',
    label: 'TikTok',
    Icon: TikTokIcon,
    placeholder: 'https://tiktok.com/@yourhandle',
    validateUrl: (url: string) =>
      isSocialProfileUrl(url, {
        hostnames: ['tiktok.com'],
        pathPrefixes: ['/@'],
      }),
  },
  {
    value: 'twitter',
    label: 'Twitter / X',
    Icon: TwitterIcon,
    placeholder: 'https://x.com/yourhandle',
    validateUrl: (url: string) =>
      isSocialProfileUrl(url, { hostnames: ['x.com', 'twitter.com'] }),
  },
  {
    value: 'facebook',
    label: 'Facebook',
    Icon: FacebookIcon,
    placeholder: 'https://facebook.com/yourpage',
    validateUrl: (url: string) =>
      isSocialProfileUrl(url, {
        hostnames: ['facebook.com', 'm.facebook.com'],
      }),
  },
];

export const SOCIAL_PLATFORMS: SocialPlatform[] = [
  {
    value: 'bluesky',
    label: 'Bluesky',
    Icon: BlueskyIcon,
    placeholder: 'https://bsky.app/profile/yourhandle',
    validateUrl: (url: string) =>
      isSocialProfileUrl(url, {
        hostnames: ['bsky.app'],
        pathPrefixes: ['/profile/'],
      }),
  },
  {
    value: 'discord',
    label: 'Discord',
    Icon: DiscordIcon,
    placeholder: 'https://discord.gg/yourserver',
    validateUrl: (url: string) =>
      isSocialProfileUrl(url, {
        hostnames: ['discord.gg', 'discord.com'],
      }),
  },
  {
    value: 'farcaster',
    label: 'Farcaster',
    Icon: FarcasterIcon,
    placeholder: 'https://farcaster.xyz/yourhandle',
    validateUrl: (url: string) =>
      isSocialProfileUrl(url, { hostnames: ['farcaster.xyz'] }),
  },
  {
    value: 'github',
    label: 'GitHub',
    Icon: GithubIcon,
    placeholder: 'https://github.com/yourhandle',
    validateUrl: (url: string) =>
      isSocialProfileUrl(url, { hostnames: ['github.com'] }),
  },
  {
    value: 'mastodon',
    label: 'Mastodon',
    Icon: MastodonIcon,
    placeholder: 'https://mastodon.social/@yourhandle',
    validateUrl: (url: string) =>
      isSocialProfileUrl(url, { pathPrefixes: ['/@', '/users/'] }),
  },
  {
    value: 'threads',
    label: 'Threads',
    Icon: ThreadsIcon,
    placeholder: 'https://threads.net/@yourhandle',
    validateUrl: (url: string) =>
      isSocialProfileUrl(url, {
        hostnames: ['threads.net'],
        pathPrefixes: ['/@'],
      }),
  },
  {
    value: 'twitch',
    label: 'Twitch',
    Icon: TwitchIcon,
    placeholder: 'https://twitch.tv/yourhandle',
    validateUrl: (url: string) =>
      isSocialProfileUrl(url, { hostnames: ['twitch.tv'] }),
  },
  {
    value: 'youtube',
    label: 'YouTube',
    Icon: YouTubeIcon,
    placeholder: 'https://youtube.com/@yourchannel',
    validateUrl: (url: string) =>
      isSocialProfileUrl(url, {
        hostnames: ['youtube.com'],
        pathPrefixes: ['/@', '/channel/', '/c/', '/user/'],
      }),
  },
];

export const ALL_SOCIAL_PLATFORMS = [
  ...POPULAR_SOCIAL_PLATFORMS,
  ...SOCIAL_PLATFORMS,
] as const;

export const SOCIAL_MAP = Object.fromEntries(
  ALL_SOCIAL_PLATFORMS.map((item) => [item.value, item]),
) as Record<PlatformName, SocialPlatform>;

// How many pill badges to show before collapsing into "+ N more"
export const MAX_VISIBLE_BADGES = 2;
