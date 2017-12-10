/*!
 * staringo - controllers/topic.js
 * Copyright(c) 2017 xingo4 <xingo4@icloud.com>
 * MIT Licensed
 */

/**
 * Module dependencies.
 */

var validator = require('validator');
var at = require('../common/at');
var User = require('../proxy').User;
var Topic = require('../proxy').Topic;
var TopicCollect = require('../proxy').TopicCollect;
var Follow = require('../proxy').Follow;
var Tab = require('../proxy').Tab;
var EventProxy = require('eventproxy');
var tools = require('../common/tools');
/*var store = require('../common/store');*/
var config = require('../config');
var _ = require('lodash');
/*var cache = require('../common/cache');*/
var logger = require('../common/logger');

/**
 * Topic page
 *
 * @param  {HttpRequest} req
 * @param  {HttpResponse} res
 * @param  {Function} next
 */
exports.index = function (req, res, next) {
    function isUped(user, reply) {
        /*if (!reply.ups) {
            return false;
        }
        return reply.ups.indexOf(user._id) !== -1;*/
        return false;
    }

    var topic_id = req.params.tid;
    var currentUser = req.session.user;

    if (topic_id.length !== 24) {
        return res.render404('此话题不存在!');
    }
    var events = ['topic_edit', 'other_topics', 'no_reply_topics', 'is_collect', 'is_follow'];
    var ep = new EventProxy();
    ep.all(events, function (topic, other_topics, no_reply_topics, is_collect, is_follow) {
        res.render('topic/index', {
            title: topic.title + ' - ' + config.name,
            topic: topic,
            author_other_topics: other_topics,
            no_reply_topics: no_reply_topics,
            is_uped: isUped,
            is_collect: is_collect,
            is_follow: is_follow
        });
    });

    ep.fail(next);

    Topic.getFullTopic(topic_id, ep.done(function (message, topic, author, replies, tab) {
        if (message) {
            logger.error('getFullTopic error topic_id: ' + topic_id);
            return res.renderError(message);
        }

        topic.visit_count += 1;
        topic.save();

        topic.author = author;
        topic.replies = replies;
        topic.tab = tab;

        if (!currentUser) {
            ep.emit('is_follow', null);
        } else {
            Follow.getFollow(currentUser._id, author._id, ep.done('is_follow'))
        }

        // 点赞数排名第三的回答，它的点赞数就是阈值
        topic.reply_up_threshold = (function () {
            var allUpCount = replies.map(function (reply) {
                return reply.ups && reply.ups.length || 0;
            });
            allUpCount = _.sortBy(allUpCount, Number).reverse();

            var threshold = allUpCount[2] || 0;
            if (threshold < 3) {
                threshold = 3;
            }
            return threshold;
        })();

        ep.emit('topic_edit', topic);

        // get other_topics
        var options = {limit: 5, sort: '-last_reply_at'};
        var query = {author: topic.author._id, _id: {'$nin': [topic._id]}};
        Topic.getTopicsByQuery(query, options, ep.done('other_topics'));

        // get no_reply_topics
        /*cache.get('no_reply_topics', ep.done(function (no_reply_topics) {
            if (no_reply_topics) {
                ep.emit('no_reply_topics', no_reply_topics);
            } else {
                Topic.getTopicsByQuery(
                    {reply_count: 0, tab: {$nin: ['job', 'dev']}},
                    {limit: 5, sort: '-create_at'},
                    ep.done('no_reply_topics', function (no_reply_topics) {
                        cache.set('no_reply_topics', no_reply_topics, 60 * 1);
                        return no_reply_topics;
                    }));
            }
        }));*/
        ep.emit('no_reply_topics', null);
    }));

    if (!currentUser) {
        ep.emit('is_collect', null);
    } else {
        TopicCollect.getTopicCollect(currentUser._id, topic_id, ep.done('is_collect'))
    }


};

/**
 * topic create page
 */
exports.create = function (req, res, next) {
    res.render('topic/edit', {
        title: '发布话题 - ' + config.name,
        topic: ''
    });
};

/**
 * post topic create
 */
