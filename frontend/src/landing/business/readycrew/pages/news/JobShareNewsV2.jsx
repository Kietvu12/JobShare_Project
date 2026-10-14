import { useEffect, useMemo } from 'react'
import apiService from '../../../../../services/api'
import { getPublicPostThumbnailUrl } from '../../../../../utils/publicPostDisplay'
import { useBusinessLandingBase } from '../../../BusinessLandingContext'
import { toBusinessLandingPath } from '../../../businessLandingBase'
import {
  replaceMainOpenTag,
  resolveBusinessLocale,
  rewriteJobShareTemplateHtml,
  scrollBusinessLandingToTop,
} from '../../lib/templateHtml'
import '../home/jobshare-v2/jobshare-home-v2.css'
import '../about/about-us.page.css'
import './news.page.css'
import '../jobshare-template-host.css'
import '../../../../templates/JobShare_Business_News_V2_1_JA_EN_VI_20261009 (1)/JobShare_Business_News_V2_1/dist/news-data.js'
import '../../../../templates/JobShare_Business_News_V2_1_JA_EN_VI_20261009 (1)/JobShare_Business_News_V2_1/dist/news-i18n.js'
import './jobshare-news.runtime.js'

import contentJa from '../../../../templates/JobShare_Business_News_V2_1_JA_EN_VI_20261009 (1)/JobShare_Business_News_V2_1/integration/content-ja.html?raw'
import contentEn from '../../../../templates/JobShare_Business_News_V2_1_JA_EN_VI_20261009 (1)/JobShare_Business_News_V2_1/integration/content-en.html?raw'
import contentVi from '../../../../templates/JobShare_Business_News_V2_1_JA_EN_VI_20261009 (1)/JobShare_Business_News_V2_1/integration/content-vi.html?raw'

const CONTENT_BY_LOCALE = { ja: contentJa, en: contentEn, vi: contentVi }
const NEWS_ASSET_BASE = '/landing/business/templates/news/'

function mapNewsPost(post) {
  return {
    ...post,
    categoryId: String(post.categoryId ?? post.category?.id ?? ''),
    publishedAt: post.publishedAt || post.published_at || post.createdAt,
    date: post.date || post.publishedAt || post.published_at,
    asset: getPublicPostThumbnailUrl(post, '') || 'assets/news-thumb-recruitment-01.webp',
    metaDescription: post.metaDescription || post.meta_description || '',
  }
}

export default function JobShareNewsV2() {
  const basePath = useBusinessLandingBase()
  const locale = resolveBusinessLocale(basePath)

  const html = useMemo(() => {
    const source = CONTENT_BY_LOCALE[locale] || CONTENT_BY_LOCALE.vi
    const rewritten = rewriteJobShareTemplateHtml(source, {
      locale,
      basePath,
      assetBase: NEWS_ASSET_BASE,
    })
    return replaceMainOpenTag(
      rewritten,
      `id="content" class="jsb-v2 jsb-about jsb-news jobshare-template-page" lang="${locale}" data-asset-base="${NEWS_ASSET_BASE}"`,
    )
  }, [basePath, locale])

  useEffect(() => {
    scrollBusinessLandingToTop()
    document.querySelector('.js-loading')?.classList.add('is-loaded')
    window.JobShareNewsConfig = {
      blogBase: toBusinessLandingPath('/blog', basePath),
      provider: async (params) => {
        const res = await apiService.getPublicPosts(params)
        const data = res?.data || {}
        const posts = (Array.isArray(data.posts) ? data.posts : []).map(mapNewsPost)
        const pagination = data.pagination || {}
        return {
          posts,
          pagination: {
            page: Number(pagination.page || params.page || 1),
            total: Number(pagination.total ?? posts.length),
            totalPages: Math.max(1, Number(pagination.totalPages || 1)),
            limit: Number(pagination.limit || params.limit || 10),
          },
        }
      },
    }
    const root = document.querySelector('.jsb-news')
    const cleanup = window.initJobShareNews?.(root)
    return () => {
      if (typeof cleanup === 'function') cleanup()
      delete window.JobShareNewsConfig
    }
  }, [basePath, html])

  return <div dangerouslySetInnerHTML={{ __html: html }} />
}
