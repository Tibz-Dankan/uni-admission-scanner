-- CreateEnum
CREATE TYPE "Sex" AS ENUM ('MALE', 'FEMALE');

-- CreateEnum
CREATE TYPE "MaritalStatus" AS ENUM ('SINGLE', 'MARRIED');

-- CreateEnum
CREATE TYPE "SponsorType" AS ENUM ('GOVERNMENT', 'PRIVATE');

-- CreateEnum
CREATE TYPE "LivingStatus" AS ENUM ('LIVING', 'DECEASED');

-- CreateEnum
CREATE TYPE "GuardianRelation" AS ENUM ('FATHER', 'MOTHER', 'NEXT_OF_KIN');

-- CreateEnum
CREATE TYPE "ExaminationType" AS ENUM ('UCE', 'UACE');

-- CreateEnum
CREATE TYPE "OtherQualificationType" AS ENUM ('EQUIVALENT', 'OTHER');

-- CreateEnum
CREATE TYPE "AdmissionStatus" AS ENUM ('PENDING_REVIEW', 'COMPLETED', 'REJECTED');

-- CreateTable
CREATE TABLE "students" (
    "id" TEXT NOT NULL,
    "firstName" TEXT,
    "middleName" TEXT,
    "lastName" TEXT,
    "studentNo" TEXT,
    "regNo" TEXT,
    "yearOfStudy" TEXT,
    "sex" "Sex",
    "dateOfBirth" TIMESTAMP(3),
    "nationality" TEXT,
    "nin" TEXT,
    "maritalStatus" "MaritalStatus",
    "telephone" TEXT,
    "email" TEXT,
    "physicalAddress" TEXT,
    "districtOfOrigin" TEXT,
    "village" TEXT,
    "sponsorType" "SponsorType",
    "sponsorName" TEXT,
    "sponsorTelephone" TEXT,
    "sponsorEmail" TEXT,
    "sponsorAddress" TEXT,
    "chronicMedicalCondition" TEXT,
    "disability" TEXT,
    "requiredAdjustments" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "students_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admissions" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "semester" TEXT,
    "academicYear" TEXT,
    "programmeName" TEXT,
    "programmeDuration" TEXT,
    "status" "AdmissionStatus" NOT NULL DEFAULT 'PENDING_REVIEW',
    "studentSigned" BOOLEAN,
    "studentSignedDate" TIMESTAMP(3),
    "registrarName" TEXT,
    "registrarSigned" BOOLEAN,
    "registrarVerifiedDate" TIMESTAMP(3),
    "officialStampPresent" BOOLEAN,
    "pageCount" INTEGER,
    "rawExtraction" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "admissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "guardians" (
    "id" TEXT NOT NULL,
    "admissionId" TEXT NOT NULL,
    "relation" "GuardianRelation" NOT NULL,
    "firstName" TEXT,
    "middleName" TEXT,
    "lastName" TEXT,
    "telephone" TEXT,
    "email" TEXT,
    "physicalAddress" TEXT,
    "occupation" TEXT,
    "livingStatus" "LivingStatus",

    CONSTRAINT "guardians_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "examination_records" (
    "id" TEXT NOT NULL,
    "admissionId" TEXT NOT NULL,
    "type" "ExaminationType" NOT NULL,
    "yearOfExamination" TEXT,
    "indexNumber" TEXT,

    CONSTRAINT "examination_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "examination_subjects" (
    "id" TEXT NOT NULL,
    "examinationRecordId" TEXT NOT NULL,
    "position" INTEGER,
    "subject" TEXT,
    "grade" TEXT,

    CONSTRAINT "examination_subjects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "other_qualifications" (
    "id" TEXT NOT NULL,
    "admissionId" TEXT NOT NULL,
    "type" "OtherQualificationType" NOT NULL,
    "yearFrom" TEXT,
    "yearTo" TEXT,
    "institutionName" TEXT,
    "qualificationAttained" TEXT,
    "classOfAward" TEXT,

    CONSTRAINT "other_qualifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "registered_courses" (
    "id" TEXT NOT NULL,
    "admissionId" TEXT NOT NULL,
    "position" INTEGER,
    "code" TEXT,
    "courseName" TEXT,

    CONSTRAINT "registered_courses_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "students_regNo_key" ON "students"("regNo");

-- CreateIndex
CREATE INDEX "admissions_studentId_idx" ON "admissions"("studentId");

-- CreateIndex
CREATE INDEX "guardians_admissionId_idx" ON "guardians"("admissionId");

-- CreateIndex
CREATE INDEX "examination_records_admissionId_idx" ON "examination_records"("admissionId");

-- CreateIndex
CREATE INDEX "examination_subjects_examinationRecordId_idx" ON "examination_subjects"("examinationRecordId");

-- CreateIndex
CREATE INDEX "other_qualifications_admissionId_idx" ON "other_qualifications"("admissionId");

-- CreateIndex
CREATE INDEX "registered_courses_admissionId_idx" ON "registered_courses"("admissionId");

-- AddForeignKey
ALTER TABLE "admissions" ADD CONSTRAINT "admissions_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guardians" ADD CONSTRAINT "guardians_admissionId_fkey" FOREIGN KEY ("admissionId") REFERENCES "admissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "examination_records" ADD CONSTRAINT "examination_records_admissionId_fkey" FOREIGN KEY ("admissionId") REFERENCES "admissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "examination_subjects" ADD CONSTRAINT "examination_subjects_examinationRecordId_fkey" FOREIGN KEY ("examinationRecordId") REFERENCES "examination_records"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "other_qualifications" ADD CONSTRAINT "other_qualifications_admissionId_fkey" FOREIGN KEY ("admissionId") REFERENCES "admissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registered_courses" ADD CONSTRAINT "registered_courses_admissionId_fkey" FOREIGN KEY ("admissionId") REFERENCES "admissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
