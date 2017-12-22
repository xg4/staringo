var config = require('../config');
var EventProxy = require('eventproxy');
var Tab = require('../proxy').Tab;
var Topic = require('../proxy').Topic;
var TopicCollect = require('../proxy').TopicCollect;

exports.index = function (req, res, next) {
    var page = Number(req.query.page) || 1;
    var limit = 16;

    var query = {};
    var opt = {skip: (page - 1) * limit, limit: limit, sort: '-collect_count'};

    var proxy = new EventProxy();
    proxy.fail(next);
    proxy.on('pages', function (pages) {
        Tab.getTabByQuery(query, opt, function (err, tabs) {
            var ep = new EventProxy();
            ep.fail(next);
            ep.after('tab_topic_count', tabs.length, function () {
                res.render('tab/index', {
                    title: '话题中心 - ' + config.name,
                    tabs: tabs,
                    page: page,
                    pages: pages
                })
            });
            tabs.forEach(function (tab) {
                Topic.getCountByQuery({tab: tab}, function (err, all_count) {
                    if (err) {
                        return next(err)
                    }
                    tab.topic_count = all_count;
                    ep.emit('tab_topic_count');
                })
            });
        });

    });

    Tab.getCountByQuery(query, proxy.done(function (all_tabs_count) {
        var pages = Math.ceil(all_tabs_count / limit);
        proxy.emit('pages', pages);
    }));

};

exports.show = function (req, res, next) {
    var tabId = req.params.tab_id;
    var currentUser = req.session.user;

    var page = Number(req.query.page) || 1;
    var limit = config.list_topic_count;

    Tab.getTabById(tabId, function (err, tab) {
        if (err) {
            return next(err)
        }
        if (!tab) {
            return res.render404('该话题不存在。');
        }
        var query = {tab: tab};
        var opt = {skip: (page - 1) * limit, limit: limit, sort: '-top -last_reply_at'};

        var proxy = new EventProxy();
        proxy.fail(next);
        proxy.all('topics_read', 'pages', 'tab_topic_count', 'is_collect', function (topics, pages, tab_topic_count) {
            tab.topic_count = tab_topic_count;
            res.render('tab/topic', {
                title: tab.name + ' - ' + config.name,
                tab: tab,
                topics: topics,
                pages: pages,
                page: page
            })
        });

        Topic.getTopicsByQuery(query, opt, proxy.done(function (topics) {
            var ep = new EventProxy();
            ep.fail(next);

            ep.after('is_collect', topics.length, function () {
                proxy.emit('is_collect')
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
            proxy.emit('topics_read', topics);
        }));

        Topic.getCountByQuery(query, proxy.done(function (all_count) {
            var pages = Math.ceil(all_count / limit);
            proxy.emit('pages', pages);
            proxy.emit('tab_topic_count', all_count);
        }));
    });

};