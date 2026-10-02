import React, { forwardRef } from "react";
import "./tokens.css";

export type IdhButtonVariant =
  | "primary" | "secondary" | "ghost" | "approve" | "reject" | "on-navy" | "outline-on-navy";
export type IdhButtonSize = "sm" | "md" | "lg";

export interface IdhButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: IdhButtonVariant;
  size?: IdhButtonSize;
  /** Icon rendered before the label (right side in RTL). */
  icon?: React.ReactNode;
  /** Icon-only round button. Requires aria-label. */
  iconOnly?: boolean;
  block?: boolean;
  loading?: boolean;
}

export const IdhButton = forwardRef<HTMLButtonElement, IdhButtonProps>(function IdhButton(
  { variant = "primary", size = "md", icon, iconOnly, block, loading = false,
    disabled, className = "", children, type = "button", ...rest },
  ref
) {
  if (iconOnly && !rest["aria-label"] && process.env.NODE_ENV !== "production") {
    console.warn("IdhButton: iconOnly buttons need an aria-label.");
  }
  const cls = [
    "idh-btn", `idh-btn--${variant}`,
    size !== "md" && `idh-btn--${size}`,
    iconOnly && "idh-btn--icon",
    block && "idh-btn--block",
    className,
  ].filter(Boolean).join(" ");

  return (
    <button ref={ref} type={type} className={cls}
      disabled={disabled || loading} aria-busy={loading || undefined} {...rest}>
      {loading ? <span className="idh-spinner" aria-hidden="true" /> : icon}
      {!iconOnly && <span>{children}</span>}
    </button>
  );
});

export const IdhFab = (props: Omit<IdhButtonProps, "iconOnly" | "size">) => (
  <IdhButton {...props} iconOnly className={`idh-fab ${props.className ?? ""}`} />
);

export type LeaveStatus = "approved" | "pending" | "rejected";
const STATUS_LABEL: Record<LeaveStatus, string> = {
  approved: "معتمد",
  pending: "قيد المراجعة",
  rejected: "مرفوض",
};
export const IdhStatusChip = ({ status }: { status: LeaveStatus }) => (
  <span className={`idh-chip idh-chip--${status}`}>{STATUS_LABEL[status]}</span>
);
