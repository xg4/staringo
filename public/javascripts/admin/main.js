$(function () {

    //nav caret 翻转
    $('.collapse.nav-secondary').on({
        'show.bs.collapse': function () {
            $(this).siblings('a').find('.caret').css('transform', 'rotate(180deg)');
            $(this).parent().addClass('active');
        },
        'hide.bs.collapse': function () {
            $(this).siblings('a').find('.caret').css('transform', 'rotate(0)');
            $(this).parent().removeClass('active');
        }
    });


});
