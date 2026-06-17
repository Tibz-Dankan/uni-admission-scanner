import { GoogleGenAI, Type, createPartFromUri, createUserContent } from "@google/genai";
import type { Schema } from "@google/genai";
import { z } from "zod";
import type { ExtractedAdmissionData } from "../types/admission";

export class GeminiExtractionError extends Error {}

let client: GoogleGenAI | null = null;

function getClient(): GoogleGenAI {
  if (!client) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new GeminiExtractionError("GEMINI_API_KEY is not configured");
    }
    client = new GoogleGenAI({ apiKey });
  }
  return client;
}

const PROMPT = `You are reading a scanned, handwritten "REGISTRATION FORM" issued by Soroti University. The form has these sections, in order:

1. Header: Semester, Academic Year.
2. Applicant's Personal Details: names, student number, reg number, year of study, sex, date of birth, nationality, NIN, marital status, contact info (telephone/email/physical address), district of origin, village, sponsor (Government or Private; if Private, sponsor's name/telephone/email/address), chronic medical condition, disability/impairment, required adjustments.
3. Parent's Personal Details: Father then Mother, each with name, telephone/email/physical address, occupation, and whether marked Deceased or Living. Note the father's name fields may appear at the bottom of page 1 while his contact/occupation/deceased-living fields continue onto page 2.
4. Next of Kin/Guardian's Personal Details: name, telephone/email/physical address, occupation (no deceased/living field for this person).
5. Academic Documents: Uganda Certificate of Education (UCE) year of examination, index number, and a table of subjects with grades; then Uganda Advanced Certificate of Education (UACE) with the same shape.
6. Equivalent Qualification and Other Qualifications: tables of year-from, year-to, institution name, qualification attained, class of award (may be entirely blank).
7. Details of Programme of Study: programme name, duration, and a table of registered course codes and course names.
8. Declaration and Official Use: whether the student signed and the date, and whether a registrar/official name, signature, verification date, and stamp are present.

Read every handwritten value as written. If a section or field is not present (e.g. only some pages were supplied, or a field was left blank), return null for that field rather than guessing. Return dates as ISO 8601 "YYYY-MM-DD" strings. Return booleans for presence fields (e.g. whether a signature/stamp/checkbox is present) as true/false, not strings. Preserve the original row order for table sections using a 1-based "position" field.

For every table (UCE subjects, UACE subjects, registered courses, equivalent/other qualifications): output exactly one array item per visible row, top to bottom, in two separate fields each (e.g. "subject" and "grade" are always two distinct fields, never combined into one). Never merge multiple rows into a single item, and never skip a row that has content. Each field must contain only the literal extracted value or null - never include your own reasoning, commentary, alternative readings, or parenthetical notes inside a field value.`;

function nullableString(description?: string): Schema {
  return { type: Type.STRING, nullable: true, ...(description && { description }) };
}

function nullableInteger(): Schema {
  return { type: Type.INTEGER, nullable: true };
}

function nullableBoolean(): Schema {
  return { type: Type.BOOLEAN, nullable: true };
}

function nullableEnum(values: string[]): Schema {
  return { type: Type.STRING, nullable: true, enum: values };
}

const subjectSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    position: nullableInteger(),
    subject: nullableString(),
    grade: nullableString(),
  },
  required: ["subject", "grade"],
};

const examinationRecordSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    type: { type: Type.STRING, enum: ["UCE", "UACE"] },
    yearOfExamination: nullableString(),
    indexNumber: nullableString(),
    subjects: { type: Type.ARRAY, items: subjectSchema },
  },
  required: ["type", "subjects"],
};

const otherQualificationSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    type: { type: Type.STRING, enum: ["EQUIVALENT", "OTHER"] },
    yearFrom: nullableString(),
    yearTo: nullableString(),
    institutionName: nullableString(),
    qualificationAttained: nullableString(),
    classOfAward: nullableString(),
  },
  required: ["type"],
};

const registeredCourseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    position: nullableInteger(),
    code: nullableString(),
    courseName: nullableString(),
  },
};

const guardianSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    relation: { type: Type.STRING, enum: ["FATHER", "MOTHER", "NEXT_OF_KIN"] },
    firstName: nullableString(),
    middleName: nullableString(),
    lastName: nullableString(),
    telephone: nullableString(),
    email: nullableString(),
    physicalAddress: nullableString(),
    occupation: nullableString(),
    livingStatus: nullableEnum(["LIVING", "DECEASED"]),
  },
  required: ["relation"],
};

const studentSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    firstName: nullableString(),
    middleName: nullableString(),
    lastName: nullableString(),
    studentNo: nullableString(),
    regNo: nullableString(),
    yearOfStudy: nullableString(),
    sex: nullableEnum(["MALE", "FEMALE"]),
    dateOfBirth: nullableString("ISO 8601 date, e.g. 2003-10-12"),
    nationality: nullableString(),
    nin: nullableString(),
    maritalStatus: nullableEnum(["SINGLE", "MARRIED"]),
    telephone: nullableString(),
    email: nullableString(),
    physicalAddress: nullableString(),
    districtOfOrigin: nullableString(),
    village: nullableString(),
    sponsorType: nullableEnum(["GOVERNMENT", "PRIVATE"]),
    sponsorName: nullableString(),
    sponsorTelephone: nullableString(),
    sponsorEmail: nullableString(),
    sponsorAddress: nullableString(),
    chronicMedicalCondition: nullableString(),
    disability: nullableString(),
    requiredAdjustments: nullableString(),
  },
};

const ADMISSION_RESPONSE_SCHEMA: Schema = {
  type: Type.OBJECT,
  properties: {
    semester: nullableString(),
    academicYear: nullableString(),
    programmeName: nullableString(),
    programmeDuration: nullableString(),
    studentSigned: nullableBoolean(),
    studentSignedDate: nullableString("ISO 8601 date"),
    registrarName: nullableString(),
    registrarSigned: nullableBoolean(),
    registrarVerifiedDate: nullableString("ISO 8601 date"),
    officialStampPresent: nullableBoolean(),
    student: studentSchema,
    guardians: { type: Type.ARRAY, items: guardianSchema },
    examinationRecords: { type: Type.ARRAY, items: examinationRecordSchema },
    otherQualifications: { type: Type.ARRAY, items: otherQualificationSchema },
    registeredCourses: { type: Type.ARRAY, items: registeredCourseSchema },
  },
  required: [
    "student",
    "guardians",
    "examinationRecords",
    "otherQualifications",
    "registeredCourses",
  ],
};

const nullableStringZ = z.string().nullable().optional();
const nullableBooleanZ = z.boolean().nullable().optional();

const subjectZ = z.object({
  position: z.number().nullable().optional(),
  subject: nullableStringZ,
  grade: nullableStringZ,
});

const examinationRecordZ = z.object({
  type: z.enum(["UCE", "UACE"]),
  yearOfExamination: nullableStringZ,
  indexNumber: nullableStringZ,
  subjects: z.array(subjectZ).default([]),
});

const otherQualificationZ = z.object({
  type: z.enum(["EQUIVALENT", "OTHER"]),
  yearFrom: nullableStringZ,
  yearTo: nullableStringZ,
  institutionName: nullableStringZ,
  qualificationAttained: nullableStringZ,
  classOfAward: nullableStringZ,
});

const registeredCourseZ = z.object({
  position: z.number().nullable().optional(),
  code: nullableStringZ,
  courseName: nullableStringZ,
});

const guardianZ = z.object({
  relation: z.enum(["FATHER", "MOTHER", "NEXT_OF_KIN"]),
  firstName: nullableStringZ,
  middleName: nullableStringZ,
  lastName: nullableStringZ,
  telephone: nullableStringZ,
  email: nullableStringZ,
  physicalAddress: nullableStringZ,
  occupation: nullableStringZ,
  livingStatus: z.enum(["LIVING", "DECEASED"]).nullable().optional(),
});

const studentZ = z.object({
  firstName: nullableStringZ,
  middleName: nullableStringZ,
  lastName: nullableStringZ,
  studentNo: nullableStringZ,
  regNo: nullableStringZ,
  yearOfStudy: nullableStringZ,
  sex: z.enum(["MALE", "FEMALE"]).nullable().optional(),
  dateOfBirth: nullableStringZ,
  nationality: nullableStringZ,
  nin: nullableStringZ,
  maritalStatus: z.enum(["SINGLE", "MARRIED"]).nullable().optional(),
  telephone: nullableStringZ,
  email: nullableStringZ,
  physicalAddress: nullableStringZ,
  districtOfOrigin: nullableStringZ,
  village: nullableStringZ,
  sponsorType: z.enum(["GOVERNMENT", "PRIVATE"]).nullable().optional(),
  sponsorName: nullableStringZ,
  sponsorTelephone: nullableStringZ,
  sponsorEmail: nullableStringZ,
  sponsorAddress: nullableStringZ,
  chronicMedicalCondition: nullableStringZ,
  disability: nullableStringZ,
  requiredAdjustments: nullableStringZ,
});

