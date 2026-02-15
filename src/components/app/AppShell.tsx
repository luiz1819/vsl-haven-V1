import * as React from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { AppSidebar } from "./AppSidebar";
import { useAuth } from "@/auth/useAuth";
import { LogOut } from "lucide-react";

function useDarkModeDefault() {
  React.useEffect(() => {
    // App is dark by default.
    document.documentElement.classList.add("dark");
    document.documentElement.classList.remove("light");
  }, []);
}

export function AppShell() {
  useDarkModeDefault();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  return (
    <SidebarProvider>
      <div className="min-h-svh w-full">
        {/* Signature moment: subtle aurora glow behind the app */}
        <div
          aria-hidden
          className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
        >
          <div
            className="absolute -left-24 -top-24 h-[28rem] w-[28rem] rounded-full bg-gradient-to-br from-primary/25 to-primaryGlow/10 blur-3xl motion-safe:animate-[aurora_10s_ease-in-out_infinite]"
          />
          <div
            className="absolute -bottom-24 -right-24 h-[30rem] w-[30rem] rounded-full bg-gradient-to-tr from-primaryGlow/18 to-primary/10 blur-3xl motion-safe:animate-[aurora_12s_ease-in-out_infinite]"
          />
        </div>

        <div className="flex min-h-svh w-full">
          <AppSidebar />

          <SidebarInset>
            <header className="sticky top-0 z-20 flex h-12 items-center justify-between border-b bg-background/75 px-4 backdrop-blur">
              <div className="flex items-center gap-2">
                <SidebarTrigger />
                <div className="text-sm text-muted-foreground">Micro SaaS • VSL Hosting</div>
              </div>

              <div className="flex items-center gap-3">
                <div className="hidden text-sm text-muted-foreground md:block">{user?.email}</div>
                <Button
                  variant="soft"
                  size="sm"
                  onClick={async () => {
                    await signOut();
                    navigate("/login", { replace: true });
                  }}
                >
                  <LogOut className="h-4 w-4" />
                  Sair
                </Button>
              </div>
            </header>

            <main className="flex-1 p-4 md:p-6">
              <Outlet />
            </main>
          </SidebarInset>
        </div>
      </div>
    </SidebarProvider>
  );
}
