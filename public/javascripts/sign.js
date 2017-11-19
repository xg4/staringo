$(function () {

    var checkData = function (url, data, callback) {
        if (arguments.length < 3 || typeof (callback) !== 'function') {
            throw '参数错误!';
        }
        $.ajax({
            type: 'post',
            url: url,
            data: data,
            dataType: 'json',
            success: function (r) {
                return callback(r)
            }
        });
    };

    $('.join-form')
        .on('keydown', '#username', function () {
            var $this = $(this);
            // 用户连续按键(等待时间1s)
            var timer = window.setTimeout(function () {
                $this.off('keydown.goon');
                $this.removeClass('ajax-loading ajax-success ajax-error').addClass('ajax-loading');
                var check_data = $this.val();
                if (/^[a-zA-Z][a-zA-Z0-9_]*$/i.test(check_data) && check_data.length >= 5) {
                    checkData('/check_username', {username: check_data}, function (r) {
                        window.setTimeout(function () {
                            $this.removeClass('ajax-loading ajax-success ajax-error');
                            if (r.check_info) {
                                $this.addClass('ajax-success')
                            } else {
                                $this.addClass('ajax-error')
                            }
                        }, 1000)
                    });
                } else {
                    window.setTimeout(function () {
                        $this.removeClass('ajax-loading ajax-success ajax-error').addClass('ajax-error');
                    }, 1000)
                }
            }, 1000);

            $(this).on('keydown.goon', function () {
                window.clearTimeout(timer);
                $(this).off('keydown.goon');
            });
        })
        .on('keydown', '#email', function () {
            var $this = $(this);
            // 用户连续按键(等待时间1s)
            var timer = window.setTimeout(function () {
                $this.off('keydown.goon');
                $this.removeClass('ajax-loading ajax-success ajax-error').addClass('ajax-loading');
                var check_data = $this.val();
                // 前端验证
                if (check_data.length) {
                    checkData('/check_email', {email: check_data}, function (r) {
                        window.setTimeout(function () {
                            $this.removeClass('ajax-loading ajax-success ajax-error');
                            if (r.check_info) {
                                $this.addClass('ajax-success')
                            } else {
                                $this.addClass('ajax-error')
                            }
                        }, 1000)
                    });
                } else {
                    window.setTimeout(function () {
                        $this.removeClass('ajax-loading ajax-success ajax-error').addClass('ajax-error');
                    }, 1000)
                }
            }, 1000);

            $(this).on('keydown.goon', function () {
                window.clearTimeout(timer);
                $(this).off('keydown.goon');
            });
        });


});