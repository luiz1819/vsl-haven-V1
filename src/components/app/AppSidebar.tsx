import { useLocation } from "react-router-dom";
import { LayoutDashboard, Video, PlusCircle, User, CreditCard, GraduationCap, Sparkles, LayoutTemplate, BarChart3 } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

const items = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Analytics", url: "/analytics", icon: BarChart3 },
  { title: "Meus Vídeos", url: "/videos", icon: Video },
  { title: "Landing Pages", url: "/pages", icon: LayoutTemplate },
  { title: "Novo Vídeo", url: "/videos/new", icon: PlusCircle },
  { title: "Perfil", url: "/profile", icon: User },
  { title: "Planos", url: "/plans", icon: CreditCard },
  { title: "Tutorial", url: "/tutorial", icon: GraduationCap },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { pathname } = useLocation();
  const isActive = (path: string) => pathname === path;

  return (
    <Sidebar collapsible="icon" variant="sidebar">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              {!collapsed && <span>VSL Host</span>}
            </div>
          </SidebarGroupLabel>
          <SidebarMenu>
            {items.map((item) => (
              <SidebarMenuItem key={item.url}>
                <SidebarMenuButton asChild isActive={isActive(item.url)} tooltip={item.title}>
                  <NavLink
                    to={item.url}
                    end
                    className="gap-2"
                    activeClassName="text-sidebar-accent-foreground"
                  >
                    <item.icon className="h-4 w-4" />
                    {!collapsed && <span>{item.title}</span>}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
