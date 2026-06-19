import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useFormik } from "formik";
import { toast } from "react-toastify";
import { Plus, Trash2 } from "lucide-react";
import { confirmAdmission, getAdmission, rejectAdmission, updateAdmission } from "@/api/admissions";
import { Button } from "@/ui/shared/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/shared/card";
import { Input } from "@/ui/shared/input";
import { Label } from "@/ui/shared/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/ui/shared/select";
import type {
  Admission,
  ExaminationType,
  GuardianRelation,
  OtherQualificationType,
} from "@/types/admission";
import { AppDate } from "@/utils/date";

const ns = (v: string | null | undefined) => v ?? "";
const sn = (v: string) => (v.trim() === "" ? null : v);

interface FormGuardian {
  relation: GuardianRelation;
  firstName: string;
  middleName: string;
  lastName: string;
  telephone: string;
  email: string;
  physicalAddress: string;
  occupation: string;
  livingStatus: string;
}

interface FormSubject {
  position: number | null;
  subject: string;
  grade: string;
}

interface FormExaminationRecord {
  type: ExaminationType;
  yearOfExamination: string;
  indexNumber: string;
  subjects: FormSubject[];
}

interface FormOtherQualification {
  type: OtherQualificationType;
  yearFrom: string;
  yearTo: string;
  institutionName: string;
  qualificationAttained: string;
  classOfAward: string;
}

interface FormRegisteredCourse {
  position: number | null;
  code: string;
  courseName: string;
}

interface ReviewFormValues {
  semester: string;
  academicYear: string;
  programmeName: string;
  programmeDuration: string;
  studentSigned: boolean;
  studentSignedDate: string;
  registrarName: string;
  registrarSigned: boolean;
  registrarVerifiedDate: string;
  officialStampPresent: boolean;
  student: {
    firstName: string;
    middleName: string;
    lastName: string;
    studentNo: string;
    regNo: string;
    yearOfStudy: string;
    sex: string;
    dateOfBirth: string;
    nationality: string;
    nin: string;
    maritalStatus: string;
    telephone: string;
    email: string;
    physicalAddress: string;
    districtOfOrigin: string;
    village: string;
    sponsorType: string;
    sponsorName: string;
    sponsorTelephone: string;
    sponsorEmail: string;
    sponsorAddress: string;
    chronicMedicalCondition: string;
    disability: string;
    requiredAdjustments: string;
  };
  guardians: FormGuardian[];
  examinationRecords: FormExaminationRecord[];
  otherQualifications: FormOtherQualification[];
  registeredCourses: FormRegisteredCourse[];
}

function emptyGuardian(relation: GuardianRelation): FormGuardian {
  return {
    relation,
    firstName: "",
    middleName: "",
    lastName: "",
    telephone: "",
    email: "",
    physicalAddress: "",
    occupation: "",
    livingStatus: "",
  };
}

function emptyExaminationRecord(type: ExaminationType): FormExaminationRecord {
  return { type, yearOfExamination: "", indexNumber: "", subjects: [] };
}

