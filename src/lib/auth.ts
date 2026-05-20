import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  onAuthStateChanged, 
  signInAnonymously,
  User,
  signOut
} from 'firebase/auth';
import { auth, db } from './firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { AppUser, AppTheme } from '../types';

const provider = new GoogleAuthProvider();
provider.addScope('https://www.googleapis.com/auth/gmail.send');
provider.addScope('https://www.googleapis.com/auth/userinfo.email');
provider.addScope('https://www.googleapis.com/auth/userinfo.profile');

let isSigningIn = false;
let cachedAccessToken: string | null = null;
let isIdentityVerified = false;

// Simplified gateway verification
const verifyGatewaySession = async (): Promise<boolean> => {
  // In AI Studio, we don't have CF cookies, so we bypass quickly
  isIdentityVerified = true;
  return true;
};

export const initAuth = (
  onAuthSuccess?: (user: any, token: string | null, appUser: AppUser) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    // Identity Gate: Fast-track
    if (!isIdentityVerified) {
      await verifyGatewaySession();
    }

    if (user) {
      try {
        const appUser = await getOrCreateAppUser(user);
        // Note: cachedAccessToken is ONLY available on first sign-in.
        // On refresh, user must re-sign in to get a fresh Gmail token.
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken, appUser);
      } catch (error) {
        console.error('Auth sync error:', error);
        if (onAuthFailure) onAuthFailure();
      }
    } else if (!isSigningIn) {
      // Use Anonymous Sign-In to give every guest a stable, persistent UID.
      // If anonymous auth is disabled (auth/admin-restricted-operation), 
      // we gracefully proceed to allow the app to function without a Firebase UID.
      signInAnonymously(auth).catch(error => {
        console.warn('Anonymous sign-in unavailable (likely disabled in Firebase Console):', error.code);
        
        // Final fallback: If anonymous auth fails, we trigger success with a null user
        // so the app can still render for guests, even if Firestore writes might be restricted.
        if (onAuthSuccess) {
          const guestTheme = localStorage.getItem('hq_theme_preference') as AppTheme || 'slate';
          onAuthSuccess(null, null, {
            uid: 'guest_unauthenticated',
            email: 'guest@hq.local',
            name: 'HQ Operator (Guest)',
            role: 'member',
            themePreference: guestTheme,
            createdAt: new Date(),
          } as AppUser);
        }
      });
    }
  });
};

export const getOrCreateAppUser = async (user: User, retries = 1): Promise<AppUser> => {
  const localTheme = localStorage.getItem('hq_theme_preference') as AppTheme;

  try {
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    if (userDoc.exists()) {
      return userDoc.data() as AppUser;
    } else {
      const newUser: AppUser = {
        uid: user.uid,
        email: user.email || `guest_${user.uid.slice(0, 5)}@handoverhq.local`,
        name: user.displayName || 'HQ Operator',
        role: (user.email === 'yesaya.rio@gmail.com') ? 'admin' : 'member',
        themePreference: localTheme || 'slate',
        createdAt: serverTimestamp(),
      };
      // Try to save, but don't block the return if it's slow
      setDoc(doc(db, 'users', user.uid), newUser).catch(e => console.warn("Failed to persist user profile:", e));
      return newUser;
    }
  } catch (error: any) {
    const isOffline = error.code === 'unavailable' || error.message?.includes('offline') || error.code === 'failed-precondition';
    
    if (retries > 0 && isOffline) {
      console.warn(`Database connection pending. Retrying session establishment...`);
      await new Promise(resolve => setTimeout(resolve, 2000));
      return getOrCreateAppUser(user, retries - 1);
    }
    
    // If we're still "offline", handle gracefully as requested
    if (isOffline) {
      console.warn("Establishing secure database connection... (Fallback active)");
    }

    // Final fallback: Return a functioning user object to allow the app to render
    return {
      uid: user.uid,
      email: user.email || `guest_${user.uid.slice(0, 5)}@handoverhq.local`,
      name: user.displayName || 'HQ Operator',
      role: (user.email === 'yesaya.rio@gmail.com') ? 'admin' : 'member',
      themePreference: localTheme || 'slate',
      createdAt: new Date(),
    };
  }
};

export const googleSignIn = async (): Promise<{ user: User; accessToken: string; appUser: AppUser } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Failed to get access token from Firebase Auth');
    }

    cachedAccessToken = credential.accessToken;
    const appUser = await getOrCreateAppUser(result.user);
    return { user: result.user, accessToken: cachedAccessToken, appUser };
  } catch (error: any) {
    console.error('Sign in error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getAccessToken = (): string | null => {
  return cachedAccessToken;
};

export const logout = async () => {
  await signOut(auth);
  cachedAccessToken = null;
};

export const isIframe = (): boolean => {
  try {
    return window.self !== window.top;
  } catch (e) {
    return true;
  }
};
