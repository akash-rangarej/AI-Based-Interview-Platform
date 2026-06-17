import {
  BarChart3,
  Bell,
  ChevronDown,
  LogOut,
  Menu,
  Search,
  Settings,
  User,
  X,
  FileText,
} from "lucide-react";
import { useState } from "react";
import PostInterview from "../components/dashboard/recruiter/Post_interview";
import SearchCandidates from "../components/dashboard/recruiter/SearchCandidates";
import RecruiterDashboard from "../components/dashboard/recruiter/Rec_InterviewDashboard";

const RecruiterLayout = ({ children, onLogout,  onDeleteAccount ,user }) => {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeItem, setActiveItem] = useState("Search Candidates");

  const recruiterNavItems = [
    { name: "Search Candidates", icon: Search },
    {name: "AI interview setup", icon: Settings},
    { name: "Performance Reports", icon: BarChart3 },
      { name: "My Posts", icon: FileText },
  ];
const renderContent = () => {
  switch (activeItem) {
    case "Search Candidates":
      return <SearchCandidates />;

    case "Performance Reports":
      return <div>Performance Reports Page</div>;

    case "AI interview setup":
      return <PostInterview />;

       case "My Posts":
        return <RecruiterDashboard />;

    default:
      return <div>Select a section</div>;
  }
};

  return (
    <div className="min-h-screen w-full text-slate-100 flex flex-col bg-[#0a0f1d] overflow-x-hidden">

      {/* Background Glow */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-cyan-600/20 blur-[120px] pointer-events-none"></div>

      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-emerald-600/20 blur-[120px] pointer-events-none"></div>

      {/* Navbar */}
      <header className="sticky top-0 z-40 h-20 border-b border-slate-800/60 bg-[#0c1325]/70 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between">

        {/* Left Section */}
        <div className="flex items-center gap-3">

          {/* Hamburger Menu */}
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="lg:hidden p-2 rounded-lg hover:bg-slate-800/50"
          >
            <Menu className="w-6 h-6 text-white" />
          </button>

          {/* Logo */}
          <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center font-bold text-white">
            R
          </div>

          <span className="font-semibold text-base sm:text-lg text-slate-200">
            Recruiter Portal
          </span>
        </div>

        {/* Center Navigation */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-400">

          <a
            href="#dashboard"
            className="hover:text-slate-200 transition-colors"
          >
            Dashboard
          </a>

          <button className="relative p-2 rounded-lg hover:bg-slate-800/40">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-emerald-500 rounded-full"></span>
          </button>

        </nav>

        {/* Profile Dropdown */}
        <div className="relative">

          <button
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="flex items-center gap-2 bg-slate-800/40 hover:bg-slate-800/80 border border-slate-700/50 rounded-full pl-1 pr-3 py-1"
          >
            <div className="w-8 h-8 rounded-full overflow-hidden border border-slate-500">
                  <img
                    src="https://placehold.co/150"
                    alt="profile"
                    className="rounded-full"
                  />
            </div>

            <span className="hidden sm:block text-white text-xs font-medium max-w-28 truncate">
              {user?.name || "Recruiter"}
            </span>

            <ChevronDown
              className={`w-4 h-4 transition-transform ${
                isProfileOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {isProfileOpen && (
            <div className="absolute right-0 mt-2 w-56 rounded-xl bg-[#11192e] border border-slate-800 shadow-xl py-2 z-50">

              <button className="w-full flex items-center gap-3 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800/50">
                <User className="w-4 h-4" />
                My Profile
              </button>

              <button className="w-full flex items-center gap-3 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800/50">
                <Settings className="w-4 h-4" />
                Settings
              </button>

              <button className="w-full flex items-center gap-3 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800/50">
                <BarChart3 className="w-4 h-4" />
                Reports
              </button>

            <hr className="border-slate-800 my-2" />

              <button
                onClick={onDeleteAccount}
                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-500 hover:bg-red-950/30"
              >
                <User className="w-4 h-4" />
                Delete Account
              </button>

              <button
                onClick={onLogout}
                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-400 hover:bg-red-950/20"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>

            </div>
          )}
        </div>
      </header>

      {/* Mobile Sidebar Drawer */}
      <div
        className={`fixed inset-0 z-50 lg:hidden transition-all duration-300 ${
          mobileMenuOpen
            ? "visible bg-black/50"
            : "invisible bg-transparent"
        }`}
      >
        <div
          className={`absolute left-0 top-0 h-full w-72 bg-[#11192e]
          border-r border-slate-800 p-4 transition-transform duration-300 ${
            mobileMenuOpen
              ? "translate-x-0"
              : "-translate-x-full"
          }`}
        >
          <div className="flex items-center justify-between mb-6">

            <h2 className="font-bold text-white">
              Menu
            </h2>

            <button
              onClick={() => setMobileMenuOpen(false)}
            >
              <X className="w-6 h-6 text-white" />
            </button>

          </div>

          <div className="space-y-2">
            {recruiterNavItems.map((item) => {
              const Icon = item.icon;

              return (
                <button
                  key={item.name}
                  onClick={() => {
                    setActiveItem(item.name);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                    activeItem === item.name
                      ? "bg-slate-800 text-white"
                      : "text-slate-300 hover:bg-slate-800"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {item.name}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Layout */}
      <div className="flex flex-1">

        {/* Desktop Sidebar */}
        <aside className="hidden lg:flex lg:w-72 border-r border-slate-800/60 bg-[#0c1325]/40 backdrop-blur-sm p-4 flex-col gap-4">

          {recruiterNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeItem === item.name;

            return (
              <button
                key={item.name}
                onClick={() => setActiveItem(item.name)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-lg font-semibold transition-all ${
                  isActive
                    ? "bg-slate-800/60 text-white border border-slate-700/30"
                    : "text-slate-400 hover:bg-slate-800/20 hover:text-white"
                }`}
              >
                <Icon className="w-6 h-6" />
                {item.name}
              </button>
            );
          })}
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-4 sm:p-6 overflow-x-hidden">
          <div className="max-w-7xl mx-auto">
            {renderContent()}
          </div>
        </main>

      </div>
    </div>
  );
};

export default RecruiterLayout;