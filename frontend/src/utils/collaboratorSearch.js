export function normalizeVietnameseText(value) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function getCollaboratorSearchText(collaborator) {
  if (!collaborator) return '';
  return [
    collaborator.name,
    collaborator.companyName,
    collaborator.company_name,
    collaborator.email,
    collaborator.phone,
    collaborator.code,
  ].filter(Boolean).join(' ');
}

export function getCollaboratorSearchScore(query, collaborator) {
  const normalizedQuery = normalizeVietnameseText(query);
  if (!normalizedQuery) return 0;

  const searchText = getCollaboratorSearchText(collaborator);
  const normalizedSearchText = normalizeVietnameseText(searchText);
  const compactQuery = normalizedQuery.replace(/\s+/g, '');
  const compactSearch = normalizedSearchText.replace(/\s+/g, '');

  if (!compactSearch || !compactQuery) return 0;
  if (compactSearch === compactQuery) return 100;
  if (compactSearch.includes(compactQuery) || compactQuery.includes(compactSearch)) return 95;

  const queryTokens = normalizedQuery.split(' ').filter(Boolean);
  const searchTokens = normalizedSearchText.split(' ').filter(Boolean);
  if (!queryTokens.length || !searchTokens.length) return 0;

  let total = 0;
  let matched = 0;

  for (const queryToken of queryTokens) {
    let bestTokenScore = 0;
    for (const searchToken of searchTokens) {
      if (searchToken === queryToken) {
        bestTokenScore = 1;
        break;
      }
      if (searchToken.startsWith(queryToken) || queryToken.startsWith(searchToken)) {
        bestTokenScore = Math.max(bestTokenScore, 0.9);
        continue;
      }
      if (searchToken.includes(queryToken) || queryToken.includes(searchToken)) {
        bestTokenScore = Math.max(bestTokenScore, 0.8);
        continue;
      }
      const queryCompactToken = queryToken.replace(/\s+/g, '');
      const searchCompactToken = searchToken.replace(/\s+/g, '');
      if (searchCompactToken.includes(queryCompactToken) || queryCompactToken.includes(searchCompactToken)) {
        bestTokenScore = Math.max(bestTokenScore, 0.75);
      }
    }
    if (bestTokenScore > 0) {
      total += bestTokenScore;
      matched += 1;
    }
  }

  if (!matched) return 0;

  const coverage = matched / queryTokens.length;
  const average = total / matched;
  return Math.round(coverage * average * 100);
}

export function normalizeCollaboratorList(payload) {
  const list = payload?.data?.collaborators || payload?.data?.items || payload?.data || [];
  return Array.isArray(list) ? list : [];
}

export function extractCollaboratorsFromAssignments(payload) {
  const assignedCollaborators = (payload?.data?.assignments || [])
    .map((assignment) => assignment.cvStorage?.collaborator)
    .filter((c) => c && c.status === 1);
  return Array.from(new Map(assignedCollaborators.map((c) => [c.id, c])).values());
}

export function rankCollaboratorsBySearch(query, list) {
  const q = query.trim();
  if (!q) return list;
  return list
    .map((collaborator, index) => ({
      collaborator,
      score: getCollaboratorSearchScore(q, collaborator),
      index,
    }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .map((item) => item.collaborator);
}

export function mergeCollaboratorLists(prev, next) {
  const combined = [...prev, ...next];
  const seen = new Set();
  return combined.filter((item) => {
    const key = String(item?.id ?? '');
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
