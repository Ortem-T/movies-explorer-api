const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const User = require('../models/user');
const AuthErr = require('../errors/AuthErr');
const BadRequestErr = require('../errors/BadRequestErr');
const ConflictErr = require('../errors/ConflictErr');
const NotFoundErr = require('../errors/NotFoundErr');
const { SALT_ROUNDS } = require('../utils/constants');

const { NODE_ENV, JWT_SECRET } = process.env;

module.exports.getUser = (req, res, next) => {
  User.findById(req.user._id).then((user) => {
    if (!user) {
      return next(new NotFoundErr(`Пользователь с id: ${req.user._id} не найден.`));
    }
    return res.send(user);
  })
    .catch(next);
};

module.exports.updateUser = (req, res, next) => {
  const { name, email } = req.body;
  User.findByIdAndUpdate(req.user._id, { name, email }, { new: true, runValidators: true })
    .then((user) => res.send(user))
    .catch((err) => {
      if (err.name === 'ValidationError') {
        return next(new BadRequestErr('Переданы некорректные данные.'));
      }
      return next(err);
    });
};

module.exports.createUser = (req, res, next) => {
  const {
    name, email, password,
  } = req.body;

  bcrypt.hash(password, SALT_ROUNDS, (err, hash) => {
    if (err) {
      return next(err);
    }
    return User.create({
      name,
      email,
      password: hash,
    })
      .then((user) => res.status(201).send(
        {
          _id: user._id,
          name: user.name,
          email: user.email,
        },
      ))
      .catch((error) => {
        if (error.name === 'ValidationError') {
          next(new BadRequestErr('Переданы некорректные данные.'));
        } else if (error.name === 'MongoServerError' && error.code === 11000) {
          next(new ConflictErr('Такой пользователь уже существует!'));
        } else {
          next(error);
        }
      });
  });
};

module.exports.login = (req, res, next) => {
  const { email, password } = req.body;

  User.findOne({ email }).select('+password')
    .then((user) => {
      if (!user) {
        return next(new AuthErr('Неправильные почта или пароль.'));
      }
      return bcrypt.compare(password, user.password, (err, result) => {
        if (err) {
          return next(new BadRequestErr('Переданы некорректные данные.'));
        } if (!result) {
          return next(new AuthErr('Неправильные почта или пароль.'));
        }
        const token = jwt.sign(
          { _id: user._id },
          NODE_ENV === 'production' ? JWT_SECRET : 'some-secret-key',
          { expiresIn: '7d' },
        );
        return res.send({ token });
      });
    })
    .catch(next);
};
