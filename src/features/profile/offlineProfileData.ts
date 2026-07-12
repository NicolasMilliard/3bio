import aoifeAvatar from '@/assets/carousel/creators/aoifeodwyer.avif';
import aoifeCover from '@/assets/profile/offline/aoife-cover.jpeg';
import { THREE_BIO_DEFAULT_THEME } from '@/constants';
import type { Account } from '@lens-protocol/react';

import type { UseProfileData } from './UserProfile';

const aoifeThreeBioMetadata = JSON.stringify({
  profile: {
    socialLinks: [
      {
        type: 'String',
        key: 'socialLinks.github',
        value: 'https://github.com',
      },
      {
        type: 'String',
        key: 'socialLinks.instagram',
        value: 'https://instagram.com',
      },
      {
        type: 'String',
        key: 'socialLinks.twitter',
        value: 'https://x.com',
      },
    ],
    links: Array.from({ length: 15 }, (_, index) => ({
      type: 'String',
      key: `links.3bio.social.${index + 1}`,
      value: 'https://3bio.social',
    })),
  },
  theme: {
    name: THREE_BIO_DEFAULT_THEME,
    displayStatistics: true,
    displayBranding: true,
  },
});

export const offlineAccountResponses = {
  aoifeodwyer: {
    data: {
      value: {
        __typename: 'Account',
        address: '0x6BE7df3A693Dcc92EBdBf5C18191e3E429dD94d2',
        owner: '0xE588A2b38F24C72e30535885d645CEbA44480D1b',
        score: 9996,
        createdAt: '2024-02-08T16:05:41+00:00',
        username: {
          __typename: 'Username',
          id: '530787',
          value: 'lens/aoifeodwyer',
          localName: 'aoifeodwyer',
          linkedTo: '0x6BE7df3A693Dcc92EBdBf5C18191e3E429dD94d2',
          ownedBy: '0x6BE7df3A693Dcc92EBdBf5C18191e3E429dD94d2',
          timestamp: '2025-03-08T02:04:21+00:00',
          namespace: '0x1aA55B9042f08f45825dC4b651B64c9F98Af4615',
          operations: {
            __typename: 'LoggedInUsernameOperations',
            id: '0x1aA55B9042f08f45825dC4b651B64c9F98Af4615-0x47B526de8f92C5110dD892de4423732Ec2f838dB',
            canRemove: {
              __typename: 'NamespaceOperationValidationFailed',
              unsatisfiedRules: null,
              reason: 'Only owner can remove username',
            },
            canAssign: {
              __typename: 'NamespaceOperationValidationFailed',
              unsatisfiedRules: null,
              reason: 'Only owner can assign username',
            },
            canUnassign: {
              __typename: 'NamespaceOperationValidationFailed',
              unsatisfiedRules: null,
              reason: 'Only owner can unassign username',
            },
          },
        },
        metadata: {
          __typename: 'AccountMetadata',
          attributes: [
            {
              __typename: 'MetadataAttribute',
              type: 'JSON',
              key: '3bio',
              value: aoifeThreeBioMetadata,
            },
          ],
          bio: `Artist, designer & founder trying to figure out what lives in the gaps of human perception via /hyefa 🌿

I enjoy subverting expectations by combining the familiar in unfamiliar ways – often via queer and neurodivergent storytelling perspectives.

I work primarily in hand-drawn digital illustration and across an evolving body of AI referenced, assisted, created, and/or blended works.

(she/her)`,
          coverPicture:
            'https://ik.imagekit.io/lens/d6e78b480026880e49d9b957f9acf2ae2b5804f9d127baf27e55bc2d3b92efff__1OxBNSZq.jpeg',
          id: '4f6a167d-23e9-4103-a6b9-75f9749f38cb',
          name: "Aoife O'Dwyer",
          picture:
            'https://ik.imagekit.io/lens/media-snapshot/f58510e2b576d9753288e6c9f579158b30878734c64715c8c3043718e4f4f6df.webp',
        },
        operations: {
          __typename: 'LoggedInAccountOperations',
          id: '0x6BE7df3A693Dcc92EBdBf5C18191e3E429dD94d2',
          isFollowedByMe: false,
          isFollowingMe: false,
          canFollow: {
            __typename: 'AccountFollowOperationValidationPassed',
          },
          canUnfollow: {
            __typename: 'AccountFollowOperationValidationFailed',
            unsatisfiedRules: null,
            reason: 'You do not follow this account so you cannot unfollow',
          },
          isMutedByMe: false,
          isBlockedByMe: false,
          hasBlockedMe: false,
          canBlock: true,
          canUnblock: false,
          hasReported: false,
        },
        rules: {
          __typename: 'AccountFollowRules',
          required: [],
          anyOf: [],
        },
        actions: [],
      },
    },
  },
  inbio: {
    data: {
      value: {
        __typename: 'Account',
        address: '0x47B526de8f92C5110dD892de4423732Ec2f838dB',
        owner: '0x9b4bDA2B2CC67df875911E8A731A567a94526406',
        score: 0,
        createdAt: '2026-04-03T16:33:02+00:00',
        username: {
          __typename: 'Username',
          id: '923971',
          value: 'lens/inbio',
          localName: 'inbio',
          linkedTo: '0x47B526de8f92C5110dD892de4423732Ec2f838dB',
          ownedBy: '0x47B526de8f92C5110dD892de4423732Ec2f838dB',
          timestamp: '2026-04-03T16:33:02+00:00',
          namespace: '0x1aA55B9042f08f45825dC4b651B64c9F98Af4615',
          operations: {
            __typename: 'LoggedInUsernameOperations',
            id: '0x1aA55B9042f08f45825dC4b651B64c9F98Af4615-0x47B526de8f92C5110dD892de4423732Ec2f838dB',
            canRemove: {
              __typename: 'NamespaceOperationValidationPassed',
            },
            canAssign: {
              __typename: 'NamespaceOperationValidationFailed',
              unsatisfiedRules: null,
              reason: 'Already assigned',
            },
            canUnassign: {
              __typename: 'NamespaceOperationValidationPassed',
            },
          },
        },
        metadata: {
          __typename: 'AccountMetadata',
          attributes: [
            {
              __typename: 'MetadataAttribute',
              type: 'JSON',
              key: 'inBio',
              value:
                '{"profile":{"avatar":"https://api.grove.storage/a728622e8502b04c61934f50dc840018593f316abc28b22045962ffde075c11c","coverPicture":"https://api.grove.storage/39935b69368cb85fd2d77150786b3a37e4490af6651038560999460ec2775d55","name":"inBio","bio":"Hello, Lens.","socialLinks":[{"type":"String","key":"socialLinks.instagram","value":"https://instagram.com/@inbio"},{"type":"String","key":"socialLinks.github","value":"https://github.com/inbio2"}],"links":[{"type":"String","key":"links.inbio.social","value":"https://inbio.social"}]},"theme":{"name":"classic","displayStatistics":true,"displayBranding":true}}',
            },
            {
              __typename: 'MetadataAttribute',
              type: 'JSON',
              key: '3bio',
              value:
                '{"profile":{"name":"3bio","bio":"Hello, this is my bio.","socialLinks":[{"type":"String","key":"socialLinks.github","value":"https://github.com/3bio"}],"links":[{"type":"String","key":"links.3bio.social","value":"https://3bio.social"}]},"theme":{"name":"classic","displayStatistics":true,"displayBranding":true}}',
            },
          ],
          bio: null,
          coverPicture: null,
          id: '9d1b1251-113c-4417-8ce4-c44ac7301abf',
          name: null,
          picture: null,
        },
        operations: {
          __typename: 'LoggedInAccountOperations',
          id: '0x47B526de8f92C5110dD892de4423732Ec2f838dB',
          isFollowedByMe: false,
          isFollowingMe: false,
          canFollow: {
            __typename: 'AccountFollowOperationValidationFailed',
            unsatisfiedRules: null,
            reason: 'You can not unfollow or follow yourself',
          },
          canUnfollow: {
            __typename: 'AccountFollowOperationValidationFailed',
            unsatisfiedRules: null,
            reason: 'You can not unfollow or follow yourself',
          },
          isMutedByMe: false,
          isBlockedByMe: false,
          hasBlockedMe: false,
          canBlock: false,
          canUnblock: false,
          hasReported: false,
        },
        rules: {
          __typename: 'AccountFollowRules',
          required: [],
          anyOf: [],
        },
        actions: [],
      },
    },
  },
} as const;

const offlineAccountsByHandle: Record<string, Account> = {
  aoifeodwyer: {
    ...offlineAccountResponses.aoifeodwyer.data.value,
    metadata: {
      ...offlineAccountResponses.aoifeodwyer.data.value.metadata,
      picture: aoifeAvatar,
      coverPicture: aoifeCover,
    },
  } as unknown as Account,
  inbio: offlineAccountResponses.inbio.data.value as unknown as Account,
};

// These counts are local UI fixtures because account stats were not included
// in the supplied responses.
const offlineStatsByHandle = {
  aoifeodwyer: {
    graphFollowStats: { followers: 26_500, following: 457 },
    feedStats: { posts: 8_000 },
  },
  inbio: {
    graphFollowStats: { followers: 345, following: 12 },
    feedStats: { posts: 67 },
  },
} as const;

export const useOfflineProfileData: UseProfileData = (lensHandle) => {
  const normalizedHandle = lensHandle.toLowerCase();

  return {
    account: offlineAccountsByHandle[normalizedHandle] ?? null,
    stats:
      offlineStatsByHandle[
        normalizedHandle as keyof typeof offlineStatsByHandle
      ],
    loading: false,
    error: undefined,
  };
};
