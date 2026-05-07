/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Question, AssessmentType } from './types';

export const MBOT_FIELDS = [
  "Information and Computing Technology",
  "Electrical and Electronic Technology",
  "Mechanical Technology",
  "Building and Construction Technology",
  "Chemical Technology",
  "Green Technology",
  "Manufacturing and Industrial Technology",
  "Resource Based Technology",
  "Transport and Logistics Technology",
  "Material Technology",
  "Maritime Technology",
  "Atmospheric Science and Environment Technology",
  "Agriculture and Food Technology",
  "Marine Technology",
  "Biotechnology",
  "Nuclear and Radiological Technology",
  "Aerospace and Aviation Technology",
  "Art Design and Creative Media Technology",
  "Medical and Healthcare Technology",
  "Cyber Security Technology",
  "Telecommunication and Broadcasting Technology",
  "Oil and Gas Technology",
  "Nanotechnology",
  "Automotive Technology"
];

export const FEES = {
  GRADUATE_LIFETIME: 50,
  QUALIFIED_LIFETIME: 30,
  ASSESSMENT: 600,
  UPGRADE_APPLICATION: 350,
  ANNUAL_RENEWAL: 200,
};

export const INITIAL_QUESTIONS: Question[] = [
  // Professional Certificate (Ts.)
  { id: "ts-1", text: "What is the primary function of MBOT according to Act 768?", options: ["Regulate technology and technical professions", "Promote tourism", "Regulate banks", "Manage public transport"], correctAnswer: 0, category: "Act 768", difficulty: "Easy", target: AssessmentType.PROFESSIONAL_TECHNOLOGIST },
  { id: "ts-2", text: "Which of the following is an ethical breach for a Professional Certificate?", options: ["Participating in CPD", "Reporting safety violations", "Accepting bribes for project approvals", "Mentoring graduate technologists"], correctAnswer: 2, category: "Ethics", difficulty: "Medium", target: AssessmentType.PROFESSIONAL_TECHNOLOGIST },
  { id: "ts-3", text: "Which technology is a pillar of IR 4.0?", options: ["Steam engines", "Big Data Analytics", "Typewriters", "Analog radio"], correctAnswer: 1, category: "Industry 4.0", difficulty: "Medium", target: AssessmentType.PROFESSIONAL_TECHNOLOGIST },
  { id: "ts-4", text: "How many CPD hours are typically required for Professional Certificate renewal?", options: ["10 hours", "20 hours", "30 hours", "50 hours"], correctAnswer: 2, category: "General", difficulty: "Medium", target: AssessmentType.PROFESSIONAL_TECHNOLOGIST },
  { id: "ts-5", text: 'What is the penalty for using "Ts." title without registration?', options: ["RM 500 fine", "A warning letter", "Fine up to RM 50,000 or imprisonment", "No penalty"], correctAnswer: 2, category: "Act 768", difficulty: "Hard", target: AssessmentType.PROFESSIONAL_TECHNOLOGIST },
  { id: "ts-6", text: "In which year was the Malaysia Board of Technologists (MBOT) officially established?", options: ["2010", "2015", "2020", "2005"], correctAnswer: 1, category: "General", difficulty: "Easy", target: AssessmentType.PROFESSIONAL_TECHNOLOGIST },
  { id: "ts-7", text: "Which of these is NOT one of the 24 technology fields recognized by MBOT?", options: ["Information & Computing Technology", "Automotive Technology", "Culinary Arts Technology", "Biotechnology"], correctAnswer: 2, category: "General", difficulty: "Medium", target: AssessmentType.PROFESSIONAL_TECHNOLOGIST },
  { id: "ts-8", text: "What is the primary requirement to upgrade from Graduate Technologist to Professional Certificate?", options: ["Passing a written exam only", "3 years of relevant working experience", "Paying a lifetime fee only", "10 years of experience"], correctAnswer: 1, category: "Act 768", difficulty: "Easy", target: AssessmentType.PROFESSIONAL_TECHNOLOGIST },
  { id: "ts-9", text: "Which document governs the professional conduct of technologists in Malaysia?", options: ["The Federal Constitution", "MBOT Code of Ethics", "The Employment Act", "The Societies Act"], correctAnswer: 1, category: "Ethics", difficulty: "Easy", target: AssessmentType.PROFESSIONAL_TECHNOLOGIST },
  { id: "ts-10", text: 'The "Cybersecurity" technology field falls under which category?', options: ["Art Design", "Building & Construction", "Information & Computing Technology", "Manufacturing"], correctAnswer: 2, category: "Industry 4.0", difficulty: "Easy", target: AssessmentType.PROFESSIONAL_TECHNOLOGIST },

  // Certified Technician (Tc.)
  { id: "tc-1", text: "What is the primary duty under Act 768 for designers/manufacturers/suppliers?", options: ["Ensure cost-effectiveness", "Ensure product is safe when properly used", "Provide warranty", "Ensure market competitiveness"], correctAnswer: 1, category: "Act 768", difficulty: "Medium", target: AssessmentType.CERTIFIED_TECHNICIAN },
  { id: "tc-2", text: "Core enabler of real-time data exchange in Industry 4.0?", options: ["Manual systems", "Standalone PLC", "Cyber-Physical Systems (CPS)", "Analog control"], correctAnswer: 2, category: "Industry 4.0", difficulty: "Hard", target: AssessmentType.CERTIFIED_TECHNICIAN },
  { id: "tc-3", text: "What should a technician do if a safety issue is found?", options: ["Ignore it", "Wait for approval", "Report and fix immediately", "Fix later"], correctAnswer: 2, category: "Ethics", difficulty: "Medium", target: AssessmentType.CERTIFIED_TECHNICIAN },
  { id: "tc-4", text: "Definition of a competent person?", options: ["Driver license holder", "Any degree holder", "Has training, experience, knowledge, ability", "Political recommendation"], correctAnswer: 2, category: "Act 768", difficulty: "Medium", target: AssessmentType.CERTIFIED_TECHNICIAN },
  { id: "tc-5", text: "Predictive maintenance relies on?", options: ["Fixed schedule", "Breakdown only", "Sensor data & analytics", "Operator guess"], correctAnswer: 2, category: "Industry 4.0", difficulty: "Hard", target: AssessmentType.CERTIFIED_TECHNICIAN },
  { id: "tc-6", text: "Motor humming but not starting likely due to?", options: ["Overvoltage", "Single phasing", "Underload", "Reverse rotation"], correctAnswer: 1, category: "General", difficulty: "Medium", target: AssessmentType.CERTIFIED_TECHNICIAN },
  { id: "tc-7", text: "Supplier offers gift before recommendation. What to do?", options: ["Accept and recommend", "Accept but choose others", "Refuse / Declare gift", "Accept secretly"], correctAnswer: 2, category: "Ethics", difficulty: "Medium", target: AssessmentType.CERTIFIED_TECHNICIAN },
  { id: "tc-8", text: "Most effective hazard control?", options: ["PPE", "Administrative", "Engineering", "Elimination"], correctAnswer: 3, category: "OSHA", difficulty: "Hard", target: AssessmentType.CERTIFIED_TECHNICIAN },
  { id: "tc-9", text: "What is a Digital Twin?", options: ["Backup server", "Duplicate machine", "Virtual real-time replica", "3D model"], correctAnswer: 2, category: "Industry 4.0", difficulty: "Medium", target: AssessmentType.CERTIFIED_TECHNICIAN },
  { id: "tc-10", text: "Scope of Qualified Technician?", options: ["Certify all installations", "Perform tasks within defined scope", "Override safety", "Approve building plans"], correctAnswer: 1, category: "General", difficulty: "Medium", target: AssessmentType.CERTIFIED_TECHNICIAN }
];
