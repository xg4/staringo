var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = Schema.Types.ObjectId;
var BaseModel = require("./base_model");

var UserSchema = new Schema({
    // 基本信息
    username: {type: String}, // 用户名
    nickname: {type: String}, // 昵称
    password: {type: String}, // 密码
    email: {type: String}, // 邮箱
    location: {type: String}, // 地址
    signature: {type: String}, // 签名
    avatar: {type: String, default: '/public/images/user/icon/default-avatar.jpg'}, // 头像
    gender: {type: Number, default: -1}, // 性别 1男 0女 -1保密
    birthday: {type: Date}, // 出生日期

    is_admin:{type: Boolean, default: false}, // 是否为管理员
    is_block: {type: Boolean, default: false}, // 是否被屏蔽

    create_at: {type: Date, default: Date.now}, // 创建时间
    update_at: {type: Date, default: Date.now}, // 更新时间

    //用户产生的数据
    score: {type: Number, default: 0}, // 积分
    level: {type: String}, // 等级

    topic_count: {type: Number, default: 0},
    reply_count: {type: Number, default: 0},
    collect_topic_count: {type: Number, default: 0},
    following_count: {type: Number, default: 0}, // 关注的人数
    follower_count: {type: Number, default: 0}, // 被关注的人数

    is_star: {type: Boolean, default: false},
    is_verify: {type: Boolean, default: false},

    active: {type: Boolean, default: false}, // 是否激活

    // verify pwd modify info
    retrieve_time: {type: Number},
    retrieve_key: {type: String},

    accessToken: {type: String}
});

UserSchema.plugin(BaseModel);
UserSchema.virtual('isAdvanced').get(function () {
    // 积分高于 700 则认为是高级用户
    return this.score > 700 || this.is_star;
});

UserSchema.index({username: 1}, {unique: true});
UserSchema.index({email: 1}, {unique: true});
UserSchema.index({score: -1});
UserSchema.index({accessToken: 1});

UserSchema.pre('save', function (next) {
    this.update_at = new Date();
    next();
});

mongoose.model('User', UserSchema);

/*done*/