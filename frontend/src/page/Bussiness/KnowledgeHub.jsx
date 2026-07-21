import React, { useState } from 'react'
import { Search, ChevronRight, Download, FileText, Eye, Share2, Filter, BookOpen, Users, Rocket, Shield, Zap, MessageSquare, Clock } from 'lucide-react'

const scrollbarStyle = `
  .knowledge-scrollbar::-webkit-scrollbar { width: 6px; }
  .knowledge-scrollbar::-webkit-scrollbar-track { background: transparent; }
  .knowledge-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 3px; }
  .knowledge-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
  .knowledge-scrollbar { scrollbar-width: thin; scrollbar-color: #cbd5e1 transparent; }
`

const categories = [
  { id: 1, icon: BookOpen, name: 'Tuyển dụng', count: 128 },
  { id: 2, icon: Users, name: 'Quản trị nhân sự', count: 96 },
  { id: 3, icon: Rocket, name: 'Phát triển đội ngũ', count: 78 },
  { id: 4, icon: Shield, name: 'Pháp lý & Tuân thủ', count: 52 },
  { id: 5, icon: Zap, name: 'Kỹ năng nghề nghiệp', count: 67 },
  { id: 6, icon: FileText, name: 'Khác', count: 34 },
]

const featuredPost = {
  id: 1,
  title: '10 bước xây dựng quy trình tuyển dụng hiệu quả',
  description: 'Hướng dẫn chi tiết từng bước quy định doanh nghiệp để xây trình tuyển dụng, tiết kiệm thời gian và nâng cao chất lượng ứng viên',
  date: '15/05/2024',
  views: 2,
  shares: 3.4,
  image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=400&h=250&fit=crop',
  category: 'Tuyển dụng',
}

