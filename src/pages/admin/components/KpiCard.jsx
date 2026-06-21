import AdminIcon from "./AdminIcon";

export default function KpiCard({ title, value, note, badge, tone = "green" }) {
  return (
    <article className="admin-kpi reveal-card">
      <div className={`admin-kpi__icon admin-kpi__icon--${tone}`}>
        <AdminIcon name="grid" />
      </div>
      {badge && <span className={`admin-pill admin-pill--${tone}`}>{badge}</span>}
      <p>{title}</p>
      <strong>{value}</strong>
      <small>{note}</small>
    </article>
  );
}
