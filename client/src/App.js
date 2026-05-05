import { Routes, Route } from "react-router-dom";
import Dashboard from "./interviews/Dashboard";
import CreateInterview from "./interviews/createInterview";
import UpdateInterview from "./interviews/UpdateInterview";
import AdminDashboard from "./admin/Dashboard";
import RecruiterRegister from "./admin/RecruiterRegister";
import Logs from "./admin/Logs";


function App() {
  return (
    <Routes>
      <Route path="/admin/dashboard" element={<AdminDashboard />} />
      <Route path="/logs" element={<Logs />} />
      <Route path="/interviews" element={<Dashboard />} />
      <Route path="/create/interview" element={<CreateInterview />} />
      <Route path="/update/interview/:id" element={<UpdateInterview />} />
      <Route path="/recruiter/registration" element={<RecruiterRegister  />} />
      
    </Routes>
  );
}

export default App;


