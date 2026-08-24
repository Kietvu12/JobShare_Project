import { loadBackendEnv } from './loadBackendEnv.js';
import { BUSINESS_KNOWLEDGE_CATEGORY_SLUGS } from '../src/services/postPublicService.js';

const loadedFrom = loadBackendEnv();
if (loadedFrom) {
  console.log(`[seed] .env loaded from: ${loadedFrom}`);
} else {
  console.warn('[seed] .env not found; using process environment / defaults');
}

const { Category } = await import('../src/models/index.js');
const { default: sequelize } = await import('../src/config/database.js');

const KNOWLEDGE_CATEGORIES = [
  {
    name: 'Tuyển dụng',
    slug: 'tuyen-dung',
    description: 'Bài viết, hướng dẫn và kinh nghiệm tuyển dụng',
    color: '#0077B6',
    sortOrder: 1,
  },
  {
    name: 'Quản trị nhân sự',
    slug: 'quan-tri-nhan-su',
    description: 'Quản trị nhân sự, chính sách nội bộ và vận hành HR',
    color: '#0E7490',
    sortOrder: 2,
  },
  {
    name: 'Phát triển đội ngũ',
    slug: 'phat-trien-doi-ngu',
    description: 'Đào tạo, phát triển năng lực và xây dựng đội ngũ',
    color: '#0369A1',
    sortOrder: 3,
  },
  {
    name: 'Pháp lý & Tuân thủ',
    slug: 'phap-ly-tuan-thu',
    description: 'Pháp lý lao động, tuân thủ và quy định liên quan',
    color: '#1D4ED8',
    sortOrder: 4,
  },
  {
    name: 'Kỹ năng nghề nghiệp',
    slug: 'ky-nang-nghe-nghiep',
    description: 'Kỹ năng phỏng vấn, đánh giá và phát triển nghề nghiệp',
    color: '#0284C7',
    sortOrder: 5,
  },
  {
    name: 'Khác',
    slug: 'khac',
    description: 'Chủ đề khác dành cho Knowledge Hub doanh nghiệp',
    color: '#64748B',
    sortOrder: 6,
  },
];

async function main() {
  for (const item of KNOWLEDGE_CATEGORIES) {
    if (!BUSINESS_KNOWLEDGE_CATEGORY_SLUGS.includes(item.slug)) {
      throw new Error(`Slug ${item.slug} not in BUSINESS_KNOWLEDGE_CATEGORY_SLUGS`);
    }

    const existing = await Category.findOne({ where: { slug: item.slug } });
    if (existing) {
      await existing.update({
        name: item.name,
        description: item.description,
        color: item.color,
        sortOrder: item.sortOrder,
        isActive: true,
        showInDashboard: false,
      });
      console.log(`[seed] updated category: ${item.slug}`);
      continue;
    }

    await Category.create({
      name: item.name,
      slug: item.slug,
      description: item.description,
      color: item.color,
      sortOrder: item.sortOrder,
      isActive: true,
      showInDashboard: false,
    });
    console.log(`[seed] created category: ${item.slug}`);
  }

  await sequelize.close();
  console.log('[seed] business knowledge categories done');
}

main().catch(async (error) => {
  console.error('[seed] seed-business-knowledge-categories failed:', error);
  try {
    await sequelize.close();
  } catch {}
  process.exitCode = 1;
});
