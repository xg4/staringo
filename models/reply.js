var mongoose = require('mongoose');
var BaseModel = require("./base_model");
var Schema = mongoose.Schema;
var ObjectId = Schema.Types.ObjectId;

var ReplySchema = new Schema({
    content: {type: String},
    topic: {type: ObjectId, ref: 'Topic'},
    author: {type: ObjectId, ref: 'User'},
    reply: {type: ObjectId, ref: 'Reply'},
    create_at: {type: Date, default: Date.now},
    update_at: {type: Date, default: Date.now},
    content_is_html: {type: Boolean},
    ups: [{type:ObjectId, ref: 'User'}],
    up_count: {type: Number, default: 0},
    deleted: {type: Boolean, default: false}
});

ReplySchema.plugin(BaseModel);
ReplySchema.index({topic: 1});
ReplySchema.index({author: 1, create_at: -1});

mongoose.model('Reply', ReplySchema);

/*done*/