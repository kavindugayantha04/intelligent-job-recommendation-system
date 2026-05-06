import React, { useEffect, useMemo, useState } from "react";

export default function ProfileSideCarousel() {
  const slides = useMemo(
    () => [
      {
        image:
          "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1400&auto=format&fit=crop&q=80",
        tag: "SMART MATCHING",
        title: "Let your CV work while you sleep.",
        text:
          "Keep your profile up to date and we'll match you with jobs that fit your skills and interests.",
        points: [
          "Personalized job recommendations",
          "Track every application",
          "Highlight the skills employers need",
        ],
        footer: (
          <>
            Trusted by <strong>students &amp; graduates</strong> finding their first career steps.
          </>
        ),
      },
      {
        image:
          "https://images.unsplash.com/photo-1497366216548-37526070297c?w=1400&auto=format&fit=crop&q=80",
        tag: "CAREER READY",
        title: "Stand out to recruiters.",
        text: "A strong CV + clear preferences helps employers find you faster.",
        points: ["Clean CV uploads", "Quick updates anytime", "One place for your details"],
        footer: (
          <>
            Tip: keep your <strong>preferences</strong> updated for better matching.
          </>
        ),
      },
      {
        image:
          "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=1400&auto=format&fit=crop&q=80",
        tag: "ONE DASHBOARD",
        title: "Everything in one place.",
        text: "Save your preferences once and apply to roles with confidence.",
        points: ["Save preferences", "Apply in seconds", "Track status easily"],
        footer: (
          <>
            Your progress stays saved while you’re signed in.
          </>
        ),
      },
    ],
    [],
  );

  const [idx, setIdx] = useState(0);
  const slide = slides[idx] || slides[0];

  useEffect(() => {
    const t = setInterval(() => {
      setIdx((v) => (v + 1) % slides.length);
    }, 6500);
    return () => clearInterval(t);
  }, [slides.length]);

  function prev() {
    setIdx((v) => (v - 1 + slides.length) % slides.length);
  }
  function next() {
    setIdx((v) => (v + 1) % slides.length);
  }

  return (
    <aside className="profile-side">
      <div className="profile-side-bg" aria-hidden="true">
        <img
          key={slide.image}
          src={slide.image}
          alt=""
          className="profile-side-bg-img"
          loading="lazy"
          decoding="async"
        />
      </div>
      <div className="profile-side-scrim" aria-hidden="true" />

      <div className="profile-side-content">
        <div className="profile-side-tag">{slide.tag}</div>
        <h2 className="profile-side-title">{slide.title}</h2>
        <p className="profile-side-text">{slide.text}</p>
        <div className="profile-side-points">
          {slide.points.map((p) => (
            <span key={p}>{p}</span>
          ))}
        </div>
      </div>

      <div className="profile-side-footer">{slide.footer}</div>

      <div className="profile-side-nav" aria-hidden="true">
        <button className="profile-side-arrow left" type="button" onClick={prev}>
          ‹
        </button>
        <button className="profile-side-arrow right" type="button" onClick={next}>
          ›
        </button>
      </div>

      <div className="profile-side-dots" aria-hidden="true">
        {slides.map((_, i) => (
          <button
            key={i}
            type="button"
            className={`profile-side-dot ${i === idx ? "active" : ""}`}
            onClick={() => setIdx(i)}
          />
        ))}
      </div>
    </aside>
  );
}

