import { createBrowserRouter } from "react-router-dom";
import LoginPage from "./page/LoginPage";
import FacilitiesPage from "./page/FacilitiesPage";
import ForbiddenPage from "./page/ForbiddenPage";
import MyBookingsPage from "./page/MyBookingsPage";
import AdminBookingsPage from "./page/AdminBookingsPage";
import { ProtectedRoute } from "./auth/ProtectedRoute";
import { AppShell } from "./components/layout/AppShell";

export const router = createBrowserRouter([
    { path: "/login", element: <LoginPage /> },
    { path: "/forbidden", element: <ForbiddenPage /> },
    {
        path: "/",
        element: (
            <ProtectedRoute>
                <AppShell />
            </ProtectedRoute>
        ),
        children: [
            { path: "facilities", element: <FacilitiesPage /> },
            { path: "bookings/my", element: <MyBookingsPage /> },
            { 
               path: "admin/bookings", 
               element: (
                   <ProtectedRoute roles={["Admin", "Committee"]}>
                       <AdminBookingsPage />
                   </ProtectedRoute>
               )
            },
        ]
    },
    { path: "*", element: <LoginPage /> },
]);
