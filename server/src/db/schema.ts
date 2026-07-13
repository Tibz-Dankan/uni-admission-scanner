import {
  pgTable,
  text,
  timestamp,
  integer,
  boolean,
  jsonb,
  index,
  uniqueIndex,
  foreignKey,
  pgEnum,
} from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";

// Enums map 1:1 onto the Postgres enum types already created by the
// (kept-for-reference) Prisma migrations in server/prisma/migrations —
// names/values must stay in sync with the live database, not be treated
// as free to rename.
export const sexEnum = pgEnum("Sex", ["MALE", "FEMALE"]);
export const maritalStatusEnum = pgEnum("MaritalStatus", ["SINGLE", "MARRIED"]);
export const sponsorTypeEnum = pgEnum("SponsorType", ["GOVERNMENT", "PRIVATE"]);
export const livingStatusEnum = pgEnum("LivingStatus", ["LIVING", "DECEASED"]);
export const guardianRelationEnum = pgEnum("GuardianRelation", [
  "FATHER",
  "MOTHER",
  "NEXT_OF_KIN",
]);
export const examinationTypeEnum = pgEnum("ExaminationType", ["UCE", "UACE"]);
export const otherQualificationTypeEnum = pgEnum("OtherQualificationType", [
  "EQUIVALENT",
  "OTHER",
]);
export const admissionStatusEnum = pgEnum("AdmissionStatus", [
  "PENDING_REVIEW",
  "COMPLETED",
  "REJECTED",
]);
export const userRoleEnum = pgEnum("UserRole", [
  "RECORDS_OFFICER",
  "ACADEMIC_REGISTRAR",
]);

const cuid = () => text().$defaultFn(() => createId());
// Prisma's `@updatedAt` has no DB-level default — the app must set it on
// every insert and update, exactly like the old Prisma client did.
const createdAt = () =>
  timestamp({ precision: 3, mode: "date" })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull();
const updatedAt = () => timestamp({ precision: 3, mode: "date" }).notNull();

