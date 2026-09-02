/* Global */
var userAgent = window.navigator.userAgent.toLowerCase();
window._uac = {}; // define _uac as a global object
var ua = window.navigator.userAgent.toLowerCase();
var ver = window.navigator.appVersion.toLowerCase();

// check browser version
_uac.browser = (function () {
	if (ua.indexOf("edge") !== -1) return "edge"; // Edge
	else if (ua.indexOf("iemobile") !== -1) return "iemobile"; // ieMobile
	else if (ua.indexOf("trident/7") !== -1) return "ie11"; // ie11
	else if (ua.indexOf("msie") !== -1 && ua.indexOf("opera") === -1) {
		if (ver.indexOf("msie 6.") !== -1) return "ie6"; // ie6
		else if (ver.indexOf("msie 7.") !== -1) return "ie7"; // ie7
		else if (ver.indexOf("msie 8.") !== -1) return "ie8"; // ie8
		else if (ver.indexOf("msie 9.") !== -1) return "ie9"; // ie9
		else if (ver.indexOf("msie 10.") !== -1) return "ie10"; // ie10
	} else if (ua.indexOf("chrome") !== -1 && ua.indexOf("edge") === -1)
		return "chrome"; // Chrome
	else if (ua.indexOf("safari") !== -1 && ua.indexOf("chrome") === -1)
		return "safari"; // Safari
	else if (ua.indexOf("opera") !== -1) return "opera"; // Opera
	else if (ua.indexOf("firefox") !== -1) return "firefox"; // FIrefox
	else return "unknown_browser";
})();

var scrollTag = (function () {
	var element;
	if ("scrollingElement" in document) {
		element = document.scrollingElement;
	} else if (navigator.userAgent.toLowerCase().match(/webkit|msie 5/)) {
		element = document.body;
	} else {
		element = document.documentElement;
	}
	return element;
})();

var spFlag,
	MenuFlag = false,
	deviceSP,
	delayHeight,
	scrTop = $(window).scrollTop(),
	ww = window.innerWidth,
	wh = window.innerHeight;

