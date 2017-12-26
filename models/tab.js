var mongoose = require('mongoose');
var BaseModel = require("./base_model");
var Schema = mongoose.Schema;
var ObjectId = Schema.Types.ObjectId;

var TabSchema = new Schema({
    name: {type: String},
    author: {type: ObjectId, ref: 'User'},

    collect_count: {type: Number, default: 0},
    collectors: [{type: ObjectId, ref: 'User'}],

    picture: {type: String, default: '/public/images/error_panfish.png'},

    create_at: {type: Date, default: Date.now}, // 创建时间
    update_at: {type: Date, default: Date.now} // 更新时间
});

TabSchema.plugin(BaseModel);
TabSchema.index({create_at: -1});

mongoose.model('Tab', TabSchema);

/*done*/