const posts = [
  { id: 2, title: 'Quản trị nhân sự', category: 'Quản trị nhân sự', date: '16/05/2024', views: 8, shares: 1.8, image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=300&h=200&fit=crop' },
  { id: 3, title: 'Phát triển đội ngũ', category: 'Phát triển đội ngũ', date: '15/05/2024', views: 10, shares: 1.2, image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=300&h=200&fit=crop' },
  { id: 4, title: 'Pháp lý & Tuân thủ', category: 'Pháp lý & Tuân thủ', date: '12/05/2024', views: 5, shares: 1.1, image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=300&h=200&fit=crop' },
  { id: 5, title: 'Kỹ năng phỏng vấn hiệu quả', category: 'Kỹ năng nghề nghiệp', date: '11/05/2024', views: 15, shares: 2.5, image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=300&h=200&fit=crop' },
]

const recommendations = [
  { id: 1, icon: Zap, title: 'Tài liêu nổi bật cho bạn', desc: 'Dựa trên bạn đọc như cách quản lý của bạn' },
  { id: 2, icon: FileText, title: 'Mẫu JD chuẩn theo ý trí', desc: 'Tuyển dụng' },
  { id: 3, icon: BookOpen, title: 'Khuông năng lực nhân sự', desc: 'Quản trị nhân sự' },
  { id: 4, icon: FileText, title: 'Template định giá ứng viên', desc: 'Tuyển dụng' },
  { id: 5, icon: Users, title: 'Bộ câu hỏi phỏng vấn nâng lực', desc: 'Kỹ năng nghề nghiệp' },
]

const latestMaterials = [
  { time: '15/05', title: 'Xu hương tuyển dụng IT 2024', type: 'MẪU' },
  { time: '14/05', title: 'Checklist onboarding nhân viên mới', type: 'MẪU' },
  { time: '13/05', title: 'Chinh sách làm việc hybrid hiệu quả', type: 'MẦU' },
  { time: '12/05', title: 'Hướng dẫn sử dụng EVP', type: 'MẪU' },
  { time: '10/05', title: 'Bộ KPI cho từng vị trí phòng ban', type: 'MẪU' },
]

const templates = [
  { id: 1, icon: FileText, label: 'Mẫu JD', name: 'Mẫu JD theo vị trí', desc: '23 mẫu', action: 'Xem ngay', primary: false },
  { id: 2, icon: FileText, label: 'Mẫu Excel', name: 'Bảng đánh giá ứng viên', desc: 'Excel • 15 KB', action: 'Tải về', primary: false },
  { id: 3, icon: FileText, label: 'Mẫu quy trình', name: 'Quy trình tuyển dụng chuẩn', desc: 'PDF • 2.4 MB', action: 'Xem ngay', primary: false },
  { id: 4, icon: FileText, label: 'Mẫu slide', name: 'Bộ slide onboarding nhân viên mới', desc: 'PPTX • 5.6 MB', action: 'Tải về', primary: false },
  { id: 5, icon: FileText, label: 'Mẫu văn bản', name: 'Hợp đồng lao động mẫu', desc: 'DOCX • 48 KB', action: 'Tải về', primary: false },
]

const KnowledgeHub = () => {
  const [selectedCategory, setSelectedCategory] = useState(1)
  const [searchTerm, setSearchTerm] = useState('')

  return (
    <>
      <style>{scrollbarStyle}</style>
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#f8fafc' }}>

        {/* Search & Filter */}
        <div style={{ padding: 12, borderBottom: '1px solid #e2e8f0', background: '#ffffff', display: 'grid', gridTemplateColumns: '1fr 120px', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#f8fafc', borderRadius: 6, border: '1px solid #e2e8f0', padding: '8px 12px' }}>
            <Search style={{ width: 14, height: 14, color: '#94a3b8' }} />
            <input 
              type="text" 
              placeholder="Tìm kiếm bài viết, hướng dẫn, mẫu tài liệu..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ flex: 1, border: 'none', background: 'transparent', fontSize: 10, outline: 'none' }} 
            />
          </div>
          <button style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 6, cursor: 'pointer', fontSize: 10, color: '#64748b', fontWeight: 500 }}>
            <Filter style={{ width: 12, height: 12 }} />
            Tất cả chủ đề
          </button>
        </div>

        {/* Main Content */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 12, padding: 12, alignItems: 'start' }}>
          
          {/* Left Column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {/* Categories */}
            <div style={{ overflowX: 'auto' }}>
              <div style={{ display: 'flex', gap: 12 }}>
                {categories.map((cat) => {
                  const Icon = cat.icon
                  return (
                    <button 
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.id)}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 4,
                        padding: 10,
                        borderRadius: 8,
                        border: selectedCategory === cat.id ? '2px solid #3b82f6' : '1px solid #e2e8f0',
                        background: selectedCategory === cat.id ? '#eff6ff' : '#f8fafc',
                        cursor: 'pointer',
                        minWidth: 100,
                        flex: 1,
                        transition: 'all 0.2s',
                      }}
                    >
                      <Icon style={{ width: 18, height: 18, color: selectedCategory === cat.id ? '#3b82f6' : '#64748b' }} />
                      <div style={{ fontSize: 9, fontWeight: 600, color: '#1e293b', textAlign: 'center', lineHeight: 1.2 }}>{cat.name}</div>
                      <div style={{ fontSize: 8, color: '#64748b', fontWeight: 500 }}>{cat.count} bài viết</div>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Featured Post */}
            <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 16, borderRadius: 8, overflow: 'hidden', border: '1px solid #e2e8f0', background: '#ffffff' }}>
              <div style={{ position: 'relative', overflow: 'hidden' }}>
                <img src={featuredPost.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <div style={{ position: 'absolute', top: 8, left: 8, background: '#7c3aed', color: 'white', fontSize: 8, fontWeight: 700, padding: '4px 8px', borderRadius: 4 }}>
                  NỔI BẬT
                </div>
              </div>
              <div style={{ padding: 12, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <h3 style={{ fontSize: 12, fontWeight: 700, color: '#1e293b', marginBottom: 6, lineHeight: 1.3 }}>{featuredPost.title}</h3>
                  <p style={{ fontSize: 9, color: '#64748b', lineHeight: 1.4, marginBottom: 8 }}>{featuredPost.description}</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 8, color: '#94a3b8' }}>
                  <span>{featuredPost.date}</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Eye style={{ width: 10, height: 10 }} /> {featuredPost.views} phút đọc
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Share2 style={{ width: 10, height: 10 }} /> 3.4 lượt chia sẻ
                  </span>
                </div>
              </div>
            </div>

            {/* Posts List */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, paddingBottom: 10, borderBottom: '1px solid #e2e8f0' }}>
                <h2 style={{ fontSize: 11, fontWeight: 700, color: '#1e293b' }}>Bài viết nổi bật</h2>
                <button style={{ fontSize: 9, fontWeight: 600, color: '#3b82f6', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 2 }}>
                  Xem tất cả <ChevronRight style={{ width: 9, height: 9 }} />
                </button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {posts.map((post) => (
                  <div key={post.id} style={{ display: 'grid', gridTemplateColumns: '100px 1fr', gap: 10, padding: 10, borderRadius: 6, border: '1px solid #e2e8f0', background: '#ffffff', cursor: 'pointer' }}>
                    <div style={{ borderRadius: 4, overflow: 'hidden' }}>
                      <img src={post.image} alt="" style={{ width: '100%', height: '70px', objectFit: 'cover' }} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                          <span style={{ fontSize: 8, fontWeight: 600, background: '#e0e7ff', color: '#4f46e5', padding: '2px 6px', borderRadius: 3 }}>
                            {post.category}
                          </span>
                          <span style={{ fontSize: 8, color: '#94a3b8' }}>{post.date}</span>
                        </div>
                        <h4 style={{ fontSize: 10, fontWeight: 600, color: '#1e293b', lineHeight: 1.3 }}>{post.title}</h4>
                      </div>
                      <div style={{ display: 'flex', gap: 8, fontSize: 8, color: '#94a3b8' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Eye style={{ width: 9, height: 9 }} /> {post.views} phút
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Share2 style={{ width: 9, height: 9 }} /> {post.shares} lượt chia sẻ
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Documents & Templates */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, paddingBottom: 10, borderBottom: '1px solid #e2e8f0' }}>
                <h2 style={{ fontSize: 11, fontWeight: 700, color: '#1e293b' }}>Tài liệu & Mẫu biểu hữu ích</h2>
                <button style={{ fontSize: 9, fontWeight: 600, color: '#3b82f6', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 2 }}>
                  Xem tất cả mẫu biểu <ChevronRight style={{ width: 9, height: 9 }} />
                </button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8 }}>
                {templates.map((tpl) => {
                  const TplIcon = tpl.icon
                  return (
                    <div key={tpl.id} style={{ display: 'flex', flexDirection: 'column', padding: 10, borderRadius: 6, border: '1px solid #e2e8f0', background: '#ffffff' }}>
                      <TplIcon style={{ width: 16, height: 16, color: '#3b82f6', marginBottom: 8 }} />
                      <div style={{ fontSize: 8, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 2 }}>{tpl.label}</div>
                      <div style={{ fontSize: 10, fontWeight: 600, color: '#1e293b', lineHeight: 1.3, marginBottom: 6, flex: 1 }}>{tpl.name}</div>
                      <div style={{ fontSize: 8, color: '#94a3b8', marginBottom: 8 }}>{tpl.desc}</div>
                      <button style={{ width: '100%', padding: '6px', fontSize: 9, fontWeight: 600, color: tpl.primary ? '#ffffff' : '#3b82f6', background: tpl.primary ? '#3b82f6' : '#ffffff', border: tpl.primary ? 'none' : '1px solid #e2e8f0', borderRadius: 4, cursor: 'pointer' }}>
                        {tpl.action}
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Right Sidebar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ borderRadius: 8, border: '1px solid #e2e8f0', background: '#ffffff', padding: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 2, marginBottom: 10, paddingBottom: 10, borderBottom: '1px solid #e2e8f0' }}>
                <Zap style={{ width: 12, height: 12, color: '#f59e0b' }} />
                <h3 style={{ fontSize: 10, fontWeight: 700, color: '#1e293b' }}>Tái liêu nổi bật cho bạn</h3>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {recommendations.map((rec, i) => {
                  const RecIcon = rec.icon
                  return (
                    <button key={i} style={{ textAlign: 'left', padding: 8, borderRadius: 4, border: '1px solid #e2e8f0', background: '#f8fafc', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', gap: 8 }}>
                      <RecIcon style={{ width: 12, height: 12, color: '#3b82f6', flexShrink: 0, marginTop: 2 }} />
                      <div>
                        <div style={{ fontSize: 9, fontWeight: 600, color: '#1e293b' }}>{rec.title}</div>
                        <div style={{ fontSize: 8, color: '#64748b' }}>{rec.desc}</div>
                      </div>
                    </button>
                  )
                })}
              </div>
              <button style={{ width: '100%', marginTop: 10, padding: '6px', fontSize: 9, fontWeight: 600, color: '#3b82f6', background: '#eff6ff', border: 'none', borderRadius: 4, cursor: 'pointer' }}>
                Xem ngay
              </button>
            </div>

            {/* Latest Materials */}
            <div style={{ borderRadius: 8, border: '1px solid #e2e8f0', background: '#ffffff', padding: 12 }}>
              <h3 style={{ fontSize: 10, fontWeight: 700, color: '#1e293b', marginBottom: 10, paddingBottom: 10, borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Clock style={{ width: 12, height: 12 }} />
                Tài liêu mới cập nhật
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {latestMaterials.map((mat, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', fontSize: 8 }}>
                    <div>
                      <div style={{ color: '#94a3b8', marginBottom: 2 }}>{mat.time}</div>
                      <div style={{ color: '#1e293b', fontWeight: 500 }}>{mat.title}</div>
                    </div>
                    <span style={{ fontSize: 7, fontWeight: 600, color: '#3b82f6', background: '#eff6ff', padding: '2px 4px', borderRadius: 2, whiteSpace: 'nowrap' }}>
                      {mat.type}
                    </span>
                  </div>
                ))}
              </div>
              <button style={{ width: '100%', marginTop: 10, padding: '6px', fontSize: 9, fontWeight: 600, color: '#3b82f6', background: 'none', border: '1px solid #3b82f6', borderRadius: 4, cursor: 'pointer' }}>
                Xem tất cả
              </button>
            </div>

            {/* Feedback */}
            <div style={{ borderRadius: 8, border: '1px solid #e2e8f0', background: '#eff6ff', padding: 12, textAlign: 'center' }}>
              <div style={{ marginBottom: 8 }}>
                <MessageSquare style={{ width: 24, height: 24, margin: '0 auto', color: '#3b82f6' }} />
              </div>
              <h3 style={{ fontSize: 10, fontWeight: 700, color: '#1e293b', marginBottom: 4 }}>Góp ý & Yêu cầu tài liêu</h3>
              <p style={{ fontSize: 8, color: '#64748b', marginBottom: 8 }}>Bạn cần tài liệu nào hãy cho chúng tôi biết để cải thiện dịch vụ</p>
              <button style={{ width: '100%', padding: '6px 12px', fontSize: 9, fontWeight: 600, color: 'white', background: '#3b82f6', border: 'none', borderRadius: 4, cursor: 'pointer' }}>
                Góp ý & Yêu cầu
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default KnowledgeHub