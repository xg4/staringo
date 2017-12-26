var config = require('../config');
var mailer = require('nodemailer');
var smtpTransport = require('nodemailer-smtp-transport');
var transporter = mailer.createTransport(smtpTransport(config.mail_opts));
var async = require('async');
var util = require('util');
var logger = require('./logger');

var SITE_ROOT_URL = 'http://' + config.host;

/**
 * Send an email
 * @param {Object} data 邮件对象
 */
exports.sendMail = function (data) {

    // 重试5次
    async.retry({times: 5}, function (done) {
        transporter.sendMail(data, function (err) {
            if (err) {
                // 写为日志
                logger.error('send mail error', err, data);
                return done(err);
            }
            return done()
        });
    }, function (err) {
        if (err) {
            return logger.error('send mail finally error', err, data);
        }
        logger.info('send mail success', data)
    })
};

/**
 * 发送激活通知邮件
 * @param {String} who 接收人的邮件地址
 * @param {String} token 重置用的token字符串
 * @param {String} name 接收人的用户名
 */
exports.sendActiveMail = function (who, token, name) {
    var from = util.format('%s <%s>', config.name, config.mail_opts.auth.user);
    var to = who;
    var subject = config.name + '社区 - 帐号激活';
    var html = '<p>您好：' + name + '</p>' +
        '<p>我们收到您在' + config.name + '社区的注册信息，请点击下面的链接来激活帐户：</p>' +
        '<a href  = "' + SITE_ROOT_URL + '/active_account/' + token + '&' + name + '">激活链接</a>' +
        '<p>若您没有在' + config.name + '社区填写过注册信息，说明有人滥用了您的电子邮箱，请删除此邮件，我们对给您造成的打扰感到抱歉。</p>' +
        '<p>' + config.name + '社区</p>';

    exports.sendMail({
        from: from,
        to: to,
        subject: subject,
        html: html
    });
};

/**
 * 发送密码重置通知邮件
 * @param {String} who 接收人的邮件地址
 * @param {String} token 重置用的token字符串
 * @param {String} name 接收人的用户名
 */
exports.sendPwdModifyMail = function (who, token, name) {
    var from = util.format('%s <%s>', config.name, config.mail_opts.auth.user);
    var to = who;
    var subject = config.name + '社区 - 密码重置';
    var html = '<p>您好：' + name + '</p>' +
        '<p>我们收到您在' + config.name + '社区重置密码的请求，请在2小时内单击下面的链接来重置密码：</p>' +
        '<a href="' + SITE_ROOT_URL + '/password_reset/' + token + '&' + name + '">重置密码链接</a>' +
        '<p>若您没有在' + config.name + '社区填写过注册信息，说明有人滥用了您的电子邮箱，请删除此邮件，我们对给您造成的打扰感到抱歉。</p>' +
        '<p>' + config.name + '社区</p>';

    exports.sendMail({
        from: from,
        to: to,
        subject: subject,
        html: html
    });
};

/**
 * 发送密码重置成功的通知邮件
 * @param {String} who 接收人的邮件地址
 * @param {String} name 接收人的用户名
 */
exports.sendPwdSuccess = function (who, name) {
    var from = util.format('%s <%s>', config.name, config.mail_opts.auth.user);
    var to = who;
    var subject = config.name + '社区 - 密码已更改';
    var html = '<p>您好 ' + name + '，</p>' +
        '<p>我们想通知您，您的' + config.name + '社区密码已更改。</p>' +
        '<p>如果您没有执行此操作，您可以进入</p>' +
        '<a href="' + SITE_ROOT_URL + '/password_reset' + '">' + SITE_ROOT_URL + '/password_reset' + '</a>' +
        '<p>通过输入' + who +'来恢复访问。</p>' +
        '<p>' + config.name + '社区</p>';

    exports.sendMail({
        from: from,
        to: to,
        subject: subject,
        html: html
    });
};

/**
 * 发送邮箱重置通知邮件
 * @param {String} who 接收人的邮件地址
 * @param {String} token 重置用的token字符串
 * @param {String} name 接收人的用户名
 */
exports.sendMailModifyMail = function (who, token, name) {
    var from = util.format('%s <%s>', config.name, config.mail_opts.auth.user);
    var to = who;
    var subject = config.name + '社区 - 邮箱重置';
    var html = '<p>您好：' + name + '</p>' +
        '<p>我们收到您在' + config.name + '社区重置邮箱的请求，请在2小时内单击下面的链接来重置邮箱：</p>' +
        '<a href="' + SITE_ROOT_URL + '/mail_reset/' + token + '&' + name + '">重置邮箱链接</a>' +
        '<p>若您没有在' + config.name + '社区填写过注册信息，说明有人滥用了您的电子邮箱，请删除此邮件，我们对给您造成的打扰感到抱歉。</p>' +
        '<p>' + config.name + '社区</p>';

    exports.sendMail({
        from: from,
        to: to,
        subject: subject,
        html: html
    });
};