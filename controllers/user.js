/*!
 * staringo - controllers/user.js
 * Copyright(c) 2017 xingo4 <xingo4@icloud.com>
 * MIT Licensed
 */

/**
 * Module dependencies.
 */

var User = require('../proxy').User;
var Topic = require('../proxy').Topic;
var Reply = require('../proxy').Reply;
var TopicCollect = require('../proxy').TopicCollect;
var Follow = require('../proxy').Follow;
var utility = require('utility');
var util = require('util');
var TopicModel = require('../models').Topic;
var ReplyModel = require('../models').Reply;
var tools = require('../common/tools');
var config = require('../config');
var EventProxy = require('eventproxy');
var validator = require('validator');
var _ = require('lodash');

/**
 * ajax user info
 */
exports.ajaxUser = function (req, res, next) {
    var currentUser = req.session.user;
    var user_id = req.params.user_id;
    var is_follow;
    User.getUserById(user_id, function (err, user) {
        if (err) {
            next(err);
        }
        if (!user) {
            return res.json({status: false, msg: '没有该用户！'})
        }

        var ep = new EventProxy();
        ep.fail(next);
        ep.on('is_follow', function (is_follow) {
            return res.json({
                status: true,
                user: user,
                currentUser: currentUser,
                is_follow: is_follow
            });

        });
        if (!currentUser) {
            ep.emit('is_follow', null);
        } else {
            Follow.getFollow(currentUser._id, user_id, ep.done('is_follow'));
        }


    });

};

/**
 * user index page
 */
exports.index = function (req, res, next) {
    var username = req.params.name;
    var currentUser = req.session.user;

    User.getUserByUsername(username, function (err, user) {
        if (err) {
            return next(err);
        }
        if (!user) {
            return res.render404('该用户不存在。');
        }

        var proxy = new EventProxy();
        proxy.fail(next);
        proxy.all('is_follow', function (is_follow) {
            /* active info */
            var active_info = '';
            if (currentUser && currentUser._id.toString() === user._id.toString()) {
                active_info = '我的动态'
            } else {
                if (user.gender == 0) {
                    active_info = '她的动态'
                } else {
                    active_info = '他的动态'
                }
            }

            res.render('user/index', {
                title: user.username + ' - ' + config.name,
                active: 'index',
                active_info: active_info,
                user: user,
                is_follow: is_follow
            });
        });

        if (currentUser) {
            Follow.getFollow(currentUser._id, user._id, proxy.done('is_follow'));
        } else {
            proxy.emit('is_follow', null);
        }

        /*var proxy = new eventproxy();
        proxy.all('recent_topics', 'recent_replies', render);
        proxy.fail(next);

        var query = {author_id: user._id};
        var opt = {limit: 5, sort: '-create_at'};
        Topic.getTopicsByQuery(query, opt, proxy.done('recent_topics'));

        Reply.getRepliesByAuthorId(user._id, {limit: 20, sort: '-create_at'},
            proxy.done(function (replies) {

                var topic_ids = replies.map(function (reply) {
                    return reply.topic_id.toString()
                });
                topic_ids = _.uniq(topic_ids).slice(0, 5); //  只显示最近5条

                var query = {_id: {'$in': topic_ids}};
                var opt = {};
                Topic.getTopicsByQuery(query, opt, proxy.done('recent_replies', function (recent_replies) {
                    recent_replies = _.sortBy(recent_replies, function (topic) {
                        return topic_ids.indexOf(topic._id.toString())
                    });
                    return recent_replies;
                }));
            }));*/
    });
};

/**
 * user topics page
 */
