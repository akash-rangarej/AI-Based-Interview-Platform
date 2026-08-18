import { useCallback, useEffect, useState, useRef} from "react";
import api from "../../../api/axiosClient";
import { useFetchData } from "../../../hooks/useFetchData";
import toast from "react-hot-toast";

const JOIN_WINDOW_MS = 10 * 60 * 1000; // 10 minutes

const TimeLeft = ({ startTime }) => {
  const [message, setMessage] = useState("");

  useEffect(() => {
    const calc = () => {
      const now = new Date();
      const start = new Date(startTime);
      const joinDeadline = new Date(start.getTime() + JOIN_WINDOW_MS);

      // Before interview starts
      if (now < start) {
        const diff = start - now;

        const hrs = Math.floor(diff / 1000 / 60 / 60);
        const mins = Math.floor((diff / 1000 / 60) % 60);
         const secs = Math.floor((diff / 1000) % 60);

        setMessage(
          hrs > 0
            ? `Starts in ${hrs}h ${mins}m`
            : `Starts in ${mins}m ${secs}s`
        );
        return;
      }

      // Inside the 10-min join window
      if (now <= joinDeadline) {
        const diff = joinDeadline - now;

        const mins = Math.floor(diff / 1000 / 60);
        const secs = Math.floor((diff / 1000) % 60);

        setMessage(`interview closes in ${mins}m ${secs}s`);
        return;
      }

      // Join window has passed
      setMessage("interview window has ended");
    };

    calc();

    const interval = setInterval(calc, 1000);

    return () => clearInterval(interval);
  }, [startTime]);

  return (
    <span className="text-xs font-medium text-amber-300">
      {message}
    </span>
  );
};





const CandidateDashboard = ({ onAttend }) => {
  const [now, setNow] = useState(() => new Date()); 
  const toastLockRef = useRef(false);

  const fetchPosts = useCallback(async () => {
    const { data } = await api.get("/interview-posts/dashboard");
    const allPosts = data.posts || [];
    return allPosts.filter((post) => post.status === "scheduled");
  }, []);

  const isChromeBrowser = () => {
    if (navigator.userAgentData) {
      return navigator.userAgentData.brands.some(
        (brand) => brand.brand === "Google Chrome"
      );
    }

    return (
      /Chrome/.test(navigator.userAgent) &&
      /Google Inc/.test(navigator.vendor) &&
      !/Edg/.test(navigator.userAgent) &&
      !/OPR/.test(navigator.userAgent)
    );
  };

  const showToastOnce = (message) => {
  if (toastLockRef.current) return; 

  toastLockRef.current = true;
  toast.error(message);

  setTimeout(() => {
    toastLockRef.current = false;
  }, 3200); 
};

  const getDashboardError = useCallback((err) => {
    const msg =
      err.response?.data?.message || err.message || "Failed to load interviews.";
    const status = err.response?.status;

    if (status === 401) {
      return "Session expired. Please login again.";
    }

    if (status === 403) {
      return "Access denied. Only candidates can view this page.";
    }

    return `Error: ${msg}`;
  }, []);

  const {
    data: posts,
    loading,
    error,
    refetch,
  } = useFetchData(fetchPosts, {
    initialData: [],
    getErrorMessage: getDashboardError,
  });

  useEffect(() => {
    if (!posts.length) return;

    let timeoutId;

    const scheduleNextBoundary = () => {
      const current = new Date();

      const upcomingBoundaries = posts
        .flatMap((post) => [new Date(post.startTime), new Date(post.endTime)])
        .filter((boundary) => boundary > current);

      if (upcomingBoundaries.length === 0) return;

      const nearestBoundary = new Date(Math.min(...upcomingBoundaries));
      const calculatedDelay = nearestBoundary - current;

      timeoutId = setTimeout(() => {
        setNow(new Date());
        scheduleNextBoundary();
      }, calculatedDelay);
    };

    scheduleNextBoundary();

    return () => clearTimeout(timeoutId);
  }, [posts]);

  if (loading) {
    return (
      <div className="flex h-48 items-center justify-center text-slate-400">
        Loading interviews...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-48 flex-col items-center justify-center gap-3">
        <div className="text-center text-red-300">{error}</div>
        <button
          type="button"
          onClick={refetch}
          className="rounded-md bg-slate-700 px-4 py-2 text-sm text-white hover:bg-slate-600 cursor-pointer"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl text-white">
      <div className="mb-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300">
            Candidate dashboard
          </p>
          <h2 className="mt-2 text-2xl font-semibold">Available interviews</h2>
        </div>
        <button
          type="button"
          onClick={refetch}
          className="w-fit rounded-md border border-slate-700 px-4 py-2 text-sm text-slate-200 hover:bg-slate-800"
        >
          Refresh
        </button>
      </div>

      {posts.length === 0 ? (
        <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-10 text-center text-slate-400">
          No interviews available right now.
        </div>
      ) : (
        <div className="grid gap-4">
          {posts.map((post) => {
            const now = new Date();
            const start = new Date(post.startTime);
           const joinDeadline = new Date(start.getTime() + JOIN_WINDOW_MS);

            const hasStarted = now >= start;
            const hasExpired = now > joinDeadline;

            return (
              <article
                key={post._id}
                className="rounded-lg border border-slate-800 bg-slate-900/80 p-5 shadow-lg shadow-black/10"
              >
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-semibold">{post.role}</h3>

                      <span className="rounded-full bg-slate-800 px-2 py-0.5 text-xs text-slate-300">
                        {post.roundName}
                      </span>
                    </div>

                    <div className="mb-3 flex flex-wrap gap-2">
                      {post.skills?.map((skill) => (
                        <span
                          key={skill}
                          className="rounded-full bg-emerald-950 px-2 py-0.5 text-xs text-emerald-200"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>

                    <div className="mb-2 flex flex-wrap gap-3 text-sm text-slate-400">
                      <span>
                        {post.candidateType === "fresher"
                          ? "Fresher"
                          : `${post.minExperience}-${post.maxExperience} yrs`}
                      </span>

                      {post.difficulty && <span>{post.difficulty}</span>}
                    </div>

                    <div className="space-y-1">
                      <p className="text-xs text-slate-400">
                        Starts:{" "}
                        {new Date(post.startTime).toLocaleString([], {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </p>

                      <TimeLeft
                        startTime={post.startTime}
                        endTime={post.endTime}
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      if (!isChromeBrowser()) {
                        alert("Your browser does not support the required interview features. Please use Google Chrome.");
                        return;
                      }
                      if (!hasStarted) {
                       showToastOnce("Your interview hasn't started yet.");
                        return;
                      }

                      if (hasExpired) {
                        showToastOnce("This interview window has expired.");
                        return;
                      }

                      onAttend(post);
                    }}
                    className={`h-11 shrink-0 rounded-md px-5 text-sm font-semibold text-white transition-colors cursor-pointer ${hasExpired
                        ? "bg-red-600 hover:bg-red-500"
                        : hasStarted
                          ? "bg-emerald-600 hover:bg-emerald-500"
                          : "bg-slate-700 hover:bg-slate-600"
                      }`}
                  >
                    {hasExpired
                      ? "Expired"
                      : hasStarted
                        ? "Start Interview"
                        : "Not Started"}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CandidateDashboard;
