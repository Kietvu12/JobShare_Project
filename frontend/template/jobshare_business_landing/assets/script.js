$(window).on('load', function () {
    $('body').addClass('-initialize');
    animationTrigger();
});

// $(function () {
//     var ua = navigator.userAgent;
//     if ((ua.indexOf('iPhone') > 0) || ua.indexOf('iPod') > 0 || (ua.indexOf('Android') > 0 && ua.indexOf('Mobile') > 0)) {
//         $('head').prepend('<meta name="viewport" content="width=device-width,initial-scale=1">');
//     } else {
//         $('head').prepend('<meta name="viewport" content="width=1400">');
//     }
// });

$(function () {

    //smooth scroll
    $('a[href^="#"]').click(function () {
        var speed = 500;
        var headerH = $('header').innerHeight(); //headerがfixedでない場合はこの行不要
        var href = $(this).attr("href");
        var target = $(href == "#" || href == "" ? 'html' : href);
        var position = target.offset().top - headerH; //headerがfixedでない場合は「 - headerH」不要
        $('body,html').animate({
            scrollTop: position
        }, speed, 'swing');
        return false;
    });

    //sp_btn
    $('#sp_nav').click(function () {
        $('header').toggleClass('open');
        $('header .nav_area').fadeToggle();
    });
    $(window).resize(function () {
        var w = $(window).width();
        if (window.matchMedia("(min-width: 1261px)").matches) {
            $('header .nav_area').css('display', 'flex');
            $('header').addClass('open');
        } else {
            $('header .nav_area').hide();
            $('header').removeClass('open');
        }
    });


    //タブ
    $('.tab_nav li').click(function () {
        var index = $('.tab_nav li').index(this);
        $('.tab_nav li').removeClass('current');
        $(this).addClass('current');
        $('.tab_content').removeClass('show').eq(index).addClass('show');
    });

    //ヘッダー背景
    $(window).scroll(function () {
        if ($(this).scrollTop() > 200) {
            $('header').addClass('fixed');
        } else {
            $('header').removeClass('fixed');
        }
    });

    //TOP chlonicle
    $('.chlonicle_list li').on({
        'mouseenter': function () {
            $('.chlonicle_list li').css({
                'opacity': 0
            });
            var index = $('.chlonicle_list li').index(this);
            $('.hover_blocks .block').removeClass('show').eq(index).addClass('show');
        }
    });

    var windowWidth = $(window).width();
    var windowSm = 810;
    if (windowWidth <= windowSm) {
        //01
        $('.hover_blocks .block1 .next_btn').on('click', function () {
            $('.hover_blocks .block2').addClass('show');
            $('.hover_blocks .block1').removeClass('show');
        });
        //02
        $('.hover_blocks .block2 .next_btn').on('click', function () {
            $('.hover_blocks .block3').addClass('show');
            $('.hover_blocks .block2').removeClass('show');
        });
        $('.hover_blocks .block2 .prev_btn').on('click', function () {
            $('.hover_blocks .block1').addClass('show');
            $('.hover_blocks .block2').removeClass('show');
        });
        //03
        $('.hover_blocks .block3 .next_btn').on('click', function () {
            $('.hover_blocks .block4').addClass('show');
            $('.hover_blocks .block3').removeClass('show');
        });
        $('.hover_blocks .block3 .prev_btn').on('click', function () {
            $('.hover_blocks .block2').addClass('show');
            $('.hover_blocks .block3').removeClass('show');
        });
        //04
        $('.hover_blocks .block4 .prev_btn').on('click', function () {
            $('.hover_blocks .block3').addClass('show');
            $('.hover_blocks .block4').removeClass('show');
        });
        //close
        $('.hover_blocks .block .close_btn').on('click', function () {
            $('.hover_blocks .block').removeClass('show');
            $('.chlonicle_list li').css({
                'opacity': 1
            });
        });
        //return false;

    } else {
        $('.chlonicle_list li').on({
            'mouseleave': function () {
                $('.chlonicle_list li').css({
                    'opacity': 1
                });
                $('.hover_blocks .block').css('z-index', -1).removeClass('show');
            }
        });
        //return false;
    }

    $(document).on('click', function (e) {
        if (!$(e.target).closest('.select_wrap').length) {
            $('.archive').removeClass('open');
            $('.select_wrap').css('z-index', 2);
        } else {
            $('.archive').addClass('open');
            $('.select_wrap').css('z-index', 1);
        }
    });
    $('.select_wrap + ul li').click(function () {
        $('.select_wrap + ul li').removeClass('active');
        $(this).addClass('active');
    });

    //topicsソート -category
    var $grid = $('#topics .content');
    $('#topics .content').isotope({ //コンテナのセレクタ
        itemSelector: '.topics_block', //各アイテムのセレクタ
    });
    $('#topics .category li').click(function () {
        $('#topics .category li.current').removeClass('current');
        $(this).addClass('current');

        var elem = $(this).attr('data-filter');
        $grid.isotope({
            filter: elem
        });
        return false;
    });
    //topicsソート -archive
    var $grid = $('#topics .content');
    //$('#topics .content').isotope({ //コンテナのセレクタ
    //itemSelector: '.topics_block', //各アイテムのセレクタ
    //});
    $('#topics .archive li').click(function () {
        $('#topics .archive li.current').removeClass('current');
        $(this).addClass('current');

        //var elem = $(this).attr('data-filter');
        //$grid.isotope({
        //filter: elem
        //});
        //return false;
    });

    //seminarソート
    //var $seminar_grid = $('#seminar_list .list');
    //$('#seminar_list .list').isotope({ //コンテナのセレクタ
    //itemSelector: '.block', //各アイテムのセレクタ
    //layoutMode : 'fitRows',
    //});
    //$('#seminar_list .nav_area li').click(function () {
    //$('#seminar_list .nav_area li.current').removeClass('current');
    //$(this).addClass('current');

    //var elem = $(this).attr('data-filter');
    //$seminar_grid.isotope({
    //filter: elem
    //});
    //return false;
    //});

    /*
        //documentソート
        var $document_grid = $('#document_list .list');
        $('#document_list .list').isotope({ //コンテナのセレクタ
            itemSelector: '.filtr-item', //各アイテムのセレクタ
        });

        $('#document_list .nav_area li').click(function () {
            $('#document_list .nav_area li.current').removeClass('current');
            $(this).addClass('current');
            
            var elem = $(this).attr('data-filter');
            $document_grid.isotope({
                filter: elem
            });
            return false;
        });
    */
    //seminar
    // var count = 50;
    // $('.txt_limit50').each(function () {
    //     var thisText = $(this).text();
    //     var textLength = thisText.length;
    //     if (textLength > count) {
    //         var showText = thisText.substring(0, count);
    //         var insertText = showText += '…';
    //         $(this).html(insertText);
    //     };
    // });

});


