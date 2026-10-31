/**
 * Pure ordering and reindexing helpers for board columns, stages, and cards.
 * No React imports.
 */

/**
 * Sorts items ascending by their order property.
 * Items without order default to order 0.
 */
export function sortByOrder<T extends { order?: number }>(items: T[]): T[] {
  return [...items].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
}

/**
 * Calculates the next 1-based order for appending to an item collection.
 */
export function nextOrder<T extends { order?: number }>(items: T[]): number {
  if (!items || items.length === 0) {
    return 1;
  }
  const max = Math.max(...items.map((i) => i.order ?? 0));
  return max + 1;
}

/**
 * Reindexes a column of items sequentially starting from startOrder (default 1).
 * Preserves the array order passed in.
 */
export function reindexColumn<T extends { order?: number }>(
  items: T[],
  startOrder: number = 1
): T[] {
  return items.map((item, index) => ({
    ...item,
    order: startOrder + index
  }));
}

/**
 * Inserts an item into an array at a specific index (or at the end if omitted/out of bounds),
 * then reindexes the full list so orders are consecutive: 1, 2, 3...
 */
export function insertAt<T extends { order?: number }>(
  items: T[],
  item: T,
  index?: number
): T[] {
  const result = [...items];
  if (index === undefined || index < 0 || index >= result.length) {
    result.push(item);
  } else {
    result.splice(index, 0, item);
  }
  return reindexColumn(result);
}

/**
 * Moves an item between two columns (or reorders within the same column).
 * Removes the item from source, reindexes source.
 * Inserts the item into target at targetIndex, reindexes target.
 */
export function moveBetweenColumns<T extends { id: string; order?: number }>(
  source: T[],
  target: T[],
  itemId: string,
  targetIndex?: number
): { source: T[]; target: T[]; movedItem: T | undefined } {
  const itemIndex = source.findIndex((i) => i.id === itemId);
  if (itemIndex === -1) {
    return {
      source: reindexColumn(source),
      target: reindexColumn(target),
      movedItem: undefined
    };
  }

  const [movedItem] = source.slice(itemIndex, itemIndex + 1);
  const newSource = source.filter((i) => i.id !== itemId);

  // If moving within the same column
  if (source === target) {
    const reordered = insertAt(newSource, movedItem, targetIndex);
    return {
      source: reordered,
      target: reordered,
      movedItem
    };
  }

  const reindexedSource = reindexColumn(newSource);
  const reindexedTarget = insertAt(target, movedItem, targetIndex);

  return {
    source: reindexedSource,
    target: reindexedTarget,
    movedItem
  };
}