$(function () {
	/* Loading */
	$("#Loading").fadeIn(0);
	if ($(".pageCopy").length > 0) {
		$("#Main").imagesLoaded(function () {
			matchH();
			$("#Loading .loader").fadeOut(300, function () {
				$("#Loading").fadeOut(500, "easeOutCirc", function () {
					$("#Loading .loader").fadeIn(0);
					$(".pageCopy").addClass("inView");
					setTimeout(function () {
						$(".isAnim").waypoint(
							function (direction) {
								var activePoint = $(this.element);
								if (direction === "down") {
									//scroll down
									activePoint.addClass("inView").change();
								}
							},
							{ offset: "75%" }
						);
					}, 300);
				});
			});
		});
	} else {
		$("#Main").imagesLoaded(function () {
			matchH();
			$("#Loading .loader").fadeOut(300, function () {
				$("#Loading").fadeOut(500, "easeOutCirc", function () {
					$("#Loading .loader").fadeIn(0);
					$(".isAnim").waypoint(
						function (direction) {
							var activePoint = $(this.element);
							if (direction === "down") {
								//scroll down
								activePoint.addClass("inView").change();
							}
						},
						{ offset: "75%" }
					);
				});
			});
		});
	}

	/* Device Check */
	if (
		userAgent.indexOf("iphone") !== -1 ||
		userAgent.indexOf("ipad") !== -1 ||
		(userAgent.indexOf("android") !== -1 && userAgent.indexOf("mobile") !== -1) ||
		userAgent.indexOf("windows phone") !== -1 ||
		userAgent.indexOf("blackberry") !== -1
	) {
		deviceSP = true;
		$("#siteFrame").attr("onclick", "");
	} else {
		deviceSP = false;
	}

	/* Browser Check */
	var browser;
	if (userAgent.indexOf("msie") != -1 || userAgent.indexOf("trident") != -1) {
		/* IE. */
		browser = "ie";
	} else if (userAgent.indexOf("edge") !== -1) {
		/* Google Chrome. */
		browser = "edge";
	} else if (userAgent.indexOf("chrome") !== -1) {
		/* Google Chrome. */
		browser = "chrome";
	} else if (userAgent.indexOf("firefox") !== -1) {
		/* FireFox. */
		browser = "firefox";
	} else if (userAgent.indexOf("safari") !== -1) {
		/* Safari. */
		browser = "safari";
	} else if (userAgent.indexOf("opera") !== -1) {
		/* Opera. */
		browser = "opera";
	} else if (userAgent.indexOf("gecko") !== -1) {
		/* Gecko. */
		browser = "gecko";
	} else {
		return false;
	}
	$("html").addClass(_uac.browser);

	/* Responsive View Check */
	if (ww < 768) {
		spFlag = true;
		$("html").addClass("SPmode");
		$("html").removeClass("PCmode");
	} else {
		spFlag = false;
		$("html").addClass("PCmode");
		$("html").removeClass("SPmode");
	}

	/* PageTop */
	$("#PageTop a").off();
	$("#PageTop a").on("click touchend ", function () {
		$("html,body").stop().animate({ scrollTop: 0 }, 300, "easeOutCirc");
		return false;
	});

	/* Menu */
	$("#MenuBtn a").on({
		click: function () {
			setMenuEffect();
			return false;
		},
		mouseenter: function () {
			if (!deviceSP) {
				$(this).addClass("hover");
			}
		},
		mouseleave: function () {
			$(this).removeClass("hover");
		},
	});
	$("#Navi a").on("click", function () {
		setMenuEffect();
	});

	/* ページ内リンク */
	anchorLink();

	/* SVG replace */
	replaceSVG();

	/* slickスライド - dotあり */
	slickSlide();

	/* ページごとの処理  */
	setPageScript();

	/* Menuの現在位置表示 */
	currentMenu();

	// 無限スクロール（jScroll）
	jScrollFN();
});

$(window).on("scroll", function () {
	scrTop = $(window).scrollTop();
	if (scrTop > 0) {
		$("html").addClass("Scroll");
	} else {
		$("html").removeClass("Scroll");
	}
});

var timer = false;
$(window).on("resize", function () {
	ww = window.innerWidth;
	wh = window.innerHeight;
	scrTop = $(window).scrollTop();

	if (ww < 768) {
		if (spFlag) {
		} else {
			$("html").removeClass("SPmode");
			$("html").addClass("PCmode");
		}
		spFlag = true;
	} else {
		if (spFlag) {
			$("html").removeClass("SPmode");
			$("html").addClass("PCmode");
		}
		spFlag = false;
	}
});

// メニュー押下時の処理
var setMenuEffect = function () {
	if (MenuFlag) {
		$("html").removeClass("MOpen");
		$("body").css({
			position: "relative",
			marginTop: 0,
		});
		$("html").removeClass("MScroll");
		$("html,body").scrollTop(backPosi);
		MenuFlag = false;

		setTimeout(function () {
			$("html").removeClass("MClose");
		}, 300);
	} else {
		setTimeout(function () {
			$("html").addClass("MClose");
		}, 300);

		$("html").addClass("MOpen");
		backPosi = $(window).scrollTop();
		$("body").css({
			position: "fixed",
			marginTop: -backPosi,
		});
		if (backPosi !== 0) {
			$("html").addClass("MScroll");
		}
		MenuFlag = true;
	}
};

