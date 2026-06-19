import { useEffect, useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { CheckCircle2, FileText, Loader2, UploadCloud, XCircle } from "lucide-react";
import { uploadAdmission } from "@/api/admissions";
import { useAdmissionExtractionEvents } from "@/hooks/useAdmissionExtractionEvents";
import { Button } from "@/ui/shared/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/ui/shared/card";
import { cn } from "@/utils/cn";

const MAX_FILE_SIZE_MB = 25;

export default function UploadAdmission() {
  const [file, setFile] = useState<File | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const { stage, messages, result, error } = useAdmissionExtractionEvents(jobId);

  const uploadMutation = useMutation({
    mutationFn: uploadAdmission,
    onSuccess: (data) => setJobId(data.jobId),
    onError: (err: Error) => toast.error(err.message),
  });

  useEffect(() => {
    if (stage === "review_ready" && result) {
      toast.success("Extraction complete — review the details");
      navigate(`/admissions/${result.id}/review`);
    }
  }, [stage, result, navigate]);

  function handleFileChange(selected: File | null) {
    if (!selected) {
      setFile(null);
      return;
    }
    if (selected.type !== "application/pdf") {
      toast.error("Please select a PDF file");
      return;
    }
    if (selected.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      toast.error(`File is too large (max ${MAX_FILE_SIZE_MB}MB)`);
      return;
    }
    setFile(selected);
  }

  function handleSubmit() {
    if (!file) return;
    setJobId(null);
    uploadMutation.mutate(file);
  }

  function reset() {
    setFile(null);
    setJobId(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  const isProcessing = jobId !== null && stage !== "failed";

  return (
    <div className="mx-auto w-full max-w-2xl py-10">
      <Card>
        <CardHeader>
          <CardTitle>Upload a registration form</CardTitle>
          <CardDescription>
            Upload a scan of a Soroti University registration form (1 to 4 pages). The handwritten
            fields will be extracted automatically and held for your review before being saved.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {!isProcessing && (
            <>
              <label
                htmlFor="admission-file"
                className={cn(
                  "flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border p-10 text-center transition-colors hover:border-primary cursor-pointer",
                  file && "border-primary"
                )}
              >
                {file ? <FileText className="h-10 w-10 text-primary" /> : <UploadCloud className="h-10 w-10 text-muted-foreground" />}
                <span className="text-sm font-medium">
                  {file ? file.name : "Click to choose a PDF, or drag it here"}
                </span>
                {file && (
                  <span className="text-xs text-muted-foreground">
                    {(file.size / (1024 * 1024)).toFixed(2)} MB
                  </span>
                )}
                <input
                  id="admission-file"
                  ref={inputRef}
                  type="file"
                  accept="application/pdf"
                  className="hidden"
                  onChange={(e) => handleFileChange(e.target.files?.[0] ?? null)}
                />
              </label>

              <div className="flex justify-end gap-2">
                {file && (
                  <Button variant="outline" onClick={reset} disabled={uploadMutation.isPending}>
                    Clear
                  </Button>
                )}
                <Button
                  variant="accent"
                  onClick={handleSubmit}
                  loading={uploadMutation.isPending}
                  disabled={!file}
                >
                  {uploadMutation.isPending ? "Uploading..." : "Upload & Extract"}
                </Button>
              </div>
            </>
          )}

          {isProcessing && (
            <div className="space-y-3">
              <ul className="space-y-2">
                {messages.map((message, index) => (
                  <li key={index} className="flex items-center gap-2 text-sm">
                    {index === messages.length - 1 && stage === "streaming" ? (
                      <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4 text-success" />
                    )}
                    {message}
                  </li>
                ))}
                {messages.length === 0 && (
                  <li className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" /> Connecting...
                  </li>
                )}
              </ul>
            </div>
          )}

          {stage === "failed" && (
            <div className="space-y-3 rounded-md border border-destructive/30 bg-destructive/10 p-4">
              <div className="flex items-center gap-2 text-sm font-medium text-destructive">
                <XCircle className="h-4 w-4" /> {error ?? "Extraction failed"}
              </div>
              <Button variant="outline" onClick={reset}>
                Try again
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
