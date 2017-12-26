var userHover = function ($this, content) {
    if (!content) {
        content = '<div class="HoverCard-popoverTarget"><div class="HoverCard-container"><div class="HoverCard-loading"><div class="loader"></div></div></div></div>';
    }
    $this.popover({
        trigger: 'manual',
        placement: 'auto',
        html: true,
        content: content,
        template: '<div class="popover" role="tooltip"><div class="popover-content"></div></div>'
    }).on('mouseenter', function () {
        var hide;
        $this.popover('show');

        $this.on('mouseleave.popover', function () {
            hide = setTimeout(function () {
                $this.popover('hide');
            }, 100);
        });

        $this.data('bs.popover').$tip.on('mouseenter', function () {
            clearTimeout(hide);
        });
        $this.data('bs.popover').$tip.on('mouseleave', function () {
            $this.popover('hide');
        });
    });
};

var userInfo = function (user, currentUser, is_follow) {
    if (!user.signature) {
        user.signature = '该用户没有签名';
    }
    var btn = '<div class="HoverCard-btn-group"><button class="btn btn-info" type="button">关注</button><button class="btn btn-default" type="button"><span>发私信</span></button></div>';
    if (!currentUser || (user._id.toString() === currentUser._id.toString())) {
        btn = '';
    } else if (!is_follow) {
        btn = '<div class="HoverCard-btn-group"><button class="btn btn-primary User-follow-btn animated show" data-user="follow" data-username=' + user.username + '>关注</button><button class="btn btn-info User-de-follow-btn animated" data-user="de_follow" data-username=' + user.username + '>关注</button></div>';
    } else if (is_follow) {
        btn = '<div class="HoverCard-btn-group"><button class="btn btn-primary User-follow-btn animated" data-user="follow" data-username=' + user.username + '>关注</button><button class="btn btn-info User-de-follow-btn animated show" data-user="de_follow" data-username=' + user.username + '>关注</button></div>';
    }
    var infoItem = '';
    if ((user.is_star || user.score >= 700) && !user.is_verify) {
        infoItem = '<span><svg viewBox="0 0 20 20" class="Icon" width="16" height="16" aria-hidden="true"><title>用户标识</title><g fill="none" fill-rule="evenodd"><path d="M.64 11.39c1.068.895 1.808 2.733 1.66 4.113l.022-.196c-.147 1.384.856 2.4 2.24 2.278l-.198.016c1.387-.12 3.21.656 4.083 1.735l-.125-.154c.876 1.085 2.304 1.093 3.195.028l-.127.152c.895-1.068 2.733-1.808 4.113-1.66l-.198-.022c1.386.147 2.402-.856 2.28-2.238l.016.197c-.12-1.388.656-3.212 1.735-4.084l-.154.125c1.084-.876 1.093-2.304.028-3.195l.152.127c-1.068-.895-1.808-2.732-1.66-4.113l-.022.198c.147-1.386-.856-2.4-2.24-2.28l.198-.016c-1.387.122-3.21-.655-4.083-1.734l.125.153C10.802-.265 9.374-.274 8.483.79L8.61.64c-.895 1.068-2.733 1.808-4.113 1.662l.198.02c-1.386-.147-2.4.857-2.28 2.24L2.4 4.363c.12 1.387-.656 3.21-1.735 4.084l.154-.126C-.265 9.2-.274 10.626.79 11.517L.64 11.39z" fill="#FF9500"></path><path d="M10.034 12.96L7.38 14.58c-.47.286-.747.09-.618-.45l.72-3.024-2.36-2.024c-.418-.357-.318-.68.235-.725l3.1-.25 1.195-2.87c.21-.508.55-.513.763 0l1.195 2.87 3.1.25c.547.043.657.365.236.725l-2.362 2.024.72 3.025c.13.535-.143.74-.616.45l-2.654-1.62z" fill="#FFF"></path></g></svg></span><div>优秀贡献者</div>';
    } else if (user.is_verify && !(user.is_star || user.score >= 700)) {
        infoItem = '<span><svg viewBox="0 0 20 20" class="Icon" width="16" height="16" aria-hidden="true"><title>用户标识</title><g fill="none" fill-rule="evenodd"><path d="M.64 11.39c1.068.895 1.808 2.733 1.66 4.113l.022-.196c-.147 1.384.856 2.4 2.24 2.278l-.198.016c1.387-.12 3.21.656 4.083 1.735l-.125-.154c.876 1.085 2.304 1.093 3.195.028l-.127.152c.895-1.068 2.733-1.808 4.113-1.66l-.198-.022c1.386.147 2.402-.856 2.28-2.238l.016.197c-.12-1.388.656-3.212 1.735-4.084l-.154.125c1.084-.876 1.093-2.304.028-3.195l.152.127c-1.068-.895-1.808-2.732-1.66-4.113l-.022.198c.147-1.386-.856-2.4-2.24-2.28l.198-.016c-1.387.122-3.21-.655-4.083-1.734l.125.153C10.802-.265 9.374-.274 8.483.79L8.61.64c-.895 1.068-2.733 1.808-4.113 1.662l.198.02c-1.386-.147-2.4.857-2.28 2.24L2.4 4.363c.12 1.387-.656 3.21-1.735 4.084l.154-.126C-.265 9.2-.274 10.626.79 11.517L.64 11.39z" fill="#0F88EB"></path><path d="M7.78 13.728l-2.633-3s-.458-.704.242-1.36c.7-.658 1.327-.22 1.327-.22L8.67 11.28l4.696-4.93s.663-.35 1.3.197c.635.545.27 1.382.27 1.382s-3.467 3.857-5.377 5.78c-.98.93-1.78.018-1.78.018z" fill="#FFF"></path></g></svg></span><div>已认证机构</div>';
    } else if (user.is_verify && (user.is_star || user.score > 700)) {
        infoItem = '<span><svg viewBox="0 0 24 20" class="Icon" width="18" height="16" aria-hidden="true"><title>用户标识</title><g fill="none" fill-rule="evenodd"><path d="M4.64 11.39c1.068.895 1.808 2.733 1.66 4.113l.022-.196c-.147 1.384.856 2.4 2.24 2.278l-.198.016c1.387-.12 3.21.656 4.083 1.735l-.125-.154c.876 1.085 2.304 1.093 3.195.028l-.127.152c.895-1.068 2.733-1.808 4.113-1.66l-.198-.022c1.386.147 2.402-.856 2.28-2.238l.016.197c-.12-1.388.656-3.212 1.735-4.084l-.154.125c1.084-.876 1.093-2.304.028-3.195l.152.127c-1.068-.895-1.808-2.732-1.66-4.113l-.022.198c.147-1.386-.856-2.4-2.24-2.28l.198-.016c-1.387.122-3.21-.655-4.083-1.734l.125.153C14.802-.265 13.374-.274 12.483.79L12.61.64c-.895 1.068-2.733 1.808-4.113 1.662l.198.02c-1.386-.147-2.4.857-2.28 2.24L6.4 4.363c.12 1.387-.656 3.21-1.735 4.084l.154-.126c-1.084.878-1.093 2.304-.028 3.195l-.152-.127z" fill="#0F88EB"></path><path d="M.64 11.39c1.068.895 1.808 2.733 1.66 4.113l.022-.196c-.147 1.384.856 2.4 2.24 2.278l-.198.016c1.387-.12 3.21.656 4.083 1.735l-.125-.154c.876 1.085 2.304 1.093 3.195.028l-.127.152c.895-1.068 2.733-1.808 4.113-1.66l-.198-.022c1.386.147 2.402-.856 2.28-2.238l.016.197c-.12-1.388.656-3.212 1.735-4.084l-.154.125c1.084-.876 1.093-2.304.028-3.195l.152.127c-1.068-.895-1.808-2.732-1.66-4.113l-.022.198c.147-1.386-.856-2.4-2.24-2.28l.198-.016c-1.387.122-3.21-.655-4.083-1.734l.125.153C10.802-.265 9.374-.274 8.483.79L8.61.64c-.895 1.068-2.733 1.808-4.113 1.662l.198.02c-1.386-.147-2.4.857-2.28 2.24L2.4 4.363c.12 1.387-.656 3.21-1.735 4.084l.154-.126C-.265 9.2-.274 10.626.79 11.517L.64 11.39z" fill="#FFF"></path><path d="M14.946 9.082l-2.362 2.024.72 3.025c.13.535-.143.74-.616.45l-2.654-1.622L7.38 14.58c-.47.286-.747.09-.618-.45l.72-3.024-2.36-2.024c-.418-.357-.318-.68.235-.726l3.1-.248 1.195-2.872c.21-.507.55-.512.763 0l1.195 2.872 3.1.248c.547.044.657.365.236.726m4.263-.6l.15.128c-1.068-.895-1.808-2.732-1.66-4.113l-.022.197c.147-1.386-.856-2.4-2.24-2.278l.198-.018c-1.387.124-3.21-.653-4.083-1.732l.125.153C10.802-.265 9.374-.274 8.483.79L8.61.64C7.716 1.706 5.877 2.446 4.497 2.3l.198.02c-1.386-.147-2.4.857-2.28 2.24L2.4 4.363c.12 1.387-.656 3.21-1.735 4.084l.154-.126C-.265 9.2-.274 10.626.79 11.516L.64 11.39c1.068.894 1.808 2.733 1.66 4.112l.022-.196c-.147 1.385.856 2.4 2.24 2.28l-.198.015c1.387-.12 3.21.656 4.083 1.735l-.124-.154c.184.23.396.398.62.53.62.372 1.347.37 1.972 0 .215-.126.42-.286.602-.502l-.127.152c.895-1.068 2.733-1.808 4.113-1.66l-.198-.022c1.387.147 2.402-.856 2.28-2.238l.016.197c-.12-1.39.656-3.212 1.735-4.084l-.154.124c1.084-.876 1.093-2.303.03-3.194" fill="#FF9500"></path></g></svg></span><div>优秀贡献者 · 已认证的机构</div>';
    }

    return '<div class="HoverCard"><div><div class="HoverCard-titleContainer HoverCard-titleContainer-noAvatar"><a href="/user/' + user.username + '"><img class="HoverCard-avatar" src="' + user.avatar + '"></a><div class="HoverCard-titleText"><div class="HoverCard-title"><span><a href="/user/' + user.username + '">' + user.username + '</a></span></div><div class="HoverCard-subtitle"><span class="RichText">' + user.signature + '</span></div></div></div></div><div class="HoverCard-item"><div class="HoverCard-info-item">' + infoItem + '</div></div><div class="HoverCard-item"><div class="NumBoard"><a class="NumBoard-item" href="/user/' + user.username + '"><div class="NumBoard-name">积分</div><div class="NumBoard-value">' + user.score + '</div></a><a class="NumBoard-item" href="/user/' + user.username + '/topics"><div class="NumBoard-name">文章</div><div class="NumBoard-value">' + user.topic_count + '</div></a><a class="NumBoard-item" href="/user/' + user.username + '/followers"><div class="NumBoard-name">关注者</div><div class="NumBoard-value user-follower-count">' + user.follower_count + '</div></a></div>' + btn + '</div></div>'
};

