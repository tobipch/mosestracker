import type { MetadataRoute } from 'next';

/** Kein Suchmaschinen-Zutritt. Das Lager ist nicht oeffentlich. */
export default function robots(): MetadataRoute.Robots {
  return { rules: [{ userAgent: '*', disallow: '/' }] };
}
