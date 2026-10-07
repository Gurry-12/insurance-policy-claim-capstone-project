import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import logoSrc from "../assets/logo/insurance-vector.png";
import heroImg from "../assets/logo/insurance-heart-vector.png";
import "../pages/css/LandingPage.css";
import { getPlatformStats } from "../services/publicService";

const DEMO_ACCOUNTS = {
  admin: {
    title: "System Administrator",
    badge: "👑 Admin",
    badgeColor: "#3b82f6",
    email: "admin@insurance.com",
    password: "Admin@123",
    tagline: "Platform governance, products, plans & final claim approvals",
    capabilities: ["Manage Products & Plans", "Final Claim Decisions", "User Activation & Roles"]
  },
  staff: {
    title: "Internal Staff Specialist",
    badge: "🛡️ Staff",
    badgeColor: "#06b6d4",
    email: "staff@insurance.com",
    password: "Staff@123",
    tagline: "Underwriting & claim review for Health specialty",
    capabilities: ["Review Claims & Documents", "Issue Policies", "Recommend Payouts"]
  },
  customer: {
    title: "Active Customer",
    badge: "👤 Customer",
    badgeColor: "#10b981",
    email: "customer@insurance.com",
    password: "Customer@123",
    tagline: "Pre-verified account with completed profile",
    capabilities: ["Purchase Policies", "Submit Claims with Docs", "Track Payment History"]
  }
};

