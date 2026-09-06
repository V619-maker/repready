export default function robots() {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/deck', '/coach', '/my-stats', '/dashboard', '/sign-in', '/simulate', '/demo'],
    },
    sitemap: 'https://repready.site/sitemap.xml',
  }
}
