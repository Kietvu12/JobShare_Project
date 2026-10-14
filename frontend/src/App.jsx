import React, { lazy, Suspense, useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import RouterNavigationTracker from './component/RouterNavigationTracker';
import { HelmetProvider } from 'react-helmet-async';
import './App.css';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import { withLocalePath } from './utils/localeRoutes';
import { NotificationProvider } from './context/NotificationContext';
import { CandidateAuthProvider } from './context/CandidateAuthContext';
import ProtectedRoute from './component/ProtectedRoute';
import AuthSessionListener from './component/AuthSessionListener';
import AgentLayout from './component/Layout/AgentLayout';
import AdminLayout from './component/Layout/AdminLayout';
import JobsListPage from './component/Shared/JobsListPage';
import JobDetailPage from './component/Shared/JobDetailPage';
import apiService from './services/api';
import HomePage from './page/Agent/HomePage';
import CandidatesPage from './page/Agent/CandidatesPage';
import NominationsPage from './page/Agent/NominationsPage';
import PaymentHistoryPage from './page/Agent/PaymentHistoryPage';
import AgentPaymentRequestDetailPage from './page/Agent/PaymentRequestDetailPage';
import ContactPage from './page/Agent/ContactPage';
import FAQPage from './page/Agent/FAQPage';
import TermsPage from './page/Agent/TermsPage';
import HotlinePage from './page/Agent/HotlinePage';
import AgentProfilePage from './page/Agent/AgentProfilePage';
import NotificationsPage from './page/Agent/NotificationsPage';
import AddCandidateForm from './component/Shared/AddCandidateForm';
import NominationSelectPage from './page/Shared/NominationSelectPage';
import NominationConfirmPage from './page/Shared/NominationConfirmPage';
import CandidateDetail from './page/Agent/CandidateDetail';
import CandidateApplicationsPage from './page/Agent/CandidateApplicationsPage';
import NominationDetail from './page/Agent/NominationDetail';
import Dashboard from './page/Admin/Dashboard';
import CollaboratorsPage from './page/Admin/CollaboratorsPage';
import CollaboratorApprovalPage from './page/Admin/CollaboratorApprovalPage';
import AddCollaboratorPage from './page/Admin/AddCollaboratorPage';
import CollaboratorRankingPage from './page/Admin/CollaboratorRankingPage';
import AdminCollaboratorDetailPage from './page/Admin/AdminCollaboratorDetailPage';
import AdminCandidatesPage from './page/Admin/CandidatesPage';
import AdminCandidateDetailPage from './page/Admin/AdminCandidateDetailPage';
import AdminAddJobPage from './page/Admin/AddJobPage';
import AdminNominationsPage from './page/Admin/NominationsPage';
import AdminAddNominationPage from './page/Admin/AddNominationPage';
import AdminNominationDetailPage from './page/Admin/AdminNominationDetailPage';
import PaymentsPage from './page/Admin/PaymentsPage';
import PaymentRequestDetailPage from './page/Admin/PaymentRequestDetailPage';
import CompaniesPage from './page/Admin/CompaniesPage';
import AddCompanyPage from './page/Admin/AddCompanyPage';
import AdminCompanyDetailPage from './page/Admin/AdminCompanyDetailPage';
import AdminBusinessesPage from './page/Admin/AdminBusinessesPage';
import AdminBusinessDetailPage from './page/Admin/AdminBusinessDetailPage';
import ReportsPage from './page/Admin/ReportsPage';
import AccountsPage from './page/Admin/AccountsPage';
import CampaignsPage from './page/Admin/CampaignsPage';
import UtmLinkBuilderPage from './page/Admin/UtmLinkBuilderPage';
import AddCampaignPage from './page/Admin/AddCampaignPage';
import AdminCampaignDetailPage from './page/Admin/AdminCampaignDetailPage';
import SettingsPage from './page/Admin/SettingsPage';
import JobCategoriesPage from './page/Admin/JobCategoriesPage';
import AdminJobPickupsPage from './page/Admin/AdminJobPickupsPage';
import AddJobCategoryPage from './page/Admin/AddJobCategoryPage';
import CollaboratorAssignmentsPage from './page/Admin/CollaboratorAssignmentsPage';
import MyAssignedCollaboratorsPage from './page/Admin/MyAssignedCollaboratorsPage';
import MyGroupPage from './page/Admin/MyGroupPage';
import GroupsPage from './page/Admin/GroupsPage';
import GroupDetailPage from './page/Admin/GroupDetailPage';
import AddGroupPage from './page/Admin/AddGroupPage';
import AddAdminPage from './page/Admin/AddAdminPage';
import GroupCandidatesPage from './page/Admin/GroupCandidatesPage';
import GroupCollaboratorsPage from './page/Admin/GroupCollaboratorsPage';
import EmailPage from './page/Admin/EmailPage';
import PostsPage from './page/Admin/PostsPage';
import EventsPage from './page/Admin/EventsPage';
import PublicCtvChatInboxPage from './page/Admin/PublicCtvChatInboxPage';
import AddEventPage from './page/Admin/AddEventPage';
import EventDetailPage from './page/Admin/EventDetailPage';
import LoginPage from './page/LoginPage';
import RegisterPage from './page/RegisterPage';
import VerifyEmailPage from './page/VerifyEmailPage';
import ResetPasswordPage from './page/ResetPasswordPage';
import AgentEventDetailPage from './page/Agent/EventDetailPage';
import AgentEventsPage from './page/Agent/AgentEventsPage';
import BusinessHomepage from './page/Bussiness/Homepage';
import BusinessLayoutWrapper from './component/Layout/BusinessLayoutWrapper';
import JobManagement from './page/Bussiness/JobManagement';
import JobAiBuilderPage from './page/Bussiness/JobAiBuilderPage';
import BusinessAddJobPage from './page/Bussiness/BusinessAddJobPage';
import JdBuilderChatPage from './page/Bussiness/JdBuilderChatPage';
import JobDetail from './page/Bussiness/JobDetail';
import JobApplication from './page/Bussiness/JobApplication';
import Candidate from './page/Bussiness/Candidate';
import BusinessUnlockedCandidateDetail from './page/Bussiness/BusinessUnlockedCandidateDetail';
import ScoutDirect from './page/Bussiness/ScoutDirect';
import ScoutManaged from './page/Bussiness/ScoutManaged';
import ScoutCandidateDetail from './page/Bussiness/ScoutCandidateDetail';
import AdminScoutPerformancePage from './page/Admin/ScoutPerformancePage';
import AdminScoutReservePage from './page/Admin/AdminScoutReservePage';
import AdminWsChatPage from './page/Admin/AdminWsChatPage';
import AdminCreditRequestsPage from './page/Admin/AdminCreditRequestsPage';
import AgentScoutPerformancePage from './page/Agent/ScoutPerformancePage';
import Branding from './page/Bussiness/Branding';
import BrandingLandingPages from './page/Bussiness/BrandingLandingPages';
import BusinessLandingPageEditor from './page/Bussiness/BusinessLandingPageEditor';
import BusinessLandingPageBuilder from './page/Bussiness/BusinessLandingPageBuilder';
import CandidateSharing from './page/Bussiness/CandidateSharing';
import CandidateSharingListingDetail, {
  CandidateSharingListingLegacyRedirect,
} from './page/Bussiness/CandidateSharingListingDetail';
import AdminCandidateSharingPage from './page/Admin/CandidateSharingPage';
import CtvMarketplacePage from './page/Agent/CtvMarketplacePage';
import KnowledgeHub from './page/Bussiness/KnowledgeHub';
import KnowledgeArticlePage from './page/Bussiness/KnowledgeArticlePage';
import ReportInsight from './page/Bussiness/ReportInsight';
import Message from './page/Bussiness/Message';
import Billing from './page/Bussiness/Billing';
import ServiceRequests from './page/Bussiness/ServiceRequests';
import CreditTopUpRequest from './page/Bussiness/CreditTopUpRequest';
import LandingPagePremiumRequest from './page/Bussiness/LandingPagePremiumRequest';
import RecruitmentAdsRequest from './page/Bussiness/RecruitmentAdsRequest';
import SeminarCampaignRequest from './page/Bussiness/SeminarCampaignRequest';
import CompanyProfileRequest from './page/Bussiness/CompanyProfileRequest';
import BusinessProfilePage from './page/Bussiness/BusinessProfilePage';
import BusinessRegister from './page/Bussiness/Register';
import BusinessLogin from './page/Bussiness/Login';
import BusinessVerifyEmail from './page/Bussiness/VerifyEmail';
import BusinessResetPassword from './page/Bussiness/ResetPassword';
import {
  LocaleGuard,
  LegacyPublicRedirect,
  PublicRootRedirect,
  LegacyLocalePublicJobsRedirect,
} from './component/LocaleRoute';
import { purgeLandingPersonaStyles } from './landing/shared/landingPersonaStyles';

/** Landing CTV/UV + template styles.css — lazy để không inject CSS global vào bundle Admin/Agent. */
const CollaboratorPublicLayout = lazy(() => import('./landing/collaborators/layout/CollaboratorPublicLayout'));
const CollaboratorHomePage = lazy(() => import('./landing/collaborators/pages/CollaboratorHomePage'));
const CollaboratorAboutPage = lazy(() => import('./landing/collaborators/pages/CollaboratorAboutPage'));
const CollaboratorJobsPage = lazy(() => import('./landing/collaborators/pages/CollaboratorJobsPage'));
const CollaboratorsNewsPage = lazy(() => import('./landing/collaborators/pages/CollaboratorsNewsPage'));
const CollaboratorBlogLegacyRedirect = lazy(
  () => import('./landing/collaborators/pages/CollaboratorBlogLegacyRedirect'),
);
const CollaboratorRegisterPage = lazy(() => import('./landing/collaborators/pages/CollaboratorRegisterPage'));
const CollaboratorLoginPage = lazy(() => import('./landing/collaborators/pages/CollaboratorLoginPage'));
const CandidatePublicLayout = lazy(() => import('./landing/candidates/layout/CandidatePublicLayout'));
const CandidateHomePage = lazy(() => import('./landing/candidates/pages/CandidateHomePage'));
const CandidateJobsPage = lazy(() => import('./landing/candidates/pages/CandidateJobsPage'));
const CandidateAboutPage = lazy(() => import('./landing/candidates/pages/CandidateAboutPage'));
const CandidateNewsPage = lazy(() => import('./landing/candidates/pages/CandidateNewsPage'));
const CandidateLoginPage = lazy(() => import('./landing/candidates/pages/CandidateLoginPage'));
const CandidateRegisterPage = lazy(() => import('./landing/candidates/pages/CandidateRegisterPage'));
const CandidateResetPasswordPage = lazy(() => import('./landing/candidates/pages/CandidateResetPasswordPage'));
const CandidateProfilePage = lazy(() => import('./page/LandingPage/Candidate/CandidateProfilePage'));
const BusinessLandingHome = lazy(() => import('./landing/business/Home'));
const BusinessMarketingLayout = lazy(() => import('./landing/business/BusinessMarketingLayout'));

function LandingRouteFallback() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center px-4 py-16 text-sm text-neutral-500">
      Loading…
    </div>
  );
}