exports.put = function (req, res, next) {
    var title = validator.trim(req.body.topic_title);
    var tabName = validator.trim(req.body.topic_tab);
    var content = validator.trim(req.body.topic_content);

    var currentUser = req.session.user;

    // 验证
    var editError;

    if (title === '') {
        editError = '标题不能是空的。'
    } else if (title.length < 5 || title.length > 100) {
        editError = '标题字数太多或太少。'
    } else if (!tabName) {
        editError = '必须选择一个话题。'
    } else if (content === '') {
        editError = '内容不可为空'
    }
    // END 验证

    // 整合数据
    var format_topic = {
        title: title,
        content: content,
        tab: tabName
    };

    if (editError) {
        res.status(422);
        return res.render('topic/edit', {
            title: '发布话题 - ' + config.name,
            edit_error: editError,
            topic: format_topic
        });
    }

    var ep = new EventProxy();
    ep.on('tab_saved', function (tab) {
        Topic.newAndSave(title, content, tab, req.session.user._id, function (err, topic) {
            if (err) {
                return next(err);
            }

            var proxy = new EventProxy();

            proxy.all('score_saved', function () {
                res.redirect('/topic/' + topic._id);
            });
            proxy.fail(next);
            User.getUserById(req.session.user._id, proxy.done(function (user) {
                user.score += 5;
                user.topic_count += 1;
                user.save();
                req.session.user = user;
                proxy.emit('score_saved');
            }));

            //发送at消息
            at.sendMessageToMentionUsers(content, topic._id, req.session.user._id);
        });
    });

    Tab.getTabByName(tabName, function (err, tab) {
        if (err) {
            return next(err)
        }
        if (!tab) {
            Tab.newAndSave(tabName, currentUser._id, ep.done('tab_saved'))
        } else {
            ep.emit('tab_saved', tab)
        }
    });

};

/**
 * topic edit page
 */
exports.edit = function (req, res, next) {
    var topic_id = req.params.tid;

    Topic.getTopicById(topic_id, function (err, topic, tab) {
        if (!topic) {
            return res.render404('此话题不存在或已被删除。');
        }

        if (String(topic.author) === String(req.session.user._id) || req.session.user.is_admin) {

            // 整合数据
            var format_topic = {
                _id: topic._id,
                title: topic.title,
                content: topic.content,
                tab: tab
            };

            res.render('topic/edit', {
                title: '编辑话题 - ' + config.name,
                action: 'edit',
                topic: format_topic
            });

        } else {
            res.renderError('对不起，你不能编辑此话题。', 403);
        }
    });
};

/**
 * post topic edit
 */
exports.update = function (req, res, next) {
    var topic_id = req.params.tid;
    var title = req.body.topic_title;
    var tabName = req.body.topic_tab;
    var content = req.body.topic_content;

    var currentUser = req.session.user;

    Topic.getTopicById(topic_id, function (err, topic, tags) {
        if (!topic) {
            return res.render404('此话题不存在或已被删除。');
        }

        if (topic.author.equals(currentUser._id) || currentUser.is_admin) {
            title = validator.trim(title);
            tabName = validator.trim(tabName);
            content = validator.trim(content);


            // 验证
            var editError;
            if (title === '') {
                editError = '标题不能是空的。';
            } else if (title.length < 5 || title.length > 100) {
                editError = '标题字数太多或太少。';
            } else if (!tabName) {
                editError = '必须写一个话题。';
            }
            // END 验证
            var format_topic = {
                _id: topic._id,
                content: content,
                title: title,
                tab: tabName
            };

            if (editError) {
                return res.render('topic/edit', {
                    title: '编辑话题 - ' + config.name,
                    action: 'edit',
                    edit_error: editError,
                    topic: format_topic
                });
            }

            var ep = new EventProxy();
            ep.fail(next);
            ep.on('tab_saved', function (tab) {

                //保存话题
                topic.title = title;
                topic.content = content;
                topic.tab = tab;
                topic.update_at = new Date();

                topic.save(function (err) {
                    if (err) {
                        return next(err);
                    }
                    //发送at消息
                    at.sendMessageToMentionUsers(content, topic._id, req.session.user._id);

                    res.redirect('/topic/' + topic._id);

                });

            });

            Tab.getTabByName(tabName, function (err, tab) {
                if (err) {
                    next(err)
                }
                if (!tab) {
                    Tab.newAndSave(tabName, currentUser._id, ep.done('tab_saved'))
                } else {
                    ep.emit('tab_saved', tab)
                }
            });

        } else {
            res.renderError('对不起，你不能编辑此话题。', 403);
        }
    });
};

/**
 * post topic delete
 */