// スムーズスクロール
var anchorLink = function () {
	var urlHash = location.hash;
	if (urlHash) {
		history.replaceState("", "", window.location.pathname);

		var offset = 0;
		if (spFlag) {
			offset = 72;
		}
		$("body,html").stop().scrollTop(0);
		setTimeout(function () {
			var target = $(urlHash);
			var position = target.offset().top - offset;
			$("body,html").stop().animate({ scrollTop: position }, 1000);
		}, 1500);
	} else {
		$("html,body").animate({ scrollTop: 0 }, "1");
	}

	$('a[href^="#"]').click(function () {
		var href = $(this).attr("href");
		var flag = $(this).attr("class");
		var target = $(href);

		// if( flag === void 0 ) {
		if (flag.indexOf("noScroll") != -1) {
			return false;
		} else {
			var offset = 0;
			if (spFlag) {
				offset = 0;
			}
			var scrollPosition = target.offset().top - offset;
			$("body,html").stop().animate({ scrollTop: scrollPosition }, 500);
			return false;
		}
	});
};

//SVG replace
var replaceSVG = function () {
	$('img[src$=".svg"].svg').each(function () {
		var $img = jQuery(this);
		var imgURL = $img.attr("src");
		var attributes = $img.prop("attributes");

		$.get(
			imgURL,
			function (data) {
				// Get the SVG tag, ignore the rest
				var $svg = jQuery(data).find("svg");

				// Remove any invalid XML tags
				$svg = $svg.removeAttr("xmlns:a");

				// Loop through IMG attributes and apply on SVG
				$.each(attributes, function () {
					$svg.attr(this.name, this.value);
				});

				// Replace IMG with SVG
				$img.replaceWith($svg);
			},
			"xml"
		);
	});
};

// メニューの現在位置判定
var currentMenu = function () {
	$("#Header li a").removeClass("active");
	if ($("#Home").length > 0) {
		$("#Header li.hmHome a").addClass("active");
	} else if ($("#About").length > 0) {
		$("#Header li.hmAbout a").addClass("active");
	} else if ($("#Matching").length > 0) {
		$("#Header li.hmMatching a").addClass("active");
	} else if ($("#Philosophy").length > 0) {
		$("#Header li.hmPhilosophy a").addClass("active");
	} else if ($("#Manga").length > 0) {
		$("#Header li.hmManga a").addClass("active");
	} else if ($("#Case").length > 0) {
		$("#Header li.hmCasestudy a").addClass("active");
	} else if ($("#Client").length > 0) {
		$("#Header li.hmClients a").addClass("active");
	} else if ($("#Partner").length > 0) {
		$("#Header li.hmPartner a").addClass("active");
	} else if ($("#Data").length > 0) {
		$("#Header li.hmData a").addClass("active");
	}
};

// matchHeight
var matchH = function () {
	$(".matchHeight").each(function () {
		$(this).children().matchHeight();
	});
};

// Slick スライド
var slickSlide = function () {
	$(".slideWrap").each(function () {
		$(this).slick({
			infinite: true,
			dots: true,
			arrows: true,
			speed: 800,
			autoplay: false,
			autoplaySpeed: 5000,
			slidesToShow: 1,
			centerMode: true,
			variableWidth: true,
		});
	});
};

// 無限スクロール（jScroll）
var jScrollFN = function () {
	var jscrollOption = {
		loadingHtml: '<div class="ISloading"></div>', // 記事読み込み中の表示、画像等をHTML要素で指定することも可能
		autoTrigger: true, // 次の表示コンテンツの読み込みを自動( true )か、ボタンクリック( false )にする
		padding: 400, // autoTriggerがtrueの場合、指定したコンテンツの下から何pxで読み込むか指定
		nextSelector: ".jscroll-next a", // 次に読み込むコンテンツのURLのあるa要素を指定
		contentSelector: ".jscroll", // 読み込む範囲を指定、指定がなければページごと丸っと読み込む
		// debug: true,
		callback: function () {
			$(".jscrollNextLink").hide();
			matchH();

			$(".jscrollPushurl").waypoint(
				function (direction) {
					var activePoint2 = $(this.element);
					var pushURL = function () {
						var nextUrl = activePoint2.attr("data-pushurl");
						var needUpdateUrl = window.location.href !== nextUrl;
						if (needUpdateUrl) {
							window.history.pushState(null, null, nextUrl);
						}
					};
					if (direction === "down") {
						//scroll down
						pushURL();
						this.destroy();
					}
				},
				{ offset: "75%" }
			);

			$(".isAnim").waypoint(
				function (direction) {
					var activePoint = $(this.element);
					if (direction === "down") {
						//scroll down
						activePoint.addClass("inView").change();
					}
				},
				{ offset: "75%" }
			);
		},
	};
	$(".jscroll").jscroll(jscrollOption);
};

