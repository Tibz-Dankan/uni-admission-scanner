import { useMutation } from "@tanstack/react-query";
import { useFormik } from "formik";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import * as Yup from "yup";
import { signIn } from "@/api/auth";
import { useAuthStore } from "@/stores/authStore";
import { Button } from "@/ui/shared/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/ui/shared/card";
import { Input } from "@/ui/shared/input";
import { Label } from "@/ui/shared/label";

const validationSchema = Yup.object({
  email: Yup.string()
    .email("Enter a valid email")
    .required("Email is required"),
  password: Yup.string().required("Password is required"),
});

export default function SignIn() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);

  const signInMutation = useMutation({
    mutationFn: signIn,
    onSuccess: (auth) => {
      setAuth(auth);
      navigate("/admissions", { replace: true });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const formik = useFormik({
    initialValues: { email: "", password: "" },
    validationSchema,
    onSubmit: (values) => signInMutation.mutate(values),
  });

  return (
    <div className="mx-auto flex w-full max-w-md flex-col justify-center py-16">
      <img
        src="/sun-logo.png"
        alt="Soroti University"
        className="mx-auto mb-6 h-14 w-auto"
      />
      <Card>
        <CardHeader>
          <CardTitle>Sign in</CardTitle>
          <CardDescription>
            Sign in with your account to continue.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={formik.handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="you@soroti.ac.ug"
                value={formik.values.email}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
              />
              {formik.touched.email && formik.errors.email && (
                <p className="text-xs text-destructive">
                  {formik.errors.email}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                value={formik.values.password}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
              />
              {formik.touched.password && formik.errors.password && (
                <p className="text-xs text-destructive">
                  {formik.errors.password}
                </p>
              )}
            </div>

            <Button
              type="submit"
              variant="accent"
              className="w-full"
              loading={signInMutation.isPending}
            >
              {signInMutation.isPending ? "Signing in..." : "Sign in"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
