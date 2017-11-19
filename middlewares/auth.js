var mongoose = require('mongoose');
var UserModel = mongoose.model('User');
var config = require('../config');
var eventproxy = require('eventproxy');
var UserProxy = require('../proxy').User;
var Message = require('../proxy').Message;

/**
 * 需要管理员权限
 */
exports.adminRequired = function (req, res, next) {
    if (!req.session.user) {
        return res.render('error', {error: '你还没有登录。'});
    }

    if (!req.session.user.is_admin) {
        return res.render('error', {error: '需要管理员权限。'});
    }

    next();
};

/**
 * 需要登录
 */
exports.userRequired = function (req, res, next) {
    if (!req.session || !req.session.user || !req.session.user._id) {
        req.session._loginReferer = req.url;
        return res.redirect('/login');
    }

    next();
};

exports.postUserRequired = function (req, res, next) {
    if (!req.session || !req.session.user || !req.session.user._id) {
        return res.json({status: false, msg: '您还没登录，不能进行任何操作'});
    }
    next();
};

/**
 * client cookie
 */
exports.gen_session = function (user, res) {
    var auth_token = {_uid: user._id};
    var opts = {
        path: '/',
        maxAge: 1000 * 60 * 60 * 24 * 30,
        signed: true,
        httpOnly: true
    };
    res.cookie(config.auth_cookie_name, auth_token, opts); //cookie 有效期30天
};

/**
 * block user
 */
exports.blockUser = function () {
    return function (req, res, next) {
        if (req.path === '/signout') {
            return next();
        }
        if (req.session.user && req.session.user.is_block && req.method !== 'GET') {
            return res.status(403).send('您已被管理员屏蔽了。有疑问请联系 @xingo4。');
        }
        next();
    };
};

/**
 * 验证用户是否登录
 */
exports.authUser = function (req, res, next) {
    var ep = new eventproxy();
    ep.fail(next);

    // 确保current_user始终已定义。
    res.locals.current_user = null;


    ep.all('get_user', function (user) {

        if (!user) {
            return next();
        }

        // session
        user = res.locals.current_user = req.session.user = new UserModel(user);
        if (config.admins.hasOwnProperty(user.username)) {
            user.is_admin = true;
        }

        Message.getMessagesCount(user._id, ep.done(function (count) {
            user.messages_count = count;
            next();
        }));
    });


    if (req.session.user) {
        ep.emit('get_user', req.session.user);
    } else {
        var auth_token = req.signedCookies[config.auth_cookie_name];
        if (!auth_token) {
            return next();
        }

        var user_id = auth_token._uid;
        UserProxy.getUserById(user_id, ep.done('get_user'));
    }
};