// ページごとの処理
/* 存在する時 ex) $(****).length > 0  */
var setPageScript = function () {
	// トップページ
	if ($("#Home").length > 0) {
		$(".aboutSlide").slick({
			infinite: true,
			dots: false,
			arrows: false,
			fade: true,
			speed: 800,
			autoplay: true,
			autoplaySpeed: 5000,
			slidesToShow: 1,
			slidesToScroll: 1,
			pauseOnHover: false,
		});
	}

	// ご利用企業
	if ($("#Client").length > 0) {
		$(".clientList .block").on("click", function () {
			$(this).toggleClass("open");
			$("dd", this).slideToggle();
		});
	}

	// よくあるご質問
	if ($("#FAQ").length > 0) {
		$(".tab a").on("click", function () {
			$(".tab a").toggleClass("active");

			var t = $(this).attr("href");
			$(".tabContents").hide();
			$(t).fadeIn(300);
		});
	}

	// お問い合わせ
	if ($("#Contact").length > 0) {
		$("select").append("<optgroup></optgroup>");

		// プライバシーポリシーの同意チェック
		$("#agreecheck").change(function () {
			if ($("#agreecheck").prop("checked")) {
				$(".button").removeClass("disable");
			} else {
				$(".button").addClass("disable");
			}
		});
		/* 再読み込み時 */
		if ($("#agreecheck").prop("checked")) {
			$(".button").removeClass("disable");
		} else {
			$(".button").addClass("disable");
		}

		// お問い合わせの種類：取得と条件分岐
		$("#form_title").change(function () {
			// 選択されているvalue属性値を取り出す
			var titleVal = $("#form_title").val();

			// 条件分岐
			if (
				titleVal === "発注先（パートナー）探しの相談" ||
				titleVal === "発注先（パートナー）として会社を登録"
			) {
				$(".companyName").addClass("required");
			} else {
				$(".companyName").removeClass("required");
			}
		});
		/* 再読み込み時 */
		var titleVal = $("#form_title").val();
		if (
			titleVal === "発注先（パートナー）探しの相談" ||
			titleVal === "発注先（パートナー）として会社を登録"
		) {
			$(".companyName").addClass("required");
		} else {
			$(".companyName").removeClass("required");
		}

		// 未入力エラー時にスクロール
		if ($(".mw_wp_form .error")[0]) {
			var errorEl = $(".mw_wp_form .error").eq(0);
			var position = errorEl.parent().parent().parent().offset().top - 50;

			$("body,html")
				.delay(200)
				.animate({ scrollTop: position }, 600, "easeOutCirc");
		}

		// windowサイズが1180px以上の時は各コンタクトフォームの高さを変更する
		const width = $(window).width();
		if (width > 1180) {
			if ($("#contact-form").length) {
				// お問合せフォーム
				const contact = document.getElementById("contact-form");
				contact.style.height = "1100px";
			} else if ($("#request-documents-form").length) {
				// 資料請求フォーム
				const request = document.getElementById("request-documents-form");
				request.style.height = "650px";
			} else {
				// キャンペーン(レディクルを教えちゃおうキャンペーン2021)フォーム
				const campaign = document.getElementById("campaign-form");
				campaign.style.height = "980px";
			}
		}
	}

	// データで知る
	if ($("#Data").length > 0) {
		var posX;
		var tag;
		var arrow;
		var w = $(window).width();
		$(".list").on(
			{
				"click, mouseover": function () {
					var imgTag = $(this).parent().find("img");
					var src = imgTag.data("src");
					imgTag.attr("src", src);

					tag = $(this).parent().find(".popup");
					arrow = $(this).parent().find(".arrow");
					posX = tag.offset().left;
					posMax = posX + tag.width() + 10;
					if (posX < 10) {
						posX = -posX + 10;
						$(this).parent().addClass("overLeft");
						tag.css("margin-left", posX);
						arrow.css("margin-left", -posX);
					} else if (posMax > w) {
						posMax = w - posMax;
						$(this).parent().addClass("overRight");
						tag.css("margin-left", posMax);
						arrow.css("margin-left", -posMax);
					}
					$(this).parent().addClass("active");
				},
				mouseleave: function () {
					$(".list li").removeClass("active");
				},
			},
			"a"
		);

		// カウントアップ
		var countFlag1 = false,
			countFlag2 = false,
			countFlag3 = false;
		$("#Data .clumn2").on("change", function () {
			if (!countFlag1) {
				$("#Data .clumn2 .matching .counter").counterUpCustom({
					delay: 10,
					time: 1000,
				});
				$("#Data .clumn2 .price .counter").counterUpCustom({
					delay: 10,
					time: 1000,
				});
				countFlag1 = true;
			}
		});
		$("#Data .client").on("change", function () {
			if (!countFlag2) {
				$("#Data .client .total .counter").counterUpCustom({
					delay: 10,
					time: 1000,
				});
				$("#Data .client .listed .counter").counterUpCustom({
					delay: 10,
					time: 1000,
				});
				countFlag2 = true;
			}
		});
		$("#Data .transition .copy").on("change", function () {
			if (!countFlag3) {
				$("#Data .transition .copy .counter").counterUpCustom({
					delay: 10,
					time: 1000,
				});
				countFlag3 = true;
			}
		});
	}

	if ($("#Error").length > 0) {
		var bh = $(".body").height();
		var hh = bh - $("#Header").height();
		if (spFlag) {
			$(".body").css("height", "");
			$("#Main").css("height", "");
			$("#barba-wrapper,.barba-container").css("height", "");
		} else {
			$(".body").css("height", bh);
			$("#Main").css("height", hh);
			$("#barba-wrapper,.barba-container").css("height", "100%");
		}
	} else {
		$(".body").css("height", "");
		$("#Main").css("height", "");
		$("#barba-wrapper,.barba-container").css("height", "");
	}
};

