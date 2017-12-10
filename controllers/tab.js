var config = require('../config');
var EventProxy = require('eventproxy');
var Tab = require('../proxy').Tab;
var Topic = require('../proxy').Topic;

exports.index = function (req, res, next) {
    var page = Number(req.query.page) || 1;
    var limit = 10;

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
        proxy.all('topics_read', 'pages', 'tab_topic_count',function (topics, pages,tab_topic_count) {
            tab.topic_count = tab_topic_count;
            res.render('tab/topic', {
                title: tab.name + ' - ' + config.name,
                tab: tab,
                topics: topics,
                pages: pages,
                page: page
            })
        });

        Topic.getTopicsByQuery(query, opt, proxy.done('topics_read'));

        Topic.getCountByQuery(query, proxy.done(function (all_count) {
            var pages = Math.ceil(all_count / limit);
            proxy.emit('pages', pages);
            proxy.emit('tab_topic_count',all_count);
        }));
    });

};