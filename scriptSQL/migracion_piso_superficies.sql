USE brun_db;

ALTER TABLE propiedades
  ADD COLUMN piso VARCHAR(30) NULL AFTER banios,
  ADD COLUMN superficie_cubierta_m2 DECIMAL(10,2) NULL AFTER piso,
  ADD COLUMN superficie_total_m2 DECIMAL(10,2) NULL AFTER superficie_cubierta_m2;
