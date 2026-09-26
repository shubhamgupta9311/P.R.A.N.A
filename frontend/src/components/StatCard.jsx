function StatCard({ title, value, note, tone }) {
  return (
    <article className={`stat-card stat-${tone}`}>
      <div className="stat-card-top"><span className="stat-mark" /><span className="stat-caption">FIELD METRIC</span></div>
      <p className="stat-title">{title}</p>
      <strong className="stat-value">{value}</strong>
      <p className="stat-note">{note}</p>
    </article>
  );
}

export default StatCard;