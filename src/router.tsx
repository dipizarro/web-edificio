import { createBrowserRouter } from "react-router-dom";
import LoginPage from "./page/LoginPage";
import FacilitiesPage from "./page/FacilitiesPage";
import ForbiddenPage from "./page/ForbiddenPage";
import { ProtectedRoute } from "./auth/ProtectedRoute";

export const router = createBrowserRouter([
    { path: "/login", element: <LoginPage /> },
    { path: "/forbidden", element: <ForbiddenPage /> },
    {
        path: "/facilities",
        element: (
            <ProtectedRoute>
                <FacilitiesPage />
            </ProtectedRoute>
        ),
    },
    { path: "*", element: <LoginPage /> },
]);
