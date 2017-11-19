var config = require('../config');
var EventProxy = require('eventproxy');
var validator = require('validator');
var Topic = require('../proxy').Topic;
var User = require('../proxy').User;
var Follow = require('../proxy').Follow;
var TopicCollect = require('../proxy').TopicCollect;

exports.index = function (req, res, next) {
    var q = validator.trim(req.query.q || '');
    var type = req.query.type;
    var page = Number(req.query.page) || 1;
    var limit = 5;//config.list_topic_count;
    var currentUser = req.session.user;

    if (!q) {
        return res.render('search/index', {
            title: '搜索结果 - ' + config.name
        });
    }

    var all_type = ['topic', 'user'];

    if (all_type.indexOf(type) === -1) {
        type = 'topic';
    }

    if (type === 'topic') {
        (function () {
            var proxy = new EventProxy();
            proxy.fail(next);
            var event = ['topics_read', 'topics_pages'];
            proxy.all(event, function (topics, pages) {

                return res.render('search/index', {
                    title: q + ' - ' + '搜索结果 - ' + config.name,
                    q: q,
                    type: type,
                    topics: topics,
                    pages: pages,
                    page: page
                });
            });

            var query = {
                $or: [{
                    title: new RegExp(q + '+', "i"),
                    deleted: false
                }, {
                    content: new RegExp(q + '+', "i"),
                    deleted: false
                }]
            };
            var opt = {skip: (page - 1) * limit, limit: limit, sort: '-last_reply_at'};
            Topic.getTopicsByQuery4Search(query, opt, proxy.done(function (topics) {
                var ep = new EventProxy();
                ep.fail(next);
                ep.after('is_collect', topics.length, function () {
                    proxy.emit('topics_read', topics)
                });
                topics.map(function (topic) {
                    if (currentUser) {
                        TopicCollect.getTopicCollect(currentUser._id, topic._id, function (err, is_collect) {
                            topic.current_is_collect = is_collect;
                            if (topic.ups.indexOf(currentUser._id.toString()) === -1) {
                                topic.current_is_up = null;
                            } else {
                                topic.current_is_up = true;
                            }
                            ep.emit('is_collect')
                        });
                    } else {
                        topic.current_is_collect = null;
                        topic.current_is_up = null;
                        ep.emit('is_collect');
                    }
                });
            }));

            Topic.getCountByQuery4Search(query, proxy.done(function (all_topics_count) {
                var pages = Math.ceil(all_topics_count / limit);
                proxy.emit('topics_pages', pages);
            }));
        })();
    }

    if (type === 'user') {
        (function () {
            var proxy = new EventProxy();
            proxy.fail(next);
            var event = ['users_read', 'users_pages'];
            proxy.all(event, function (users, pages) {

                return res.render('search/index', {
                    title: q + ' - ' + '搜索结果 - ' + config.name,
                    q: q,
                    type: type,
                    users: users,
                    pages: pages,
                    page: page
                });
            });

            var query = {
                $or: [{
                    username: new RegExp(q + '+', "i")
                }, {
                    signature: new RegExp(q + '+', "i")
                }]
            };
            var opt = {skip: (page - 1) * limit, limit: limit};

            User.getUsersByQuery(query, opt, proxy.done(function (users) {
                var ep = new EventProxy();
                ep.fail(next);
                ep.after('is_follow', users.length, function () {
                    proxy.emit('users_read', users);
                });
                users.map(function (user) {
                    if (currentUser) {
                        Follow.getFollow(currentUser._id, user._id, ep.done(function (f) {
                            user.current_is_follow = f;
                            ep.emit('is_follow');
                        }));
                    } else {
                        user.current_is_follow = null;
                        ep.emit('is_follow');
                    }
                });

            }));

            User.getCountByQuery(query, proxy.done(function (all_users_count) {
                var pages = Math.ceil(all_users_count / limit);
                proxy.emit('users_pages', pages);
            }));
        })();
    }

};