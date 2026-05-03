export default function sitemap() {
  const baseUrl = 'https://auxbox.tools';

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: `${baseUrl}/cgpa-calculator`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 1,
    },
    {
      url: `${baseUrl}/qr-code-generator`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/salary-raise-calculator`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/password-generator`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/image-compressor`,
      // MIN-8: hardcoded publication date; new Date() would signal perpetual
      // freshness to crawlers and waste crawl budget on every deploy.
      lastModified: new Date('2026-05-04'),
      changeFrequency: 'monthly',
      priority: 0.9,
    },
  ];
}
