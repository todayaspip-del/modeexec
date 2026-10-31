import { STORAGE_PREFIX, SCHEMA_VERSION, safeRead, safeWrite, writeSchemaVersion } from './storage';
import { INITIAL_STAGES, INITIAL_IDEAS, INITIAL_TASKS } from '../data/seedData';

export interface MigrationStep {
  id: string;
  run: () => void;
}

const COLLECTIONS = [
  'profile',
  'missions',
  'projects',
  'tasks',
  'decisions',
  'processes',
  'reviews',
  'wallpaper',
  'stages',
  'ideas',
] as const;

/**
 * Migration step from v1 to v2:
 * 1. Backs up untouched v1 keys to `modo_execucao_backup_v1_<name>`.
 * 2. Writes v2 keys under `modo_execucao_storage_v2_<name>`.
 * 3. Transforms projects: replaces `lastActivityDaysAgo` with `lastActivityAt` (ISO string)
 *    computed as (now - daysAgo * 86400000). If number is missing or invalid, uses now.
 * 4. All other collections are copied as is.
 * 5. Leaves original v1 keys completely untouched.
 */
function migrateV1ToV2(): void {
  const v2ProjectKey = `${STORAGE_PREFIX}v2_projects`;

  // Check if v2 keys already exist. If any v2 keys exist, do not overwrite.
  const alreadyMigrated = typeof window !== 'undefined' && window.localStorage && window.localStorage.getItem(v2ProjectKey) !== null;
  if (alreadyMigrated) {
    return;
  }

  const nowMs = Date.now();
  const MS_PER_DAY = 24 * 60 * 60 * 1000;

  for (const name of COLLECTIONS) {
    const v1Key = `modo_execucao_storage_v1_${name}`;
    const backupKey = `modo_execucao_backup_v1_${name}`;
    const v2Key = `${STORAGE_PREFIX}v2_${name}`;

    if (typeof window === 'undefined' || !window.localStorage) {
      continue;
    }

    const rawV1 = window.localStorage.getItem(v1Key);
    if (rawV1 === null) {
      // No v1 data for this collection
      continue;
    }

    // 1. Copy untouched v1 value to backup key
    try {
      window.localStorage.setItem(backupKey, rawV1);
    } catch (e) {
      console.warn(`[migration] Failed to backup v1 key "${v1Key}":`, e);
    }

    // 2. Parse and transform if needed
    try {
      const parsed = JSON.parse(rawV1);

      if (name === 'projects' && Array.isArray(parsed)) {
        const transformedProjects = parsed.map((item: any) => {
          if (!item || typeof item !== 'object') {
            return item;
          }
          const { lastActivityDaysAgo, ...rest } = item;
          let calculatedIso = new Date(nowMs).toISOString();

          if (typeof lastActivityDaysAgo === 'number' && Number.isFinite(lastActivityDaysAgo) && lastActivityDaysAgo >= 0) {
            calculatedIso = new Date(nowMs - lastActivityDaysAgo * MS_PER_DAY).toISOString();
          }

          return {
            ...rest,
            lastActivityAt: calculatedIso,
          };
        });
        safeWrite(v2Key, transformedProjects);
      } else {
        // Every other collection is copied as is
        safeWrite(v2Key, parsed);
      }
    } catch (e) {
      console.warn(`[migration] Failed to parse or transform v1 key "${v1Key}":`, e);
    }
  }

  writeSchemaVersion(SCHEMA_VERSION);
}

/**
 * Migration step 'archive_fixup':
 * Fixes tasks corrupted by legacy Recovery mode:
 * Every stored task with status 'concluida' and blockedReason === 'Arquivada em Recuperação'
 * becomes status 'arquivada' with archivedAt = completedAt ?? now and archiveReason = 'Arquivada em Recuperação',
 * and its completedAt is removed.
 */
function migrateArchiveFixup(): void {
  const v2TasksKey = `${STORAGE_PREFIX}v2_tasks`;
  const tasks = safeRead<any[]>(v2TasksKey, []);
  if (!Array.isArray(tasks) || tasks.length === 0) {
    return;
  }

  const now = new Date().toISOString();
  let changed = false;

  const updatedTasks = tasks.map((task: any) => {
    if (!task || typeof task !== 'object') {
      return task;
    }
    if (task.status === 'concluida' && task.blockedReason === 'Arquivada em Recuperação') {
      changed = true;
      const { completedAt, ...rest } = task;
      return {
        ...rest,
        status: 'arquivada',
        archivedAt: completedAt ?? now,
        archiveReason: 'Arquivada em Recuperação'
      };
    }
    return task;
  });

  if (changed) {
    safeWrite(v2TasksKey, updatedTasks);
  }
}

