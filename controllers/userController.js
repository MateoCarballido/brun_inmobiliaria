const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const db = require('../database/models');
const BCRYPT_ROUNDS = 10;
const isProduction = process.env.NODE_ENV === 'production';
const forceSecureCookie = process.env.SESSION_SECURE === 'true';
const sessionMaxAgeMs = Number(process.env.SESSION_MAX_AGE_MS || 1000 * 60 * 60 * 24 * 7);

function isBcryptHash(value) {
  return typeof value === 'string' && /^\$2[aby]\$\d{2}\$/.test(value);
}

async function hashPasswordWithBcrypt(plainPassword) {
  return bcrypt.hash(plainPassword, BCRYPT_ROUNDS);
}

async function verifyPassword(plainPassword, storedPassword) {
  if (!storedPassword) {
    return false;
  }

  if (isBcryptHash(storedPassword)) {
    return bcrypt.compare(plainPassword, storedPassword);
  }

  if (!storedPassword.startsWith('scrypt$')) {
    return plainPassword === storedPassword;
  }

  const parts = storedPassword.split('$');
  if (parts.length !== 3) {
    return false;
  }

  const salt = parts[1];
  const storedHashHex = parts[2];
  const derivedKey = await new Promise((resolve, reject) => {
    crypto.scrypt(plainPassword, salt, 64, (error, result) => {
      if (error) {
        reject(error);
      } else {
        resolve(result);
      }
    });
  });
  const storedHash = Buffer.from(storedHashHex, 'hex');

  if (storedHash.length !== derivedKey.length) {
    return false;
  }

  return crypto.timingSafeEqual(storedHash, derivedKey);
}

function renderLogin(req, res) {
  const next = req.query.next ? String(req.query.next).trim() : '';

  return res.render('users/login', {
    title: 'Iniciar sesion',
    errorMessage: null,
    formData: { next },
    next
  });
}

function renderRegister(req, res) {
  const next = req.query.next ? String(req.query.next).trim() : '';
  const required = req.query.required ? String(req.query.required).trim() : '';

  return res.render('users/register', {
    title: 'Crear cuenta',
    errorMessage: null,
    formData: { next },
    next,
    required
  });
}

async function register(req, res) {
  const { username, email, password, next } = req.body;
  const safeNext = typeof next === 'string' && next.startsWith('/') ? next : '';

  if (!username || !email || !password) {
    return res.status(400).render('users/register', {
      title: 'Crear cuenta',
      errorMessage: 'Username, email y contrasena son obligatorios.',
      formData: req.body,
      next: safeNext,
      required: ''
    });
  }

  try {
    const existingUserByEmail = await db.User.findOne({ where: { email } });
    const existingUserByUsername = await db.User.findOne({ where: { username } });

    if (existingUserByEmail) {
      return res.status(400).render('users/register', {
        title: 'Crear cuenta',
        errorMessage: 'Ya existe un usuario con ese email.',
        formData: req.body,
        next: safeNext,
        required: ''
      });
    }

    if (existingUserByUsername) {
      return res.status(400).render('users/register', {
        title: 'Crear cuenta',
        errorMessage: 'Ese username ya esta en uso.',
        formData: req.body,
        next: safeNext,
        required: ''
      });
    }

    const passwordHash = await hashPasswordWithBcrypt(password);

    await db.User.create({
      username,
      email,
      contrasena: passwordHash,
      rol: 'user'
    });

    return res.redirect(safeNext ? `/users/login?next=${encodeURIComponent(safeNext)}` : '/users/login');
  } catch (error) {
    return res.status(500).render('users/register', {
      title: 'Crear cuenta',
      errorMessage: 'No se pudo crear el usuario. Revisa los datos.',
      formData: req.body,
      next: safeNext,
      required: ''
    });
  }
}

async function login(req, res) {
  const { email, password, next } = req.body;
  const safeNext = typeof next === 'string' && next.startsWith('/') ? next : '';

  try {
    const user = await db.User.findOne({ where: { email } });

    const isValidPassword = user && await verifyPassword(password, user.contrasena);

    if (!isValidPassword) {
      return res.status(401).render('users/login', {
        title: 'Iniciar sesion',
        errorMessage: 'Credenciales invalidas.',
        formData: req.body,
        next: safeNext
      });
    }

    if (!isBcryptHash(user.contrasena)) {
      const migratedHash = await hashPasswordWithBcrypt(password);
      await db.User.update(
        { contrasena: migratedHash },
        { where: { id: user.id } }
      );
    }

    const sessionUser = {
      id: user.id,
      username: user.username,
      email: user.email,
      rol: user.rol
    };

    req.session.user = sessionUser;
    res.cookie('user', JSON.stringify(sessionUser), {
      httpOnly: true,
      maxAge: sessionMaxAgeMs,
      sameSite: 'lax',
      secure: isProduction || forceSecureCookie,
      signed: true
    });

    return res.redirect(safeNext || '/');
  } catch (error) {
    return res.status(500).render('users/login', {
      title: 'Iniciar sesion',
      errorMessage: 'No se pudo iniciar sesion.',
      formData: req.body,
      next: safeNext
    });
  }
}

function logout(req, res) {
  res.clearCookie('user');

  if (req.session) {
    req.session.destroy(function() {
      return res.redirect('/');
    });
    return;
  }

  return res.redirect('/');
}

module.exports = {
  renderLogin,
  renderRegister,
  register,
  login,
  logout
};
