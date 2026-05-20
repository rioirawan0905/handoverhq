import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  onAuthStateChanged, 
  User,
  signOut
} from 'firebase/auth';
import { auth, db } from './firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { AppUser } from '../types';

const provider = new GoogleAuthProvider();
provider.addScope('https://www.googleapis.com/auth/gmail.send');
provider.addScope('https://www.googleapis.com/auth/userinfo.email');
provider.addScope('https://www.googleapis.com/auth/userinfo.profile');

let isSigningIn = false;
let cachedAccessToken: string | null = null;

export const initAuth = (
  onAuthSuccess?: (user: User, token: string, appUser: AppUser) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        const appUser = await getOrCreateAppUser(user);
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken, appUser);
      } else if (!isSigningIn) {
        cachedAccessToken = null;
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

export const getOrCreateAppUser = async (user: User, retries = 3): Promise<AppUser> => {
  try {
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    if (userDoc.exists()) {
      return userDoc.data() as AppUser;
    } else {
      const newUser: AppUser = {
        uid: user.uid,
        email: user.email || '',
        name: user.displayName || '',
        role: (user.email === 'yesaya.rio@gmail.com') ? 'admin' : 'member',
        createdAt: serverTimestamp(),
      };
      await setDoc(doc(db, 'users', user.uid), newUser);
      return newUser;
    }
  } catch (error: any) {
    if (retries > 0 && error.message?.includes('offline')) {
      console.warn(`Firestore is appearing offline. Retrying... (${retries} left)`);
      await new Promise(resolve => setTimeout(resolve, 1000));
      return getOrCreateAppUser(user, retries - 1);
    }
    console.error('Error fetching/creating app user:', error);
    throw error;
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
