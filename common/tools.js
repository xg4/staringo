var bcrypt = require('bcryptjs');
var moment = require('moment');

moment.locale('zh-cn'); // 使用中文

// 格式化时间
exports.formatDate = function (date, friendly) {
    date = moment(date);

    if (friendly) {
        return date.fromNow();
    } else {
        return date.format('YYYY-MM-DD HH:mm');
    }

};

// 用户名验证
exports.validateId = function (str) {
    return (/^[a-zA-Z][a-zA-Z0-9_]*$/i).test(str);
};

// hash
exports.bhash = function (str, callback) {
    bcrypt.hash(str, 10, callback);
};

// compare hash
exports.bcompare = function (str, hash, callback) {
    bcrypt.compare(str, hash, callback);
};

/*done*/