import { useEffect, useState } from 'react';
import apiService from '../services/api';

/** Danh sách bài Knowledge Hub — cùng API/sắp xếp như KnowledgeHub (browse all). */
export default function useBusinessKnowledgePostList(limit = 6) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const fetchLimit = Math.min(Math.max(Number(limit) || 6, 1), 48);

    (async () => {
      try {
        setLoading(true);
        const res = await apiService.getBusinessKnowledgePosts({
          page: 1,
          limit: fetchLimit,
          sortBy: 'published_at',
          sortOrder: 'DESC',
        });
        const list = res?.data?.posts || [];
        if (!cancelled) setPosts(Array.isArray(list) ? list : []);
      } catch {
        if (!cancelled) setPosts([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [limit]);

  return { posts, loading };
}