function buildInitialValues(admission: Admission): ReviewFormValues {
  const { student } = admission;

  const guardianFor = (relation: GuardianRelation): FormGuardian => {
    const existing = admission.guardians.find((g) => g.relation === relation);
    if (!existing) return emptyGuardian(relation);
    return {
      relation,
      firstName: ns(existing.firstName),
      middleName: ns(existing.middleName),
      lastName: ns(existing.lastName),
      telephone: ns(existing.telephone),
      email: ns(existing.email),
      physicalAddress: ns(existing.physicalAddress),
      occupation: ns(existing.occupation),
      livingStatus: ns(existing.livingStatus),
    };
  };

  const examinationFor = (type: ExaminationType): FormExaminationRecord => {
    const existing = admission.examinationRecords.find((r) => r.type === type);
    if (!existing) return emptyExaminationRecord(type);
    return {
      type,
      yearOfExamination: ns(existing.yearOfExamination),
      indexNumber: ns(existing.indexNumber),
      subjects: existing.subjects.map((s) => ({
        position: s.position,
        subject: ns(s.subject),
        grade: ns(s.grade),
      })),
    };
  };

  return {
    semester: ns(admission.semester),
    academicYear: ns(admission.academicYear),
    programmeName: ns(admission.programmeName),
    programmeDuration: ns(admission.programmeDuration),
    studentSigned: Boolean(admission.studentSigned),
    studentSignedDate: AppDate.toInputDate(admission.studentSignedDate),
    registrarName: ns(admission.registrarName),
    registrarSigned: Boolean(admission.registrarSigned),
    registrarVerifiedDate: AppDate.toInputDate(admission.registrarVerifiedDate),
    officialStampPresent: Boolean(admission.officialStampPresent),
    student: {
      firstName: ns(student.firstName),
      middleName: ns(student.middleName),
      lastName: ns(student.lastName),
      studentNo: ns(student.studentNo),
      regNo: ns(student.regNo),
      yearOfStudy: ns(student.yearOfStudy),
      sex: ns(student.sex),
      dateOfBirth: AppDate.toInputDate(student.dateOfBirth),
      nationality: ns(student.nationality),
      nin: ns(student.nin),
      maritalStatus: ns(student.maritalStatus),
      telephone: ns(student.telephone),
      email: ns(student.email),
      physicalAddress: ns(student.physicalAddress),
      districtOfOrigin: ns(student.districtOfOrigin),
      village: ns(student.village),
      sponsorType: ns(student.sponsorType),
      sponsorName: ns(student.sponsorName),
      sponsorTelephone: ns(student.sponsorTelephone),
      sponsorEmail: ns(student.sponsorEmail),
      sponsorAddress: ns(student.sponsorAddress),
      chronicMedicalCondition: ns(student.chronicMedicalCondition),
      disability: ns(student.disability),
      requiredAdjustments: ns(student.requiredAdjustments),
    },
    guardians: [guardianFor("FATHER"), guardianFor("MOTHER"), guardianFor("NEXT_OF_KIN")],
    examinationRecords: [examinationFor("UCE"), examinationFor("UACE")],
    otherQualifications: admission.otherQualifications.map((q) => ({
      type: q.type,
      yearFrom: ns(q.yearFrom),
      yearTo: ns(q.yearTo),
      institutionName: ns(q.institutionName),
      qualificationAttained: ns(q.qualificationAttained),
      classOfAward: ns(q.classOfAward),
    })),
    registeredCourses: admission.registeredCourses.map((c) => ({
      position: c.position,
      code: ns(c.code),
      courseName: ns(c.courseName),
    })),
  };
}

function toUpdatePayload(values: ReviewFormValues) {
  return {
    semester: sn(values.semester),
    academicYear: sn(values.academicYear),
    programmeName: sn(values.programmeName),
    programmeDuration: sn(values.programmeDuration),
    studentSigned: values.studentSigned,
    studentSignedDate: sn(values.studentSignedDate),
    registrarName: sn(values.registrarName),
    registrarSigned: values.registrarSigned,
    registrarVerifiedDate: sn(values.registrarVerifiedDate),
    officialStampPresent: values.officialStampPresent,
    student: {
      firstName: sn(values.student.firstName),
      middleName: sn(values.student.middleName),
      lastName: sn(values.student.lastName),
      studentNo: sn(values.student.studentNo),
      regNo: sn(values.student.regNo),
      yearOfStudy: sn(values.student.yearOfStudy),
      sex: sn(values.student.sex) as "MALE" | "FEMALE" | null,
      dateOfBirth: sn(values.student.dateOfBirth),
      nationality: sn(values.student.nationality),
      nin: sn(values.student.nin),
      maritalStatus: sn(values.student.maritalStatus) as "SINGLE" | "MARRIED" | null,
      telephone: sn(values.student.telephone),
      email: sn(values.student.email),
      physicalAddress: sn(values.student.physicalAddress),
      districtOfOrigin: sn(values.student.districtOfOrigin),
      village: sn(values.student.village),
      sponsorType: sn(values.student.sponsorType) as "GOVERNMENT" | "PRIVATE" | null,
      sponsorName: sn(values.student.sponsorName),
      sponsorTelephone: sn(values.student.sponsorTelephone),
      sponsorEmail: sn(values.student.sponsorEmail),
      sponsorAddress: sn(values.student.sponsorAddress),
      chronicMedicalCondition: sn(values.student.chronicMedicalCondition),
      disability: sn(values.student.disability),
      requiredAdjustments: sn(values.student.requiredAdjustments),
    },
    guardians: values.guardians.map((g) => ({
      relation: g.relation,
      firstName: sn(g.firstName),
      middleName: sn(g.middleName),
      lastName: sn(g.lastName),
      telephone: sn(g.telephone),
      email: sn(g.email),
      physicalAddress: sn(g.physicalAddress),
      occupation: sn(g.occupation),
      livingStatus: sn(g.livingStatus) as "LIVING" | "DECEASED" | null,
    })),
    examinationRecords: values.examinationRecords.map((r) => ({
      type: r.type,
      yearOfExamination: sn(r.yearOfExamination),
      indexNumber: sn(r.indexNumber),
      subjects: r.subjects.map((s) => ({ position: s.position, subject: sn(s.subject), grade: sn(s.grade) })),
    })),
    otherQualifications: values.otherQualifications.map((q) => ({
      type: q.type,
      yearFrom: sn(q.yearFrom),
      yearTo: sn(q.yearTo),
      institutionName: sn(q.institutionName),
      qualificationAttained: sn(q.qualificationAttained),
      classOfAward: sn(q.classOfAward),
    })),
    registeredCourses: values.registeredCourses.map((c) => ({
      position: c.position,
      code: sn(c.code),
      courseName: sn(c.courseName),
    })),
  };
}

