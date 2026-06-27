export default function DocumentMock({ compact = false }) {
  return (
    <div className={`document-mock${compact ? " document-mock--compact" : ""}`}>
      <span />
      <span />
      <span />
      <div className="document-mock__grid">
        {Array.from({ length: compact ? 18 : 42 }).map((_, index) => <i key={index} />)}
      </div>
      <b>DATA WALI</b>
      <span />
      <span />
      <span />
    </div>
  );
}