//スクロールアニメトリガー
function animationTrigger() {
    gsap.registerPlugin(ScrollTrigger);
    $('._anime').each(function () {
        ScrollTrigger.create({
            trigger: $(this),
            start: "top 80%",
            onEnter: function (val) {
                val.trigger.classList.add('-active')
            }
        });
    });
}

/*$(function () {
    // 文字数カット処理-------

    var $setElm = $('.cutText');　// cutTextとついたクラスの要素を取得
    var cutFigure = '68'; // カットする文字数
    var afterTxt = ' ...'; // 文字カット後に表示するテキスト

    $setElm.each(function () {　// cutTextとついたクラスのすべての要素に対して文字カットの処理を行う
        var textLength = $(this).text().length; // 各要素の長さを取得
        var textTrim = $(this).text().substr(0, (cutFigure))

        if (cutFigure < textLength) { $(this).html(textTrim + afterTxt).css({ visibility: 'visible' }); } else if (cutFigure >= textLength) {
            // cssで初期表示は非表示にしているので、カット処理後に表示する
            $(this).css({
                visibility: 'visible'
            });
        }
    })
});*/


$(function () {
    var $setElm = $('.truncate'); // cutTextとついたクラスの要素を取得
    var cutFigure = '21'; // カットする文字数
    var afterTxt = ' ...'; // 文字カット後に表示するテキスト

    $setElm.each(function () { // cutTextとついたクラスのすべての要素に対して文字カットの処理を行う
        var textLength = $(this).find('p').text().length; // 各要素の長さを取得
        var textTrim = $(this).find('p').text().substr(0, (cutFigure))

        if (cutFigure < textLength) {
            $(this).find('p').html(textTrim + afterTxt).css({
                visibility: 'visible'
            });
        } else if (cutFigure >= textLength) {
            // cssで初期表示は非表示にしているので、カット処理後に表示する
            $(this).find('p').css({
                visibility: 'visible'
            });
        }
    })
});

