import { Applicant, ApplicantStatus, Qualification, CPDStatus, CPDCategory, CPDRecord } from '../types';
import { MBOT_FIELDS } from '../constants';

const names = [
  "Ahmad Zaki Bin Rahim", "Siti Nurhaliza Binti Ahmad", "Wong Wei Keong", "Letchumy A/P Subramaniam",
  "Muhammad Ali Bin Abu Bakar", "Chong Mei Ling", "Tan Ah Kow", "Ramli Bin Ibrahim",
  "Nurul Izzah Binti Anwar", "David Arumugam", "Siti Saleha", "Aaron Aziz",
  "Lee Chong Wei", "Nicol David", "Pandelela Rinong", "Azizulhasni Awang",
  "Khairul Hafiz Jantan", "Shalin Zulkifli", "P. Kassim", "Saloma",
  "P. Ramlee", "Sudirman Arshad", "M. Nasir", "Sheila Majid",
  "Ziana Zain", "Amy Search", "Awie", "Ella",
  "Siti Sarah", "Shuib Sepahtu", "Johan", "Zizan Razak",
  "Nabil Ahmad", "Neelofa", "Fattah Amin", "Fazura",
  "Maya Karin", "Bront Palarae", "Shaheizy Sam", "Zul Ariffin",
  "Remy Ishak", "Mira Filzah", "Janna Nick", "Ayda Jebat",
  "Izzue Islam", "Saharul Ridzuan", "Amar Baharin", "Amyra Rosli"
];

function getRandomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateRandomGT(year: number): string {
  const randomNum = Math.floor(10000 + Math.random() * 90000);
  return `GT/${year}/${randomNum}`;
}

function generateRandomPTech(year: number): string {
  const randomNum = Math.floor(10000 + Math.random() * 90000);
  return `Ts./${year}/${randomNum}`;
}

const cpdActivities = [
  { name: "Advanced Edge Computing Workshop", category: CPDCategory.WORKSHOP, provider: "Intel Malaysia" },
  { name: "National Green Tech Symposium 2025", category: CPDCategory.SEMINAR, provider: "MGTC" },
  { name: "Cybersecurity Fundamentals Certification", category: CPDCategory.CERTIFICATION, provider: "CompTIA" },
  { name: "Leadership for Technologists", category: CPDCategory.SOFT_SKILLS, provider: "MBOT Academy" },
  { name: "Structural Integrity in Modern Building", category: CPDCategory.TECHNICAL, provider: "IEM" },
  { name: "AI Ethics and Governance", category: CPDCategory.TECHNICAL, provider: "MDEC" },
  { name: "Agile Project Management for Engineers", category: CPDCategory.SOFT_SKILLS, provider: "Scrum Alliance" },
  { name: "Renewable Energy Policy Update", category: CPDCategory.SEMINAR, provider: "SEDA Malaysia" }
];

