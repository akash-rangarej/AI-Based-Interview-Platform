import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../../../api/axiosClient";
import socket from "../../../socket/socketclient";
import { useTabSwitchGuard } from "../../../hooks/useTabSwitchGuard";
import { useMediaRecorder } from "./hooks/useMediaRecorder";
import { useSpeechSynthesis } from "./hooks/useTextToSpeech";
import { useRealtimeAudio } from "./hooks/useRealtimeAudio";
import { useNavigationGuard } from "./hooks/useNavigationGuard";

const TOTAL_QUESTIONS = 6;
const TIME_PER_QUESTION = 120;

const steps = [
  "Introduction",
  "Experience",
  "Technical skills",
  "Problem solving",
  "Behavioral",
  "Wrap up",
];

export default function InterviewScreen({ interviewId }) {
  const navigate = useNavigate();

  const [question, setQuestion] = useState(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(TIME_PER_QUESTION);
  const [submitting, setSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const answerPhaseStartedRef = useRef(false);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [showTabSwitchModal, setShowTabSwitchModal] = useState(false);
  const [inputMode, setInputMode] = useState("voice");
  const [typedAnswer, setTypedAnswer] = useState("");
  const [liveTranscript, setLiveTranscript] = useState("");
  const [isRecordingAnswer, setIsRecordingAnswer] = useState(false);
  const [backButton,setBackbutton]=useState(false);
  const [interviewcompleted, setinterviewcompleted] = useState(false);

  const timerRef = useRef(null);
  const videoRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const isFetchingQuestionRef = useRef(false);

  
  const liveTranscriptRef = useRef("");

  const questionSeqRef = useRef(0);

  const {
    startRecording: startVideoRecording,
    stopRecording: stopVideoRecording,
    recording,
    streamRef,
  } = useMediaRecorder();

  const {
    startStreaming,
    stopStreaming
  } = useRealtimeAudio();

  // socket test
  useEffect(() => {

    socket.connect();

    socket.on("connect", () => {

      console.log("Connected:", socket.id);

      socket.emit("join_interview", {
        interviewId,
      });

    });

    socket.on("joined_interview", (data) => {

      console.log("Joined interview:", data.interviewId);

    });

    socket.on("transcript", (data) => {

      console.log("Transcript:", data);

      // Drop anything left over from a question we've already moved on
      // from — this is what stops a late-arriving event from a previous
      // answer showing up appended to the current one.
      if (data.questionSeq !== questionSeqRef.current) {
        return;
      }
      liveTranscriptRef.current = data.fullTranscript;
      setLiveTranscript(data.fullTranscript);

    });

    return () => {

      socket.off("connect");
      socket.off("joined_interview");
      socket.off("transcript");

      socket.disconnect();

    };

  }, [interviewId]);

// for locking the esc and cntrlc and v
useEffect(() => {
  // 1. Right-click block
  const handleContextMenu = (event) => {
    event.preventDefault();
  };

  // 2. Keyboard shortcuts block (Copy, Paste)
  const handleKeyDown = (event) => {
    const isCopyOrPaste = event.key === "c" || event.key === "v" || event.key === "C" || event.key === "V";
    if ((event.ctrlKey || event.metaKey) && isCopyOrPaste) {
      event.preventDefault();
      event.stopPropagation();
    }
  };

  // 3. Monitor Fullscreen Transitions
  const handleFullscreenChange = async () => {
    if (document.fullscreenElement) {
      // Check if browser supports the Keyboard Lock feature
      const supportsKeyboardLock = ('keyboard' in navigator) && ('lock' in navigator.keyboard);
      
      if (supportsKeyboardLock) {
        try {
          // Trap the Escape key inside the webpage
          await navigator.keyboard.lock(['Escape']);
          console.log('Escape key successfully locked inside fullscreen mode.');
        } catch (error) {
          console.error('Failed to lock the keyboard:', error);
        }
      }
    } else {
      // If they somehow managed to exit, release the lock and show your warning
      if ('keyboard' in navigator && 'unlock' in navigator.keyboard) {
        navigator.keyboard.unlock();
      }
      toast.error("Security Warning: Please return to fullscreen mode immediately.");
    }
  };

  // 4. Attach all listeners
  document.addEventListener('contextmenu', handleContextMenu);
  window.addEventListener("keydown", handleKeyDown, true);
  document.addEventListener('fullscreenchange', handleFullscreenChange);

  // 5. Cleanup function
  return () => {
    if(interviewcompleted === true){
      document.removeEventListener('contextmenu', handleContextMenu);
      window.removeEventListener("keydown", handleKeyDown, true);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      if ('keyboard' in navigator && 'unlock' in navigator.keyboard) {
        navigator.keyboard.unlock();
      }
    }
  };
}, []);



  const isFirstModeRenderRef = useRef(true);

useEffect(() => {
  if (isFirstModeRenderRef.current) {
    isFirstModeRenderRef.current = false;
    return;
  }

  // Question is still being read aloud — nothing to toggle yet.
  // The speak() callback above will respect inputMode once it starts.
  if (!answerPhaseStartedRef.current) {
    return;
  }

  if (inputMode === "text") {
    stopStreaming();
    setIsRecordingAnswer(false);
  } else {
    setIsRecordingAnswer(true);
    startStreaming(mediaStreamRef.current);
  }
}, [inputMode]);


  const { speak, stopSpeaking } = useSpeechSynthesis();

const cleanupSession = useCallback(() => {
  clearInterval(timerRef.current);
  stopSpeaking();
  stopStreaming();
  setIsRecordingAnswer(false);
  // Stop MediaRecorder if it's still recording
  stopVideoRecording().catch(() => { });
  // Stop camera + microphone
  if (mediaStreamRef.current) {
    mediaStreamRef.current.getTracks().forEach((track) => {
      track.stop();
    });
    mediaStreamRef.current = null;
  }
  // Remove video source
  if (videoRef.current) {
    videoRef.current.srcObject = null;
  }

  // Exit fullscreen if still active
  // if (document.fullscreenElement) {
  //   document.exitFullscreen().catch(() => { });
  // }
}, [
  stopSpeaking,
  stopStreaming,
  stopVideoRecording,
]);


  // for tab switch violation
  const handleMalpractice = useCallback(
    (reason) => {
      cleanupSession();

      toast.error(
        reason === "tab-switch"
          ? "Tab switch detected. Interview session closed."
          : "Interview focus lost. Session closed."
      );

      navigate("/dashboard", {
        replace: true,
        state: { malpractice: true },
      });
    },
    [cleanupSession, navigate]
  );

useTabSwitchGuard({
  enabled: true,
  maxViolations: 2,

  onWarning: ({ count, remaining }) => {
    setShowWarningModal(true);
  },

  onViolation: async () => {
    cleanupSession();
    setShowWarningModal(false); // in case it was still open
    setShowTabSwitchModal(true);

    try {
      await api.post(`/interview/interview-violation`, {
        isviolated: true,
      });
    } catch (err) {
      console.error(err);
    }
  },
});

const fetchQuestion = useCallback(async () => {


  // Prevent concurrent requests
  if (isFetchingQuestionRef.current) {
    return;
  }

  isFetchingQuestionRef.current = true;

  setLoading(true);

  try {

    const res = await api.get(
      `/interview/${interviewId}/question`
    );

    if (!res.data.question) {
      return;
    }

    setQuestion(res.data.question);

    questionSeqRef.current += 1;
    console.log("question no:", questionSeqRef.current)
    socket.emit("start_question");

liveTranscriptRef.current = "";
setLiveTranscript("");
setTypedAnswer("");

stopSpeaking();

answerPhaseStartedRef.current = false; // reset — TTS is about to play

speak(
  res.data.question.questionText,
  async () => {

    answerPhaseStartedRef.current = true; // TTS done, answering has started

    if (inputMode === "voice") {
      setIsRecordingAnswer(true);
      await startStreaming(mediaStreamRef.current);
    }
    // if inputMode is "text" when the question loads, stay silent —
    // don't start streaming until they toggle to voice
  }
);

    setQuestionIndex((prev) => prev + 1);

    setTimeLeft(TIME_PER_QUESTION);

  } catch (err) {

    toast.error(
      "Failed to load question. Please try again."
    );

  } finally {

    isFetchingQuestionRef.current = false;

    setLoading(false);

  }

}, [
  interviewId,
  speak,
  stopSpeaking,
  startStreaming,
  inputMode,
]);

  useEffect(() => {
    const init = async () => {
      try {
        const stream =
          await navigator.mediaDevices.getUserMedia({

            video: true,

            audio: true,

          });

        mediaStreamRef.current = stream;

        await startVideoRecording(stream);



        if (videoRef.current) {

          videoRef.current.srcObject = stream;

        }
        await fetchQuestion();

      } catch {
        toast.error(
          "Camera or microphone could not be started."
        );
      }
    };

    init();

    return () => {
      cleanupSession();
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const uploadAnswer = useCallback(async (videoBlob, transcriptText) => {

    const formData = new FormData();

    formData.append(
      "video",
      videoBlob,
      `q${questionIndex}.webm`
    );

    formData.append(
      "questionId",
      question._id
    );

    formData.append(
      "transcript",
      transcriptText || ""
    );

    await api.post(
      `/interview/${interviewId}/answer`,
      formData
    );

    ans_countref.current +=1
    console.log("ans no:", ans_countref.current)
  }, [
    interviewId,
    question,
    questionIndex,
  ]);


  const handleNext = useCallback(async () => {
    if (submitting || !question) {
      return;
    }

    clearInterval(timerRef.current);

    stopSpeaking();

    setSubmitting(true);

    try {

      // Force OpenAI to finalize any speech still sitting in the buffer
      // before we read the transcript, so the last sentence before "Next"
      // isn't lost.
    if (inputMode === "voice") {
  await new Promise((resolve) => {
    const timeout = setTimeout(() => {
      socket.off("transcript_commit_complete", onComplete);
      resolve(); // don't hang forever even if backend never responds
    }, 5000);

    const onComplete = () => {
      clearTimeout(timeout);
      resolve();
    };

    socket.once("transcript_commit_complete", onComplete);
    socket.emit("commit_audio");
  });
}

      if (inputMode === "voice") {
        await stopStreaming();
      }
      setIsRecordingAnswer(false);

        const videoBlob = await stopVideoRecording();

        await uploadAnswer(
          videoBlob,
          inputMode === "text" ? typedAnswer : liveTranscriptRef.current
        );

      if (questionIndex >= TOTAL_QUESTIONS) {
        await api.post(
          `/interview/${interviewId}/submit`,
          {}
        );

        setinterviewcompleted(true)

        cleanupSession();
        setShowSuccessModal(true);
        return;
      }

      await startVideoRecording(
        mediaStreamRef.current
      );


      if (videoRef.current) {
        videoRef.current.srcObject = mediaStreamRef.current;
      }

      //  await uploadPromise,
      await fetchQuestion()

    } catch (err) {
      toast.error( err?.response?.data?.message 
      );
    }
    finally {
      setSubmitting(false);
    }
  }, [
    cleanupSession,
    fetchQuestion,
    interviewId,
    question,
    questionIndex,
    startVideoRecording,
    stopVideoRecording,
    stopSpeaking,
    submitting,
    uploadAnswer,
    inputMode,
    typedAnswer,
  ]);

  
  useEffect(() => {
    if (!question) {
      return undefined;
    }

    clearInterval(timerRef.current);

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          handleNext();
          return 0;
        }

        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [handleNext, question]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
      .toString()
      .padStart(2, "0");
    const secs = (seconds % 60).toString().padStart(2, "0");
    return `${mins}:${secs}`;
  };

  const isLastQuestion = questionIndex >= TOTAL_QUESTIONS;
  const isLowTime = timeLeft <= 30;

  return (
    <div className="min-h-screen bg-[#0a0f1d] p-4 text-white sm:p-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <span className="rounded-full border border-slate-700 bg-slate-900 px-3 py-1 text-xs text-slate-400">
            AI Interview
          </span>
          <span className="text-sm text-slate-400">
            Question {questionIndex} of {TOTAL_QUESTIONS}
          </span>
        </div>
        <div
          className={`flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium ${isLowTime
            ? "bg-red-950 text-red-200"
            : "bg-amber-950 text-amber-200"
            }`}
        >
          <span
            className={`h-2 w-2 rounded-full ${isLowTime ? "bg-red-400" : "bg-amber-400"
              }`}
          />
          {formatTime(timeLeft)} remaining
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="flex flex-col gap-4 lg:col-span-2">
            <section className="rounded-lg border border-slate-800 bg-slate-900 p-5 min-h-[140px]">
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                Current question
              </p>
              {loading ? (
                <p className="animate-pulse text-sm text-slate-400">
                  Generating question...
                </p>
              ) : (
                <p className="text-lg font-medium leading-relaxed">
                  {question?.questionText}
                </p>
              )}
            </section>

                        <section className="flex flex-1 flex-col gap-4 rounded-lg border border-slate-800 bg-slate-900 p-5">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-red-500" />
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                    Live transcript
                  </p>
                </div>

                {inputMode === "text" ? (
                  <textarea
                    value={typedAnswer}
                    onChange={(e) => setTypedAnswer(e.target.value)}
                    placeholder="Type your answer here..."
                    className="min-h-[240px] flex-1 resize-none rounded-md border border-slate-700 bg-slate-950 p-4 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                ) : (
                  <div className="min-h-[240px] flex-1 text-sm leading-relaxed text-slate-300">
                    {liveTranscript || (
                      <span className="text-slate-600">
                        Start speaking. Your answer will appear here.
                      </span>
                    )}
                    {isRecordingAnswer && (
                      <span className="ml-1 inline-block h-4 w-0.5 animate-pulse bg-white align-middle" />
                    )}
                  </div>
                )}

                <div className="flex flex-col gap-3 border-t border-slate-800 pt-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="text-xs text-slate-500">
                    {isRecordingAnswer ? "Listening..." : "Mic off"}
                  </div>

                  <div className="flex items-center gap-3">
                    {/* Segmented Voice/Type toggle */}
                    <div className="relative flex rounded-full bg-slate-800 p-1">
                      <button
                        type="button"
                        onClick={() => setInputMode("voice")}
                        className={`relative z-10 flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-semibold transition-colors duration-200 ${
                          inputMode === "voice" ? "text-white" : "text-slate-400 hover:text-slate-200"
                        }`}
                      >
                        🎤 Voice
                      </button>
                      <button
                        type="button"
                        onClick={() => setInputMode("text")}
                        className={`relative z-10 flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-semibold transition-colors duration-200 ${
                          inputMode === "text" ? "text-white" : "text-slate-400 hover:text-slate-200"
                        }`}
                      >
                        ⌨️ Type
                      </button>
                      <span
                        className={`absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-full bg-emerald-600 transition-transform duration-200 ease-out ${
                          inputMode === "text" ? "translate-x-full" : "translate-x-0"
                        }`}
                        style={{ left: "4px" }}
                      />
                    </div>

                    <button
                      type="button"
                      onClick={handleNext}
                      disabled={loading || submitting}
                      className="h-10 rounded-md bg-emerald-600 px-5 text-sm font-semibold text-white hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
                    >
                      {submitting
                        ? "Saving..."
                        : isLastQuestion
                          ? "Submit interview"
                          : "Next question"}
                    </button>
                  </div>
                </div>
              </section>
        </div>

        <aside className="flex flex-col gap-4">
          <section className="flex-1 rounded-lg border border-slate-800 bg-slate-900 p-5">
            <p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              Progress
            </p>
            <div className="flex flex-col gap-3">
              {steps.map((step, index) => {
                const stepIndex = index + 1;
                const status =
                  stepIndex < questionIndex
                    ? "done"
                    : stepIndex === questionIndex
                      ? "active"
                      : "pending";

                return (
                  <div key={step} className="flex items-center gap-3">
                    <div
                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-medium ${status === "done"
                        ? "bg-emerald-950 text-emerald-300"
                        : ""
                        } ${status === "active" ? "bg-white text-slate-900" : ""
                        } ${status === "pending"
                          ? "bg-slate-800 text-slate-500"
                          : ""
                        }`}
                    >
                      {status === "done" ? "OK" : stepIndex}
                    </div>
                    <span
                      className={`text-sm ${status === "done" ? "text-slate-500 line-through" : ""
                        } ${status === "active" ? "font-medium text-white" : ""} ${status === "pending" ? "text-slate-600" : ""
                        }`}
                    >
                      {step}
                    </span>
                  </div>
                );
              })}
            </div>
          </section>
        </aside>
      </div>

      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-md rounded-lg border border-slate-700 bg-slate-900 p-8 text-center">
            <h2 className="mb-3 text-2xl font-bold text-white">
              Interview submitted
            </h2>
            <p className="mb-6 text-slate-300">
              Your responses and evaluation data have been submitted to the
              recruiter.
            </p>
            <button
              type="button"
              onClick={() => {
                cleanupSession()
                navigate("/dashboard", { replace: true })
              }}
              className="rounded-md bg-emerald-600 px-6 py-3 font-semibold text-white hover:bg-emerald-500 cursor-pointer"
            >
              Go to dashboard
            </button>
          </div>
        </div>
      )}

      {showWarningModal && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
    <div className="w-full max-w-md rounded-lg border border-amber-700 bg-slate-900 p-8 text-center">
      <h2 className="mb-3 text-2xl font-bold text-amber-400">
        Tab switch detected
      </h2>
      <p className="mb-6 text-slate-300">
        Switching tabs again will end your interview immediately.
      </p>
      <button
        type="button"
        onClick={() => setShowWarningModal(false)}
        className="rounded-md bg-amber-600 px-6 py-3 font-semibold text-white hover:bg-amber-500 cursor-pointer"
      >
        Continue interview
      </button>
    </div>
  </div>
)}

      {showTabSwitchModal && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
    <div className="w-full max-w-md rounded-lg border border-red-900 bg-slate-900 p-8 text-center">
      <h2 className="mb-3 text-2xl font-bold text-red-400">
        Interview cancelled
      </h2>
      <p className="mb-6 text-slate-300">
        You switched away from this tab. For fairness to all candidates,
        the interview session ends immediately when that happens.
      </p>
      <button
        type="button"
        onClick={() => navigate("/dashboard", { replace: true, state: { malpractice: true } })}
        className="rounded-md bg-red-600 px-6 py-3 font-semibold text-white hover:bg-red-500 cursor-pointer"
      >
        Return to dashboard
      </button>
    </div>
  </div>
)}
    </div>
  );
}