var mongoose = require('mongoose');
var BaseModel = require("./base_model");
var Schema = mongoose.Schema;
var ObjectId = Schema.Types.ObjectId;
var config = require('../config');
var _ = require('lodash');

var TopicSchema = new Schema({
    tab: {type: ObjectId, ref: 'Tab'},
    title: {type: String},
    content: {type: String},
    author: {type: ObjectId, ref: 'User'},
    top: {type: Boolean, default: false}, // 置顶帖
    good: {type: Boolean, default: false}, // 精华帖
    lock: {type: Boolean, default: false}, // 被锁定主题
    reply_count: {type: Number, default: 0},
    visit_count: {type: Number, default: 0},
    collect_count: {type: Number, default: 0},
    create_at: {type: Date, default: Date.now}, // 创建时间
    update_at: {type: Date, default: Date.now}, // 更新时间

    ups: [{type: ObjectId, ref: 'User'}],

    last_reply: {type: ObjectId, ref: 'User'},  // 最后一个回复 的用户
    last_reply_at: {type: Date, default: Date.now}, // 最后一个回复 的时间

    content_is_html: {type: Boolean},
    deleted: {type: Boolean, default: false}
});

TopicSchema.plugin(BaseModel);
TopicSchema.index({create_at: -1});
TopicSchema.index({top: -1, last_reply_at: -1});
TopicSchema.index({author: 1, create_at: -1});

mongoose.model('Topic', TopicSchema);

/*done*/