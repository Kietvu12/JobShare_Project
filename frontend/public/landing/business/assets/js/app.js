const windowWidth = $(window).width();
const breakpoint = 768;

$(function () {
	var clickEventType = window.ontouchstart !== null ? "click" : "touchstart";

	var $gnav = $(".js-gnav"),
		$gnavContainer = $(".js-gnav-container");
	$(window).on("load scroll", function () {
		var $windowScrollValue = $(this).scrollTop();
		if ($windowScrollValue > 0) {
			$gnav.addClass("js-gnav-active");
			$gnavContainer.addClass("js-gnav-max-width");
			$(".js-hamburger-menu__wrapper").addClass(
				"js-hamburger-menu__wrapper--scroll"
			);
			$(".js-hamburger-menu").addClass("js-hamburger-menu--scroll");
		} else {
			$gnav.removeClass("js-gnav-active");
			$gnavContainer.removeClass("js-gnav-max-width");
			$(".js-hamburger-menu__wrapper").removeClass(
				"js-hamburger-menu__wrapper--scroll"
			);
			$(".js-hamburger-menu").removeClass("js-hamburger-menu--scroll");
		}
	});

	$(".js-hamburger-menu").on(clickEventType, function () {
		let $menuClassName = "js-hamburger-menu",
			$menuClass = "." + $menuClassName,
			$menu = $($menuClass),
			$iconClassName = "js-hamburger-menu__icon",
			$iconClass = "." + $iconClassName,
			$icon = $($iconClass),
			$textClassName = "js-hamburger-menu__text",
			$textClass = "." + $textClassName,
			$text = $($textClass),
			$navClassName = "js-hamburger-menu__nav",
			$navClass = "." + $navClassName,
			$nav = $($navClass),
			$containerClassName = "js-hamburger-menu__container",
			$containerClass = "." + $containerClassName,
			$container = $($containerClass),
			$activeClassName = "--active";

		$(this).toggleClass($menuClassName + $activeClassName);
		$(this)
			.children($iconClass)
			.toggleClass($iconClassName + $activeClassName);
		$(this)
			.children($textClass)
			.toggleClass($textClassName + $activeClassName);

		if ($text.hasClass($textClassName + $activeClassName)) {
			$text.text("Close");
		} else {
			$text.text("Menu");
		}

		$nav.toggleClass($navClassName + $activeClassName);
		$container.toggleClass($containerClassName + $activeClassName);
		$("body").toggleClass("js-scroll-none");
		$(".js-hamburger-menu__wrapper").toggleClass(
			"js-hamburger-menu__wrapper--open"
		);
		$(".js-hamburger-menu__bg").toggleClass("js-hamburger-menu__bg--active");
	});

	var url = location.host;
	const hashAnchor = $(".js-hash-anchor");
	var headerHeight = $(".header").outerHeight();
	var urlHash = location.hash;
	console.log(
		location.protocol + "//" + url + "/" + location.hash,
		location.href
	);

	hashAnchor.on(clickEventType, function () {
		if (
			url == location.href ||
			location.protocol + "//" + url + "/" + location.hash == location.href
		) {
			$("body").removeClass("js-scroll-none");
			$(".js-hamburger-menu").removeClass("js-hamburger-menu--active");
			$(".js-hamburger-menu__icon").removeClass("js-hamburger-menu__icon--active");
			$(".js-hamburger-menu__text").removeClass("js-hamburger-menu__text--active");
			$(".js-hamburger-menu__nav").removeClass("js-hamburger-menu__nav--active");
			$(".js-hamburger-menu__container").removeClass(
				"js-hamburger-menu__container--active"
			);
			$(".js-hamburger-menu__wrapper").removeClass(
				"js-hamburger-menu__wrapper--open"
			);
			$(".js-hamburger-menu__bg").removeClass("js-hamburger-menu__bg--active");
		}

		var href = $(this).attr("href");
		var target = $(href);
		var position = target.offset().top - headerHeight;
		$("body,html").stop().animate({ scrollTop: position }, 500);
		return false;
	});

	/*
	$(window).on("load", function () {
		if (urlHash) {
			$("body,html").stop().scrollTop(0);
			setTimeout(function () {
				var target = $(urlHash);
				var position = target.offset().top - headerHeight;
				$("body,html").stop().animate({ scrollTop: position }, 500);
			}, 100);
		}
	});
	*/

	// 100vh
	const setFillHeight = () => {
		const vh = window.innerHeight * 0.01;
		document.documentElement.style.setProperty("--vh", `${vh}px`);
	};

	// ここからリサイズの対応
	let vw = window.innerWidth;
	window.addEventListener("resize", () => {
		if (vw === window.innerWidth) {
			// 画面の横幅にサイズ変動がないので処理を終える
			return;
		}

		// 画面の横幅のサイズ変動があった時のみ高さを再計算する
		vw = window.innerWidth;
		setFillHeight();
	});

	// 実行
	setFillHeight();
});