var userModal = function (title, currentUser, users) {

    var userTemplate = '';
    users.map(function (user) {
        var current = user[1];
        user = user[0];

        var btn = '';
        if (currentUser) {
            if (currentUser._id.toString() === user._id.toString()) {
                btn = '';
            } else if (current.current_is_follow) {
                btn = '<button class="btn btn-primary User-follow-btn animated" data-user="follow" data-username="' + user.username + '">关注</button><button class="btn btn-info User-de-follow-btn animated show" data-user="de_follow" data-username="' + user.username + '">关注</button>';
            } else {
                btn = '<button class="btn btn-primary User-follow-btn animated show" data-user="follow" data-username="' + user.username + '">关注</button><button class="btn btn-info User-de-follow-btn animated" data-user="de_follow" data-username="' + user.username + '">关注</button>';
            }
        } else {
            btn = '';
        }

        userTemplate += '<div class="User-item"><div class="User"><div class="User-avatar"><a href="/user/' + user.username + '"><img src="' + user.avatar + '" alt="用户头像"></a></div><div class="User-detail"><a href="/user/' + user.username + '"><h2 class="User-name">' + user.username + '</h2></a><div class="User-info"><span class="User-info-item">' + user.topic_count + ' 文章</span><span class="User-info-item">' + user.collect_topic_count + ' 收藏</span><span class="User-info-item"><span class="User-follow-count">' + user.follower_count + '</span> 关注者</span></div></div><div class="User-extra">' + btn + '</div></div></div>';
    });

    var template = '<div class="modal fade" tabindex="-1" role="dialog"><div class="modal-dialog" role="document"><div class="modal-content"><div class="modal-header"><button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button><h4 class="modal-title"></h4></div><div class="modal-body"></div></div></div></div>';
    var $modal = $(template).appendTo('body');

    // init
    $modal.find('.modal-title').text(users.length + title);
    $modal.find('.modal-body').html(userTemplate).css({'overflow': 'scroll', 'height': '500px'});

    $modal.modal('show');
    // 销毁 modal
    $modal.on('hidden.bs.modal', function () {
        $modal.remove();
    });
};

