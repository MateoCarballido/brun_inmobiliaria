const db = require('../database/models');
const op = db.Sequelize.Op;
const { buildAbsoluteUrl, buildSeo } = require('../lib/seo');
const { MAX_EXTRA_IMAGES } = require('../middlewares/propertyUploadMiddleware');

function normalizeCurrency(value) {
  return value === 'ARS' ? 'ARS' : 'USD';
}

function normalizeImageReference(value) {
  if (!value) {
    return null;
  }

  const trimmed = String(value).trim();
  if (!trimmed) {
    return null;
  }

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  const withoutQuery = trimmed.split('?')[0].split('#')[0];
  const parts = withoutQuery.split('/').filter(Boolean);
  return parts.length > 0 ? parts[parts.length - 1] : null;
}

function extractUploadedImageReference(file) {
  if (!file) {
    return null;
  }

  return normalizeImageReference(file.path || file.filename || file.originalname);
}

function buildImageRows(propertyId, normalizedMainImage, rawExtraImages, uploadedExtraImageRefs) {
  const seen = new Set();
  const imageRows = [];
  const addRow = function(url, orden) {
    if (!url || seen.has(url)) {
      return;
    }
    seen.add(url);
    imageRows.push({
      id_propiedad: propertyId,
      url,
      orden
    });
  };

  if (normalizedMainImage) {
    addRow(normalizedMainImage, 0);
  }

  const manualExtraUrls = rawExtraImages
    ? rawExtraImages
      .split('\n')
      .map((line) => normalizeImageReference(line))
      .filter(Boolean)
    : [];

  const allExtraUrls = [
    ...manualExtraUrls,
    ...(uploadedExtraImageRefs || [])
  ];

  allExtraUrls.forEach((url, index) => {
    addRow(url, index + 1);
  });

  return imageRows;
}

async function getAdminProperties() {
  try {
    return await db.Property.findAll({
      where: {
        deletedAt: null
      },
      include: [
        { association: 'user' }
      ],
      order: [['id', 'DESC']]
    });
  } catch (error) {
    console.error('Error loading admin properties:', error.message);
    return [];
  }
}

async function findPropertyForAdmin(id) {
  return db.Property.findOne({
    where: {
      id: Number(id),
      deletedAt: null
    },
    include: [
      {
        association: 'images',
        where: { deletedAt: null },
        required: false
      }
    ]
  });
}

function buildEditFormData(property) {
  const extraImages = (property.images || [])
    .filter((image) => Number(image.orden || 0) > 0)
    .sort((a, b) => Number(a.orden || 0) - Number(b.orden || 0))
    .map((image) => image.url);

  return {
    titulo: property.titulo || '',
    descripcion: property.descripcion || '',
    operacion: property.operacion || 'venta',
    tipo: property.tipo || 'casa',
    precio: property.precio || '',
    moneda: normalizeCurrency(property.moneda),
    ubicacion: property.ubicacion || '',
    direccion: property.direccion || '',
    imagen_principal: property.imagen_principal || '',
    imagenes_extra: extraImages.join('\n'),
    dormitorios: property.dormitorios || '',
    banios: property.banios || '',
    plantas: property.plantas || '',
    piso: property.piso || '',
    superficie_cubierta_m2: property.superficie_cubierta_m2 || '',
    superficie_total_m2: property.superficie_total_m2 || '',
    superficie_m2: property.superficie_m2 || '',
    destacada: Boolean(property.destacada)
  };
}

async function getAllProperties(filters) {
  const whereClause = {
    deletedAt: null
  };

  if (filters.search) {
    whereClause[op.or] = [
      { titulo: { [op.like]: `%${filters.search}%` } },
      { ubicacion: { [op.like]: `%${filters.search}%` } },
      { direccion: { [op.like]: `%${filters.search}%` } }
    ];
  }

  if (filters.operacion) {
    whereClause.operacion = filters.operacion;
  }

  if (filters.tipo) {
    whereClause.tipo = filters.tipo;
  }

  if (filters.moneda) {
    whereClause.moneda = normalizeCurrency(filters.moneda);
  }

  if (filters.ubicacion) {
    whereClause.ubicacion = { [op.like]: `%${filters.ubicacion}%` };
  }

  if (filters.precioMin || filters.precioMax) {
    whereClause.precio = {};
    if (filters.precioMin) {
      whereClause.precio[op.gte] = Number(filters.precioMin);
    }
    if (filters.precioMax) {
      whereClause.precio[op.lte] = Number(filters.precioMax);
    }
  }

  if (filters.dormitorios) {
    whereClause.dormitorios = { [op.gte]: Number(filters.dormitorios) };
  }

  if (filters.banios) {
    whereClause.banios = { [op.gte]: Number(filters.banios) };
  }

  try {
    const properties = await db.Property.findAll({
      where: whereClause,
      include: [
        { association: 'user' },
        { association: 'images' }
      ],
      order: [['id', 'DESC']]
    });

    if (properties.length > 0) {
      return properties;
    }
  } catch (error) {
    console.error('Error loading properties from DB:', error.message);
  }

  return [];
}

