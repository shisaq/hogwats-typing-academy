import { House, WordPracticeStats } from '../types';

const STORAGE_KEY = 'hogwarts_typing_academy_v2';

export interface UserProgress {
  house: House;
  maxLevel: number;
  graduated: boolean;
  wordStats: Record<string, WordPracticeStats>;
}

export interface User {
  username: string;
  progress: UserProgress;
  createdAt: string;
}

export interface StorageData {
  currentUser: string | null;
  users: Record<string, User>;
}

// ==================== 数据迁移 ====================

// 从旧版本迁移数据到新格式
const migrateFromV1 = (): StorageData | null => {
  try {
    const oldData = localStorage.getItem('hogwarts_typing_academy_v1');
    if (oldData) {
      const parsed = JSON.parse(oldData) as UserProgress;
      // 创建默认用户 "haha" 并将旧数据迁移过去
      const migratedData: StorageData = {
        currentUser: 'haha',
        users: {
          'haha': {
            username: 'haha',
            progress: parsed,
            createdAt: new Date().toISOString()
          }
        }
      };
      // 删除旧数据
      localStorage.removeItem('hogwarts_typing_academy_v1');
      return migratedData;
    }
  } catch (e) {
    console.error("Failed to migrate data", e);
  }
  return null;
};

// ==================== 核心存储操作 ====================

const getStorageData = (): StorageData => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
    // 尝试迁移旧数据
    const migrated = migrateFromV1();
    if (migrated) {
      saveStorageData(migrated);
      return migrated;
    }
  } catch (e) {
    console.error("Failed to load storage data", e);
  }
  // 默认空状态
  return {
    currentUser: null,
    users: {}
  };
};

const saveStorageData = (data: StorageData) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error("Failed to save storage data", e);
  }
};

const createDefaultProgress = (): UserProgress => ({
  house: House.Unsorted,
  maxLevel: 1,
  graduated: false,
  wordStats: {}
});

const normalizeProgress = (progress?: Partial<UserProgress>): UserProgress => ({
  ...createDefaultProgress(),
  ...progress,
  wordStats: progress?.wordStats || {}
});

// ==================== 用户管理 ====================

export const createUser = (username: string): boolean => {
  const data = getStorageData();
  const trimmedUsername = username.trim();

  if (!trimmedUsername) return false;
  if (data.users[trimmedUsername]) return false; // 用户已存在

  const newUser: User = {
    username: trimmedUsername,
    progress: createDefaultProgress(),
    createdAt: new Date().toISOString()
  };

  data.users[trimmedUsername] = newUser;
  data.currentUser = trimmedUsername;
  saveStorageData(data);
  return true;
};

export const switchUser = (username: string): boolean => {
  const data = getStorageData();
  if (!data.users[username]) return false;

  data.currentUser = username;
  saveStorageData(data);
  return true;
};

export const deleteUser = (username: string): boolean => {
  const data = getStorageData();
  if (!data.users[username]) return false;

  delete data.users[username];

  // 如果删除的是当前用户，需要切换到其他用户或设为null
  if (data.currentUser === username) {
    const remainingUsers = Object.keys(data.users);
    data.currentUser = remainingUsers.length > 0 ? remainingUsers[0] : null;
  }

  saveStorageData(data);
  return true;
};

export const getCurrentUser = (): string | null => {
  const data = getStorageData();
  return data.currentUser;
};

export const getAllUsers = (): string[] => {
  const data = getStorageData();
  return Object.keys(data.users);
};

export const getUsers = (): Record<string, User> => {
  const data = getStorageData();
  const users: Record<string, User> = {};

  for (const [username, user] of Object.entries(data.users)) {
    users[username] = {
      ...user,
      progress: normalizeProgress(user.progress)
    };
  }

  return users;
};

export const userExists = (username: string): boolean => {
  const data = getStorageData();
  return !!data.users[username];
};

// ==================== 进度管理（自动关联当前用户） ====================

export const getProgress = (): UserProgress => {
  const data = getStorageData();

  if (!data.currentUser) {
    // 没有当前用户，返回默认值
    return createDefaultProgress();
  }

  const user = data.users[data.currentUser];
  if (!user) {
    return createDefaultProgress();
  }

  return normalizeProgress(user.progress);
};

export const saveProgress = (progress: Partial<UserProgress>) => {
  const data = getStorageData();

  if (!data.currentUser) {
    console.warn("No current user selected, cannot save progress");
    return;
  }

  const user = data.users[data.currentUser];
  if (!user) {
    console.warn("Current user not found, cannot save progress");
    return;
  }

  user.progress = normalizeProgress({ ...user.progress, ...progress });
  saveStorageData(data);
};

export const recordWordPractice = (wordId: string, word: string, errors: number) => {
  const data = getStorageData();

  if (!data.currentUser) {
    console.warn("No current user selected, cannot save word practice");
    return;
  }

  const user = data.users[data.currentUser];
  if (!user) {
    console.warn("Current user not found, cannot save word practice");
    return;
  }

  const progress = normalizeProgress(user.progress);
  const correctChars = word.length;
  const totalKeystrokes = correctChars + errors;
  const accuracy = totalKeystrokes > 0 ? Math.round((correctChars / totalKeystrokes) * 100) : 100;
  const previous = progress.wordStats[wordId];
  const completedCount = (previous?.completedCount || 0) + 1;
  const bestAccuracy = Math.max(previous?.bestAccuracy || 0, accuracy);
  const mastery =
    completedCount >= 3 && bestAccuracy >= 95
      ? 'mastered'
      : completedCount >= 2
        ? 'learning'
        : 'seen';

  progress.wordStats[wordId] = {
    word,
    seenCount: (previous?.seenCount || 0) + 1,
    completedCount,
    errorCount: (previous?.errorCount || 0) + errors,
    bestAccuracy,
    mastery,
    lastPracticedAt: new Date().toISOString()
  };

  user.progress = progress;
  saveStorageData(data);
};

export const clearProgress = () => {
  const data = getStorageData();

  if (!data.currentUser) {
    return;
  }

  const user = data.users[data.currentUser];
  if (user) {
    user.progress = createDefaultProgress();
    saveStorageData(data);
  }
}
