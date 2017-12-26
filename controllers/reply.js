/*!
 * staringo - controllers/reply.js
 * Copyright(c) 2017 xingo4 <xingo4@icloud.com>
 * MIT Licensed
 */

/**
 * Module dependencies.
 */

var validator = require('validator');
var _ = require('lodash');
var at = require('../common/at');
var message = require('../common/message');
var EventProxy = require('eventproxy');
var User = require('../proxy').User;
var Topic = require('../proxy').Topic;
var Reply = require('../proxy').Reply;
var Follow = require('../proxy').Follow;
var config = require('../config');

/**
 * 添加回复
 */
exports.add = function (req, res, next) {
    var content = req.body.reply_content;
    var topic_id = req.params.tid;
    var reply_id = req.body.reply_id;

    var str = validator.trim(String(content));
    if (str === '') {
        return res.renderError('回复内容不能为空!', 422);
    }

    var ep = new EventProxy();
    ep.fail(next);

    Topic.getTopic(topic_id, ep.doneLater(function (topic) {
        if (!topic) {
            ep.unbind();
            // just 404 page
            return next();
        }

        if (topic.lock) {
            return res.renderError('此主题已锁定。', '403');
        }
        ep.emit('topic_edit', topic);
    }));

    ep.on('topic_edit', function (topic) {
        User.getUserById(topic.author, ep.done('topic_author'));
    });

    ep.all('topic_edit', 'topic_author', function (topic, topicAuthor) {
        Reply.newAndSave(content, topic_id, req.session.user._id, reply_id, ep.done(function (reply) {
            Topic.updateLastReply(topic_id, reply._id, ep.done(function () {
                ep.emit('reply_saved', reply);
                //发送at消息，并防止重复 at 作者
                var newContent = content.replace('@' + topicAuthor.username + ' ', '');
                at.sendMessageToMentionUsers(newContent, topic_id, req.session.user._id, reply._id);
            }));
        }));

        User.getUserById(req.session.user._id, ep.done(function (user) {
            user.score += 5;
            user.reply_count += 1;
            user.save();
            req.session.user = user;
            ep.emit('score_saved');
        }));
    });

    ep.all('reply_saved', 'topic_edit', function (reply, topic) {
        if (topic.author.toString() !== req.session.user._id.toString()) {
            message.sendReplyMessage(topic.author, req.session.user._id, topic._id, reply._id);
        }
        ep.emit('message_saved');
    });

    ep.all('reply_saved', 'message_saved', 'score_saved', function (reply) {
        res.redirect('/topic/' + topic_id + '#' + reply._id);
    });
};

/**
 * 提交修改的回复
 */
exports.update = function (req, res, next) {
    var reply_id = req.params.reply_id;
    var content = req.body.reply_content;

    Reply.getReplyById(reply_id, function (err, reply) {
        if (!reply) {
            return res.render404('此回复不存在或已被删除。');
        }
        console.log(reply.author._id.toString());
        if (reply.author._id.toString() === req.session.user._id.toString() || req.session.user.is_admin) {

            if (content.trim().length > 0) {
                reply.content = content;
                reply.update_at = new Date();
                reply.save(function (err) {
                    if (err) {
                        return next(err);
                    }
                    res.redirect('/topic/' + reply.topic + '#' + reply._id);
                });
            } else {
                return res.renderError('回复的字数太少。', 400);
            }
        } else {
            return res.renderError('对不起，你不能编辑此回复。', 403);
        }
    });
};

/**
 * 删除回复信息
 */
exports.delete = function (req, res, next) {
    var reply_id = req.params.reply_id;
    Reply.getReplyById4Delete(reply_id, function (err, reply) {
        if (err) {
            return next(err);
        }

        if (!reply) {
            return res.json({status: false, msg: '没有找到该回复 （' + reply_id + '） 可能已被删除！'});
        }

        if (reply.author._id.toString() === req.session.user._id.toString() || req.session.user.is_admin) {
            reply.deleted = true;
            reply.save();
            res.json({status: true, msg: '删除成功！'});

            reply.author.score -= 5;
            reply.author.reply_count -= 1;
            reply.author.save();
        } else {
            return res.json({status: false, msg: '删除失败！'});
        }

        Topic.reduceCount(reply.topic, _.noop);
    });
};

exports.up = function (req, res, next) {
    var replyId = req.params.reply_id;
    var userId = req.session.user._id;
    Reply.getReplyById(replyId, function (err, reply) {
        if (err) {
            return next(err);
        }

        var action;
        reply.ups = reply.ups || [];
        var upIndex = reply.ups.indexOf(userId);
        if (upIndex === -1) {
            reply.ups.push(userId);
            action = 'up';
        } else {
            reply.ups.splice(upIndex, 1);
            action = 'down';
        }
        reply.up_count = reply.ups.length;
        reply.save(function () {
            return res.json({
                status: true,
                action: action,
                ups: reply.ups.length
            });
        });

    });
};

exports.ups = function (req, res, next) {
    var replyId = req.params.reply_id;
    var currentUser = req.session.user;
    Reply.getReplyById4Ups(replyId, function (err, ups) {
        if (err) {
            return next(err);
        }
        if (!ups) {
            return res.json({status: false, msg: '不存在！'})
        }
        var ep = EventProxy();
        ep.fail(next);
        ep.after('is_follow', ups.length, function () {
            res.json({
                status: true,
                currentUser: currentUser,
                ups: users
            });
        });
        var users = [];
        ups.forEach(function (up, idx) {
            users[idx] = [];
            if (!currentUser) {
                users[idx][0] = up;
                users[idx][1] = {current_is_follow: null};
                ep.emit('is_follow');
            } else {
                Follow.getFollow(currentUser._id, up._id, ep.done('is_follow', function (doc) {
                    if (doc) {
                        users[idx][1] = {current_is_follow: doc};
                    } else {
                        users[idx][1] = {current_is_follow: null};
                    }
                    users[idx][0] = up;
                }));
            }
        });
    });
};