/*!
 * staringo - controllers/sign.js
 * Copyright(c) 2017 xingo4 <xingo4@icloud.com>
 * MIT Licensed
 */

/**
 * Module dependencies.
 */

var config = require('../config');
var validator = require('validator');
var eventproxy = require('eventproxy');
var User = require('../proxy').User;
var tools = require('../common/tools');
var mail = require('../common/mail');
var utility = require('utility');
var authMiddleWare = require('../middlewares/auth');
var uuid = require('uuid');

/**
 * sign up page.
 */
exports.getJoin = function (req, res) {
    res.render('sign/sign_up', {
        title: '注册 - ' + config.name
    });
};

/**
 * ajax check username.
 */
exports.checkUsername = function (req, res, next) {
    var username = validator.trim(req.body.username).toLowerCase();
    User.getUserByUsername(username, function (err, user) {
        if (err) {
            return next(err);
        }
        return res.json({check_info: !user});
    });
};

/**
 * ajax check email.
 */
exports.checkEmail = function (req, res, next) {
    var email = validator.trim(req.body.email).toLowerCase();
    if (!validator.isEmail(email)) {
        return res.json({check_info: false});
    }
    User.getUserByMail(email, function (err, user) {
        if (err) {
            return next(err);
        }
        return res.json({check_info: !user});
    });
};

/**
 * Handle user sign up.
 */
exports.postJoin = function (req, res, next) {
    var username = validator.trim(req.body.username).toLowerCase();
    var email = validator.trim(req.body.email).toLowerCase();
    var pwd = validator.trim(req.body.password);
    var rePwd = validator.trim(req.body.rePassword);

    var ep = new eventproxy();
    ep.fail(next);
    ep.on('sign_up_error', function (error) {
        res.status(422);
        res.render('sign/sign_up', {
            title: '注册 - ' + config.name,
            error: error,
            username: username,
            email: email
        });
    });

    // 验证信息的正确性
    if ([username, pwd, rePwd, email].some(function (item) {
            return item === '';
        })) {
        ep.emit('sign_up_error', '信息不完整。');
        return;
    }
    if (username.length < 5) {
        ep.emit('sign_up_error', '用户名至少需要5个字符。');
        return;
    }
    if (!tools.validateId(username)) {
        return ep.emit('sign_up_error', '用户名不合法。');
    }
    if (!validator.isEmail(email)) {
        return ep.emit('sign_up_error', '邮箱不合法。');
    }
    if (pwd !== rePwd) {
        return ep.emit('sign_up_error', '两次密码输入不一致。');
    }
    // END 验证信息的正确性


    User.getUsersByQuery({
        '$or': [
            {'username': username},
            {'email': email}
        ]
    }, {}, function (err, users) {
        if (err) {
            return next(err);
        }
        if (users.length > 0) {
            ep.emit('sign_up_error', '用户名或邮箱已被使用。');
            return;
        }

        tools.bhash(pwd, ep.done(function (pwdHash) {
            User.newAndSave(username, pwdHash, email, false, function (err) {
                if (err) {
                    return next(err);
                }
                // 发送激活邮件
                mail.sendActiveMail(email, utility.md5(email + pwdHash + config.session_secret), username);
                req.session._success = '欢迎加入 ' + config.name + '！我们已给您的注册邮箱发送了一封邮件，请点击里面的链接来激活您的帐号。如未收到，请登录账号，我们将再次发送激活邮件';
                return res.redirect('/login');
            });
        }));
    });
};

/**
 * Login page.
 */
exports.getLogin = function (req, res) {
    var success = req.session._success;
    var error = req.session._error;
    req.session._success = undefined;
    req.session._loginReferer = req.session._loginReferer || req.headers.referer;
    res.render('sign/sign_in', {
        title: '登录 - ' + config.name,
        success: success,
        error: error
    });
};

var notJump = [
    '/active_account', // 激活页面
    '/password_reset', // 找回密码
    '/join',           // 注册页面
    '/search_pass'     // 找回密码
];

/**
 * Handle user login.
 */
