import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AuthPage from './AuthPage';
import StudentDashboard from './StudentDashboard';
import HrDashboard from './HrDashboard';

const PrivateRoute = ({ children, allowedRole }) => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');

    if (!token) return <Navigate to="/" />;
    if (allowedRole && role !== allowedRole) return <Navigate to="/" />;

    return children;
};

function App() {
    return (
        <BrowserRouter>
            <Routes>
                {/* Public Auth Routes */}
                <Route path="/" element={<AuthPage />} />
                <Route path="/hr" element={<AuthPage />} />

                {/* Protected Dashboard Routes */}
                <Route
                    path="/student-dashboard"
                    element={
                        <PrivateRoute allowedRole="student">
                            <StudentDashboard />
                        </PrivateRoute>
                    }
                />
                <Route
                    path="/hr-dashboard"
                    element={
                        <PrivateRoute allowedRole="hr">
                            <HrDashboard />
                        </PrivateRoute>
                    }
                />
            </Routes>
        </BrowserRouter>
    );
}

export default App;
