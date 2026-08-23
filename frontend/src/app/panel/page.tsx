export default function DashboardPage() {
  return (
    <main className="flex min-h-[calc(100vh-73px)] flex-col items-center justify-center px-6 text-center">
      <h1 className="font-display text-3xl font-bold text-hueso">
        Panel de administración
      </h1>
      <p className="mt-2 text-humo">
        Si ves esto, el middleware te dejó pasar correctamente.
      </p>
    </main>
  );
}