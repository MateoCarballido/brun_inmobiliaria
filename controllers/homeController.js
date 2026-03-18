const db = require('../database/models');
const { buildAbsoluteUrl, buildSeo } = require('../lib/seo');

async function getFeaturedProperties() {
  try {
    const featuredProperties = await db.Property.findAll({
      where: {
        destacada: true,
        deletedAt: null
      },
      include: [
        { association: 'user' },
        { association: 'images' }
      ],
      order: [['id', 'DESC']]
    });

    if (featuredProperties.length > 0) {
      return featuredProperties;
    }
  } catch (error) {
    console.error('Error loading featured properties from DB:', error.message);
  }

  return [];
}

async function renderHome(req, res) {
  const featuredProperties = await getFeaturedProperties();
  const siteUrl = res.locals.siteUrl;

  res.render('home', {
    title: 'Brun Propiedades | Inmobiliaria en Buenos Aires',
    featuredProperties,
    pageClass: 'landing-page',
    seo: buildSeo({
      siteUrl,
      canonicalPath: '/',
      title: 'Brun Propiedades | Inmobiliaria en Buenos Aires',
      description: 'Brun Propiedades es una inmobiliaria en Buenos Aires con propiedades en venta y alquiler y atencion personalizada para cada operacion.',
      structuredData: {
        '@context': 'https://schema.org',
        '@type': 'RealEstateAgent',
        name: 'Brun Propiedades',
        url: buildAbsoluteUrl(siteUrl, '/'),
        image: buildAbsoluteUrl(siteUrl, '/images/brun-logo.png'),
        telephone: '+54 9 11 5839 9513',
        email: 'propiedadesbrun@gmail.com',
        areaServed: 'Buenos Aires, Argentina'
      }
    })
  });
}

function renderAbout(req, res) {
  res.render('about', {
    title: 'Sobre Brun Propiedades',
    pageClass: '',
    seo: buildSeo({
      siteUrl: res.locals.siteUrl,
      canonicalPath: '/nosotros',
      title: 'Sobre Brun Propiedades | Inmobiliaria en Buenos Aires',
      description: 'Conoce a Brun Propiedades, nuestra trayectoria y el enfoque de trabajo con el que acompanamos operaciones inmobiliarias en Buenos Aires.'
    })
  });
}

function renderContact(req, res) {
  const authNotice = req.query.required === 'consulta'
    ? 'Para enviar una consulta tenes que crear una cuenta o iniciar sesion.'
    : null;

  res.render('contact', {
    title: 'Contacto',
    pageClass: '',
    successMessage: null,
    authNotice,
    seo: buildSeo({
      siteUrl: res.locals.siteUrl,
      canonicalPath: '/contacto',
      title: 'Contacto | Brun Propiedades',
      description: 'Contactate con Brun Propiedades para consultas sobre compra, venta, alquiler y tasaciones en Buenos Aires.'
    })
  });
}

function renderTerms(req, res) {
  res.render('terms', {
    title: 'Terminos y Condiciones',
    pageClass: '',
    seo: buildSeo({
      siteUrl: res.locals.siteUrl,
      canonicalPath: '/terminos-y-condiciones',
      title: 'Terminos y Condiciones | Brun Propiedades',
      description: 'Terminos y condiciones de uso del sitio web de Brun Propiedades.'
    })
  });
}

function renderPrivacy(req, res) {
  res.render('privacy', {
    title: 'Politica de Privacidad',
    pageClass: '',
    seo: buildSeo({
      siteUrl: res.locals.siteUrl,
      canonicalPath: '/politica-de-privacidad',
      title: 'Politica de Privacidad | Brun Propiedades',
      description: 'Politica de privacidad y tratamiento de datos personales de Brun Propiedades.'
    })
  });
}

function renderCookies(req, res) {
  res.render('cookies', {
    title: 'Politica de Cookies',
    pageClass: '',
    seo: buildSeo({
      siteUrl: res.locals.siteUrl,
      canonicalPath: '/politica-de-cookies',
      title: 'Politica de Cookies | Brun Propiedades',
      description: 'Informacion sobre el uso de cookies en el sitio web de Brun Propiedades.'
    })
  });
}

async function submitContact(req, res) {
  const { nombre, email, telefono, asunto, mensaje } = req.body;

  try {
    await db.Consultation.create({
      id_propiedad: null,
      origen: 'contacto',
      nombre: nombre || null,
      email: email || null,
      telefono: telefono || null,
      asunto: asunto || null,
      mensaje: mensaje || null
    });
  } catch (error) {
    console.error('Error saving contact consultation:', error.message);
  }

  return res.render('contact', {
    title: 'Contacto',
    pageClass: '',
    successMessage: 'Gracias por tu mensaje. Te responderemos a la brevedad.',
    authNotice: null,
    seo: buildSeo({
      siteUrl: res.locals.siteUrl,
      canonicalPath: '/contacto',
      title: 'Contacto | Brun Propiedades',
      description: 'Contactate con Brun Propiedades para consultas sobre compra, venta, alquiler y tasaciones en Buenos Aires.'
    })
  });
}

async function renderSitemap(req, res) {
  const siteUrl = res.locals.siteUrl;
  const staticPages = [
    { path: '/', priority: '1.0', changefreq: 'daily' },
    { path: '/propiedades', priority: '0.9', changefreq: 'daily' },
    { path: '/nosotros', priority: '0.7', changefreq: 'monthly' },
    { path: '/contacto', priority: '0.8', changefreq: 'monthly' },
    { path: '/terminos-y-condiciones', priority: '0.3', changefreq: 'yearly' },
    { path: '/politica-de-privacidad', priority: '0.3', changefreq: 'yearly' },
    { path: '/politica-de-cookies', priority: '0.3', changefreq: 'yearly' }
  ];

  let properties = [];
  try {
    properties = await db.Property.findAll({
      where: {
        deletedAt: null
      },
      attributes: ['id', 'updatedAt'],
      order: [['updatedAt', 'DESC']]
    });
  } catch (error) {
    console.error('Error loading properties for sitemap:', error.message);
  }

  const urls = staticPages.concat(
    properties.map(function(property) {
      return {
        path: `/propiedades/${property.id}`,
        priority: '0.8',
        changefreq: 'weekly',
        lastmod: property.updatedAt
      };
    })
  );

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'
  ].concat(
    urls.map(function(entry) {
      const lines = [
        '  <url>',
        `    <loc>${buildAbsoluteUrl(siteUrl, entry.path)}</loc>`
      ];

      if (entry.lastmod) {
        lines.push(`    <lastmod>${new Date(entry.lastmod).toISOString()}</lastmod>`);
      }

      lines.push(`    <changefreq>${entry.changefreq}</changefreq>`);
      lines.push(`    <priority>${entry.priority}</priority>`);
      lines.push('  </url>');
      return lines.join('\n');
    })
  ).concat('</urlset>').join('\n');

  res.type('application/xml');
  return res.send(xml);
}

function renderRobots(req, res) {
  const robotsTxt = [
    'User-agent: *',
    'Allow: /',
    '',
    `Sitemap: ${buildAbsoluteUrl(res.locals.siteUrl, '/sitemap.xml')}`
  ].join('\n');

  res.type('text/plain');
  return res.send(robotsTxt);
}

module.exports = {
  renderHome,
  renderAbout,
  renderContact,
  renderTerms,
  renderPrivacy,
  renderCookies,
  submitContact,
  renderSitemap,
  renderRobots
};
