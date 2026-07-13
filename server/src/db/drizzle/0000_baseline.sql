CREATE TYPE "public"."AdmissionStatus" AS ENUM('PENDING_REVIEW', 'COMPLETED', 'REJECTED');--> statement-breakpoint
CREATE TYPE "public"."ExaminationType" AS ENUM('UCE', 'UACE');--> statement-breakpoint
CREATE TYPE "public"."GuardianRelation" AS ENUM('FATHER', 'MOTHER', 'NEXT_OF_KIN');--> statement-breakpoint
CREATE TYPE "public"."LivingStatus" AS ENUM('LIVING', 'DECEASED');--> statement-breakpoint
CREATE TYPE "public"."MaritalStatus" AS ENUM('SINGLE', 'MARRIED');--> statement-breakpoint
CREATE TYPE "public"."OtherQualificationType" AS ENUM('EQUIVALENT', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."Sex" AS ENUM('MALE', 'FEMALE');--> statement-breakpoint
CREATE TYPE "public"."SponsorType" AS ENUM('GOVERNMENT', 'PRIVATE');--> statement-breakpoint
CREATE TYPE "public"."UserRole" AS ENUM('RECORDS_OFFICER', 'ACADEMIC_REGISTRAR');--> statement-breakpoint
CREATE TABLE "admissions" (
	"id" text PRIMARY KEY NOT NULL,
	"studentId" text NOT NULL,
	"semester" text,
	"academicYear" text,
	"programmeName" text,
	"programmeDuration" text,
	"status" "AdmissionStatus" DEFAULT 'PENDING_REVIEW' NOT NULL,
	"studentSigned" boolean,
	"studentSignedDate" timestamp (3),
	"registrarName" text,
	"registrarSigned" boolean,
	"registrarVerifiedDate" timestamp (3),
	"officialStampPresent" boolean,
	"pageCount" integer,
	"rawExtraction" jsonb,
	"createdAt" timestamp (3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp (3) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "examination_records" (
	"id" text PRIMARY KEY NOT NULL,
	"admissionId" text NOT NULL,
	"type" "ExaminationType" NOT NULL,
	"yearOfExamination" text,
	"indexNumber" text
);
--> statement-breakpoint
CREATE TABLE "examination_subjects" (
	"id" text PRIMARY KEY NOT NULL,
	"examinationRecordId" text NOT NULL,
	"position" integer,
	"subject" text,
	"grade" text
);
--> statement-breakpoint
CREATE TABLE "guardians" (
	"id" text PRIMARY KEY NOT NULL,
	"admissionId" text NOT NULL,
	"relation" "GuardianRelation" NOT NULL,
	"firstName" text,
	"middleName" text,
	"lastName" text,
	"telephone" text,
	"email" text,
	"physicalAddress" text,
	"occupation" text,
	"livingStatus" "LivingStatus"
);
--> statement-breakpoint
CREATE TABLE "other_qualifications" (
	"id" text PRIMARY KEY NOT NULL,
	"admissionId" text NOT NULL,
	"type" "OtherQualificationType" NOT NULL,
	"yearFrom" text,
	"yearTo" text,
	"institutionName" text,
	"qualificationAttained" text,
	"classOfAward" text
);
--> statement-breakpoint
CREATE TABLE "registered_courses" (
	"id" text PRIMARY KEY NOT NULL,
	"admissionId" text NOT NULL,
	"position" integer,
	"code" text,
	"courseName" text
);
--> statement-breakpoint
CREATE TABLE "students" (
	"id" text PRIMARY KEY NOT NULL,
	"firstName" text,
	"middleName" text,
	"lastName" text,
	"studentNo" text,
	"regNo" text,
	"yearOfStudy" text,
	"sex" "Sex",
	"dateOfBirth" timestamp (3),
	"nationality" text,
	"nin" text,
	"maritalStatus" "MaritalStatus",
	"telephone" text,
	"email" text,
	"physicalAddress" text,
	"districtOfOrigin" text,
	"village" text,
	"sponsorType" "SponsorType",
	"sponsorName" text,
	"sponsorTelephone" text,
	"sponsorEmail" text,
	"sponsorAddress" text,
	"chronicMedicalCondition" text,
	"disability" text,
	"requiredAdjustments" text,
	"createdAt" timestamp (3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp (3) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"firstName" text NOT NULL,
	"middleName" text,
	"lastName" text NOT NULL,
	"email" text NOT NULL,
	"password" text NOT NULL,
	"role" "UserRole" NOT NULL,
	"createdAt" timestamp (3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp (3) NOT NULL
);
--> statement-breakpoint
ALTER TABLE "admissions" ADD CONSTRAINT "admissions_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "public"."students"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "examination_records" ADD CONSTRAINT "examination_records_admissionId_fkey" FOREIGN KEY ("admissionId") REFERENCES "public"."admissions"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "examination_subjects" ADD CONSTRAINT "examination_subjects_examinationRecordId_fkey" FOREIGN KEY ("examinationRecordId") REFERENCES "public"."examination_records"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "guardians" ADD CONSTRAINT "guardians_admissionId_fkey" FOREIGN KEY ("admissionId") REFERENCES "public"."admissions"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "other_qualifications" ADD CONSTRAINT "other_qualifications_admissionId_fkey" FOREIGN KEY ("admissionId") REFERENCES "public"."admissions"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "registered_courses" ADD CONSTRAINT "registered_courses_admissionId_fkey" FOREIGN KEY ("admissionId") REFERENCES "public"."admissions"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
CREATE INDEX "admissions_studentId_idx" ON "admissions" USING btree ("studentId");--> statement-breakpoint
CREATE INDEX "examination_records_admissionId_idx" ON "examination_records" USING btree ("admissionId");--> statement-breakpoint
CREATE INDEX "examination_subjects_examinationRecordId_idx" ON "examination_subjects" USING btree ("examinationRecordId");--> statement-breakpoint
CREATE INDEX "guardians_admissionId_idx" ON "guardians" USING btree ("admissionId");--> statement-breakpoint
CREATE INDEX "other_qualifications_admissionId_idx" ON "other_qualifications" USING btree ("admissionId");--> statement-breakpoint
CREATE INDEX "registered_courses_admissionId_idx" ON "registered_courses" USING btree ("admissionId");--> statement-breakpoint
CREATE INDEX "students_firstName_idx" ON "students" USING btree ("firstName");--> statement-breakpoint
CREATE INDEX "students_middleName_idx" ON "students" USING btree ("middleName");--> statement-breakpoint
CREATE INDEX "students_lastName_idx" ON "students" USING btree ("lastName");--> statement-breakpoint
CREATE INDEX "students_studentNo_idx" ON "students" USING btree ("studentNo");--> statement-breakpoint
CREATE UNIQUE INDEX "students_regNo_key" ON "students" USING btree ("regNo");--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_key" ON "users" USING btree ("email");