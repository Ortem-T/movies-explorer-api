const express = require('express');
const mongoose = require('mongoose');

const { PORT = 3000 } = process.env;
const app = express();
const { errors } = require('celebrate');
const handleError = require('./errors/handleError');
const routes = require('./routes/index');
const { requestLogger, errorLogger } = require('./middlewares/logger');

app.use(express.json());

mongoose.connect('mongodb://localhost:27017/bitfilmsdb', {
  useNewUrlParser: true,
});

app.use(requestLogger);

app.use(routes);

app.use(errorLogger);
app.use(errors());
app.use(handleError);

app.listen(PORT);
