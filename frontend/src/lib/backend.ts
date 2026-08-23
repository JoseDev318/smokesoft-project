import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:4000/api";

export async function fetchBackend(path: string, options: RequestInit = {}) {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  const res = await fetch(`${BACKEND_URL}${path}`, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: token ? `Bearer ${token}` : "",
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });
  if (res.status === 401) {
    redirect("/login");
  }

  if (!res.ok) {
    throw new Error(`Error ${res.status} al consultar ${path}`);
  }

  return res.json();
}