export const users = pgTable(
  "users",
  {
    id: cuid().primaryKey().notNull(),
    firstName: text().notNull(),
    middleName: text(),
    lastName: text().notNull(),
    email: text().notNull(),
    password: text().notNull(),
    role: userRoleEnum().notNull(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [uniqueIndex("users_email_key").on(table.email)],
);

export const students = pgTable(
  "students",
  {
    id: cuid().primaryKey().notNull(),
    firstName: text(),
    middleName: text(),
    lastName: text(),
    studentNo: text(),
    regNo: text(),
    yearOfStudy: text(),
    sex: sexEnum(),
    dateOfBirth: timestamp({ precision: 3, mode: "date" }),
    nationality: text(),
    nin: text(),
    maritalStatus: maritalStatusEnum(),
    telephone: text(),
    email: text(),
    physicalAddress: text(),
    districtOfOrigin: text(),
    village: text(),
    sponsorType: sponsorTypeEnum(),
    sponsorName: text(),
    sponsorTelephone: text(),
    sponsorEmail: text(),
    sponsorAddress: text(),
    chronicMedicalCondition: text(),
    disability: text(),
    requiredAdjustments: text(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    index("students_firstName_idx").on(table.firstName),
    index("students_middleName_idx").on(table.middleName),
    index("students_lastName_idx").on(table.lastName),
    index("students_studentNo_idx").on(table.studentNo),
    uniqueIndex("students_regNo_key").on(table.regNo),
  ],
);

export const admissions = pgTable(
  "admissions",
  {
    id: cuid().primaryKey().notNull(),
    studentId: text().notNull(),
    semester: text(),
    academicYear: text(),
    programmeName: text(),
    programmeDuration: text(),
    status: admissionStatusEnum().default("PENDING_REVIEW").notNull(),
    studentSigned: boolean(),
    studentSignedDate: timestamp({ precision: 3, mode: "date" }),
    registrarName: text(),
    registrarSigned: boolean(),
    registrarVerifiedDate: timestamp({ precision: 3, mode: "date" }),
    officialStampPresent: boolean(),
    pageCount: integer(),
    rawExtraction: jsonb(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    index("admissions_studentId_idx").on(table.studentId),
    foreignKey({
      columns: [table.studentId],
      foreignColumns: [students.id],
      name: "admissions_studentId_fkey",
    })
      .onUpdate("cascade")
      .onDelete("restrict"),
  ],
);

export const guardians = pgTable(
  "guardians",
  {
    id: cuid().primaryKey().notNull(),
    admissionId: text().notNull(),
    relation: guardianRelationEnum().notNull(),
    firstName: text(),
    middleName: text(),
    lastName: text(),
    telephone: text(),
    email: text(),
    physicalAddress: text(),
    occupation: text(),
    livingStatus: livingStatusEnum(),
  },
  (table) => [
    index("guardians_admissionId_idx").on(table.admissionId),
    foreignKey({
      columns: [table.admissionId],
      foreignColumns: [admissions.id],
      name: "guardians_admissionId_fkey",
    })
      .onUpdate("cascade")
      .onDelete("cascade"),
  ],
);

export const examinationRecords = pgTable(
  "examination_records",
  {
    id: cuid().primaryKey().notNull(),
    admissionId: text().notNull(),
    type: examinationTypeEnum().notNull(),
    yearOfExamination: text(),
    indexNumber: text(),
  },
  (table) => [
    index("examination_records_admissionId_idx").on(table.admissionId),
    foreignKey({
      columns: [table.admissionId],
      foreignColumns: [admissions.id],
      name: "examination_records_admissionId_fkey",
    })
      .onUpdate("cascade")
      .onDelete("cascade"),
  ],
);

export const examinationSubjects = pgTable(
  "examination_subjects",
  {
    id: cuid().primaryKey().notNull(),
    examinationRecordId: text().notNull(),
    position: integer(),
    subject: text(),
    grade: text(),
  },
  (table) => [
    index("examination_subjects_examinationRecordId_idx").on(
      table.examinationRecordId,
    ),
    foreignKey({
      columns: [table.examinationRecordId],
      foreignColumns: [examinationRecords.id],
      name: "examination_subjects_examinationRecordId_fkey",
    })
      .onUpdate("cascade")
      .onDelete("cascade"),
  ],
);

export const otherQualifications = pgTable(
  "other_qualifications",
  {
    id: cuid().primaryKey().notNull(),
    admissionId: text().notNull(),
    type: otherQualificationTypeEnum().notNull(),
    yearFrom: text(),
    yearTo: text(),
    institutionName: text(),
    qualificationAttained: text(),
    classOfAward: text(),
  },
  (table) => [
    index("other_qualifications_admissionId_idx").on(table.admissionId),
    foreignKey({
      columns: [table.admissionId],
      foreignColumns: [admissions.id],
      name: "other_qualifications_admissionId_fkey",
    })
      .onUpdate("cascade")
      .onDelete("cascade"),
  ],
);

export const registeredCourses = pgTable(
  "registered_courses",
  {
    id: cuid().primaryKey().notNull(),
    admissionId: text().notNull(),
    position: integer(),
    code: text(),
    courseName: text(),
  },
  (table) => [
    index("registered_courses_admissionId_idx").on(table.admissionId),
    foreignKey({
      columns: [table.admissionId],
      foreignColumns: [admissions.id],
      name: "registered_courses_admissionId_fkey",
    })
      .onUpdate("cascade")
      .onDelete("cascade"),
  ],
);

export const studentsRelations = relations(students, ({ many }) => ({
  admissions: many(admissions),
}));

export const admissionsRelations = relations(admissions, ({ one, many }) => ({
  student: one(students, {
    fields: [admissions.studentId],
    references: [students.id],
  }),
  guardians: many(guardians),
  examinationRecords: many(examinationRecords),
  otherQualifications: many(otherQualifications),
  registeredCourses: many(registeredCourses),
}));

export const guardiansRelations = relations(guardians, ({ one }) => ({
  admission: one(admissions, {
    fields: [guardians.admissionId],
    references: [admissions.id],
  }),
}));

export const examinationRecordsRelations = relations(
  examinationRecords,
  ({ one, many }) => ({
    admission: one(admissions, {
      fields: [examinationRecords.admissionId],
      references: [admissions.id],
    }),
    subjects: many(examinationSubjects),
  }),
);

export const examinationSubjectsRelations = relations(
  examinationSubjects,
  ({ one }) => ({
    examinationRecord: one(examinationRecords, {
      fields: [examinationSubjects.examinationRecordId],
      references: [examinationRecords.id],
    }),
  }),
);

export const otherQualificationsRelations = relations(
  otherQualifications,
  ({ one }) => ({
    admission: one(admissions, {
      fields: [otherQualifications.admissionId],
      references: [admissions.id],
    }),
  }),
);

export const registeredCoursesRelations = relations(
  registeredCourses,
  ({ one }) => ({
    admission: one(admissions, {
      fields: [registeredCourses.admissionId],
      references: [admissions.id],
    }),
  }),
);

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Student = typeof students.$inferSelect;
export type NewStudent = typeof students.$inferInsert;
export type Admission = typeof admissions.$inferSelect;
export type NewAdmission = typeof admissions.$inferInsert;
export type Guardian = typeof guardians.$inferSelect;
export type NewGuardian = typeof guardians.$inferInsert;
export type ExaminationRecord = typeof examinationRecords.$inferSelect;
export type NewExaminationRecord = typeof examinationRecords.$inferInsert;
export type ExaminationSubject = typeof examinationSubjects.$inferSelect;
export type NewExaminationSubject = typeof examinationSubjects.$inferInsert;
export type OtherQualification = typeof otherQualifications.$inferSelect;
export type NewOtherQualification = typeof otherQualifications.$inferInsert;
export type RegisteredCourse = typeof registeredCourses.$inferSelect;
export type NewRegisteredCourse = typeof registeredCourses.$inferInsert;

export type AdmissionStatus = (typeof admissionStatusEnum.enumValues)[number];
export type UserRole = (typeof userRoleEnum.enumValues)[number];
export type Sex = (typeof sexEnum.enumValues)[number];
export type MaritalStatus = (typeof maritalStatusEnum.enumValues)[number];
export type SponsorType = (typeof sponsorTypeEnum.enumValues)[number];
export type LivingStatus = (typeof livingStatusEnum.enumValues)[number];
export type GuardianRelation = (typeof guardianRelationEnum.enumValues)[number];
export type ExaminationType = (typeof examinationTypeEnum.enumValues)[number];
export type OtherQualificationType =
  (typeof otherQualificationTypeEnum.enumValues)[number];

// DRIZZLE COMMANDS
// npm db:generate  // Generate db migration
// npm db:migrate  // Apply the migration
// npm db:push  // Push changes to the database
