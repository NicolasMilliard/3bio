export const THREE_BIO_THEME_NAMES = [
  'classic',
  'midnight',
  'seaside',
] as const;

export type ThreeBioThemeName = (typeof THREE_BIO_THEME_NAMES)[number];

export const THREE_BIO_DEFAULT_THEME: ThreeBioThemeName = 'classic';