async function findPropertyById(id) {
  try {
    const property = await db.Property.findOne({
      where: {
        id: Number(id),
        deletedAt: null
      },
      include: [
        { association: 'user' },
        { association: 'images' }
      ]
    });

    if (property) {
      return property;
    }
  } catch (error) {
    console.error('Error loading property detail from DB:', error.message);
  }

  return null;
}

async function renderProperties(req, res) {
  const filters = {
    search: req.query.search ? req.query.search.trim() : '',
    operacion: req.query.operacion ? req.query.operacion.trim() : '',
    tipo: req.query.tipo ? req.query.tipo.trim() : '',
    moneda: req.query.moneda ? normalizeCurrency(req.query.moneda.trim()) : '',
    ubicacion: req.query.ubicacion ? req.query.ubicacion.trim() : '',
    precioMin: req.query.precioMin ? req.query.precioMin.trim() : '',
    precioMax: req.query.precioMax ? req.query.precioMax.trim() : '',
    dormitorios: req.query.dormitorios ? req.query.dormitorios.trim() : '',
    banios: req.query.banios ? req.query.banios.trim() : ''
  };

  const properties = await getAllProperties(filters);

  res.render('properties/index', {
    title: 'Propiedades en venta y alquiler | Brun Propiedades',
    properties,
    filtros: filters,
    seo: buildSeo({
      siteUrl: res.locals.siteUrl,
      canonicalPath: '/propiedades',
      title: 'Propiedades en venta y alquiler | Brun Propiedades',
      description: 'Explora propiedades en venta y alquiler publicadas por Brun Propiedades en Buenos Aires.',
      structuredData: {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: 'Propiedades de Brun Propiedades',
        url: buildAbsoluteUrl(res.locals.siteUrl, '/propiedades')
      }
    })
  });
}

async function renderPropertyDetail(req, res, next) {
  const property = await findPropertyById(req.params.id);

  if (!property) {
    return next();
  }

  const authNotice = req.query.required === 'consulta'
    ? 'Para enviar una consulta sobre esta propiedad tenes que crear una cuenta o iniciar sesion.'
    : null;

  return res.render('properties/show', {
    title: property.titulo,
    property,
    successMessage: null,
    mailtoLink: null,
    authNotice,
    shareUrl: buildAbsoluteUrl(res.locals.siteUrl, `/propiedades/${property.id}`),
    seo: buildSeo({
      siteUrl: res.locals.siteUrl,
      canonicalPath: `/propiedades/${property.id}`,
      title: `${property.titulo} | Brun Propiedades`,
      description: property.descripcion
        ? String(property.descripcion).replace(/\s+/g, ' ').trim().slice(0, 155)
        : `${property.titulo} en ${property.ubicacion || 'Buenos Aires'} publicada por Brun Propiedades.`,
      ogType: 'article',
      structuredData: {
        '@context': 'https://schema.org',
        '@type': 'Residence',
        name: property.titulo,
        description: property.descripcion || undefined,
        url: buildAbsoluteUrl(res.locals.siteUrl, `/propiedades/${property.id}`),
        address: {
          '@type': 'PostalAddress',
          addressLocality: property.ubicacion || 'Buenos Aires',
          streetAddress: property.direccion || undefined,
          addressCountry: 'AR'
        },
        floorSize: property.superficie_total_m2 || property.superficie_m2
          ? {
            '@type': 'QuantitativeValue',
            value: Number(property.superficie_total_m2 || property.superficie_m2),
            unitCode: 'MTK'
          }
          : undefined,
        numberOfRooms: property.dormitorios || undefined
      }
    })
  });
}

