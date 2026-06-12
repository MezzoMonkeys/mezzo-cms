import { type InputHTMLAttributes, type TextareaHTMLAttributes } from 'react'

interface FieldWrapProps {
  label: string
  hint?: string
  error?: string
  required?: boolean
  counter?: { current: number; target: [number, number] }
  children: React.ReactNode
}

export function FieldWrap({ label, hint, error, required, counter, children }: FieldWrapProps) {
  const [min, max] = counter?.target ?? [0, 0]
  const count = counter?.current ?? 0
  const counterColor =
    counter === undefined ? undefined : count > max ? '#ef4444' : count >= min ? '#16a34a' : 'var(--ci-muted)'

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium" style={{ color: 'var(--ci-navy)' }}>
          {label}
          {required && <span style={{ color: '#ef4444' }}> *</span>}
        </label>
        {counter !== undefined && (
          <span className="text-xs" style={{ color: counterColor }}>
            {count}/{max}
          </span>
        )}
      </div>
      {hint && <p className="text-xs" style={{ color: 'var(--ci-muted)' }}>{hint}</p>}
      {children}
      {error && <p className="text-xs" style={{ color: '#ef4444' }}>{error}</p>}
    </div>
  )
}

const inputStyle = {
  background: '#ffffff',
  border: '1px solid var(--ci-border)',
  borderRadius: '8px',
  padding: '8px 12px',
  fontSize: '14px',
  color: 'var(--ci-navy)',
  outline: 'none',
  width: '100%',
  transition: 'border-color 0.15s',
}

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  hint?: string
  error?: string
  counter?: { current: number; target: [number, number] }
}

export function TextField({ label, hint, error, counter, ...props }: TextFieldProps) {
  return (
    <FieldWrap label={label} hint={hint} error={error} required={props.required} counter={counter}>
      <input
        {...props}
        style={inputStyle}
        onFocus={e => (e.currentTarget.style.borderColor = '#f4bf00')}
        onBlur={e => (e.currentTarget.style.borderColor = error ? '#ef4444' : 'var(--ci-border)')}
      />
    </FieldWrap>
  )
}

interface TextareaFieldProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string
  hint?: string
  error?: string
  counter?: { current: number; target: [number, number] }
}

export function TextareaField({ label, hint, error, counter, ...props }: TextareaFieldProps) {
  return (
    <FieldWrap label={label} hint={hint} error={error} required={props.required} counter={counter}>
      <textarea
        {...props}
        rows={props.rows ?? 3}
        style={{ ...inputStyle, resize: 'vertical' }}
        onFocus={e => (e.currentTarget.style.borderColor = '#f4bf00')}
        onBlur={e => (e.currentTarget.style.borderColor = error ? '#ef4444' : 'var(--ci-border)')}
      />
    </FieldWrap>
  )
}

interface ToggleFieldProps {
  label: string
  hint?: string
  checked: boolean
  onChange: (checked: boolean) => void
}

export function ToggleField({ label, hint, checked, onChange }: ToggleFieldProps) {
  return (
    <label className="flex items-start gap-3 cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={e => onChange(e.target.checked)}
        className="mt-0.5 w-4 h-4 rounded"
        style={{ accentColor: '#f4bf00' }}
      />
      <div>
        <span className="text-sm font-medium" style={{ color: 'var(--ci-navy)' }}>
          {label}
        </span>
        {hint && <p className="text-xs mt-0.5" style={{ color: 'var(--ci-muted)' }}>{hint}</p>}
      </div>
    </label>
  )
}

interface SelectFieldProps {
  label: string
  hint?: string
  value: string
  onChange: (value: string) => void
  options: { value: string; label: string }[]
}

export function SelectField({ label, hint, value, onChange, options }: SelectFieldProps) {
  return (
    <FieldWrap label={label} hint={hint}>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{ ...inputStyle, cursor: 'pointer' }}
        onFocus={e => (e.currentTarget.style.borderColor = '#f4bf00')}
        onBlur={e => (e.currentTarget.style.borderColor = 'var(--ci-border)')}
      >
        {options.map(o => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </FieldWrap>
  )
}
