import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import UserNavbar from "../components/UserNavbar.jsx";
import ProfileSettings from "../components/ProfileSettings.jsx";
import ProfileSideCarousel from "../components/ProfileSideCarousel.jsx";
import Footer from "../components/Footer.jsx";

export default function Home() {
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) navigate("/login");
  }, [navigate]);

  return (
    <>
      <UserNavbar />

      <div className="container profile-page">
        <div className="profile-layout">
          <section className="profile-main">
            <div className="page-header">
              <h1>Profile</h1>
              <p>Manage your CV and job preferences</p>
            </div>

            <ProfileSettings />
          </section>

          <ProfileSideCarousel />
        </div>
      </div>

      <Footer />
    </>
  );
}