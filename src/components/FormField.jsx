export default function FormField({ label, children }) {
  return (
    <div className="form-row">
      <label>{label}</label>
      {children}
    </div>
  );
}
