import Link from "next/link";
export function Brand() {
  return (
    <Link href="/" className="brand">
      <span className="brand-mark">w</span> Wavelength
      <span className="brand-caption">BUSINESS WORKSPACE</span>
    </Link>
  );
}
export function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <section className={`card ${className}`}>{children}</section>;
}
export function Heading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <header className="page-heading">
      <p className="eyebrow">{eyebrow}</p>
      <h1>{title}</h1>
      <p className="muted">{description}</p>
    </header>
  );
}
export function Badge({ children }: { children: React.ReactNode }) {
  return <span className="badge">{children}</span>;
}
export function Empty({ children }: { children: React.ReactNode }) {
  return <div className="empty">{children}</div>;
}
