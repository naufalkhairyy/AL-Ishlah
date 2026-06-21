export default function Modal({ modal, onClose }) {
  if (!modal) return null;

  return (
    <div className="admin-modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section className="admin-modal" role="dialog" aria-modal="true" onMouseDown={(event) => event.stopPropagation()}>
        <button className="admin-modal__close" type="button" onClick={onClose}>x</button>
        <span className="admin-modal__eyebrow">{modal.eyebrow || "Portal Admin"}</span>
        <h2>{modal.title}</h2>
        <p>{modal.message}</p>
        {modal.body}
        <button className="admin-primary" type="button" onClick={onClose}>Selesai</button>
      </section>
    </div>
  );
}
