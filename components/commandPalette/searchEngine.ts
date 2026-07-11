import { SearchItem, searchIndex } from './searchIndex';

/**
 * Normalizes string for searching (lowercase, trims, removes special characters)
 */
function normalize(str: string): string {
  return str.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();
}

/**
 * Fuzzy matches: Checks if characters in `query` appear sequentially in `target`
 */
function isFuzzyMatch(query: string, target: string): boolean {
  if (target.includes(query)) return true;
  
  let queryIdx = 0;
  for (let targetIdx = 0; targetIdx < target.length; targetIdx++) {
    if (target[targetIdx] === query[queryIdx]) {
      queryIdx++;
      if (queryIdx === query.length) return true;
    }
  }
  return false;
}

/**
 * Performs a search against the indexed items
 */
export function searchEngine(query: string): SearchItem[] {
  const trimmed = query.trim().toLowerCase();
  if (!trimmed) return [];

  const normalizedQuery = normalize(trimmed);

  // Score and filter items
  const scoredItems = searchIndex.map(item => {
    let score = 0;

    const normalizedTitle = normalize(item.title);
    const normalizedDesc = normalize(item.desc);

    // 1. Perfect Match / Exact Prefix Match (highest score)
    if (normalizedTitle === normalizedQuery) {
      score += 100;
    } else if (normalizedTitle.startsWith(normalizedQuery)) {
      score += 80;
    } else if (normalizedTitle.includes(normalizedQuery)) {
      score += 60;
    }

    // 2. Keyword exact matches
    const keywordMatches = item.keywords.filter(keyword => {
      const normalizedKeyword = normalize(keyword);
      return normalizedKeyword === normalizedQuery || normalizedKeyword.includes(normalizedQuery);
    });
    score += keywordMatches.length * 20;

    // 3. Description Match
    if (normalizedDesc.includes(normalizedQuery)) {
      score += 30;
    }

    // 4. Fuzzy Matching (fallback)
    if (score === 0) {
      if (isFuzzyMatch(trimmed, item.title.toLowerCase())) {
        score += 15;
      } else if (isFuzzyMatch(trimmed, item.desc.toLowerCase())) {
        score += 10;
      } else {
        // Check keywords fuzzy
        const hasFuzzyKeyword = item.keywords.some(kw => isFuzzyMatch(trimmed, kw.toLowerCase()));
        if (hasFuzzyKeyword) {
          score += 12;
        }
      }
    }

    // 5. Acronym Match (e.g. GST for GST, MCA for MCA, TDS for TDS)
    const titleAcronym = item.title
      .split(/\s+/)
      .map(word => word.charAt(0))
      .join('')
      .toLowerCase();
    
    if (titleAcronym === trimmed) {
      score += 50;
    }

    return { item, score };
  });

  // Filter items with score > 0 and sort by score descending
  return scoredItems
    .filter(scored => scored.score > 0)
    .sort((a, b) => b.score - a.score)
    .map(scored => scored.item);
}
