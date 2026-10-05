# Hướng dẫn tích hợp V2

## Phần dev nên dùng

Không dùng toàn bộ review HTML nếu web đã có layout chung. Dùng fragment:

- JA: `integration/content-ja.html`
- EN: `integration/content-en.html`
- VI: `integration/content-vi.html`

Kèm:

- `integration/jobshare-home-v2.css`
- `integration/jobshare-home-v2.js`
- thư mục `assets/`

## Header / footer

V2 **không yêu cầu thay header/footer**. Fragment không chứa hai phần này. Header, footer, login và language routing lấy từ web JobShare hiện tại.

## Assets

Các fragment mặc định trỏ tới:

`/jobshare-home-v2/assets/<filename>`

Có thể:

1. copy assets tới đúng public path trên; hoặc
2. đổi path trong fragment theo pipeline hiện tại.

## Route CTA

HTML review dùng route test hiện có. Khi tích hợp, ưu tiên truyền route qua initializer:

```js
const cleanup = window.initJobShareHomeV2(root, {
  routes: {
    register: '/business/register?lang=ja',
    contact: '/ja/business/contact_rc',
    documents: '/ja/business/inquiry_docs_rc',
    services: '/ja/business/price'
  }
});
```

Các link cần thay có `data-route` tương ứng.

## Locale

Site host quyết định locale. Không cần JS dịch trên client.

- route JA -> mount `content-ja.html`
- route EN -> mount `content-en.html`
- route VI -> mount `content-vi.html`

Cách này tốt hơn nhét 3 bộ text vào cùng DOM và giúp SEO / accessibility rõ hơn.

## Cleanup SPA

`initJobShareHomeV2()` return cleanup function. Gọi khi component unmount để disconnect IntersectionObserver và scroll listeners.
