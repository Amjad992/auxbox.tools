export default function robots() {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [],
    },
    sitemap: 'https://auxbox.tools/sitemap.xml',
  };
}
