module.exports = function (sequelize, dataTypes) {
  const alias = 'PropertyImage';

  const cols = {
    id: {
      autoIncrement: true,
      primaryKey: true,
      type: dataTypes.INTEGER
    },
    id_propiedad: {
      type: dataTypes.INTEGER
    },
    url: {
      type: dataTypes.STRING
    },
    orden: {
      type: dataTypes.INTEGER
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
    tableName: 'propiedades_imagenes',
    timestamps: true,
    underscored: false
  };

  const PropertyImage = sequelize.define(alias, cols, config);

  PropertyImage.associate = function (models) {
    PropertyImage.belongsTo(models.Property, {
      as: 'property',
      foreignKey: 'id_propiedad'
    });
  };

  return PropertyImage;
};
