var config = require('../config');
var EventProxy = require('eventproxy');
var validator = require('validator');
var Topic = require('../proxy').Topic;
var User = require('../proxy').User;
var Reply = require('../proxy').Reply;
var Follow = require('../proxy').Follow;
var Tab = require('../proxy').Tab;
var TopicCollect = require('../proxy').TopicCollect;

exports.index = function (req, res, next) {
    res.render('admin/index', {
        title: '后台管理 - ' + config.name
    });
};

exports.getUsers = function (req, res, next) {
    var page = Number(req.query.page) || 1;
    var limit = config.list_topic_count;
    var currentUser = req.session.user;

    var proxy = new EventProxy();
    proxy.fail(next);
    proxy.all('users', 'pages', function (users, pages) {
        res.render('admin/users', {
            title: '后台管理 - ' + config.name,
            users: users,
            page: page,
            pages: pages,
            action: 'users'
        });
    });

    var query = '';
    var opt = {skip: (page - 1) * limit, limit: limit, sort: '-create_at'};
    User.getUsersByQuery(query, opt, proxy.done(function (users) {
        proxy.emit('users', users)
    }));

    User.getCountByQuery(query, proxy.done(function (all_users_count) {
        var pages = Math.ceil(all_users_count / limit);
        proxy.emit('pages', pages)
    }));

};

exports.getTopics = function (req, res, next) {
    var page = Number(req.query.page) || 1;
    var limit = config.list_topic_count;
    var currentUser = req.session.user;

    var proxy = new EventProxy();
    proxy.fail(next);
    proxy.all('topics', 'pages', function (topics, pages) {
        res.render('admin/topics', {
            title: '后台管理 - ' + config.name,
            topics: topics,
            page: page,
            pages: pages,
            action: 'topics'
        });
    });

    var query = '';
    var opt = {skip: (page - 1) * limit, limit: limit, sort: '-create_at'};
    Topic.getTopicsByQuery(query, opt, proxy.done(function (topics) {
        proxy.emit('topics', topics)
    }));

    Topic.getCountByQuery(query, proxy.done(function (all_users_count) {
        var pages = Math.ceil(all_users_count / limit);
        proxy.emit('pages', pages)
    }));

};

exports.getTabs = function (req, res, next) {

    var page = Number(req.query.page) || 1;
    var limit = config.list_topic_count;
    var currentUser = req.session.user;

    var proxy = new EventProxy();
    proxy.fail(next);
    proxy.all('tabs', 'pages', function (tabs, pages) {
        res.render('admin/tabs', {
            title: '后台管理 - ' + config.name,
            tabs: tabs,
            page: page,
            pages: pages,
            action: 'tabs'
        });
    });

    var query = '';
    var opt = {skip: (page - 1) * limit, limit: limit, sort: '-create_at'};
    Tab.getTabByQuery(query, opt, proxy.done(function (tabs) {
        proxy.emit('tabs', tabs)
    }));

    Tab.getCountByQuery(query, proxy.done(function (all_users_count) {
        var pages = Math.ceil(all_users_count / limit);
        proxy.emit('pages', pages)
    }));
};

exports.getReplies = function (req, res, next) {
    var page = Number(req.query.page) || 1;
    var limit = config.list_topic_count;
    var currentUser = req.session.user;

    var proxy = new EventProxy();
    proxy.fail(next);
    proxy.all('replies', 'pages', function (replies, pages) {
        res.render('admin/replies', {
            title: '后台管理 - ' + config.name,
            replies: replies,
            page: page,
            pages: pages,
            action: 'replies'
        });
    });

    var query = '';
    var opt = {skip: (page - 1) * limit, limit: limit, sort: '-create_at'};
    Reply.getRepliesByQuery(query, opt, proxy.done(function (replies) {
        proxy.emit('replies', replies)
    }));

    Reply.getCountByQuery(query, proxy.done(function (all_users_count) {
        var pages = Math.ceil(all_users_count / limit);
        proxy.emit('pages', pages)
    }));
};