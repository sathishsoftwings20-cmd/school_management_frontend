// src/components/auth/SignInForm.tsx
import { useState } from "react";
import { useNavigate } from "react-router"; // keep same import style
import { EyeCloseIcon, EyeIcon } from "../../icons";
import Label from "../ui/form/Label";
import Input from "../ui/form/InputField";
import Checkbox from "../ui/form/Checkbox";
import Button from "../ui/button/Button";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";

function validateEmail(email: string) {
  // simple email regex
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export default function SignInForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [isChecked, setIsChecked] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const { login } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!email.trim() || !password) {
      showToast({
        variant: "error",
        title: "Validation",
        message: "Email and password are required.",
      });
      return;
    }
    if (!validateEmail(email.trim())) {
      showToast({
        variant: "error",
        title: "Invalid Email",
        message: "Please enter a valid email address.",
      });
      return;
    }

    setBusy(true);
    try {
      await login(email.trim(), password, isChecked);
      showToast({
        variant: "success",
        title: "Signed in",
        message: "Welcome back!",
      });
      navigate("/"); // redirect to dashboard
    } catch (err: unknown) {
      console.error(err);
      let msg = "Login failed. Please check credentials.";
      interface ErrorResponse {
        response?: {
          data?: {
            message?: string;
          };
        };
      }

      const errorObj = err as ErrorResponse;

      if (
        typeof err === "object" &&
        err !== null &&
        "response" in err &&
        typeof errorObj.response === "object" &&
        errorObj.response !== null &&
        "data" in errorObj.response &&
        typeof errorObj.response.data === "object" &&
        errorObj.response.data !== null &&
        "message" in errorObj.response.data
      ) {
        msg = errorObj.response.data.message as string;
      }
      showToast({ variant: "error", title: "Login failed", message: msg });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col flex-1">
      {/* <div className="w-full max-w-md pt-10 mx-auto">
        <Link
          to="/"
          className="inline-flex items-center text-sm text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
        >
          <ChevronLeftIcon className="size-5" />
          Back to dashboard
        </Link>
      </div> */}
      <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
        <div>
          <div className="mb-5 sm:mb-8">
            <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
              Sign In
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Enter your email and password to sign in!
            </p>
          </div>

          {/* Removed social buttons & 'Or' divider - keep form only */}
          <form onSubmit={submit}>
            <div className="space-y-6">
              <div>
                <Label>
                  Email <span className="text-error-500">*</span>
                </Label>
                <Input
                  placeholder="info@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div>
                <Label>
                  Password <span className="text-error-500">*</span>
                </Label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <span
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute z-30 -translate-y-1/2 cursor-pointer right-4 top-1/2"
                  >
                    {showPassword ? (
                      <EyeIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
                    ) : (
                      <EyeCloseIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
                    )}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Checkbox checked={isChecked} onChange={setIsChecked} />
                  <span className="block font-normal text-gray-700 text-theme-sm dark:text-gray-400">
                    Keep me logged in
                  </span>
                </div>
                {/* removed forgot password link */}
                <div />
              </div>

              <div>
                <Button
                  className="w-full"
                  size="sm"
                  type="submit"
                  disabled={busy}
                >
                  {busy ? "Signing in..." : "Sign in"}
                </Button>
              </div>
            </div>
          </form>

          {/* removed signup link */}
        </div>
      </div>
    </div>
  );
}
