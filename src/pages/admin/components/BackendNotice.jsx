import { backendFeatures } from "../data/adminData";

export default function BackendNotice({ compact = false }) {
  return (
    <aside className={`backend-notice${compact ? " backend-notice--compact" : ""}`}>
      <strong>Siap disambungkan backend</strong>
      <p>Bagian ini sekarang masih demo frontend. Nanti tinggal diarahkan ke API dan database.</p>
      {!compact && (
        <ul>
          {backendFeatures.map((feature) => <li key={feature}>{feature}</li>)}
        </ul>
      )}
    </aside>
  );
}
