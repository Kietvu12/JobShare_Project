import contactHtml from './pages/contact_rc.html?raw';
import documentHtml from './pages/document.html?raw';
import indexHtml from './pages/index.html?raw';
import inquiryDocsHtml from './pages/inquiry_docs_rc.html?raw';
import mangaHtml from './pages/manga.html?raw';
import newsHtml from './pages/news.html?raw';
import partnerHtml from './pages/partner.html?raw';
import priceHtml from './pages/price.html?raw';
import proposalHtml from './pages/proposal.html?raw';
import resultsHtml from './pages/results.html?raw';
import seminarHtml from './pages/seminar.html?raw';
import titles from './page-titles.json';

export const PAGES = {
  index: {
    title: titles.index,
    html: indexHtml,
    extraScripts: ['/landing/business/assets/js/front-page.js'],
  },
  price: { title: titles.price, html: priceHtml },
  results: { title: titles.results, html: resultsHtml },
  proposal: { title: titles.proposal, html: proposalHtml },
  manga: { title: titles.manga, html: mangaHtml },
  seminar: { title: titles.seminar, html: seminarHtml },
  document: { title: titles.document, html: documentHtml },
  news: { title: titles.news, html: newsHtml },
  partner: { title: titles.partner, html: partnerHtml },
  inquiry_docs_rc: { title: titles.inquiry_docs_rc, html: inquiryDocsHtml },
  contact_rc: { title: titles.contact_rc, html: contactHtml },
};
