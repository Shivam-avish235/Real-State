import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authApi } from "@/features/auth/api/auth.api";
import { AuthShell } from "@/features/auth/components/auth-shell";
import { type RegisterFormValues, registerFormSchema } from "@/features/auth/schemas/auth.schemas";
import { useAuthStore } from "@/store/auth.store";

const parseError = (error: unknown): string => {
  if (axios.isAxiosError<{ message?: string }>(error)) {
    return error.response?.data?.message ?? "Registration failed. Please try again.";
  }

  return "Registration failed. Please try again.";
};

export const RegisterPage = () => {
  const navigate = useNavigate();
  const setSession = useAuthStore((state) => state.setSession);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerFormSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      password: "",
      confirmPassword: ""
    }
  });

  const onSubmit = form.handleSubmit(async (values) => {
    setSubmitError(null);

    try {
      const payload = await authApi.register({
        firstName: values.firstName,
        lastName: values.lastName,
        email: values.email,
        phone: values.phone || undefined,
        password: values.password
      });

      setSession(payload.user, payload.accessToken);
      navigate("/dashboard", { replace: true });
    } catch (error) {
      setSubmitError(parseError(error));
    }
  });

  return (
    <AuthShell
      title="Create your account"
      description="Your first account becomes Admin automatically."
      footer={
        <>
          Already registered?{" "}
          <Link to="/login" className="font-semibold text-primary underline-offset-4 hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <form className="space-y-4" onSubmit={onSubmit}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="firstName">First name</Label>
            <Input id="firstName" placeholder="Jane" {...form.register("firstName")} />
            {form.formState.errors.firstName ? <p className="text-xs text-danger">{form.formState.errors.firstName.message}</p> : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="lastName">Last name</Label>
            <Input id="lastName" placeholder="Smith" {...form.register("lastName")} />
            {form.formState.errors.lastName ? <p className="text-xs text-danger">{form.formState.errors.lastName.message}</p> : null}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" autoComplete="email" placeholder="name@company.com" {...form.register("email")} />
          {form.formState.errors.email ? <p className="text-xs text-danger">{form.formState.errors.email.message}</p> : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Phone (optional)</Label>
          <Input id="phone" type="tel" placeholder="+1 555 0100" {...form.register("phone")} />
          {form.formState.errors.phone ? <p className="text-xs text-danger">{form.formState.errors.phone.message}</p> : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input id="password" type="password" autoComplete="new-password" placeholder="Create a strong password" {...form.register("password")} />
          {form.formState.errors.password ? <p className="text-xs text-danger">{form.formState.errors.password.message}</p> : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirm password</Label>
          <Input id="confirmPassword" type="password" autoComplete="new-password" placeholder="Re-enter your password" {...form.register("confirmPassword")} />
          {form.formState.errors.confirmPassword ? (
            <p className="text-xs text-danger">{form.formState.errors.confirmPassword.message}</p>
          ) : null}
        </div>

        {submitError ? <Alert variant="danger">{submitError}</Alert> : null}

        <Button className="w-full" type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? "Creating account..." : "Create account"}
        </Button>
      </form>
    </AuthShell>
  );
};
