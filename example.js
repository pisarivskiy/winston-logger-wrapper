require('dotenv').load();
const express = require('express');
const logger = require('./');

const app = express();

app.use(logger.requestLogger());
app.get('/', (req, res) => {
  res.send('ok');
});

app.get('/error', (req, res, next) => next(new Error('Bad')));

app.use((err, req, res, next) => {
  logger.error(err.message, err.stack);
  res.send('Bad :(');
});

const port = process.env.PORT;
app.listen(port, () => {
  logger.info('ok');
  logger.warn('fine');
  logger.error('bad');
  logger.info(`Server is runnig at http://localhost:${port}`);
});
