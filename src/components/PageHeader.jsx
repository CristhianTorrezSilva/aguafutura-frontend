export default function PageHeader({ title, description, action, eyebrow, badge }) {
  return (
    <header className="page-header">
      <div>
        {(eyebrow || badge) && (
          <div className="page-kicker">
            {eyebrow && <span>{eyebrow}</span>}
            {badge && <strong>{badge}</strong>}
          </div>
        )}
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {action && <div className="page-header-actions">{action}</div>}
    </header>
  );
}
