import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <main className="relative flex min-h-[calc(100vh-73px)] items-center justify-center overflow-hidden px-6 text-center">
      <Image
        src="/img/fondo-humo.jpg"
        alt=""
        fill
        priority
        className="object-cover opacity-40"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-carbon via-carbon/70 to-carbon/40" />

      <div className="relative z-10 flex flex-col items-center">
        <Image
          src="/img/logo-smokesoft-icon.png"
          alt="SmokeSoft"
          width={323}
          height={384}
          className="h-28 w-auto"
          priority
        />

        <h1 className="mt-4 font-display text-6xl font-bold tracking-tight text-hueso">
          SMOKESOFT
        </h1>

        <p className="mt-6 max-w-md text-lg text-humo">
          Control inteligente para una gestión eficiente
        </p>

        <Link
          href="/productos"
          className="mt-8 rounded-full bg-turquesa px-8 py-3 font-semibold text-carbon transition-colors hover:bg-turquesa-dim"
        >
          Ver productos
        </Link>
      </div>
    </main>
  );
}