exports.listTopics = function (req, res, next) {
    var username = req.params.name;
    var page = Number(req.query.page) || 1;
    var limit = 5;//config.list_topic_count;
    var currentUser = req.session.user;

    User.getUserByUsername(username, function (err, user) {
        if (err) {
            return next(err);
        }

        if (!user) {
            res.render404('这个用户不存在。');
            return;
        }

        var proxy = new EventProxy();
        proxy.fail(next);
        proxy.all('topics', 'pages', 'is_follow', function (topics, pages, is_follow) {
            /* active info */
            var active_info = '';
            if (currentUser && currentUser._id.toString() === user._id.toString()) {
                active_info = '我的文章'
            } else {
                if (user.gender == 0) {
                    active_info = '她的文章'
                } else {
                    active_info = '他的文章'
                }
            }

            res.render('user/topic', {
                title: user.username + ' - ' + config.name,
                active: 'topic',
                active_info: active_info,
                user: user,
                topics: topics,
                page: page,
                pages: pages,
                is_follow: is_follow
            });
        });


        var query = {'author': user._id};
        var opt = {skip: (page - 1) * limit, limit: limit, sort: '-create_at'};
        Topic.getTopicsByQuery(query, opt, proxy.done(function (topics) {
            var ep = new EventProxy();
            ep.fail(next);
            ep.after('topics_read', topics.length, function () {
                proxy.emit('topics', topics);
            });
            topics.map(function (topic) {
                if (currentUser) {
                    TopicCollect.getTopicCollect(currentUser._id, topic._id, function (err, is_collect) {
                        topic.current_is_collect = is_collect;
                        if (topic.ups.indexOf(currentUser._id) === -1) {
                            topic.current_is_up = null;
                        } else {
                            topic.current_is_up = true;
                        }
                        ep.emit('topics_read')
                    });
                } else {
                    ep.emit('topics_read')
                }
            });

        }));

        Topic.getCountByQuery(query, proxy.done(function (all_topics_count) {
            var pages = Math.ceil(all_topics_count / limit);
            proxy.emit('pages', pages);
        }));

        if (currentUser) {
            Follow.getFollow(currentUser._id, user._id, proxy.done('is_follow'));
        } else {
            proxy.emit('is_follow', null);
        }


    });
};

/**
 * user replies page
 */
exports.listReplies = function (req, res, next) {
    var username = req.params.name;
    var page = Number(req.query.page) || 1;
    var limit = 5;//config.list_topic_count;
    var currentUser = req.session.user;

    User.getUserByUsername(username, function (err, user) {
        if (err) {
            return next(err);
        }

        if (!user) {
            return res.render404('该用户不存在。');
        }

        var proxy = new EventProxy();
        proxy.fail(next);
        proxy.all('replies', 'pages', 'is_follow', function (replies, pages, is_follow) {
            /* active info */
            var active_info = '';
            if (currentUser && currentUser._id.toString() === user._id.toString()) {
                active_info = '我的回复'
            } else {
                if (user.gender == 0) {
                    active_info = '她的回复'
                } else {
                    active_info = '他的回复'
                }
            }

            res.render('user/reply', {
                title: user.username + ' - ' + config.name,
                active: 'reply',
                active_info: active_info,
                user: user,
                is_follow: is_follow,
                pages: pages,
                page: page,
                replies: replies
            });
        });

        Reply.getRepliesByAuthorId(user._id, proxy.done(function (replies) {
            proxy.emit('replies', replies);
        }));


        Reply.getCountByQuery({author: user._id}, proxy.done(function (all_replies_count) {
            var pages = Math.ceil(all_replies_count / limit);
            proxy.emit('pages', pages);
        }));

        if (currentUser) {
            Follow.getFollow(currentUser._id, user._id, proxy.done('is_follow'));
        } else {
            proxy.emit('is_follow', null);
        }

    });
};

/**
 * user collections page
 */