$(function () {
    /* 上传头像 */
    $('.user-avatar-btn').on('change', function () {
        var $this = $(this)[0];
        if ($this.files.length) {
            var file = $this.files[0],
                reader = new FileReader();
            if (!reader) {
                return this.value = '';
            }
            reader.onload = function (e) {
                this.value = '';
                $('.user-avatar-img').attr('src', e.target.result);
                $('.user-avatar-val').val(e.target.result);
            };
            reader.readAsDataURL(file);
        }
    });

    /* tab collect */
    $(document).on('click', '[data-tab="collect"]', function () {
        var $this = $(this);
        var url = '/tab/' + $(this).data('id') + '/collect';
        $.ajax({
            type: 'post',
            url: url,
            success: function (r) {
                if (r.status) {
                    $this.removeClass('show');
                    $this.siblings().addClass('show');
                    $this.closest('.topic-type').siblings('.tab-info-box').find('.tab-collect-count').text(r.collectors);
                } else {
                    modal({title: '关注失败！', content: r.msg});
                }
            }
        });
    });

    /* user hover */
    $('[data-user="show"]').each(function () {
        userHover($(this));
    });
    $(document).on('mouseenter', '[data-user="show"]', function () {
        var $this = $(this);
        var url = '/ajax/user/' + $(this).data('id');

        var exit = setTimeout(function () {
            $this.off('mouseleave.exit');
            $.ajax({
                type: 'post',
                url: url,
                success: function (r) {
                    if (r.status) {
                        $this.data('bs.popover').$tip.find('.popover-content').html(userInfo(r.user, r.currentUser, r.is_follow));
                    } else {
                        console.log(r);
                    }
                }
            });
        }, 500);
        $this.on('mouseleave.exit', function () {
            clearTimeout(exit);
        });


    });


    /*bootstrap tooltip*/
    $('[data-toggle="tooltip"]').tooltip();

    /*bootstrap dropdown 兼容*/
    $('.user-dropdown-menu').on('click', 'li', function (e) {
        if ($(this).children().length === 0) {
            return false;
        }
    });

    /*bootstrap modal 复写*/
    var modal = function (t, callback) {
        if (!callback) {
            callback = function () {
            };
        }
        var tp = {
            title: '提示框',
            content: '内容',
            size: '',
            animation: true
        };
        $.extend(tp, t);

        // size
        if (tp.size) {
            if (tp.size.indexOf('lg') > -1) {
                tp.size = 'modal-lg';
            } else if (tp.size.indexOf('sm') > -1) {
                tp.size = 'modal-sm';
            } else {
                tp.size = '';
            }
        }
        // animation
        if (typeof tp.animation === 'string') {
            if (tp.animation.indexOf('false') > -1) {
                tp.animation = false;
            } else if (tp.animation.indexOf('true') > -1) {
                tp.animation = true;
            } else {
                tp.animation = true;
            }
        }

        var template = '<div class="modal" tabindex="-1" role="dialog"><div class="modal-dialog" role="document"><div class="modal-content"><div class="modal-header"><button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button><h4 class="modal-title"></h4></div><div class="modal-body"></div><div class="modal-footer"><button type="button" class="btn btn-default" data-dismiss="modal" data-x="false">取消</button><button type="button" class="btn btn-primary" data-x="true">确定</button></div></div></div></div>'
        var $modal = $(template).appendTo('body');

        // init
        $modal.find('.modal-title').text(tp.title);
        $modal.find('.modal-body').text(tp.content);
        if (tp.size) {
            $modal.find('.modal-dialog').addClass(tp.size);
        }
        if (tp.animation) {
            $modal.addClass('fade');
        }

        $modal.modal('show');

        $modal.on('click', '[data-x="true"]', function () {
            callback();
            $modal.modal('hide');
        });
        // 销毁 modal
        $modal.on('hidden.bs.modal', function () {
            $modal.remove();
        });
    };

    /* header search */
    $('.header-search').on('focus', 'input', function () {
        $(this).closest('form').toggleClass('active');
    }).on('blur', 'input', function () {
        $(this).closest('form').toggleClass('active');
    });

    var TopicReplies = $('.Topic-replies');
    TopicReplies
        .on('click', '.editor-show-btn', function () {
            $(this)
                .closest('.RichContent')
                .css('display', 'none')
                .siblings('.reply2-form')
                .css('display', 'block');
        })
        .on('click', '.editor-hide-btn', function () {
            $(this)
                .closest('.reply2-form')
                .css('display', 'none')
                .siblings('.RichContent')
                .css('display', 'block');
        });

    /* topic up */
    $(document).on('click', '[data-topic="up"]', function () {
        var $this = $(this);
        var url = '/topic/' + $this.data('id') + '/up';
        $.ajax({
            type: 'post',
            url: url,
            success: function (r) {
                if (r.status) {
                    if (r.action === 'up') {
                        $this.find('.glyphicon').removeClass('glyphicon-heart-empty').addClass('glyphicon-heart');
                    }
                    if (r.action === 'down') {
                        $this.find('.glyphicon').removeClass('glyphicon-heart').addClass('glyphicon-heart-empty');
                    }
                    $this.find('.count').text(r.ups);
                } else {
                    console.log(r);
                    modal({title: '点赞失败！', content: r.msg})
                }
            }
        });
    });

    /* follow */
    $(document)
        .on('click', '[data-user="follow"]', function () {
            var $this = $(this);
            var username = $(this).data('username');
            var url = '/user/' + username + '/follow';
            $.ajax({
                type: 'post',
                url: url,
                success: function (r) {
                    if (r.status) {
                        /* 关于作者 的关注 */
                        $this
                            .closest('.Author-btn-group')
                            .siblings('.Author-counts')
                            .find('.author-follower-count')
                            .text(function (i, v) {
                                return Number(v) + 1;
                            });
                        /* userModal 的关注 */
                        $this
                            .closest('.User-extra')
                            .siblings('.User-detail')
                            .find('.User-follow-count')
                            .text(function (i, v) {
                                return Number(v) + 1;
                            });
                        /* userHover */
                        $this.closest('.HoverCard-btn-group').siblings('.NumBoard').find('.user-follower-count').text(function (i, v) {
                            return Number(v) + 1;
                        });
                        $this.removeClass('show');

                        var $d = $this.siblings('[data-user="de_follow"]').addClass('show fadeInLeft');
                        setTimeout(function () {
                            $d.removeClass('fadeInLeft');
                        }, 1000)
                    } else {
                        modal({
                            title: '关注失败！',
                            content: r.msg
                        });
                    }
                }
            });
        })
        .on('click', '[data-user="de_follow"]', function () {
            var $this = $(this);
            var username = $(this).data('username');
            var url = '/user/' + username + '/de_follow';
            $.ajax({
                type: 'post',
                url: url,
                success: function (r) {
                    if (r.status) {
                        /* 关于作者 的关注 */
                        $this
                            .closest('.Author-btn-group')
                            .siblings('.Author-counts')
                            .find('.author-follower-count')
                            .text(function (i, v) {
                                return Number(v) - 1;
                            });
                        /* userModal 的关注 */
                        $this
                            .closest('.User-extra')
                            .siblings('.User-detail')
                            .find('.User-follow-count')
                            .text(function (i, v) {
                                return Number(v) - 1;
                            });
                        /* userHover */
                        $this.closest('.HoverCard-btn-group').siblings('.NumBoard').find('.user-follower-count').text(function (i, v) {
                            return Number(v) - 1;
                        });
                        $this.removeClass('show');
                        var $f = $this.siblings('[data-user="follow"]').addClass('show fadeInLeft');
                        setTimeout(function () {
                            $f.removeClass('fadeInLeft');
                        }, 1000);
                    } else {
                        modal({
                            title: '取消关注失败！',
                            content: r.msg
                        });
                    }
                }
            });
        });

    /* reply delete/up/show ups*/
    TopicReplies
        .on('click', '[data-reply="delete"]', function () {
            var r_id = $(this).closest('.Reply').attr('id');
            var url = '/reply/' + r_id + '/delete';

            modal({
                title: '你确定要删除自己的回复吗？',
                content: '回复不会被永久删除，你还可以撤消本次删除操作。'
            }, function () {
                $.ajax({
                    type: 'post',
                    url: url,
                    success: function (r) {
                        if (r.status) {
                            //成功删除
                            window.location.reload();
                        } else {
                            modal({
                                title: '删除失败',
                                content: r.msg,
                                size: 'sm'
                            });
                        }
                    }
                });
            });
        })
        .on('click', '[data-reply="up"]', function () {
            var $this = $(this);
            var r_id = $(this).closest('.Reply').attr('id');
            var url = '/reply/' + r_id + '/up';
            $.ajax({
                type: 'post',
                url: url,
                success: function (r) {
                    if (r.status) {
                        if (r.action === 'up') {
                            if (!$this.closest('.Reply').find('.show-ups-btn')[0]) {
                                $this.closest('.Reply').find('.Reply-extra-info').append('<button class="btn-normal show-ups-btn" data-ups="show"><span>' + r.ups + '</span>人赞同了该回复</button>')
                            } else {
                                $this.closest('.Reply').find('.show-ups-btn').find('.ups-count').text(r.ups);
                            }
                            $this.find('.glyphicon').removeClass('glyphicon-heart-empty').addClass('glyphicon-heart');
                        } else if (r.action === 'down') {
                            if (r.ups === 0) {
                                $this.closest('.Reply').find('.show-ups-btn').remove();
                            } else {
                                $this.closest('.Reply').find('.show-ups-btn').find('.ups-count').text(r.ups);
                            }
                            $this.find('.glyphicon').removeClass('glyphicon-heart').addClass('glyphicon-heart-empty');
                        }
                    } else {
                        modal({
                            title: '点赞失败！',
                            content: r.msg
                        });
                    }

                }
            });
        })
        .on('click', '[data-ups="show"]', function () {
            var $this = $(this);
            var r_id = $(this).closest('.Reply').attr('id');
            var url = '/reply/' + r_id + '/ups';

            $.ajax({
                type: 'post',
                url: url,
                success: function (r) {
                    if (r.status) {
                        userModal('人赞同了', r.currentUser, r.ups);
                    } else {
                        console.log(r.msg);
                    }

                }
            });

        });

    /* topic  delete*/
    $(document).on('click', '[data-topic="delete"]', function () {
        var t_id = $(this).data('id');
        var url = '/topic/' + t_id + '/delete';
        modal({
            title: '你确定要删除自己的文章吗？',
            content: '文章不会被永久删除，你还可以撤消本次删除操作。'
        }, function () {
            $.ajax({
                type: 'post',
                url: url,
                success: function (r) {
                    console.log(r);
                    if (r.status) {
                        //成功删除
                        window.location.reload();
                    } else {
                        modal({
                            title: '删除失败',
                            content: r.msg,
                            size: 'sm'
                        });
                    }
                }
            });
        });

    });
    $(document).on('click', '[data-topic="collections"]', function () {
        var $this = $(this);
        var t_id = $this.data('id');
        var url = '/topic/' + t_id + '/collections';
        $.ajax({
            type: 'post',
            url: url,
            success: function (r) {
                if (r.status) {
                    userModal('人收藏了', r.currentUser, r.collections);
                } else {
                    console.log(r);
                }
            }
        });
    });

    /* 首页 */
    $('.topic-list')
        .on('click', '[data-topic="collect"]', function () {
            var $this = $(this);
            var t_id = $this.data('id');
            var url = '/topic/' + t_id + '/collect';

            $.ajax({
                type: 'post',
                url: url,
                success: function (r) {
                    if (r.status) {
                        $this.removeClass('show');
                        var count = $this.text();
                        var $del = $this.siblings().addClass('show');
                        $del.find('.count').text(function (n, c) {
                            return Number(count) + 1;
                        });
                    } else {
                        console.log(r);
                        modal({
                            title: '收藏失败！',
                            content: r.msg
                        });
                    }
                }
            });
        })
        .on('click', '[data-topic="de_collect"]', function () {
            var $this = $(this);
            var t_id = $(this).data('id');
            var url = '/topic/' + t_id + '/de_collect';
            $.ajax({
                type: 'post',
                url: url,
                success: function (r) {
                    if (r.status) {
                        $this.removeClass('show');
                        var count = $this.text();
                        var $co = $this.siblings().addClass('show');
                        $co.find('.count').text(function (n, c) {
                            return Number(count) - 1;
                        });
                    } else {
                        console.log(r);
                        modal({
                            title: '收藏失败！',
                            content: r.msg
                        });
                    }
                }
            });
        });

    /* /user/ */
    $('.List')
        .on('click', '[data-topic="collect"]', function () {
            var $this = $(this);
            var t_id = $this.data('id');
            var url = '/topic/' + t_id + '/collect';

            $.ajax({
                type: 'post',
                url: url,
                success: function (r) {
                    if (r.status) {
                        $this.removeClass('show');
                        var count = $this.text();
                        var $del = $this.siblings().addClass('show');
                        $del.find('.count').text(function (n, c) {
                            return Number(count) + 1;
                        });
                    } else {
                        console.log(r);
                        modal({
                            title: '收藏失败！',
                            content: r.msg
                        });
                    }
                }
            });
        })
        .on('click', '[data-topic="de_collect"]', function () {
            var $this = $(this);
            var t_id = $(this).data('id');
            var url = '/topic/' + t_id + '/de_collect';
            $.ajax({
                type: 'post',
                url: url,
                success: function (r) {
                    if (r.status) {
                        $this.removeClass('show');
                        var count = $this.text();
                        var $co = $this.siblings().addClass('show');
                        $co.find('.count').text(function (n, c) {
                            return Number(count) - 1;
                        });
                    } else {
                        console.log(r);
                        modal({
                            title: '收藏失败！',
                            content: r.msg
                        });
                    }
                }
            });
        });

    /* topic 页面 */
    $('.TopicHeader')
        .on('click', '[data-topic="collect"]', function () {
            var $this = $(this);
            var t_id = $this.data('id');
            var url = '/topic/' + t_id + '/collect';

            $.ajax({
                type: 'post',
                url: url,
                success: function (r) {
                    if (r.status) {
                        $this.closest('.collect-btn-group').toggleClass('collect');
                        $('.collect-value').text(function (n, c) {
                            return Number(c) + 1;
                        });
                    } else {
                        console.log(r);
                        modal({
                            title: '收藏失败！',
                            content: r.msg
                        });
                    }
                }
            });
        })
        .on('click', '[data-topic="de_collect"]', function () {
            var $this = $(this);
            var t_id = $(this).data('id');
            var url = '/topic/' + t_id + '/de_collect';
            $.ajax({
                type: 'post',
                url: url,
                success: function (r) {
                    if (r.status) {
                        $this.closest('.collect-btn-group').toggleClass('collect');
                        $('.collect-value').text(function (n, c) {
                            return Number(c) - 1;
                        });
                    } else {
                        console.log(r);
                        modal({
                            title: '收藏失败！',
                            content: r.msg
                        });
                    }
                }
            });
        });

    // 没有登录 提示框
    $(document).on('click', "[data-topic='reply']", function () {
        if (document.getElementById('Reply')) {
            $('.reply-editor').data('editor').codemirror.focus();
            $('html,body').animate({
                'scrollTop': $('#Reply').offset().top
            }, 300);
        } else {
            modal({
                title: '提示框',
                content: '您还没登录，请先登录！'
            }, function () {
                window.location.href = '/login';
            });
        }

    });

});