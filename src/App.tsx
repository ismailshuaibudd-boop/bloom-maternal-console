"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Toaster } from "@/components/ui/sonner";
import { Baby, Heart, Book, LayoutDashboard, Menu } from "lucide-react";
import { loadMothers, saveMothers, type Mother } from "@/utils/maternalData";
import DashboardMetrics from "@/components/DashboardMetrics";
import RegistrationForm from "@/components/RegistrationForm";
import ContentManager from "@/components/ContentManager";

type View = "dashboard" | "registration" | "content";

function App() {
  const [mothers, setMothers] = useState<Mother[]>([]);
  const [activeView, setActiveView] = useState<View>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setMothers(loadMothers());
    setLoaded(true);
  }, []);

  const handleMothersChange = (updated: Mother[]) => {
    setMothers(updated);
  };

  const navItems: { id: View; label: string; icon: React.ElementType }[] = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "registration", label: "Registration", icon: Heart },
    { id: "content", label: "Content", icon: Book },
  ];

  return (
    <TooltipProvider>
    <SidebarProvider defaultOpen={sidebarOpen} onOpenChange={setSidebarOpen}>
      <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50/20">
        <AppSidebar
          activeView={activeView}
          onViewChange={setActiveView}
          navItems={navItems}
          motherCount={mothers.length}
        />

        <SidebarInset className="flex-1">
          <header className="sticky top-0 z-10 flex items-center gap-3 border-b bg-white/80 backdrop-blur-md px-6 py-3">
            <SidebarTrigger className="h-8 w-8 text-muted-foreground hover:text-foreground">
              <Menu className="h-4 w-4" />
            </SidebarTrigger>
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-teal-100">
                <Baby className="h-4 w-4 text-teal-700" />
              </div>
              <div>
                <h1 className="text-sm font-semibold">Maternal Health SMS & Voice Companion</h1>
                <p className="text-[11px] text-muted-foreground">Admin Dashboard</p>
              </div>
            </div>
            <div className="ml-auto flex items-center gap-2 text-xs text-muted-foreground">
              <span className="hidden sm:inline">
                {mothers.length} mother{mothers.length !== 1 ? "s" : ""} enrolled
              </span>
              <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="hidden sm:inline">System Online</span>
            </div>
          </header>

          <main className="flex-1 p-4 md:p-6 lg:p-8">
            <AnimatePresence mode="wait">
              {loaded && (
                <motion.div
                  key={activeView}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.25, ease: "easeInOut" }}
                >
                  {activeView === "dashboard" && (
                    <DashboardMetrics
                      mothers={mothers}
                      onMothersChange={handleMothersChange}
                    />
                  )}
                  {activeView === "registration" && (
                    <RegistrationForm
                      mothers={mothers}
                      onMothersChange={handleMothersChange}
                    />
                  )}
                  {activeView === "content" && (
                    <ContentManager mothers={mothers} />
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </main>
        </SidebarInset>
      </div>
      <Toaster position="top-right" richColors />
    </SidebarProvider>
    </TooltipProvider>
  );
}

export default App;