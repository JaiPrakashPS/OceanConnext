import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { setLanguage } from '../i18n';
import {
  authenticateLocalUser,
  createLocalUser,
  getLocalUser,
  saveLocalBoat,
  saveLocalProfile,
} from '../db/helpers';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Restore session on app start
  useEffect(() => {
    restoreSession();
  }, []);

  const restoreSession = async () => {
    try {
      const [storedUser] = await AsyncStorage.multiGet(['user']);
      const parsedUser = storedUser[1] ? JSON.parse(storedUser[1]) : null;
      const localUser = parsedUser ? getLocalUser(parsedUser.id) : null;

      if (localUser) {
        setUser(localUser);
        if (localUser.preferredLanguage) {
          await setLanguage(localUser.preferredLanguage);
        }
      }
    } catch (_) {
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    const userData = authenticateLocalUser(email, password);
    if (!userData) {
      throw new Error('Invalid email or password.');
    }

    saveLocalProfile(userData);
    await AsyncStorage.setItem('user', JSON.stringify(userData));

    if (userData.preferredLanguage) {
      await setLanguage(userData.preferredLanguage);
    }

    setUser(userData);
    return userData;
  };

  const register = async (data) => {
    let userData;
    try {
      userData = createLocalUser(data);
    } catch (error) {
      if (error?.message?.includes('UNIQUE constraint failed')) {
        throw new Error('An account with this email already exists.');
      }
      throw error;
    }
    saveLocalProfile(userData);
    if (data.boat) {
      saveLocalBoat(data.boat);
    }
    await AsyncStorage.setItem('user', JSON.stringify(userData));

    setUser(userData);
    return userData;
  };

  const logout = async () => {
    await AsyncStorage.removeItem('user');
    setUser(null);
  };

  const updateUser = async (updatedUser) => {
    const merged = { ...user, ...updatedUser };
    await AsyncStorage.setItem('user', JSON.stringify(merged));
    setUser(merged);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