/**
 * Migration step 'mesa_seed_v1':
 * Seeds stages and ideas for users who don't have them yet,
 * and enriches existing tasks with Mesa de Criação fields (stageId, order, checklist, etc.).
 */
function migrateMesaSeed(): void {
  const v2StagesKey = `${STORAGE_PREFIX}v2_stages`;
  const v2IdeasKey = `${STORAGE_PREFIX}v2_ideas`;
  const v2TasksKey = `${STORAGE_PREFIX}v2_tasks`;

  if (typeof window === 'undefined' || !window.localStorage) {
    return;
  }

  // Usuário novo (sem tarefas salvas): começa limpo. A semente de demonstração
  // só é aplicada a quem já tinha dados de uma versão anterior.
  if (window.localStorage.getItem(v2TasksKey) === null) {
    return;
  }

  const rawStages = window.localStorage.getItem(v2StagesKey);
  if (rawStages === null) {
    safeWrite(v2StagesKey, INITIAL_STAGES);
  }

  const rawIdeas = window.localStorage.getItem(v2IdeasKey);
  if (rawIdeas === null) {
    safeWrite(v2IdeasKey, INITIAL_IDEAS);
  }

  const storedTasks = safeRead<any[]>(v2TasksKey, []);
  if (Array.isArray(storedTasks) && storedTasks.length > 0) {
    let changed = false;
    const seedMap = new Map(INITIAL_TASKS.map((t) => [t.id, t]));

    const updatedTasks = storedTasks.map((task) => {
      if (!task || typeof task !== 'object') {
        return task;
      }
      const seed = seedMap.get(task.id);
      if (seed) {
        let taskChanged = false;
        const copy = { ...task };
        if (copy.stageId === undefined && seed.stageId !== undefined) {
          copy.stageId = seed.stageId;
          taskChanged = true;
        }
        if (copy.order === undefined && seed.order !== undefined) {
          copy.order = seed.order;
          taskChanged = true;
        }
        if (copy.checklist === undefined && seed.checklist !== undefined) {
          copy.checklist = seed.checklist;
          taskChanged = true;
        }
        if (copy.minimumVersion === undefined && seed.minimumVersion !== undefined) {
          copy.minimumVersion = seed.minimumVersion;
          taskChanged = true;
        }
        if (copy.decisionId === undefined && seed.decisionId !== undefined) {
          copy.decisionId = seed.decisionId;
          taskChanged = true;
        }
        if (copy.conversationSlug === undefined && seed.conversationSlug !== undefined) {
          copy.conversationSlug = seed.conversationSlug;
          taskChanged = true;
        }
        if (copy.blockedReasonKey === undefined && seed.blockedReasonKey !== undefined) {
          copy.blockedReasonKey = seed.blockedReasonKey;
          taskChanged = true;
        }
        if (taskChanged) {
          changed = true;
          return copy;
        }
      }
      return task;
    });

    if (changed) {
      safeWrite(v2TasksKey, updatedTasks);
    }
  }
}

const MIGRATIONS: MigrationStep[] = [
  {
    id: 'v1_to_v2',
    run: migrateV1ToV2,
  },
  {
    id: 'archive_fixup',
    run: migrateArchiveFixup,
  },
  {
    id: 'mesa_seed_v1',
    run: migrateMesaSeed,
  },
];

/**
 * Runs pending migrations sequentially.
 * Structure allows appending new migration steps idempotently.
 * Wrapped in try/catch to protect user data from corruption.
 */
export function runMigrations(): void {
  if (typeof window === 'undefined' || !window.localStorage) {
    return;
  }

  const appliedKey = `${STORAGE_PREFIX}applied_migrations`;

  try {
    const applied = safeRead<string[]>(appliedKey, []);
    const appliedSet = new Set(applied);

    for (const step of MIGRATIONS) {
      if (!appliedSet.has(step.id)) {
        step.run();
        appliedSet.add(step.id);
        safeWrite(appliedKey, Array.from(appliedSet));
      }
    }
  } catch (error) {
    console.warn('[migration] runMigrations encountered an error, leaving data untouched:', error);
  }
}
