'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import {
  onIdTokenChanged,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
} from 'firebase/auth';
import { useQueryClient } from '@tanstack/react-query';
import { firebaseAuth } from '@/lib/firebase/config';
import { setTokenProvider } from '@/lib/api/auth-token';

const Context = createContext(null);

export function AuthProvider({ children }) {
  const cache = useQueryClient();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    try {
      const auth = firebaseAuth();
      let previousUid;
      setTokenProvider(refresh => auth.currentUser?.getIdToken(refresh));
      return onIdTokenChanged(
        auth,
        value => {
          if (previousUid !== value?.uid) {
            cache.removeQueries({
              predicate: query => String(query.queryKey[0]).startsWith('admin-'),
            });
            previousUid = value?.uid;
          }
          setUser(value);
          setLoading(false);
        },
        caughtError => {
          setError(caughtError.message);
          setLoading(false);
        },
      );
    } catch (caughtError) {
      setError(caughtError.message);
      setLoading(false);
    }
  }, [cache]);

  return (
    <Context.Provider
      value={{
        user,
        loading,
        error,
        login: (email, password) => signInWithEmailAndPassword(firebaseAuth(), email, password),
        google: () => signInWithPopup(firebaseAuth(), new GoogleAuthProvider()),
        logout: () => signOut(firebaseAuth()),
      }}
    >
      {children}
    </Context.Provider>
  );
}

export const useAuth = () => useContext(Context);
