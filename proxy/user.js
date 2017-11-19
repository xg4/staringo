var models = require('../models');
var User = models.User;
var uuid = require('uuid');
var utility = require('utility');

/**
 * 根据用户ID,查找用户
 * Callback:
 * - err, 数据库异常
 * - user, 用户
 * @param {String} id 用户ID
 * @param {Function} callback 回调函数
 */
exports.getUserById = function (id, callback) {
    if (!id) {
        return callback();
    }
    User.findOne({_id: id}, callback);
};

/**
 * 根据用户名,查找用户
 * Callback:
 * - err, 数据库异常
 * - user, 用户
 * @param {String} username 用户名
 * @param {Function} callback 回调函数
 */
exports.getUserByUsername = function (username, callback) {
    User.findOne({'username': new RegExp('^' + username + '$', "i")}, callback);
};

/**
 * 根据邮箱，查找用户
 * Callback:
 * - err, 数据库异常
 * - user, 用户
 * @param {String} email 邮箱地址
 * @param {Function} callback 回调函数
 */
exports.getUserByMail = function (email, callback) {
    User.findOne({email: email}, callback);
};

/**
 * 根据查询条件，获取一个用户
 * Callback:
 * - err, 数据库异常
 * - user, 用户
 * @param {String} username 用户名
 * @param {String} key 激活码
 * @param {Function} callback 回调函数
 */
exports.getUserByNameAndKey = function (username, key, callback) {
    User.findOne({username: username, retrieve_key: key}, callback);
};

/**
 * 根据用户名列表,查找用户列表
 * Callback:
 * - err, 数据库异常
 * - users, 用户列表
 * @param {Array} names 用户名列表
 * @param {Function} callback 回调函数
 */
exports.getUsersByNames = function (names, callback) {
    if (names.length === 0) {
        return callback(null, []);
    }
    User.find({username: {$in: names}}, callback);
};

/**
 * 根据用户ID列表，获取一组用户
 * Callback:
 * - err, 数据库异常
 * - users, 用户列表
 * @param {Array} ids 用户ID列表
 * @param {Function} callback 回调函数
 */
exports.getUsersByIds = function (ids, callback) {
    User.find({'_id': {'$in': ids}}, callback);
};

/**
 * 根据关键字，获取一组用户
 * Callback:
 * - err, 数据库异常
 * - users, 用户列表
 * @param {String} query 关键字
 * @param {Object} opt 选项
 * @param {Function} callback 回调函数
 */
exports.getUsersByQuery = function (query, opt, callback) {
    User.find(query, '', opt, callback);
};

/**
 * 获取关键词能搜索到的用户数量
 * Callback:
 * - err, 数据库错误
 * - count, 主题数量
 * @param {String} query 搜索关键词
 * @param {Function} callback 回调函数
 */
exports.getCountByQuery = function (query, callback) {
    User.count(query, callback);
};

exports.newAndSave = function (username, password, email, active, callback) {
    var user = new User();
    user.username = username;
    user.password = password;
    user.email = email;
    user.active = active || false;
    user.accessToken = uuid.v4();

    user.save(callback);
};

/*done*/