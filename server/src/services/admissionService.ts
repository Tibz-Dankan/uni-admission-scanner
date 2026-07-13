import crypto from "crypto";
import { and, count, eq, ilike, inArray, or } from "drizzle-orm";
import { db } from "../db";
import {
  admissions,
  examinationRecords,
  examinationSubjects,
  guardians,
  otherQualifications,
  registeredCourses,
  students,
  type AdmissionStatus,
} from "../db/schema";
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
  ExtractedSubject,
  UpdateAdmissionInput,
} from "../types/admission";

const ADMISSION_MAX_PAGES = Number(process.env.ADMISSION_MAX_PAGES) || 4;

type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

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

function mapExaminationSubject(s: ExtractedSubject) {
  return {
    position: s.position ?? null,
    subject: s.subject ?? null,
    grade: s.grade ?? null,
  };
}

async function insertExaminationRecords(
  tx: Transaction,
  admissionId: string,
  records: ExtractedExaminationRecord[]
): Promise<void> {
  for (const record of records) {
    const [inserted] = await tx
      .insert(examinationRecords)
      .values({
        admissionId,
        type: record.type,
        yearOfExamination: record.yearOfExamination ?? null,
        indexNumber: record.indexNumber ?? null,
      })
      .returning();

    if (record.subjects.length > 0) {
      await tx.insert(examinationSubjects).values(
        record.subjects.map((s) => ({ examinationRecordId: inserted.id, ...mapExaminationSubject(s) }))
      );
    }
  }
}

async function upsertStudent(tx: Transaction, student: ExtractedAdmissionData["student"]) {
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
    updatedAt: new Date(),
  };

  if (student.regNo) {
    const [row] = await tx
      .insert(students)
      .values(data)
      .onConflictDoUpdate({ target: students.regNo, set: data })
      .returning();
    return row;
  }

  const [row] = await tx.insert(students).values(data).returning();
  return row;
}

async function saveExtractedAdmission(extracted: ExtractedAdmissionData, pageCount: number) {
  const admissionId = await db.transaction(async (tx) => {
    const student = await upsertStudent(tx, extracted.student);

    const [admission] = await tx
      .insert(admissions)
      .values({
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
        rawExtraction: extracted,
        updatedAt: new Date(),
      })
      .returning();

    if (extracted.guardians.length > 0) {
      await tx
        .insert(guardians)
        .values(extracted.guardians.map((g) => ({ admissionId: admission.id, ...mapGuardian(g) })));
    }
    if (extracted.otherQualifications.length > 0) {
      await tx
        .insert(otherQualifications)
        .values(extracted.otherQualifications.map((q) => ({ admissionId: admission.id, ...mapOtherQualification(q) })));
    }
    if (extracted.registeredCourses.length > 0) {
      await tx
        .insert(registeredCourses)
        .values(extracted.registeredCourses.map((c) => ({ admissionId: admission.id, ...mapRegisteredCourse(c) })));
    }
    await insertExaminationRecords(tx, admission.id, extracted.examinationRecords);

    return admission.id;
  });

  return getAdmission(admissionId);
}

export interface ListAdmissionsParams {
  status?: AdmissionStatus;
  page?: number;
  pageSize?: number;
  search?: string;
}

