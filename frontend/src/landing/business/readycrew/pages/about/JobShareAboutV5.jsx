import { useBusinessLandingBase } from '../../../BusinessLandingContext'
import { resolveBusinessLocale } from '../../lib/templateHtml'
import { useJobShareAboutEffects, useJobShareAboutHtml } from './JobShareAboutContent'
import '../home/jobshare-v2/jobshare-home-v2.css'
import './about-us.page.css'
import '../jobshare-template-host.css'

const getRoot = () => document.getElementById('jobshare-business-v2')

export default function JobShareAboutV5() {
  const basePath = useBusinessLandingBase()
  const html = useJobShareAboutHtml(resolveBusinessLocale(basePath), basePath)
  useJobShareAboutEffects(html, getRoot)

  return <div dangerouslySetInnerHTML={{ __html: html }} />
}
