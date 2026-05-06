import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import UserNavbar from "../components/UserNavbar";
import Footer from "../components/Footer";
import api from "../api/api";
import "../styles/CompanyAZ.css";

const BASE_URL = "http://localhost:5000";

function assetUrl(path) {
  if (!path) return "";
  if (/^https?:\/\//i.test(path)) return path;
  const p = path.startsWith("/") ? path.slice(1) : path;
  return `${BASE_URL}/${p}`;
}

function isExpired(deadline) {
  if (!deadline) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const end = new Date(deadline);
  end.setHours(0, 0, 0, 0);
  return end < today;
}

function formatSalary(min, max) {
  if (min == null && max == null) return "";
  if (min != null && max != null) return `$${min.toLocaleString()} – $${max.toLocaleString()}`;
  if (min != null) return `From $${min.toLocaleString()}`;
  return `Up to $${max.toLocaleString()}`;
}

function pickNavUser() {
  try {
    return JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    return null;
  }
}

export default function CompanyAZ() {
  const [profile, setProfile] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const user = useMemo(() => pickNavUser(), []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError("");
      try {
        const [profRes, jobsRes] = await Promise.all([
          api.getCompanyProfile(),
          api.getPublicJobs().catch(() => []),
        ]);
        if (cancelled) return;
        const data = profRes?.data ?? profRes;
        setProfile(
          typeof data === "object" && data?.companyName !== undefined
            ? data
            : null
        );
        setJobs(Array.isArray(jobsRes) ? jobsRes : []);
      } catch (e) {
        if (!cancelled) {
          setError(e.message || "Failed to load page.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const openJobs = useMemo(() => {
    return jobs.filter(
      (j) => j.status !== "Closed" && !isExpired(j.deadline)
    );
  }, [jobs]);

  const gallery = Array.isArray(profile?.galleryImages)
    ? profile.galleryImages
    : [];

  const showCandidateNav = user?.role === "candidate";

  if (loading) {
    return (
      <div className="company-az">
        {showCandidateNav ? <UserNavbar /> : <Navbar />}
        <main className="company-az-main">
          <p className="company-az-loading">Loading company profile…</p>
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="company-az">
        {showCandidateNav ? <UserNavbar /> : <Navbar />}
        <main className="company-az-main">
          <div className="company-az-error" role="alert">
            {error || "Could not load company profile."}
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const benefits = Array.isArray(profile.benefits) ? profile.benefits : [];

  const hasContact =
    Boolean(profile.location || profile.email || profile.phone || profile.website);

  return (
    <div className="company-az">
      {showCandidateNav ? <UserNavbar /> : <Navbar />}

      <main className="company-az-main">
        <section className="company-az-hero" aria-label="Company introduction">
          {profile.bannerImage ? (
            <div
              className="company-az-hero-bg"
              style={{
                backgroundImage: `url(${assetUrl(profile.bannerImage)})`,
              }}
            />
          ) : null}
          <div className="company-az-hero-content">
            {profile.logo ? (
              <img
                className="company-az-logo"
                src={assetUrl(profile.logo)}
                alt=""
              />
            ) : (
              <div
                className="company-az-logo company-az-logo-placeholder"
                aria-hidden
              >
                {String(profile.companyName || "C").slice(0, 1)}
              </div>
            )}
            <div className="company-az-hero-text">
              <h1>{profile.companyName}</h1>
              {profile.tagline ? (
                <p className="company-az-tagline">{profile.tagline}</p>
              ) : null}
            </div>
          </div>
        </section>

        {profile.about ? (
          <section
            className="company-az-section"
            aria-labelledby="about-heading"
          >
            <h2 id="about-heading">About us</h2>
            <div className="company-az-card">
              <p>{profile.about}</p>
            </div>
          </section>
        ) : null}

        {(profile.mission || profile.vision) && (
          <section
            className="company-az-section"
            aria-labelledby="mission-heading-w"
          >
            <h2 id="mission-heading-w">Mission &amp; vision</h2>
            <div className="company-az-split">
              {profile.mission ? (
                <div className="company-az-card">
                  <h2 style={{ fontSize: "1rem", marginBottom: "0.75rem" }}>
                    Mission
                  </h2>
                  <p>{profile.mission}</p>
                </div>
              ) : null}
              {profile.vision ? (
                <div className="company-az-card">
                  <h2 style={{ fontSize: "1rem", marginBottom: "0.75rem" }}>
                    Vision
                  </h2>
                  <p>{profile.vision}</p>
                </div>
              ) : null}
            </div>
          </section>
        )}

        {profile.culture ? (
          <section
            className="company-az-section"
            aria-labelledby="culture-heading"
          >
            <h2 id="culture-heading">Company culture</h2>
            <div className="company-az-card">
              <p>{profile.culture}</p>
            </div>
          </section>
        ) : null}

        {benefits.length > 0 ? (
          <section
            className="company-az-section"
            aria-labelledby="benefits-heading"
          >
            <h2 id="benefits-heading">Why work with us</h2>
            <div className="company-az-benefits">
              {benefits.map((b, i) => (
                <div key={i} className="company-az-benefit">
                  <span className="company-az-benefit-icon">✓</span>
                  <span>{b}</span>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {gallery.length > 0 ? (
          <section
            className="company-az-section"
            aria-labelledby="gallery-heading"
          >
            <h2 id="gallery-heading">Gallery</h2>
            <div className="company-az-gallery">
              {gallery.map((src, i) => (
                <img
                  key={`${src}-${i}`}
                  src={assetUrl(src)}
                  alt={`Workplace ${i + 1}`}
                />
              ))}
            </div>
          </section>
        ) : null}

        {hasContact ? (
          <section
            className="company-az-section"
            aria-labelledby="contact-heading"
          >
            <h2 id="contact-heading">Contact</h2>
            <div className="company-az-card">
              <div className="company-az-contact-grid">
                {profile.location ? (
                  <div className="company-az-contact-item">
                    <strong>Location</strong>
                    <span>{profile.location}</span>
                  </div>
                ) : null}
                {profile.email ? (
                  <div className="company-az-contact-item">
                    <strong>Email</strong>
                    <a href={`mailto:${profile.email}`}>{profile.email}</a>
                  </div>
                ) : null}
                {profile.phone ? (
                  <div className="company-az-contact-item">
                    <strong>Phone</strong>
                    <a href={`tel:${profile.phone}`}>{profile.phone}</a>
                  </div>
                ) : null}
                {profile.website ? (
                  <div className="company-az-contact-item">
                    <strong>Website</strong>
                    <a
                      href={
                        profile.website.startsWith("http")
                          ? profile.website
                          : `https://${profile.website}`
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {profile.website}
                    </a>
                  </div>
                ) : null}
              </div>
            </div>
          </section>
        ) : null}

        <section
          className="company-az-section"
          aria-labelledby="jobs-heading"
        >
          <h2 id="jobs-heading">Open opportunities</h2>
          {openJobs.length === 0 ? (
            <div className="company-az-empty">
              No open jobs available right now. Please check back soon.
            </div>
          ) : (
            <div className="company-az-jobs">
              {openJobs.map((job) => (
                <article key={job._id} className="company-az-job-card">
                  <div>
                    {job.category ? (
                      <span className="company-az-pill">{job.category}</span>
                    ) : null}
                    <h3>{job.title}</h3>
                    <p className="company-az-job-meta">
                      {[job.workType, job.experienceLevel]
                        .filter(Boolean)
                        .join(" · ")}
                      {job.deadline
                        ? ` · Closes ${new Date(job.deadline).toLocaleDateString()}`
                        : ""}
                      {formatSalary(job.salaryMin, job.salaryMax)
                        ? ` · ${formatSalary(job.salaryMin, job.salaryMax)}`
                        : ""}
                    </p>
                  </div>
                  {user?.role === "candidate" ? (
                    <Link className="company-az-cta" to="/browse-jobs">
                      Apply via job board
                    </Link>
                  ) : (
                    <Link className="company-az-cta" to="/login">
                      Sign in to apply
                    </Link>
                  )}
                </article>
              ))}
            </div>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
}
