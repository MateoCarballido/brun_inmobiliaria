const propertyModel = require('../models/propertyModel');
const db = require('../database/models');
const op = db.Sequelize.Op;

function normalizeImageReference(value) {
  if (!value) {
    return null;
  }

  const trimmed = String(value).trim();
  if (!trimmed) {
    return null;
  }

  const withoutQuery = trimmed.split('?')[0].split('#')[0];
  const parts = withoutQuery.split('/').filter(Boolean);
  return parts.length > 0 ? parts[parts.length - 1] : null;
}

function buildImageRows(propertyId, normalizedMainImage, rawExtraImages) {
  const imageRows = [];

  if (normalizedMainImage) {
    imageRows.push({
      id_propiedad: propertyId,
      url: normalizedMainImage,
      orden: 0
    });
  }

  if (rawExtraImages) {
    const extraUrls = rawExtraImages
      .split('\n')
      .map((line) => normalizeImageReference(line))
      .filter(Boolean);

    extraUrls.forEach((url, index) => {
      imageRows.push({
        id_propiedad: propertyId,
        url,
        orden: index + 1
      });
    });
  }

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

  const fallbackProperties = propertyModel.getAllProperties();

  if (!filters.search && !filters.operacion && !filters.tipo && !filters.ubicacion && !filters.precioMin && !filters.precioMax && !filters.dormitorios && !filters.banios) {
    return fallbackProperties;
  }

  return fallbackProperties.filter((property) => {
    const price = Number(property.precio);
    const dormitorios = Number(property.dormitorios || 0);
    const banios = Number(property.banios || 0);

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      const hasSearch = property.titulo.toLowerCase().includes(searchLower) ||
        property.ubicacion.toLowerCase().includes(searchLower) ||
        String(property.direccion || '').toLowerCase().includes(searchLower);
      if (!hasSearch) return false;
    }

    if (filters.operacion && property.operacion !== filters.operacion) return false;
    if (filters.tipo && property.tipo !== filters.tipo) return false;
    if (filters.ubicacion && !property.ubicacion.toLowerCase().includes(filters.ubicacion.toLowerCase())) return false;
    if (filters.precioMin && price < Number(filters.precioMin)) return false;
    if (filters.precioMax && price > Number(filters.precioMax)) return false;
    if (filters.dormitorios && dormitorios < Number(filters.dormitorios)) return false;
    if (filters.banios && banios < Number(filters.banios)) return false;

    return true;
  });
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

  return propertyModel.getPropertyById(id);
}

async function renderProperties(req, res) {
  const filters = {
    search: req.query.search ? req.query.search.trim() : '',
    operacion: req.query.operacion ? req.query.operacion.trim() : '',
    tipo: req.query.tipo ? req.query.tipo.trim() : '',
    ubicacion: req.query.ubicacion ? req.query.ubicacion.trim() : '',
    precioMin: req.query.precioMin ? req.query.precioMin.trim() : '',
    precioMax: req.query.precioMax ? req.query.precioMax.trim() : '',
    dormitorios: req.query.dormitorios ? req.query.dormitorios.trim() : '',
    banios: req.query.banios ? req.query.banios.trim() : ''
  };

  const properties = await getAllProperties(filters);

  res.render('properties/index', {
    title: 'Propiedades disponibles',
    properties,
    filtros: filters
  });
}

async function renderPropertyDetail(req, res, next) {
  const property = await findPropertyById(req.params.id);

  if (!property) {
    return next();
  }

  return res.render('properties/show', {
    title: property.titulo,
    property,
    successMessage: null,
    mailtoLink: null
  });
}

async function handleInterestEmail(req, res, next) {
  const property = await findPropertyById(req.params.id);

  if (!property) {
    return next();
  }

  const { nombre, email, telefono, mensaje } = req.body;
  const recipient = 'ventas@inmobiliariahorizonte.com';
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

  const mailtoLink = `mailto:${recipient}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(bodyLines.join('\n'))}`;

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
    mailtoLink
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
    const normalizedMainImage = normalizeImageReference(imagen_principal);
    const pisoValue = tipo === 'departamento' ? (piso || null) : null;
    const plantasValue = tipo === 'casa' ? (plantas || null) : null;

    const createdProperty = await db.Property.create({
      id_usuario: req.currentUser.id,
      titulo,
      descripcion: descripcion || null,
      operacion,
      tipo,
      precio,
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

    const imageRows = buildImageRows(createdProperty.id, normalizedMainImage, imagenes_extra);

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
    const normalizedMainImage = normalizeImageReference(imagen_principal);
    const pisoValue = tipo === 'departamento' ? (piso || null) : null;
    const plantasValue = tipo === 'casa' ? (plantas || null) : null;

    await property.update({
      titulo,
      descripcion: descripcion || null,
      operacion,
      tipo,
      precio,
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

    const imageRows = buildImageRows(property.id, normalizedMainImage, imagenes_extra);
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
  renderCreateProperty,
  createProperty,
  renderEditProperty,
  updateProperty,
  deleteProperty
};
