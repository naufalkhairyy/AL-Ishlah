import { backendFeatures } from "../data/adminData";

export default function BackendNotice({ compact = false }) {
  return (
    <aside className={`backend-notice${compact ? " backend-notice--compact" : ""}`}>
      <strong>Kesiapan Sistem</strong>
      <p>Bagian ini siap digunakan untuk operasional admin dan sinkronisasi data.</p>
      {!compact && (
        <ul>
          {backendFeatures.map((feature) => <li key={feature}>{feature}</li>)}
        </ul>
      )}
    </aside>
  );
}
