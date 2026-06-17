import crypto from "crypto";
import type { AdmissionStatus, Prisma } from "@prisma/client";
import prisma from "../utils/prisma";
import { sseHub } from "../utils/sseHub";
import { limitPdfPages } from "../utils/pdf";
import { extractAdmissionData, GeminiExtractionError } from "../utils/gemini";
import { AppError } from "../utils/error";
import type {
  ExtractedAdmissionData,
  ExtractedExaminationRecord,
  ExtractedGuardian,
  ExtractedOtherQualification,
  ExtractedRegisteredCourse,
  UpdateAdmissionInput,
} from "../types/admission";

const ADMISSION_MAX_PAGES = Number(process.env.ADMISSION_MAX_PAGES) || 4;

const admissionInclude = {
  student: true,
  guardians: true,
  examinationRecords: { include: { subjects: { orderBy: { position: "asc" } } } },
  otherQualifications: true,
  registeredCourses: { orderBy: { position: "asc" } },
} satisfies Prisma.AdmissionInclude;

function toDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function emitStatus(jobId: string, message: string): void {
  sseHub.emit(jobId, { type: "status", message });
}

/**
 * Kicks off background extraction for an uploaded PDF and returns
 * immediately with a throwaway jobId used only for the SSE channel - see
 * CLAUDE.md for why this is never a DB id.
 */
export function startExtractionJob(fileBuffer: Buffer): string {
  const jobId = crypto.randomUUID();
  void processAdmissionExtraction(jobId, fileBuffer).catch((err) => {
    console.error(`[admission:${jobId}] unhandled extraction error`, err);
    sseHub.emit(jobId, {
      type: "failed",
      message: "Something went wrong while processing the document",
    });
  });
  return jobId;
}

async function processAdmissionExtraction(jobId: string, fileBuffer: Buffer): Promise<void> {
  try {
    emitStatus(jobId, "Validating document...");
    const { buffer, pageCount, totalPageCount, truncated } = await limitPdfPages(
      fileBuffer,
      ADMISSION_MAX_PAGES
    );
    emitStatus(
      jobId,
      truncated
        ? `Document has ${totalPageCount} pages; processing the first ${pageCount}.`
        : `Detected ${pageCount} page${pageCount === 1 ? "" : "s"}.`
    );

    emitStatus(jobId, "Extracting handwritten fields with AI...");
    const extracted = await extractAdmissionData(buffer);

    emitStatus(jobId, "Saving extracted data for review...");
    const admission = await saveExtractedAdmission(extracted, pageCount);

    sseHub.emit(jobId, {
      type: "review_ready",
      message: "Extraction complete. Ready for review.",
      data: admission,
    });
  } catch (err) {
    console.error(`[admission:${jobId}] extraction failed`, err);
    const message =
      err instanceof GeminiExtractionError || err instanceof AppError
        ? err.message
        : "Extraction failed unexpectedly";
    sseHub.emit(jobId, { type: "failed", message });
  }
}

function mapGuardian(g: ExtractedGuardian) {
  return {
    relation: g.relation,
    firstName: g.firstName ?? null,
    middleName: g.middleName ?? null,
    lastName: g.lastName ?? null,
    telephone: g.telephone ?? null,
    email: g.email ?? null,
    physicalAddress: g.physicalAddress ?? null,
    occupation: g.occupation ?? null,
    livingStatus: g.livingStatus ?? null,
  };
}

function mapOtherQualification(q: ExtractedOtherQualification) {
  return {
    type: q.type,
    yearFrom: q.yearFrom ?? null,
    yearTo: q.yearTo ?? null,
    institutionName: q.institutionName ?? null,
    qualificationAttained: q.qualificationAttained ?? null,
    classOfAward: q.classOfAward ?? null,
  };
}

function mapRegisteredCourse(c: ExtractedRegisteredCourse) {
  return {
    position: c.position ?? null,
    code: c.code ?? null,
    courseName: c.courseName ?? null,
  };
}

function mapExaminationRecordCreate(record: ExtractedExaminationRecord) {
  return {
    type: record.type,
    yearOfExamination: record.yearOfExamination ?? null,
    indexNumber: record.indexNumber ?? null,
    subjects: {
      create: record.subjects.map((s) => ({
        position: s.position ?? null,
        subject: s.subject ?? null,
        grade: s.grade ?? null,
      })),
    },
  };
}

async function upsertStudent(tx: Prisma.TransactionClient, student: ExtractedAdmissionData["student"]) {
  const data = {
    firstName: student.firstName ?? null,
    middleName: student.middleName ?? null,
    lastName: student.lastName ?? null,
    studentNo: student.studentNo ?? null,
    regNo: student.regNo ?? null,
    yearOfStudy: student.yearOfStudy ?? null,
    sex: student.sex ?? null,
    dateOfBirth: toDate(student.dateOfBirth),
    nationality: student.nationality ?? null,
    nin: student.nin ?? null,
    maritalStatus: student.maritalStatus ?? null,
    telephone: student.telephone ?? null,
    email: student.email ?? null,
    physicalAddress: student.physicalAddress ?? null,
    districtOfOrigin: student.districtOfOrigin ?? null,
    village: student.village ?? null,
    sponsorType: student.sponsorType ?? null,
    sponsorName: student.sponsorName ?? null,
    sponsorTelephone: student.sponsorTelephone ?? null,
    sponsorEmail: student.sponsorEmail ?? null,
    sponsorAddress: student.sponsorAddress ?? null,
    chronicMedicalCondition: student.chronicMedicalCondition ?? null,
    disability: student.disability ?? null,
    requiredAdjustments: student.requiredAdjustments ?? null,
  };

  if (student.regNo) {
    return tx.student.upsert({ where: { regNo: student.regNo }, create: data, update: data });
  }
  return tx.student.create({ data });
}

