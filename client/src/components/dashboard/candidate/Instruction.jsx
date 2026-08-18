import { Camera, Check, ClipboardCheck, Loader2, Mic, RefreshCcw, X } from "lucide-react";
import toast from "react-hot-toast";
import api from "../../../api/axiosClient";
import useDeviceCheck from "./hooks/useDeviceCheck";
import SpeedGauge from "./SpeedGauge";
import useNetworkCheck, {
  NETWORK_GAUGE_MAX_MBPS,
  NETWORK_POOR_MAX_MBPS,
  NETWORK_FAIR_MAX_MBPS,
} from "./hooks/useNetworkCheck";
import TermsAndConditionsModal from "./TermsAndConditionsModal";
import { useState } from "react";


export default function InstructionPage({ post, onBack, onStart }) {
  const [showTerms, setShowTerms] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const rules = [
    {
      icon: ClipboardCheck,
      title: "Recruiter Evaluation",
      desc: "Your recorded interview, including video, communication, and answers, will be reviewed as part of the evaluation process.",
    },
    {
      icon: Mic,
      title: "Speak clearly",
      desc: "Your voice is transcribed in real time. Speak at a natural pace.",
    },
    {
      icon: Camera,
      title: "Camera on",
      desc: "Keep your camera on throughout. Stay in frame at all times.",
    },
    {
      icon: RefreshCcw,
      title: "No retakes",
      desc: "Once you move to the next question, you cannot go back.",
    },
  ];

  const {
    videoRef,
    deviceStatus,
    audioLevel,
    startDeviceCheck,
    confirmDeviceCheck,
    retryDeviceCheck,
  } = useDeviceCheck();

  const { internetStatus, downloadMBps, pingMs, jitterMs, checkInternet } = useNetworkCheck();

  const allChecksPassed = deviceStatus === "success" && internetStatus === "success" && termsAccepted;

  const handleStart = async () => {
    // enter into fullscreen mode
    await document.documentElement.requestFullscreen()

    if (!allChecksPassed) {
      toast.error("Please complete all checks before starting.");
      return;
    }


    try {
      const response = await api.post(
        "/interview/start-interview",
        {
          postId: post._id,
          postedBy: post.postedBy,
          candidateId: post.candidateId,
          jobRole: post.role,
          jobDescription: post.jobDescription,
          skills: post.skills,
          difficulty: post.difficulty,
          numberOfQuestions: post.numberOfQuestions,
        }
      );

      const { interviewId, resumed } = response.data;

      if (resumed) {
        toast.success("Resuming your interview...");
      } else {
        toast.success("Interview started.");
      }

      onStart(interviewId);

      if (response.status === 201) {
        toast.success("Interview started.");
        onStart(response.data.interviewId);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Something went wrong");
      console.log(err.response?.data?.message)

    }
  }

  return (
    <div className="mx-auto max-w-2xl text-white">
      <button
        type="button"
        onClick={onBack}
        className="mb-6 flex items-center gap-1 text-sm text-slate-400 transition-colors hover:text-white cursor-pointer"
      >
        ← Back to dashboard
      </button>

      <section className="rounded-lg border border-slate-800 bg-slate-900/80 p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300">
          AI interview
        </p>
        <h1 className="mt-2 text-2xl font-semibold">{post?.role}</h1>

        <div className="mt-3 flex flex-wrap gap-2">
          {post?.skills?.map((skill) => (
            <span
              key={skill}
              className="rounded-full bg-emerald-950 px-2 py-0.5 text-xs text-emerald-200"
            >
              {skill}
            </span>
          ))}
        </div>

        <p className="mt-4 text-sm text-slate-40">
          Before starting, please review the Terms & Conditions, complete the
          camera & microphone check, and verify your internet connection. Once all
          checks are complete, you can begin your interview.
        </p>

        <div className="my-6 grid gap-3 sm:grid-cols-2">
          {rules.map((rule) => {
            const Icon = rule.icon;

            return (
              <div
                key={rule.title}
                className="rounded-lg border border-slate-800 bg-slate-950/60 p-4"
              >
                <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-md bg-slate-800 text-emerald-300">
                  <Icon size={18} />
                </div>
                <p className="text-sm font-medium text-white">{rule.title}</p>
                <p className="mt-1 text-xs leading-relaxed text-slate-400">
                  {rule.desc}
                </p>
              </div>
            );
          })}
        </div>

        {/* Camera + mic check */}
        <div className="mb-4 rounded-lg border border-slate-800 bg-slate-950/60 p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-slate-800 text-emerald-300">
                <Camera size={16} />
              </div>
              <div>
                <p className="text-sm font-medium text-white">Camera & microphone</p>
                <p className="text-xs text-slate-400">
                  {deviceStatus === "success"
                    ? "Confirmed. You're good to go."
                    : "Preview your feed before starting."}
                </p>
              </div>
            </div>

            {deviceStatus === "success" && (
              <span className="flex items-center gap-1 rounded-full border border-emerald-800 bg-emerald-950/50 px-2 py-1 text-xs text-emerald-300">
                <Check size={12} /> Ready
              </span>
            )}
            {deviceStatus === "error" && (
              <span className="flex items-center gap-1 rounded-full border border-red-900 bg-red-950/40 px-2 py-1 text-xs text-red-300">
                <X size={12} /> Blocked
              </span>
            )}
          </div>

          {(deviceStatus === "idle" || deviceStatus === "requesting" || deviceStatus === "error") && (
            <button
              type="button"
              onClick={startDeviceCheck}
              disabled={deviceStatus === "requesting"}
              className="mt-3 flex h-9 w-full items-center justify-center gap-2 rounded-md border border-slate-700 bg-slate-900 text-xs font-medium text-slate-200 transition-colors hover:border-slate-600 cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
            >
              {deviceStatus === "requesting" ? (
                <>
                  <Loader2 size={14} className="animate-spin" /> Requesting access...
                </>
              ) : deviceStatus === "error" ? (
                "Try again"
              ) : (
                "Check camera & microphone"
              )}
            </button>
          )}

          {deviceStatus === "previewing" && (
            <div className="mt-3">
              <div className="overflow-hidden rounded-md border border-slate-800 bg-black">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="aspect-video w-full -scale-x-100 object-cover"
                />
              </div>

              <div className="mt-3">
                <div className="mb-1 flex items-center justify-between text-[11px] text-slate-400">
                  <span className="flex items-center gap-1">
                    <Mic size={12} /> Mic level
                  </span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
                  <div
                    className="h-full rounded-full bg-emerald-500 transition-all duration-100"
                    style={{ width: `${audioLevel}%` }}
                  />
                </div>
                <p className="mt-1 text-[11px] text-slate-500">Say something to test your mic.</p>
              </div>

              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={confirmDeviceCheck}
                  className="h-9 flex-1 rounded-md bg-emerald-600 text-xs font-semibold text-white hover:bg-emerald-500 cursor-pointer"
                >
                  Looks good
                </button>
                <button
                  type="button"
                  onClick={retryDeviceCheck}
                  className="h-9 rounded-md border border-slate-700 px-3 text-xs font-medium text-slate-300 hover:border-slate-600 cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {deviceStatus === "success" && (
            <button
              type="button"
              onClick={retryDeviceCheck}
              className="mt-3 text-[11px] text-slate-500 underline decoration-slate-700 underline-offset-2 hover:text-slate-300 cursor-pointer"
            >
              Re-check
            </button>
          )}
        </div>

        {/* Internet check — speedometer style */}
        <div className="mb-6 rounded-lg border border-slate-800 bg-slate-950/60 p-4">
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="text-sm font-medium text-white">Internet speed</p>
              <p className="text-xs text-slate-400">
                {internetStatus === "success"
                  ? "Good enough for the interview."
                  : internetStatus === "error" && downloadMBps !== null
                    ? `Below the ${NETWORK_POOR_MAX_MBPS} MB/s minimum.`
                    : internetStatus === "error"
                      ? "Couldn't verify your connection."
                      : "Run a quick check before starting."}
              </p>
            </div>

            {internetStatus === "success" && (
              <span className="flex items-center gap-1 rounded-full border border-emerald-800 bg-emerald-950/50 px-2 py-1 text-xs text-emerald-300">
                <Check size={12} /> Ready
              </span>
            )}
            {internetStatus === "error" && (
              <span className="flex items-center gap-1 rounded-full border border-red-900 bg-red-950/40 px-2 py-1 text-xs text-red-300">
                <X size={12} /> Too slow
              </span>
            )}
          </div>

          <div className="mt-3 flex flex-col items-center">
            <SpeedGauge
              value={downloadMBps}
              max={NETWORK_GAUGE_MAX_MBPS}
              poorMax={NETWORK_POOR_MAX_MBPS}
              fairMax={NETWORK_FAIR_MAX_MBPS}
            />

            <div className="mt-1 grid w-full max-w-[260px] grid-cols-2 gap-3 border-t border-slate-800 pt-3">
              <div>
                <p className="text-[11px] text-slate-500">Ping</p>
                <p className="text-sm font-semibold text-white">
                  {pingMs !== null ? `${Math.round(pingMs)} ms` : "--"}
                </p>
              </div>
              <div>
                <p className="text-[11px] text-slate-500">Jitter</p>
                <p className="text-sm font-semibold text-white">
                  {jitterMs !== null ? `${Math.round(jitterMs)} ms` : "--"}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={checkInternet}
              disabled={internetStatus === "checking"}
              className={`mt-4 flex h-9 w-full max-w-[260px] items-center justify-center gap-2 rounded-md border text-xs font-medium transition-colors cursor-pointer disabled:cursor-not-allowed
                ${internetStatus === "success"
                  ? "border-emerald-800 bg-emerald-950/50 text-emerald-300"
                  : internetStatus === "error"
                    ? "border-red-900 bg-red-950/40 text-red-300"
                    : "border-slate-700 bg-slate-900 text-slate-200 hover:border-slate-600"
                }`}
            >
              {internetStatus === "checking" && <Loader2 size={14} className="animate-spin" />}
              {internetStatus === "idle" && "Run speed test"}
              {internetStatus === "checking" && "Testing..."}
              {internetStatus === "success" && "Re-test"}
              {internetStatus === "error" && "Retry"}
            </button>
          </div>
        </div>

        {/* terms and condition  */}
        <div className="mt-4 flex justify-center">
          <a
            className={`inline-block rounded-md px-3 py-2 text-sm transition-colors ${termsAccepted
                ? "cursor-not-allowed pointer-events-none text-green-400"
                : "cursor-pointer text-blue-500 hover:underline hover:text-blue-600"
              }`}
            onClick={() => {
              if (!termsAccepted) {
                setShowTerms(true);
              }
            }}
          >
            {termsAccepted
              ? "✓ Terms & Conditions Accepted"
              : "View Terms & Conditions"}
          </a>
        </div>
        <TermsAndConditionsModal
          isOpen={showTerms}
          onClose={() => setShowTerms(false)}
          onAccept={() => {
            setTermsAccepted(true);
            setShowTerms(false);
            console.log('User accepted terms');
          }}
        />

        <button
          type="button"
          onClick={handleStart}
          disabled={!allChecksPassed}
          className="h-11 w-full rounded-md bg-emerald-600 text-sm font-semibold text-white transition-colors hover:bg-emerald-500 cursor-pointer disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
        >
          {allChecksPassed ? "Start interview" : "Complete checks to continue"}
        </button>
      </section>
    </div>
  );
}