import { httpUrlSchema } from '@/schemas/httpUrl.schema';

type SocialProfileUrlOptions = {
  hostnames?: readonly string[];
  pathPrefixes?: readonly string[];
};

const normalizeHostname = (hostname: string) =>
  hostname.toLowerCase().replace(/^www\./, '');

export const isSocialProfileUrl = (
  value: string,
  { hostnames, pathPrefixes }: SocialProfileUrlOptions = {},
) => {
  const result = httpUrlSchema.safeParse(value);

  if (!result.success) return false;

  const url = new URL(result.data);

  if (url.protocol !== 'https:' || url.username || url.password) return false;

  const hostname = normalizeHostname(url.hostname);
  const allowedHostnames = hostnames?.map(normalizeHostname);

  if (allowedHostnames && !allowedHostnames.includes(hostname)) return false;

  const pathname = url.pathname.replace(/\/+$/, '');

  if (!pathname || pathname === '/') return false;

  if (!pathPrefixes?.length) return true;

  return pathPrefixes.some((prefix) => {
    if (!pathname.startsWith(prefix)) return false;

    return pathname.slice(prefix.length).replace(/^\/+/, '').length > 0;
  });
};
