import type { AnchorHTMLAttributes, ButtonHTMLAttributes } from "react";
import { cn } from "../lib/cn";

const buttonClassName =
  "inline-flex min-h-11 items-center justify-center rounded-xl bg-primary px-6 text-base font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 motion-reduce:transition-none";

type ButtonAsButton = ButtonHTMLAttributes<HTMLButtonElement> & { href?: undefined };
type ButtonAsLink = AnchorHTMLAttributes<HTMLAnchorElement> & { href: string };

export type ButtonProps = ButtonAsButton | ButtonAsLink;

export function Button({ className, href, ...props }: ButtonProps) {
  const classes = cn(buttonClassName, className);

  if (href) {
    return <a href={href} className={classes} {...(props as AnchorHTMLAttributes<HTMLAnchorElement>)} />;
  }

  return <button className={classes} {...(props as ButtonHTMLAttributes<HTMLButtonElement>)} />;
}