exports.postLogin = function (req, res, next) {
    var username = validator.trim(req.body.username).toLowerCase();
    var pwd = validator.trim(req.body.password);
    var ep = new eventproxy();

    ep.fail(next);

    if (!username || !pwd) {
        res.status(422);
        return res.render('sign/sign_in', {
            title: '登录 - ' + config.name,
            error: '信息不完整。'
        });
    }

    var getUser;
    if (username.indexOf('@') !== -1) {
        getUser = User.getUserByMail;
    } else {
        getUser = User.getUserByUsername;
    }

    ep.on('login_error', function (msg) {
        res.status(403);
        res.render('sign/sign_in', {
            title: '登录 - ' + config.name,
            error: msg,
            username: username
        });
    });

    getUser(username, function (err, user) {
        if (err) {
            return next(err);
        }
        if (!user) {
            return ep.emit('login_error', '该用户不存在！');
        }
        var pwdHash = user.password;
        tools.bcompare(pwd, pwdHash, ep.done(function (bool) {
            if (!bool) {
                return ep.emit('login_error', '密码错误！');
            }
            if (!user.active) {
                // 重新发送激活邮件
                mail.sendActiveMail(user.email, utility.md5(user.email + pwdHash + config.session_secret), user.username);
                res.status(403);
                return res.render('sign/sign_in', {
                    title: '登录 - ' + config.name,
                    error: '此帐号还没有被激活，激活链接已发送到 ' + user.email + ' 邮箱，请查收。'
                });
            }
            // store session cookie
            authMiddleWare.gen_session(user, res);
            //check at some page just jump to home page
            var refer = req.session._loginReferer || '/';
            for (var i = 0, len = notJump.length; i !== len; ++i) {
                if (refer.indexOf(notJump[i]) >= 0) {
                    refer = '/';
                    break;
                }
            }
            res.redirect(refer);
        }));
    });
};

/**
 * sign out.
 */
exports.logout = function (req, res) {
    req.session.destroy();
    res.clearCookie(config.auth_cookie_name, {path: '/'});
    res.redirect('/');
};

/**
 * 账号激活.
 */
exports.activeAccount = function (req, res, next) {
    var url = validator.trim(req.params.key || '');
    var key = url.split('&')[0];
    var name = url.split('&')[1];

    User.getUserByUsername(name, function (err, user) {
        if (err) {
            return next(err);
        }
        if (!user) {
            return next(new Error('[ACTIVE_ACCOUNT] no such user: ' + name));
        }
        var pwdHash = user.password;
        if (!user || utility.md5(user.email + pwdHash + config.session_secret) !== key) {
            return res.render('sign/pwd_reset', {
                title: '激活失败 - ' + config.name,
                type: 'active',
                error: '信息有误，帐号无法被激活。您可用此账号登录，我们会在再次发送激活邮件。如果您忘记密码，可直接通过邮箱修改密码。'
            });
        }
        if (user.active) {
            req.session._error = '帐号已经是激活状态，请直接登录！';
            return res.redirect('/login');
        }
        user.active = true;
        user.save(function (err) {
            if (err) {
                return next(err);
            }
            return res.render('sign/pwd_reset', {
                title: '激活成功 - ' + config.name,
                type: 'active',
                success: '帐号激活成功，请登录！'
            });
        });
    });
};

/**
 * 密码找回.
 */
exports.getPwdReset = function (req, res) {
    var error = req.session._error;
    req.session._error = undefined;
    res.render('sign/pwd_reset', {
        title: '忘记密码? - ' + config.name,
        error: error
    });
};

exports.postPwdReset = function (req, res, next) {
    var email = validator.trim(req.body.email).toLowerCase();
    if (!validator.isEmail(email)) {
        return res.render('sign/pwd_reset', {
            title: '忘记密码? - ' + config.name,
            error: '邮箱不合法',
            email: email
        });
    }

    // 动态生成retrive_key和timestamp到users collection,之后重置密码进行验证
    var retrieveKey = uuid.v4();
    var retrieveTime = new Date().getTime();

    User.getUserByMail(email, function (err, user) {
        if (!user) {
            return res.render('sign/pwd_reset', {
                title: '忘记密码? - ' + config.name,
                error: '对不起,没有这个电子邮箱。', email: email
            });
        }
        user.retrieve_key = retrieveKey;
        user.retrieve_time = retrieveTime;
        user.save(function (err) {
            if (err) {
                return next(err);
            }
            // 发送重置密码邮件
            mail.sendPwdModifyMail(email, retrieveKey, user.username);
            res.render('sign/pwd_reset', {
                title: '邮件已发送! - ' + config.name,
                success: '我们已给您填写的电子邮箱发送了一封邮件，请在2小时内点击里面的链接来重置密码。如果在几分钟内没有出现，请检查您的垃圾邮件。'
            });
        });
    });
};

/**
 * password modify
 * 'get' to show the page, 'post' to password modify.
 * after password modify, retrieve_key&time will be destroy.
 * @param  {http.req}   req
 * @param  {http.res}   res
 * @param  {Function}   next
 */
