const router = require('express').Router();
const userRouter = require('./users');
const movieRouter = require('./movies');
const { createUser, login } = require('../controllers/users');
const auth = require('../middlewares/auth');

const NotFoundErr = require('../errors/NotFoundErr');
const { validateCreateUser, validateLogin } = require('../middlewares/validator');

router.post('/signup', validateCreateUser, createUser);
router.post('/signin', validateLogin, login);

router.use(auth);
router.use('/', userRouter);
router.use('/', movieRouter);

router.use('*', (req, res, next) => {
  next(new NotFoundErr('Указанный роут не существует!'));
});

module.exports = router;
