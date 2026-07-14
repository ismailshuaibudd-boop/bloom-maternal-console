"use client";

import { type ReactElement } from "react";
import { motion } from "framer-motion";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Baby, Heart, Book, LayoutDashboard } from "lucide-react";

interface NavItem {
  id: string;
  label: string;
  icon: React.ElementType;
}

interface Props {
  activeView: string;
  onViewChange: (view: any) => void;
  navItems: NavItem[];
  motherCount: number;
}

export function AppSidebar({ activeView, onViewChange, navItems, motherCount }: Props) {
  return (
    <Sidebar
      collapsible="icon"
      className="border-r bg-white/90 backdrop-blur-md"
    >
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-teal-100 shrink-0">
            <Baby className="h-5 w-5 text-teal-700" />
          </div>
          <div className="group-data-[collapsible=icon]:hidden">
            <p className="text-sm font-semibold leading-tight">Maternal Health</p>
            <p className="text-[10px] text-muted-foreground">Admin Panel</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeView === item.id;
                return (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton
                      onClick={() => onViewChange(item.id)}
                      isActive={isActive}
                      tooltip={item.label}
                      className="relative"
                    >
                      <Icon className="h-4 w-4" />
                      <span>{item.label}</span>
                      {isActive && (
                        <motion.div
                          layoutId="active-indicator"
                          className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-full bg-teal-600"
                          transition={{ type: "spring", stiffness: 400, damping: 30 }}
                        />
                      )}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t">
        <div className="group-data-[collapsible=icon]:hidden flex items-center gap-2 text-xs text-muted-foreground">
          <div className="h-2 w-2 rounded-full bg-emerald-500" />
          <span>{motherCount} mother{motherCount !== 1 ? "s" : ""}</span>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}