// Client-Side Unified Branch Diffing & Merging Engine
// Computes line additions, deletions, similarity score, and formatted unified diff chunks
// matching the Saiph AI Branch Diff schema for instant, offline-ready branch comparisons.

export function computeBranchDiff(baseBranch, compareBranch) {
  const baseName = typeof baseBranch === 'string' ? baseBranch : baseBranch?.branch_name || 'main';
  const compareName = typeof compareBranch === 'string' ? compareBranch : compareBranch?.branch_name || 'branch';
  const baseText = String((typeof baseBranch === 'object' ? baseBranch?.content : '') || '').trim();
  const compareText = String((typeof compareBranch === 'object' ? compareBranch?.content : '') || '').trim();

  const baseLines = baseText ? baseText.split('\n') : [];
  const compareLines = compareText ? compareText.split('\n') : [];

  const chunks = [];
  chunks.push({ type: 'meta', text: `--- a/${baseName}` });
  chunks.push({ type: 'meta', text: `+++ b/${compareName}` });

  // Simple and fast line-by-line diff algorithm
  const baseSet = new Set(baseLines);
  const compareSet = new Set(compareLines);

  let addedCount = 0;
  let removedCount = 0;
  const diffLines = [];

  const maxLines = Math.max(baseLines.length, compareLines.length);
  const visitedBase = new Set();
  const visitedCompare = new Set();

  // 1. Identify context lines and changed blocks
  let i = 0;
  let j = 0;
  while (i < baseLines.length || j < compareLines.length) {
    const bLine = baseLines[i];
    const cLine = compareLines[j];

    if (bLine !== undefined && cLine !== undefined && bLine === cLine) {
      chunks.push({ type: 'context', text: bLine });
      diffLines.push(` ${bLine}`);
      i += 1;
      j += 1;
    } else {
      if (bLine !== undefined && !compareSet.has(bLine)) {
        chunks.push({ type: 'removed', text: bLine });
        diffLines.push(`-${bLine}`);
        removedCount += 1;
        i += 1;
      } else if (cLine !== undefined && !baseSet.has(cLine)) {
        chunks.push({ type: 'added', text: cLine });
        diffLines.push(`+${cLine}`);
        addedCount += 1;
        j += 1;
      } else {
        if (bLine !== undefined) {
          chunks.push({ type: 'removed', text: bLine });
          diffLines.push(`-${bLine}`);
          removedCount += 1;
          i += 1;
        }
        if (cLine !== undefined) {
          chunks.push({ type: 'added', text: cLine });
          diffLines.push(`+${cLine}`);
          addedCount += 1;
          j += 1;
        }
      }
    }
  }

  // Calculate similarity ratio
  const totalWords = (baseText.split(/\s+/).length + compareText.split(/\s+/).length) || 1;
  const commonWords = baseLines.filter((l) => compareSet.has(l)).join(' ').split(/\s+/).length;
  const similarity = Math.min(Math.max(Math.round(((commonWords * 2) / totalWords) * 100), 0), 100);

  return {
    base_branch: {
      branch_id: typeof baseBranch === 'object' ? baseBranch?.branch_id : null,
      branch_name: baseName,
      is_main: baseName === 'main',
      created_by: typeof baseBranch === 'object' ? baseBranch?.created_by : null,
    },
    compare_branch: {
      branch_id: typeof compareBranch === 'object' ? compareBranch?.branch_id : null,
      branch_name: compareName,
      is_main: compareName === 'main',
      created_by: typeof compareBranch === 'object' ? compareBranch?.created_by : null,
    },
    stats: {
      similarity_percent: isNaN(similarity) ? 100 : similarity,
      added_lines: addedCount,
      removed_lines: removedCount,
      base_word_count: baseText ? baseText.split(/\s+/).length : 0,
      compare_word_count: compareText ? compareText.split(/\s+/).length : 0,
    },
    diff_text: diffLines.join('\n'),
    chunks,
  };
}

// ─── Merging Logic With Creator Permission Guard ──────────────────────────────

export function canMergeBranch(currentUserId, targetBranch, permissionGranted = false) {
  if (!targetBranch) return { allowed: false, reason: 'Target branch does not exist.' };
  
  // Creator of the branch is allowed to merge it
  const creatorId =
    targetBranch.created_by?.id ||
    targetBranch.created_by?.user_id ||
    targetBranch.created_by?.username ||
    targetBranch.created_by;

  const currentId = currentUserId?.id || currentUserId?.user_id || currentUserId?.username || currentUserId;

  if (permissionGranted) {
    return { allowed: true, creator: targetBranch.created_by };
  }

  if (creatorId && currentId && String(creatorId) === String(currentId)) {
    return { allowed: true, creator: targetBranch.created_by };
  }

  // Branch created on main line or anonymous
  if (!creatorId) {
    return { allowed: true, creator: null };
  }

  const creatorName =
    targetBranch.created_by?.username ||
    `${targetBranch.created_by?.first_name || ''} ${targetBranch.created_by?.last_name || ''}`.trim() ||
    'author';

  return {
    allowed: false,
    reason: `Only the journalist who created this branch (@${creatorName}) has permission to merge it.`,
    creatorName,
    creatorId,
  };
}

