export interface ExtractedSubject {
  position?: number | null;
  subject?: string | null;
  grade?: string | null;
}

export interface ExtractedExaminationRecord {
  type: "UCE" | "UACE";
  yearOfExamination?: string | null;
  indexNumber?: string | null;
  subjects: ExtractedSubject[];
}

export interface ExtractedOtherQualification {
  type: "EQUIVALENT" | "OTHER";
  yearFrom?: string | null;
  yearTo?: string | null;
  institutionName?: string | null;
  qualificationAttained?: string | null;
  classOfAward?: string | null;
}

export interface ExtractedRegisteredCourse {
  position?: number | null;
  code?: string | null;
  courseName?: string | null;
}

export interface ExtractedGuardian {
  relation: "FATHER" | "MOTHER" | "NEXT_OF_KIN";
  firstName?: string | null;
  middleName?: string | null;
  lastName?: string | null;
  telephone?: string | null;
  email?: string | null;
  physicalAddress?: string | null;
  occupation?: string | null;
  livingStatus?: "LIVING" | "DECEASED" | null;
}

export interface ExtractedStudent {
  firstName?: string | null;
  middleName?: string | null;
  lastName?: string | null;
  studentNo?: string | null;
  regNo?: string | null;
  yearOfStudy?: string | null;
  sex?: "MALE" | "FEMALE" | null;
  /** ISO 8601 date string, e.g. "2003-10-12" */
  dateOfBirth?: string | null;
  nationality?: string | null;
  nin?: string | null;
  maritalStatus?: "SINGLE" | "MARRIED" | null;
  telephone?: string | null;
  email?: string | null;
  physicalAddress?: string | null;
  districtOfOrigin?: string | null;
  village?: string | null;
  sponsorType?: "GOVERNMENT" | "PRIVATE" | null;
  sponsorName?: string | null;
  sponsorTelephone?: string | null;
  sponsorEmail?: string | null;
  sponsorAddress?: string | null;
  chronicMedicalCondition?: string | null;
  disability?: string | null;
  requiredAdjustments?: string | null;
}

export interface ExtractedAdmissionData {
  semester?: string | null;
  academicYear?: string | null;
  programmeName?: string | null;
  programmeDuration?: string | null;
  studentSigned?: boolean | null;
  /** ISO 8601 date string */
  studentSignedDate?: string | null;
  registrarName?: string | null;
  registrarSigned?: boolean | null;
  /** ISO 8601 date string */
  registrarVerifiedDate?: string | null;
  officialStampPresent?: boolean | null;
  student: ExtractedStudent;
  guardians: ExtractedGuardian[];
  examinationRecords: ExtractedExaminationRecord[];
  otherQualifications: ExtractedOtherQualification[];
  registeredCourses: ExtractedRegisteredCourse[];
}

export type AdmissionSseEventType =
  | "warmup"
  | "heartbeat"
  | "status"
  | "review_ready"
  | "failed";

export interface AdmissionSseEvent {
  type: AdmissionSseEventType;
  message: string;
  data?: unknown;
}

export interface UpdateAdmissionInput {
  semester?: string | null;
  academicYear?: string | null;
  programmeName?: string | null;
  programmeDuration?: string | null;
  studentSigned?: boolean | null;
  studentSignedDate?: string | null;
  registrarName?: string | null;
  registrarSigned?: boolean | null;
  registrarVerifiedDate?: string | null;
  officialStampPresent?: boolean | null;
  student?: Partial<ExtractedStudent>;
  guardians?: ExtractedGuardian[];
  examinationRecords?: ExtractedExaminationRecord[];
  otherQualifications?: ExtractedOtherQualification[];
  registeredCourses?: ExtractedRegisteredCourse[];
}