function Field({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <div className="space-y-1">
      <Label>{label}</Label>
      <Input type={type} value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

function EnumField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
}) {
  return (
    <div className="space-y-1">
      <Label>{label}</Label>
      <Select value={value || undefined} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue placeholder="—" />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option} value={option}>
              {option.replace("_", " ")}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

const guardianLabel: Record<GuardianRelation, string> = {
  FATHER: "Father",
  MOTHER: "Mother",
  NEXT_OF_KIN: "Next of Kin / Guardian",
};

export default function AdmissionReview() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: admission, isLoading } = useQuery({
    queryKey: ["admission", id],
    queryFn: () => getAdmission(id as string),
    enabled: Boolean(id),
  });

  const initialValues = useMemo(() => (admission ? buildInitialValues(admission) : null), [admission]);

  const updateMutation = useMutation({
    mutationFn: (values: ReviewFormValues) => updateAdmission(id as string, toUpdatePayload(values)),
    onSuccess: (updated) => {
      queryClient.setQueryData(["admission", id], updated);
      toast.success("Changes saved");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const confirmMutation = useMutation({
    mutationFn: () => confirmAdmission(id as string),
    onSuccess: () => {
      toast.success("Admission confirmed");
      queryClient.invalidateQueries({ queryKey: ["admissions"] });
      navigate(`/admissions/${id}`);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const rejectMutation = useMutation({
    mutationFn: () => rejectAdmission(id as string),
    onSuccess: () => {
      toast.success("Admission rejected");
      queryClient.invalidateQueries({ queryKey: ["admissions"] });
      navigate("/admissions");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const formik = useFormik<ReviewFormValues>({
    initialValues: initialValues ?? ({} as ReviewFormValues),
    enableReinitialize: true,
    onSubmit: (values) => updateMutation.mutate(values),
  });

  if (isLoading || !admission || !initialValues || !formik.values.student) {
    return <p className="mx-auto max-w-4xl py-10 text-sm text-muted-foreground">Loading...</p>;
  }

  if (admission.status !== "PENDING_REVIEW") {
    return (
      <div className="mx-auto max-w-4xl py-10 text-center">
        <p className="text-sm text-muted-foreground">
          This admission has already been {admission.status === "COMPLETED" ? "completed" : "rejected"}.
        </p>
        <Button asChild variant="outline" className="mt-4">
          <Link to={`/admissions/${id}`}>View details</Link>
        </Button>
      </div>
    );
  }

  const v = formik.values;
  const set = (path: string) => (value: string) => formik.setFieldValue(path, value);

  return (
    <form onSubmit={formik.handleSubmit} className="mx-auto w-full max-w-4xl space-y-6 py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Review extracted admission</h1>
        <Button asChild variant="outline" size="sm">
          <Link to="/admissions">Back to list</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Applicant</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <Field label="First Name" value={v.student.firstName} onChange={set("student.firstName")} />
          <Field label="Middle Name" value={v.student.middleName} onChange={set("student.middleName")} />
          <Field label="Last Name" value={v.student.lastName} onChange={set("student.lastName")} />
          <Field label="Student No" value={v.student.studentNo} onChange={set("student.studentNo")} />
          <Field label="Reg No" value={v.student.regNo} onChange={set("student.regNo")} />
          <Field label="Year of Study" value={v.student.yearOfStudy} onChange={set("student.yearOfStudy")} />
          <EnumField label="Sex" value={v.student.sex} onChange={set("student.sex")} options={["MALE", "FEMALE"]} />
          <Field label="Date of Birth" type="date" value={v.student.dateOfBirth} onChange={set("student.dateOfBirth")} />
          <Field label="Nationality" value={v.student.nationality} onChange={set("student.nationality")} />
          <Field label="NIN" value={v.student.nin} onChange={set("student.nin")} />
          <EnumField
            label="Marital Status"
            value={v.student.maritalStatus}
            onChange={set("student.maritalStatus")}
            options={["SINGLE", "MARRIED"]}
          />
          <Field label="Telephone" value={v.student.telephone} onChange={set("student.telephone")} />
          <Field label="Email" type="email" value={v.student.email} onChange={set("student.email")} />
          <Field label="Physical Address" value={v.student.physicalAddress} onChange={set("student.physicalAddress")} />
          <Field label="District of Origin" value={v.student.districtOfOrigin} onChange={set("student.districtOfOrigin")} />
          <Field label="Village" value={v.student.village} onChange={set("student.village")} />
          <EnumField
            label="Sponsor Type"
            value={v.student.sponsorType}
            onChange={set("student.sponsorType")}
            options={["GOVERNMENT", "PRIVATE"]}
          />
          <Field label="Sponsor Name" value={v.student.sponsorName} onChange={set("student.sponsorName")} />
          <Field label="Sponsor Telephone" value={v.student.sponsorTelephone} onChange={set("student.sponsorTelephone")} />
          <Field label="Sponsor Email" value={v.student.sponsorEmail} onChange={set("student.sponsorEmail")} />
          <Field label="Sponsor Address" value={v.student.sponsorAddress} onChange={set("student.sponsorAddress")} />
          <Field
            label="Chronic Medical Condition"
            value={v.student.chronicMedicalCondition}
            onChange={set("student.chronicMedicalCondition")}
          />
          <Field label="Disability" value={v.student.disability} onChange={set("student.disability")} />
          <Field
            label="Required Adjustments"
            value={v.student.requiredAdjustments}
            onChange={set("student.requiredAdjustments")}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Programme</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <Field label="Semester" value={v.semester} onChange={set("semester")} />
          <Field label="Academic Year" value={v.academicYear} onChange={set("academicYear")} />
          <Field label="Programme" value={v.programmeName} onChange={set("programmeName")} />
          <Field label="Duration" value={v.programmeDuration} onChange={set("programmeDuration")} />
        </CardContent>
      </Card>

      {v.guardians.map((guardian, index) => (
        <Card key={guardian.relation}>
          <CardHeader>
            <CardTitle>{guardianLabel[guardian.relation]}</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <Field label="First Name" value={guardian.firstName} onChange={set(`guardians[${index}].firstName`)} />
            <Field label="Middle Name" value={guardian.middleName} onChange={set(`guardians[${index}].middleName`)} />
            <Field label="Last Name" value={guardian.lastName} onChange={set(`guardians[${index}].lastName`)} />
            <Field label="Telephone" value={guardian.telephone} onChange={set(`guardians[${index}].telephone`)} />
            <Field label="Email" value={guardian.email} onChange={set(`guardians[${index}].email`)} />
            <Field
              label="Physical Address"
              value={guardian.physicalAddress}
              onChange={set(`guardians[${index}].physicalAddress`)}
            />
            <Field label="Occupation" value={guardian.occupation} onChange={set(`guardians[${index}].occupation`)} />
            {guardian.relation !== "NEXT_OF_KIN" && (
              <EnumField
                label="Status"
                value={guardian.livingStatus}
                onChange={set(`guardians[${index}].livingStatus`)}
                options={["LIVING", "DECEASED"]}
              />
            )}
          </CardContent>
        </Card>
      ))}

      {v.examinationRecords.map((record, recordIndex) => (
        <Card key={record.type}>
          <CardHeader>
            <CardTitle>{record.type}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              <Field
                label="Year of Examination"
                value={record.yearOfExamination}
                onChange={set(`examinationRecords[${recordIndex}].yearOfExamination`)}
              />
              <Field
                label="Index Number"
                value={record.indexNumber}
                onChange={set(`examinationRecords[${recordIndex}].indexNumber`)}
              />
            </div>
            <div className="space-y-2">
              {record.subjects.map((subject, subjectIndex) => (
                <div key={subjectIndex} className="flex items-end gap-2">
                  <Field
                    label="Subject"
                    value={subject.subject}
                    onChange={set(`examinationRecords[${recordIndex}].subjects[${subjectIndex}].subject`)}
                  />
                  <Field
                    label="Grade"
                    value={subject.grade}
                    onChange={set(`examinationRecords[${recordIndex}].subjects[${subjectIndex}].grade`)}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() =>
                      formik.setFieldValue(
                        `examinationRecords[${recordIndex}].subjects`,
                        record.subjects.filter((_, i) => i !== subjectIndex)
                      )
                    }
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  formik.setFieldValue(`examinationRecords[${recordIndex}].subjects`, [
                    ...record.subjects,
                    { position: record.subjects.length + 1, subject: "", grade: "" },
                  ])
                }
              >
                <Plus className="mr-1 h-4 w-4" /> Add subject
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}

      <Card>
        <CardHeader>
          <CardTitle>Other Qualifications</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {v.otherQualifications.map((q, index) => (
            <div key={index} className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              <EnumField
                label="Type"
                value={q.type}
                onChange={set(`otherQualifications[${index}].type`)}
                options={["EQUIVALENT", "OTHER"]}
              />
              <Field label="Year From" value={q.yearFrom} onChange={set(`otherQualifications[${index}].yearFrom`)} />
              <Field label="Year To" value={q.yearTo} onChange={set(`otherQualifications[${index}].yearTo`)} />
              <Field
                label="Institution"
                value={q.institutionName}
                onChange={set(`otherQualifications[${index}].institutionName`)}
              />
              <Field
                label="Qualification"
                value={q.qualificationAttained}
                onChange={set(`otherQualifications[${index}].qualificationAttained`)}
              />
              <div className="flex items-end gap-2">
                <Field
                  label="Class of Award"
                  value={q.classOfAward}
                  onChange={set(`otherQualifications[${index}].classOfAward`)}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() =>
                    formik.setFieldValue(
                      "otherQualifications",
                      v.otherQualifications.filter((_, i) => i !== index)
                    )
                  }
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              formik.setFieldValue("otherQualifications", [
                ...v.otherQualifications,
                {
                  type: "EQUIVALENT",
                  yearFrom: "",
                  yearTo: "",
                  institutionName: "",
                  qualificationAttained: "",
                  classOfAward: "",
                },
              ])
            }
          >
            <Plus className="mr-1 h-4 w-4" /> Add qualification
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Registered Courses</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {v.registeredCourses.map((course, index) => (
            <div key={index} className="flex items-end gap-2">
              <Field label="Code" value={course.code} onChange={set(`registeredCourses[${index}].code`)} />
              <Field
                label="Course Name"
                value={course.courseName}
                onChange={set(`registeredCourses[${index}].courseName`)}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() =>
                  formik.setFieldValue(
                    "registeredCourses",
                    v.registeredCourses.filter((_, i) => i !== index)
                  )
                }
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              formik.setFieldValue("registeredCourses", [
                ...v.registeredCourses,
                { position: v.registeredCourses.length + 1, code: "", courseName: "" },
              ])
            }
          >
            <Plus className="mr-1 h-4 w-4" /> Add course
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Declaration & Verification</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <Field label="Signed Date" type="date" value={v.studentSignedDate} onChange={set("studentSignedDate")} />
          <Field label="Registrar Name" value={v.registrarName} onChange={set("registrarName")} />
          <Field
            label="Verified Date"
            type="date"
            value={v.registrarVerifiedDate}
            onChange={set("registrarVerifiedDate")}
          />
        </CardContent>
      </Card>

      <div className="flex flex-wrap justify-end gap-2 pb-10">
        <Button type="button" variant="destructive" onClick={() => rejectMutation.mutate()} disabled={rejectMutation.isPending}>
          Reject
        </Button>
        <Button type="submit" variant="outline" disabled={updateMutation.isPending}>
          {updateMutation.isPending ? "Saving..." : "Save changes"}
        </Button>
        <Button
          type="button"
          variant="accent"
          onClick={() => confirmMutation.mutate()}
          disabled={confirmMutation.isPending}
        >
          Confirm
        </Button>
      </div>
    </form>
  );
}
