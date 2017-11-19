// ErrorPage middleware
exports.errorPage = function (req, res, next) {

    res.render404 = function (error) {
        return res.status(404).render('error', {error: error});
    };

    res.renderError = function (error, statusCode) {
        if (statusCode === undefined) {
            statusCode = 400;
        }
        return res.status(statusCode).render('error', {error: error});
    };

    next();
};