const LandingPage = () => {
  const [scrolled, setScrolled] = useState(false);
  const [stats, setStats] = useState(null);
  const [demoOpen, setDemoOpen] = useState(false);
  const [selectedDemoRole, setSelectedDemoRole] = useState("admin");

  const copyCred = (text, label) => {
    navigator.clipboard.writeText(text);
    toast.success(`Copied ${label}!`, { icon: "📋", duration: 2000 });
  };

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    getPlatformStats().then(setStats).catch(() => {});
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
        <div className="lp-nav-cta d-flex align-items-center gap-2">
          <button
            type="button"
            onClick={() => setDemoOpen((v) => !v)}
            className="btn btn-sm d-inline-flex align-items-center gap-1.5 px-3 py-1.5 rounded-pill shadow-sm"
            style={{
              background: "rgba(59, 130, 246, 0.1)",
              color: "#1d4ed8",
              border: "1px solid rgba(59, 130, 246, 0.25)",
              fontSize: "0.82rem",
              fontWeight: 600,
              cursor: "pointer"
            }}
            title="View pre-configured demo test accounts"
          >
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#22c55e", display: "inline-block", boxShadow: "0 0 8px #22c55e" }} />
            Demo Accounts
          </button>
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
                  <div className="lp-hero-stat-val">
                    {stats ? `${stats.activeProducts} Types` : "4 Types"}
                  </div>
                  <div className="lp-hero-stat-label">Insurance Products</div>
                </div>
                <div>
                  <div className="lp-hero-stat-val">
                    {stats ? `${stats.activePlans}+` : "12+"}
                  </div>
                  <div className="lp-hero-stat-label">Active Plans</div>
                </div>
                <div>
                  <div className="lp-hero-stat-val">
                    {stats ? `${stats.totalPolicies}+` : "250+"}
                  </div>
                  <div className="lp-hero-stat-label">
                    Policies Issued
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

      {/* ── HIGH-END RECRUITER & DEMO ACCESS MODAL ── */}
      {demoOpen && (
        <div
          className="lp-modal-backdrop"
          onClick={() => setDemoOpen(false)}
        >
          <div
            className="lp-demo-modal"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              className="d-flex align-items-center justify-content-between px-4 px-md-5 py-4"
              style={{
                borderBottom: "1px solid #e2e8f0",
                background: "linear-gradient(90deg, #eff6ff 0%, #ffffff 100%)"
              }}
            >
              <div className="d-flex align-items-center gap-3">
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 14,
                    background: "linear-gradient(135deg, #1d4ed8 0%, #0ea5e9 100%)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#fff",
                    fontSize: "1.35rem",
                    boxShadow: "0 8px 20px rgba(29, 78, 216, 0.35)",
                    flexShrink: 0
                  }}
                >
                  ⚡
                </div>
                <div>
                  <h5 className="mb-1 fw-bold" style={{ fontSize: "1.25rem", color: "#0f172a" }}>
                    Recruiter & Demo Access Personas
                  </h5>
                  <p className="mb-0 text-muted small" style={{ fontSize: "0.85rem" }}>
                    Select any pre-configured persona below to test complete end-to-end workflows
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="btn-close ms-2"
                onClick={() => setDemoOpen(false)}
                aria-label="Close"
                style={{ padding: "0.75rem", fontSize: "0.9rem" }}
              />
            </div>

            {/* Modal Body - 3 Persona Cards with generous padding & margins */}
            <div className="p-4 p-md-5" style={{ maxHeight: "75vh", overflowY: "auto" }}>
              <div className="row g-4 g-lg-4">
                {/* Admin Card */}
                <div className="col-lg-4 col-md-12">
                  <div className="lp-persona-card admin h-100 d-flex flex-column justify-content-between">
                    <div>
                      <div className="d-flex align-items-center justify-content-between mb-3 pb-1">
                        <span
                          className="badge rounded-pill px-3 py-2"
                          style={{ background: "#16a34a", color: "#ffffff", fontSize: "0.78rem", fontWeight: 700, letterSpacing: "0.02em" }}
                        >
                          👑 Administrator
                        </span>
                        <span className="text-success fw-bold small" style={{ fontSize: "0.75rem" }}>
                          Full Control
                        </span>
                      </div>
                      <h6 className="fw-bold mb-2" style={{ color: "#14532d", fontSize: "1.1rem" }}>
                        System Admin
                      </h6>
                      <p className="text-muted small mb-4" style={{ fontSize: "0.84rem", lineHeight: 1.5 }}>
                        Manage products, plans, users, approve policies & issue claim decisions.
                      </p>

                      {/* Credentials Box */}
                      <div className="p-3.5 rounded-3 my-3.5" style={{ background: "#ffffff", border: "1px solid #dcfce7", padding: "1rem" }}>
                        <div className="d-flex justify-content-between align-items-center mb-2" style={{ fontSize: "0.82rem" }}>
                          <span className="text-muted">Email:</span>
                          <div className="d-flex align-items-center gap-1.5">
                            <span className="fw-bold font-monospace text-dark" style={{ fontSize: "0.82rem" }}>admin@insurance.com</span>
                            <button
                              type="button"
                              className="btn btn-sm btn-link p-0 text-success ms-1"
                              onClick={() => copyCred("admin@insurance.com", "Admin Email")}
                              title="Copy Email"
                            >
                              <i className="bi bi-clipboard" />
                            </button>
                          </div>
                        </div>
                        <div className="d-flex justify-content-between align-items-center" style={{ fontSize: "0.82rem" }}>
                          <span className="text-muted">Password:</span>
                          <div className="d-flex align-items-center gap-1.5">
                            <span className="fw-bold font-monospace text-dark" style={{ fontSize: "0.82rem" }}>Admin@123</span>
                            <button
                              type="button"
                              className="btn btn-sm btn-link p-0 text-success ms-1"
                              onClick={() => copyCred("Admin@123", "Admin Password")}
                              title="Copy Password"
                            >
                              <i className="bi bi-clipboard" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    <Link
                      to="/login"
                      onClick={() => {
                        copyCred("admin@insurance.com", "Admin Credentials");
                        setDemoOpen(false);
                      }}
                      className="btn w-100 py-2.5 mt-3 rounded-3 text-white fw-bold d-flex align-items-center justify-content-center gap-2 shadow-sm"
                      style={{ background: "#16a34a", border: "none", fontSize: "0.88rem", transition: "all 0.2s" }}
                    >
                      Sign In as Admin <i className="bi bi-arrow-right" />
                    </Link>
                  </div>
                </div>

                {/* Staff Card */}
                <div className="col-lg-4 col-md-12">
                  <div className="lp-persona-card staff h-100 d-flex flex-column justify-content-between">
                    <div>
                      <div className="d-flex align-items-center justify-content-between mb-3 pb-1">
                        <span
                          className="badge rounded-pill px-3 py-2"
                          style={{ background: "#2563eb", color: "#ffffff", fontSize: "0.78rem", fontWeight: 700, letterSpacing: "0.02em" }}
                        >
                          🛡️ Internal Staff
                        </span>
                        <span className="text-primary fw-bold small" style={{ fontSize: "0.75rem" }}>
                          Health Specialist
                        </span>
                      </div>
                      <h6 className="fw-bold mb-2" style={{ color: "#1e3a8a", fontSize: "1.1rem" }}>
                        Staff Reviewer
                      </h6>
                      <p className="text-muted small mb-4" style={{ fontSize: "0.84rem", lineHeight: 1.5 }}>
                        Review claims, inspect uploaded documents & recommend decisions.
                      </p>

                      {/* Credentials Box */}
                      <div className="p-3.5 rounded-3 my-3.5" style={{ background: "#ffffff", border: "1px solid #dbeafe", padding: "1rem" }}>
                        <div className="d-flex justify-content-between align-items-center mb-2" style={{ fontSize: "0.82rem" }}>
                          <span className="text-muted">Email:</span>
                          <div className="d-flex align-items-center gap-1.5">
                            <span className="fw-bold font-monospace text-dark" style={{ fontSize: "0.82rem" }}>staff@insurance.com</span>
                            <button
                              type="button"
                              className="btn btn-sm btn-link p-0 text-primary ms-1"
                              onClick={() => copyCred("staff@insurance.com", "Staff Email")}
                              title="Copy Email"
                            >
                              <i className="bi bi-clipboard" />
                            </button>
                          </div>
                        </div>
                        <div className="d-flex justify-content-between align-items-center" style={{ fontSize: "0.82rem" }}>
                          <span className="text-muted">Password:</span>
                          <div className="d-flex align-items-center gap-1.5">
                            <span className="fw-bold font-monospace text-dark" style={{ fontSize: "0.82rem" }}>Staff@123</span>
                            <button
                              type="button"
                              className="btn btn-sm btn-link p-0 text-primary ms-1"
                              onClick={() => copyCred("Staff@123", "Staff Password")}
                              title="Copy Password"
                            >
                              <i className="bi bi-clipboard" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    <Link
                      to="/login"
                      onClick={() => {
                        copyCred("staff@insurance.com", "Staff Credentials");
                        setDemoOpen(false);
                      }}
                      className="btn w-100 py-2.5 mt-3 rounded-3 text-white fw-bold d-flex align-items-center justify-content-center gap-2 shadow-sm"
                      style={{ background: "#2563eb", border: "none", fontSize: "0.88rem", transition: "all 0.2s" }}
                    >
                      Sign In as Staff <i className="bi bi-arrow-right" />
                    </Link>
                  </div>
                </div>

                {/* Customer Card */}
                <div className="col-lg-4 col-md-12">
                  <div className="lp-persona-card customer h-100 d-flex flex-column justify-content-between">
                    <div>
                      <div className="d-flex align-items-center justify-content-between mb-3 pb-1">
                        <span
                          className="badge rounded-pill px-3 py-2"
                          style={{ background: "#7c3aed", color: "#ffffff", fontSize: "0.78rem", fontWeight: 700, letterSpacing: "0.02em" }}
                        >
                          👤 Customer
                        </span>
                        <span className="fw-bold small" style={{ fontSize: "0.75rem", color: "#7c3aed" }}>
                          Verified Profile
                        </span>
                      </div>
                      <h6 className="fw-bold mb-2" style={{ color: "#581c87", fontSize: "1.1rem" }}>
                        Policyholder
                      </h6>
                      <p className="text-muted small mb-4" style={{ fontSize: "0.84rem", lineHeight: 1.5 }}>
                        Purchase policies, pay premiums, file claims & view real-time status.
                      </p>

                      {/* Credentials Box */}
                      <div className="p-3.5 rounded-3 my-3.5" style={{ background: "#ffffff", border: "1px solid #f3e8ff", padding: "1rem" }}>
                        <div className="d-flex justify-content-between align-items-center mb-2" style={{ fontSize: "0.82rem" }}>
                          <span className="text-muted">Email:</span>
                          <div className="d-flex align-items-center gap-1.5">
                            <span className="fw-bold font-monospace text-dark" style={{ fontSize: "0.82rem" }}>customer@insurance.com</span>
                            <button
                              type="button"
                              className="btn btn-sm btn-link p-0 text-secondary ms-1"
                              onClick={() => copyCred("customer@insurance.com", "Customer Email")}
                              title="Copy Email"
                            >
                              <i className="bi bi-clipboard" />
                            </button>
                          </div>
                        </div>
                        <div className="d-flex justify-content-between align-items-center" style={{ fontSize: "0.82rem" }}>
                          <span className="text-muted">Password:</span>
                          <div className="d-flex align-items-center gap-1.5">
                            <span className="fw-bold font-monospace text-dark" style={{ fontSize: "0.82rem" }}>Customer@123</span>
                            <button
                              type="button"
                              className="btn btn-sm btn-link p-0 text-secondary ms-1"
                              onClick={() => copyCred("Customer@123", "Customer Password")}
                              title="Copy Password"
                            >
                              <i className="bi bi-clipboard" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    <Link
                      to="/login"
                      onClick={() => {
                        copyCred("customer@insurance.com", "Customer Credentials");
                        setDemoOpen(false);
                      }}
                      className="btn w-100 py-2.5 mt-3 rounded-3 text-white fw-bold d-flex align-items-center justify-content-center gap-2 shadow-sm"
                      style={{ background: "#7c3aed", border: "none", fontSize: "0.88rem", transition: "all 0.2s" }}
                    >
                      Sign In as Customer <i className="bi bi-arrow-right" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer Tip */}
            <div
              className="px-4 px-md-5 py-3.5 text-center"
              style={{ background: "#f8fafc", borderTop: "1px solid #e2e8f0", fontSize: "0.84rem", color: "#64748b" }}
            >
              💡 <strong>Tip:</strong> Clicking any button automatically copies credentials and redirects you straight into the sign in portal.
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LandingPage;
