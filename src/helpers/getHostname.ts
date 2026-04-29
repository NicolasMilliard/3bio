export const getHostname = (href?: string) => {
  if (!href) return null;

  try {
    return new URL(href).hostname;
  } catch {
    return null;
  }
};
