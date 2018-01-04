/* eslint-disable no-console, strict, new-cap */

'use strict';

const winston = require('winston');

// logging options loaded from env variables
const PAPERTRAIL_HOST = process.env.PAPERTRAIL_HOST;
const PAPERTRAIL_PORT = process.env.PAPERTRAIL_PORT;
const moduleName = process.env.PAPERTRAIL_MODULE;
const LOGGING_LEVEL = 'info';

console.log(`logger options: MODULE:${moduleName}, papertail=${PAPERTRAIL_HOST}:${PAPERTRAIL_PORT}`);

const alexaLogger = {};

/**
 * flag to help ensure that init function is not called more than once
 * */
alexaLogger.initialized = false;

/* eslint global-require: 0 */

const transports = [];
transports.push(new (winston.transports.Console)({ level: LOGGING_LEVEL, colorize: true }));

// create the logger
const logger = new winston.Logger({
  transports: transports
});

const logContext = '';

/**
 * Returns the underlying logger object which can be used for direct manipulation
 * */
alexaLogger.getLogger = function (category) {
  if (category) {
    const tmp = winston.loggers.get(category);
    if (tmp) {
      return tmp;
    }
    winston.loggers.add(category);
    return winston.loggers.get(category);
  }
  return logger;
};

alexaLogger.logWarn = function (message, extraInfo) {
  logger.warn(message, extraInfo);
};

alexaLogger.logInfo = function (message, extraInfo) {
  logger.info(message, extraInfo);
};

alexaLogger.logError = function (message, extraInfo) {
  logger.error(message, extraInfo);
};

alexaLogger.init = function () {
  return new Promise((resolve) => {
    if (alexaLogger.initialized) {
      alexaLogger.logWarn('alexaLogger.init called and alexaLogger.initialized is already set');
      resolve();
    } else {
      alexaLogger.initialized = true;

      if (PAPERTRAIL_HOST && PAPERTRAIL_PORT) {
        /* eslint-disable no-console global-require */
        require('winston-papertrail').Papertrail;

        // define the papertrail transport
        const ptOptions = {
          host: PAPERTRAIL_HOST,
          port: PAPERTRAIL_PORT,
          level: LOGGING_LEVEL,
          colorize: true,
          program: moduleName,
          logFormat: function (level, message) {
            return `[${level}]${logContext} ${message}`;
          }
        };

        logger.add(winston.transports.Papertrail, ptOptions);

        /* // define an error handler
        ptTransport.on('error', (err) => {
          logger && logger.error(err);
        });*/
      }
      resolve();
    }
  });
};

module.exports = alexaLogger;