async function handleInterestEmail(req, res, next) {
  const property = await findPropertyById(req.params.id);

  if (!property) {
    return next();
  }

  const { nombre, email, telefono, mensaje } = req.body;
  const recipient = 'propiedadesbrun@gmail.com';
  const subject = `Consulta por ${property.titulo}`;
  const bodyLines = [
    `Hola, me interesa la propiedad: ${property.titulo}.`,
    '',
    `Nombre: ${nombre || 'No especificado'}`,
    `Email: ${email || 'No especificado'}`,
    `Telefono: ${telefono || 'No especificado'}`,
    '',
    'Mensaje:',
    mensaje || 'Sin mensaje adicional.'
  ];

  const mailtoLink = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(recipient)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(bodyLines.join('\n'))}`;

  try {
    await db.Consultation.create({
      id_propiedad: Number(property.id),
      origen: 'propiedad',
      nombre: nombre || null,
      email: email || null,
      telefono: telefono || null,
      asunto: subject,
      mensaje: mensaje || null
    });
  } catch (error) {
    console.error('Error saving property consultation:', error.message);
  }

  return res.render('properties/show', {
    title: property.titulo,
    property,
    successMessage: 'Tu consulta esta lista. Hace click en "Abrir cliente de mail" para enviarla.',
    mailtoLink,
    authNotice: null,
    shareUrl: buildAbsoluteUrl(res.locals.siteUrl, `/propiedades/${property.id}`),
    seo: buildSeo({
      siteUrl: res.locals.siteUrl,
      canonicalPath: `/propiedades/${property.id}`,
      title: `${property.titulo} | Brun Propiedades`,
      description: property.descripcion
        ? String(property.descripcion).replace(/\s+/g, ' ').trim().slice(0, 155)
        : `${property.titulo} en ${property.ubicacion || 'Buenos Aires'} publicada por Brun Propiedades.`,
      ogType: 'article'
    })
  });
}

async function renderCreateProperty(req, res) {
  const adminProperties = await getAdminProperties();
  const adminMessageMap = {
    created: 'Propiedad creada correctamente.',
    updated: 'Propiedad actualizada correctamente.',
    deleted: 'Propiedad eliminada correctamente.'
  };

  return res.render('properties/create', {
    title: 'Publicar propiedad',
    errorMessage: null,
    adminMessage: adminMessageMap[req.query.status] || null,
    formData: {},
    adminProperties
  });
}

async function createProperty(req, res) {
  const {
    titulo,
    descripcion,
    operacion,
    tipo,
    precio,
    moneda,
    ubicacion,
    direccion,
    imagen_principal,
    imagenes_extra,
    dormitorios,
    banios,
    plantas,
    piso,
    superficie_cubierta_m2,
    superficie_total_m2,
    superficie_m2
  } = req.body;

  if (!titulo || !operacion || !tipo || !precio || !ubicacion) {
    const adminProperties = await getAdminProperties();
    return res.status(400).render('properties/create', {
      title: 'Publicar propiedad',
      errorMessage: 'Completa titulo, operacion, tipo, precio y ubicacion.',
      adminMessage: null,
      formData: req.body,
      adminProperties
    });
  }

  try {
    const uploadedMainImage = req.files && req.files.imagen_principal_file
      ? req.files.imagen_principal_file[0]
      : null;
    const uploadedMainImageRef = extractUploadedImageReference(uploadedMainImage);
    const normalizedMainImage = uploadedMainImageRef || normalizeImageReference(imagen_principal);
    const uploadedExtraImageRefs = req.files && req.files.imagenes_extra_files
      ? req.files.imagenes_extra_files.map(extractUploadedImageReference).filter(Boolean)
      : [];
    const pisoValue = tipo === 'departamento' ? (piso || null) : null;
    const plantasValue = tipo === 'casa' ? (plantas || null) : null;

    const createdProperty = await db.Property.create({
      id_usuario: req.currentUser.id,
      titulo,
      descripcion: descripcion || null,
      operacion,
      tipo,
      precio,
      moneda: normalizeCurrency(moneda),
      ubicacion,
      direccion: direccion || null,
      imagen_principal: normalizedMainImage,
      dormitorios: dormitorios || null,
      banios: banios || null,
      plantas: plantasValue,
      piso: pisoValue,
      superficie_cubierta_m2: superficie_cubierta_m2 || null,
      superficie_total_m2: superficie_total_m2 || null,
      superficie_m2: superficie_m2 || null,
      destacada: req.body.destacada === 'on'
    });

    const imageRows = buildImageRows(createdProperty.id, normalizedMainImage, imagenes_extra, uploadedExtraImageRefs);

    if (imageRows.length > 0) {
      await db.PropertyImage.bulkCreate(imageRows);
    }

    return res.redirect('/propiedades/add?status=created');
  } catch (error) {
    const adminProperties = await getAdminProperties();
    return res.status(500).render('properties/create', {
      title: 'Publicar propiedad',
      errorMessage: 'No se pudo guardar la propiedad.',
      adminMessage: null,
      formData: req.body,
      adminProperties
    });
  }
}

async function renderEditProperty(req, res, next) {
  const property = await findPropertyForAdmin(req.params.id);

  if (!property) {
    return next();
  }

  return res.render('properties/edit', {
    title: `Editar: ${property.titulo}`,
    errorMessage: null,
    propertyId: property.id,
    formData: buildEditFormData(property)
  });
}

async function updateProperty(req, res, next) {
  const property = await findPropertyForAdmin(req.params.id);

  if (!property) {
    return next();
  }

  const {
    titulo,
    descripcion,
    operacion,
    tipo,
    precio,
    moneda,
    ubicacion,
    direccion,
    imagen_principal,
    imagenes_extra,
    dormitorios,
    banios,
    plantas,
    piso,
    superficie_cubierta_m2,
    superficie_total_m2,
    superficie_m2
  } = req.body;

  if (!titulo || !operacion || !tipo || !precio || !ubicacion) {
    return res.status(400).render('properties/edit', {
      title: `Editar: ${property.titulo}`,
      errorMessage: 'Completa titulo, operacion, tipo, precio y ubicacion.',
      propertyId: property.id,
      formData: req.body
    });
  }

  try {
    const uploadedMainImage = req.files && req.files.imagen_principal_file
      ? req.files.imagen_principal_file[0]
      : null;
    const uploadedMainImageRef = extractUploadedImageReference(uploadedMainImage);
    const normalizedMainImage = uploadedMainImageRef || normalizeImageReference(imagen_principal);
    const uploadedExtraImageRefs = req.files && req.files.imagenes_extra_files
      ? req.files.imagenes_extra_files.map(extractUploadedImageReference).filter(Boolean)
      : [];
    const pisoValue = tipo === 'departamento' ? (piso || null) : null;
    const plantasValue = tipo === 'casa' ? (plantas || null) : null;

    await property.update({
      titulo,
      descripcion: descripcion || null,
      operacion,
      tipo,
      precio,
      moneda: normalizeCurrency(moneda),
      ubicacion,
      direccion: direccion || null,
      imagen_principal: normalizedMainImage,
      dormitorios: dormitorios || null,
      banios: banios || null,
      plantas: plantasValue,
      piso: pisoValue,
      superficie_cubierta_m2: superficie_cubierta_m2 || null,
      superficie_total_m2: superficie_total_m2 || null,
      superficie_m2: superficie_m2 || null,
      destacada: req.body.destacada === 'on'
    });

    await db.PropertyImage.destroy({
      where: {
        id_propiedad: property.id
      }
    });

    const imageRows = buildImageRows(property.id, normalizedMainImage, imagenes_extra, uploadedExtraImageRefs);
    if (imageRows.length > 0) {
      await db.PropertyImage.bulkCreate(imageRows);
    }

    return res.redirect('/propiedades/add?status=updated');
  } catch (error) {
    return res.status(500).render('properties/edit', {
      title: `Editar: ${property.titulo}`,
      errorMessage: 'No se pudo actualizar la propiedad.',
      propertyId: property.id,
      formData: req.body
    });
  }
}

async function handlePropertyFormError(err, req, res, next) {
  if (!err) {
    return next();
  }

  const isCreateRoute = req.method === 'POST' && req.path === '/add';
  const isEditRoute = req.method === 'POST' && /\/\d+\/edit$/.test(req.path);

  if (!isCreateRoute && !isEditRoute) {
    return next(err);
  }

  const errorMessage = err.userMessage || err.message || `Podes subir hasta ${MAX_EXTRA_IMAGES} imagenes extra.`;

  if (isCreateRoute) {
    const adminProperties = await getAdminProperties();
    return res.status(err.status || 400).render('properties/create', {
      title: 'Publicar propiedad',
      errorMessage,
      adminMessage: null,
      formData: req.body || {},
      adminProperties
    });
  }

  const property = await findPropertyForAdmin(req.params.id);
  if (!property) {
    return next(err);
  }

  return res.status(err.status || 400).render('properties/edit', {
    title: `Editar: ${property.titulo}`,
    errorMessage,
    propertyId: property.id,
    formData: {
      ...buildEditFormData(property),
      ...(req.body || {})
    }
  });
}

async function deleteProperty(req, res, next) {
  const property = await findPropertyForAdmin(req.params.id);

  if (!property) {
    return next();
  }

  try {
    const deletedAt = new Date();

    await property.update({ deletedAt });
    await db.PropertyImage.update(
      { deletedAt },
      {
        where: {
          id_propiedad: property.id,
          deletedAt: null
        }
      }
    );

    return res.redirect('/propiedades/add?status=deleted');
  } catch (error) {
    return res.redirect('/propiedades/add');
  }
}

module.exports = {
  renderProperties,
  renderPropertyDetail,
  handleInterestEmail,
  handlePropertyFormError,
  renderCreateProperty,
  createProperty,
  renderEditProperty,
  updateProperty,
  deleteProperty
};