function CollaboratorLoginRedirect() {
  const { language } = useLanguage();
  return <Navigate to={withLocalePath(language, '/collaborator/login')} replace />;
}

function withLandingSuspense(Component) {
  return (
    <Suspense fallback={<LandingRouteFallback />}>
      <Component />
    </Suspense>
  );
}

function BusinessRegisterRoute() {
  return (
    <Suspense fallback={<LandingRouteFallback />}>
      <BusinessMarketingLayout>
        <BusinessRegister />
      </BusinessMarketingLayout>
    </Suspense>
  );
}

const INTERNAL_APP_PREFIXES = ['/agent', '/admin', '/business', '/login', '/register'];

/** Gỡ CSS landing khi vào app nội bộ — không đổi markup Agent/Admin. */
function InternalAppCssFence() {
  const { pathname } = useLocation();
  useEffect(() => {
    const internal = INTERNAL_APP_PREFIXES.some(
      (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
    );
    if (!internal) return undefined;
    document.body.classList.remove(
      'jobshare-candidate-v1',
      'jobshare-collaborator-v3',
      'jobshare-template-login',
    );
    purgeLandingPersonaStyles('legacyGlobal');
    return undefined;
  }, [pathname]);
  return null;
}

// Admin Job Detail: phân quyền Chỉnh sửa (chỉ SuperAdmin role=1, AdminBackOffice role=2)
const AdminJobDetailWrapper = () => {
  const [adminProfile, setAdminProfile] = useState(null);
  const [backPath, setBackPath] = useState('/admin/jobs');
  useEffect(() => {
    const load = async () => {
      try {
        const res = await apiService.getAdminProfile();
        if (res.success && res.data?.admin) setAdminProfile(res.data.admin);
      } catch (e) { console.error(e); }
    };
    load();
    const referrer = sessionStorage.getItem('jobDetailReferrer');
    if (referrer) setBackPath(referrer);
  }, []);
  const showEditButton = adminProfile?.role === 1 || adminProfile?.role === 2;
  return (
    <JobDetailPage
      getJobApi={apiService.getAdminJobById}
      backPath={backPath}
      showEditButton={showEditButton}
      editPath="/admin/jobs/:id/edit"
    />
  );
};

// Admin Group Jobs: header nhóm + danh sách job dùng chung
const GroupJobsListWrapper = () => {
  const [groupInfo, setGroupInfo] = useState(null);
  useEffect(() => {
    const load = async () => {
      try {
        const res = await apiService.getMyGroup();
        if (res.success && res.data?.group) setGroupInfo(res.data.group);
      } catch (e) { console.error(e); }
    };
    load();
  }, []);
  return (
    <div className="flex flex-col h-full overflow-hidden">
      {groupInfo && (
        <div className="flex-shrink-0 mb-4 rounded-lg p-4 mx-4 mt-4" style={{ backgroundColor: '#eff6ff', borderColor: '#bfdbfe', border: '1px solid' }}>
          <h2 className="text-lg font-semibold mb-1" style={{ color: '#1e3a8a' }}>Nhóm: {groupInfo.name}</h2>
          <p className="text-sm" style={{ color: '#1d4ed8' }}>Mã nhóm: {groupInfo.code} | Số admin: {groupInfo.admins?.length || 0}</p>
        </div>
      )}
      <div className="flex-1 min-h-0">
        <JobsListPage jobsBasePath="/admin/jobs" useAdminAPI={true} showAdminToolbar={false} />
      </div>
    </div>
  );
};

// Route "/": khách → /{lang}/; đã đăng nhập → agent / admin.
// Host admin.* (vd admin.ws-jobshare.com): luôn vào /admin.

function App() {
  return (
    <HelmetProvider>
    <LanguageProvider>
      <NotificationProvider>
      <CandidateAuthProvider>
      <BrowserRouter basename="/">
        <RouterNavigationTracker />
        <AuthSessionListener />
        <InternalAppCssFence />
        <Routes>
          {/* Login Routes */}
          <Route path="/login" element={<CollaboratorLoginRedirect />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/register/verify-email" element={<VerifyEmailPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/admin/login" element={<LoginPage defaultUserType="admin" />} />

          {/* Agent Routes - Yêu cầu đăng nhập với userType = 'ctv' */}
          <Route
            path="/agent"
            element={
              <ProtectedRoute requiredUserType="ctv">
                <AgentLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<HomePage />} />
            <Route path="jobs" element={<JobsListPage jobsBasePath="/agent/jobs" useAdminAPI={false} showAdminToolbar={false} />} />
            <Route path="jobs/:jobId" element={<JobDetailPage getJobApi={apiService.getJobById} backPath="/agent/jobs" showEditButton={false} />} />
            <Route path="jobs/:jobId/nominate" element={<NominationSelectPage variant="agent" />} />
            <Route path="jobs/:jobId/confirm" element={<NominationConfirmPage variant="agent" />} />
            <Route path="jobs/:jobId/nominate/confirm" element={<NominationConfirmPage variant="agent" />} />
            <Route path="events" element={<AgentEventsPage />} />
            <Route path="events/:eventId" element={<AgentEventDetailPage />} />
            <Route path="candidates" element={<CandidatesPage />} />
            <Route path="candidates/create" element={<AddCandidateForm />} />
            <Route path="candidates/:candidateId" element={<CandidateDetail />} />
            <Route path="candidates/:candidateId/edit" element={<AddCandidateForm />} />
            <Route path="candidates/:candidateId/applications" element={<CandidateApplicationsPage />} />
            <Route path="nominations" element={<NominationsPage />} />
            <Route path="nominations/:nominationId" element={<NominationDetail />} />
            <Route path="scout-performance" element={<AgentScoutPerformancePage />} />
            <Route path="candidate-sharing" element={<CtvMarketplacePage />} />
            <Route path="payment-history" element={<PaymentHistoryPage />} />
            <Route path="payment-history/:id" element={<AgentPaymentRequestDetailPage />} />
            <Route path="profile" element={<AgentProfilePage />} />
            <Route path="notifications" element={<NotificationsPage />} />
            <Route path="contact" element={<ContactPage />} />
            <Route path="faq" element={<FAQPage />} />
            <Route path="terms" element={<TermsPage />} />
            <Route path="hotline" element={<HotlinePage />} />
          </Route>

          {/* Admin Routes - Yêu cầu đăng nhập với userType = 'admin' */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute requiredUserType="admin">
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="collaborators" element={<CollaboratorsPage />} />
            <Route path="collaborators/approval" element={<CollaboratorApprovalPage />} />
            <Route path="collaborators/new" element={<AddCollaboratorPage />} />
            <Route path="collaborators/:collaboratorId" element={<AdminCollaboratorDetailPage />} />
            <Route path="collaborators/:collaboratorId/edit" element={<AddCollaboratorPage />} />
            <Route path="collaborators/ranking" element={<CollaboratorRankingPage />} />
            <Route path="candidates" element={<AdminCandidatesPage />} />
            <Route path="candidates/create" element={<AddCandidateForm isAdmin />} />
            <Route path="candidates/:candidateId" element={<AdminCandidateDetailPage />} />
            <Route path="candidates/:candidateId/applications" element={<CandidateApplicationsPage useAdminAPI />} />
            <Route path="candidates/:candidateId/edit" element={<AddCandidateForm isAdmin />} />
            <Route path="jobs" element={<JobsListPage jobsBasePath="/admin/jobs" useAdminAPI={true} showAdminToolbar={true} createPath="/admin/jobs/create" />} />
            <Route path="jobs/create" element={<AdminAddJobPage />} />
            <Route path="jobs/:jobId" element={<AdminJobDetailWrapper />} />
            <Route path="jobs/:jobId/edit" element={<AdminAddJobPage />} />
            <Route path="jobs/:jobId/nominate" element={<NominationSelectPage variant="admin" />} />
            <Route path="jobs/:jobId/confirm" element={<NominationConfirmPage variant="admin" />} />
            <Route path="jobs/:jobId/nominate/confirm" element={<NominationConfirmPage variant="admin" />} />
            <Route path="nominations" element={<AdminNominationsPage />} />
            <Route path="nominations/create" element={<AdminAddNominationPage />} />
            <Route path="nominations/:nominationId" element={<AdminNominationDetailPage />} />
            <Route path="nominations/:nominationId/edit" element={<AdminAddNominationPage />} />
            <Route path="payments" element={<PaymentsPage />} />
            <Route path="payments/:id" element={<PaymentRequestDetailPage />} />
            <Route path="scout-performance" element={<AdminScoutPerformancePage />} />
            <Route path="scout-reserve" element={<AdminScoutReservePage />} />
            <Route path="ws-chat" element={<AdminWsChatPage />} />
            <Route path="business-credit-requests" element={<AdminCreditRequestsPage />} />
            <Route path="candidate-sharing" element={<AdminCandidateSharingPage />} />
            <Route path="companies" element={<CompaniesPage />} />
            <Route path="companies/create" element={<AddCompanyPage />} />
            <Route path="companies/:companyId" element={<AdminCompanyDetailPage />} />
            <Route path="companies/:companyId/edit" element={<AddCompanyPage />} />
            <Route path="business-accounts" element={<AdminBusinessesPage />} />
            <Route path="business-accounts/:businessId" element={<AdminBusinessDetailPage />} />
            <Route path="reports" element={<ReportsPage />} />
            <Route path="accounts" element={<AccountsPage />} />
            <Route path="accounts/new" element={<AddAdminPage />} />
            <Route path="accounts/:id/edit" element={<AddAdminPage />} />
            <Route path="campaigns" element={<CampaignsPage />} />
            <Route path="utm-links" element={<UtmLinkBuilderPage />} />
            <Route path="campaigns/create" element={<AddCampaignPage />} />
            <Route path="campaigns/:campaignId" element={<AdminCampaignDetailPage />} />
            <Route path="campaigns/:campaignId/edit" element={<AddCampaignPage />} />
            <Route path="job-categories" element={<JobCategoriesPage />} />
            <Route path="job-pickups" element={<AdminJobPickupsPage />} />
            <Route path="job-categories/add" element={<AddJobCategoryPage />} />
            <Route path="job-categories/:categoryId/edit" element={<AddJobCategoryPage />} />
            <Route path="collaborator-assignments" element={<CollaboratorAssignmentsPage />} />
            <Route path="my-assigned-collaborators" element={<MyAssignedCollaboratorsPage />} />
            <Route path="my-group" element={<MyGroupPage />} />
            <Route path="group-collaborators" element={<GroupCollaboratorsPage />} />
            <Route path="group-jobs" element={<GroupJobsListWrapper />} />
            <Route path="group-candidates" element={<GroupCandidatesPage />} />
            <Route path="groups" element={<GroupsPage />} />
            <Route path="groups/new" element={<AddGroupPage />} />
            <Route path="groups/:id" element={<GroupDetailPage />} />
            <Route path="groups/:id/edit" element={<AddGroupPage />} />
            <Route path="emails" element={<EmailPage />} />
            <Route path="events" element={<EventsPage />} />
            <Route path="public-ctv-chat" element={<PublicCtvChatInboxPage />} />
            <Route
              path="public-candidate-chat"
              element={<Navigate to="/admin/public-ctv-chat?tab=candidate" replace />}
            />
            <Route path="events/new" element={<AddEventPage />} />
            <Route path="events/:eventId" element={<EventDetailPage />} />
            <Route path="events/:eventId/edit" element={<AddEventPage />} />
            <Route path="posts" element={<PostsPage />} />
            <Route path="posts/create" element={<PostsPage />} />
            <Route path="posts/:id/edit" element={<PostsPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>

          {/* Legacy public URLs → /{lang}/... */}
          <Route path="/landing/collaborator/*" element={<LegacyPublicRedirect persona="collaborator" />} />
          <Route path="/collaborator/*" element={<LegacyPublicRedirect persona="collaborator" />} />
          <Route path="/landing/candidate/*" element={<LegacyPublicRedirect persona="candidate" />} />
          <Route path="/candidate/*" element={<LegacyPublicRedirect persona="candidate" />} />
          <Route path="/template/jobshare_business_landing/*" element={<Navigate to="/landing/business" replace />} />
          <Route path="/landing/business/*" element={withLandingSuspense(BusinessLandingHome)} />

          {/* Localized public — CTV (Collaborator V3, Tailwind + React) */}
          <Route path="/:lang" element={<LocaleGuard />}>
            <Route element={withLandingSuspense(CollaboratorPublicLayout)}>
              <Route index element={withLandingSuspense(CollaboratorHomePage)} />
              <Route path="collaborator/about-us" element={withLandingSuspense(CollaboratorAboutPage)} />
              <Route path="collaborator/jobs/*" element={withLandingSuspense(CollaboratorJobsPage)} />
              <Route path="collaborator/blog/*" element={withLandingSuspense(CollaboratorsNewsPage)} />
              <Route path="collaborator/register" element={withLandingSuspense(CollaboratorRegisterPage)} />
              <Route path="register" element={withLandingSuspense(CollaboratorRegisterPage)} />
              <Route path="blog/:postSlug" element={withLandingSuspense(CollaboratorBlogLegacyRedirect)} />
              <Route path="about-us" element={withLandingSuspense(CollaboratorAboutPage)} />
            </Route>
            <Route element={withLandingSuspense(CandidatePublicLayout)}>
              <Route path="candidate">
                <Route index element={withLandingSuspense(CandidateHomePage)} />
                <Route path="about-us" element={withLandingSuspense(CandidateAboutPage)} />
                <Route path="jobs/*" element={withLandingSuspense(CandidateJobsPage)} />
                <Route path="blog/*" element={withLandingSuspense(CandidateNewsPage)} />
                <Route path="profile" element={withLandingSuspense(CandidateProfilePage)} />
              </Route>
            </Route>
            <Route path="collaborator/login" element={withLandingSuspense(CollaboratorLoginPage)} />
            <Route path="candidate/login" element={withLandingSuspense(CandidateLoginPage)} />
            <Route path="candidate/register" element={withLandingSuspense(CandidateRegisterPage)} />
            <Route path="candidate/reset-password" element={withLandingSuspense(CandidateResetPasswordPage)} />
            <Route path="business/*" element={withLandingSuspense(BusinessLandingHome)} />
            <Route path="jobs/*" element={<LegacyLocalePublicJobsRedirect />} />
          </Route>

          {/* Root → /{lang}/ or agent/admin when logged in */}
          <Route path="/" element={<PublicRootRedirect />} />

          {/* Business auth - không dùng sidebar */}
          <Route path="/business/register" element={<BusinessRegisterRoute />} />
          <Route path="/business/login" element={<BusinessLogin />} />
          <Route path="/business/verify-email" element={<BusinessVerifyEmail />} />
          <Route path="/business/reset-password" element={<BusinessResetPassword />} />

          {/* Builder toàn màn hình — tab mới, không sidebar */}
          <Route
            path="/business/saiyo/pages/:pageId/build"
            element={
              <ProtectedRoute requiredUserType="business">
                <BusinessLandingPageBuilder />
              </ProtectedRoute>
            }
          />

          {/* Business Page - with Sidebar Layout (yêu cầu đăng nhập) */}
          <Route
            path="/business"
            element={
              <ProtectedRoute requiredUserType="business">
                <BusinessLayoutWrapper />
              </ProtectedRoute>
            }
          >
            <Route index element={<BusinessHomepage />} />
            <Route path="jobs" element={<JobManagement />} />
            <Route path="jobs/create" element={<JobAiBuilderPage mode="create" />} />
            <Route path="jobs/manual-create" element={<BusinessAddJobPage />} />
            <Route path="jobs/:jobId/edit" element={<JobAiBuilderPage mode="edit" />} />
            <Route path="jobs/ai-builder" element={<JdBuilderChatPage />} />
            <Route path="jobs/:jobId" element={<JobDetail />} />
            <Route path="applications" element={<JobApplication />} />
            <Route path="candidates" element={<Candidate />} />
            <Route path="candidates/:candidateId" element={<BusinessUnlockedCandidateDetail />} />
            <Route path="candidate-sharing" element={<CandidateSharing />} />
            <Route path="candidate-sharing/jobs/:jobId" element={<CandidateSharingListingDetail />} />
            <Route path="candidate-sharing/listings/:listingId" element={<CandidateSharingListingLegacyRedirect />} />
            <Route path="scout/direct" element={<ScoutDirect />} />
            <Route path="scout/managed" element={<ScoutManaged />} />
            <Route path="scout/candidates/:cvId" element={<ScoutCandidateDetail />} />
            <Route path="scout" element={<Navigate to="/business/scout/direct" replace />} />
            <Route path="saiyo" element={<Branding />} />
            <Route path="saiyo/landing-pages" element={<BrandingLandingPages />} />
            <Route path="saiyo/pages/:pageId/edit" element={<BusinessLandingPageEditor />} />
            <Route path="knowledge" element={<KnowledgeHub />} />
            <Route path="knowledge/:postSlug" element={<KnowledgeArticlePage />} />
            <Route path="insights" element={<ReportInsight />} />
            <Route path="messages" element={<Message />} />
            <Route path="requests" element={<Navigate to="/business/messages" replace />} />
            {/* Placeholder routes - thêm các trang con khi cần */}
            <Route path="payments" element={<div className="p-6"><h1 className="text-2xl font-bold">Payment Management</h1></div>} />
            <Route path="candidates" element={<div className="p-6"><h1 className="text-2xl font-bold">Candidates</h1></div>} />
            <Route path="scout-performance" element={<div className="p-6"><h1 className="text-2xl font-bold">Scout Performance</h1></div>} />
            <Route path="partner-ctv" element={<div className="p-6"><h1 className="text-2xl font-bold">Partner CTV</h1></div>} />
            <Route path="service-requests/credit" element={<CreditTopUpRequest />} />
            <Route path="service-requests/landing-page" element={<LandingPagePremiumRequest />} />
            <Route path="service-requests/recruitment-ads" element={<RecruitmentAdsRequest />} />
            <Route path="service-requests/seminar-campaign" element={<SeminarCampaignRequest />} />
            <Route path="service-requests/company-profile" element={<CompanyProfileRequest />} />
            <Route path="service-requests" element={<ServiceRequests />} />
            <Route path="billing" element={<Billing />} />
            <Route path="service-billing" element={<ServiceRequests />} />
            <Route path="profile" element={<BusinessProfilePage />} />
            <Route path="settings" element={<Navigate to="/business/profile" replace />} />
          </Route>

        </Routes>
      </BrowserRouter>
      </CandidateAuthProvider>
      </NotificationProvider>
    </LanguageProvider>
    </HelmetProvider>
  );
}

export default App;
