import { useEffect, useState } from "react";
import UserNavbar from "../components/UserNavbar";
import Footer from "../components/Footer";

const Profile = () => {

  const [user, setUser] = useState(null);
  const [file, setFile] = useState(null);

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("user"));
    setUser(storedUser);
    
  }, []);

  if (!user) {
    return <div className="container">Loading...</div>;
  }

  const initials = user.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const uploadCV = () => {
    if (!file) return alert("Please select a file");

    console.log("Uploading:", file);

    // later you connect backend here
    alert("CV uploaded successfully (demo)");
  };

  return (
    <>
      <UserNavbar />

      <div className="container profile-page">

        <div className="profile-layout">

          {/* ================= LEFT SIDE ================= */}

          <section className="profile-main">

            <div className="page-header">
              <h1>Profile</h1>
              <p>Manage your CV and job preferences</p>
            </div>


            {/* USER CARD */}

            <div className="card profile-header-card">

              <div className="profile-avatar">
                {initials}
              </div>

              <div>
                <div className="profile-header-name">
                  {user.name}
                </div>

                <div className="profile-header-email">
                  {user.email}
                </div>

                <div className="profile-header-meta">
                  <span className="badge badge-reviewing">
                    {user.role}
                  </span>
                </div>
              </div>

            </div>


            {/* ================= CV Upload ================= */}

            <div className="card">

              <div className="section-title">
                Resume / CV
              </div>

              <p className="profile-hint">
                Upload your CV to get better job recommendations
              </p>

              <input
                type="file"
                onChange={handleFileChange}
              />

              <button
                className="btn btn-primary"
                style={{marginTop:"10px"}}
                onClick={uploadCV}
              >
                Upload CV
              </button>

            </div>


            {/* ================= Preferences ================= */}

            <div className="card">

              <div className="section-title">
                Job Preferences
              </div>

              <div className="form-group">
                <label>Preferred Field</label>
                <input placeholder="Software Engineering" />
              </div>

              <div className="form-group">
                <label>Desired Role</label>
                <input placeholder="Frontend Developer" />
              </div>

              <div className="form-group">
                <label>Preferred Location</label>
                <input placeholder="Remote" />
              </div>

              <button className="btn btn-primary">
                Save Preferences
              </button>

            </div>

          </section>


          {/* ================= RIGHT SIDE ================= */}

          <aside className="profile-side">
            <div className="profile-side-bg" aria-hidden="true">
              <img
                src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1400&auto=format&fit=crop&q=80"
                alt=""
                className="profile-side-bg-img"
                loading="lazy"
                decoding="async"
              />
            </div>
            <div className="profile-side-scrim" aria-hidden="true" />

            <div className="profile-side-content">

              <div className="profile-side-tag">
                Smart matching
              </div>

              <h2 className="profile-side-title">
                Let your CV work while you sleep.
              </h2>

              <p className="profile-side-text">
                Keep your profile up to date and we’ll match you with jobs
                that fit your skills and interests.
              </p>

              <div className="profile-side-points">
                <span>Personalized job recommendations</span>
                <span>Track every application</span>
                <span>Highlight the skills employers need</span>
              </div>

            </div>

            <div className="profile-side-footer">
              Trusted by <strong>students & graduates</strong>
            </div>

          </aside>

        </div>

      </div>

      <Footer />
    </>
  );
};

export default Profile;