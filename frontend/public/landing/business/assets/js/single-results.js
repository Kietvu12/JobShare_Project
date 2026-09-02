import worksSlider from "./modules/works-slider.js";
import faqAccordion from "./modules/faq-accordion.js";

$(function () {
	if ($(".js-works-slide").length > 1) {
		worksSlider();
	}
	faqAccordion();
});