function generateDummyCPD(count: number): CPDRecord[] {
  const records: CPDRecord[] = [];
  const now = new Date();
  
  for (let i = 0; i < count; i++) {
    const activity = getRandomItem(cpdActivities);
    const monthsAgo = Math.floor(Math.random() * 6);
    const date = new Date(now.getFullYear(), now.getMonth() - monthsAgo, Math.floor(Math.random() * 28) + 1);
    
    records.push({
      id: Math.random().toString(36).substr(2, 9),
      activityName: activity.name,
      category: activity.category,
      provider: activity.provider,
      date: date.toISOString().split('T')[0],
      hours: Math.floor(Math.random() * 8) + 2,
      status: getRandomItem([CPDStatus.PENDING, CPDStatus.APPROVED, CPDStatus.REJECTED]),
      certificateUrl: 'data:application/pdf;base64,JVBERi0xLjcKMSAwIG9iagogIDw8L1R5cGUvUGFnZXMvQ291bnQgMS9LaWRzWzMgMCBSXT4+CmVuZG9iagoyIDAgb2JqCiAgPDwvVHlwZS9DYXRhbG9nL1BhZ2VzIDEgMCBSPj4KZW5kb2JqCjMgMCBvYmoKICA8PC9UeXBlL1BhZ2UvUGFyZW50IDEgMCBSL01lZGlhQm94WzAgMCA1OTUgODQyXS9SZXNvdXJjZXM8PC9Gb250PDwvRjEgNCAwIFI+Pj4+L0NvbnRlbnRzIDUgMCBSPj4KZW5kb2JqCjQgMCBvYmoKICA8PC9UeXBlL0ZvbnQvU3VidHlwZS9UeXBlMS9CYXNlRm9udC9IZWx2ZXRpY2E+PgplbmRvYmoKNSAwIG9iagogIDw8L0xlbmd0aCA0ND4+c3RyZWFtCkJUCi9GMSAxMiBUZgoxIDIwIFRkCihIZWxsbyBXb3JsZCkgVGoKRVQKZW5kc3RyZWFtCmVuZG9iagp4cmVmCjAgNgowMDAwMDAwMDAwIDY1NTM1IGYgCjAwMDAwMDAwMDkgMDAwMDAgbiAKMDAwMDAwMDA1NiAwMDAwMCBuIAowMDAwMDAwMTAxIDAwMDAwIG4gCjAwMDAwMDAyMDkgMDAwMDAgbiAKMDAwMDAwMDI3NSAwMDAwMCBuIAp0cmFpbGVyCjw8L1NpemUgNi9Sb290IDIgMCBSPj4Kc3RhcnR4cmVmCjM2OQolJUVPRgo=',
      fileName: 'Certificate_Artifact.pdf'
    });
  }
  return records;
}

export function generateSingleDummyApplicant(): Applicant {
  const year = 2023 - Math.floor(Math.random() * 5);
  const regDate = new Date(year, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28)).toISOString();
  const status = getRandomItem(Object.values(ApplicantStatus));
  
  const applicant: Applicant = {
    id: Math.random().toString(36).substr(2, 9),
    fullName: getRandomItem(names),
    icPassport: `${Math.floor(Math.random() * 9)}00000-00-${Math.floor(Math.random() * 9)}000`,
    email: `user${Math.random().toString(36).substr(2, 5)}@example.com`,
    phone: `+601${Math.floor(Math.random() * 10)}-${Math.floor(Math.random() * 9000000)}`,
    qualification: getRandomItem(Object.values(Qualification)),
    field: getRandomItem(MBOT_FIELDS),
    yearsOfExperience: 3 + Math.floor(Math.random() * 15),
    status: status as ApplicantStatus,
    registrationDate: regDate,
    gtNumber: generateRandomGT(year),
    cpdRecords: status === ApplicantStatus.PROFESSIONAL || status === ApplicantStatus.CERTIFIED ? generateDummyCPD(3) : [],
    assessments: [],
    notifications: [],
    workflowLog: [],
    feesPaid: {
      lifetime: true,
      assessment: status !== ApplicantStatus.GRADUATE,
      application: status === ApplicantStatus.PROFESSIONAL
    }
  };

  if (status === ApplicantStatus.PROFESSIONAL) {
    applicant.pTechNumber = generateRandomPTech(year + 1);
    applicant.renewalDate = new Date(new Date().getFullYear() + 1, 11, 31).toISOString();
  }

  if (status === ApplicantStatus.ASSESSMENT_PASSED || status === ApplicantStatus.CERTIFICATE_READY || status === ApplicantStatus.PROFESSIONAL) {
    applicant.assessments = [{
      date: new Date().toISOString(),
      score: 75 + Math.floor(Math.random() * 20),
      passed: true
    }];
  }

  return applicant;
}

