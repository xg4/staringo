/*!
 * staringo - site index controller.
 * Copyright(c) 2017 xingo4 <xingo4@icloud.com>
 * MIT Licensed
 */

/**
 * Module dependencies.
 */

var User = require('../proxy').User;
var Topic = require('../proxy').Topic;
var TopicCollect = require('../proxy').TopicCollect;
var config = require('../config');
var EventProxy = require('eventproxy');
//var cache        = require('../common/cache');
//var xmlbuilder   = require('xmlbuilder');
var renderHelper = require('../common/render_helper');
var _ = require('lodash');
var moment = require('moment');

exports.index = function (req, res, next) {
    var currentUser = req.session.user;
    var tab = req.query.tab;

    var query = {
        create_at: {$gte: moment().subtract(1, 'years').toDate()}
    };
    if(tab === 'good') {
        query.good = true;
    }

    var options = {sort: '-top -last_reply_at'};
    Topic.getTopicsByQuery(query, options, function (err, topics) {
        if (err) {
            next(err);
        }
        var ep = new EventProxy();
        ep.fail(next);

        ep.after('is_collect', topics.length, function () {
            res.render('index', {
                title: config.name,
                topics: topics
            });
        });

        topics.forEach(function (topic) {
            if (!currentUser) {
                topic.current_is_collect = null;
                topic.current_is_up = null;
                ep.emit('is_collect');
            } else {
                TopicCollect.getTopicCollect(currentUser._id, topic._id, function (err, is_collect) {
                    topic.current_is_collect = is_collect;
                    if (topic.ups.indexOf(currentUser._id) === -1) {
                        topic.current_is_up = null;
                    } else {
                        topic.current_is_up = true;
                    }
                    ep.emit('is_collect')
                });
            }
        });

    });


};