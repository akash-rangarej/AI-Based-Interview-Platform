// CandidateLayout.jsx

import {
  Menu, X, BarChart3, Bell, ChevronDown, Cpu,
  HelpCircle, History, LogOut, Search, Settings, User,
} from "lucide-react";
import { useState } from "react";
import MyProfile from "../components/dashboard/candidate/MyProfile";
import CandidateDashboard from "../components/dashboard/candidate/InterviewDashboard";
import InstructionPage from "../components/dashboard/candidate/Instruction"; 
import InterviewScreen from "../components/dashboard/candidate/InterviewScreen";
import ViewProfile from "../components/dashboard/candidate/ViewProfile";

const CandidateLayout = ({ onLogout, user }) => {
  const [isProfileOpen,  setIsProfileOpen]  = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeItem,     setActiveItem]     = useState("AI Resume Analysis");
  const [selectedPost,   setSelectedPost]   = useState(null); 
  const [activeInterviewId, setActiveInterviewId] = useState(null);
const [resultInterviewId, setResultInterviewId] = useState(null);

  const resumeNavItems    = [{ name: "AI Resume Analysis", icon: Cpu }];
  const interviewNavItems = [{ name: "Interviews", icon: HelpCircle }];

  const renderPage = () => {
    switch (activeItem) {
      case "AI Resume Analysis":
        return <MyProfile user={user} />;

      case "Interviews":
  if (activeInterviewId) {
    return <InterviewScreen
  interviewId={activeInterviewId}/>;}

  if (selectedPost) {
    return (
      <InstructionPage
        post={selectedPost}
        onBack={() => setSelectedPost(null)}
        onStart={(interviewId) => setActiveInterviewId(interviewId)} 
      />
    );
  }
  return <CandidateDashboard onAttend={(post) => setSelectedPost(post)} />;

      case "My Profile":
  return (
    <ViewProfile
      user={user}
      onEdit={() =>
        setActiveItem(
          "AI Resume Analysis"
        )
      }
    />
  );

      default:
        return (
          <div className="text-slate-400 text-center mt-20">
            Page coming soon...
          </div>
        );
    }
  };

  // rest of your JSX unchanged below...
  return (
    <div className="min-h-screen w-full overflow-x-hidden text-slate-100 flex flex-col font-sans relative bg-[#0a0f1d]">
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-600/10 blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-purple-600/20 blur-[120px] pointer-events-none"></div>

      <header className="sticky top-0 z-40 h-20 border-b border-slate-800/60 bg-[#0c1325]/70 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => setMobileMenuOpen(true)} className="lg:hidden text-slate-200">
            <Menu className="w-6 h-6" />
          </button>
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center font-bold">C</div>
          <span className="font-semibold text-base sm:text-lg text-slate-200">Candidate Portal</span>
        </div>

        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-400">
          <a href="#dashboard" className="hover:text-slate-200 transition-colors">Dashboard</a>
          <button className="relative p-2 rounded-lg hover:bg-slate-800/40">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-indigo-500 rounded-full"></span>
          </button>
        </nav>

        <div className="relative">
          <button
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="flex items-center gap-2 bg-slate-800/40 hover:bg-slate-800/80 border border-slate-700/50 rounded-full pl-1 pr-3 py-1"
          >
            <div className="w-8 h-8 rounded-full overflow-hidden border border-slate-500">
              <img
                src={user?.profile_photo || "https://via.placeholder.com/150"}
                alt="Profile"
                className="w-full h-full object-cover"
              />
            </div>
            <span className="hidden sm:block max-w-28 truncate text-xs font-medium text-white">
              {user?.name || "Profile"}
            </span>
            <ChevronDown className={`w-4 h-4 transition-transform ${isProfileOpen ? "rotate-180" : ""}`} />
          </button>

          {isProfileOpen && (
            <div className="absolute right-0 mt-2 w-56 rounded-xl bg-[#11192e] border border-slate-800 shadow-xl py-2 z-50">
              <button
                onClick={() => { setActiveItem("My Profile"); setIsProfileOpen(false); }}
                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-slate-200 hover:bg-slate-800/60 hover:text-white transition-colors"
              >
                <User className="w-4 h-4" /> My Profile
              </button>
              <hr className="border-slate-800 my-2" />
              <button
                onClick={onLogout}
                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-400 hover:bg-red-950/20"
              >
                <LogOut className="w-4 h-4" /> Logout
              </button>
            </div>
          )}
        </div>
      </header>

      {mobileMenuOpen && (
        <>
          <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setMobileMenuOpen(false)} />
          <div className="fixed top-0 left-0 h-full w-72 bg-[#0c1325] z-50 p-4 lg:hidden overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-white">Menu</h2>
              <button onClick={() => setMobileMenuOpen(false)}><X className="w-6 h-6 text-white" /></button>
            </div>
            {[...resumeNavItems, ...interviewNavItems].map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.name}
                  onClick={() => { setActiveItem(item.name); setMobileMenuOpen(false); }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-slate-300 hover:bg-slate-800 mb-2"
                >
                  <Icon className="w-5 h-5" /> {item.name}
                </button>
              );
            })}
          </div>
        </>
      )}

      <div className="flex flex-1 flex-col lg:flex-row min-w-0">
        <aside className="hidden lg:flex lg:w-72 border-r border-slate-800/60 bg-[#0c1325]/40 backdrop-blur-sm p-3 flex-col gap-4">
          <div className="flex flex-row lg:flex-col gap-2 overflow-x-auto lg:overflow-visible">
            {resumeNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeItem === item.name;
              return (
                <button
                  key={item.name}
                  onClick={() => setActiveItem(item.name)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm sm:text-base lg:text-lg font-semibold whitespace-nowrap transition-all ${isActive ? "bg-slate-800/60 text-white border border-slate-700/30" : "text-slate-400 hover:bg-slate-800/20 hover:text-white"}`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="hidden sm:inline">{item.name}</span>
                </button>
              );
            })}
          </div>

          <hr className="hidden lg:block border-slate-800/80" />

          <div className="flex flex-row lg:flex-col gap-2 overflow-x-auto lg:overflow-visible">
            {interviewNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeItem === item.name;
              return (
                <button
                  key={item.name}
                  onClick={() => { setActiveItem(item.name); setSelectedPost(null); }} // ← reset selectedPost on nav
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm sm:text-base lg:text-lg font-semibold whitespace-nowrap transition-all ${isActive ? "bg-slate-800/60 text-white border border-slate-700/30" : "text-slate-400 hover:bg-slate-800/20 hover:text-white"}`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="hidden sm:inline">{item.name}</span>
                </button>
              );
            })}
          </div>
        </aside>

        <main className="flex-1 p-4 sm:p-6 overflow-x-hidden">
          <div className="max-w-7xl mx-auto">
            {renderPage()}
          </div>
        </main>
      </div>
    </div>
  );
};

export default CandidateLayout;