exports.listCollections = function (req, res, next) {
    var username = req.params.name;
    var page = Number(req.query.page) || 1;
    var limit = 5;//config.list_topic_count;
    var currentUser = req.session.user;

    User.getUserByUsername(username, function (err, user) {
        if (err) {
            return next(err);
        }

        if (!user) {
            return res.render404('该用户不存在。');
        }
        var proxy = new EventProxy();
        proxy.fail(next);
        proxy.all('topic_collect', 'pages', 'is_follow', function (collections, pages, is_follow) {
            /* active info */
            var active_info = '';
            if (currentUser && currentUser._id.toString() === user._id.toString()) {
                active_info = '我的收藏'
            } else {
                if (user.gender == 0) {
                    active_info = '她的收藏'
                } else {
                    active_info = '他的收藏'
                }
            }

            res.render('user/collect', {
                title: user.username + ' - ' + config.name,
                active: 'collect',
                active_info: active_info,
                user: user,
                collections: collections,
                pages: pages,
                page: page,
                is_follow: is_follow
            });
        });

        TopicCollect.getCountByQuery({user: user._id}, proxy.done(function (all_collect_count) {
            var pages = Math.ceil(all_collect_count / limit);
            proxy.emit('pages', pages)
        }));

        var opt = {skip: (page - 1) * limit, limit: limit, sort: '-create_at'};
        TopicCollect.getTopicCollectsByUserId(user._id, opt, function (err, collections) {
            var ep = new EventProxy();
            ep.fail(next);
            ep.after('topics_read', collections.length, function () {
                proxy.emit('topic_collect', collections)
            });
            collections.map(function (collect) {
                if (currentUser && collect.topic) {
                    TopicCollect.getTopicCollect(currentUser._id, collect.topic._id, function (err, is_collect) {
                        collect.topic.current_is_collect = is_collect;
                        if (collect.topic.ups.indexOf(currentUser._id) === -1) {
                            collect.topic.current_is_up = null;
                        } else {
                            collect.topic.current_is_up = true;
                        }
                        ep.emit('topics_read')
                    });
                } else {
                    ep.emit('topics_read')
                }
            });
        });

        if (currentUser) {
            Follow.getFollow(currentUser._id, user._id, proxy.done('is_follow'));
        } else {
            proxy.emit('is_follow', null);
        }

    });
};

/**
 * user following page
 */
exports.listFollowing = function (req, res, next) {
    var username = req.params.name;
    var page = Number(req.query.page) || 1;
    var limit = 5;//config.list_topic_count;
    var currentUser = req.session.user;

    User.getUserByUsername(username, function (err, user) {
        if (err) {
            return next(err);
        }

        if (!user) {
            return res.render404('这个用户不存在。');
        }
        var proxy = new EventProxy();
        proxy.fail(next);
        proxy.all('all_following', 'pages', 'is_follow', function (all_following, pages, is_follow) {
            /* active info */
            var active_info = '';
            if (currentUser && currentUser._id.toString() === user._id.toString()) {
                active_info = '我关注的人'
            } else {
                if (user.gender == 0) {
                    active_info = '她关注的人'
                } else {
                    active_info = '他关注的人'
                }
            }
            res.render('user/following', {
                title: user.username + ' - ' + config.name,
                active: 'following',
                active_info: active_info,
                user: user,
                following: all_following,
                page: page,
                pages: pages,
                is_follow: is_follow
            });
        });

        Follow.getCountByQuery({user: user._id}, proxy.done(function (all_following_count) {
            var pages = Math.ceil(all_following_count / limit);
            proxy.emit('pages', pages)
        }));

        var opt = {skip: (page - 1) * limit, limit: limit, sort: '-create_at'};
        Follow.getFollowByUserId(user._id, opt, function (err, all_following) {
            var ep = new EventProxy();
            ep.fail(next);
            ep.after('following_read', all_following.length, function () {
                proxy.emit('all_following', all_following)
            });
            all_following.map(function (f) {
                if (currentUser) {
                    Follow.getFollow(currentUser._id, f.following._id, ep.done(function (fo) {
                        f.following.current_is_follow = fo ? fo : null;
                        ep.emit('following_read')
                    }));
                } else {
                    ep.emit('following_read')
                }
            });
        });

        if (currentUser) {
            Follow.getFollow(currentUser._id, user._id, proxy.done('is_follow'));
        } else {
            proxy.emit('is_follow', null);
        }

    });
};