exports.delete = function (req, res, next) {
    //删除话题, 话题作者topic_count减1
    //删除回复，回复作者reply_count减1
    //删除topic_collect，用户collect_topic_count减1

    var topic_id = req.params.tid;

    Topic.getFullTopic(topic_id, function (err, err_msg, topic, author, replies) {
        if (err) {
            return res.json({status: false, msg: err.message});
        }
        if (!topic) {
            return res.json({status: false, msg: '此话题不存在或已被删除。'});
        }
        if (!req.session.user.is_admin && !(topic.author.equals(req.session.user._id))) {
            return res.json({status: false, msg: '无权限'});
        }

        author.score -= 5;
        author.topic_count -= 1;
        author.save();

        topic.deleted = true;
        topic.save(function (err) {
            if (err) {
                return res.json({status: false, msg: err.message});
            }
            res.json({status: true, msg: '话题已被删除。'});
        });
    });
};

/**
 * post topic collect
 */
exports.collect = function (req, res, next) {
    var topic_id = req.params.tid;

    Topic.getTopic(topic_id, function (err, topic) {
        if (err) {
            return next(err);
        }
        if (!topic) {
            res.json({status: false, msg: '文章不存在！'});
        }

        TopicCollect.getTopicCollect(req.session.user._id, topic._id, function (err, doc) {
            if (err) {
                return next(err);
            }
            if (doc) {
                res.json({status: false, msg: '文章已收藏!'});
                return;
            }

            TopicCollect.newAndSave(req.session.user._id, topic._id, function (err) {
                if (err) {
                    return next(err);
                }
                res.json({status: true, msg: '文章收藏成功！'});
            });
            User.getUserById(req.session.user._id, function (err, user) {
                if (err) {
                    return next(err);
                }
                user.collect_topic_count += 1;
                user.save();
            });

            req.session.user.collect_topic_count += 1;
            topic.collect_count += 1;
            topic.save();
        });
    });
};

/**
 * post delete topic collect
 */
exports.de_collect = function (req, res, next) {
    var topic_id = req.params.tid;
    Topic.getTopic(topic_id, function (err, topic) {
        if (err) {
            return next(err);
        }
        if (!topic) {
            return res.json({status: false, msg: '文章不存在！'});
        }
        TopicCollect.remove(req.session.user._id, topic._id, function (err, removeResult) {
            if (err) {
                return next(err);
            }
            if (removeResult.result.n == 0) {
                return res.json({status: false, msg: '文章的收藏已被取消！'})
            }

            User.getUserById(req.session.user._id, function (err, user) {
                if (err) {
                    return next(err);
                }
                user.collect_topic_count -= 1;
                req.session.user = user;
                user.save();
            });

            topic.collect_count -= 1;
            topic.save();

            res.json({status: true, msg: '取消文章收藏成功！'});
        });
    });
};

/**
 * get collections list
 */
exports.listCollections = function (req, res, next) {
    var topic_id = req.params.tid;
    var currentUser = req.session.user;
    Topic.getTopic(topic_id, function (err, topic) {
        if (err) {
            return next(err);
        }
        if (!topic) {
            return res.json({status: false, msg: '文章不存在！'});
        }
        TopicCollect.getCollectionsByTopicId(topic_id, function (err, doc) {
            if (err) {
                next(err);
            }
            if (!doc) {
                return res.json({status: false, msg: '没有收藏者！'});
            }

            var collections = [];
            var ep = new EventProxy();
            ep.fail(next);
            ep.after('is_follow', doc.length, function () {

                res.json({
                    status: true,
                    currentUser: currentUser,
                    collections: collections
                });
            });
            doc.map(function (d, idx) {

                Follow.getFollow(currentUser._id, d.user._id, ep.done('is_follow', function (doc) {
                    collections[idx] = [];
                    if (doc) {
                        collections[idx][1] = {current_is_follow: doc};
                    } else {
                        collections[idx][1] = {current_is_follow: null};
                    }
                    collections[idx][0] = d.user;
                }));


            });

        });
    });
};

/*
*  topic up
* */
exports.up = function (req, res, next) {
    var topicId = req.params.tid;
    var userId = req.session.user._id;
    Topic.getTopicById(topicId, function (err, topic) {
        if (err) {
            return next(err);
        }
        var action;
        topic.ups = topic.ups || [];
        var upIndex = topic.ups.indexOf(userId);
        if (upIndex === -1) {
            topic.ups.push(userId);
            action = 'up';
        } else {
            topic.ups.splice(upIndex, 1);
            action = 'down';
        }
        topic.save(function () {
            return res.json({
                status: true,
                action: action,
                ups: topic.ups.length
            });
        });

    });
};