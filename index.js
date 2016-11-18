const winston = require('winston');
const moment = require('moment');
const config = require('winston/lib/winston/config');

function formatter(options) {
  const timestamp = options.timestamp();
  const level = config.colorize(options.level, options.level.toUpperCase());
  const message = (undefined !== options.message) ? options.message : '';
  const metastring = JSON.stringify(options.meta);
  const meta = (options.meta && Object.keys(options.meta).length) ? `\n\t${metastring}` : '';
  return `${timestamp} ${level} ${message} ${meta}`;
}

const timestampTemplate = 'YYYY-MM-DDTHH:mm:ssZ';
const transports = [
  new winston.transports.Console({
    timestamp: () => moment().format(timestampTemplate),
    colorize: true,
    stripColors: true,
    level: 'info',
    formatter,
  }),
  new winston.transports.File({
    filename: process.env.LOG_FILE,
    timestamp: () => moment().format(timestampTemplate),
    maxsize: process.env.LOG_FILE_MAX,
    level: 'error',
    formatter,
  }),
];

const logger = module.exports = new winston.Logger({
  transports,
});

function log(statusCode, method, url, startTime) {
  return `${statusCode} HTTP ${method} "${url}" ${(new Date() - startTime)}ms`;
}

logger.requestLogger = () => (req, res, next) => {
  const requestEnd = res.end;
  const startTime = new Date();
  const response = res;
  response.end = (chunk, encoding) => {
    response.end = requestEnd;
    response.end(chunk, encoding);
    if (response.statusCode < 400) {
      logger.info(log(response.statusCode, req.method, req.url, startTime));
    } else if (response.statusCode < 500) {
      logger.warn(log(response.statusCode, req.method, req.url, startTime));
    } else {
      logger.error(log(response.statusCode, req.method, req.url, startTime));
    }
  };
  next();
};
