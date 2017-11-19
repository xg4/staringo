var Follow = require('../models').Follow;
var EventProxy = require('eventproxy');
var _ = require('lodash');

exports.getCountByQuery = function (query, callback) {
    Follow.count(query, callback);
};

exports.getFollowByUserId = function (userId, opt, callback) {
    var defaultOpt = {sort: '-create_at'};
    opt = _.assign(defaultOpt, opt);
    Follow.find({user: userId}, '', opt)
        .populate('following')
        .exec(function (err, follows) {
            if (err) {
                callback(err, null)
            }
            var proxy = new EventProxy();
            proxy.fail(callback);
            proxy.after('follows', follows.length, function () {
                follows = _.compact(follows);
                return callback(null, follows)
            });
            follows.map(function (follow, i) {
                if (!follow.following) {
                    follows[i] = null;
                }
                proxy.emit('follows');
            });
        });
};

exports.getFollowByFollowingId = function (followingId, opt, callback) {
    var defaultOpt = {sort: '-create_at'};
    opt = _.assign(defaultOpt, opt);
    Follow.find({following: followingId}, '', opt)
        .populate('user')
        .exec(function (err, follows) {
            if (err) {
                callback(err, null)
            }
            var proxy = new EventProxy();
            proxy.fail(callback);
            proxy.after('follows', follows.length, function () {
                follows = _.compact(follows);
                return callback(null, follows)
            });
            follows.map(function (follow, i) {
                if (!follow.user) {
                    follows[i] = null;
                }
                proxy.emit('follows');
            });
        });
};

exports.getFollow = function (userId, followingId, callback) {
    Follow.findOne({user: userId, following: followingId}, callback);
};

exports.remove = function (userId, followingId, callback) {
    Follow.remove({user: userId, following: followingId}, callback);
};

exports.newAndSave = function (userId, followingId, callback) {
    var follow = new Follow();
    follow.user = userId;
    follow.following = followingId;
    follow.save(callback);
};