const DEFAULT_SITE_URL = 'https://brunpropiedades.ar';
const DEFAULT_OG_IMAGE = '/images/brun-logo.png';

function normalizeSiteUrl(siteUrl) {
  const raw = String(siteUrl || process.env.SITE_URL || DEFAULT_SITE_URL).trim();
  return raw.replace(/\/+$/, '');
}

function buildAbsoluteUrl(siteUrl, path) {
  const baseUrl = normalizeSiteUrl(siteUrl);
  const normalizedPath = path && path !== '/' ? `/${String(path).replace(/^\/+/, '')}` : '';
  return `${baseUrl}${normalizedPath}`;
}

function buildSeo(config) {
  const siteUrl = normalizeSiteUrl(config.siteUrl);
  const canonicalPath = config.canonicalPath || '/';
  const title = config.title || 'Brun Propiedades';
  const description = config.description || 'Brun Propiedades, inmobiliaria en Buenos Aires.';
  const imagePath = config.imagePath || DEFAULT_OG_IMAGE;

  return {
    title,
    description,
    canonical: buildAbsoluteUrl(siteUrl, canonicalPath),
    robots: config.robots || 'index,follow',
    ogType: config.ogType || 'website',
    ogImage: buildAbsoluteUrl(siteUrl, imagePath),
    twitterCard: config.twitterCard || 'summary_large_image',
    structuredData: config.structuredData || null
  };
}

module.exports = {
  DEFAULT_SITE_URL,
  buildAbsoluteUrl,
  buildSeo,
  normalizeSiteUrl
};