/*var windowWidth = $(window).width();
var windowSm = 810;
if (windowWidth <= windowSm) {
    $(function () {
        // 文字数カット処理-------
    
        var $setElm = $('.cutText');　// cutTextとついたクラスの要素を取得
        var cutFigure = '40'; // カットする文字数
        var afterTxt = ' ...'; // 文字カット後に表示するテキスト
    
        $setElm.each(function () {　// cutTextとついたクラスのすべての要素に対して文字カットの処理を行う
            var textLength = $(this).text().length; // 各要素の長さを取得
            var textTrim = $(this).text().substr(0, (cutFigure))
    
            if (cutFigure < textLength) { $(this).html(textTrim + afterTxt).css({ visibility: 'visible' }); } else if (cutFigure >= textLength) {
                // cssで初期表示は非表示にしているので、カット処理後に表示する
                $(this).css({
                    visibility: 'visible'
                });
            }
        })
    });
} else {
    $(function () {
        // 文字数カット処理-------
    
        var $setElm = $('.cutText');　// cutTextとついたクラスの要素を取得
        var cutFigure = '68'; // カットする文字数
        var afterTxt = ' ...'; // 文字カット後に表示するテキスト
    
        $setElm.each(function () {　// cutTextとついたクラスのすべての要素に対して文字カットの処理を行う
            var textLength = $(this).text().length; // 各要素の長さを取得
            var textTrim = $(this).text().substr(0, (cutFigure))
    
            if (cutFigure < textLength) { $(this).html(textTrim + afterTxt).css({ visibility: 'visible' }); } else if (cutFigure >= textLength) {
                // cssで初期表示は非表示にしているので、カット処理後に表示する
                $(this).css({
                    visibility: 'visible'
                });
            }
        })
    });
}*/

$(function () {
    var pos = 0;
    $(window).on('scroll', function () {
        var current_pos = $(this).scrollTop();
        if (current_pos < pos || current_pos == 0) {
            $('header').removeClass('-hide')
        } else if (current_pos > 200) {
            $('header').addClass('-hide')
        }
        pos = current_pos;
    });
});

//ニュース　アーカイブ
$(window).on('load', function () {
    $(function () {
        $('li.year_list_item a').each(function () {
            if (this.href == location.href) $(this).parent().addClass('active');
        });
    });
});


//Document　お役立ち資料
$(window).on('load', function () {
    //isotope
    var $container = $('#document_list .list');
    $container.isotope({
        itemSelector: '.filtr-item'
    });
    // arrange完了後、ScrollTriggerを遅延再初期化
    $container.on('arrangeComplete', function () {
        imagesLoaded($container.get(0), function () {
            animationTrigger(); // ← 高さ確定後に再実行
        });
    });

    $('#document_list .nav_area li').on('click', function () {
        if($(this).data('filter') == '*') {
            $('#document_list .nav_area li:not([data-filter="*"])').removeClass('current');
        } else {
            $('#document_list .nav_area li[data-filter="*"]').removeClass('current');
        }
        if ($(this).hasClass('current')) {
            $(this).removeClass('current');
        } else {
            $(this).addClass('current');
        }
        search_document();
    });
    search_document();

    function search_document() {
        var search_str = '';
        $('#document_list .nav_area li').each(function (index) {
            if ($(this).hasClass('current')) {
                search_str += $(this).attr('data-filter');
            }
        });

        //チェックが一つもなければ全て表示する
        if (search_str == '') {
            $container.isotope({
                filter: '*'
            });
        } else {
            $container.isotope({
                filter: search_str
            });
        }
        return false;
    }

    /* 特定のTAGを非表示 */
    var d_show_list = [
        "*",
        ".student",
        ".enterprise",
        ".case",
        ".graduate",
        ".career",
        ".marketing",
        ".public_relations",
        ".internship",
        ".interview",
        ".follow",
        ".occupation",
        ".on_line",
        ".data",
        ".system"
    ];
    $('#document_list .nav_area li, #document_list .block li').each(function(){
        var d_tag_name = $(this).data('filter');
        if ($.inArray(d_tag_name, d_show_list) == -1) {
            $(this).hide();
        }
    });

    animationTrigger();
});

