import { Routes, Route } from "react-router-dom";

import LandingPage from "./pages/LandingPage";
import RecruiterDashboard from "./pages/RecruiterDashboard";
import JobManagement from "./pages/JobManagement";
import Home from "./pages/home";
import EditProfile from "./pages/EditProfile";
import Dashboard from "./pages/Dashboard";
import BrowseJobs from "./pages/browse-jobs";
import MyApplications from "./pages/my-applications";

function App() {
  return (
    <Routes>

      <Route path="/" element={<LandingPage />} />

      <Route path="/recruiter-dashboard" element={<RecruiterDashboard />} />

      <Route path="/job-management" element={<JobManagement />} />

      <Route path="/candidate-dashboard" element={<Home />} />
      <Route path="/profile" element={<EditProfile />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/browse-jobs" element={<BrowseJobs />} />
      <Route path="/my-applications" element={<MyApplications />} />

    </Routes>
  );
}

export default App;