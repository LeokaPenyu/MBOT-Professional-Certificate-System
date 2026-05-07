/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Applicant, Question, Notification, AssessmentType, Staff, UserRole } from '../types';
import { generateDummyApplicants, generateSingleDummyApplicant } from './dummyData';
import { INITIAL_QUESTIONS } from '../constants';

const STORAGE_KEYS = {
  APPLICANTS: 'mbot_applicants',
  CURRENT_USER_ID: 'mbot_current_user_id',
  QUESTIONS: 'mbot_questions',
  NOTIFICATIONS: 'mbot_notifications',
  STAFF: 'mbot_staff',
  USER_ROLE: 'mbot_user_role'
};

export const getApplicants = (): Applicant[] => {
  const data = localStorage.getItem(STORAGE_KEYS.APPLICANTS);
  if (!data) {
    const defaultData = generateDummyApplicants();
    saveApplicants(defaultData);
    return defaultData;
  }
  return JSON.parse(data);
};

export const saveApplicants = (applicants: Applicant[]) => {
  localStorage.setItem(STORAGE_KEYS.APPLICANTS, JSON.stringify(applicants));
  window.dispatchEvent(new Event('mbot-user-update'));
};

export const seedApplicants = (count: number) => {
  const current = getApplicants();
  const newOnes = Array.from({ length: count }, () => generateSingleDummyApplicant());
  saveApplicants([...newOnes, ...current]);
};

export const getStaff = (): Staff[] => {
  const data = localStorage.getItem(STORAGE_KEYS.STAFF);
  return data ? JSON.parse(data) : [];
};

export const saveStaff = (staff: Staff[]) => {
  localStorage.setItem(STORAGE_KEYS.STAFF, JSON.stringify(staff));
  window.dispatchEvent(new Event('mbot-user-update'));
};

export const getCurrentUser = (): any | null => {
  const id = localStorage.getItem(STORAGE_KEYS.CURRENT_USER_ID);
  const role = localStorage.getItem(STORAGE_KEYS.USER_ROLE);
  if (!id || !role) return null;
  
  if (role === UserRole.APPLICANT) {
    return getApplicants().find(a => a.id === id) || null;
  } else {
    return getStaff().find(s => s.id === id) || null;
  }
};

export const getCurrentRole = (): UserRole | null => {
  return localStorage.getItem(STORAGE_KEYS.USER_ROLE) as UserRole | null;
};

export const setCurrentUser = (id: string | null, role: UserRole | null = UserRole.APPLICANT) => {
  if (id && role) {
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, id);
    localStorage.setItem(STORAGE_KEYS.USER_ROLE, role);
  } else {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER_ID);
    localStorage.removeItem(STORAGE_KEYS.USER_ROLE);
  }
};

export const getQuestions = (): Question[] => {
  const data = localStorage.getItem(STORAGE_KEYS.QUESTIONS);
  
  if (data) {
    try {
      return JSON.parse(data);
    } catch (e) {
      return [...INITIAL_QUESTIONS];
    }
  }
  
  // If no data, populate with defaults
  saveQuestions(INITIAL_QUESTIONS);
  return [...INITIAL_QUESTIONS];
};

export const saveQuestions = (questions: Question[]) => {
  localStorage.setItem(STORAGE_KEYS.QUESTIONS, JSON.stringify(questions));
};

export const getNotifications = (userId: string): Notification[] => {
  const data = localStorage.getItem(`${STORAGE_KEYS.NOTIFICATIONS}_${userId}`);
  return data ? JSON.parse(data) : [];
};

export const addNotification = (userId: string, notification: Omit<Notification, 'id' | 'date' | 'read'>) => {
  const notifications = getNotifications(userId);
  const newNotif: Notification = {
    ...notification,
    id: Math.random().toString(36).substr(2, 9),
    date: new Date().toISOString(),
    read: false,
  };
  localStorage.setItem(`${STORAGE_KEYS.NOTIFICATIONS}_${userId}`, JSON.stringify([newNotif, ...notifications]));
};

export const updateUserProfile = (updatedUser: any) => {
  const role = getCurrentRole();
  if (role === UserRole.APPLICANT) {
    const applicants = getApplicants().map(a => a.id === updatedUser.id ? updatedUser : a);
    saveApplicants(applicants);
  } else if (role === UserRole.SECRETARIAT) {
    const staff = getStaff().map(s => s.id === updatedUser.id ? updatedUser : s);
    saveStaff(staff);
  }
};
