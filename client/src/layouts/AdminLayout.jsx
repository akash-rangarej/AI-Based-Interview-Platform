import {
  Menu,
  X,
  Bell,
  ChevronDown,
  LogOut,
  User,
  BarChart3,
  Users,
  Building2,
  KeyRound,
} from "lucide-react";

import { useState } from "react";

import AdminDashboard from "../components/dashboard/admin/AIUsageAnalytics";
import CandidatesTable from "../components/dashboard/admin/CandidatesTable";
import RecruitersTable from "../components/dashboard/admin/RecruitersTable";
import ChangeAdminPassword from "../components/dashboard/admin/ChangeAdminPassword";

const AdminLayout = ({ user, onLogout }) => {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeItem, setActiveItem] = useState("AI Usage Analytics");
  const adminNavItems = [
    {
    name: "AI Usage Analytics",
    icon: BarChart3,
    },
    {
      name: "Candidates",
      icon: Users,
    },
    {
      name: "Recruiters",
      icon: Building2,
    },
    {
      name: "Change Password",
      icon: KeyRound,
    },
  ];

  const renderPage = () => {
    switch (activeItem) {
      case "AI Usage Analytics":
        return <AdminDashboard />;

      case "Candidates":
        return <CandidatesTable />;

      case "Recruiters":
        return <RecruitersTable />;

      case "Change Password":
        return <ChangeAdminPassword />;

      default:
        return (
          <div className="text-slate-400 text-center mt-20">
            Page coming soon...
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen w-full overflow-x-hidden text-slate-100 flex flex-col font-sans relative bg-[#0a0f1d]">
      {/* Background Glow */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-red-600/10 blur-[120px] pointer-events-none"></div>

      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-orange-600/10 blur-[120px] pointer-events-none"></div>

      {/* Header */}
      <header className="sticky top-0 z-40 h-20 border-b border-slate-800/60 bg-[#0c1325]/70 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="lg:hidden text-slate-200"
          >
            <Menu className="w-6 h-6" />
          </button>

          <div className="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center font-bold">
            A
          </div>

          <span className="font-semibold text-base sm:text-lg text-slate-200">
            Admin Portal
          </span>
        </div>

        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-400">
          <button className="relative p-2 rounded-lg hover:bg-slate-800/40">
            <Bell className="w-5 h-5" />

            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>
        </nav>

        {/* Profile */}
        <div className="relative">
          <button
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="flex items-center gap-2 bg-slate-800/40 hover:bg-slate-800/80 border border-slate-700/50 rounded-full pl-1 pr-3 py-1"
          >
            {/* <div className="w-8 h-8 rounded-full overflow-hidden border border-slate-500">
              <img
                src={
                  user?.profile_photo ||
                  "https://via.placeholder.com/150"
                }
                alt="Profile"
                className="w-full h-full object-cover"
              />
            </div> */}

            <span className="hidden sm:block max-w-28 truncate text-xs font-medium text-white">
              {user?.name || "Admin"}
            </span>

            <ChevronDown
              className={`w-4 h-4 transition-transform ${
                isProfileOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {isProfileOpen && (
            <div className="absolute right-0 mt-2 w-56 rounded-xl bg-[#11192e] border border-slate-800 shadow-xl py-2 z-50">
              {/* <button
                onClick={() => {
                  setActiveItem("Change Password");
                  setIsProfileOpen(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-slate-200 hover:bg-slate-800/60"
              >
                <User className="w-4 h-4" />
                Change Password
              </button> */}

              <hr className="border-slate-800 my-2" />

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

      {/* Mobile Sidebar */}
      {mobileMenuOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />

          <div className="fixed top-0 left-0 h-full w-72 bg-[#0c1325] z-50 p-4 lg:hidden overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-white">
                Admin Menu
              </h2>

              <button
                onClick={() => setMobileMenuOpen(false)}
              >
                <X className="w-6 h-6 text-white" />
              </button>
            </div>

            {adminNavItems.map((item) => {
              const Icon = item.icon;

              return (
                <button
                  key={item.name}
                  onClick={() => {
                    setActiveItem(item.name);
                    setMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-slate-300 hover:bg-slate-800 mb-2"
                >
                  <Icon className="w-5 h-5" />
                  {item.name}
                </button>
              );
            })}
          </div>
        </>
      )}

      {/* Body */}
      <div className="flex flex-1 flex-col lg:flex-row min-w-0">
        {/* Sidebar */}
        <aside className="hidden lg:flex lg:w-72 border-r border-slate-800/60 bg-[#0c1325]/40 backdrop-blur-sm p-3 flex-col gap-4">
          {adminNavItems.map((item) => {
            const Icon = item.icon;

            const isActive =
              activeItem === item.name;

            return (
              <button
                key={item.name}
                onClick={() => setActiveItem(item.name)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-base font-semibold transition-all ${
                  isActive
                    ? "bg-slate-800/60 text-white border border-slate-700/30"
                    : "text-slate-400 hover:bg-slate-800/20 hover:text-white"
                }`}
              >
                <Icon className="w-5 h-5" />

                {item.name}
              </button>
            );
          })}
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-4 sm:p-6 overflow-x-hidden">
          <div className="max-w-7xl mx-auto">
            {renderPage()}
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;