module.exports = function (sequelize, dataTypes) {
  const alias = 'User';

  const cols = {
    id: {
      autoIncrement: true,
      primaryKey: true,
      type: dataTypes.INTEGER
    },
    username: {
      type: dataTypes.STRING
    },
    email: {
      type: dataTypes.STRING
    },
    contrasena: {
      type: dataTypes.STRING,
      field: 'contrasena'
    },
    rol: {
      type: dataTypes.ENUM('admin', 'user')
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
    tableName: 'usuarios',
    timestamps: true,
    underscored: false
  };

  const User = sequelize.define(alias, cols, config);

  User.associate = function (models) {
    User.hasMany(models.Property, {
      as: 'properties',
      foreignKey: 'id_usuario'
    });
  };

  return User;
};
