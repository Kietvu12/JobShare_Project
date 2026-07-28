    $(window).on('load', function () {
    
    var scrolltop = 0;
    $('.service_trend_btn a').off('click').on('click', function () {
      //$('.service_overlay').animate({ scrollTop: 0 }, '0');
      $('.service_overlay').scrollTop(0);
      $('.service_detail').hide();
      var a = $(this).attr('href');
      $(a).show();
      // history.pushState(null,null,a.replace('#',''));
      scrolltop = $(window).scrollTop()*-1;
      $('body').css({ top:scrolltop });
      $('body').addClass('open');
      $('.service_overlay').addClass('open');
      $('body').height('100vh');
      document.addEventListener('touchmove', disableScroll, { passive: false });
      document.addEventListener('mousewheel', disableScroll, { passive: false });
      return false;
    });
    
    $('.service_detail .breadcrumb .next,.service_detail .breadcrumb .prev, a.btn_link').off('click').on('click', function () {
      $('.service_overlay').animate({ scrollTop: 0 }, '0');
      $(this).parents('.service_detail').eq(0).fadeOut();
      var a = $(this).attr('href');
      $(a).fadeIn();
      $(window).scrollTop(scrolltop*-1);
      return false;
    });
    
      $('.btn').click(function(){
          $('#cms').css('display', 'block');
          $('#cms').addClass('open_cms');
      });
    
    
    $('.service_overlay .breadcrumb div:first-child a').off('click').on('click', function () {
      // history.back();
      $('body').removeClass('open');
      $('.service_overlay').removeClass('open');
      $(window).scrollTop(scrolltop*-1);
      $('body').height('auto');
      document.removeEventListener('touchmove', disableScroll, { passive: false });
      document.removeEventListener('mousewheel', disableScroll, { passive: false });
      return false;
    });
    
    document.addEventListener('click', (e) => {
      if($('.service_overlay').hasClass('open')){ 
        if(!e.target.closest('.service_overlay, .lity')) {
          $('body').removeClass('open');
          $('.service_overlay').removeClass('open');
          $(window).scrollTop(scrolltop*-1);
          $('body').height('auto');
          document.removeEventListener('touchmove', disableScroll, { passive: false });
          document.removeEventListener('mousewheel', disableScroll, { passive: false });
          return false;
        }
      }
    })
    
    function disableScroll(e) {
      if (!$(e.target).hasClass('body')) return;
      e.preventDefault();
      return false;
    }
    
    });
    
    
    
    var isMobile;
    $(function () {
    if (window.matchMedia && window.matchMedia('(max-width:810px)').matches) {
      isMobile = true;
      return;    
    }
    isMobile = false;
    });
    
    
    var windowWidth = $(window).width();
      var windowSm = 810;
      if (windowWidth <= windowSm) {
        $(window).on('load', function () {
        var t = $('.service_list a').off().on('click', function (e) {
          t.removeClass('on');
          $(this).addClass('on');
          var o = $('.service_outline');
          o.animate({ scrollTop: $($(this).attr('href')).position().top + o.scrollTop() }, 500, 'swing');
          //return false;
        });
      });
        $(window).on('load resize', function () {
          $('.service_outline').height($('.service_outline_item').outerHeight());
        });
    
        $(function(){
          // #で始まるリンクをクリックした場合
          $('a[href^="#"]').click(function(){
            // 例えばヘッダーの高さを事前に取得
            var h = $('.header').outerHeight(); // 追加
            // adjust に代入するとヘッダーの高さを取得してズラせる。
            var adjust = h; // 変更
            // スクロールの速度（ミリ秒）
            var speed = 400;
            // リンク先を取得してhrefという変数に代入
            var href= $(this).attr("href");
            // リンク先にidがある場合ターゲットとして値を取得
            var target = $(href == "#" || href == "" ? 'html' : href);
            // ターゲットの位置を取得し、調整がある場合は位置の調整を行う
            var position = target.offset().top + adjust;
            // スクロール実行
            $('body,html').animate({scrollTop:position}, speed, 'swing');
            return false;
          });
        });
    
      }else {
        $(window).on('load resize', function () {
          $('.service_section2').height($('.service_outline').outerHeight());
        });
    }