export function generateDummyApplicants(): Applicant[] {
  const specialApplicants: Applicant[] = [
    {
      id: 'prof-001',
      fullName: 'Muhammad Firdaus Bin Abdul Razak',
      email: 'firdaus.razak@gmail.com',
      icPassport: '850101-14-5543',
      phone: '+6012-3456789',
      qualification: Qualification.MASTER,
      field: 'Information and Computing Technology',
      yearsOfExperience: 12,
      status: ApplicantStatus.CERTIFIED,
      registryAction: 'Professional Certificate',
      registrationDate: new Date().toISOString(),
      cpdRecords: [],
      assessments: [{ date: new Date().toISOString(), score: 88, passed: true }],
      feesPaid: { application: true, assessment: true, certification: true, lifetime: true },
      notifications: [],
      workflowLog: []
    },
    {
      id: 'prof-002',
      fullName: 'Tan Siew Lin',
      email: 'tan.siewlin88@gmail.com',
      icPassport: '880520-08-5122',
      phone: '+6017-8899123',
      qualification: Qualification.BACHELOR,
      field: 'Building and Construction Technology',
      yearsOfExperience: 5,
      status: ApplicantStatus.ASSESSMENT_FAILED,
      registryAction: 'None',
      registrationDate: new Date().toISOString(),
      cpdRecords: [],
      assessments: [{ date: new Date().toISOString(), score: 42, passed: false }],
      feesPaid: { application: true, assessment: true, lifetime: true },
      notifications: [],
      workflowLog: []
    },
    {
      id: 'prof-003',
      fullName: 'Kavitha A/P Ravindran',
      email: 'kavitha.ravi.mbot@gmail.com',
      icPassport: '801112-10-6678',
      phone: '+6019-2233445',
      qualification: Qualification.PHD,
      field: 'Green Technology',
      yearsOfExperience: 15,
      status: ApplicantStatus.UNDER_REVIEW,
      registryAction: 'Senior Analyst',
      registrationDate: new Date().toISOString(),
      cpdRecords: [],
      assessments: [],
      feesPaid: { application: true, lifetime: true },
      notifications: [],
      workflowLog: []
    },
    {
      id: 'prof-004',
      fullName: 'Ahmad Syukri Bin Ismail',
      email: 'syukri.ismail.v3@gmail.com',
      icPassport: '920315-03-5111',
      phone: '+6011-5544332',
      qualification: Qualification.BACHELOR,
      field: 'Electrical and Electronic Technology',
      yearsOfExperience: 4,
      status: ApplicantStatus.ASSESSMENT_FAILED,
      registryAction: 'None',
      registrationDate: new Date().toISOString(),
      cpdRecords: [],
      assessments: [{ date: new Date().toISOString(), score: 38, passed: false }],
      feesPaid: { application: true, assessment: true, lifetime: true },
      notifications: [],
      workflowLog: []
    },
    {
      id: 'prof-005',
      fullName: 'Nurul Aini Binti Mohd Yusuf',
      email: 'aini.yusuf.registry@gmail.com',
      icPassport: '870808-01-5224',
      phone: '+6013-9988776',
      qualification: Qualification.MASTER,
      field: 'Biotechnology',
      yearsOfExperience: 10,
      status: ApplicantStatus.CERTIFIED,
      registryAction: 'Professional Certificate',
      registrationDate: new Date().toISOString(),
      cpdRecords: [],
      assessments: [{ date: new Date().toISOString(), score: 92, passed: true }],
      feesPaid: { application: true, assessment: true, certification: true, lifetime: true },
      notifications: [],
      workflowLog: []
    },
    {
      id: 'prof-006',
      fullName: 'Lim Wei Kang',
      email: 'weikang.lim.eng@gmail.com',
      icPassport: '901230-05-6119',
      phone: '+6016-4455667',
      qualification: Qualification.BACHELOR,
      field: 'Manufacturing and Industrial Technology',
      yearsOfExperience: 7,
      status: ApplicantStatus.REGISTERED,
      registryAction: 'None',
      registrationDate: new Date().toISOString(),
      cpdRecords: [],
      assessments: [],
      feesPaid: { application: true, lifetime: true },
      notifications: [],
      workflowLog: []
    },
    {
      id: 'queue-001',
      fullName: 'Mohd Ridzuan Bin Hashim',
      email: 'ridzuan.hashim@provider.com',
      icPassport: '881010-14-5221',
      phone: '+6011-22334455',
      qualification: Qualification.BACHELOR,
      field: 'Information and Computing Technology',
      yearsOfExperience: 6,
      status: ApplicantStatus.CERTIFICATE_READY,
      registryAction: 'Professional Certificate',
      registrationDate: new Date(Date.now() - 86400000 * 2).toISOString(),
      cpdRecords: [],
      assessments: [{ date: new Date(Date.now() - 86400000 * 1).toISOString(), score: 88, passed: true }],
      feesPaid: { application: true, assessment: true, certification: true, lifetime: true },
      notifications: [],
      workflowLog: [
        { stage: 'Payment Verified', date: new Date(Date.now() - 86400000 * 1).toISOString(), actor: 'Finance Dept', comments: 'Certification fee of RM 300 confirmed.' }
      ]
    },
    {
      id: 'queue-002',
      fullName: 'Sarah Jane Abdullah',
      email: 'sarah.jane@tech.my',
      icPassport: '920101-10-5332',
      phone: '+6012-99887766',
      qualification: Qualification.MASTER,
      field: 'Biotechnology',
      yearsOfExperience: 8,
      status: ApplicantStatus.CERTIFICATE_READY,
      registryAction: 'Professional Certificate',
      registrationDate: new Date(Date.now() - 86400000 * 5).toISOString(),
      cpdRecords: [],
      assessments: [{ date: new Date(Date.now() - 86400000 * 1).toISOString(), score: 85, passed: true }],
      feesPaid: { application: true, assessment: true, certification: true, lifetime: true },
      notifications: [],
      workflowLog: [
        { stage: 'Payment Verified', date: new Date(Date.now() - 86400000 * 1).toISOString(), actor: 'Finance Dept', comments: 'Certification fee RM 300 received.' }
      ]
    },
    {
      id: 'queue-003',
      fullName: 'Tan Boon Hock',
      email: 'boonhock.tan@industry.com',
      icPassport: '850707-07-5119',
      phone: '+6017-11223344',
      qualification: Qualification.PHD,
      field: 'Mechanical and Manufacturing Technology',
      yearsOfExperience: 15,
      status: ApplicantStatus.CERTIFICATE_READY,
      registryAction: 'Professional Certificate',
      registrationDate: new Date(Date.now() - 86400000 * 10).toISOString(),
      cpdRecords: [],
      assessments: [{ date: new Date(Date.now() - 86400000 * 4).toISOString(), score: 92, passed: true }],
      feesPaid: { application: true, assessment: true, certification: true, lifetime: true },
      notifications: [],
      workflowLog: [
          { stage: 'Payment Verified', date: new Date(Date.now() - 86400000 * 2).toISOString(), actor: 'Finance Dept', comments: 'Certification fee of RM 300 confirmed.' }
      ]
    },
    {
      id: 'queue-004',
      fullName: 'Aisha Binti Karim',
      email: 'aisha.karim@mbot-verify.my',
      icPassport: '900101-01-1122',
      phone: '+6011-33445566',
      qualification: Qualification.BACHELOR,
      field: 'Green Technology',
      yearsOfExperience: 7,
      status: ApplicantStatus.PROFESSIONAL_PENDING,
      registryAction: 'Professional Certificate',
      registrationDate: new Date(Date.now() - 86400000 * 3).toISOString(),
      cpdRecords: [],
      assessments: [],
      feesPaid: { application: true, assessment: true, lifetime: true },
      notifications: [],
      workflowLog: [
        { stage: 'Payment Verified', date: new Date(Date.now() - 86400000 * 2).toISOString(), actor: 'Registry Admin', comments: 'Processing fee received. Awaiting assessment validation.' }
      ]
    },
    {
      id: 'queue-005',
      fullName: 'Lim Keng Huat',
      email: 'keng.huat@tech-institute.edu.my',
      icPassport: '820505-02-2233',
      phone: '+6012-44556677',
      qualification: Qualification.MASTER,
      field: 'Information and Computing Technology',
      yearsOfExperience: 11,
      status: ApplicantStatus.ASSESSMENT_PASSED,
      registryAction: 'Professional Certificate',
      registrationDate: new Date(Date.now() - 86400000 * 8).toISOString(),
      cpdRecords: [],
      assessments: [{ date: new Date(Date.now() - 86400000 * 1).toISOString(), score: 94, passed: true }],
      feesPaid: { application: true, assessment: true, lifetime: true },
      notifications: [],
      workflowLog: [
        { stage: 'Assessment Passed', date: new Date(Date.now() - 86400000 * 1).toISOString(), actor: 'Board Examiner', comments: 'Candidate demonstrated exceptional core competencies.' }
      ]
    },
    {
      id: 'queue-006',
      fullName: 'Suresh Kumar A/L Mani',
      email: 'suresh.kumar@mbot-auto.my',
      icPassport: '881212-08-3344',
      phone: '+6013-55667788',
      qualification: Qualification.BACHELOR,
      field: 'Automotive Technology',
      yearsOfExperience: 9,
      status: ApplicantStatus.PROFESSIONAL_PENDING,
      registryAction: 'Professional Certificate',
      registrationDate: new Date(Date.now() - 86400000 * 1).toISOString(),
      cpdRecords: [],
      assessments: [],
      feesPaid: { application: true, assessment: true, lifetime: true },
      notifications: [],
      workflowLog: []
    },
    {
      id: 'queue-007',
      fullName: 'Nurul Huda Binti Hassan',
      email: 'huda.hassan@agro-tech.com.my',
      icPassport: '950606-03-4455',
      phone: '+6014-66778899',
      qualification: Qualification.BACHELOR,
      field: 'Agro-based Technology',
      yearsOfExperience: 5,
      status: ApplicantStatus.CERTIFICATE_READY,
      registryAction: 'Professional Certificate',
      registrationDate: new Date(Date.now() - 86400000 * 12).toISOString(),
      cpdRecords: [],
      assessments: [{ date: new Date(Date.now() - 86400000 * 3).toISOString(), score: 81, passed: true }],
      feesPaid: { application: true, assessment: true, certification: true, lifetime: true },
      notifications: [],
      workflowLog: [
        { stage: 'Payment Verified', date: new Date(Date.now() - 86400000 * 1).toISOString(), actor: 'Finance Dept', comments: 'Certification fee RM 300 confirmed.' }
      ]
    },
    {
      id: 'queue-008',
      fullName: 'David Teoh',
      email: 'david.teoh@mbot-const.my',
      icPassport: '840303-14-5566',
      phone: '+6019-77889911',
      qualification: Qualification.PHD,
      field: 'Building and Construction Technology',
      yearsOfExperience: 18,
      status: ApplicantStatus.ASSESSMENT_PASSED,
      registryAction: 'Professional Certificate',
      registrationDate: new Date(Date.now() - 86400000 * 15).toISOString(),
      cpdRecords: [],
      assessments: [{ date: new Date(Date.now() - 86400000 * 2).toISOString(), score: 90, passed: true }],
      feesPaid: { application: true, assessment: true, lifetime: true },
      notifications: [],
      workflowLog: [
        { stage: 'Assessment Passed', date: new Date(Date.now() - 86400000 * 2).toISOString(), actor: 'Board Examiner', comments: 'Strategic leadership experience recognized.' }
      ]
    },
    {
      id: 'queue-009',
      fullName: 'Siti Aminah Binti Yusof',
      email: 'aminah.yusof@mbot-verify.my',
      icPassport: '951212-01-5566',
      phone: '+6011-88992233',
      qualification: Qualification.BACHELOR,
      field: 'Biotechnology',
      yearsOfExperience: 4,
      status: ApplicantStatus.PROFESSIONAL_PENDING,
      registryAction: 'Professional Certificate',
      registrationDate: new Date(Date.now() - 86400000 * 1).toISOString(),
      cpdRecords: [],
      assessments: [],
      feesPaid: { application: true, assessment: true, lifetime: true },
      notifications: [],
      workflowLog: []
    },
    {
      id: 'queue-010',
      fullName: 'Jason Low',
      email: 'jason.low@tech-industry.com',
      icPassport: '900505-14-6677',
      phone: '+6012-77889900',
      qualification: Qualification.MASTER,
      field: 'Manufacturing and Industrial Technology',
      yearsOfExperience: 9,
      status: ApplicantStatus.ASSESSMENT_PASSED,
      registryAction: 'Professional Certificate',
      registrationDate: new Date(Date.now() - 86400000 * 4).toISOString(),
      cpdRecords: [],
      assessments: [{ date: new Date(Date.now() - 86400000 * 2).toISOString(), score: 82, passed: true }],
      feesPaid: { application: true, assessment: true, lifetime: true },
      notifications: [],
      workflowLog: [
        { stage: 'Assessment Passed', date: new Date(Date.now() - 86400000 * 2).toISOString(), actor: 'Board Examiner', comments: 'Strong technical grasp of industrial safety.' }
      ]
    },
    {
      id: 'queue-011',
      fullName: 'Ranjit Singh',
      email: 'ranjit.singh@const-corp.my',
      icPassport: '850808-10-7788',
      phone: '+6013-66778899',
      qualification: Qualification.BACHELOR,
      field: 'Building and Construction Technology',
      yearsOfExperience: 12,
      status: ApplicantStatus.CERTIFICATE_READY,
      registryAction: 'Professional Certificate',
      registrationDate: new Date(Date.now() - 86400000 * 7).toISOString(),
      cpdRecords: [],
      assessments: [{ date: new Date(Date.now() - 86400000 * 3).toISOString(), score: 89, passed: true }],
      feesPaid: { application: true, assessment: true, certification: true, lifetime: true },
      notifications: [],
      workflowLog: [
        { stage: 'Payment Verified', date: new Date(Date.now() - 86400000 * 1).toISOString(), actor: 'Finance Dept', comments: 'Upgrade fee confirmed.' }
      ]
    },
    {
      id: 'queue-012',
      fullName: 'Zul Azri Bin Mokhtar',
      email: 'zul.azri@cyber-sec.my',
      icPassport: '930101-03-8899',
      phone: '+6011-55667788',
      qualification: Qualification.BACHELOR,
      field: 'Cyber Security Technology',
      yearsOfExperience: 6,
      status: ApplicantStatus.PROFESSIONAL_PENDING,
      registryAction: 'Professional Certificate',
      registrationDate: new Date(Date.now() - 86400000 * 2).toISOString(),
      cpdRecords: [],
      assessments: [],
      feesPaid: { application: true, assessment: true, lifetime: true },
      notifications: [],
      workflowLog: []
    },
    {
      id: 'queue-013',
      fullName: 'Mei Ling Tan',
      email: 'meiling.tan@green-energy.my',
      icPassport: '910707-14-9900',
      phone: '+6019-44556677',
      qualification: Qualification.PHD,
      field: 'Green Technology',
      yearsOfExperience: 10,
      status: ApplicantStatus.ASSESSMENT_PASSED,
      registryAction: 'Professional Certificate',
      registrationDate: new Date(Date.now() - 86400000 * 5).toISOString(),
      cpdRecords: [],
      assessments: [{ date: new Date(Date.now() - 86400000 * 1).toISOString(), score: 95, passed: true }],
      feesPaid: { application: true, assessment: true, lifetime: true },
      notifications: [],
      workflowLog: [
        { stage: 'Assessment Passed', date: new Date(Date.now() - 86400000 * 1).toISOString(), actor: 'Board Examiner', comments: 'Excellent research contributions cited.' }
      ]
    }
  ];

  const applicants: Applicant[] = [...specialApplicants];
  const statuses = Object.values(ApplicantStatus);
  
  let nameIndex = 0;
  
  statuses.forEach(status => {
    for (let i = 0; i < 8; i++) {
      const year = 2023 - Math.floor(Math.random() * 5);
      const regDate = new Date(year, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28)).toISOString();
      
      const applicant: Applicant = {
        id: Math.random().toString(36).substr(2, 9),
        fullName: names[nameIndex % names.length],
        icPassport: `${Math.floor(Math.random() * 9)}00000-00-${Math.floor(Math.random() * 9)}000`,
        email: `user${Math.random().toString(36).substr(2, 5)}@example.com`,
        phone: `+601${Math.floor(Math.random() * 10)}-${Math.floor(Math.random() * 9000000)}`,
        qualification: getRandomItem(Object.values(Qualification)),
        field: getRandomItem(MBOT_FIELDS),
        yearsOfExperience: 3 + Math.floor(Math.random() * 15),
        status: status as ApplicantStatus,
        registrationDate: regDate,
        gtNumber: generateRandomGT(year),
        cpdRecords: status === ApplicantStatus.PROFESSIONAL || status === ApplicantStatus.CERTIFIED ? generateDummyCPD(3) : [],
        assessments: [],
        notifications: [],
        workflowLog: [],
        feesPaid: {
          lifetime: true,
          assessment: status !== ApplicantStatus.GRADUATE,
          application: status === ApplicantStatus.PROFESSIONAL
        }
      };

      if (status === ApplicantStatus.PROFESSIONAL) {
        applicant.pTechNumber = generateRandomPTech(year + 1);
        applicant.renewalDate = new Date(new Date().getFullYear() + 1, 11, 31).toISOString();
      }

      if (status === ApplicantStatus.ASSESSMENT_PASSED || status === ApplicantStatus.CERTIFICATE_READY || status === ApplicantStatus.PROFESSIONAL) {
        applicant.assessments = [{
          date: new Date().toISOString(),
          score: 75 + Math.floor(Math.random() * 20),
          passed: true
        }];
      }

      applicants.push(applicant);
      nameIndex++;
    }
  });

  return applicants;
}