$(window).on('load', function () {
    //Seminar　セミナー情報

    //isotope
    var $Seminar_container = $('#seminar_list .list');
    $Seminar_container.isotope({
        itemSelector: '.filtr-item'
    });
    // arrange完了後、ScrollTriggerを遅延再初期化
    $Seminar_container.on('arrangeComplete', function () {
        imagesLoaded($Seminar_container.get(0), function () {
            animationTrigger(); // ← 高さ確定後に再実行
        });
    });

    $('#filter_seminar_single li').on('click', function () {
        if ($(this).hasClass('current')) {
            $(this).removeClass('current');
            $(this).siblings().addClass('current');
        } else {
            $('#filter_seminar_single li').removeClass('current');
            $(this).addClass('current');
        }
        search_seminar();
    });
    search_seminar();

    $('#filter_seminar li').on('click', function () {
        /* 過去のセミナーと連動 */
        var tag_index = $(this).index();
        $('#filter_seminar_past li').eq(tag_index).trigger("click");
        /* 過去のセミナーと連動 */
        if($(this).data('filter') == '*') {
            $('#filter_seminar li:not([data-filter="*"])').removeClass('current');
        } else {
            $('#filter_seminar li[data-filter="*"]').removeClass('current');
        }
        if ($(this).hasClass('current')) {
            $(this).removeClass('current');
        } else {
            $(this).addClass('current');
        }
        search_seminar();
    });
    search_seminar();

    function search_seminar() {
        var search_str2 = '';
        $('.SeminarList li').each(function (index) {
            if ($(this).hasClass('current')) {
                search_str2 += $(this).attr('data-filter');
            }
        });

        //チェックが一つもなければ全て表示する
        if (search_str2 == '') {
            $Seminar_container.isotope({
                filter: '*'
            });
        } else {
            $Seminar_container.isotope({
                filter: search_str2
            });
        }
        return false;
    }

    /* セミナーが1つも無ければ要素を非表示 */
    var seminar_block = $('#seminar_list .block').length;
    if (seminar_block == 0) {
        $('#seminar_list .content_area').hide();
    }
    var past_seminar_block = $('#past_seminar .block').length;
    if (past_seminar_block == 0) {
        $('#past_seminar').hide();
    }

    /* 過去のセミナーのフィルタリング */
    var $Seminar_container_past = $('#past_seminar .list');
    $Seminar_container_past.isotope({
        itemSelector: '.filtr-item-past',
        layoutMode: 'fitRows'
    });

    $('#filter_seminar_single_past li').on('click', function () {
        if($(this).hasClass('current')){
            $(this).removeClass('current');
            $(this).siblings().addClass('current');
        }else{
            $('#filter_seminar_single_past li').removeClass('current');
            $(this).addClass('current');
        }
        search_seminar_past();
    })
    search_seminar_past();

    $('#filter_seminar_past li').on('click', function () {
        if($(this).data('filter') == '*') {
            $('#filter_seminar_past li:not([data-filter="*"])').removeClass('current');
        } else {
            $('#filter_seminar_past li[data-filter="*"]').removeClass('current');
        }
        if($(this).hasClass('current')){
            $(this).removeClass('current');
        }else{
            $(this).addClass('current');
        }
        search_seminar_past();
    })
    search_seminar_past();

    function search_seminar_past(){
        var search_str2_past = '';
        $('.SeminarList_past li').each(function(index) {
            if($(this).hasClass('current')){
                search_str2_past += $(this).attr('data-filter');
            }
        })

        //チェックが一つもなければ全て表示する
        if(search_str2_past == ''){
            $Seminar_container_past.isotope({ filter: '*' });
        }else{
            $Seminar_container_past.isotope({ filter: search_str2_past });
        }
        return false;
    }
    /* 過去のセミナーのフィルタリング */


    /* 特定のTAGを非表示 */
    var s_show_list = [
        "*",
        ".talent_strategy",
        ".i-web_exercise",
        ".recruitment_publicity",
        ".public_relations",
        ".internship",
        ".follow",
        ".system",
        ".minutes",
        ".consideration",
        ".i-web_user",
    ];
    console.log(s_show_list);
    $('#featured_seminar .info_wrap li, #seminar_list .nav_area li, #seminar_list .info_wrap li, #past_seminar .info_wrap li').each(function(){
        var s_tag_name = $(this).data('filter');
        if ($.inArray(s_tag_name, s_show_list) == -1) {
            $(this).hide();
        }
    });
    /* 特定のTAGを非表示 */

    animationTrigger();
});


//document_dl_slider
$(window).on('load resize', function(){
    if($('.document_dl_list').length) {
        var window_w = $(this).width();
        if (window_w <= 860) {
            $('.document_dl_list').slick({
                slidesToShow: 3,
                // dots: true,
                variableWidth: false,
                autoplay: true,
                autoplaySpeed: 3000,
                speed: 1000,
                responsive: [{
                    breakpoint: 960,
                    settings: {
                        slidesToShow: 1,
                    },
                }],
            });
        } else {
            $('.document_dl_list').slick('unslick');
        }
    }
});