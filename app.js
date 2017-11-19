/*!
 * staringo - app.js
 * Copyright(c) 2017 xingo4 <xingo4@icloud.com>
 * MIT Licensed
 */

/**
 * Module dependencies.
 */

var config = require('./config');
require('colors');

var path = require('path');
var express = require('express');
var session = require('express-session');
var favicon = require('serve-favicon');

require('./middlewares/mongoose_log'); // 打印 mongodb 查询日志
require('./models');

var webRouter = require('./web_router');
var auth = require('./middlewares/auth');
var errorPageMiddleware = require('./middlewares/error_page');

var _ = require('lodash');
var csurf = require('csurf');

var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');

var errorhandler = require('errorhandler');

var requestLog = require('./middlewares/request_log');
var renderMiddleware = require('./middlewares/render');
var logger = require('./common/logger');

var urlInfo = require('url').parse(config.host);
config.hostname = urlInfo.hostname || config.host;

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');
/*app.enable('trust proxy');*/

// favicon
app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));

// 静态文件目录
app.use('/public', express.static(path.join(__dirname, 'public')));

// Request logger。请求时间
app.use(requestLog);
if (config.debug) {
    // 渲染时间
    app.use(renderMiddleware.render);
}

// 通用的中间件
/*app.use(require('response-time')());*/
app.use(bodyParser.json({limit: '1mb'})); // json请求
app.use(bodyParser.urlencoded({extended: true, limit: '1mb'})); // form请求
app.use(cookieParser(config.session_secret)); // cookie secret
app.use(session({
    secret: config.session_secret,
    /*store:,*/
    resave: false,
    saveUninitialized: false
}));

// custom middleware
app.use(auth.authUser);
app.use(auth.blockUser());

if (!config.debug) {
    app.use(function (req, res, next) {
        if (req.path === '/api' || req.path.indexOf('/api') === -1) {
            csurf()(req, res, next);
            return;
        }
        next();
    });
    app.set('view cache', true);
}


// set static, dynamic helpers
_.extend(app.locals, {
    config: config
});

_.extend(app.locals,{formatDate:require('./common/tools').formatDate});

app.use(errorPageMiddleware.errorPage);
_.extend(app.locals, require('./common/render_helper'));
/*app.use(function (req, res, next) {
    res.locals.csrf = req.csrfToken ? req.csrfToken() : '';
    next();
});*/

/*app.use(busboy({
    limits: {
        fileSize: bytes(config.file_limit)
    }
}));*/

// routes
/*app.use('/api/v1', cors(), apiRouterV1);*/
app.use('/', webRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handler
if (config.debug) {
    app.use(errorhandler());
} else {
    app.use(function (err, req, res, next) {
        logger.error(err);

        // render the error page
        res.status(err.status || 500);
        return res.render('error');
    });
}

if (!module.parent) {
    app.listen(config.port, function () {
        logger.info('Staringo listening on port', config.port);
        logger.info('You can debug your app with http://' + config.hostname + ':' + config.port);
        logger.info('Have a good day');
    });
}

module.exports = app;
