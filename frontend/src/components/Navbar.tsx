import Image from "next/image";
import Link from "next/link";

const enlaces = [
  { href: "/", label: "Inicio" },
  { href: "/productos", label: "Productos" },
  { href: "/contacto", label: "Contáctenos" },
];

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-carbon/80 backdrop-blur">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-3">
          <Image
            src="/img/logo-smokesoft-icon.png"
            alt="SmokeSoft"
            width={323}
            height={384}
            className="h-9 w-auto"
          />
          <span className="font-display text-xl font-bold text-hueso">
            SmokeSoft
          </span>
        </Link>

        <div className="flex items-center gap-8">
          {enlaces.map((enlace) => (
            <Link
              key={enlace.href}
              href={enlace.href}
              className="text-sm font-medium text-humo transition-colors hover:text-hueso"
            >
              {enlace.label}
            </Link>
          ))}
          <Link
            href="/login"
            className="rounded-full border border-turquesa px-5 py-2 text-sm font-semibold text-turquesa transition-colors hover:bg-turquesa hover:text-carbon"
          >
            Ingresar
          </Link>
        </div>
      </nav>
    </header>
  );
}