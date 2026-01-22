import { redirect } from "next/navigation";
import { isDemoModeEnabled } from "@/lib/demo-mode";
import { DemoSigninForm } from "./demo-signin-form";

/**
 * Demo Signin Page (Server Component)
 *
 * Security: Redirects to /signin if demo mode is disabled.
 * This prevents the demo signin UI from being shown in production
 * even if someone navigates directly to /demo-signin.
 *
 * In production, isDemoModeEnabled() always returns false regardless
 * of environment variables, so this page will always redirect.
 */
export default function DemoSigninPage() {
  // Redirect to regular signin if demo mode is disabled
  if (!isDemoModeEnabled()) {
    redirect("/signin");
  }

  return <DemoSigninForm />;
}
