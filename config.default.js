/**
 * config
 */

var path = require('path');

var config = {
    // debug 为 true 时，用于本地调试
    debug: true,

   /* get mini_assets() {
        return !this.debug;
    }, // 是否启用静态文件的合并压缩，详见视图中的Loader*/

    name: 'x', // 社区名字
    description: 'x', // 社区的描述
    keywords: 'x',

    site_logo: '/public/images/x.svg', // default is `name`

    // cdn host，如 http://cnodejs.qiniudn.com
    site_static_host: '', // 静态文件存储域名
    // 社区的域名
    host: 'localhost',

    // mongodb 配置
    db: 'mongodb://127.0.0.1/node_club_dev',

    session_secret: 'x', // 务必修改
    auth_cookie_name: 'x',

    // 程序运行的端口
    port: 3000,

    log_dir: path.join(__dirname, 'logs'),

    // 邮箱配置
    mail_opts: {
        host: 'smtp.126.com',
        port: 25,
        auth: {
            user: 'club@126.com',
            pass: 'club'
        },
        ignoreTLS: true
    },

    // admin 可删除话题，编辑标签。把 user_login_name 换成你的登录名
    admins: {user_login_name: true},

    file_limit: '1MB',

    // 版块
    tabs: [
        ['share', '分享'],
        ['ask', '问答'],
        ['job', '招聘']
    ]
};

if (process.env.NODE_ENV === 'test') {
    config.db = 'mongodb://127.0.0.1/node_club_test';
}

module.exports = config;
