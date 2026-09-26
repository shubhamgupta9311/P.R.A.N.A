function Sidebar() {
  const sections = [
    ["dashboard", "Overview", "01"],
    ["risk-map", "Risk map", "02"],
    ["villages", "Villages", "03"],
    ["relocation", "Relocation", "04"],
    ["analytics", "Analytics", "05"],
  ];
  return (
    <aside className="sidebar">
      <a className="brand" href="#dashboard" aria-label="PRANA overview">
        <span className="brand-mark">P</span>
        <span><strong>PRANA</strong><small>RISK INTELLIGENCE</small></span>
      </a>
      <div className="sidebar-rule" />
      <p className="nav-caption">WORKSPACE</p>
      <nav className="side-nav" aria-label="Main navigation">
        {sections.map(([id, label, number]) => (
          <a key={id} href={`#${id}`} className="nav-link">
            <span className="nav-number">{number}</span><span>{label}</span>
            {id === "villages" && <span className="nav-indicator" />}
          </a>
        ))}
      </nav>
      <div className="sidebar-bottom"><span className="status-dot" /><span>Monitoring active</span><strong>LIVE</strong></div>
    </aside>
  );
}

export default Sidebar;
