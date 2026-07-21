  // 数字をカウントアップする関数
  function countUp(element, target) {
    let count = 0;
    let step = Math.ceil(target / 100); // 100ステップでカウントアップする

    function updateCount() {
      count += step;
      if (count > target) {
        count = target;
      }
      element.textContent = count;
      if (count < target) {
        requestAnimationFrame(updateCount);
      }
    }
    updateCount();
  }

  // 要素が特定の位置に到達したかどうかをチェックする関数
  function checkVisibility() {
    var elements = document.querySelectorAll(".fade_in");
    var windowHeight = window.innerHeight || document.documentElement.clientHeight;
    var triggerHeight = windowHeight / 1.1; // ビューの中央位置

    elements.forEach(function (element) {
      var rect = element.getBoundingClientRect();

      // 要素がビューの特定の位置にあるかどうかをチェック
      if (rect.top <= triggerHeight && rect.bottom >= 0 && !element.classList.contains('show')) {
        element.classList.add("show");

        // 数字のカウントアップを開始
        if (element.classList.contains('count')) {
          const target = parseInt(element.getAttribute('data-target'));
          countUp(element, target);
        }
      }
    });
  }

  // ページロード時にもチェック
  window.onload = checkVisibility;

  // スクロールイベントで可視性をチェック
  window.addEventListener('scroll', checkVisibility);


// ページトップへ移動するボタン
        document.addEventListener("scroll", function() {
            var scrollTopButton = document.querySelector(".scroll_top");
            
            if (window.scrollY > 500) {
                scrollTopButton.classList.add("show");
            } else {
                scrollTopButton.classList.remove("show");
            }
        });