/**
 * user followers page
 */
exports.listFollowers = function (req, res, next) {
    var username = req.params.name;
    var page = Number(req.query.page) || 1;
    var limit = 5;//config.list_topic_count;
    var currentUser = req.session.user;

    User.getUserByUsername(username, function (err, user) {
        if (err) {
            return next(err);
        }

        if (!user) {
            return res.render404('这个用户不存在。');
        }

        var proxy = new EventProxy();
        proxy.fail(next);
        proxy.all('all_followers', 'pages', 'is_follow', function (all_followers, pages, is_follow) {
            /* active info */
            var active_info = '';
            if (currentUser && currentUser._id.toString() === user._id.toString()) {
                active_info = '关注我的人'
            } else {
                if (user.gender == 0) {
                    active_info = '关注她的人'
                } else {
                    active_info = '关注他的人'
                }
            }
            res.render('user/follower', {
                title: user.username + ' - ' + config.name,
                active: 'follower',
                active_info: active_info,
                user: user,
                follower: all_followers,
                page: page,
                pages: pages,
                is_follow: is_follow
            });
        });

        Follow.getCountByQuery({following: user._id}, proxy.done(function (all_followers_count) {
            var pages = Math.ceil(all_followers_count / limit);
            proxy.emit('pages', pages)
        }));

        var opt = {skip: (page - 1) * limit, limit: limit, sort: '-create_at'};
        Follow.getFollowByFollowingId(user._id, opt, function (err, all_followers) {
            var ep = new EventProxy();
            ep.fail(next);
            ep.after('follower_read', all_followers.length, function () {
                proxy.emit('all_followers', all_followers)
            });
            all_followers.map(function (f) {
                if (currentUser) {
                    Follow.getFollow(currentUser._id, f.user._id, ep.done(function (fo) {
                        f.user.current_is_follow = fo ? fo : null;
                        ep.emit('follower_read')
                    }));
                } else {
                    ep.emit('follower_read')
                }
            });
        });

        if (currentUser) {
            Follow.getFollow(currentUser._id, user._id, proxy.done('is_follow'));
        } else {
            proxy.emit('is_follow', null);
        }

    });
};

/**
 * user settings profile page
 */
exports.getProfile = function (req, res, next) {
    User.getUserById(req.session.user._id, function (err, user) {
        if (err) {
            return next(err);
        }
        res.render('user/setting/profile', {
            title: '个人中心 - ' + config.name,
            user: user
        });
    });
};

/**
 * user post settings profile
 */
exports.postProfile = function (req, res, next) {
    var signature = validator.trim(req.body.signature);
    var gender = req.body.gender;
    var location = validator.trim(req.body.location);
    var birthday = req.body.birthday;

    var ep = new EventProxy();
    ep.fail(next);

    ep.all('user', 'birthday_success', 'gender_success', function (user) {
        user.signature = signature;
        user.gender = gender;
        user.location = location;
        user.birthday = birthday;

        user.save();
        var success = '修改成功！';
        res.render('user/setting/profile', {
            title: '个人中心 - ' + config.name,
            success: success,
            user: user
        });
    });

    ep.all('edit_profile_error', 'user', function (error, user) {

        user.signature = signature;
        user.gender = gender;
        user.location = location;
        user.birthday = birthday;

        res.status(422);
        res.render('user/setting/profile', {
            title: '个人中心 - ' + config.name,
            error: error,
            user: user
        });
    });


    if (gender && !validator.isInt(gender, {gt: -2, lt: 2})) {
        ep.emit('edit_profile_error', '性别有误,请重新填写！');
    } else {
        ep.emit('gender_success');
    }
    if (birthday && !validator.isBefore(birthday)) {
        ep.emit('edit_profile_error', '生日有误,请重新填写！');
    } else {
        ep.emit('birthday_success');
    }
    User.getUserById(req.session.user._id, ep.done('user'));
};

