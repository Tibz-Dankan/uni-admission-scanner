export type Sex = "MALE" | "FEMALE";
export type MaritalStatus = "SINGLE" | "MARRIED";
export type SponsorType = "GOVERNMENT" | "PRIVATE";
export type LivingStatus = "LIVING" | "DECEASED";
export type GuardianRelation = "FATHER" | "MOTHER" | "NEXT_OF_KIN";
export type ExaminationType = "UCE" | "UACE";
export type OtherQualificationType = "EQUIVALENT" | "OTHER";
export type AdmissionStatus = "PENDING_REVIEW" | "COMPLETED" | "REJECTED";

export interface Student {
  id: string;
  firstName: string | null;
  middleName: string | null;
  lastName: string | null;
  studentNo: string | null;
  regNo: string | null;
  yearOfStudy: string | null;
  sex: Sex | null;
  dateOfBirth: string | null;
  nationality: string | null;
  nin: string | null;
  maritalStatus: MaritalStatus | null;
  telephone: string | null;
  email: string | null;
  physicalAddress: string | null;
  districtOfOrigin: string | null;
  village: string | null;
  sponsorType: SponsorType | null;
  sponsorName: string | null;
  sponsorTelephone: string | null;
  sponsorEmail: string | null;
  sponsorAddress: string | null;
  chronicMedicalCondition: string | null;
  disability: string | null;
  requiredAdjustments: string | null;
}

export interface Guardian {
  id: string;
  relation: GuardianRelation;
  firstName: string | null;
  middleName: string | null;
  lastName: string | null;
  telephone: string | null;
  email: string | null;
  physicalAddress: string | null;
  occupation: string | null;
  livingStatus: LivingStatus | null;
}

export interface ExaminationSubject {
  id?: string;
  position: number | null;
  subject: string | null;
  grade: string | null;
}

export interface ExaminationRecord {
  id: string;
  type: ExaminationType;
  yearOfExamination: string | null;
  indexNumber: string | null;
  subjects: ExaminationSubject[];
}

export interface OtherQualification {
  id: string;
  type: OtherQualificationType;
  yearFrom: string | null;
  yearTo: string | null;
  institutionName: string | null;
  qualificationAttained: string | null;
  classOfAward: string | null;
}

export interface RegisteredCourse {
  id: string;
  position: number | null;
  code: string | null;
  courseName: string | null;
}

export interface Admission {
  id: string;
  studentId: string;
  student: Student;
  semester: string | null;
  academicYear: string | null;
  programmeName: string | null;
  programmeDuration: string | null;
  status: AdmissionStatus;
  studentSigned: boolean | null;
  studentSignedDate: string | null;
  registrarName: string | null;
  registrarSigned: boolean | null;
  registrarVerifiedDate: string | null;
  officialStampPresent: boolean | null;
  pageCount: number | null;
  createdAt: string;
  updatedAt: string;
  guardians: Guardian[];
  examinationRecords: ExaminationRecord[];
  otherQualifications: OtherQualification[];
  registeredCourses: RegisteredCourse[];
}

export type AdmissionSummary = Pick<
  Admission,
  | "id"
  | "studentId"
  | "student"
  | "semester"
  | "academicYear"
  | "programmeName"
  | "programmeDuration"
  | "status"
  | "createdAt"
  | "updatedAt"
>;

export interface AdmissionListResult {
  items: AdmissionSummary[];
  total: number;
  page: number;
  pageSize: number;
}

export type GuardianInput = Omit<Guardian, "id">;
export type ExaminationRecordInput = Omit<ExaminationRecord, "id" | "subjects"> & {
  subjects: Omit<ExaminationSubject, "id">[];
};
export type OtherQualificationInput = Omit<OtherQualification, "id">;
export type RegisteredCourseInput = Omit<RegisteredCourse, "id">;

export type UpdateAdmissionInput = Partial<
  Pick<
    Admission,
    | "semester"
    | "academicYear"
    | "programmeName"
    | "programmeDuration"
    | "studentSigned"
    | "studentSignedDate"
    | "registrarName"
    | "registrarSigned"
    | "registrarVerifiedDate"
    | "officialStampPresent"
  >
> & {
  student?: Partial<Student>;
  guardians?: GuardianInput[];
  examinationRecords?: ExaminationRecordInput[];
  otherQualifications?: OtherQualificationInput[];
  registeredCourses?: RegisteredCourseInput[];
};

export type AdmissionSseEventType = "warmup" | "heartbeat" | "status" | "review_ready" | "failed";

export interface AdmissionSseEvent {
  type: AdmissionSseEventType;
  message: string;
  data?: Admission;
}
