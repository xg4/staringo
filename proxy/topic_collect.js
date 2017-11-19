var TopicCollect = require('../models').TopicCollect;
var _ = require('lodash');

exports.getTopicCollect = function (userId, topicId, callback) {
    TopicCollect.findOne({user: userId, topic: topicId}, callback);
};

exports.getCollectionsByTopicId = function (topicId, callback) {
    TopicCollect
        .find({topic: topicId}, '', {sort: '-create_at'})
        .populate('user')
        .exec(callback);
};

exports.getTopicCollectsByUserId = function (userId, opt, callback) {
    var defaultOpt = {sort: '-create_at'};
    opt = _.assign(defaultOpt, opt);
    TopicCollect.find({user: userId}, '', opt)
        .populate({
            path: 'topic',
            populate: {path: 'author'}
        })
        .exec(callback);
};

exports.getCountByQuery = function (query, callback) {
    TopicCollect.count(query, callback);
};

exports.newAndSave = function (userId, topicId, callback) {
    var topic_collect = new TopicCollect();
    topic_collect.user = userId;
    topic_collect.topic = topicId;
    topic_collect.save(callback);
};

exports.remove = function (userId, topicId, callback) {
    TopicCollect.remove({user: userId, topic: topicId}, callback);
};

/*done*/