/**
 * user settings account page
 */
exports.getAccount = function (req, res, next) {
    res.render('user/setting/account', {
        title: '个人中心 - ' + config.name
    });
};

/**
 * user post settings account
 */
exports.postAccount = function (req, res, next) {
    var oldPwd = validator.trim(req.body.oldPassword);
    var pwd = validator.trim(req.body.password);
    var rePwd = validator.trim(req.body.rePassword);

    var ep = new EventProxy();
    ep.fail(next);

    ep.on('pwd_error', function (error) {
        return res.render('user/setting/account', {
            title: '个人中心 - ' + config.name,
            error: error
        });
    });
    if ([pwd, rePwd].some(function (item) {
            return item === '';
        })) {
        return ep.emit('pwd_error', '新密码不能为空！');
    }
    if (pwd !== rePwd) {
        return ep.emit('pwd_error', '两次密码输入不一致！');
    }
    User.getUserById(req.session.user._id, ep.done(function (user) {
        if (!user) {
            return ep.emit('pwd_error', '用户不存在！');
        }
        tools.bcompare(oldPwd, user.password, ep.done(function (bool) {
            if (!bool) {
                return ep.emit('pwd_error', '原密码错误！');
            }
            tools.bhash(pwd, ep.done(function (pwdHash) {
                user.password = pwdHash;
                user.save();

                var success = '密码修改成功！';
                return res.render('user/setting/account', {
                    title: '个人中心 - ' + config.name,
                    success: success
                });
            }));
        }));
    }));

};

exports.follow = function (req, res, next) {
    var username = req.params.name;
    User.getUserByUsername(username, function (err, user) {
        if (err) {
            next(err);
        }
        if (!user) {
            return res.json({status: false, msg: '该用户不存在！'});
        }
        if (user._id.toString() === req.session.user._id.toString()) {
            return res.json({status: false, msg: '不能关注自己！'});
        }
        Follow.getFollow(req.session.user._id, user._id, function (err, doc) {
            if (err) {
                return next(err);
            }
            if (doc) {
                return res.json({status: false, msg: '该用户已关注!'});
            }

            Follow.newAndSave(req.session.user._id, user._id, function (err) {
                if (err) {
                    return next(err);
                }
                res.json({status: true, msg: '用户关注成功！'});

                user.follower_count += 1;
                user.save();

                User.getUserById(req.session.user._id, function (err, user) {
                    if (err) {
                        return next(err);
                    }
                    user.following_count += 1;
                    user.save();
                    req.session.user = user;
                });

            });
        });
    });
};

exports.de_follow = function (req, res, next) {
    var username = req.params.name;
    User.getUserByUsername(username, function (err, user) {
        if (err) {
            next(err);
        }
        if (!user) {
            return res.json({status: false, msg: '该用户不存在！'})
        }

        Follow.remove(req.session.user._id, user._id, function (err, removeResult) {
            if (err) {
                return next(err);
            }
            if (removeResult.result.n == 0) {
                return res.json({status: false, msg: '关注已被取消！'})
            }
            user.follower_count -= 1;
            user.save();

            User.getUserById(req.session.user._id, function (err, user) {
                if (err) {
                    return next(err);
                }
                user.following_count -= 1;
                req.session.user = user;
                user.save();
            });

            res.json({status: true, msg: '取消关注成功！'});
        });

    });
};

exports.top100 = function (req, res, next) {
    var opt = {limit: 100, sort: '-score'};
    User.getUsersByQuery({is_block: false}, opt, function (err, tops) {
        if (err) {
            return next(err);
        }

        res.render('top100', {
            title: 'top100 - ' + config.name,
            users: tops
        });
    });
};