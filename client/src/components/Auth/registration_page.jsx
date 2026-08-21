import { useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { KeyRound, Mail, UserPlus, Eye, EyeOff } from "lucide-react";
import toast from "react-hot-toast";
import api, { getErrorMessage } from "../../api/axiosClient";
import { useAuthContext } from "../../context/AuthContext";

function RegistrationPage() {
  const navigate = useNavigate();
  const { login } = useAuthContext();
  const formRef = useRef(null);
  const nameRef = useRef(null);
  const emailRef = useRef(null);
  const passwordRef = useRef(null);
  const otpRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [showOtp, setShowOtp] = useState(false);
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const validatePassword = (password) => {
    const PasswordRegex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

    return PasswordRegex.test(password);
  };



  const handleSubmit = async (e) => {
    e.preventDefault();
 if (!isEmailVerified) {
    toast.error("Please verify your email before creating an account.");
    return;
  }
    const payload = {
      name: nameRef.current?.value?.trim(),
      email: emailRef.current?.value?.trim(),
      password: passwordRef.current?.value || "",
    };

    if (!payload.name || !payload.email || !payload.password) {
      toast.error("Please complete all registration fields.");
      return;
    }

    if (!validatePassword(payload.password)){
      toast.error("Password must be at least 8 characters long and contain one uppercase letter, one lowercase letter, one number, and one special character.");
      return;
    }

    setLoading(true);

    try {
      const response = await api.post("/auth/register", payload);
      login(response.data?.user);
      toast.success(response.data?.message || "Registration successful.");
      formRef.current?.reset();
      navigate("/dashboard", { replace: true });
    } catch (error) {
      toast.error(
        getErrorMessage(error, "Registration failed. Please try again.")
      );
    } finally {
      setLoading(false);
    }
  };
    const handleVerifyEmail = async () => {
    const email = emailRef.current?.value?.trim();
    try{ 
      const { data } = await api.post("/auth/verify-email", {
      email
    });
    toast.success(data.message || "Email verification initiated.");
    setShowOtp(true);
  }catch(error){
    toast.error(error.response?.data?.message ||"Failed to initiate email verification.");
  }


  }
  const handleOtpSubmit = async () => {
    try{
      const email = emailRef.current?.value?.trim();
    const otp = otpRef.current?.value?.trim();

    if (!email || !otp) {
      toast.error("Please enter both email and OTP.");
      return;
    }

    const { data } = await api.post("/auth/verify-email-otp", {
        email: emailRef.current.value,
    otp: otpRef.current.value,
    });
    setIsEmailVerified(true);
    setShowOtp(false);
    toast.success(data.message || "otp verified successfully.");
    }catch(error){
      toast.error(getErrorMessage(error, "Registration failed. Please try again."));
    }
  }

  return (
    <main className="relative z-10 mx-auto grid min-h-screen w-[min(1120px,calc(100%-32px))] grid-cols-1 items-center gap-7 py-8 md:grid-cols-[minmax(0,1fr)_minmax(360px,440px)] md:gap-12 md:py-12">
      <section className="max-w-xl" aria-label="Registration overview">
        <p className="mb-4 text-xs font-bold uppercase tracking-[0.16em] text-teal-300">
          Candidate access
        </p>
        <h1 className="m-0 text-4xl font-semibold leading-none tracking-normal text-white sm:text-5xl lg:text-7xl">
          Create your account
        </h1>
        <p className="mt-5 max-w-xl text-base leading-7 text-slate-300">
          Register once, then return directly to your dashboard after refreshes
          and future sign-ins.
        </p>
      </section>

      <section
        className="-mt-8 w-full rounded-lg border border-slate-500/25 bg-slate-900/90 p-7 text-white shadow-2xl shadow-black/30 backdrop-blur"
        aria-label="Registration form"
      >
        <div className="mb-2 flex items-start gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-teal-700 text-white">
            <UserPlus size={22} />
          </div>
          <div>
            <h2 className="m-0 text-2xl font-semibold text-white">Sign up</h2>
            <p className="mt-1 text-sm leading-6 text-slate-400">
              Candidate accounts are created with interview access.
            </p>
          </div>
        </div>

        <form ref={formRef} onSubmit={handleSubmit} className="grid gap-5">
          <label className="grid gap-2 text-sm font-semibold text-slate-200">
            <span>Full name</span>
            <div className="flex min-h-12 items-center gap-3 rounded-lg border border-slate-500/30 bg-slate-950/50 px-3 text-slate-400 focus-within:border-teal-300 focus-within:ring-4 focus-within:ring-teal-500/10">
              <UserPlus size={18} className="shrink-0" />
              <input
              required
                ref={nameRef}
                type="text"
                name="name"
                placeholder="Your full name"
                autoComplete="name"
                className="min-w-0 flex-1 bg-transparent text-white outline-none placeholder:text-slate-500"
              />
            </div>
          </label>

          <label className="grid gap-2 text-sm font-semibold text-slate-200">
            <span>Email</span>
            <div className="flex min-h-12 items-center gap-3 rounded-lg border border-slate-500/30 bg-slate-950/50 px-3 text-slate-400 focus-within:border-teal-300 focus-within:ring-4 focus-within:ring-teal-500/10">
              <Mail size={18} className="shrink-0" />
              <input
                ref={emailRef}
                type="email"
                name="email"
                placeholder="name@example.com"
                autoComplete="email"
                className="min-w-0 flex-1 bg-transparent text-white outline-none placeholder:text-slate-500"
                required
              />
            </div>

                      
          </label>

          {isEmailVerified ? (
          <span className="text-sm font-bold text-green-500">
            ✓ Email Verified
          </span>
        ) : (
          <button
            type="button"
            className="cursor-pointer w-fit border-0 bg-transparent text-sm font-bold text-teal-300 hover:text-teal-200"
            onClick={handleVerifyEmail}
          >
            Send OTP 
          </button>
        )}

          {showOtp && (
            <label className="grid gap-2 text-sm font-semibold text-slate-200">
            <span>Enter OTP</span>
            <div className="flex min-h-12 items-center gap-3 rounded-lg border border-slate-500/30 bg-slate-950/50 px-3 text-slate-400 focus-within:border-teal-300 focus-within:ring-4 focus-within:ring-teal-500/10">
              <KeyRound size={18} className="shrink-0" />
              <input
                ref={otpRef}
                type="text"
                name="otp"
                placeholder="Enter the OTP"
                className="min-w-0 flex-1 bg-transparent text-white outline-none placeholder:text-slate-500"
                required
              />
            </div>
            <button type="button" className="cursor-pointer w-fit border-0 bg-transparent text-sm font-bold text-teal-300 hover:text-teal-200 outline-black" onClick={handleOtpSubmit}>
            Verify otp
          </button>
          </label>
          
)}


          <label className="grid gap-2 text-sm font-semibold text-slate-200">
            <span>Password</span>

            <div className="flex min-h-12 items-center gap-3 rounded-lg border border-slate-500/30 bg-slate-950/50 px-3 text-slate-400 focus-within:border-teal-300 focus-within:ring-4 focus-within:ring-teal-500/10">
              <KeyRound size={18} className="shrink-0" />

              <input
                ref={passwordRef}
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Create password"
                className="min-w-0 flex-1 bg-transparent text-white outline-none placeholder:text-slate-500"
                required
              /> 

              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="text-slate-400 transition-colors hover:text-white"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </label>


          <button
            type="submit"
            className="cursor-pointer flex min-h-12 items-center justify-center rounded-lg bg-emerald-600 text-sm font-extrabold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={loading}
          >
            {loading ? "Creating account..." : "Create account"}
          </button>

          <p className="text-center text-sm text-slate-400">
            Already registered?{" "}
            <Link className="font-bold text-teal-300 hover:text-teal-200" to="/login">
              Login
            </Link>
          </p>
        </form>
      </section>
    </main>
  );
}

export default RegistrationPage;