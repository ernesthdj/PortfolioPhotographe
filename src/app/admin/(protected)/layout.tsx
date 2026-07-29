import Link from "next/link";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin-guard";

// Le proxy redirige déjà les visiteurs sans session vers /admin/login ; ce layout
// vérifie en plus le rôle admin (un client connecté n'est pas un admin).
const SECTIONS = [
  { href: "/admin/photos", label: "Photos" },
  { href: "/admin/textes", label: "Textes" },
  { href: "/admin/tarifs", label: "Tarifs & Formules" },
  { href: "/admin/services", label: "Services à la carte" },
  { href: "/admin/champs", label: "Champs du dossier" },
  { href: "/admin/leads", label: "Leads" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();
  if (!admin) redirect("/admin/login");

  return (
    <div className="flex min-h-screen">
      <aside className="w-56 flex-none border-r border-ink/10 bg-cream-light px-5 py-8">
        <div className="mb-8">
          <span className="font-serif text-lg font-semibold tracking-[0.06em] text-ink">
            ERNEST H.
          </span>
          <div className="mt-0.5 font-mono text-[8.5px] tracking-[0.15em] text-ink/40">
            ADMINISTRATION
          </div>
        </div>
        <nav className="flex flex-col gap-1">
          {SECTIONS.map((section) => (
            <Link
              key={section.href}
              href={section.href}
              className="rounded-sm px-3 py-2 text-[13px] text-ink/70 hover:bg-ink/5 hover:text-ink"
            >
              {section.label}
            </Link>
          ))}
        </nav>
        <div className="mt-10 border-t border-ink/10 pt-4">
          <Link href="/" className="px-3 text-[12px] text-ink/50 hover:text-ink">
            ← Voir le site
          </Link>
        </div>
      </aside>
      <main className="flex-1 px-8 py-8">{children}</main>
    </div>
  );
}
