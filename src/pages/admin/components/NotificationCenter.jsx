import { notificationSeed } from "../data/adminData";

export default function NotificationCenter({ notify }) {
  return (
    <div className="notification-center">
      {notificationSeed.map((item) => (
        <button
          className="notification-center__item"
          type="button"
          key={item.id}
          onClick={() => notify("Notifikasi dibuka", item.detail)}
        >
          <span />
          <div>
            <strong>{item.title}</strong>
            <p>{item.detail}</p>
            <small>{item.time}</small>
          </div>
        </button>
      ))}
      <div className="backend-inline-note">
        Notifikasi admin akan tampil otomatis saat ada pembaruan.
      </div>
    </div>
  );
}
