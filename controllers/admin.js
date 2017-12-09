var config = require('../config');
var EventProxy = require('eventproxy');
var validator = require('validator');
var Topic = require('../proxy').Topic;
var User = require('../proxy').User;
var Follow = require('../proxy').Follow;
var TopicCollect = require('../proxy').TopicCollect;

exports.index = function (req, res, next) {
    res.render('admin/index', {
        title: '后台管理 - ' + config.name
    });
};