export const DUMMY_AUDIT_LOGS = [
  { id: '1', action: 'New Registration', user: 'Ahmad Zaki', department: 'Registration', time: '2 mins ago', status: 'Success' },
  { id: '2', action: 'Assessment Approved', user: 'Ts. Wong Wei Keong', department: 'Certification', time: '15 mins ago', status: 'Success' },
  { id: '3', action: 'Renewal Processed', user: 'Nurul Izzah', department: 'Finance', time: '1 hour ago', status: 'Success' },
  { id: '4', action: 'System Update', user: 'System', department: 'IT', time: '2 hours ago', status: 'Success' },
  { id: '5', action: 'Profile Updated', user: 'Letchumy', department: 'Registration', time: '3 hours ago', status: 'Success' },
  { id: '6', action: 'Payment Verified', user: 'Ramli Ibrahim', department: 'Finance', time: '5 hours ago', status: 'Success' },
  { id: '7', action: 'Document Uploaded', user: 'Siti Nurhaliza', department: 'Registration', time: 'Yesterday', status: 'Success' },
  { id: '8', action: 'Login Attempt', user: 'David Arumugam', department: 'Security', time: 'Yesterday', status: 'Failed' },
  { id: '9', action: 'Policy Override', user: 'Senior Admin', department: 'Management', time: '2 days ago', status: 'Warning' },
  { id: '10', action: 'Database Cleanup', user: 'Automated Bot', department: 'IT', time: '3 days ago', status: 'Success' },
];
