module.exports = function (sequelize, dataTypes) {
  const alias = 'Property';

  const cols = {
    id: {
      autoIncrement: true,
      primaryKey: true,
      type: dataTypes.INTEGER
    },
    id_usuario: {
      type: dataTypes.INTEGER
    },
    titulo: {
      type: dataTypes.STRING
    },
    descripcion: {
      type: dataTypes.TEXT
    },
    operacion: {
      type: dataTypes.ENUM('venta', 'alquiler')
    },
    tipo: {
      type: dataTypes.ENUM('casa', 'departamento', 'terreno', 'local_comercial', 'oficina')
    },
    precio: {
      type: dataTypes.DECIMAL(12, 2)
    },
    ubicacion: {
      type: dataTypes.STRING
    },
    direccion: {
      type: dataTypes.STRING
    },
    imagen_principal: {
      type: dataTypes.STRING
    },
    dormitorios: {
      type: dataTypes.INTEGER
    },
    banios: {
      type: dataTypes.INTEGER
    },
    plantas: {
      type: dataTypes.INTEGER
    },
    piso: {
      type: dataTypes.STRING
    },
    superficie_cubierta_m2: {
      type: dataTypes.DECIMAL(10, 2)
    },
    superficie_total_m2: {
      type: dataTypes.DECIMAL(10, 2)
    },
    superficie_m2: {
      type: dataTypes.DECIMAL(10, 2)
    },
    destacada: {
      type: dataTypes.BOOLEAN
    },
    createdAt: {
      type: dataTypes.DATE
    },
    updatedAt: {
      type: dataTypes.DATE
    },
    deletedAt: {
      type: dataTypes.DATE
    }
  };

  const config = {
    tableName: 'propiedades',
    timestamps: true,
    underscored: false
  };

  const Property = sequelize.define(alias, cols, config);

  Property.associate = function (models) {
    Property.belongsTo(models.User, {
      as: 'user',
      foreignKey: 'id_usuario'
    });

    Property.hasMany(models.PropertyImage, {
      as: 'images',
      foreignKey: 'id_propiedad'
    });

    Property.hasMany(models.Consultation, {
      as: 'consultations',
      foreignKey: 'id_propiedad'
    });
  };

  return Property;
};
