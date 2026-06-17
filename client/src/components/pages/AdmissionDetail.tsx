import type { ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import { getAdmission } from "@/api/admissions";
import { Badge } from "@/ui/shared/badge";
import { Button } from "@/ui/shared/button";
import { Card, CardContent } from "@/ui/shared/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/ui/shared/table";
import type { AdmissionStatus } from "@/types/admission";

const statusVariant: Record<AdmissionStatus, "secondary" | "success" | "destructive"> = {
  PENDING_REVIEW: "secondary",
  COMPLETED: "success",
  REJECTED: "destructive",
};

function Field({ label, value }: { label: string; value: string | number | null | undefined }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="text-sm">{value ?? "—"}</dd>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="space-y-4 border-t border-border pt-6 first:border-t-0 first:pt-0">
      <h3 className="text-sm font-semibold">{title}</h3>
      {children}
    </div>
  );
}

export default function AdmissionDetail() {
  const { id } = useParams<{ id: string }>();
  const { data: admission, isLoading } = useQuery({
    queryKey: ["admission", id],
    queryFn: () => getAdmission(id as string),
    enabled: Boolean(id),
  });

  if (isLoading || !admission) {
    return <p className="mx-auto max-w-4xl py-10 text-sm text-muted-foreground">Loading...</p>;
  }

  const { student } = admission;

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">
          {[student.firstName, student.middleName, student.lastName].filter(Boolean).join(" ") || "Admission"}
        </h1>
        <div className="flex items-center gap-2">
          <Badge variant={statusVariant[admission.status]}>{admission.status.replace("_", " ")}</Badge>
          <Button asChild variant="outline" size="sm">
            <Link to="/admissions">Back to list</Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="space-y-6 pt-6">
          <Section title="Applicant">
            <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              <Field label="Student No" value={student.studentNo} />
              <Field label="Reg No" value={student.regNo} />
              <Field label="Year of Study" value={student.yearOfStudy} />
              <Field label="Sex" value={student.sex} />
              <Field label="Date of Birth" value={student.dateOfBirth} />
              <Field label="Nationality" value={student.nationality} />
              <Field label="NIN" value={student.nin} />
              <Field label="Marital Status" value={student.maritalStatus} />
              <Field label="Telephone" value={student.telephone} />
              <Field label="Email" value={student.email} />
              <Field label="Physical Address" value={student.physicalAddress} />
              <Field label="District of Origin" value={student.districtOfOrigin} />
              <Field label="Village" value={student.village} />
              <Field label="Sponsor Type" value={student.sponsorType} />
              <Field label="Sponsor Name" value={student.sponsorName} />
              <Field label="Sponsor Telephone" value={student.sponsorTelephone} />
              <Field label="Chronic Medical Condition" value={student.chronicMedicalCondition} />
              <Field label="Disability" value={student.disability} />
              <Field label="Required Adjustments" value={student.requiredAdjustments} />
            </dl>
          </Section>

          <Section title="Programme">
            <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              <Field label="Semester" value={admission.semester} />
              <Field label="Academic Year" value={admission.academicYear} />
              <Field label="Programme" value={admission.programmeName} />
              <Field label="Duration" value={admission.programmeDuration} />
            </dl>
          </Section>

          {admission.guardians.map((guardian) => (
            <Section key={guardian.id} title={guardian.relation.replace("_", " ")}>
              <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                <Field
                  label="Name"
                  value={[guardian.firstName, guardian.middleName, guardian.lastName].filter(Boolean).join(" ")}
                />
                <Field label="Telephone" value={guardian.telephone} />
                <Field label="Email" value={guardian.email} />
                <Field label="Physical Address" value={guardian.physicalAddress} />
                <Field label="Occupation" value={guardian.occupation} />
                {guardian.livingStatus && <Field label="Status" value={guardian.livingStatus} />}
              </dl>
            </Section>
          ))}

          {admission.examinationRecords.map((record) => (
            <Section key={record.id} title={`${record.type} — ${record.yearOfExamination ?? ""} (${record.indexNumber ?? ""})`}>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Subject</TableHead>
                    <TableHead>Grade</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {record.subjects.map((subject, idx) => (
                    <TableRow key={subject.id ?? idx}>
                      <TableCell>{subject.subject ?? "—"}</TableCell>
                      <TableCell>{subject.grade ?? "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Section>
          ))}

          {admission.registeredCourses.length > 0 && (
            <Section title="Registered Courses">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Course</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {admission.registeredCourses.map((course) => (
                    <TableRow key={course.id}>
                      <TableCell>{course.code ?? "—"}</TableCell>
                      <TableCell>{course.courseName ?? "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Section>
          )}

          <Section title="Declaration & Verification">
            <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              <Field label="Student Signed" value={admission.studentSigned ? "Yes" : "No"} />
              <Field label="Signed Date" value={admission.studentSignedDate} />
              <Field label="Registrar" value={admission.registrarName} />
              <Field label="Verified Date" value={admission.registrarVerifiedDate} />
              <Field label="Official Stamp Present" value={admission.officialStampPresent ? "Yes" : "No"} />
            </dl>
          </Section>
        </CardContent>
      </Card>
    </div>
  );
}
