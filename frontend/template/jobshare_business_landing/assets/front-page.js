function visualPictureHeight() {
	if (window.matchMedia("(min-width: 768px) and (max-width: 1023px)").matches) {
		$(".js-visual-picture-area").height("100%");
	} else if (window.matchMedia("(max-width: 767px)").matches) {
		$wh = $(window).innerHeight();
		$h = $(".js-visual-text-area").height();
		$(".js-visual-wrapper").height($wh - 100);
		$(".js-visual-picture-area").height($wh - $h - 100);
	} else {
		$(".js-visual-picture-area").height("auto");
	}
}

function modalInnerHeight($windowHeight) {
	if (window.matchMedia("(max-width: 767px)").matches) {
		let $ws = 40,
			$is = 40,
			$bh = $windowHeight - $ws - $is;
		//console.log($wh);
		$(".swiper-slide").each(function () {
			let $sh = $(this)
					.children(".front-page-proposal-modal__header")
					.outerHeight(),
				$t = $bh - $sh;
			$(this).children(".front-page-proposal-modal__body").height($t);
		});
	}
}

$(window).on("load resize", function () {
	visualPictureHeight();
});

$(window).on("load resize", function () {
	var $windowHeight = window.innerHeight
		? window.innerHeight
		: $(window).innerHeight();
	modalInnerHeight($windowHeight);
});

$(function () {
	var webStorage = function () {
		if (sessionStorage.getItem("access")) {
			$(".js-loading").addClass("js-loading--none");
			$(".js-loading-hide").show();
			visualPictureHeight();
		} else {
			sessionStorage.setItem("access", "true");
			$(".js-loading").delay(3500).fadeOut("slow");

			setTimeout(function () {
				$(".js-loading__progress").addClass("js-loading__progress--active");
				$(".js-loading__logo").addClass("js-loading__logo--active");
				$(".js-loading__catch").addClass("js-loading__catch--active");
				$(".js-loading-hide").delay(1500).fadeIn("slow");
				$(".js-loading-lazy-contents").hide();
				$(".js-loading-lazy-contents").delay(3000).fadeIn("slow");
				visualPictureHeight();
			}, 1000);
		}
	};
	webStorage();

	var clickEventType = window.ontouchstart !== null ? "click" : "touchstart";

	var scroll = new SmoothScroll('a[href*="#"]', {
		speed: 200,
		header: ".header-main",
		speedAsDuration: true,
		easing: "Linear",
	});

	$(".js-corp-marquee").marquee({
		duplicated: true,
		startVisible: true,
		delayBeforeStart: 0,
		speed: 50,
		direction: "left",
	});

	$(".js-logo-marquee").marquee({
		duplicated: true,
		startVisible: true,
		delayBeforeStart: 0,
		speed: 50,
		direction: "right",
	});

	$(".js-match-height-1").matchHeight();
	$(".js-match-height-2").matchHeight();

	$(".js-faq-accordion-question").on(clickEventType, function () {
		$(this)
			.next(".js-faq-accordion-answer")
			.toggleClass("js-faq-accordion-answer--active");
		$(this)
			.children(".front-page-faq__subject")
			.children(".js-faq-accordion-subject")
			.toggleClass("js-faq-accordion-subject--active");
	});

	const modalSwiper = new Swiper(".js-modal-slider__swiper", {
		slidesPerView: 1,
		centerMode: true,
		spaceBetween: 0,
		speed: 1200,
		allowTouchMove: false,
		navigation: {
			nextEl: ".swiper-button-next",
			prevEl: ".swiper-button-prev",
		},
	});

	$(".js-modal-btn").on(clickEventType, function () {
		const modalIndex = $(this).data("slider-index");
		modalSwiper.slideTo(modalIndex);
		$("#js-modal-slider").addClass("js-modal-slider--active");
		setTimeout(function () {
			$(".js-modal-slider__contents").addClass(
				"js-modal-slider__contents--active"
			);
		}, 300);
		$("body").addClass("js-scroll-none");
	});

	$(".js-modal-slider__close").on(clickEventType, function () {
		$("#js-modal-slider").removeClass("js-modal-slider--active");
		$(".js-modal-slider__contents").removeClass(
			"js-modal-slider__contents--active"
		);
		$("body").removeClass("js-scroll-none");
		return false;
	});

	const tag = document.createElement("script");
	tag.src = "https://www.youtube.com/iframe_api";
	const firstScriptTag = document.getElementsByTagName("script")[0];
	firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

	let _player1;

	$(".js-movie-gallery-btn").on("click", function () {
		$video_id = $(this).data('video-id');
		_player1 = new YT.Player("yt_player", {
			height: 334,
			width: 574,
			videoId: $video_id,
			events: {
				onReady: function onPlayerReady(e) {
					_player1.playVideo();
				},
			},
		});

		$(".js-movie-gallery-first").hide();

		$(".js-movie-gallery-main-area").addClass("is-active");
	});

	$(".js-movie-gallery-thumbnail").on("click", function () {
		$(".js-movie-gallery-iframe-wrapper").html(
			'<div class="js-movie-gallery-player" id="yt_player"></div>'
		);

		$video_id = $(this).data("video-id");

		_player1 = new YT.Player("yt_player", {
			height: 334,
			width: 574,
			videoId: $video_id,
			events: {
				onReady: function onPlayerReady(e) {
					_player1.playVideo();
				},
			},
		});

		$(".js-movie-gallery-first").hide();

		$(".js-movie-gallery-main-area").addClass("is-active");

		$(this)
			.addClass("js-movie-gallery-thumbnail-current")
			.siblings()
			.removeClass("js-movie-gallery-thumbnail-current");
	});
});
