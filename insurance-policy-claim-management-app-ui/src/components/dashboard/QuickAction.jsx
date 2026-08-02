import { Link } from "react-router-dom";
import BentoCard from "../../common/BentoCard";

const QuickAction = ({ icon, label, to, color }) => (
  <Link to={to} className="text-decoration-none" style={{ display: "contents" }}>
    <BentoCard>
      <div className="d-flex align-items-center gap-3">
        <div className="ip-bento-stat-icon" style={{ background: color }}>
          <i className={`bi ${icon}`} style={{ color: "#fff", fontSize: "1.1rem" }} />
        </div>
        <span style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--ip-text-primary)" }}>{label}</span>
      </div>
    </BentoCard>
  </Link>
);

export default QuickAction;
