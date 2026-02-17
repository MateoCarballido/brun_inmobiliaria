const propertyModel = require('../models/propertyModel');
const db = require('../database/models');

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

  return propertyModel.getFeaturedProperties();
}

async function renderHome(req, res) {
  const featuredProperties = await getFeaturedProperties();

  res.render('home', {
    title: 'Inmobiliaria Horizonte',
    featuredProperties,
    pageClass: 'landing-page'
  });
}

function renderAbout(req, res) {
  res.render('about', {
    title: 'Sobre nosotros',
    pageClass: ''
  });
}

function renderContact(req, res) {
  res.render('contact', {
    title: 'Contacto',
    pageClass: '',
    successMessage: null
  });
}

function renderTerms(req, res) {
  res.render('terms', {
    title: 'Terminos y Condiciones',
    pageClass: ''
  });
}

function renderPrivacy(req, res) {
  res.render('privacy', {
    title: 'Politica de Privacidad',
    pageClass: ''
  });
}

function renderCookies(req, res) {
  res.render('cookies', {
    title: 'Politica de Cookies',
    pageClass: ''
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
    successMessage: 'Gracias por tu mensaje. Te responderemos a la brevedad.'
  });
}

module.exports = {
  renderHome,
  renderAbout,
  renderContact,
  renderTerms,
  renderPrivacy,
  renderCookies,
  submitContact
};
