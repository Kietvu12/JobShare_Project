/* i-web template — khởi tạo navbar & animation khi nhúng iframe */
(function () {
  function init() {
    var header = document.querySelector('header');
    if (header) {
      header.classList.remove('-hide');
      header.classList.add('fixed');
    }
    document.body.classList.add('-initialize');
    window.dispatchEvent(new Event('scroll'));
    window.dispatchEvent(new Event('resize'));
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
  window.addEventListener('load', init);
})();
