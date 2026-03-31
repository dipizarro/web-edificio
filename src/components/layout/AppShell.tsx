import { Outlet, Link, useLocation } from "react-router-dom";
import { useAuth } from "@/auth/AuthProvider";
import { hasRole } from "@/auth/authStore";
import {
    SidebarProvider,
    Sidebar,
    SidebarContent,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuItem,
    SidebarMenuButton,
    SidebarGroup,
    SidebarGroupContent,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { LogOut, Home, Calendar, ShieldAlert, ReceiptText, Users } from "lucide-react";

export function AppShell() {
    const auth = useAuth();
    const location = useLocation();

    const isAdminOrCommittee =
        hasRole(auth, "admin") || hasRole(auth, "committee");

    return (
        <SidebarProvider>
            <div className="flex min-h-screen w-full">
                <Sidebar>
                    <SidebarHeader className="p-4 border-b">
                        <div className="font-bold text-lg">Web Edificio</div>
                    </SidebarHeader>
                    <SidebarContent>
                        <SidebarGroup>
                            <SidebarGroupContent>
                                <SidebarMenu className="mt-4">
                                    <SidebarMenuItem>
                                        <SidebarMenuButton 
                                            isActive={location.pathname === "/facilities"}
                                            render={
                                                <Link to="/facilities">
                                                    <Home className="mr-2 h-4 w-4" />
                                                    <span>Facilities</span>
                                                </Link>
                                            }
                                        />
                                    </SidebarMenuItem>
                                    {!isAdminOrCommittee && (
                                        <>
                                            <SidebarMenuItem>
                                                <SidebarMenuButton 
                                                    isActive={location.pathname.startsWith("/bookings/my")}
                                                    render={
                                                        <Link to="/bookings/my">
                                                            <Calendar className="mr-2 h-4 w-4" />
                                                            <span>My Bookings</span>
                                                        </Link>
                                                    }
                                                />
                                            </SidebarMenuItem>
                                            <SidebarMenuItem>
                                                <SidebarMenuButton 
                                                    isActive={location.pathname.startsWith("/my-statement")}
                                                    render={
                                                        <Link to="/my-statement">
                                                            <ReceiptText className="mr-2 h-4 w-4" />
                                                            <span>Mi Statement</span>
                                                        </Link>
                                                    }
                                                />
                                            </SidebarMenuItem>
                                        </>
                                    )}
                                    {isAdminOrCommittee && (
                                        <>
                                            <SidebarMenuItem>
                                                <SidebarMenuButton 
                                                    isActive={location.pathname.startsWith("/admin/bookings")}
                                                    render={
                                                        <Link to="/admin/bookings">
                                                            <ShieldAlert className="mr-2 h-4 w-4" />
                                                            <span>Admin Bookings</span>
                                                        </Link>
                                                    }
                                                />
                                            </SidebarMenuItem>
                                            <SidebarMenuItem>
                                                <SidebarMenuButton 
                                                    isActive={location.pathname.startsWith("/admin/statements")}
                                                    render={
                                                        <Link to="/admin/statements">
                                                            <Users className="mr-2 h-4 w-4" />
                                                            <span>Statements</span>
                                                        </Link>
                                                    }
                                                />
                                            </SidebarMenuItem>
                                        </>
                                    )}
                                </SidebarMenu>
                            </SidebarGroupContent>
                        </SidebarGroup>
                    </SidebarContent>
                </Sidebar>

                <div className="flex-1 flex flex-col min-w-0">
                    <header className="flex h-16 items-center border-b px-6 justify-between bg-background">
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="font-medium text-sm">Welcome, {auth.email}</span>
                            {auth.roles.map(role => (
                                <span key={role} className="text-xs bg-muted px-2 py-0.5 rounded-full">{role}</span>
                            ))}
                        </div>
                        <Button variant="outline" size="sm" onClick={auth.logout}>
                            <LogOut className="h-4 w-4 mr-2" />
                            Logout
                        </Button>
                    </header>
                    <main className="flex-1 p-6 overflow-auto bg-muted/20">
                        <Outlet />
                    </main>
                </div>
            </div>
        </SidebarProvider>
    );
}
