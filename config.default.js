/**
 * config
 */

var path = require('path');

var config = {
    // debug 为 true 时，用于本地调试
    debug: true,


    name: 'x', // 社区名字
    description: 'x', // 社区描述
    keywords: 'x', // 社区关键字

    logo: '/public/images/x.svg', // 社区logo

    // 社区的域名
    host: 'localhost',

    // mongodb 配置
    db: 'mongodb://127.0.0.1/staringo_dev',

    session_secret: 'x', // 务必修改
    auth_cookie_name: 'x',

    // 程序运行的端口
    port: 80,

    log_dir: path.join(__dirname, 'logs'), // 日志存放路径

    // 社区邮箱配置
    mail_opts: {
        host: 'smtp.126.com',
        port: 25,
        auth: {
            user: 'club@126.com',
            pass: 'club'
        },
        ignoreTLS: true
    }
};

if (process.env.NODE_ENV === 'test') {
    config.db = 'mongodb://127.0.0.1/node_club_test';
}

module.exports = config;
