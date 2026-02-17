USE brun_db;

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
