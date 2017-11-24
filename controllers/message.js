var config = require('../config');
var Message = require('../proxy').Message;
var EventProxy = require('eventproxy');

exports.index = function (req, res, next) {
    var user_id = req.session.user._id;
    var page = Number(req.query.page) || 1;

    var ep = new EventProxy();
    ep.fail(next);
    ep.all('all_msg', 'pages', function (all_msg, pages) {

        all_msg = all_msg.filter(function (msg) {
            return msg.topic && msg.author && msg.reply && msg.master
        });

        var hasnot_read_msg = [];
        all_msg.forEach(function (msg, i, all_msg) {
            if (!msg.topic || !msg.author || !msg.reply || !msg.master) {
                all_msg.splice(i, 1);
            }
            if (!msg.has_read) {
                hasnot_read_msg.push(msg);
            }
        });

        Message.updateMessagesToRead(user_id, hasnot_read_msg);

        res.render('message/index', {
            title: '消息中心 - ' + config.name,
            all_msg: all_msg,
            page: page,
            pages: pages
        });
    });

    var limit = 5;//config.list_topic_count;
    var opt = {skip: (page - 1) * limit, limit: limit, sort: 'has_read -create_at'};
    Message.getAllMessagesByUserId(user_id, opt, ep.done('all_msg'));

    Message.getCountByQuery({master: user_id}, ep.done(function (all_msg_count) {
        var pages = Math.ceil(all_msg_count / limit);
        ep.emit('pages', pages);
    }));
};