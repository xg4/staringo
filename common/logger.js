var config = require('../config');
var path = require('path');

var env = process.env.NODE_ENV || "development";
var log4js = require('log4js');

log4js.configure({
    appenders: {
        cheese: {type: 'file', filename: path.join(config.log_dir, 'cheese.log')},
        console: {type: 'console'}
    },
    categories: {
        default: {appenders: ['console', 'cheese'], level: config.debug && env !== 'test' ? 'DEBUG' : 'ERROR'}
    }
});

var logger = log4js.getLogger('cheese');


module.exports = logger;