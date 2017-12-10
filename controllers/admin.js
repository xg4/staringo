var config = require('../config');
var EventProxy = require('eventproxy');
var validator = require('validator');
var Topic = require('../proxy').Topic;
var User = require('../proxy').User;
var Follow = require('../proxy').Follow;
var Tab = require('../proxy').Tab;
var TopicCollect = require('../proxy').TopicCollect;

exports.index = function (req, res, next) {
    res.render('admin/index', {
        title: '后台管理 - ' + config.name
    });
};

exports.getTab = function (req, res, next) {
    res.render('admin/tab_edit', {
        title: '后台管理 - ' + config.name
    });
};

exports.postTab = function (req, res, next) {
    var tabName = validator.trim(req.body.tabName);

    Tab.getTabByName(tabName, function (err, tab) {
        var tab_err;
        if (err) {
            return next(err)
        }
        if (tab) {
            tab_err = '该话题已存在！'
        }
        if (tab_err) {
            return res.render('admin/tab_edit', {
                title: '后台管理 - ' + config.name,
                tab_err: tab_err
            });
        }
    })
};