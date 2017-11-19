var config = require('../config');
var Message = require('../proxy').Message;
var EventProxy = require('eventproxy');

exports.index = function (req, res, next) {
    var user_id = req.session.user._id;
    var page = Number(req.query.page) || 1;

    var ep = new EventProxy();
    ep.fail(next);
    ep.all('all_msg', 'pages', function (all_msg, pages) {
        /*var epfill = new EventProxy();
        epfill.after('msg_read', all_msg.length, function (arg1) {

        });*/

        all_msg = all_msg.filter(function (msg) {
            return msg.topic && msg.author && msg.reply && msg.master
        });

        res.render('message/index', {
            title: '消息中心 - ' + config.name,
            all_msg: all_msg,
            page: page,
            pages: pages
        });
    });

    var limit = 5;//config.list_topic_count;
    var opt = {skip: (page - 1) * limit, limit: limit, sort: '-create_at'};
    Message.getAllMessagesByUserId(user_id, opt, ep.done('all_msg'));

    Message.getCountByQuery({master: user_id}, ep.done(function (all_msg_count) {
        var pages = Math.ceil(all_msg_count / limit);
        ep.emit('pages', pages);
    }));
};

/*
exports.index = function (req, res, next) {
    var user_id = req.session.user._id;
    var page = Number(req.query.page) || 1;
    var limit = config.list_topic_count;
    var ep = new EventProxy();
    ep.fail(next);

    ep.all('has_read_messages', 'hasnot_read_messages', function (has_read_messages, hasnot_read_messages) {

        res.render('message/index', {
            title: '消息中心 - ' + config.name,
            has_read_messages: has_read_messages,
            hasnot_read_messages: hasnot_read_messages
        });
    });

    ep.all('has_read', 'unread', function (has_read, unread) {
        [has_read, unread].forEach(function (msgs, idx) {
            var epfill = new eventproxy();
            epfill.fail(next);
            epfill.after('message_ready', msgs.length, function (docs) {
                docs = docs.filter(function (doc) {
                    return !doc.is_invalid;
                });
                ep.emit(idx === 0 ? 'has_read_messages' : 'hasnot_read_messages', docs);
            });
            msgs.forEach(function (doc) {
                Message.getMessageRelations(doc, epfill.group('message_ready'));
            });
        });

        Message.updateMessagesToRead(user_id, unread);
    });

    Message.getReadMessagesByUserId(user_id, ep.done('has_read'));
    Message.getUnreadMessageByUserId(user_id, ep.done('unread'));
};*/