exports.getPwdModify = function (req, res, next) {
    var url = validator.trim(req.params.key || '');
    var key = url.split('&')[0];
    var name = url.split('&')[1];

    User.getUserByNameAndKey(name, key, function (err, user) {
        if (!user) {
            req.session._error = '信息有误，密码无法重置。您可尝试重新申请。';
            return res.redirect('/password_reset');
        }
        var now = new Date().getTime();
        var overTime = 1000 * 60 * 60 * 2; // 2个小时
        if (!user.retrieve_time || now - user.retrieve_time > overTime) {
            req.session._error = '该链接已过期，您可尝试重新申请。';
            return res.redirect('/password_reset');
        }
        return res.render('sign/pwd_reset', {
            title: '修改密码 - ' + config.name,
            url: url,
            name: name
        });
    });
};

exports.postPwdModify = function (req, res, next) {
    var pwd = validator.trim(req.body.pwd) || '';
    var rePwd = validator.trim(req.body.rePwd) || '';
    var url = validator.trim(req.params.key || '');
    var name = url.split('&')[1];
    var key = url.split('&')[0];

    var ep = new eventproxy();
    ep.fail(next);

    if (pwd !== rePwd) {
        return res.render('sign/pwd_reset', {
            title: '修改密码 - ' + config.name,
            name: name,
            url: url,
            error: '两次密码输入不一致。'
        });
    }
    User.getUserByNameAndKey(name, key, ep.done(function (user) {
        if (!user) {
            req.session._error = '错误的激活链接，您可尝试重新申请。';
            return res.redirect('/password_reset');
        }
        tools.bhash(pwd, ep.done(function (pwdHash) {
            user.password = pwdHash;
            user.retrieve_key = null;
            user.retrieve_time = null;
            user.active = true; // 用户激活

            user.save(function (err) {
                if (err) {
                    return next(err);
                }
                // 发送密码修改成功邮件
                mail.sendPwdSuccess(user.email, user.username);
                req.session._success = '您的密码已修改成功。请登录!';
                return res.redirect('/login');
            });
        }));
    }));
};

/**
 * mail modify
 * 'get' to show the page, 'post' to password modify.
 * after mail modify, retrieve_key&time will be destroy.
 * @param  {http.req}   req
 * @param  {http.res}   res
 * @param  {Function}   next
 */
exports.getMailModify = function (req, res, next) {
    var url = validator.trim(req.params.key || '');
    var key = url.split('&')[0];
    var name = url.split('&')[1];

    User.getUserByNameAndKey(name, key, function (err, user) {
        if (!user) {
            return res.render('sign/mail_reset', {
                title: '修改邮箱 - ' + config.name,
                error: '信息有误，邮箱无法修改。您可尝试重新申请。',
                serious: true
            });
        }
        var now = new Date().getTime();
        var overTime = 1000 * 60 * 60 * 2; // 2个小时
        if (!user.retrieve_time || now - user.retrieve_time > overTime) {
            return res.render('sign/mail_reset', {
                title: '修改邮箱 - ' + config.name,
                error: '该链接已过期，您可尝试重新申请。',
                serious: true
            });
        }
        return res.render('sign/mail_reset', {
            title: '修改邮箱 - ' + config.name,
            url: url
        });
    });
};

exports.postMailModify = function (req, res, next) {
    var mail = validator.trim(req.body.mail) || '';
    var pwd = req.body.password;
    var url = validator.trim(req.params.key || '');
    var name = url.split('&')[1];
    var key = url.split('&')[0];

    var ep = new eventproxy();
    ep.fail(next);

    if (!validator.isEmail(mail)) {
        return res.render('sign/mail_reset', {
            title: '修改邮箱 - ' + config.name,
            error: '邮箱不合法',
            url: url
        });
    }

    User.getUserByMail(mail, function (err, user) {
        if (user) {
            return res.render('sign/mail_reset', {
                title: '修改邮箱 - ' + config.name,
                error: '邮箱已存在！',
                url: url
            });
        }

        User.getUserByNameAndKey(name, key, ep.done(function (user) {
            if (!user) {
                return res.render('sign/mail_reset', {
                    title: '修改邮箱 - ' + config.name,
                    error: '错误的激活链接，您可尝试重新申请。',
                    serious: true
                });
            }
            var pwdHash = user.password;
            tools.bcompare(pwd, pwdHash, function (err, bool) {
                if (err) {
                    return next(err);
                }
                if (!bool) {
                    return res.render('sign/mail_reset', {
                        title: '修改邮箱 - ' + config.name,
                        error: '密码错误！',
                        url: url
                    });
                }
                user.retrieve_key = null;
                user.retrieve_time = null;
                user.email = mail;
                user.save(function (err) {
                    if (err) {
                        return next(err);
                    }
                    // 发送密码修改成功邮件
                    req.session._success = '您的邮箱已修改成功。请登录!';
                    return res.redirect('/login');
                });
            });
        }));

    });
};