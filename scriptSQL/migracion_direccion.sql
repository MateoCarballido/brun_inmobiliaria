USE brun_db;

ALTER TABLE propiedades
  ADD COLUMN direccion VARCHAR(200) NULL AFTER ubicacion;
