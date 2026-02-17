module.exports = function (sequelize, dataTypes) {
  const alias = 'Consultation';

  const cols = {
    id: {
      autoIncrement: true,
      primaryKey: true,
      type: dataTypes.INTEGER
    },
    id_propiedad: {
      type: dataTypes.INTEGER
    },
    origen: {
      type: dataTypes.ENUM('propiedad', 'contacto')
    },
    nombre: {
      type: dataTypes.STRING
    },
    email: {
      type: dataTypes.STRING
    },
    telefono: {
      type: dataTypes.STRING
    },
    asunto: {
      type: dataTypes.STRING
    },
    mensaje: {
      type: dataTypes.TEXT
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
    tableName: 'consultas',
    timestamps: true,
    underscored: false
  };

  const Consultation = sequelize.define(alias, cols, config);

  Consultation.associate = function (models) {
    Consultation.belongsTo(models.Property, {
      as: 'property',
      foreignKey: 'id_propiedad'
    });
  };

  return Consultation;
};
