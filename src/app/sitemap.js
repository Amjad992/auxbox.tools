export default function sitemap() {
  const baseUrl = 'https://auxbox.tools';

  return [
    {
      url: `${baseUrl}/cgpa-calculator`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 1,
    },
  ];
}
