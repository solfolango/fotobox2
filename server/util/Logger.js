var winston = require('winston');
var moment = require('moment');
var memwatch = require('memwatch-next');

const config = require(__base + '/config');

var timestamp = moment().format("YYYYMMDD"); //-hhmmss'");

var Logger = new (winston.Logger)({
    transports: [
      new (winston.transports.Console)({ level: 'info' }),
      new (winston.transports.File)({ level: 'silly', filename: config.app.path.logs + timestamp + '.log' })
    ]
});

// handle exceptions seperatly
//logger.handleExceptions(new winston.transports.File({ filename: __dirname + '/logs/' + timestamp + '-exceptions.log' }))

memwatch.on('leak', function(info) {
  Logger.log('warn', 'Memory leak: ' , info);
});

memwatch.on('stats', function(stats) {
  Logger.log('info', 'Memory stats:', stats);
});

module.exports = Logger;