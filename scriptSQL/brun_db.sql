CREATE SCHEMA brun_db;
USE brun_db;

CREATE TABLE usuarios (
  id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(100) NOT NULL,
  email VARCHAR(500) NOT NULL,
  contraseña VARCHAR(500) NOT NULL,
  rol ENUM('admin','user') NOT NULL DEFAULT 'user',
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deletedAt TIMESTAMP NULL DEFAULT NULL,
  UNIQUE KEY uq_usuarios_email (email),
  UNIQUE KEY uq_usuarios_username (username)
);

CREATE TABLE propiedades (
  id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  id_usuario INT UNSIGNED NOT NULL,
  titulo VARCHAR(200) NOT NULL,
  descripcion TEXT,
  operacion ENUM('venta','alquiler') NOT NULL,
  tipo ENUM('casa','departamento','terreno','local_comercial','oficina') NOT NULL,
  precio DECIMAL(12,2) NOT NULL,
  moneda ENUM('USD','ARS') NOT NULL DEFAULT 'USD',
  ubicacion VARCHAR(200) NOT NULL,
  direccion VARCHAR(200),
  imagen_principal VARCHAR(500),
  dormitorios TINYINT UNSIGNED,
  banios TINYINT UNSIGNED,
  plantas TINYINT UNSIGNED,
  piso VARCHAR(30),
  superficie_cubierta_m2 DECIMAL(10,2),
  superficie_total_m2 DECIMAL(10,2),
  superficie_m2 DECIMAL(10,2),
  destacada BOOLEAN DEFAULT FALSE,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deletedAt TIMESTAMP NULL DEFAULT NULL,
  FOREIGN KEY (id_usuario) REFERENCES usuarios(id),
  INDEX idx_home (operacion, tipo, precio),
  INDEX idx_ubicacion (ubicacion),
  INDEX idx_detalle (dormitorios, banios)
);

CREATE TABLE propiedades_imagenes (
  id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  id_propiedad INT UNSIGNED NOT NULL,
  url VARCHAR(500) NOT NULL,
  orden INT UNSIGNED DEFAULT 0,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deletedAt TIMESTAMP NULL DEFAULT NULL,
  INDEX idx_propiedad (id_propiedad),
  FOREIGN KEY (id_propiedad) REFERENCES propiedades(id)
);

CREATE TABLE consultas (
  id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  id_propiedad INT UNSIGNED NULL,
  origen ENUM('propiedad','contacto') NOT NULL,
  nombre VARCHAR(150),
  email VARCHAR(200),
  telefono VARCHAR(60),
  asunto VARCHAR(200),
  mensaje TEXT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deletedAt TIMESTAMP NULL DEFAULT NULL,
  INDEX idx_consultas_propiedad (id_propiedad),
  INDEX idx_consultas_origen (origen),
  FOREIGN KEY (id_propiedad) REFERENCES propiedades(id)
);
