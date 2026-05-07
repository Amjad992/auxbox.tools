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
      url: `${baseUrl}/wheel-spinner`,
      lastModified: new Date('2026-05-04'),
      changeFrequency: 'monthly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/markdown-preview`,
      lastModified: new Date('2026-05-04'),
      changeFrequency: 'monthly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/markdown-to-pdf`,
      lastModified: new Date('2026-05-04'),
      changeFrequency: 'monthly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/date-calculator`,
      lastModified: new Date('2026-05-04'),
      changeFrequency: 'monthly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/stopwatch`,
      lastModified: new Date('2026-05-04'),
      changeFrequency: 'monthly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/pomodoro-timer`,
      lastModified: new Date('2026-05-04'),
      changeFrequency: 'monthly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/cron-explainer`,
      lastModified: new Date('2026-05-05'),
      changeFrequency: 'monthly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/pdf-merger`,
      lastModified: new Date('2026-05-05'),
      changeFrequency: 'monthly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/image-compressor`,
      lastModified: new Date('2026-05-05'),
      changeFrequency: 'monthly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/freelance-rate-calculator`,
      lastModified: new Date('2026-05-06'),
      changeFrequency: 'monthly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/bill-tip-calculator`,
      lastModified: new Date('2026-05-07'),
      changeFrequency: 'monthly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/bill-splitter`,
      lastModified: new Date('2026-05-07'),
      changeFrequency: 'monthly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/hash-generator`,
      lastModified: new Date('2026-05-07'),
      changeFrequency: 'monthly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/uuid-generator`,
      lastModified: new Date('2026-05-07'),
      changeFrequency: 'monthly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/json-formatter`,
      lastModified: new Date('2026-05-07'),
      changeFrequency: 'monthly',
      priority: 0.9,
    },
  ];
}
