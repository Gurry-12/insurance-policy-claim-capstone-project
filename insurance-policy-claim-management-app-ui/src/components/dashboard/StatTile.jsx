import BentoCard from "../../common/BentoCard";

const StatTile = ({ icon, label, value, color }) => (
  <BentoCard className="ip-bento-stat-tile">
    <div className="d-flex align-items-center gap-3">
      <div className="ip-bento-stat-icon" style={{ background: color }}>
        <i className={`bi ${icon}`} style={{ color: "#fff" }} />
      </div>
      <div>
        <div className="ip-bento-stat-value">
          {value ?? <span className="placeholder col-4" />}
        </div>
        <div className="ip-bento-stat-label">{label}</div>
      </div>
    </div>
  </BentoCard>
);

export default StatTile;
