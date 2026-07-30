import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import logoSrc from "../assets/logo/insurance-vector.png";
import heroImg from "../assets/logo/insurance-heart-vector.png";
import "../pages/css/LandingPage.css";

const LandingPage = () => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const features = [
    {
      icon: "🏥",
      bg: "#eff6ff",
      title: "Health, Life, Motor & Travel Plans",
      desc: "Browse real insurance products with multiple plans. Compare coverage amounts, premiums, and terms - then purchase directly from your customer dashboard.",
    },
    {
      icon: "📋",
      bg: "#fefce8",
      title: "Policy Purchase & Issuance",
      desc: "Customers purchase plans online. Staff issue policies with coverage details, start/end dates, and premium schedules - all tracked in one place.",
    },
    {
      icon: "📤",
      bg: "#f0fdf4",
      title: "Raise Claims with Documents",
      desc: "File a claim by providing the incident date, reason, and supporting documents. Upload files directly through the portal and submit instantly.",
    },
    {
      icon: "🔄",
      bg: "#fdf4ff",
      title: "6-Stage Claim Lifecycle",
      desc: "Every claim moves through: SUBMITTED → UNDER_REVIEW → RECOMMENDED → APPROVED / REJECTED - with a full timestamped status history.",
    },
    {
      icon: "💳",
      bg: "#fff7ed",
      title: "Premium Payment Tracking",
      desc: "Track every premium payment against your policy. View payment history, due dates, and total premiums paid - right from your dashboard.",
    },
    {
      icon: "📄",
      bg: "#ecfdf5",
      title: "PDF Export for Everything",
      desc: "Download claim summaries and policy details as formatted PDFs in one click - available from both Staff and Customer portals.",
    },
  ];

  const steps = [
    {
      num: "01",
      title: "Register & Browse Products",
      desc: "Create a free customer account, then browse Health, Life, Motor or Travel insurance products and their available plans.",
    },
    {
      num: "02",
      title: "Purchase a Policy",
      desc: "Select a plan, complete your details, and submit a purchase request. Staff will issue your policy with full coverage documentation.",
    },
    {
      num: "03",
      title: "Raise a Claim",
      desc: "When you need to claim, submit the incident details and upload supporting documents directly from your portal.",
    },
    {
      num: "04",
      title: "Staff Reviews - Admin Decides",
      desc: "Your assigned staff member reviews and recommends a decision. The Admin makes the final APPROVED or REJECTED call - all tracked in real time.",
    },
  ];

  const portals = [
    {
      icon: "🔧",
      bg: "rgba(59,130,246,0.2)",
      title: "Admin Portal",
      desc: "Create insurance products & plans, manage staff users, issue policies, make final claim decisions, and view platform-wide analytics.",
      link: "/login",
      linkLabel: "Admin Login",
    },
    {
      icon: "🧑‍💼",
      bg: "rgba(168,85,247,0.2)",
      title: "Staff Portal",
      desc: "Review assigned claims, recommend approvals or rejections, issue policies, manage customer details and premium payments.",
      link: "/login",
      linkLabel: "Staff Login",
    },
    {
      icon: "👤",
      bg: "rgba(34,197,94,0.2)",
      title: "Customer Portal",
      desc: "Browse plans, purchase policies, raise claims, upload documents, track claim status, and view your complete payment history.",
      link: "/register",
      linkLabel: "Create Free Account",
      highlight: true,
    },
  ];

  return (
    <div className="lp-root">
      {/* ── NAVBAR ── */}
      <nav className={`lp-nav ${scrolled ? "scrolled" : ""}`}>
        <Link to="/" className="lp-nav-brand">
          <img src={logoSrc} alt="InsuranceFlow" />
          <span>InsuranceFlow</span>
        </Link>
        <ul className="lp-nav-links">
          <li>
            <a href="#features">Features</a>
          </li>
          <li>
            <a href="#how-it-works">How It Works</a>
          </li>
          <li>
            <a href="#portals">Portals</a>
          </li>
        </ul>
        <div className="lp-nav-cta">
          <Link
            to="/login"
            className="lp-btn-secondary"
            style={{ padding: "0.55rem 1.25rem", fontSize: "0.875rem" }}
          >
            Sign In
          </Link>
          <Link
            to="/register"
            className="lp-btn-primary"
            style={{ padding: "0.55rem 1.25rem", fontSize: "0.875rem" }}
          >
            Get Started
          </Link>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="lp-hero">
        <div className="lp-hero-blob1" />
        <div className="lp-hero-blob2" />
        <div className="container">
          <div className="row align-items-center lp-hero-content">
            <div className="col-lg-6">
              <div className="lp-badge">
                <span className="lp-badge-dot" />
                Health · Life · Motor · Travel Insurance
              </div>
              <h1>
                Policies, Claims &<br />
                <span className="lp-gradient-text">Payments - all</span>
                <br />
                in one platform.
              </h1>
              <p className="lp-hero-sub">
                InsuranceFlow connects customers, staff, and admins in a single
                end-to-end insurance management system - from purchasing a
                policy to getting a claim settled.
              </p>
              <div className="lp-hero-actions">
                <Link to="/register" className="lp-btn-primary">
                  Start for free <i className="bi bi-arrow-right" />
                </Link>
                <a href="#how-it-works" className="lp-btn-secondary">
                  <i className="bi bi-play-circle" /> See how it works
                </a>
              </div>
              <div className="lp-hero-stats">
                <div>
                  <div className="lp-hero-stat-val">4 Types</div>
                  <div className="lp-hero-stat-label">Insurance Products</div>
                </div>
                <div>
                  <div className="lp-hero-stat-val">6 Stages</div>
                  <div className="lp-hero-stat-label">Claim Lifecycle</div>
                </div>
                <div>
                  <div className="lp-hero-stat-val">3 Portals</div>
                  <div className="lp-hero-stat-label">
                    Admin · Staff · Customer
                  </div>
                </div>
              </div>
            </div>

            <div className="col-lg-6 d-none d-lg-block">
              <div className="lp-hero-image-wrap text-center">
                <img
                  src={heroImg}
                  alt="InsuranceFlow dashboard"
                  style={{
                    maxWidth: "380px",
                    width: "100%",
                    filter: "drop-shadow(0 30px 50px rgba(29,78,216,0.25))",
                    animation: "lpFloat 6s ease-in-out infinite",
                  }}
                />
                <div
                  className="lp-hero-card-float"
                  style={{
                    position: "absolute",
                    top: "15%",
                    right: "-20px",
                    maxWidth: "200px",
                    padding: "1rem 1.25rem",
                  }}
                >
                  <div className="d-flex align-items-center gap-2 mb-1">
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 8,
                        background: "#dcfce7",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "1rem",
                      }}
                    >
                      ✅
                    </div>
                    <div>
                      <div
                        style={{
                          fontSize: "0.7rem",
                          color: "#64748b",
                          fontWeight: 600,
                        }}
                      >
                        Claim #CLM-0091
                      </div>
                      <div
                        style={{
                          fontSize: "0.75rem",
                          fontWeight: 700,
                          color: "#16a34a",
                        }}
                      >
                        APPROVED
                      </div>
                    </div>
                  </div>
                  <div style={{ fontSize: "0.7rem", color: "#94a3b8" }}>
                    Staff reviewed · Admin decided
                  </div>
                </div>
                {/* Floating policy card */}
                <div
                  className="lp-hero-card-float"
                  style={{
                    position: "absolute",
                    bottom: "12%",
                    left: "-30px",
                    maxWidth: "210px",
                    padding: "1rem 1.25rem",
                    animationDelay: "-3s",
                  }}
                >
                  <div
                    style={{
                      fontSize: "0.7rem",
                      color: "#64748b",
                      fontWeight: 600,
                      marginBottom: "0.4rem",
                    }}
                  >
                    🏥 Health Insurance Policy
                  </div>
                  <div
                    style={{
                      fontSize: "0.85rem",
                      fontWeight: 700,
                      color: "#1d4ed8",
                      marginBottom: "0.25rem",
                    }}
                  >
                    ₹5,00,000 Coverage
                  </div>
                  <div
                    style={{
                      fontSize: "0.7rem",
                      color: "#22c55e",
                      fontWeight: 600,
                    }}
                  >
                    ● ACTIVE · Premium Paid
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className="lp-section" id="features">
        <div className="container">
          <div className="text-center mb-5">
            <div className="lp-badge mx-auto mb-3">Platform Features</div>
            <h2 className="lp-section-title">
              Everything you need,
              <br />
              nothing you don't.
            </h2>
            <p className="lp-section-sub mx-auto" style={{ maxWidth: 520 }}>
              From policy issuance to claim settlement, every step is handled
              with precision and transparency.
            </p>
          </div>
          <div className="row g-4">
            {features.map((f, i) => (
              <div className="col-md-6 col-lg-4" key={i}>
                <div className="lp-feature-card">
                  <div className="lp-feature-icon" style={{ background: f.bg }}>
                    {f.icon}
                  </div>
                  <h5>{f.title}</h5>
                  <p>{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="lp-section lp-section-dark" id="how-it-works">
        <div className="container">
          <div className="row align-items-center g-5">
            <div className="col-lg-5">
              <div
                className="lp-badge mb-3"
                style={{
                  background: "rgba(255,255,255,0.1)",
                  color: "#93c5fd",
                  borderColor: "rgba(255,255,255,0.15)",
                }}
              >
                Simple Process
              </div>
              <h2 className="lp-section-title">
                How claims actually
                <br />
                get processed.
              </h2>
              <p className="lp-section-sub" style={{ maxWidth: 380 }}>
                We've eliminated the complexity of traditional insurance so you
                can focus on what matters.
              </p>
            </div>
            <div className="col-lg-7">
              <div className="d-flex flex-column gap-4">
                {steps.map((s, i) => (
                  <div className="lp-step" key={i}>
                    <div className="lp-step-num">{s.num}</div>
                    <div className="lp-step-body">
                      <h6>{s.title}</h6>
                      <p>{s.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── PORTALS ── */}
      <section className="lp-section lp-section-alt" id="portals">
        <div className="container">
          <div className="text-center mb-5">
            <div className="lp-badge mx-auto mb-3">Role-Based Portals</div>
            <h2 className="lp-section-title">
              Three portals,
              <br />
              one connected system.
            </h2>
            <p className="lp-section-sub mx-auto" style={{ maxWidth: 500 }}>
              Every role has a purpose-built experience - customers purchase,
              staff process, admins decide.
            </p>
          </div>
          <div className="row g-4">
            {portals.map((p, i) => (
              <div className="col-md-4" key={i}>
                <div
                  className="lp-portal-card h-100"
                  style={{
                    background: p.highlight
                      ? "linear-gradient(135deg, #1d4ed8 0%, #0ea5e9 100%)"
                      : "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)",
                    border: p.highlight
                      ? "none"
                      : "1px solid rgba(255,255,255,0.08)",
                  }}
                >
                  <div className="lp-portal-icon" style={{ background: p.bg }}>
                    {p.icon}
                  </div>
                  <h5>{p.title}</h5>
                  <p>{p.desc}</p>
                  <Link
                    to={p.link}
                    className={
                      p.highlight ? "lp-btn-white" : "lp-btn-secondary"
                    }
                    style={
                      p.highlight
                        ? {}
                        : {
                            background: "rgba(255,255,255,0.08)",
                            color: "#fff",
                            borderColor: "rgba(255,255,255,0.2)",
                          }
                    }
                  >
                    {p.linkLabel} <i className="bi bi-arrow-right" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA BAND ── */}
      <section className="lp-section">
        <div className="container">
          <div className="lp-cta-band">
            <h2>
              Start managing insurance
              <br />
              the right way.
            </h2>
            <p>
              Register as a customer, browse real plans, and experience the full
              claim journey - from submission to settlement.
            </p>
            <div
              className="d-flex justify-content-center gap-3 flex-wrap"
              style={{ position: "relative", zIndex: 1 }}
            >
              <Link to="/register" className="lp-btn-white">
                Create free account <i className="bi bi-arrow-right" />
              </Link>
              <Link
                to="/login"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  color: "rgba(255,255,255,0.85)",
                  fontWeight: 600,
                  fontSize: "0.95rem",
                  textDecoration: "none",
                  padding: "0.85rem 1.5rem",
                  border: "1.5px solid rgba(255,255,255,0.35)",
                  borderRadius: 12,
                  transition: "border-color 0.2s, background 0.2s",
                  position: "relative",
                  zIndex: 1,
                }}
              >
                Already have an account?{" "}
                <i className="bi bi-box-arrow-in-right" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="lp-footer">
        <div className="container">
          <div className="row align-items-center">
            <div className="col-md-6 mb-3 mb-md-0">
              <div className="lp-footer-brand">
                <img src={logoSrc} alt="InsuranceFlow" />
                <span>InsuranceFlow</span>
              </div>
              <p className="mb-0">Modern insurance management for everyone.</p>
            </div>
            <div className="col-md-6 text-md-end">
              <div className="d-flex gap-3 justify-content-md-end">
                <Link
                  to="/login"
                  style={{
                    color: "#64748b",
                    textDecoration: "none",
                    fontSize: "0.875rem",
                  }}
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  style={{
                    color: "#64748b",
                    textDecoration: "none",
                    fontSize: "0.875rem",
                  }}
                >
                  Register
                </Link>
              </div>
              <p
                className="mt-2 mb-0"
                style={{ fontSize: "0.8rem", color: "#334155" }}
              >
                © {new Date().getFullYear()} InsuranceFlow. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
