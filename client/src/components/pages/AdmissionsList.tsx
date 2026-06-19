import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { listAdmissions } from "@/api/admissions";
import { Badge } from "@/ui/shared/badge";
import { Button } from "@/ui/shared/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/shared/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/ui/shared/table";
import type { AdmissionStatus } from "@/types/admission";
import { AppDate } from "@/utils/date";

const statusVariant: Record<AdmissionStatus, "secondary" | "success" | "destructive"> = {
  PENDING_REVIEW: "secondary",
  COMPLETED: "success",
  REJECTED: "destructive",
};

const statusLabel: Record<AdmissionStatus, string> = {
  PENDING_REVIEW: "Pending review",
  COMPLETED: "Completed",
  REJECTED: "Rejected",
};

function studentName(student: { firstName: string | null; middleName: string | null; lastName: string | null }) {
  return [student.firstName, student.middleName, student.lastName].filter(Boolean).join(" ") || "—";
}

export default function AdmissionsList() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["admissions"],
    queryFn: () => listAdmissions({ pageSize: 50 }),
  });

  return (
    <div className="mx-auto w-full max-w-5xl py-10">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Admissions</CardTitle>
          <Button asChild variant="accent" size="sm">
            <Link to="/">New upload</Link>
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading && <p className="text-sm text-muted-foreground">Loading...</p>}
          {isError && <p className="text-sm text-destructive">Failed to load admissions.</p>}
          {data && data.items.length === 0 && (
            <p className="text-sm text-muted-foreground">No admissions yet.</p>
          )}
          {data && data.items.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Reg No</TableHead>
                  <TableHead>Programme</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.items.map((admission) => (
                  <TableRow key={admission.id}>
                    <TableCell className="font-medium">
                      <Link
                        to={
                          admission.status === "PENDING_REVIEW"
                            ? `/admissions/${admission.id}/review`
                            : `/admissions/${admission.id}`
                        }
                        className="hover:underline"
                      >
                        {studentName(admission.student)}
                      </Link>
                    </TableCell>
                    <TableCell>{admission.student.regNo ?? "—"}</TableCell>
                    <TableCell>{admission.programmeName ?? "—"}</TableCell>
                    <TableCell>
                      <Badge variant={statusVariant[admission.status]}>
                        {statusLabel[admission.status]}
                      </Badge>
                    </TableCell>
                    <TableCell>{AppDate.toHumanDateTime(admission.createdAt)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