// Braba Custom
// 現在と同じページのリンクをクリックした場合、リロードをしない設定
// リロードしたい場合は削除
var links = document.querySelectorAll("a[href]");
var cbk = function (e) {
	if (e.currentTarget.href === window.location.href) {
		e.preventDefault();
		e.stopPropagation();
	}
};
for (var i = 0; i < links.length; i++) {
	links[i].addEventListener("click", cbk);
}

// 新しいページが準備できたときにしたい処理
Barba.Dispatcher.on(
	"newPageReady",
	function (currentStatus, oldStatus, container, newPageRawHTML) {
		if (Barba.HistoryManager.history.length === 1) {
			// ファーストビュー
			return; // この時に更新は必要ないです
		}

		// メタデータをリフレッシュ
		var head = document.head;
		var newPageRawHead = newPageRawHTML.match(
			/<head[^>]*>([\s\S.]*)<\/head>/i
		)[0];
		var newPageHead = document.createElement("head");
		newPageHead.innerHTML = newPageRawHead;
		var removeHeadTags = [
			"meta[name='keywords']",
			"meta[name='description']",
			"meta[property^='fb']",
			"meta[property^='og']",
			"meta[name^='twitter']",
			"meta[itemprop]",
			"link[itemprop]",
			"link[rel='prev']",
			"link[rel='next']",
			"link[rel='canonical']",
		].join(",");
		var headTags = head.querySelectorAll(removeHeadTags);
		for (var i = 0; i < headTags.length; i++) {
			head.removeChild(headTags[i]);
		}
		var newHeadTags = newPageHead.querySelectorAll(removeHeadTags);
		for (var i = 0; i < newHeadTags.length; i++) {
			head.appendChild(newHeadTags[i]);
		}

		// Google Analyticsにヒットを送信
		// ga('send', 'pageview', location.pathname);
	}
); // End Dispatcher

