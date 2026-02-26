'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import { auth, googleProvider } from '@/lib/firebase';
import { createOrUpdateUser } from '@/lib/firestore';
import { useStore } from '@/lib/store';
import { Timestamp } from 'firebase/firestore';

interface AuthContextType {
    signInWithGoogle: () => Promise<void>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    signInWithGoogle: async () => { },
    logout: async () => { },
});

export function useAuth() {
    return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: ReactNode }) {
    const { setUser, setLoading } = useStore();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                setUser(firebaseUser);
                await createOrUpdateUser({
                    uid: firebaseUser.uid,
                    name: firebaseUser.displayName || '',
                    email: firebaseUser.email || '',
                    photoURL: firebaseUser.photoURL || '',
                    createdAt: Timestamp.now(),
                });
            } else {
                setUser(null);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, [setUser, setLoading]);

    const signInWithGoogle = async () => {
        setLoading(true);
        try {
            // Hesap secme ekranini zorla (temiz bir oturum icin)
            googleProvider.setCustomParameters({
                prompt: 'select_account'
            });

            // Redirect hatasini (missing initial state) cozmek icin Popup kullan
            await signInWithPopup(auth, googleProvider);
        } catch (error: any) {
            console.error('Google Sign-In Error:', error);
            alert('Giris yapilamadi: ' + (error.message || 'Bilinmeyen bir hata olustu'));
            setLoading(false);
        }
    };

    const logout = async () => {
        try {
            await signOut(auth);
            setUser(null);
        } catch (error) {
            console.error('Logout Error:', error);
        }
    };

    return (
        <AuthContext.Provider value={{ signInWithGoogle, logout }}>
            {children}
        </AuthContext.Provider>
    );
}
