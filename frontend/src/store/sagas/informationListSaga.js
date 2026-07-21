import { call, put, takeLatest, delay, select, fork } from 'redux-saga/effects';
import {
  FETCH_INFORMATION_LIST_REQUEST,
  FETCH_INFORMATION_LIST_MORE_REQUEST,
  FETCH_INFORMATION_LIST_SUCCESS,
  FETCH_INFORMATION_LIST_FAILURE,
  FETCH_INFORMATION_LIST_MORE_SUCCESS,
  FETCH_INFORMATION_LIST_MORE_FAILURE,
  START_INFORMATION_LIST_POLLING,
  STOP_INFORMATION_LIST_POLLING
} from '../actions/informationListActions';
import apiService from '../../services/api';

const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '';
  return date.toLocaleDateString('vi-VN', { year: 'numeric', month: '2-digit', day: '2-digit' });
};

const isRecent = (dateString) => {
  if (!dateString) return false;
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return false;
  const daysDiff = (Date.now() - date.getTime()) / (1000 * 60 * 60 * 24);
  return daysDiff <= 7;
};

let informationListInFlight = false;
let lastInformationListKey = '';
let lastInformationListAt = 0;

function* fetchInformationListSaga(action) {
  const { page = 1, append = false } = action.payload || {};
  const requestKey = `${page}-${append ? 'append' : 'replace'}`;
  const now = Date.now();
  if (informationListInFlight) return;
  if (!append && lastInformationListKey === requestKey && now - lastInformationListAt < 1000) return;
  informationListInFlight = true;
  lastInformationListKey = requestKey;
  lastInformationListAt = now;
  const limit = 20;

  let jobPickupsRes, campaignsRes, postsRes;
  try { jobPickupsRes = yield call(apiService.getCTVJobPickups, { page, limit, sortBy: 'created_at', sortOrder: 'DESC' }); } catch (err) { jobPickupsRes = { success: false, data: { pickups: [], pagination: {} } }; }
  try { campaignsRes = yield call(apiService.getCTVCampaigns, { page, limit, status: 1, sortBy: 'created_at', sortOrder: 'DESC' }); } catch (err) { campaignsRes = { success: false, data: { campaigns: [], pagination: {} } }; }
  try { postsRes = yield call(apiService.getCTVPosts, { page, limit, status: 2, sortBy: 'published_at', sortOrder: 'DESC' }); } catch (err) { postsRes = { success: false, data: { posts: [], pagination: {} } }; }

  try {
    const newData = [];
    const newPagination = { jobPickups: { total: 0, totalPages: 0 }, campaigns: { total: 0, totalPages: 0 }, posts: { total: 0, totalPages: 0 } };

    if (jobPickupsRes.success && jobPickupsRes.data?.pickups) {
      jobPickupsRes.data.pickups.forEach((pickup) => {
        newData.push({ id: `pickup-${pickup.id}`, type: 'job-pickup', originalId: pickup.id, tag: 'Job pick-up', tagColor: 'bg-yellow-100 text-yellow-700', tagIcon: 'Star', title: pickup.name || '', titleEn: pickup.nameEn || pickup.name_en || '', titleJp: pickup.nameJp || pickup.name_jp || '', date: formatDate(pickup.createdAt), description: pickup.description || '', descriptionEn: pickup.descriptionEn || pickup.description_en || '', descriptionJp: pickup.descriptionJp || pickup.description_jp || '', coverUrl: pickup.coverUrl || pickup.cover_url || '', action: 'Xem chi tiết', url: `/agent/jobs?pickupId=${pickup.id}`, isNew: isRecent(pickup.createdAt) });
      });
      if (jobPickupsRes.data.pagination) newPagination.jobPickups = jobPickupsRes.data.pagination;
    }
    if (campaignsRes.success && campaignsRes.data?.campaigns) {
      campaignsRes.data.campaigns.forEach((campaign) => {
        newData.push({ id: `campaign-${campaign.id}`, type: 'campaign', originalId: campaign.id, tag: 'Campaign', tagColor: 'bg-purple-100 text-purple-700', tagIcon: 'Target', title: campaign.name || '', titleEn: campaign.nameEn || campaign.name_en || '', titleJp: campaign.nameJp || campaign.name_jp || '', date: formatDate(campaign.startDate || campaign.createdAt), description: campaign.description || '', descriptionEn: campaign.descriptionEn || campaign.description_en || '', descriptionJp: campaign.descriptionJp || campaign.description_jp || '', coverUrl: campaign.coverUrl || campaign.cover_url || '', action: 'Xem chi tiết', url: `/agent/jobs?campaignId=${campaign.id}`, isNew: campaign.status === 1 && isRecent(campaign.startDate || campaign.createdAt) });
      });
      if (campaignsRes.data.pagination) newPagination.campaigns = campaignsRes.data.pagination;
    }
    if (postsRes.success && postsRes.data?.posts) {
      postsRes.data.posts.forEach((post) => {
        newData.push({ id: `post-${post.id}`, type: 'news', originalId: post.id, tag: 'News', tagColor: 'bg-blue-100 text-blue-700', tagIcon: 'FileText', title: post.title || '', titleEn: post.titleEn || post.title_en || '', titleJp: post.titleJp || post.title_jp || '', date: formatDate(post.publishedAt || post.createdAt), description: post.metaDescription || post.content?.substring(0, 100) || '', descriptionEn: post.metaDescriptionEn || post.meta_description_en || post.contentEn || post.content_en || '', descriptionJp: post.metaDescriptionJp || post.meta_description_jp || post.contentJp || post.content_jp || '', action: 'Xem chi tiết', url: `/agent/jobs?postId=${post.id}`, isNew: isRecent(post.publishedAt || post.createdAt) });
      });
      if (postsRes.data.pagination) newPagination.posts = postsRes.data.pagination;
    }

    newData.sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      if (isNaN(dateA.getTime()) && isNaN(dateB.getTime())) return 0;
      if (isNaN(dateA.getTime())) return 1;
      if (isNaN(dateB.getTime())) return -1;
      return dateB - dateA;
    });

    const uniqueData = [];
    const seenIds = new Set();
    newData.forEach(item => { if (!seenIds.has(item.id)) { seenIds.add(item.id); uniqueData.push(item); } });

    if (append) {
      yield put({ type: FETCH_INFORMATION_LIST_MORE_SUCCESS, payload: { data: uniqueData, pagination: newPagination } });
    } else {
      yield put({ type: FETCH_INFORMATION_LIST_SUCCESS, payload: { data: uniqueData, pagination: newPagination } });
    }
  } catch (error) {
    yield put({ type: append ? FETCH_INFORMATION_LIST_MORE_FAILURE : FETCH_INFORMATION_LIST_FAILURE, payload: error.message || 'Failed to fetch information list' });
  } finally {
    informationListInFlight = false;
  }
}

function* pollingSaga() {
  let enabled = false;
  while (true) {
    const state = yield select();
    const { isPolling, pollingInterval } = state.informationList;
    enabled = !!(isPolling && pollingInterval);
    if (enabled) {
      yield put({ type: FETCH_INFORMATION_LIST_REQUEST, payload: { page: 1, append: false } });
      yield delay(pollingInterval);
    } else {
      yield delay(1000);
    }
  }
}

export function* informationListSaga() {
  yield takeLatest(FETCH_INFORMATION_LIST_REQUEST, fetchInformationListSaga);
  yield takeLatest(FETCH_INFORMATION_LIST_MORE_REQUEST, fetchInformationListSaga);
  yield fork(pollingSaga);
}