const admissionExtractionZ = z.object({
  semester: nullableStringZ,
  academicYear: nullableStringZ,
  programmeName: nullableStringZ,
  programmeDuration: nullableStringZ,
  studentSigned: nullableBooleanZ,
  studentSignedDate: nullableStringZ,
  registrarName: nullableStringZ,
  registrarSigned: nullableBooleanZ,
  registrarVerifiedDate: nullableStringZ,
  officialStampPresent: nullableBooleanZ,
  student: studentZ,
  guardians: z.array(guardianZ).default([]),
  examinationRecords: z.array(examinationRecordZ).default([]),
  otherQualifications: z.array(otherQualificationZ).default([]),
  registeredCourses: z.array(registeredCourseZ).default([]),
});

const FILE_ACTIVE_POLL_INTERVAL_MS = 1000;
const FILE_ACTIVE_POLL_TIMEOUT_MS = 30_000;

async function waitUntilFileActive(ai: GoogleGenAI, name: string, uri: string, mimeType: string) {
  const deadline = Date.now() + FILE_ACTIVE_POLL_TIMEOUT_MS;
  let state: string | undefined;
  let currentUri = uri;
  let currentMimeType = mimeType;

  while (Date.now() < deadline) {
    const file = await ai.files.get({ name });
    state = file.state;
    currentUri = file.uri ?? currentUri;
    currentMimeType = file.mimeType ?? currentMimeType;
    if (state === "ACTIVE") return { uri: currentUri, mimeType: currentMimeType };
    if (state === "FAILED") {
      throw new GeminiExtractionError("Gemini failed to process the uploaded document");
    }
    await new Promise((resolve) => setTimeout(resolve, FILE_ACTIVE_POLL_INTERVAL_MS));
  }

  throw new GeminiExtractionError("Timed out waiting for Gemini to process the uploaded document");
}

/**
 * Sends a (already page-limited) admission form PDF to Gemini and returns
 * the handwritten field values as structured, validated data. This is the
 * only file in the codebase that talks to the Gemini API directly.
 */
export async function extractAdmissionData(pdfBuffer: Buffer): Promise<ExtractedAdmissionData> {
  const ai = getClient();
  const model = process.env.GEMINI_MODEL || "gemini-3.1-flash-lite";

  const blob = new Blob([new Uint8Array(pdfBuffer)], { type: "application/pdf" });
  const uploaded = await ai.files.upload({
    file: blob,
    config: { mimeType: "application/pdf", displayName: "registration-form.pdf" },
  });

  if (!uploaded.name) {
    throw new GeminiExtractionError("Gemini did not return a file reference for the upload");
  }

  try {
    const { uri, mimeType } = await waitUntilFileActive(
      ai,
      uploaded.name,
      uploaded.uri ?? "",
      uploaded.mimeType ?? "application/pdf"
    );

    const response = await ai.models.generateContent({
      model,
      contents: createUserContent([PROMPT, createPartFromUri(uri, mimeType)]),
      config: {
        responseMimeType: "application/json",
        responseSchema: ADMISSION_RESPONSE_SCHEMA,
      },
    });

    const text = response.text;
    if (!text) {
      throw new GeminiExtractionError("Gemini returned an empty response");
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch {
      throw new GeminiExtractionError("Gemini returned a response that was not valid JSON");
    }

    const result = admissionExtractionZ.safeParse(parsed);
    if (!result.success) {
      throw new GeminiExtractionError(
        `Gemini response did not match the expected shape: ${result.error.message}`
      );
    }

    return result.data as ExtractedAdmissionData;
  } finally {
    await ai.files.delete({ name: uploaded.name }).catch(() => {
      // best-effort cleanup; Gemini auto-expires uploaded files regardless
    });
  }
}
