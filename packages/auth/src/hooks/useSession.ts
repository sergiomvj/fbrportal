'use client';

import { useEffect, useState } from 'react';
import type { PublicSessionUser, SessionResponse } from '../types';

type State = {
  user: PublicSessionUser | null;
  isLoading: boolean;
  error: string | null;
};

export function useSession(): State {
  const [state, setState] = useState<State>({
    user: null,
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    let active = true;

    async function loadSession() {
      try {
        const response = await fetch('/api/auth/me', {
          credentials: 'include',
          cache: 'no-store',
        });
        const data = (await response.json()) as SessionResponse;

        if (!active) {
          return;
        }

        if (!response.ok || !data.user) {
          setState({ user: null, isLoading: false, error: data.error });
          return;
        }

        setState({ user: data.user, isLoading: false, error: null });
      } catch {
        if (active) {
          setState({
            user: null,
            isLoading: false,
            error: 'Unable to load session.',
          });
        }
      }
    }

    void loadSession();

    return () => {
      active = false;
    };
  }, []);

  return state;
}
