USE brun_db;

ALTER TABLE usuarios
  ADD COLUMN username VARCHAR(100) NULL AFTER id;

UPDATE usuarios
SET username = CONCAT('user_', id)
WHERE username IS NULL OR TRIM(username) = '';

ALTER TABLE usuarios
  MODIFY COLUMN username VARCHAR(100) NOT NULL;

ALTER TABLE usuarios
  ADD UNIQUE KEY uq_usuarios_username (username);

ALTER TABLE usuarios
  DROP COLUMN foto_perfil;
