import searchTab from "./modules/search-tab.js";
import searchAccordion from "./modules/search-accordion.js";
import pickupSlider from "./modules/pickup-slider.js";

$(function () {
  searchTab();
  searchAccordion();
  pickupSlider();

  $(".page-results-search-btn").on("click", function () {
    const selectedIndustryId = $("#page-results-search-select-industry").val();
    const selectedCaseId = $("#page-results-search-select-case").val();

    let queryParameters = "";

    if (selectedIndustryId) {
      queryParameters += "?search_industry_cat=" + selectedIndustryId;
    }

    if (selectedCaseId) {
      queryParameters +=
        (queryParameters ? "&" : "?") + "search_case_cat=" + selectedCaseId;
    }

    const baseUrl = `${location.protocol}//${location.host}/results/`;
    location.href = baseUrl + queryParameters;
  });

  let default_check = getURLParams(location.href);
  if (default_check.search_case_cat) {
    $("#page-results-search-select-case option").each(function () {
      if ($(this).val() === default_check.search_case_cat) {
        $(this).attr("selected", true).prop("selected", true).change();
      }
    });
  }
  if (default_check.search_industry_cat) {
    $("#page-results-search-select-industry option").each(function () {
      if ($(this).val() === default_check.search_industry_cat) {
        $(this).attr("selected", true).prop("selected", true).change();
      }
    });
  }
});

var getURLParams = function (path) {
  if (!path) return false;
  var param = path.match(/\?([^?]*)$/);
  if (!param || param[1] === "") return false;
  var tmpParams = param[1].split("&"),
    keyValue = [],
    params = {};
  for (var i = 0, len = tmpParams.length; i < len; i++) {
    keyValue = tmpParams[i].split("=");
    params[keyValue[0]] = keyValue[1];
  }

  return params;
};

// セレクトボックスの疑似プレイスホルダー
$(function () {
  // 初期化時にも色を設定する
  $("select").each(function () {
    if ($(this).val() === "") {
      $(this).css("color", "#ddd");
    }
  });

  $("select").on("change", function () {
    if ($(this).val() === "") {
      $(this).css("color", "#ddd");
    } else {
      $(this).css("color", "#333");
    }
  });
});
