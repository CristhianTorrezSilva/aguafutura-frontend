import { cloneElement, isValidElement, useId } from 'react';

export default function FormField({ label, children, help }) {
  const id = useId();
  const control = isValidElement(children) && !children.props.id
    ? cloneElement(children, { id })
    : children;

  return (
    <div className="form-row">
      <label htmlFor={id}>{label}</label>
      {control}
      {help && <small>{help}</small>}
    </div>
  );
}
