var config = require('../config');

// ErrorPage middleware
exports.errorPage = function (req, res, next) {

    res.render404 = function (error) {
        return res.status(404).render('error', {title: '404 Not Found - ' + config.name, error: error});
    };

    res.renderError = function (error, statusCode) {
        if (statusCode === undefined) {
            statusCode = 400;
        }
        return res.status(statusCode).render('error', {title: '错误页面 - ' + config.name, error: error});
    };

    next();
};