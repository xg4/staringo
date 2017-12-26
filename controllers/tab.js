var config = require('../config');
var EventProxy = require('eventproxy');
var Tab = require('../proxy').Tab;
var Topic = require('../proxy').Topic;
var TopicCollect = require('../proxy').TopicCollect;

exports.index = function (req, res, next) {
    var page = Number(req.query.page) || 1;
    var limit = 9;
    var currentUser = req.session.user;

    var tab_type = req.query.tab_type || 'hot';

    var query = {};
    var opt;

    if (tab_type === 'time') {
        opt = {skip: (page - 1) * limit, limit: limit, sort: '-create_at'};
    } else {
        opt = {skip: (page - 1) * limit, limit: limit, sort: '-collect_count'};
    }

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
                    pages: pages,
                    tab_type:tab_type
                })
            });
            tabs.forEach(function (tab) {
                if (currentUser) {
                    var upIndex = tab.collectors.indexOf(currentUser._id);
                    if (upIndex === -1) {
                        tab.is_collect = false;
                    } else {
                        tab.is_collect = true;
                    }
                } else {
                    tab.is_collect = false;
                }
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

exports.topics = function (req, res, next) {
    var tabId = req.params.tab_id;
    var currentUser = req.session.user;
    var page = Number(req.query.page) || 1;
    var limit = config.list_topic_count;
    var topic_type = req.query.topic_type || 'time';

    Tab.getTabById(tabId, function (err, tab) {
        if (err) {
            return next(err)
        }
        if (!tab) {
            return res.render404('该话题不存在。');
        }
        var query;
        var opt = {skip: (page - 1) * limit, limit: limit, sort: '-top -last_reply_at'};
        if (topic_type === 'good') {
            query = {tab: tab, good: true};
        } else if (topic_type === 'hot') {
            query = {tab: tab};
            opt = {skip: (page - 1) * limit, limit: limit, sort: '-top -up_count -last_reply_at'};
        } else {
            query = {tab: tab};
        }

        var proxy = new EventProxy();
        proxy.fail(next);
        proxy.all('topics_read', 'pages', 'tab_topic_count', 'is_collect', 'tab_is_collect', function (topics, pages, tab_topic_count) {
            tab.topic_count = tab_topic_count;
            res.render('tab/topic', {
                title: tab.name + ' - ' + config.name,
                tab: tab,
                topics: topics,
                pages: pages,
                page: page,
                topic_type: topic_type,
                tab_is_collect: tab_is_collect
            })
        });

        var tab_is_collect;
        if (currentUser) {
            var upIndex = tab.collectors.indexOf(currentUser._id);
            if (upIndex === -1) {
                tab_is_collect = false;
            } else {
                tab_is_collect = true;
            }
            proxy.emit('tab_is_collect')
        } else {
            tab_is_collect = false;
            proxy.emit('tab_is_collect')
        }

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

exports.collect = function (req, res, next) {
    var tabId = req.params.tab_id;
    var currentUser = req.session.user;
    if (!currentUser) {
        return res.json({status: false, msg: '对不起，您还没登录，不能进行此操作！'});
    }
    Tab.getTabById(tabId, function (err, tab) {
        if (err) {
            return next(err);
        }
        var action;
        tab.collectors = tab.collectors || [];
        var upIndex = tab.collectors.indexOf(currentUser._id);
        if (upIndex === -1) {
            tab.collectors.push(currentUser._id);
            action = 'up';
        } else {
            tab.collectors.splice(upIndex, 1);
            action = 'down';
        }
        tab.collect_count = tab.collectors.length;
        tab.save(function () {
            return res.json({
                status: true,
                action: action,
                collectors: tab.collect_count
            });
        });

    });
};