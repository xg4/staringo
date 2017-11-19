var mongoose = require('mongoose');
var BaseModel = require("./base_model");
var Schema = mongoose.Schema;
var ObjectId = Schema.Types.ObjectId;

/*
 * type:
 * reply: xx 回复了你的话题
 * reply2: xx 在话题中回复了你
 * follow: xx 关注了你
 * at: xx ＠了你
 */

var MessageSchema = new Schema({
    type: {type: String},
    master: {type: ObjectId, ref: 'User'},
    author: {type: ObjectId, ref: 'User'},
    topic: {type: ObjectId, ref: 'Topic'},
    reply: {type: ObjectId, ref: 'Reply'},
    has_read: {type: Boolean, default: false},
    create_at: {type: Date, default: Date.now}
});
MessageSchema.plugin(BaseModel);
MessageSchema.index({master: 1, has_read: -1, create_at: -1});

mongoose.model('Message', MessageSchema);

/*done*/