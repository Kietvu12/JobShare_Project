export const MANGA_PANELS = Array.from({ length: 16 }, (_, index) => ({
  src: `/assets/images/pages/page-manga-main-img-${String(index + 1).padStart(2, '0')}.png`,
  alt: `マンガ ${index + 1}`,
}))

export const MANGA_INTRO =
  '今まで自社のリソースのみで作業をこなしてきたとある会社。\n事業の拡大に伴い、新規プロジェクトが動き出します。\n制作する物も広範囲になり、とても手が回りそうもありません。\n困りに困った担当者… 果たしてどうなるのでしょうか？'
