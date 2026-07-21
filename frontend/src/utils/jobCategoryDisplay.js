/** Localized job category label from CV row or nested jobCategory/category object. */
export function getJobCategoryDisplayName(source, lang = 'vi') {
  if (!source) return '';
  const l = lang === 'jp' ? 'ja' : lang;
  const cat = source.jobCategory || source.category || source;

  const vi = String(
    source.jobCategoryName
    || source.job_category_name
    || source.categoryName
    || cat?.name
    || '',
  ).trim();
  const en = String(
    source.jobCategoryNameEn
    || source.job_category_name_en
    || cat?.nameEn
    || cat?.name_en
    || '',
  ).trim();
  const jp = String(
    source.jobCategoryNameJp
    || source.job_category_name_jp
    || cat?.nameJp
    || cat?.name_jp
    || '',
  ).trim();

  if (l === 'en') return en || vi || jp;
  if (l === 'ja') return jp || en || vi;
  return vi || en || jp;
}
