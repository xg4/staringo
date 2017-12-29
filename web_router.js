/*!
 * staringo - route.js
 * Copyright(c) 2017 xingo4 <xingo4@icloud.com>
 * MIT Licensed
 */

/**
 * Module dependencies.
 */

var config = require('./config');

var express = require('express');
var sign = require('./controllers/sign');
var site = require('./controllers/site');
var user = require('./controllers/user');
var message = require('./controllers/message');
var topic = require('./controllers/topic');
var reply = require('./controllers/reply');
var auth = require('./middlewares/auth');
var search = require('./controllers/search');
var tab = require('./controllers/tab');
var admin = require('./controllers/admin');

var router = express.Router();

/**
 * home page
 */
router.get('/', site.index);

/**
 * sign controller
 */
router.get('/join', sign.getJoin);  // 注册页面
router.get('/login', sign.getLogin);  // 登录页面

router.post('/check_username', sign.checkUsername); // ajax check username
router.post('/check_email', sign.checkEmail); // ajax check username

router.post('/join', sign.postJoin);  // 提交注册信息
router.post('/login', sign.postLogin);  // 登录校验

router.get('/logout', sign.logout);  // 登出

router.get('/active_account/:key', sign.activeAccount);  // 帐号激活

router.get('/password_reset', sign.getPwdReset);  // 密码重置页面
router.post('/password_reset', sign.postPwdReset);  // 发送密码重置邮件
router.get('/password_reset/:key', sign.getPwdModify);  // 进入重置密码页面
router.post('/password_reset/:key', sign.postPwdModify);  // 更新密码

router.get('/mail_reset/:key', sign.getMailModify);  // 进入重置邮箱页面
router.post('/mail_reset/:key', sign.postMailModify);  // 更新邮箱

/**
 * user controller
 */
router.get('/user/:name', user.index); // 用户个人主页
router.get('/user/:name/topics', user.listTopics);  // 用户发布的所有话题页
router.get('/user/:name/replies', user.listReplies); // 用户回复的所有话题页
router.get('/user/:name/collections', user.listCollections);  // 用户收藏的所有话题页
router.get('/user/:name/following', user.listFollowing);  // 用户关注的所有用户
router.get('/user/:name/followers', user.listFollowers);  // 用户被那些人关注了

router.get('/users/top100', user.top100);  // 显示积分前一百用户页

router.post('/ajax/user/:user_id', user.ajaxUser); // ajax user hover

router.post('/user/:name/follow', auth.userRequired, user.follow);
router.post('/user/:name/de_follow', auth.userRequired, user.de_follow);

//settings
router.get('/settings', auth.userRequired, function (req, res, next) {
    res.redirect('/settings/profile')
}); // 用户个人设置页
router.get('/settings/profile', auth.userRequired, user.getProfile); // 用户个人设置页
router.post('/settings/profile', auth.userRequired, user.postProfile); // 提交 用户个人资料

router.get('/settings/account', auth.userRequired, user.getAccount); //  用户 账户信息
router.post('/settings/account', auth.userRequired, user.postAccount); //  用户 账户信息

router.get('/settings/privacy', auth.userRequired, user.getPrivacy); //  用户 隐私信息
router.post('/settings/privacy', auth.userRequired, user.postPrivacy); //  用户 隐私信息

router.get('/settings/email', auth.userRequired, user.getEmail); //  用户 邮箱信息
router.post('/settings/email', auth.userRequired, user.postEmail); //  用户 邮箱信息

router.get('/settings/avatar', auth.userRequired, user.getAvatar); //  用户 头像信息
router.post('/settings/avatar', auth.userRequired, user.postAvatar); //  用户 头像信息

router.post('/user/:name/star', auth.adminRequired, user.star); // 把某用户设为达人
router.post('/user/:name/block', auth.adminRequired, user.block);  // 禁言某用户
router.post('/user/:name/verify', auth.adminRequired, user.verify);  // 认证某用户
// router.post('/user/:name/delete_all', auth.adminRequired, user.deleteAll);  // 删除某用户所有发言

/**
 * topic controller
 */

router.get('/topic/create', auth.userRequired, topic.create); //get 新建 topic
router.post('/topic/create', auth.userRequired, topic.put); //post 新建 topic

router.get('/topic/:tid', topic.index);  // 显示 topic

router.get('/topic/:tid/edit', auth.userRequired, topic.edit);  // 编辑话题
router.post('/topic/:tid/edit', auth.userRequired, topic.update); // 提交 编辑

router.post('/topic/:tid/collect', auth.postUserRequired, topic.collect); // 收藏话题
router.post('/topic/:tid/de_collect', auth.postUserRequired, topic.de_collect); // 取消收藏话题

router.post('/topic/:tid/delete', auth.postUserRequired, topic.delete); // 删除主题

router.post('/topic/:tid/collections', topic.listCollections); // 收藏话题的用户

router.post('/topic/:tid/up', auth.postUserRequired, topic.up); // 点赞话题

router.post('/topic/:tid/lock', auth.userRequired, topic.lock); // 锁定话题
router.post('/topic/:tid/top', auth.userRequired, topic.top);
router.post('/topic/:tid/good', auth.userRequired, topic.good);
/**
 * reply controller
 */
router.post('/reply/:tid', auth.userRequired, reply.add); // 提交 回复
router.post('/reply/:reply_id/edit', auth.postUserRequired, reply.update); // 修改某评论
router.post('/reply/:reply_id/delete', auth.postUserRequired, reply.delete); // 删除某评论
router.post('/reply/:reply_id/up', auth.postUserRequired, reply.up); // 为评论点赞
router.post('/reply/:reply_id/ups', reply.ups); // 显示 点赞用户信息
/**
 * message controller
 */
router.get('/messages', auth.userRequired, message.index); // 用户个人的所有消息页

/**
 * search controller
 */
router.get('/search', search.index);

/**
 * tab controller
 */
router.get('/tabs', tab.index);
router.get('/tab/:tab_id', tab.topics);
router.post('/tab/:tab_id/collect', tab.collect);

/* game */
//five
router.get('/game/five', function (req, res, next) {
    res.render('game/five', {
        title: '五子棋 - ' + config.name
    });
});
//aircraft
router.get('/game/aircraft', function (req, res, next) {
    res.render('game/aircraft', {
        title: '飞机大战 - ' + config.name
    });
});
//arkanoid
router.get('/game/arkanoid', function (req, res, next) {
    res.render('game/arkanoid', {
        title: '打砖块 - ' + config.name
    });
});
/**
 * admin controller
 */
router.get('/admin', auth.adminRequired, admin.index);
router.get('/admin/tabs', auth.adminRequired, admin.getTabs);
router.get('/admin/topics', auth.adminRequired, admin.getTopics);
router.get('/admin/users', auth.adminRequired, admin.getUsers);
router.get('/admin/replies', auth.adminRequired, admin.getReplies);

module.exports = router;