// ページ遷移トランジション
var FadeTransition = Barba.BaseTransition.extend({
	start: function () {
		// ローディングが終わるとすぐ古いページをフェードアウトさせて、新しいページをフェードイン
		Promise.all([this.newContainerLoading, this.fadeOut()]).then(
			this.fadeIn.bind(this)
		);
	},

	fadeOut: function () {
		return $(this.oldContainer)
			.animate(
				{ opacity: 0 },
				{
					duration: 150,
					easing: "swing",
					complete: function () {},
				}
			)
			.promise();
	},

	fadeIn: function () {
		// ページトップに移動（これがないとスクロールしたところのまま画面遷移する）
		// jQueryで書く場合は $(document).scrollTop(0);
		// document.body.scrollTop = 0;
		$(window).scrollTop(0);

		var _this = this;

		// newContainerはnewContainerLoadingを解決した後に利用できる
		var $el = $(this.newContainer);

		// 古いコンテナ
		$(this.oldContainer).hide();

		// 新たに読み込まれるbarba-containerの初期設定
		// visiblityはデフォルトhiddenなのでvisibleに変える
		$el.css({
			visibility: "visible",
			opacity: 0,
		});

		$el.animate({ opacity: 1 }, 200, function () {
			matchH();
			// 遷移が終了したら.done()
			// .done()は自動的にDOMから古いコンテナを削除する
			_this.done();
			if ($(".pageCopy").length > 0) {
				$(".pageCopy").addClass("inView");
				setTimeout(function () {
					$(".isAnim").waypoint(
						function (direction) {
							var activePoint = $(this.element);
							if (direction === "down") {
								//scroll down
								activePoint.addClass("inView").change();
							}
						},
						{ offset: "75%" }
					);
				}, 300);
			} else {
				$(".isAnim").waypoint(
					function (direction) {
						var activePoint = $(this.element);
						if (direction === "down") {
							//scroll down
							activePoint.addClass("inView").change();
						}
					},
					{ offset: "75%" }
				);
			}

			/* ページ内リンク */
			anchorLink();

			/* SVG replace */
			replaceSVG();

			/* slickスライド - dotあり */
			slickSlide();

			/* ページごとの処理  */
			setPageScript();

			/* Menuの現在位置表示 */
			currentMenu();

			// 無限スクロール（jScroll）
			jScrollFN();
		});
	},
});

// Barbaに作成した遷移処理を指定
Barba.Pjax.getTransition = function () {
	return FadeTransition;
};

// barbajsをON にする
// PrefetchをON にする
$().ready(function () {
	Barba.Pjax.start();
	Barba.Prefetch.init();
});

// 2019.11.29追記
// 検索フォームの開閉
function submitchange() {
	var $parms = window.location.search.substring(1);
	if ($parms) {
		$("form .buttonLink").after(
			'<a class="submit" href="/results/?' + $parms + '">絞り込む</a>'
		);
	} else {
		$("form .buttonLink").after('<a class="submit">絞り込む</a>');
	}
	$("form .buttonLink").remove();
}
$(document).ready(function () {
	submitchange();
});
$(document).on("click", "a.submit", function () {
	setTimeout(function () {
		submitchange();
		/*		if (window.location.search.substring(1)) {
					$("form .index").toggleClass("active").next('.narrowing-menu').slideToggle(500);
				}*/
		// check_box_check();
	}, 1000);
});

//20191203headerより移動

