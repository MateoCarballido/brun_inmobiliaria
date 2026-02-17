const properties = [
  {
    id: 1,
    titulo: 'Casa moderna en Palermo',
    ubicacion: 'Palermo, Buenos Aires',
    precio: 285000,
    dormitorios: 4,
    banios: 3,
    superficie_m2: 210,
    imagen_principal: 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?auto=format&fit=crop&w=1200&q=80',
    descripcion: 'Casa luminosa con patio, pileta y cochera para dos autos.',
    destacada: true
  },
  {
    id: 2,
    titulo: 'Departamento premium con balcon',
    ubicacion: 'Recoleta, Buenos Aires',
    precio: 198000,
    dormitorios: 3,
    banios: 2,
    superficie_m2: 120,
    imagen_principal: 'https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=1200&q=80',
    descripcion: 'Departamento con vista abierta y amenities de primer nivel.',
    destacada: true
  },
  {
    id: 3,
    titulo: 'Casa familiar con jardin',
    ubicacion: 'San Isidro, Buenos Aires',
    precio: 350000,
    dormitorios: 5,
    banios: 4,
    superficie_m2: 330,
    imagen_principal: 'https://images.unsplash.com/photo-1572120360610-d971b9d7767c?auto=format&fit=crop&w=1200&q=80',
    descripcion: 'Ideal para familias, con jardin arbolado y quincho completo.',
    destacada: false
  },
  {
    id: 4,
    titulo: 'PH reciclado en zona residencial',
    ubicacion: 'Caballito, Buenos Aires',
    precio: 145000,
    dormitorios: 2,
    banios: 1,
    superficie_m2: 85,
    imagen_principal: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
    descripcion: 'PH reciclado a nuevo con terraza propia y excelente conectividad.',
    destacada: false
  },
  {
    id: 5,
    titulo: 'Casa con vista al lago',
    ubicacion: 'Bariloche, Rio Negro',
    precio: 420000,
    dormitorios: 4,
    banios: 3,
    superficie_m2: 260,
    imagen_principal: 'https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?auto=format&fit=crop&w=1200&q=80',
    descripcion: 'Propiedad exclusiva con deck panoramico y entorno natural unico.',
    destacada: true
  }
];

function getAllProperties() {
  return properties;
}

function getFeaturedProperties() {
  return properties.filter((property) => property.destacada);
}

function getPropertyById(id) {
  return properties.find((property) => property.id === Number(id));
}

module.exports = {
  getAllProperties,
  getFeaturedProperties,
  getPropertyById
};
