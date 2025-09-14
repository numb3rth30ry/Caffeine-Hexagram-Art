import { useQuery } from '@tanstack/react-query';
import { useActor } from './useActor';

// This file is for React Query hooks to interact with the backend
// Since this application is entirely frontend-based with no backend storage,
// we only include a demo query to maintain the file structure

export function useDemo() {
  const { actor, isFetching } = useActor();

  return useQuery({
    queryKey: ['demo'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.demo();
    },
    enabled: !!actor && !isFetching,
  });
}
