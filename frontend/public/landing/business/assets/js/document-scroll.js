// 無限スクロール

$(document).ready(function () {
    $('.page-document-archive__list').infiniteScroll({
        path: '.next_posts_link a',
        hideNav: '.next_posts_link',
        append: '.page-document-archive__item',
        scrollThreshold: -100, //自動で次のページを読み込まないようにする
        status: '.scroller-status', // ステータスのセレクタ
        history: false,
    });
});


