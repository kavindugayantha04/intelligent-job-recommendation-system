import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/AdminSidebar";
import api from "../api/api";
import "../styles/sidebar.css";
import "../styles/AdminCompanyProfile.css";

const BASE_URL = "http://localhost:5000";

function assetUrl(path) {
  if (!path) return "";
  if (/^https?:\/\//i.test(path)) return path;
  const p = path.startsWith("/") ? path.slice(1) : path;
  return `${BASE_URL}/${p}`;
}

function basenameFromPath(p) {
  if (!p) return "";
  const norm = String(p).replace(/\\/g, "/");
  const parts = norm.split("/");
  return parts[parts.length - 1] || "";
}

function benefitsToText(arr) {
  if (!Array.isArray(arr)) return "";
  return arr.join("\n");
}

export default function AdminCompanyProfile() {
  const navigate = useNavigate();
  const logoInputRef = useRef(null);
  const bannerInputRef = useRef(null);
  const galleryInputRef = useRef(null);
  const msgTimerRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingGallery, setUploadingGallery] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  const [companyName, setCompanyName] = useState("");
  const [tagline, setTagline] = useState("");
  const [about, setAbout] = useState("");
  const [mission, setMission] = useState("");
  const [vision, setVision] = useState("");
  const [culture, setCulture] = useState("");
  const [benefitsText, setBenefitsText] = useState("");
  const [location, setLocation] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [website, setWebsite] = useState("");

  const [logoPreview, setLogoPreview] = useState("");
  const [bannerPreview, setBannerPreview] = useState("");
  const [galleryImages, setGalleryImages] = useState([]);

  const [logoFile, setLogoFile] = useState(null);
  const [bannerFile, setBannerFile] = useState(null);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") || "null");
    const token = localStorage.getItem("token");
    if (!token || user?.role !== "admin") {
      navigate("/");
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const res = await api.getCompanyProfile();
        if (cancelled) return;
        const p = res?.data;
        if (!p) {
          setMessage({ type: "error", text: "Invalid profile response." });
          setLoading(false);
          return;
        }
        setCompanyName(p.companyName || "");
        setTagline(p.tagline || "");
        setAbout(p.about || "");
        setMission(p.mission || "");
        setVision(p.vision || "");
        setCulture(p.culture || "");
        setBenefitsText(benefitsToText(p.benefits));
        setLocation(p.location || "");
        setEmail(p.email || "");
        setPhone(p.phone || "");
        setWebsite(p.website || "");
        setLogoPreview(p.logo ? assetUrl(p.logo) : "");
        setBannerPreview(p.bannerImage ? assetUrl(p.bannerImage) : "");
        setGalleryImages(Array.isArray(p.galleryImages) ? p.galleryImages : []);
      } catch (e) {
        if (!cancelled) {
          setMessage({ type: "error", text: e.message || "Failed to load profile." });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [navigate]);

  const showMsg = (type, text) => {
    setMessage({ type, text });
    if (msgTimerRef.current) clearTimeout(msgTimerRef.current);
    if (text) {
      msgTimerRef.current = setTimeout(
        () => setMessage({ type: "", text: "" }),
        5000
      );
    }
  };

  const applyProfile = (p) => {
    if (!p) return;
    setCompanyName(p.companyName || "");
    setTagline(p.tagline || "");
    setAbout(p.about || "");
    setMission(p.mission || "");
    setVision(p.vision || "");
    setCulture(p.culture || "");
    setBenefitsText(benefitsToText(p.benefits));
    setLocation(p.location || "");
    setEmail(p.email || "");
    setPhone(p.phone || "");
    setWebsite(p.website || "");
    setLogoPreview(p.logo ? assetUrl(p.logo) : "");
    setBannerPreview(p.bannerImage ? assetUrl(p.bannerImage) : "");
    setGalleryImages(Array.isArray(p.galleryImages) ? p.galleryImages : []);
    setLogoFile(null);
    setBannerFile(null);
  };

  const handleLogoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  };

  const handleBannerChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBannerFile(file);
    setBannerPreview(URL.createObjectURL(file));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    showMsg("", "");
    try {
      const benefits = benefitsText
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean);

      const fd = new FormData();
      fd.append("companyName", companyName);
      fd.append("tagline", tagline);
      fd.append("about", about);
      fd.append("mission", mission);
      fd.append("vision", vision);
      fd.append("culture", culture);
      fd.append("location", location);
      fd.append("email", email);
      fd.append("phone", phone);
      fd.append("website", website);
      fd.append("benefits", JSON.stringify(benefits));

      if (logoFile) fd.append("logo", logoFile);
      if (bannerFile) fd.append("bannerImage", bannerFile);

      const res = await api.updateCompanyProfile(fd);
      const updated = res?.data;
      if (updated) applyProfile(updated);
      showMsg("success", "Company profile saved.");
    } catch (err) {
      showMsg("error", err.message || "Save failed.");
    } finally {
      setSaving(false);
    }
  };

  const handleGalleryUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingGallery(true);
    showMsg("", "");
    try {
      const fd = new FormData();
      fd.append("galleryImage", file);
      const res = await api.uploadCompanyGalleryImage(fd);
      const updated = res?.data;
      if (updated) applyProfile(updated);
      showMsg("success", "Gallery image uploaded.");
    } catch (err) {
      showMsg("error", err.message || "Upload failed.");
    } finally {
      setUploadingGallery(false);
      if (galleryInputRef.current) galleryInputRef.current.value = "";
    }
  };

  const handleDeleteGallery = async (storedPath) => {
    const name = basenameFromPath(storedPath);
    if (!name || !window.confirm("Remove this image from the gallery?")) return;
    showMsg("", "");
    try {
      const res = await api.deleteCompanyGalleryImage(name);
      const updated = res?.data;
      if (updated) applyProfile(updated);
      showMsg("success", "Image removed.");
    } catch (err) {
      showMsg("error", err.message || "Delete failed.");
    }
  };

  if (loading) {
    return (
      <div className="admin-company-page">
        <Sidebar />
        <div className="admin-company-main">
          <p style={{ color: "#64748b" }}>Loading…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-company-page">
      <Sidebar />

      <div className="admin-company-main">
        <header className="admin-company-header">
          <h1>Manage company profile</h1>
          <p>
            Edit copy, contact details, and media for the public company page at{" "}
            <a href="/company-a-z" target="_blank" rel="noopener noreferrer">
              /company-a-z
            </a>
            .
          </p>
        </header>

        {message.text ? (
          <div
            className={`admin-company-message ${message.type === "success" ? "success" : "error"}`}
            role="status"
          >
            {message.text}
          </div>
        ) : null}

        <form className="admin-company-form" onSubmit={handleSave}>
          <div className="admin-company-card">
            <h3>Branding</h3>
            <div className="admin-company-media-row">
              <div>
                <div className="admin-company-field">
                  <label>Logo</label>
                  <div className="admin-company-preview-box">
                    {logoPreview ? (
                      <img src={logoPreview} alt="Logo preview" />
                    ) : (
                      <span className="admin-company-preview-placeholder">
                        No logo
                      </span>
                    )}
                  </div>
                  <input
                    ref={logoInputRef}
                    type="file"
                    accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                    hidden
                    onChange={handleLogoChange}
                  />
                  <div className="admin-company-file-actions" style={{ marginTop: "0.75rem" }}>
                    <button
                      type="button"
                      className="admin-company-btn admin-company-btn-secondary"
                      onClick={() => logoInputRef.current?.click()}
                    >
                      Choose logo
                    </button>
                  </div>
                </div>
              </div>
              <div style={{ flex: 1, minWidth: 220 }}>
                <div className="admin-company-field">
                  <label>Banner</label>
                  <div className="admin-company-preview-box banner-preview">
                    {bannerPreview ? (
                      <img src={bannerPreview} alt="Banner preview" />
                    ) : (
                      <span className="admin-company-preview-placeholder">
                        No banner
                      </span>
                    )}
                  </div>
                  <input
                    ref={bannerInputRef}
                    type="file"
                    accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                    hidden
                    onChange={handleBannerChange}
                  />
                  <div className="admin-company-file-actions" style={{ marginTop: "0.75rem" }}>
                    <button
                      type="button"
                      className="admin-company-btn admin-company-btn-secondary"
                      onClick={() => bannerInputRef.current?.click()}
                    >
                      Choose banner
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="admin-company-card">
            <h3>Core copy</h3>
            <div className="admin-company-grid2">
              <div className="admin-company-field">
                <label>Company name</label>
                <input
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                />
              </div>
              <div className="admin-company-field">
                <label>Tagline</label>
                <input
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                />
              </div>
            </div>
            <div className="admin-company-field" style={{ marginTop: "1rem" }}>
              <label>About</label>
              <textarea value={about} onChange={(e) => setAbout(e.target.value)} />
            </div>
            <div className="admin-company-grid2" style={{ marginTop: "1rem" }}>
              <div className="admin-company-field">
                <label>Mission</label>
                <textarea
                  value={mission}
                  onChange={(e) => setMission(e.target.value)}
                />
              </div>
              <div className="admin-company-field">
                <label>Vision</label>
                <textarea
                  value={vision}
                  onChange={(e) => setVision(e.target.value)}
                />
              </div>
            </div>
            <div className="admin-company-field" style={{ marginTop: "1rem" }}>
              <label>Culture</label>
              <textarea
                value={culture}
                onChange={(e) => setCulture(e.target.value)}
              />
            </div>
            <div className="admin-company-field" style={{ marginTop: "1rem" }}>
              <label>Benefits (one per line)</label>
              <textarea
                className="admin-benefits-area"
                value={benefitsText}
                onChange={(e) => setBenefitsText(e.target.value)}
                placeholder={"Flexible hours\nHealth coverage\nLearning budget"}
              />
            </div>
          </div>

          <div className="admin-company-card">
            <h3>Contact</h3>
            <div className="admin-company-grid2">
              <div className="admin-company-field">
                <label>Location</label>
                <input
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />
              </div>
              <div className="admin-company-field">
                <label>Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="admin-company-field">
                <label>Phone</label>
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
              <div className="admin-company-field">
                <label>Website</label>
                <input
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="https://example.com"
                />
              </div>
            </div>
          </div>

          <div className="admin-company-card">
            <h3>Gallery</h3>
            <p style={{ margin: "0 0 1rem", color: "#64748b", fontSize: "0.9rem" }}>
              Upload workplace or team photos (JPG, PNG, WEBP — max 5 MB each).
            </p>
            <input
              ref={galleryInputRef}
              type="file"
              accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
              hidden
              onChange={handleGalleryUpload}
            />
            <button
              type="button"
              className="admin-company-btn admin-company-btn-secondary"
              disabled={uploadingGallery}
              onClick={() => galleryInputRef.current?.click()}
            >
              {uploadingGallery ? "Uploading…" : "Upload image"}
            </button>

            {galleryImages.length > 0 ? (
              <div className="admin-company-gallery-grid">
                {galleryImages.map((src, i) => (
                  <div key={`${src}-${i}`} className="admin-company-gallery-item">
                    <img src={assetUrl(src)} alt={`Gallery ${i + 1}`} />
                    <button
                      type="button"
                      className="admin-company-btn admin-company-btn-danger"
                      onClick={() => handleDeleteGallery(src)}
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ marginTop: "1rem", color: "#94a3b8", fontSize: "0.9rem" }}>
                No gallery images yet.
              </p>
            )}
          </div>

          <div className="admin-company-save-bar">
            <button
              type="submit"
              className="admin-company-btn admin-company-btn-primary"
              disabled={saving}
            >
              {saving ? "Saving…" : "Save changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
