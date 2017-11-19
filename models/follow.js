var mongoose = require('mongoose');
var BaseModel = require("./base_model");
var Schema = mongoose.Schema;
var ObjectId = Schema.Types.ObjectId;

var FollowSchema = new Schema({
    user: {type: ObjectId, ref: 'User'},
    following: {type: ObjectId, ref: 'User'},
    create_at: {type: Date, default: Date.now}
});

FollowSchema.plugin(BaseModel);
FollowSchema.index({user: 1, following: 1}, {unique: true});

mongoose.model('Follow', FollowSchema);

/*done*/