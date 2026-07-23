import React, { useState, useEffect, useRef, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Target, FileText, Star, ExternalLink, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { translations } from '../../translations/translations';
import apiService, { normalizePostImageUrl } from '../../services/api';
import { pickPublicPostCategoryLabel } from '../../utils/publicPostDisplay';
import AgentJobsPageSession2 from './AgentJobsPageSession2';
import QuickCreateCandidateDrawer from '../Shared/QuickCreateCandidateDrawer';
import createCvIcon from '../../assets/icon for dashboard/Tạo hồ sơ mới.png';
import chatAdminIcon from '../../assets/icon for dashboard/Chat với admin.png';
import hotJobIcon from '../../assets/icon for dashboard/Xem job đang hot.png';
import trackCandidateIcon from '../../assets/icon for dashboard/Theo dõi ứng viên.png';
import adminIcon from '../../assets/icon for dashboard/Admin.png';
import AgentHomePageSession1 from './AgentHomePageSession1';

/** Job pickup tự sinh từ Sàn CTV — không hiển thị ở mục Job Pickup trên home */
const MARKETPLACE_JOB_PICKUP_NAMES = new Set([
  'Sàn CTV — Doanh nghiệp',
  'Business CTV Marketplace',
]);

function isMarketplaceJobPickup(pickup) {
  const name = String(pickup?.name || pickup?.title || '').trim();
  const nameEn = String(pickup?.nameEn || pickup?.name_en || pickup?.titleEn || '').trim();
  return MARKETPLACE_JOB_PICKUP_NAMES.has(name) || MARKETPLACE_JOB_PICKUP_NAMES.has(nameEn);
}

const NewsPreview = memo(({ text }) => {
  const textRef = useRef(null);
  const [isTruncated, setIsTruncated] = useState(false);

  useEffect(() => {
    const el = textRef.current;
    if (!el) return;
    const check = () => setIsTruncated(el.scrollHeight > el.clientHeight + 1);
    check();
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(check) : null;
    ro?.observe(el);
    return () => ro?.disconnect();
  }, [text]);

  if (!text) return null;

  return (
    <div className="relative mt-0.5 flex-1 min-h-[2rem] overflow-hidden">
      <p
        ref={textRef}
        className="line-clamp-[8] text-[8px] leading-[1.35] text-slate-500 break-words sm:text-[9px] sm:line-clamp-[9]"
      >
        {text}
      </p>
      {isTruncated && (
        <span
          className="pointer-events-none absolute bottom-0 right-0 bg-gradient-to-l from-white from-55% via-white/95 pl-4 text-[8px] font-semibold leading-none text-slate-500 sm:text-[9px]"
          aria-hidden
        >
          ..
        </span>
      )}
    </div>
  );
});
NewsPreview.displayName = 'NewsPreview';

const AgentHomePageSession3 = () => {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const t = translations[language] || translations.vi;
  const [tableData, setTableData] = useState([]);
  const [pagination, setPagination] = useState({
    jobPickups: { total: 0, totalPages: 0 },
    campaigns: { total: 0, totalPages: 0 },
    posts: { total: 0, totalPages: 0 },
  });
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [modalJobs, setModalJobs] = useState([]);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalPage, setModalPage] = useState(1);
  const modalCursorChainRef = useRef([null]);
  const [modalPagination, setModalPagination] = useState({
    page: 1,
    limit: 10,
    hasNext: false,
  });
  const [quickCreateOpen, setQuickCreateOpen] = useState(false);
  const [quickCreateKey, setQuickCreateKey] = useState(0);
  const [hoveredCardIndex, setHoveredCardIndex] = useState(null);
  const [hoveredRetryButton, setHoveredRetryButton] = useState(false);
  const [hoveredCloseModalButton, setHoveredCloseModalButton] = useState(false);

  const openAdminChat = () => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('jobshare:open-collaborator-chat', { detail: { tab: 'messages' } }));
    }
  };

  const closeSlidePanel = () => {
    setShowModal(false);
    setTimeout(() => {
      setSelectedItem(null);
      setModalPage(1);
      setModalJobs([]);
      modalCursorChainRef.current = [null];
      setModalPagination({ page: 1, limit: 10, hasNext: false });
    }, 320);
  };

  // FIX 1: Gọi loadData khi component mount
  useEffect(() => {
    loadData(1, false);
  }, []);

  // Mở panel với slide-in: khi có selectedItem thì sau 1 frame bật showModal
  useEffect(() => {
    if (!selectedItem) return;
    const id = requestAnimationFrame(() => setShowModal(true));
    return () => cancelAnimationFrame(id);
  }, [selectedItem]);


  // Tách dữ liệu thành 3 nhóm: Campaign, Job pick up, News
  const campaigns = React.useMemo(
    () => (tableData || []).filter((item) => item.type === 'campaign'),
    [tableData]
  );
  const jobPickups = React.useMemo(
    () => (tableData || []).filter((item) => item.type === 'job-pickup'),
    [tableData]
  );
  const getSortTimestamp = (item) => {
    const raw =
      item?.publishedAt ||
      item?.published_at ||
      item?.createdAt ||
      item?.created_at ||
      item?.date ||
      item?.startDate ||
      item?.start_at ||
      item?.start_at ||
      0;
    const ts = new Date(raw).getTime();
    return Number.isNaN(ts) ? 0 : ts;
  };

  const newsItems = React.useMemo(() => {
    const items = (tableData || []).filter((item) => item.type === 'news');
    return [...items].sort((a, b) => {
      const ta = Number.isFinite(a.sortTimestamp) ? a.sortTimestamp : getSortTimestamp(a);
      const tb = Number.isFinite(b.sortTimestamp) ? b.sortTimestamp : getSortTimestamp(b);
      return tb - ta;
    });
  }, [tableData]);

  const sortedNewsItems = React.useMemo(() => [...newsItems].sort((a, b) => getSortTimestamp(b) - getSortTimestamp(a)), [newsItems]);

  const loadData = async (page = 1, append = false) => {
    // FIX 2: Khai báo newPagination ngoài try để dùng được trong finally
    const newPagination = { ...pagination };
    try {
      setError(null);
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }
      
      const limit = 20; // Tăng limit lên 20 items mỗi loại
      // Lấy items từ mỗi loại
      const [jobPickupsRes, campaignsRes, postsRes] = await Promise.all([
        apiService.getCTVJobPickups({ page, limit, sortBy: 'created_at', sortOrder: 'DESC' }).catch(() => ({ success: false, data: { pickups: [], pagination: {} } })),
        apiService.getCTVCampaigns({ page, limit, status: 1, sortBy: 'created_at', sortOrder: 'DESC' }).catch(() => ({ success: false, data: { campaigns: [], pagination: {} } })),
        apiService.getCTVPosts({ page, limit, status: 2, sortBy: 'published_at', sortOrder: 'DESC' }).catch(() => ({ success: false, data: { posts: [], pagination: {} } }))
      ]);

      const newData = [];
      
      // Lưu pagination info
      if (jobPickupsRes.success && jobPickupsRes.data?.pagination) {
        newPagination.jobPickups = jobPickupsRes.data.pagination;
      }
      if (campaignsRes.success && campaignsRes.data?.pagination) {
        newPagination.campaigns = campaignsRes.data.pagination;
      }
      if (postsRes.success && postsRes.data?.pagination) {
        newPagination.posts = postsRes.data.pagination;
      }
      setPagination(newPagination);

      // Add job pickups
      if (jobPickupsRes.success && jobPickupsRes.data?.pickups) {
        jobPickupsRes.data.pickups
          .filter((pickup) => !isMarketplaceJobPickup(pickup))
          .forEach((pickup) => {
          const name = pickup.name || pickup.title || pickup.jobPickupName || pickup.jobPickupTitle || pickup.subject || pickup.heading || '';
          const nameEn = pickup.nameEn || pickup.name_en || pickup.titleEn || pickup.title_en || '';
          const nameJp = pickup.nameJp || pickup.name_jp || pickup.titleJp || pickup.title_jp || '';
          const description = pickup.description || pickup.content || pickup.summary || '';
          const descriptionEn = pickup.descriptionEn || pickup.description_en || pickup.contentEn || pickup.summaryEn || '';
          const descriptionJp = pickup.descriptionJp || pickup.description_jp || pickup.contentJp || pickup.summaryJp || '';
          const coverUrl = pickup.coverUrl || pickup.cover_url || pickup.thumbnail || pickup.thumbnailUrl || pickup.image || pickup.imageUrl || pickup.bannerUrl || pickup.banner_url || '';
          newData.push({
            id: `pickup-${pickup.id}`,
            type: 'job-pickup',
            originalId: pickup.id,
            title: name,
            name,
            titleEn: nameEn,
            nameEn,
            titleJp: nameJp,
            nameJp,
            coverUrl,
            cover_url: coverUrl,
            tagColor: 'bg-yellow-100 text-yellow-700',
            tagIcon: 'Star',
            date: formatDate(pickup.createdAt),
            description,
            descriptionEn,
            descriptionJp,
            action: t.viewDetails || 'Xem chi tiết',
            url: `/agent/jobs?pickupId=${pickup.id}`,
            isNew: isRecent(pickup.createdAt),
          });
        });
      }

      // Add campaigns
      if (campaignsRes.success && campaignsRes.data?.campaigns) {
        console.log(`[Frontend] Campaigns received:`, campaignsRes.data.campaigns.length, campaignsRes.data.campaigns.map(c => ({ id: c.id, name: c.name })));
        campaignsRes.data.campaigns.forEach((campaign) => {
          const name = campaign.name || campaign.title || '';
          const nameEn = campaign.nameEn || campaign.name_en || campaign.titleEn || campaign.title_en || '';
          const nameJp = campaign.nameJp || campaign.name_jp || campaign.titleJp || campaign.title_jp || '';
          const coverUrl = campaign.coverUrl || campaign.cover_url || '';
          newData.push({
            id: `campaign-${campaign.id}`,
            type: 'campaign',
            originalId: campaign.id,
            title: name,
            name,
            titleEn: nameEn,
            nameEn,
            titleJp: nameJp,
            nameJp,
            coverUrl,
            cover_url: coverUrl,
            tagColor: 'bg-purple-100 text-purple-700',
            tagIcon: 'Target',
            date: formatDate(campaign.startDate || campaign.createdAt),
            description: campaign.description || '',
            descriptionEn: campaign.descriptionEn || campaign.description_en || '',
            descriptionJp: campaign.descriptionJp || campaign.description_jp || '',
            action: t.viewDetails || 'Xem chi tiết',
            url: `/agent/jobs?campaignId=${campaign.id}`,
            isNew: campaign.status === 1 && isRecent(campaign.startDate || campaign.createdAt),
          });
        });
      } else {
        console.log(`[Frontend] Campaigns response:`, campaignsRes);
      }

      // Add posts (news)
      if (postsRes.success && postsRes.data?.posts) {
        postsRes.data.posts.forEach((post) => {
          const sortTimestamp = new Date(post.publishedAt || post.createdAt || 0).getTime();
          const title = post.title || '';
          const titleEn = post.titleEn || post.title_en || '';
          const titleJp = post.titleJp || post.title_jp || '';
          const category = post.category || {};
          newData.push({
            id: `post-${post.id}`,
            type: 'news',
            originalId: post.id,
            slug: post.slug || '',
            sortTimestamp: Number.isNaN(sortTimestamp) ? 0 : sortTimestamp,
            title,
            name: title,
            titleEn,
            nameEn: titleEn,
            titleJp,
            nameJp: titleJp,
            categoryId: post.categoryId || category.id || null,
            categoryName: category.name || '',
            categoryColor: category.color || '#2563eb',
            categorySlug: category.slug || '',
            tagColor: 'bg-blue-100 text-blue-700',
            tagIcon: 'FileText',
            date: formatDate(post.publishedAt || post.createdAt),
            description: post.metaDescription || post.meta_description || '',
            descriptionEn: post.metaDescriptionEn || post.meta_description_en || '',
            descriptionJp: post.metaDescriptionJp || post.meta_description_jp || '',
            content: post.content || '',
            contentEn: post.contentEn || post.content_en || '',
            contentJp: post.contentJp || post.content_jp || '',
            action: t.viewDetails || 'Xem chi tiết',
            url: `/agent/jobs?postId=${post.id}`,
            isNew: isRecent(post.publishedAt || post.createdAt),
          });
        });
      }

      // Sort by sortTimestamp (newest first) và loại bỏ duplicate
      newData.sort((a, b) => {
        const tsA = Number.isFinite(a.sortTimestamp) ? a.sortTimestamp : new Date(a.date).getTime();
        const tsB = Number.isFinite(b.sortTimestamp) ? b.sortTimestamp : new Date(b.date).getTime();
        if (Number.isNaN(tsA) && Number.isNaN(tsB)) return 0;
        if (Number.isNaN(tsA)) return 1;
        if (Number.isNaN(tsB)) return -1;
        return tsB - tsA;
      });

      // Loại bỏ duplicate dựa trên id
      const uniqueData = [];
      const seenIds = new Set();
      newData.forEach(item => {
        if (!seenIds.has(item.id)) {
          seenIds.add(item.id);
          uniqueData.push(item);
        } else {
          console.log(`[Frontend] Duplicate found and removed:`, item.id, item.title);
        }
      });
      
      console.log(`[Frontend] Total items before unique: ${newData.length}, after unique: ${uniqueData.length}`);
      console.log(`[Frontend] Campaigns in final data:`, uniqueData.filter(item => item.type === 'campaign').map(item => ({ id: item.id, title: item.title })));

      if (append) {
        setTableData(prev => {
          const combined = [...prev, ...uniqueData];
          // Loại bỏ duplicate trong combined data
          const seen = new Set();
          return combined.filter(item => {
            if (seen.has(item.id)) return false;
            seen.add(item.id);
            return true;
          });
        });
      } else {
        setTableData(uniqueData);
      }

      // Kiểm tra xem còn dữ liệu để load không
      const totalPages = Math.max(
        newPagination.jobPickups?.totalPages || 0,
        newPagination.campaigns?.totalPages || 0,
        newPagination.posts?.totalPages || 0
      );
      setHasMore(page < totalPages);
    } catch (error) {
      console.error('Error loading data:', error);
      if (!append) {
        setTableData([]);
      }
    } finally {
      if (append) {
        setLoadingMore(false);
      } else {
        setLoading(false);
      }
      setHasMore(page < Math.max(
        newPagination.jobPickups?.totalPages || 0,
        newPagination.campaigns?.totalPages || 0,
        newPagination.posts?.totalPages || 0
      ));
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    return date.toLocaleDateString(
      language === 'vi' ? 'vi-VN' : language === 'en' ? 'en-US' : 'ja-JP',
      { year: 'numeric', month: '2-digit', day: '2-digit' }
    );
  };

  const isRecent = (dateString) => {
    if (!dateString) return false;
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return false;
    const daysDiff = (Date.now() - date.getTime()) / (1000 * 60 * 60 * 24);
    return daysDiff <= 7; // New if within 7 days
  };

  const pickByLanguage = (viText, enText, jpText) => {
    if (language === 'en') return enText || viText || jpText || '';
    if (language === 'ja') return jpText || enText || viText || '';
    return viText || enText || jpText || '';
  };

  const getLocalizedItemTitle = (item) =>
    pickByLanguage(
      item?.title || item?.name,
      item?.titleEn || item?.nameEn || item?.subjectEn,
      item?.titleJp || item?.nameJp || item?.subjectJp
    );

  const getLocalizedItemDescription = (item) =>
    pickByLanguage(
      item?.description || item?.content || item?.summary || '',
      item?.descriptionEn || item?.description_en || item?.contentEn || item?.summaryEn || '',
      item?.descriptionJp || item?.description_jp || item?.contentJp || item?.summaryJp || ''
    );

  const hexToRgba = (hex, alpha = 0.16) => {
    const h = String(hex || '').replace('#', '');
    if (!/^[0-9a-fA-F]{6}$/.test(h)) return `rgba(37, 99, 235, ${alpha})`;
    const r = parseInt(h.slice(0, 2), 16);
    const g = parseInt(h.slice(2, 4), 16);
    const b = parseInt(h.slice(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  const getCategoryTagStyle = (hexColor) => {
    const color = /^#[0-9a-fA-F]{6}$/.test(String(hexColor || '')) ? hexColor : '#2563eb';
    return {
      backgroundColor: hexToRgba(color, 0.18),
      color,
      border: `1px solid ${hexToRgba(color, 0.45)}`,
    };
  };

  const getNewsCategoryLabel = (item) =>
    pickPublicPostCategoryLabel(
      { category: { name: item?.categoryName, slug: item?.categorySlug } },
      language,
      t.news || 'Tin tức'
    );

  const getItemTag = (item) => {
    if (item?.type === 'news') return getNewsCategoryLabel(item);
    if (item?.type === 'job-pickup') return t.agentHomeJobPickup;
    if (item?.type === 'campaign') return t.agentHomeCampaign;
    return t.news || 'News';
  };

  // Strip HTML tags and format text
  const stripHtml = (html) => {
    if (!html) return '';
    
    // Check if it's already plain text
    if (!html.includes('<')) return html;
    
    try {
      // Create a temporary div element
      const tmp = document.createElement('div');
      tmp.innerHTML = html;
      
      // Convert <ul><li> and <ol><li> to bullet points
      const lists = tmp.querySelectorAll('ul, ol');
      lists.forEach(list => {
        const items = list.querySelectorAll('li');
        const bulletPoints = Array.from(items).map(li => {
          const text = li.textContent.trim();
          return text ? `• ${text}` : '';
        }).filter(Boolean).join('\n');
        
        if (bulletPoints) {
          const textNode = document.createTextNode(bulletPoints);
          if (list.parentNode) {
            list.parentNode.replaceChild(textNode, list);
          }
        } else {
          list.remove();
        }
      });
      
      // Convert <br> to newlines
      const breaks = tmp.querySelectorAll('br');
      breaks.forEach(br => {
        br.replaceWith('\n');
      });
      
      // Convert <p> to newlines
      const paragraphs = tmp.querySelectorAll('p');
      paragraphs.forEach(p => {
        const text = p.textContent.trim();
        if (text) {
          p.replaceWith(`\n${text}\n`);
        } else {
          p.remove();
        }
      });
      
      // Get text content
      let text = tmp.textContent || tmp.innerText || '';
      
      // Clean up extra whitespace and newlines
      text = text
        .replace(/\n\s*\n\s*\n/g, '\n\n') // Max 2 consecutive newlines
        .replace(/[ \t]+/g, ' ') // Multiple spaces to single space
        .trim();
      
      return text;
    } catch (error) {
      console.error('Error stripping HTML:', error);
      // Fallback: simple regex to remove HTML tags
      return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
    }
  };

  const getNewsPreviewText = (item) => {
    const fromMeta = stripHtml(getLocalizedItemDescription(item));
    if (fromMeta) return fromMeta;
    return stripHtml(
      pickByLanguage(
        item?.content || '',
        item?.contentEn || item?.content_en || '',
        item?.contentJp || item?.content_jp || ''
      )
    );
  };

  const handleRowClick = async (item, page = 1) => {
    if (item.type === 'news') {
      closeSlidePanel();
      const blogKey = item.slug || item.originalId;
      navigate(`/landing/collaborator/blog/${encodeURIComponent(blogKey)}`);
      return;
    }
    if (item.type !== 'campaign' && item.type !== 'job-pickup') {
      setModalJobs([]);
      return;
    }

    if (page === 1) {
      setSelectedItem(item);
      setShowModal(false);
      setModalJobs([]);
      modalCursorChainRef.current = [null];
    }
    setModalLoading(true);

    let chain = modalCursorChainRef.current.slice();
    let targetPage = Math.max(1, parseInt(page, 10) || 1);
    if (targetPage === 1) {
      chain = [null];
    } else if (targetPage > chain.length) {
      targetPage = chain.length;
    }
    let reqCursor = chain[targetPage - 1];
    if (targetPage > 1 && (reqCursor === undefined || reqCursor === null)) {
      targetPage = Math.max(1, chain.length - 1);
      reqCursor = chain[targetPage - 1];
    }

    setModalPage(targetPage);

    const baseParams = {
      limit: 10,
      sortBy: 'id',
      sortOrder: 'DESC'
    };
    if (reqCursor) baseParams.cursor = reqCursor;

    try {
      let response;
      if (item.type === 'campaign') {
        console.log(`[Frontend] Loading jobs for campaign ID: ${item.originalId}`);
        response = await apiService.getCTVJobsByCampaign(item.originalId, baseParams);
        console.log(`[Frontend] Campaign jobs response:`, response);
      } else {
        console.log(`[Frontend] Loading jobs for job pickup ID: ${item.originalId}`);
        response = await apiService.getCTVJobsByJobPickup(item.originalId, baseParams);
        console.log(`[Frontend] Job pickup jobs response:`, response);
      }

      if (response.success && response.data?.jobs) {
        setModalJobs(response.data.jobs);
        const pag = response.data.pagination || {};
        const hasMore = !!pag.hasMore;
        const nextCursor = pag.nextCursor || null;
        const newChain = chain.slice(0, targetPage);
        if (hasMore && nextCursor) {
          newChain.push(nextCursor);
        }
        modalCursorChainRef.current = newChain;
        setModalPagination({
          page: targetPage,
          limit: 10,
          hasNext: hasMore
        });
        setModalPage(targetPage);
      } else {
        if (page === 1) {
          setModalJobs([]);
        }
        modalCursorChainRef.current = [null];
        setModalPagination({ page: targetPage, limit: 10, hasNext: false });
      }
    } catch (error) {
      console.error('Error loading jobs:', error);
      if (page === 1) {
        setModalJobs([]);
      }
      modalCursorChainRef.current = [null];
      setModalPagination({ page: 1, limit: 10, hasNext: false });
    } finally {
      setModalLoading(false);
    }
  };

  const loadMoreModalJobs = () => {
    if (selectedItem && modalPagination.hasNext) {
      handleRowClick(selectedItem, modalPage + 1);
    }
  };
  const formatJob = (job) => {
    // Get commission info from jobValues
    // Cấu trúc: job có jobCommissionType ('fixed' hoặc 'percent')
    // jobValues có value (string) chứa giá trị cụ thể
    const jobValues = job.jobValues || job.profits || [];
    let commissionText = t.agentHomeContact;
    
    if (jobValues.length > 0) {
      // Lấy jobValue đầu tiên
      const firstJobValue = jobValues[0];
      
      // Lấy giá trị từ jobValue.value
      const value = firstJobValue.value;
      const commissionType = job.jobCommissionType || 'fixed';
      
      if (value) {
        if (commissionType === 'fixed' || commissionType === 'percent') {
          // Nếu là fixed, giá trị là số tiền
          if (commissionType === 'fixed') {
            const amount = parseInt(value) || 0;
            if (amount > 0) {
              commissionText = `${amount.toLocaleString('vi-VN')} yên`;
            }
          } else if (commissionType === 'percent') {
            // Nếu là percent, giá trị có thể là string như "5%" hoặc số
            if (typeof value === 'string' && value.includes('%')) {
              commissionText = value;
            } else {
              const percent = parseFloat(value) || 0;
              if (percent > 0) {
                commissionText = `${percent}%`;
              }
            }
          }
        }
      }
      
      // Fallback: Nếu có settings (cho tương thích với API cũ)
      if (commissionText === t.agentHomeContact && firstJobValue.settings && typeof firstJobValue.settings === 'object') {
        const settings = firstJobValue.settings;
        const settingKeys = Object.keys(settings);
        
        if (settingKeys.length > 0) {
          const firstValue = settings[settingKeys[0]];
          const type = firstJobValue.type;
          
          if (type === 1) {
            // Phí cố định
            const amount = parseInt(firstValue) || 0;
            if (amount > 0) {
              commissionText = `${amount.toLocaleString('vi-VN')} yên`;
            }
          } else if (type === 2) {
            // Phí %
            if (typeof firstValue === 'string') {
              commissionText = firstValue;
            } else {
              commissionText = `${firstValue}%`;
            }
          }
        }
      }
    }

    return {
      id: job.id,
      jobCode: job.jobCode || job.id,
      title: job.title || '',
      category: job.category?.name || '',
      company: job.company?.name || '',
      workLocation: stripHtml(job.workLocation || ''),
      estimatedSalary: stripHtml(job.estimatedSalary || ''),
      commission: commissionText,
      isHot: job.isHot,
      isPinned: job.isPinned,
    };
  };

  const getTagColorClass = (color) => {
    const colorMap = {
      green: 'bg-green-50 text-green-700 border-green-200',
      orange: 'bg-orange-50 text-orange-700 border-orange-200',
      blue: 'bg-blue-50 text-blue-700 border-blue-200',
    };
    return colorMap[color] || 'bg-gray-50 text-gray-700 border-gray-200';
  };

  const getTagInlineStyle = (tagColorClass) => {
    // Map các tagColor class từ code cũ sang inline styles
    if (tagColorClass.includes('bg-yellow-100')) {
      return { backgroundColor: '#fef3c7', color: '#a16207', borderColor: '#fde047' };
    } else if (tagColorClass.includes('bg-purple-100')) {
      return { backgroundColor: '#f3e8ff', color: '#7e22ce', borderColor: '#d8b4fe' };
    } else if (tagColorClass.includes('bg-blue-100')) {
      return { backgroundColor: '#dbeafe', color: '#1e40af', borderColor: '#93c5fd' };
    } else if (tagColorClass.includes('bg-green-50')) {
      return { backgroundColor: '#f0fdf4', color: '#15803d', borderColor: '#bbf7d0' };
    } else if (tagColorClass.includes('bg-orange-50')) {
      return { backgroundColor: '#fff7ed', color: '#c2410c', borderColor: '#fed7aa' };
    } else if (tagColorClass.includes('bg-blue-50')) {
      return { backgroundColor: '#eff6ff', color: '#1e40af', borderColor: '#bfdbfe' };
    } else {
      return { backgroundColor: '#f9fafb', color: '#374151', borderColor: '#e5e7eb' };
    }
  };

  const hasInitialData = tableData.length > 0;
  const showInitialLoading = !error && !hasInitialData;
  const showInitialError = error && !hasInitialData;
  const selectedPickupDescription =
    selectedItem?.type === 'job-pickup' ? getLocalizedItemDescription(selectedItem) : '';

  // Màu gradient cho card (xoay vòng 3 kiểu: tím, xanh indigo, hồng)
  const productCardThemes = [
    { gradient: 'linear-gradient(135deg, #e9d5ff 0%, #ddd6fe 50%, #c4b5fd 100%)', accent: 'rgba(167,139,250,0.4)' },
    { gradient: 'linear-gradient(135deg, #312e81 0%, #3730a3 50%, #4338ca 100%)', accent: 'rgba(199,210,254,0.5)' },
    { gradient: 'linear-gradient(135deg, #f472b6 0%, #fb7185 50%, #fda4af 100%)', accent: 'rgba(251,207,232,0.5)' },
  ];

  const renderBlock = (title, items, defaultIcon) => (
    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-lg border border-slate-100 bg-slate-50/50">
      <div className="flex flex-shrink-0 items-center justify-between border-b border-slate-100 bg-slate-50 px-2 py-1">
        <h3 className="text-[8px] sm:text-[9px] md:text-[9px] font-semibold text-slate-700">{title}</h3>
        {items.length > 0 && (
          <span className="text-[8px] text-slate-500">{items.length}{language === 'ja' ? '件' : ''}</span>
        )}
      </div>
      {items.length > 0 ? (
        <div className="flex-1 min-h-0 max-h-[210px] overflow-y-auto sm:max-h-[230px]">
          <div className="grid grid-cols-1 gap-1.5 p-1.5">
            {items.map((item) => {
              const iconMap = { 'Star': Star, 'Target': Target, 'FileText': FileText };
              const Icon = iconMap[item.tagIcon] || defaultIcon;
              const previewText = getNewsPreviewText(item);
              return (
                <div
                  key={item.id}
                  onClick={() => handleRowClick(item)}
                  onMouseEnter={() => setHoveredCardIndex(item.id)}
                  onMouseLeave={() => setHoveredCardIndex(null)}
                  className={`flex flex-col border rounded-md p-1.5 transition-all cursor-pointer bg-white hover:border-blue-200 hover:shadow-sm ${
                    previewText ? 'min-h-[6.75rem] sm:min-h-[7.25rem]' : ''
                  } ${hoveredCardIndex === item.id ? 'border-blue-200 shadow-sm' : 'border-slate-100'}`}
                >
                  <div className="flex flex-shrink-0 items-start gap-1">
                    <div
                      className="p-0.5 rounded flex-shrink-0 border"
                      style={item.type === 'news' ? getCategoryTagStyle(item.categoryColor) : getTagInlineStyle(item.tagColor)}
                    >
                      <Icon className="w-2.5 h-2.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="mb-0.5 flex items-center gap-1">
                        <span
                          className="inline-flex items-center rounded-full px-1.5 py-0.5 text-[7px] sm:text-[8px] font-bold"
                          style={item.type === 'news' ? getCategoryTagStyle(item.categoryColor) : undefined}
                        >
                          {getItemTag(item)}
                        </span>
                        <span className="text-[7px] sm:text-[8px] text-slate-400">{item.date}</span>
                      </div>
                      <h4 className={`text-[8px] sm:text-[9px] ${item.isNew ? 'font-semibold' : 'font-medium'} leading-tight text-slate-900`}>
                        {getLocalizedItemTitle(item)}
                      </h4>
                    </div>
                  </div>
                  <div className={`flex min-h-0 flex-col pl-[1.125rem] ${previewText ? 'flex-1' : ''}`}>
                    <NewsPreview text={previewText} />
                    {item.isNew && (
                      <span className="mt-auto inline-block w-fit px-1 py-0.5 text-white text-[7px] font-semibold rounded bg-red-500">{t.new || 'Mới'}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center p-2">
          <p className="text-[9px] sm:text-[10px] text-slate-400">{t.noData || 'Không có dữ liệu'}</p>
        </div>
      )}
    </div>
  );

  return showInitialLoading ? (
    <div className="w-full bg-white rounded-sm sm:rounded-md border border-gray-100 shadow-[0_4px_18px_rgba(15,23,42,0.04)] overflow-hidden">
      <div className="border-b border-gray-100 px-2 sm:px-2.5 md:px-3 py-2 sm:py-2.5 bg-slate-50">
        <div className="h-4 sm:h-5 rounded w-1/4 animate-pulse bg-slate-100" />
      </div>
      <div className="p-2 sm:p-2.5 md:p-3">
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-12 sm:h-14 rounded animate-pulse bg-slate-50" />
          ))}
        </div>
      </div>
    </div>
  ) : showInitialError ? (
    <div className="w-full bg-white rounded-sm sm:rounded-md border border-gray-100 overflow-hidden">
      <div className="border-b border-gray-100 px-2 sm:px-2.5 md:px-3 py-2 sm:py-2.5 bg-slate-50">
        <h3 className="text-[10px] sm:text-xs font-semibold text-gray-900">{t.informationList || 'Danh sách thông tin'}</h3>
      </div>
      <div className="p-6 text-center">
        <p className="mb-2 text-sm text-red-600">{t.agentHomeErrorOccurred}</p>
        <p className="text-[11px] sm:text-xs text-gray-500">{error}</p>
        <button
          onClick={() => loadData(1, false)}
          onMouseEnter={() => setHoveredRetryButton(true)}
          onMouseLeave={() => setHoveredRetryButton(false)}
          className="mt-4 px-3 py-1.5 rounded-lg text-xs font-medium bg-red-600 text-white hover:bg-red-700 transition-colors"
        >
          {t.agentHomeRetry}
        </button>
      </div>
    </div>
  ) : (
    <div className="w-full space-y-2 overflow-hidden xl:space-y-2.5">
      <div className="rounded-2xl border border-red-100/70 bg-white p-2 sm:p-2.5 xl:p-3">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div className="max-w-xl">
            <p className="text-[10px] font-medium text-slate-500 xl:text-[10px]">{t.agentHomeBreadcrumb || 'Pages / Thông tin chung'}</p>
            <h2 className="mt-1 text-[clamp(1rem,1.55vw,1.28rem)] font-bold leading-tight text-slate-950">{t.agentHomeWelcomeTitle || 'Xin chào, Cộng tác viên!'}</h2>
            <p className="mt-1 text-[10px] text-slate-500 xl:text-[11px]">{t.agentHomeWelcomeSubtitle || 'Hôm nay bạn muốn bắt đầu từ đâu?'}</p>
          </div>
        </div>
        <div className="mt-2.5 grid grid-cols-1 gap-1.5 sm:grid-cols-2 xl:grid-cols-4 xl:gap-2">
          <button type="button" onClick={() => { setQuickCreateOpen(true); setQuickCreateKey((prev) => prev + 1); }} className="group flex min-h-[68px] items-center gap-1.5 rounded-2xl bg-gradient-to-br from-red-600 to-red-700 p-2 text-left text-white shadow-lg shadow-red-600/20 transition-all hover:-translate-y-0.5 hover:shadow-xl lg:min-h-[84px] lg:gap-2 lg:p-2.5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center lg:h-11 lg:w-11"><img src={createCvIcon} alt="" className="h-10 w-10 object-contain lg:h-11 lg:w-11" /></div>
            <div className="min-w-0"><h3 className="text-[11px] font-bold leading-tight xl:text-[12px]">{t.agentHomeCreateCandidate || 'Tạo hồ sơ ứng viên mới'}</h3><p className="mt-0.5 text-[9px] leading-snug text-white/80 xl:text-[10px]">{t.agentHomeCreateCandidateDesc || 'Upload CV / nhập thông tin nhanh'}</p></div>
          </button>
          {[
            { label: t.agentHomeChatAdmin || 'Chat với admin', desc: t.agentHomeChatAdminDesc || 'Trao đổi nhanh với đội ngũ', iconSrc: chatAdminIcon, onClick: openAdminChat },
            { label: t.agentHomeHotJobs || 'Xem job đang hot', desc: t.agentHomeHotJobsDesc || 'Cập nhật job tốt nhất', iconSrc: hotJobIcon, onClick: () => navigate('/agent/jobs') },
            { label: t.agentHomeTrackCandidate || 'Theo dõi ứng viên', desc: t.agentHomeTrackCandidateDesc || 'Kiểm tra tiến độ ứng viên', iconSrc: trackCandidateIcon, onClick: () => navigate('/agent/nominations') },
          ].map((quick) => {
            return (
              <button key={quick.label} type="button" onClick={quick.onClick} className="group flex min-h-[68px] items-center gap-1.5 rounded-2xl border border-slate-100 bg-white p-2 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-red-100 hover:shadow-md lg:min-h-[84px] lg:gap-2 lg:p-2.5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center lg:h-11 lg:w-11"><img src={quick.iconSrc} alt="" className="h-10 w-10 object-contain lg:h-11 lg:w-11" /></div>
                <div className="min-w-0"><h3 className="text-[11px] font-bold leading-tight text-slate-900 xl:text-[12px]">{quick.label}</h3><p className="mt-0.5 text-[9px] leading-snug text-slate-500 xl:text-[10px]">{quick.desc}</p></div>
              </button>
            );
          })}
        </div>
      </div>
      <AgentHomePageSession1/>
      {jobPickups.length > 0 && (
        <div className="rounded-2xl border border-red-100/70 bg-white px-3 py-3 sm:px-4 sm:py-3.5">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h3 className="text-[13px] sm:text-sm font-bold text-slate-900 uppercase tracking-wide">
              {t.agentHomeFeaturedJobsTitle || 'TỔNG HỢP JOB NỔI BẬT DÀNH CHO BẠN'}
            </h3>
            <button type="button" className="shrink-0 text-[10px] sm:text-[11px] font-semibold text-red-600 hover:text-red-700">
              {t.seeAll || 'Xem tất cả'} ›
            </button>
          </div>
          <div className="-mx-1 flex snap-x snap-mandatory gap-3 overflow-x-auto px-1 pb-2 hide-scrollbar sm:gap-4">
            {jobPickups.map((item, index) => {
              const theme = productCardThemes[index % productCardThemes.length];
              const coverSrc = item.coverUrl || item.cover_url;
              const pickupDescription = getLocalizedItemDescription(item);
              return (
                <div
                  key={item.id}
                  onClick={() => handleRowClick(item)}
                  onMouseEnter={() => setHoveredCardIndex(item.id)}
                  onMouseLeave={() => setHoveredCardIndex(null)}
                  className={`group flex w-[min(68vw,220px)] shrink-0 snap-start flex-col overflow-hidden rounded-xl border bg-white shadow-sm transition-all duration-200 cursor-pointer hover:-translate-y-0.5 hover:shadow-lg sm:w-[240px] md:w-[260px] ${
                    hoveredCardIndex === item.id ? 'border-red-200 shadow-lg ring-1 ring-red-100' : 'border-slate-100'
                  }`}
                >
                  <div
                    className="relative aspect-video w-full overflow-hidden bg-slate-100"
                    style={!coverSrc ? { background: theme.gradient } : undefined}
                  >
                    {coverSrc ? (
                      <img
                        src={normalizePostImageUrl(coverSrc)}
                        alt=""
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                      />
                    ) : (
                      <>
                        <div className="absolute inset-0 flex items-start justify-start gap-1.5 p-3">
                          <span className="h-2.5 w-2.5 rounded-full opacity-80" style={{ backgroundColor: theme.accent }} />
                          <span className="h-2.5 w-2.5 rounded-full opacity-80" style={{ backgroundColor: theme.accent }} />
                          <span className="h-2.5 w-2.5 rounded-full opacity-80" style={{ backgroundColor: theme.accent }} />
                        </div>
                        <div className="absolute bottom-3 left-3 right-3 flex gap-1.5">
                          <div className="h-2 flex-1 rounded opacity-60" style={{ backgroundColor: theme.accent }} />
                          <div className="h-4 w-10 rounded opacity-50" style={{ backgroundColor: theme.accent }} />
                        </div>
                      </>
                    )}
                    {item.isNew && (
                      <span className="absolute left-2.5 top-2.5 rounded-md bg-red-500 px-2 py-0.5 text-[10px] font-bold text-white shadow-sm">
                        {t.new || 'Mới'}
                      </span>
                    )}
                  </div>
                  <div className={`flex flex-col bg-white p-2.5 sm:p-3 ${pickupDescription ? 'min-h-[5rem] sm:min-h-[5.25rem]' : 'min-h-[4rem] sm:min-h-[4.25rem]'}`}>
                    <p className="mb-0.5 text-[10px] text-slate-400 sm:text-[11px]">{item.date}</p>
                    <h4 className={`line-clamp-2 text-[12px] font-bold leading-snug text-slate-900 break-words sm:text-[13px] ${item.isNew ? 'text-amber-800' : ''}`}>
                      {getLocalizedItemTitle(item)}
                    </h4>
                    {pickupDescription ? (
                      <p className="mt-1 line-clamp-2 text-[10px] leading-relaxed text-slate-500 break-words sm:text-[11px]">
                        {pickupDescription}
                      </p>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {campaigns.length > 0 && (
        <div className="rounded-2xl border border-red-100/70 bg-white px-3 py-2.5">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-[13px] sm:text-sm font-bold text-slate-900">
              {t.agentHomeCampaign}
            </h3>
            <button type="button" className="text-[10px] font-semibold text-red-600 hover:text-red-700">{t.seeAll || 'Xem tất cả'} ›</button>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 hide-scrollbar">
            {campaigns.map((item, index) => {
              const theme = productCardThemes[index % productCardThemes.length];
              const coverSrc = item.coverUrl || item.cover_url;
              return (
                <div
                  key={item.id}
                  onClick={() => handleRowClick(item)}
                  onMouseEnter={() => setHoveredCardIndex(item.id)}
                  onMouseLeave={() => setHoveredCardIndex(null)}
                  className={`flex-shrink-0 w-[140px] sm:w-[164px] rounded-xl border overflow-hidden transition-all cursor-pointer bg-white shadow-sm hover:shadow-md ${
                    hoveredCardIndex === item.id ? 'border-blue-300 shadow-md ring-1 ring-blue-200' : 'border-slate-100'
                  }`}
                >
                  <div
                    className="h-[72px] sm:h-[88px] relative overflow-hidden bg-slate-100"
                    style={!coverSrc ? { background: theme.gradient } : undefined}
                  >
                    {coverSrc ? (
                      <img
                        src={normalizePostImageUrl(coverSrc)}
                        alt=""
                        className="absolute inset-0 h-full w-full object-cover"
                      />
                    ) : (
                      <>
                        <div className="absolute inset-0 flex items-start justify-start p-2 gap-1">
                          <span className="w-2 h-2 rounded-full opacity-80" style={{ backgroundColor: theme.accent }} />
                          <span className="w-2 h-2 rounded-full opacity-80" style={{ backgroundColor: theme.accent }} />
                          <span className="w-2 h-2 rounded-full opacity-80" style={{ backgroundColor: theme.accent }} />
                        </div>
                        <div className="absolute bottom-2 left-2 right-2 flex gap-1">
                          <div className="h-1.5 flex-1 rounded opacity-60" style={{ backgroundColor: theme.accent }} />
                          <div className="h-3 w-8 rounded opacity-50" style={{ backgroundColor: theme.accent }} />
                        </div>
                      </>
                    )}
                  </div>
                  <div className="p-2 bg-white">
                    <p className="mb-0.5 flex items-center gap-0.5 text-[9px] text-slate-500 sm:text-[10px]">
                      {item.date}
                      <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                    </p>
                    <h4 className={`text-[11px] sm:text-[12px] font-bold text-slate-900 leading-tight break-words whitespace-normal ${item.isNew ? 'text-amber-700' : ''}`}>
                      {getLocalizedItemTitle(item)}
                    </h4>
                    {item.isNew && (
                      <span className="inline-block mt-1 px-1.5 py-0.5 text-white text-[8px] font-semibold rounded bg-red-500">
                        {t.new || 'Mới'}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-red-100/70 bg-white p-3">
        {renderBlock(t.agentHomeNews || t.news || 'News', sortedNewsItems, FileText)}
      </div>

      <QuickCreateCandidateDrawer
        key={quickCreateKey}
        open={quickCreateOpen}
        onClose={() => setQuickCreateOpen(false)}
        onCreated={() => setQuickCreateOpen(false)}
        variant="collaborator"
      />

      {/* Slide-in panel từ bên trái (thay pop-up) */}
      {selectedItem && (
        <>
          {/* Backdrop */}
          <div
            className={`fixed inset-0 z-40 bg-slate-900/50 transition-opacity duration-300 ${showModal ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
            onClick={closeSlidePanel}
            aria-hidden="true"
          />
          {/* Panel */}
          <div
            className={`fixed inset-y-0 left-0 z-50 w-full max-w-[95vw] sm:max-w-2xl md:max-w-4xl bg-white shadow-xl flex flex-col transition-transform duration-300 ease-out ${
              showModal ? 'translate-x-0' : '-translate-x-full'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-2 p-3 border-b border-slate-100 bg-slate-50 flex-shrink-0">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                {selectedItem.tagIcon && (() => {
                  const iconMap = { 'Star': Star, 'Target': Target, 'FileText': FileText };
                  const IconComponent = iconMap[selectedItem.tagIcon] || FileText;
                  return (
                    <div className="p-1.5 rounded-lg flex-shrink-0 border" style={selectedItem.type === 'news' ? getCategoryTagStyle(selectedItem.categoryColor) : getTagInlineStyle(selectedItem.tagColor)}>
                      <IconComponent className="w-4 h-4" />
                    </div>
                  );
                })()}
                <div className="min-w-0">
                  <h3 className="text-sm font-bold truncate text-gray-900">{getLocalizedItemTitle(selectedItem)}</h3>
                  {selectedPickupDescription ? (
                    <p className="mt-0.5 line-clamp-2 text-[11px] leading-relaxed text-gray-500">
                      {selectedPickupDescription}
                    </p>
                  ) : null}
                  {modalJobs.length > 0 && (
                    <p className="text-[10px] text-gray-500">
                      {t.agentHomeTotalJobs.replace(
                        '{count}',
                        String(modalJobs.length) + (modalPagination.hasNext ? '+' : '')
                      )}
                    </p>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={closeSlidePanel}
                onMouseEnter={() => setHoveredCloseModalButton(true)}
                onMouseLeave={() => setHoveredCloseModalButton(false)}
                className="p-2 rounded-lg hover:bg-slate-200 text-slate-600 flex-shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {(selectedItem.coverUrl || selectedItem.cover_url) && (
              <div className="flex-shrink-0 w-full aspect-video max-h-56 border-b border-slate-100 bg-slate-100 sm:max-h-64">
                <img
                  src={normalizePostImageUrl(selectedItem.coverUrl || selectedItem.cover_url)}
                  alt=""
                  className="h-full w-full object-cover"
                />
              </div>
            )}

            <div className="flex-1 overflow-y-auto flex flex-col min-h-0 p-2 sm:p-3">
              {modalLoading && modalJobs.length === 0 ? (
                <div className="flex items-center justify-center py-12 text-gray-500">
                  {t.loading}
                </div>
              ) : modalJobs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <p className="text-sm font-medium text-gray-600">{t.agentHomeNoJobs}</p>
                  <p className="text-xs text-gray-400 mt-1">{t.agentHomeNoJobsRelated}</p>
                </div>
              ) : (
                <>
                  <div className="flex-1 min-h-[min(50dvh,420px)] w-full lg:min-h-0">
                    <AgentJobsPageSession2
                      jobs={modalJobs}
                      showAllJobs
                      hideViewMoreButton
                      jobsBasePath="/agent/jobs"
                    />
                  </div>
                  {(modalPage > 1 || modalPagination.hasNext) && (
                    <div className="pt-3 pb-2 flex items-center justify-center gap-2 border-t border-slate-100 mt-2 flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => selectedItem && modalPage > 1 && handleRowClick(selectedItem, modalPage - 1)}
                        disabled={modalLoading || modalPage <= 1}
                        className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <span className="text-xs text-slate-600 min-w-[120px] text-center">
                        {language === 'vi'
                          ? `Trang ${modalPage}`
                          : language === 'en'
                            ? `Page ${modalPage}`
                            : `ページ ${modalPage}`}
                      </span>
                      <button
                        type="button"
                        onClick={() => selectedItem && modalPagination.hasNext && handleRowClick(selectedItem, modalPage + 1)}
                        disabled={modalLoading || !modalPagination.hasNext}
                        className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default memo(AgentHomePageSession3);