async function saveExtractedAdmission(extracted: ExtractedAdmissionData, pageCount: number) {
  return prisma.$transaction(async (tx) => {
    const student = await upsertStudent(tx, extracted.student);

    return tx.admission.create({
      data: {
        studentId: student.id,
        semester: extracted.semester ?? null,
        academicYear: extracted.academicYear ?? null,
        programmeName: extracted.programmeName ?? null,
        programmeDuration: extracted.programmeDuration ?? null,
        studentSigned: extracted.studentSigned ?? null,
        studentSignedDate: toDate(extracted.studentSignedDate),
        registrarName: extracted.registrarName ?? null,
        registrarSigned: extracted.registrarSigned ?? null,
        registrarVerifiedDate: toDate(extracted.registrarVerifiedDate),
        officialStampPresent: extracted.officialStampPresent ?? null,
        pageCount,
        rawExtraction: extracted as unknown as Prisma.InputJsonValue,
        guardians: { create: extracted.guardians.map(mapGuardian) },
        examinationRecords: { create: extracted.examinationRecords.map(mapExaminationRecordCreate) },
        otherQualifications: { create: extracted.otherQualifications.map(mapOtherQualification) },
        registeredCourses: { create: extracted.registeredCourses.map(mapRegisteredCourse) },
      },
      include: admissionInclude,
    });
  });
}

export interface ListAdmissionsParams {
  status?: AdmissionStatus;
  page?: number;
  pageSize?: number;
}

export async function listAdmissions(params: ListAdmissionsParams) {
  const page = params.page && params.page > 0 ? params.page : 1;
  const pageSize = params.pageSize && params.pageSize > 0 ? Math.min(params.pageSize, 100) : 20;
  const where: Prisma.AdmissionWhereInput = params.status ? { status: params.status } : {};

  const [items, total] = await Promise.all([
    prisma.admission.findMany({
      where,
      include: { student: true },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.admission.count({ where }),
  ]);

  return { items, total, page, pageSize };
}

export async function getAdmission(id: string) {
  const admission = await prisma.admission.findUnique({ where: { id }, include: admissionInclude });
  if (!admission) throw new AppError("Admission not found", 404);
  return admission;
}

export async function updateAdmission(id: string, input: UpdateAdmissionInput) {
  const existing = await prisma.admission.findUnique({ where: { id } });
  if (!existing) throw new AppError("Admission not found", 404);

  await prisma.$transaction(async (tx) => {
    if (input.student) {
      const { dateOfBirth, ...rest } = input.student;
      await tx.student.update({
        where: { id: existing.studentId },
        data: {
          ...rest,
          ...(dateOfBirth !== undefined && { dateOfBirth: toDate(dateOfBirth) }),
        },
      });
    }

    if (input.guardians) {
      await tx.guardian.deleteMany({ where: { admissionId: id } });
      if (input.guardians.length > 0) {
        await tx.guardian.createMany({
          data: input.guardians.map((g) => ({ admissionId: id, ...mapGuardian(g) })),
        });
      }
    }

    if (input.examinationRecords) {
      await tx.examinationRecord.deleteMany({ where: { admissionId: id } });
      for (const record of input.examinationRecords) {
        await tx.examinationRecord.create({
          data: { admissionId: id, ...mapExaminationRecordCreate(record) },
        });
      }
    }

    if (input.otherQualifications) {
      await tx.otherQualification.deleteMany({ where: { admissionId: id } });
      if (input.otherQualifications.length > 0) {
        await tx.otherQualification.createMany({
          data: input.otherQualifications.map((q) => ({ admissionId: id, ...mapOtherQualification(q) })),
        });
      }
    }

    if (input.registeredCourses) {
      await tx.registeredCourse.deleteMany({ where: { admissionId: id } });
      if (input.registeredCourses.length > 0) {
        await tx.registeredCourse.createMany({
          data: input.registeredCourses.map((c) => ({ admissionId: id, ...mapRegisteredCourse(c) })),
        });
      }
    }

    await tx.admission.update({
      where: { id },
      data: {
        semester: input.semester,
        academicYear: input.academicYear,
        programmeName: input.programmeName,
        programmeDuration: input.programmeDuration,
        studentSigned: input.studentSigned,
        studentSignedDate:
          input.studentSignedDate !== undefined ? toDate(input.studentSignedDate) : undefined,
        registrarName: input.registrarName,
        registrarSigned: input.registrarSigned,
        registrarVerifiedDate:
          input.registrarVerifiedDate !== undefined ? toDate(input.registrarVerifiedDate) : undefined,
        officialStampPresent: input.officialStampPresent,
      },
    });
  });

  return getAdmission(id);
}

async function transitionStatus(id: string, from: AdmissionStatus, to: AdmissionStatus) {
  const existing = await prisma.admission.findUnique({ where: { id } });
  if (!existing) throw new AppError("Admission not found", 404);
  if (existing.status !== from) {
    throw new AppError(`Cannot move an admission from ${existing.status} to ${to}`, 400);
  }
  return prisma.admission.update({ where: { id }, data: { status: to }, include: admissionInclude });
}

export function confirmAdmission(id: string) {
  return transitionStatus(id, "PENDING_REVIEW", "COMPLETED");
}

export function rejectAdmission(id: string) {
  return transitionStatus(id, "PENDING_REVIEW", "REJECTED");
}

export async function deleteAdmission(id: string): Promise<void> {
  const existing = await prisma.admission.findUnique({ where: { id } });
  if (!existing) throw new AppError("Admission not found", 404);
  await prisma.admission.delete({ where: { id } });
}
