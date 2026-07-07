import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

const AppPopupContext = createContext({ showPopup: () => {} });

export function AppPopupProvider({ children }) {
  const [popup, setPopup] = useState(null);

  const closePopup = useCallback(() => setPopup(null), []);

  const showPopup = useCallback((title, message = "", type = "info") => {
    setPopup({
      id: Date.now(),
      title,
      message,
      type,
    });
  }, []);

  useEffect(() => {
    const originalAlert = window.alert;
    window.alert = (message = "") => {
      showPopup("Notifikasi", String(message), "info");
    };

    return () => {
      window.alert = originalAlert;
    };
  }, [showPopup]);

  const value = useMemo(() => ({ showPopup, closePopup }), [showPopup, closePopup]);

  return (
    <AppPopupContext.Provider value={value}>
      {children}
      {popup && (
        <div className="app-popup-backdrop" role="presentation" onMouseDown={closePopup}>
          <section
            className={`app-popup app-popup--${popup.type}`}
            role="dialog"
            aria-modal="true"
            aria-labelledby="app-popup-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <button className="app-popup__close" type="button" aria-label="Tutup popup" onClick={closePopup}>x</button>
            <span className="app-popup__mark" aria-hidden="true" />
            <h2 id="app-popup-title">{popup.title}</h2>
            {popup.message && <p>{popup.message}</p>}
            <button className="app-popup__action" type="button" onClick={closePopup}>Mengerti</button>
          </section>
        </div>
      )}
    </AppPopupContext.Provider>
  );
}

export function useAppPopup() {
  return useContext(AppPopupContext);
}
