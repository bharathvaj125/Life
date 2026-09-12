import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { api } from '../lib/api';
import { sound } from '../lib/sound';
import { useAuth } from './AuthContext';
import confetti from 'canvas-confetti';

const GameContext = createContext(null);

export function GameProvider({ children }) {
  const { user, setUser } = useAuth();

  const [levelState, setLevelState] = useState({
    level: 1,
    xpIntoLevel: 0,
    xpForNextLevel: 25,
    progressPct: 0,
    totalXp: 0,
  });
  const [attributes, setAttributes] = useState([]);
  const [missions, setMissions] = useState([]);
  const [activityLogs, setActivityLogs] = useState([]);
  const [shopItems, setShopItems] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [achievements, setAchievements] = useState([]);
  const [achievementToast, setAchievementToast] = useState(null);

  const [loadingMissions, setLoadingMissions] = useState(true);
  const [loadingCharacter, setLoadingCharacter] = useState(true);
  const [loadingShop, setLoadingShop] = useState(false);
  const [networkError, setNetworkError] = useState(null);

  // Celebration state
  const [celebration, setCelebration] = useState(null); // { type: 'level_up' | 'streak', data }

  // Ref mirror of `achievements` so fetchCharacterData can diff against the
  // previous unlock state without depending on `achievements` itself — adding
  // it as a dependency here would recreate this callback on every fetch and
  // reintroduce the same re-fetch-loop class of bug fixed above.
  const achievementsRef = useRef([]);
  useEffect(() => {
    achievementsRef.current = achievements;
  }, [achievements]);

  const fetchCharacterData = useCallback(async () => {
    if (!user) return;
    try {
      setNetworkError(null);
      const data = await api.getCharacter();
      setUser(data.user);
      setLevelState(data.levelState);
      setAttributes(data.attributes || []);

      if (data.achievements) {
        const prevUnlockedIds = new Set(
          achievementsRef.current.filter((a) => a.unlocked).map((a) => a.id)
        );
        const newlyUnlocked = data.achievements.filter(
          (a) => a.unlocked && !prevUnlockedIds.has(a.id)
        );
        // Skip the toast on the very first load (nothing to compare against yet)
        if (newlyUnlocked.length > 0 && achievementsRef.current.length > 0) {
          sound.playPurchase();
          setAchievementToast(newlyUnlocked[0]);
        }
        setAchievements(data.achievements);
      }
    } catch (err) {
      setNetworkError(err.message);
    } finally {
      setLoadingCharacter(false);
    }
  }, [user, setUser]);

  const dismissAchievementToast = () => setAchievementToast(null);

  const fetchMissions = useCallback(async () => {
    if (!user) return;
    try {
      setNetworkError(null);
      const data = await api.getMissions();
      setMissions(data.tasks || []);
    } catch (err) {
      setNetworkError(err.message);
    } finally {
      setLoadingMissions(false);
    }
  }, [user]);

  const fetchActivity = useCallback(async () => {
    if (!user) return;
    try {
      const data = await api.getActivity();
      setActivityLogs(data.logs || []);
    } catch (err) {
      console.warn('Failed to fetch activity logs:', err);
    }
  }, [user]);

  const fetchShop = useCallback(async () => {
    if (!user) return;
    setLoadingShop(true);
    try {
      const [itemsRes, invRes] = await Promise.all([api.getShopItems(), api.getInventory()]);
      setShopItems(itemsRes.items || []);
      setInventory(invRes.inventory || []);
    } catch (err) {
      console.warn('Shop fetch error:', err);
    } finally {
      setLoadingShop(false);
    }
  }, [user]);

  // Keyed on the user's id (a stable primitive), not the `user` object itself:
  // fetchCharacterData replaces `user` with a fresh object on every call, and
  // that object is a dependency of these fetch* callbacks. Depending on the
  // object (or the callbacks) here would re-fire this effect after every
  // fetch, looping fetches forever.
  const userId = user?.id ?? null;

  useEffect(() => {
    if (userId) {
      fetchCharacterData();
      fetchMissions();
      fetchActivity();
      fetchShop();
    } else {
      setMissions([]);
      setAttributes([]);
      setActivityLogs([]);
      setShopItems([]);
      setInventory([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  /**
   * Optimistic Mission Completion
   * Instantly ticks off the mission in local state and plays sound feedback.
   * If server call fails, rolls back seamlessly and alerts the operative.
   */
  const completeMission = async (missionId) => {
    const targetMission = missions.find((m) => m.id === missionId);
    if (!targetMission || targetMission.status === 'completed') return;

    sound.playMissionComplete();

    // 1. Snapshot previous state for rollback
    const previousMissions = [...missions];
    const previousUser = { ...user };
    const previousLevelState = { ...levelState };

    // 2. Apply optimistic local update
    const optimisticCompletedAt = new Date().toISOString();
    setMissions((prev) =>
      prev.map((m) => (m.id === missionId ? { ...m, status: 'completed', completed_at: optimisticCompletedAt } : m))
    );

    // Optimistically bump credits & XP
    const earnedCredits = targetMission.credit_reward || 5;
    const earnedXp = targetMission.xp_reward || 10;
    setUser((prev) => (prev ? { ...prev, credits: (prev.credits || 0) + earnedCredits } : prev));

    try {
      // 3. Round-trip through real backend API
      const result = await api.completeMission(missionId);

      // 4. Reconcile with authoritative server response
      setUser(result.user);
      setLevelState(result.levelState);

      // Re-fetch attributes & activities to keep neural telemetry synchronized
      fetchCharacterData();
      fetchActivity();

      // Check for Celebration Moment (Emotional payoff!)
      if (result.leveledUp) {
        sound.playLevelUp();
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#00F0FF', '#FF0055', '#FFB800', '#00FF9D'],
        });
        setCelebration({
          type: 'level_up',
          data: {
            newLevel: result.levelState.level,
            rewards: result.rewards,
            bonusCredits: result.bonusCredits,
          },
        });
      } else if (result.bonusCredits > 0) {
        sound.playPurchase();
        confetti({
          particleCount: 60,
          spread: 50,
          origin: { y: 0.7 },
          colors: ['#FFB800', '#00F0FF'],
        });
        setCelebration({
          type: 'streak_milestone',
          data: {
            streak: result.streak.currentStreak,
            bonusCredits: result.bonusCredits,
          },
        });
      }
    } catch (err) {
      // Rollback optimistic state on network/server error
      setMissions(previousMissions);
      setUser(previousUser);
      setLevelState(previousLevelState);
      setNetworkError(err.message || 'Mission uplink synchronization failed.');
    }
  };

  const createMission = async (missionData) => {
    sound.playClick();
    try {
      const { task } = await api.createMission(missionData);
      setMissions((prev) => [task, ...prev]);
      fetchCharacterData(); // updates attribute list if custom attribute created
      return task;
    } catch (err) {
      throw err;
    }
  };

  const updateMission = async (id, updates) => {
    sound.playClick();
    try {
      const { task } = await api.updateMission(id, updates);
      setMissions((prev) => prev.map((m) => (m.id === id ? task : m)));
      return task;
    } catch (err) {
      throw err;
    }
  };

  const deleteMission = async (id) => {
    sound.playClick();
    const previous = [...missions];
    setMissions((prev) => prev.filter((m) => m.id !== id));
    try {
      await api.deleteMission(id);
    } catch (err) {
      setMissions(previous);
      throw err;
    }
  };

  const buyItem = async (itemId) => {
    sound.playClick();
    try {
      const data = await api.buyItem(itemId);
      sound.playPurchase();
      setUser((prev) => (prev ? { ...prev, credits: data.remainingCredits } : prev));
      await fetchShop();
      await fetchActivity();
      return data;
    } catch (err) {
      throw err;
    }
  };

  const equipItem = async (itemId) => {
    sound.playClick();
    try {
      await api.equipItem(itemId);
      await fetchShop();
    } catch (err) {
      throw err;
    }
  };

  const closeCelebration = () => {
    setCelebration(null);
  };

  return (
    <GameContext.Provider
      value={{
        levelState,
        attributes,
        missions,
        activityLogs,
        shopItems,
        inventory,
        achievements,
        achievementToast,
        dismissAchievementToast,
        loadingMissions,
        loadingCharacter,
        loadingShop,
        networkError,
        setNetworkError,
        celebration,
        closeCelebration,
        completeMission,
        createMission,
        updateMission,
        deleteMission,
        buyItem,
        equipItem,
        refreshMissions: fetchMissions,
        refreshCharacter: fetchCharacterData,
        refreshShop: fetchShop,
      }}
    >
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be used within a GameProvider');
  return ctx;
}
