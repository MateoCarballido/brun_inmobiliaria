USE brun_db;

ALTER TABLE propiedades
  ADD COLUMN plantas TINYINT UNSIGNED NULL AFTER banios;
