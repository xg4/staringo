var EventProxy = require('eventproxy');
var models = require('../models');
var Topic = models.Topic;
var User = require('./user');
var Reply = require('./reply');
var Tab = require('./tab');
var tools = require('../common/tools');
var at = require('../common/at');
var _ = require('lodash');

/**
 * 获取关键词能搜索到的主题数量
 * Callback:
 * - err, 数据库错误
 * - count, 主题数量
 * @param {String} query 搜索关键词
 * @param {Function} callback 回调函数
 */
exports.getCountByQuery = function (query, callback) {
    query.deleted = false;
    Topic.count(query, callback);
};

/**
 * 更新主题的最后回复信息
 * @param {String} topicId 主题ID
 * @param {String} replyId 回复ID
 * @param {Function} callback 回调函数
 */
exports.updateLastReply = function (topicId, replyId, callback) {
    Topic.findOne({_id: topicId}, function (err, topic) {
        if (err || !topic) {
            return callback(err);
        }
        topic.last_reply = replyId;
        topic.last_reply_at = new Date();
        topic.reply_count += 1;
        topic.save(callback);
    });
};

/**
 * 根据主题ID，查找一条主题
 * @param {String} id 主题ID
 * @param {Function} callback 回调函数
 */
exports.getTopic = function (id, callback) {
    Topic.findOne({_id: id}, callback);
};

/**
 * 根据关键词，获取主题列表
 * Callback:
 * - err, 数据库错误
 * - count, 主题列表
 * @param {String} query 搜索关键词
 * @param {Object} opt 搜索选项
 * @param {Function} callback 回调函数
 */
exports.getTopicsByQuery = function (query, opt, callback) {
    query.deleted = false;
    Topic.find(query, {}, opt, function (err, topics) {
        if (err) {
            return callback(err);
        }
        if (topics.length === 0) {
            return callback(null, []);
        }

        var proxy = new EventProxy();
        proxy.after('topic_ready', topics.length, function () {
            topics = _.compact(topics); // 删除不合规的 topic
            return callback(null, topics);
        });
        proxy.fail(callback);

        topics.forEach(function (topic, i) {
            var ep = new EventProxy();
            ep.all('author', 'reply', 'tab', function (author, reply, tab) {
                // 保证顺序
                // 作者可能已被删除
                if (author) {
                    topic.author = author;
                    topic.reply = reply;
                    topic.tab = tab;
                } else {
                    topics[i] = null;
                }
                proxy.emit('topic_ready');
            });

            User.getUserById(topic.author, ep.done('author'));
            Tab.getTabById(topic.tab, ep.done('tab'));
            // 获取主题的最后回复
            Reply.getReplyById(topic.last_reply, ep.done('reply'));
        });
    });
};

/**
 * 根据关键词，获取主题列表
 * Callback:
 * - err, 数据库错误
 * - count, 主题列表
 * @param {String} query 搜索关键词
 * @param {Object} opt 搜索选项
 * @param {Function} callback 回调函数
 */
exports.getTopicsByQuery4Search = function (query, opt, callback) {
    Topic.find(query, {}, opt)
        .populate(['author', 'tab'])
        .exec(function (err, topics) {
            if (err) {
                return callback(err);
            }
            var proxy = new EventProxy();
            proxy.fail(callback);
            proxy.after('topics', topics.length, function () {
                topics = _.compact(topics);
                return callback(null, topics);
            });
            topics.map(function (topic, i) {
                if (!topic.author) {
                    topics[i] = null;
                }
                proxy.emit('topics');
            });

        });
};

/**
 * 获取关键词能搜索到的主题数量
 * Callback:
 * - err, 数据库错误
 * - count, 主题数量
 * @param {String} query 搜索关键词
 * @param {Function} callback 回调函数
 */
exports.getCountByQuery4Search = function (query, callback) {
    Topic.count(query, callback);
};

/**
 * 根据主题ID,获取主题 (除去被删除的)
 * Callback:
 * - err, 数据库错误
 * - topic, 主题
 * - author, 作者
 * - lastReply, 最后回复
 * @param {String} id 主题ID
 * @param {Function} callback 回调函数
 */
exports.getTopicById = function (id, callback) {
    var proxy = new EventProxy();
    var events = ['topic_edit', 'author', 'last_reply', 'tab'];
    proxy.all(events, function (topic, author, last_reply, tab) {
        if (!author) {
            return callback(null, null, null, null);
        }
        return callback(null, topic, tab, author, last_reply);
    }).fail(callback);

    Topic.findOne({_id: id}, proxy.done(function (topic) {
        if (!topic) {
            proxy.emit('topic_edit', null);
            proxy.emit('author', null);
            proxy.emit('last_reply', null);
            proxy.emit('tab', null);
            return;
        }
        proxy.emit('topic_edit', topic);

        User.getUserById(topic.author, proxy.done('author'));

        Tab.getTabById(topic.tab, proxy.done('tab'));

        if (topic.last_reply) {
            Reply.getReplyById(topic.last_reply, proxy.done(function (last_reply) {
                proxy.emit('last_reply', last_reply);
            }));
        } else {
            proxy.emit('last_reply', null);
        }
    }));
};

/**
 * 获取所有信息的主题
 * Callback:
 * - err, 数据库异常
 * - message, 消息
 * - topic, 主题
 * - author, 主题作者
 * - replies, 主题的回复
 * @param {String} id 主题ID
 * @param {Function} callback 回调函数
 */
exports.getFullTopic = function (id, callback) {
    var proxy = new EventProxy();
    var events = ['topic_edit', 'author', 'replies', 'tab'];
    proxy
        .all(events, function (topic, author, replies, tab) {
            callback(null, '', topic, author, replies, tab);
        })
        .fail(callback);

    Topic.findOne({_id: id, deleted: false}, proxy.done(function (topic) {
        if (!topic) {
            proxy.unbind();
            return callback(null, '此话题不存在或已被删除!');
        }
        at.linkUsers(topic.content, proxy.done('topic', function (str) {
            topic.linkedContent = str;
            return topic;
        }));
        proxy.emit('topic_edit', topic);

        User.getUserById(topic.author, proxy.done(function (author) {
            if (!author) {
                proxy.unbind();
                return callback(null, '文章的作者被删除。');
            }
            proxy.emit('author', author);
        }));

        Tab.getTabById(topic.tab, proxy.done(function (tab) {
            if (!tab) {
                proxy.unbind();
                return callback(null, '文章的话题被删除。');
            }
            proxy.emit('tab', tab);
        }));

        Reply.getRepliesByTopicId(topic._id, {sort: 'create_at'}, proxy.done('replies'));
    }));
};

/**
 * 将当前主题的回复计数减1，并且更新最后回复的用户，删除回复时用到
 * @param {String} id 主题ID
 * @param {Function} callback 回调函数
 */
exports.reduceCount = function (id, callback) {
    Topic.findOne({_id: id}, function (err, topic) {
        if (err) {
            return callback(err);
        }

        if (!topic) {
            return callback(new Error('该主题不存在'));
        }
        topic.reply_count -= 1;

        Reply.getLastReplyByTopId(id, function (err, reply) {
            if (err) {
                return callback(err);
            }

            if (reply.length !== 0) {
                topic.last_reply = reply[0]._id;
            } else {
                topic.last_reply = null;
            }

            topic.save(callback);
        });

    });
};

exports.newAndSave = function (title, content, tab, authorId, callback) {
    var topic = new Topic();
    topic.title = title;
    topic.content = content;
    topic.tab = tab;
    topic.author = authorId;

    topic.save(callback);
};