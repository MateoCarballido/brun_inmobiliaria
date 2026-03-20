ALTER TABLE propiedades
MODIFY COLUMN tipo ENUM('casa','departamento','terreno','galpon','local_comercial','oficina') NOT NULL;
