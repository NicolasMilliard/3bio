import { MetadataAttributeType } from '@lens-protocol/metadata';

import type { MetadataFormValues } from '@/features/editor/schemas/metadataForm.schema';
import { getHostname } from '@/helpers/getHostname';

export const toSocialLinkAttributes = (
  socialLinks: MetadataFormValues['socialLinks'],
) =>
  (socialLinks ?? [])
    .filter((link): link is { platform: string; url: string } =>
      Boolean(link.url?.trim()),
    )
    .map((link) => ({
      type: MetadataAttributeType.STRING,
      key: `socialLinks.${link.platform}`,
      value: link.url.trim(),
    }));

export const toLinkAttributes = (links: MetadataFormValues['links']) =>
  (links ?? []).map((link, index) => {
    const value = link.trim();
    const hostname = getHostname(value) ?? 'unknown';

    return {
      type: MetadataAttributeType.STRING,
      key: `links.${hostname}.${index}`,
      value,
    };
  });
