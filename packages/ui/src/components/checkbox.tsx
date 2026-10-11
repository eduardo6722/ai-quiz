import type { InputHTMLAttributes, ReactNode } from 'react';
import { cn } from '../lib/cn';

const optionBase =
  'flex min-h-16 w-full cursor-pointer items-start gap-3 rounded-2xl border px-4 py-4 text-left text-base leading-relaxed transition-colors focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-60 motion-reduce:transition-none';

export function Checkbox({
  className,
  children,
  checked,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { children: ReactNode }) {
  const id = props.id ?? `${props.name}-${props.value}`;
  return (
    <label
      htmlFor={id}
      className={cn(
        optionBase,
        checked
          ? 'border-primary bg-mint text-foreground'
          : 'border-border bg-card text-foreground hover:border-primary/50 hover:bg-sage',
        className,
      )}
    >
      <input
        {...props}
        id={id}
        type="checkbox"
        checked={checked}
        className="mt-1 size-5 shrink-0 accent-primary"
      />
      <span className="min-w-0 flex-1 break-words">{children}</span>
    </label>
  );
}