$(function () {
	// ==基本設定（動作関係）
	// 1.追加先ID
	var $thisID = ".list.mod_caseList";
	// 2.読み込み先のURL
	var $url = "/results/";
	// 3.ページ送りの名前（例 $page=2）など
	//var $page = "paged";
	var $page = "page";
	// 4.読み込み開始番号
	var $cnt = 2;

	// 以下変更不可
	var $counter = $cnt;
	$("body").append(
		'<div id="NeverScroll_cookie" style="display: none;" rel="' +
			($counter - 1) +
			'"></div>'
	);
	var $oldhtml = "last";
	var $oldurl = "";
	$($thisID + " .moreLoading.en.f_bold").remove();
	var $br_next = 0;

	//	$(document).on("click", "a[href]", function() {
	setInterval(function () {
		var $newurl = location.href;
		if ($newurl != $oldurl && $br_next < 1) {
			setTimeout(function () {
				$counter = $cnt;
				$("#NeverScroll_cookie").remove();
				$("body").append(
					'<div id="NeverScroll_cookie" style="display: none;" rel="' +
						($counter - 1) +
						'"></div>'
				);
				$oldhtml = "last";
				$oldurl = "";
				$($thisID + " .moreLoading.en.f_bold").remove();
				//common.js
				var $parms = window.location.search.substring(1);
				console.log($parms);
				if ($parms) {
					$("form .buttonLink").after(
						'<a class="submit" href="/results/?' + $parms + '">絞り込む</a>'
					);
				} else {
					$("form .buttonLink").after('<a class="submit">絞り込む</a>');
				}
				$("form .buttonLink").remove();
				$oldurl = $newurl;
			}, 10);
			//			setTimeout("location.reload()",0);
		}
		$br_next = 0;
	}, 1000);
	//	});
	$(document).on("click", 'a[href*="/results/"]', function () {
		$("#NeverScroll_cookie").remove();
		$("body").append(
			'<div id="NeverScroll_cookie" style="display: none;" rel="' +
				($counter - 1) +
				'"></div>'
		);
		$br_next++;
	});
	$(window).scroll(function () {
		if ($oldhtml != void 0 && location.pathname.split("?")[0] === $url) {
			let $rel = $("#NeverScroll_cookie").attr("rel") - 0;
			if ($rel != $counter - 1) {
				$counter = $rel + 1;
			}
			let $param = location.search;
			$param = $param.slice(1);
			//var $geturl = $url + "?" + $page + "=" + $counter + "&" + $param;
			let $geturl = $url + $page + "/" + $counter + "/?" + $param + "&";
			// console.log($geturl);
			let $thisID_h;
			let $thisID_top;
			//			if ($($thisID).length) {
			$thisID_h = $($thisID).height();
			$thisID_top = $($thisID).offset().top + $($thisID).height();
			//			}
			let $html = $("#NeverScroll_cookie").html();
			let $width = $(window).width();
			let $scroll_position = $(window).scrollTop() + $width;
			if ($thisID_top < $scroll_position) {
				if ($html !== $oldhtml && $html != void 0) {
					$("#NeverScroll_cookie").load($geturl);
					$($thisID).append($html);
					$oldhtml = $html;
					$("#NeverScroll_cookie").attr("rel", $counter);
					console.log("counter+" + $geturl);
					$counter++;
				} else {
					//console.log('counter-'+$geturl);
					$counter--;
				}
			}
		}
	});
});

// 20191129差替え
/*var $get;
var $i=0;*/
$(document).on("click", 'form[role="search"] label', function () {
	var $href = $('form[role="search"]').attr("action");
	var $get;
	$('form[role="search"] input[type="checkbox"]').each(function (i, elem) {
		if ($(this).prop("checked")) {
			if ($get === void 0) {
				$get = $(this).attr("name") + "=" + $(this).attr("value");
			} else {
				$get += "&" + $(this).attr("name") + "=" + $(this).attr("value");
			}
		}
	});
	if ($get) {
		$('form[role="search"] .submit').attr("href", $href + "?" + $get);
	} else {
		$('form[role="search"] .submit').removeAttr("href");
	}
});

// 20191203 絞り込み検索
$(document).on("click", ".index", function () {
	$(this).toggleClass("active").next(".narrowing-menu").slideToggle(500);
});
