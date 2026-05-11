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
  const defaultData = generateDummyApplicants();
  
  if (!data) {
    saveApplicants(defaultData);
    return defaultData;
  }
  
  const currentApplicants: Applicant[] = JSON.parse(data);
  
  // Ensure "queue-" dummy data is injected if missing from local storage
  const queueIds = [
    'queue-001', 'queue-002', 'queue-003', 'queue-004', 
    'queue-005', 'queue-006', 'queue-007', 'queue-008',
    'queue-009', 'queue-010', 'queue-011', 'queue-012', 'queue-013'
  ];
  const missingQueueData = defaultData.filter(d => queueIds.includes(d.id) && !currentApplicants.some(c => c.id === d.id));
  
  if (missingQueueData.length > 0) {
    const updated = [...missingQueueData, ...currentApplicants];
    saveApplicants(updated);
    return updated;
  }
  
  return currentApplicants;
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
  
  const refreshFromDefaults = () => {
    saveQuestions(INITIAL_QUESTIONS);
    return [...INITIAL_QUESTIONS];
  };

  if (!data) {
    return refreshFromDefaults();
  }
  
  try {
    const currentQuestions: Question[] = JSON.parse(data);
    
    // Migration: Handle rename of AssessmentType value
    // Older data might have 'Professional Technologist' string
    let migrationOccurred = false;
    const migrated = currentQuestions.map(q => {
      let target = q.target as any;
      if (target === 'Professional Technologist') {
        target = AssessmentType.PROFESSIONAL_TECHNOLOGIST;
        migrationOccurred = true;
      }
      return { ...q, target };
    });

    // If for some reason the vault is empty or significantly smaller than defaults, 
    // we should consider adding back any missing default questions
    const hasRequiredQuestions = migrated.length >= INITIAL_QUESTIONS.length;
    
    if (!hasRequiredQuestions) {
      // Find missing default questions by ID
      const missingDefaults = INITIAL_QUESTIONS.filter(def => !migrated.some(q => q.id === def.id));
      if (missingDefaults.length > 0) {
        const updated = [...migrated, ...missingDefaults];
        saveQuestions(updated);
        return updated;
      }
    }

    if (migrationOccurred) {
      saveQuestions(migrated);
    }

    return migrated;
  } catch (e) {
    return refreshFromDefaults();
  }
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
