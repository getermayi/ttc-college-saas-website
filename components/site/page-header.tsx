import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";
import { cn } from "@/lib/utils";
import { breadcrumbJsonLd } from "@/lib/structured-data";
import { JsonLd } from "./json-ld";
import { Eyebrow, MotifDiamond } from "./motif";

export type Crumb = { name: string; href: string };

export function Breadcrumbs({ items, className }: { items: Crumb[]; className?: string }) {
  const all = [{ name: "Home", href: "/" }, ...items];
  return (
    <>
      <nav aria-label="Breadcrumb" className={cn("text-sm", className)}>
        <ol className="text-muted-foreground flex flex-wrap items-center gap-1">
          {all.map((c, i) => {
            const last = i === all.length - 1;
            return (
              <li key={c.href} className="flex items-center gap-1">
                {i > 0 ? <ChevronRight className="size-3.5 opacity-60" aria-hidden /> : null}
                {last ? (
                  <span aria-current="page" className="text-foreground font-medium">
                    {c.name}
                  </span>
                ) : (
                  <Link
                    href={c.href}
                    className="hover:text-foreground inline-flex items-center gap-1 rounded"
                  >
                    {i === 0 ? <Home className="size-3.5" aria-hidden /> : null}
                    {c.name}
                  </Link>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
      <JsonLd data={breadcrumbJsonLd(all)} />
    </>
  );
}

export function PageHeader({
  crumbs,
  eyebrow,
  title,
  description,
  children,
  className,
}: {
  crumbs: Crumb[];
  eyebrow?: string | null;
  title: string;
  description?: string | null;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("relative overflow-hidden", className)}>
      <div
        className="motif-texture absolute inset-0 [mask-image:radial-gradient(ellipse_at_top_right,black,transparent_70%)]"
        aria-hidden
      />
      <MotifDiamond className="text-primary/10 absolute top-10 -right-6 hidden size-56 md:block" />
      <div className="container-page relative pt-6 pb-12 md:pt-10 md:pb-16">
        <Breadcrumbs items={crumbs} />
        <div className="mt-8 max-w-3xl md:mt-12">
          {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}
          <h1 className="text-h1 text-balance-pretty mt-3 font-semibold">{title}</h1>
          {description ? (
            <p className="text-lead text-muted-foreground mt-5 max-w-2xl">{description}</p>
          ) : null}
          {children ? <div className="mt-8">{children}</div> : null}
        </div>
      </div>
    </section>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
  className,
  id,
  action,
}: {
  eyebrow?: string | null;
  title: string;
  description?: string | null;
  align?: "left" | "center";
  className?: string;
  id?: string;
  action?: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-6 md:flex-row md:items-end md:justify-between",
        align === "center" && "items-center text-center md:flex-col md:items-center",
        className,
      )}
    >
      <div className={cn("max-w-2xl", align === "center" && "mx-auto")}>
        {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}
        <h2 id={id} className="text-h2 text-balance-pretty mt-3 font-semibold">
          {title}
        </h2>
        {description ? <p className="text-lead text-muted-foreground mt-4">{description}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: React.ReactNode;
  title: string;
  description?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "border-border-strong bg-surface/60 flex flex-col items-center rounded-3xl border border-dashed px-6 py-14 text-center",
        className,
      )}
    >
      {icon ? (
        <div className="bg-primary-soft text-primary-soft-foreground mb-4 grid size-14 place-items-center rounded-2xl [&_svg]:size-6">
          {icon}
        </div>
      ) : null}
      <h3 className="font-sans text-lg font-semibold">{title}</h3>
      {description ? <p className="text-muted-foreground mt-2 max-w-md">{description}</p> : null}
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}
