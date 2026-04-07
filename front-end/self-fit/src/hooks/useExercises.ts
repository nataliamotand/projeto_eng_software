import { useEffect, useMemo, useRef, useState } from 'react';
import type { Exercise } from '../services/exerciseApi';
import * as api from '../services/exerciseApi';

type UseExercisesReturn = {
  exercises: Exercise[];
  isLoading: boolean;
  error: string | null;
  searchQuery: string;
  setSearchQuery: (s: string) => void;
  muscleFilter: string;
  setMuscleFilter: (m: string) => void;
  targets: string[];
  loadMore: () => Promise<void>;
  isLoadingMore: boolean;
  hasMore: boolean;
};

export function useExercises(initialLimit?: number): UseExercisesReturn {
  const limit = initialLimit ?? 25;
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [muscleFilter, setMuscleFilter] = useState('Todos os Músculos');
  const [targets, setTargets] = useState<string[]>([]);

  // debounce timer
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    let mounted = true;
    async function loadInitial() {
      setIsLoading(true);
      setError(null);
      try {
        const [list, muscleList] = await Promise.all([
          api.getAllExercises(limit, 0),
          api.getAllTargetMuscles(),
        ]);
        if (!mounted) return;
        setExercises(list);
        setHasMore(Array.isArray(list) ? list.length >= limit : false);
        setTargets(muscleList || []);
      } catch (err: any) {
        console.error('useExercises initial load error', err);
        setError('Falha ao carregar exercícios');
      } finally {
        if (mounted) setIsLoading(false);
      }
    }
    loadInitial();
    return () => {
      mounted = false;
    };
  }, [initialLimit]);

  // search with debounce (600ms)
  useEffect(() => {
    // when muscle filter is active, prefer target endpoint
    if (muscleFilter && muscleFilter !== 'Todos os Músculos') {
      // fetch by target immediately (no debounce for filter)
      let mounted = true;
      setIsLoading(true);
      setError(null);
      (async () => {
        try {
          // Special-case: Cardio filter should match exercises whose category includes 'card'
          if (String(muscleFilter).toLowerCase() === 'cardio') {
            const all = await api.getAllExercises(1000, 0);
            if (!mounted) return;
            const filtered = (Array.isArray(all) ? all : []).filter((it: any) => {
              const cat = String(it.raw?.category || it.category || '').toLowerCase();
              return cat.includes('card');
            });
            setExercises(filtered || []);
            setHasMore(false);
          } else {
            const res = await api.getExercisesByTarget(muscleFilter);
            if (!mounted) return;
            setExercises(res || []);
            setHasMore(false);
          }
        } catch (err) {
          console.error('useExercises filter error', err);
          setError('Falha ao filtrar por músculo');
        } finally {
          if (mounted) setIsLoading(false);
        }
      })();

      return () => {
        mounted = false;
      };
    }

    // otherwise debounce name search / fetch all if empty
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    timerRef.current = setTimeout(() => {
      let mounted = true;
      (async () => {
        setIsLoading(true);
        setError(null);
        try {
          if (searchQuery && searchQuery.trim() !== '') {
            const res = await api.searchExercisesByName(searchQuery.trim(), limit);
            if (!mounted) return;
            setExercises(res || []);
            setHasMore(false);
          } else {
            const res = await api.getAllExercises(limit, 0);
            if (!mounted) return;
            setExercises(res || []);
            setHasMore(Array.isArray(res) ? res.length >= limit : false);
          }
        } catch (err: any) {
          console.error('useExercises search error', err);
          setError('Erro na busca de exercícios');
        } finally {
          if (mounted) setIsLoading(false);
        }
      })();

      return () => {
        mounted = false;
      };
    }, 600);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [searchQuery, muscleFilter, initialLimit]);

  async function loadMore() {
    if (isLoadingMore || isLoading || !hasMore) return;
    setIsLoadingMore(true);
    setError(null);
    try {
      const offset = exercises.length;
      const res = await api.getAllExercises(limit, offset);
      if (Array.isArray(res) && res.length > 0) {
        setExercises((prev) => [...prev, ...res]);
        setHasMore(res.length >= limit);
      } else {
        setHasMore(false);
      }
    } catch (err) {
      console.error('useExercises loadMore error', err);
      setError('Erro ao carregar mais exercícios');
    } finally {
      setIsLoadingMore(false);
    }
  }

  const value = useMemo(
    () => ({
      exercises,
      isLoading,
      error,
      searchQuery,
      setSearchQuery,
      muscleFilter,
      setMuscleFilter,
      targets,
      loadMore,
      isLoadingMore,
      hasMore,
    }),
    [exercises, isLoading, error, searchQuery, muscleFilter, targets, isLoadingMore, hasMore],
  );

  return value;
}
