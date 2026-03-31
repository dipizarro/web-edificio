import { createBrowserRouter } from "react-router-dom";
import LoginPage from "./page/LoginPage";
import FacilitiesPage from "./page/FacilitiesPage";
import FacilityDetailPage from "./page/FacilityDetailPage";
import ForbiddenPage from "./page/ForbiddenPage";
import MyBookingsPage from "./page/MyBookingsPage";
import BookingDetailPage from "./page/BookingDetailPage";
import AdminBookingsPage from "./page/AdminBookingsPage";
import MyStatementPage from "./page/MyStatementPage";
import AdminStatementsPage from "./page/AdminStatementsPage";
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
            { path: "facilities/:facilityId", element: <FacilityDetailPage /> },
            { 
               path: "bookings/my", 
               element: (
                   <ProtectedRoute roles={["Resident"]}>
                       <MyBookingsPage />
                   </ProtectedRoute>
               )
            },
            { 
               path: "my-statement", 
               element: (
                   <ProtectedRoute roles={["Resident"]}>
                       <MyStatementPage />
                   </ProtectedRoute>
               )
            },
            { path: "bookings/:bookingId", element: <BookingDetailPage /> },
            { 
               path: "admin/bookings", 
               element: (
                   <ProtectedRoute roles={["Admin", "Committee"]}>
                       <AdminBookingsPage />
                   </ProtectedRoute>
               )
            },
            { 
               path: "admin/statements", 
               element: (
                   <ProtectedRoute roles={["Admin", "Committee"]}>
                       <AdminStatementsPage />
                   </ProtectedRoute>
               )
            },
        ]
    },
    { path: "*", element: <LoginPage /> },
]);
