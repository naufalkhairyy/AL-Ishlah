export default function ToastStack({ toasts }) {
  return (
    <div className="admin-toasts" aria-live="polite">
      {toasts.map((toast) => (
        <div className={`admin-toast admin-toast--${toast.type}`} key={toast.id}>
          <strong>{toast.title}</strong>
          <span>{toast.message}</span>
        </div>
      ))}
    </div>
  );
}
