/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export enum UserRole {
  APPLICANT = 'APPLICANT',
  SECRETARIAT = 'SECRETARIAT',
  ASSESSOR = 'ASSESSOR',
}

export enum ApplicantStatus {
  REGISTERED = 'Registered',
  UNDER_REVIEW = 'Under Review',
  ASSESSMENT_PENDING = 'Assessment Pending',
  ASSESSMENT_PASSED = 'Assessment Passed',
  ASSESSMENT_FAILED = 'Assessment Failed',
  PAYMENT_PENDING = 'Payment Pending',
  CERTIFIED = 'Certified',
  CERTIFICATE_READY = 'Certificate Ready',
  SUSPENDED = 'Suspended',
  PROFESSIONAL = 'Professional Technologist (Ts.)',
  CERTIFIED_TECH = 'Certified Technician (Tc.)',
  GRADUATE = 'Graduate Technologist',
  QUALIFIED_TECH = 'Qualified Technician',
  PROFESSIONAL_PENDING = 'Professional Review Pending',
}

export enum Gender {
  MALE = 'Male',
  FEMALE = 'Female',
}

export interface WorkflowStage {
  label: string;
  status: 'complete' | 'current' | 'upcoming';
  timestamp?: string;
  reviewer?: string;
  remarks?: string;
}

export enum Qualification {
  BACHELOR = 'Bachelor',
  MASTER = 'Master',
  PHD = 'PhD',
  DIPLOMA = 'Diploma',
  CERTIFICATE = 'Certificate',
}

export enum CPDCategory {
  TECHNICAL = 'Technical',
  SOFT_SKILLS = 'Soft Skills',
  CERTIFICATION = 'Certification',
  SEMINAR = 'Seminar',
  WORKSHOP = 'Workshop',
  OTHER = 'Other'
}

export enum CPDStatus {
  PENDING = 'Pending Approval',
  APPROVED = 'Approved',
  REJECTED = 'Rejected'
}

export interface CPDRecord {
  id: string;
  activityName: string;
  date: string;
  hours: number;
  provider: string;
  category: CPDCategory;
  status: CPDStatus;
  certificateUrl?: string;
  fileName?: string;
  location?: string;
}

export interface AssessmentResult {
  date: string;
  score: number;
  passed: boolean;
}

export interface Applicant {
  id: string;
  fullName: string;
  icPassport: string;
  email: string;
  password?: string;
  phone: string;
  gender?: Gender;
  dateOfBirth?: string;
  address?: string;
  ethicsDeclaration?: boolean;
  nricFront?: string;
  nricBack?: string;
  qualification: Qualification;
  field: string;
  yearsOfExperience: number;
  cvMetadata?: { name: string; size: number };
  status: ApplicantStatus;
  registryAction?: string;
  gtNumber?: string;
  qtNumber?: string;
  pTechNumber?: string;
  cTechNumber?: string;
  registrationDate: string;
  renewalDate?: string;
  profilePicture?: string;
  cpdRecords: CPDRecord[];
  assessments: AssessmentResult[];
  feesPaid: {
    application?: boolean;
    assessment?: boolean;
    certification?: boolean;
    lifetime?: boolean;
    renewal?: boolean;
  };
  notifications?: Notification[];
  workflowLog?: {
    stage: string;
    date: string;
    actor: string;
    comments: string;
  }[];
}

export interface Staff {
  id: string;
  fullName: string;
  staffId: string;
  email: string;
  password?: string;
  department: string;
  profilePicture?: string;
  role: UserRole.SECRETARIAT;
}

export enum AssessmentType {
  PROFESSIONAL_TECHNOLOGIST = 'Professional Technologist',
  CERTIFIED_TECHNICIAN = 'Certified Technician',
}

export interface Question {
  id: string;
  text: string;
  options: string[];
  correctAnswer: number;
  category: 'Act 768' | 'OSHA' | 'Ethics' | 'Industry 4.0' | 'General';
  difficulty: 'Easy' | 'Medium' | 'Hard';
  target: AssessmentType;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  date: string;
  read: boolean;
}
