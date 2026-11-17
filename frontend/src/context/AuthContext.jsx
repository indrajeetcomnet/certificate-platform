import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import * as authApi from '../api/authApi';
import { deriveAuthState, persistSessionToStorage, wipeSessionFromStorage } from '../utils/authUtils.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const navigate = useNavigate();

  // Try restoring existing session from localStorage (strictly null if unauthenticated)
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('cert_user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState(() => {
    try {
      return localStorage.getItem('cert_token') || null;
    } catch {
      return null;
    }
  });

  // Verify backend session and cryptographic token on mount/restore
  useEffect(() => {
    let isMounted = true;
    if (token) {
      authApi.getMe()
        .then((res) => {
          if (!isMounted) return;
          if (res.data?.authenticated) {
            const verifiedUser = {
              id: res.data.userId,
              username: res.data.username,
              email: res.data.email,
              displayName: res.data.displayName || res.data.username,
              role: res.data.role,
              institutionId: res.data.role === 'INSTITUTION' ? (res.data.institutionId || res.data.userId) : null,
              avatarUrl: res.data.avatarUrl || null,
            };
            setCurrentUser(verifiedUser);
            persistSessionToStorage(localStorage, verifiedUser, token);
          }
        })
        .catch(() => {
          if (!isMounted) return;
          // Session is invalid, expired, or revoked on server
          setCurrentUser(null);
          setToken(null);
          wipeSessionFromStorage(localStorage);
        });
    }
    return () => {
      isMounted = false;
    };
  }, [token]);

  const { isAuthenticated, isInstitution, isUser } = deriveAuthState(currentUser);

  // Save session helper
  const persistSession = (userObj, tokenStr) => {
    setCurrentUser(userObj);
    setToken(tokenStr);
    persistSessionToStorage(localStorage, userObj, tokenStr);
  };

  // Athlete & Creator Login - Authentic Database Authentication
  const loginUser = useCallback(async (credentials) => {
    try {
      const res = await authApi.login(credentials);
      const data = res.data;
      const userObj = {
        id: data.userId,
        username: data.username,
        email: data.email,
        displayName: data.displayName || data.username,
        role: data.role,
        institutionId: data.institutionId || (data.role === 'INSTITUTION' ? data.userId : null),
        avatarUrl: data.avatarUrl || null,
      };
      persistSession(userObj, data.token);
      return { success: true, user: userObj };
    } catch (err) {
      const errorMsg = err.userFriendlyMessage || err.response?.data?.message || err.response?.data?.detail || err.message || 'Invalid username or password';
      throw new Error(errorMsg);
    }
  }, []);

  // Registration - Any user can register their own unique profile
  const registerUser = useCallback(async (registerData) => {
    try {
      const res = await authApi.register(registerData);
      const data = res.data;
      const userObj = {
        id: data.userId,
        username: data.username,
        email: data.email,
        displayName: data.displayName || data.username,
        role: data.role,
        avatarUrl: data.avatarUrl || null,
      };
      persistSession(userObj, data.token);
      return { success: true, user: userObj };
    } catch (err) {
      const errorMsg = err.userFriendlyMessage || err.response?.data?.message || err.response?.data?.detail || err.message || 'Registration failed';
      throw new Error(errorMsg);
    }
  }, []);

  // Institution Accreditation Login
  const loginInstitution = useCallback(async (credentials) => {
    try {
      const res = await authApi.institutionLogin(credentials);
      const data = res.data;
      const institutionObj = {
        id: data.userId,
        username: data.username,
        displayName: data.displayName || 'Apex Sports Academy',
        role: 'INSTITUTION',
        institutionId: data.institutionId || data.userId,
      };
      persistSession(institutionObj, data.token);
      return { success: true, user: institutionObj };
    } catch (err) {
      const errorMsg = err.userFriendlyMessage || err.response?.data?.message || err.response?.data?.detail || err.message || 'Institution authentication failed';
      throw new Error(errorMsg);
    }
  }, []);

  // Logout - strictly wipes all state and localStorage, calls backend, and navigates immediately to /login
  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch (e) {
      console.warn('Backend logout notification failed, proceeding with local session wipe:', e);
    } finally {
      setCurrentUser(null);
      setToken(null);
      wipeSessionFromStorage(localStorage);
      navigate('/login', { replace: true });
    }
  }, [navigate]);

  // Update current user in session and storage (e.g. after avatar/profile changes)
  const updateCurrentUser = useCallback((partialUser) => {
    setCurrentUser((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, ...partialUser };
      persistSessionToStorage(localStorage, updated, token);
      return updated;
    });
  }, [token]);

  const value = useMemo(
    () => ({
      currentUser,
      token,
      isAuthenticated,
      isInstitution,
      isUser,
      loginUser,
      registerUser,
      loginInstitution,
      logout,
      updateCurrentUser,
    }),
    [currentUser, token, isAuthenticated, isInstitution, isUser, loginUser, registerUser, loginInstitution, logout, updateCurrentUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
