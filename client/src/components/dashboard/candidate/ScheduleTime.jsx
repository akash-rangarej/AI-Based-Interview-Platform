import { useEffect, useState } from "react";
import api from "../../../api/axiosClient";
import toast from "react-hot-toast";
import {
  Briefcase,
  CalendarDays,
  Clock3,
} from "lucide-react";

const formatTime = (date) =>
  new Date(date).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });

const generateSlots = (startTime, endTime, duration) => {
  const slots = [];
  const durMs = duration * 60000;
  let cursor = new Date(startTime);
  const end = new Date(endTime);
  while (cursor.getTime() + durMs <= end.getTime()) {
    const slotStart = new Date(cursor);
    const slotEnd = new Date(cursor.getTime() + durMs);
    slots.push({ start: slotStart, end: slotEnd });
    cursor = slotEnd;
  }
  return slots;
};

const ScheduleTime = ({
  confirmedBooking,
  setConfirmedBooking,
}) => {
  const [posts, setPosts] = useState([]);
  const [activePost, setActivePost] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [loadingList, setLoadingList] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [now, setNow] = useState(new Date());

 
const fetchPosts = async () => {
  setLoadingList(true);
  try {
    const res = await api.get("/interview-posts/dashboard");
    const activePosts = (res.data.posts || []).filter(
      (post) => post.status === "active"
    );
    setPosts(activePosts);
  } catch (err) {
    toast.error("Unable to load your interviews.");
  } finally {
    setLoadingList(false);
  }
};

useEffect(() => {
  if (!activePost) return;

  const interval = setInterval(() => {
    setNow(new Date());
  }, (activePost.duration * 60 * 1000) / 6);

  return () => clearInterval(interval);
}, [activePost]);

useEffect(() => {
  if (!confirmedBooking) {
    fetchPosts();
  }
}, [confirmedBooking]);

const refetch = () => {
  fetchPosts();
};

  const handlePickPost = (post) => {
  setErrorMsg("");
  setActivePost(post);
  setSelectedSlot(null);
};

  const handleSelectSlot = (slot) => {
  setSelectedSlot(slot);
};

  const handleConfirm = async () => {
    if (!selectedSlot) {
      toast.error("Please select a time slot first.");
      return;
    }
    setSubmitting(true);
    try {
      await api.post(`/interview-posts/${activePost._id}/select-slot`, {
        slotStart: selectedSlot.start,
      });
      toast.success("Slot confirmed! Check your email for details.");
      
      setPosts((prev) => prev.filter((p) => p._id !== activePost._id));

      setConfirmedBooking({
        roundName: activePost.roundName,
        role: activePost.role,
        jobDescription: activePost.jobDescription || activePost.description || "No description provided.",
        slot: selectedSlot,
      });
    

      setActivePost(null);
      setSelectedSlot(null);
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to confirm slot. Please try again.";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingList) {
    return <div className="text-white text-center py-10">Loading your interviews...</div>;
  }

  
  if (activePost) {
    const slots = generateSlots(activePost.startTime, activePost.endTime, activePost.duration);
    return (
      <div className="mx-auto max-w-5xl text-white">
 

  {/* Header */}
  <button
    onClick={() => {
      setActivePost(null);
      setSelectedSlot(null);
    }}
    className="mb-6 text-sm text-slate-400 transition-colors hover:text-white cursor-pointer"
  >
    ← Back to interviews
  </button>

  <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-8 shadow-lg">
    <div className="flex flex-col gap-2 border-b border-slate-800 pb-6">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300">
        Schedule Interview
      </p>

      <h2 className="text-3xl font-bold">
        {activePost.roundName}
      </h2>

      <p className="text-slate-400 text-lg">
        {activePost.role}
      </p>
    </div>

    {errorMsg ? (
      <div className="mt-6 rounded-lg border border-red-600 bg-red-900/30 p-4 text-red-300">
        {errorMsg}
      </div>
    ) : (
      <>
        {/* Instructions */}
        <div className="mt-6 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-5">
          <p className="text-slate-200 leading-7">
            Select a{" "}
            <span className="font-semibold text-emerald-300">
              {activePost.duration}-minute
            </span>{" "}
            interview slot between{" "}
            <span className="font-semibold text-white">
              {formatTime(activePost.startTime)}
            </span>{" "}
            and{" "}
            <span className="font-semibold text-white">
              {formatTime(activePost.endTime)}
            </span>{" "}
            on{" "}
            <span className="font-semibold text-white">
              {new Date(activePost.startTime).toLocaleDateString()}
            </span>.
          </p>
        </div>

        {/* Slots */}
        <div className="mt-8">
          <h3 className="mb-4 text-lg font-semibold">
            Available Slots
          </h3>

          {slots.length === 0 ? (
            <div className="rounded-lg border border-yellow-700 bg-yellow-900/20 p-5 text-center text-yellow-300">
              No slots are available for this interview window.
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {slots.map((slot, i) => {
                const isExpired = slot.start <= now;

                const isSelected =
                  selectedSlot &&
                  slot.start.getTime() === selectedSlot.start.getTime();

                return (
                  <button
                    key={i}
                    type="button"
                    disabled={isExpired}
                    onClick={() => handleSelectSlot(slot)}
                    className={`rounded-xl border px-4 py-3 text-sm font-medium transition-all ${
                      isExpired
                        ? "border-red-700 bg-red-600/20 text-red-300 cursor-not-allowed opacity-70"
                        : isSelected
                        ? "border-emerald-500 bg-emerald-600 text-white shadow-lg shadow-emerald-900/30"
                        : "border-slate-700 bg-slate-800 text-slate-200 hover:border-emerald-400 hover:bg-slate-700 cursor-pointer"
                    }`}
                  >
                    {formatTime(slot.start)}
                    <br />
                    <span className="text-xs opacity-80">
                      to {formatTime(slot.end)}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Selected Slot */}
        {selectedSlot && (
          <div className="mt-8 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4">
            <p className="text-sm text-slate-300">
              Selected Slot
            </p>

            <p className="mt-1 text-lg font-semibold text-emerald-300">
              {formatTime(selectedSlot.start)} –{" "}
              {formatTime(selectedSlot.end)}
            </p>
          </div>
        )}

        {/* Action */}
        <div className="mt-8 flex justify-end">
          <button
            onClick={handleConfirm}
            disabled={!selectedSlot || submitting}
            className="rounded-lg bg-emerald-600 px-6 py-3 font-medium text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
          >
            {submitting ? "Confirming..." : "Confirm Interview Slot"}
          </button>
        </div>
      </>
    )}
  </div>
</div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto text-white">
      <div className="mb-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300">
        Candidate Dashboard
      </p>
      <h2 className="mt-2 text-2xl font-semibold">
        Schedule Interview
      </h2>
      <p className="mt-1 text-sm text-slate-400">
        Select a convenient time for your upcoming interview.
      </p>
    </div>

    <button
      type="button"
      onClick={refetch}
      className="w-fit rounded-md border border-slate-700 px-4 py-2 text-sm text-slate-200 transition-colors hover:bg-slate-800 cursor-pointer"
    >
      Refresh
    </button>
  </div>

  {posts.length === 0 ? (
    <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-10 text-center">
      <p className="text-lg font-medium text-slate-200">
        No interviews pending
      </p>
      <p className="mt-2 text-sm text-slate-400">
        You don't have any interviews waiting to be scheduled right now.
      </p>
    </div>
      ) : (
        <div className="grid gap-4">
  {posts.map((post) => (
    <div
      key={post._id}
      className="group rounded-2xl border border-slate-800 bg-slate-900/70 p-6 transition-all duration-300 hover:border-emerald-500/40 hover:shadow-lg hover:shadow-emerald-900/20"
    >
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        {/* Left */}
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10">
              <Briefcase className="h-6 w-6 text-emerald-400" />
            </div>

            <div>
              <h3 className="text-xl font-semibold text-white">
                {post.roundName}
              </h3>
              <p className="text-sm text-slate-400">
                {post.role}
              </p>
            </div>
          </div>

          <div className="mt-5">
            <p className="text-sm font-medium text-slate-300">
              Job Description
            </p>

            <p className="mt-2 text-sm leading-6 text-slate-400 line-clamp-2">
              {post.jobDescription || "No job description provided."}
            </p>
          </div>

          {/* Info */}
          <div className="mt-5 flex flex-wrap gap-6 text-sm text-slate-400">
            <div className="flex items-center gap-2">
              <Clock3 className="h-4 w-4 text-emerald-400" />
              <span>{post.duration} mins</span>
            </div>

            <div className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-emerald-400" />
              <span>
                {new Date(post.interviewDate).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>

        {/* Right */}
        <div className="flex justify-end">
          <button
            onClick={() => handlePickPost(post)}
            className="rounded-xl bg-emerald-600 px-6 py-3 font-medium text-white transition-all duration-200 hover:bg-emerald-500 hover:shadow-lg hover:shadow-emerald-900/30 cursor-pointer"
          >
            Pick a Slot
          </button>
        </div>
      </div>
    </div>
  ))}
</div>
      )}
    </div>
  );
};

export default ScheduleTime;