export async function listAdmissions(params: ListAdmissionsParams) {
  const page = params.page && params.page > 0 ? params.page : 1;
  const pageSize = params.pageSize && params.pageSize > 0 ? Math.min(params.pageSize, 100) : 20;

  const conditions = [];
  if (params.status) conditions.push(eq(admissions.status, params.status));

  if (params.search) {
    const s = `%${params.search.trim()}%`;
    const matchingStudents = await db
      .select({ id: students.id })
      .from(students)
      .where(
        or(
          ilike(students.firstName, s),
          ilike(students.middleName, s),
          ilike(students.lastName, s),
          ilike(students.studentNo, s),
          ilike(students.regNo, s)
        )
      );
    const studentIds = matchingStudents.map((row) => row.id);
    if (studentIds.length === 0) {
      return { items: [], total: 0, page, pageSize };
    }
    conditions.push(inArray(admissions.studentId, studentIds));
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [items, totalResult] = await Promise.all([
    db.query.admissions.findMany({
      where,
      with: { student: true },
      orderBy: (fields, { desc }) => [desc(fields.createdAt)],
      limit: pageSize,
      offset: (page - 1) * pageSize,
    }),
    db.select({ count: count() }).from(admissions).where(where),
  ]);

  return { items, total: Number(totalResult[0]?.count ?? 0), page, pageSize };
}

export async function getAdmission(id: string) {
  const admission = await db.query.admissions.findFirst({
    where: eq(admissions.id, id),
    with: {
      student: true,
      guardians: true,
      examinationRecords: {
        with: {
          subjects: { orderBy: (fields, { asc }) => [asc(fields.position)] },
        },
      },
      otherQualifications: true,
      registeredCourses: { orderBy: (fields, { asc }) => [asc(fields.position)] },
    },
  });
  if (!admission) throw new AppError("Admission not found", 404);
  return admission;
}

export async function updateAdmission(id: string, input: UpdateAdmissionInput) {
  const existing = await db.query.admissions.findFirst({ where: eq(admissions.id, id) });
  if (!existing) throw new AppError("Admission not found", 404);

  await db.transaction(async (tx) => {
    if (input.student) {
      const { dateOfBirth, ...rest } = input.student;
      await tx
        .update(students)
        .set({
          ...rest,
          ...(dateOfBirth !== undefined && { dateOfBirth: toDate(dateOfBirth) }),
          updatedAt: new Date(),
        })
        .where(eq(students.id, existing.studentId));
    }

    if (input.guardians) {
      await tx.delete(guardians).where(eq(guardians.admissionId, id));
      if (input.guardians.length > 0) {
        await tx.insert(guardians).values(input.guardians.map((g) => ({ admissionId: id, ...mapGuardian(g) })));
      }
    }

    if (input.examinationRecords) {
      await tx.delete(examinationRecords).where(eq(examinationRecords.admissionId, id));
      await insertExaminationRecords(tx, id, input.examinationRecords);
    }

    if (input.otherQualifications) {
      await tx.delete(otherQualifications).where(eq(otherQualifications.admissionId, id));
      if (input.otherQualifications.length > 0) {
        await tx
          .insert(otherQualifications)
          .values(input.otherQualifications.map((q) => ({ admissionId: id, ...mapOtherQualification(q) })));
      }
    }

    if (input.registeredCourses) {
      await tx.delete(registeredCourses).where(eq(registeredCourses.admissionId, id));
      if (input.registeredCourses.length > 0) {
        await tx
          .insert(registeredCourses)
          .values(input.registeredCourses.map((c) => ({ admissionId: id, ...mapRegisteredCourse(c) })));
      }
    }

    await tx
      .update(admissions)
      .set({
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
        updatedAt: new Date(),
      })
      .where(eq(admissions.id, id));
  });

  return getAdmission(id);
}

async function transitionStatus(id: string, from: AdmissionStatus, to: AdmissionStatus) {
  const existing = await db.query.admissions.findFirst({ where: eq(admissions.id, id) });
  if (!existing) throw new AppError("Admission not found", 404);
  if (existing.status !== from) {
    throw new AppError(`Cannot move an admission from ${existing.status} to ${to}`, 400);
  }
  await db.update(admissions).set({ status: to, updatedAt: new Date() }).where(eq(admissions.id, id));
  return getAdmission(id);
}

export function confirmAdmission(id: string) {
  return transitionStatus(id, "PENDING_REVIEW", "COMPLETED");
}

export function rejectAdmission(id: string) {
  return transitionStatus(id, "PENDING_REVIEW", "REJECTED");
}

export async function deleteAdmission(id: string): Promise<void> {
  const existing = await db.query.admissions.findFirst({ where: eq(admissions.id, id) });
  if (!existing) throw new AppError("Admission not found", 404);
  await db.delete(admissions).where(eq(admissions.id, id));
}
