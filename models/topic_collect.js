var mongoose = require('mongoose');
var BaseModel = require("./base_model");
var Schema = mongoose.Schema;
var ObjectId = Schema.Types.ObjectId;

var TopicCollectSchema = new Schema({
    user: {type: ObjectId, ref: 'User'},
    topic: {type: ObjectId, ref: 'Topic'},
    create_at: {type: Date, default: Date.now}
});

TopicCollectSchema.plugin(BaseModel);
TopicCollectSchema.index({user: 1, topic: 1}, {unique: true});

mongoose.model('TopicCollect', TopicCollectSchema);

/*done*/