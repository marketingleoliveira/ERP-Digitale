export function toggleTheme() {
  if (typeof document === "undefined") return;
  const isDark = document.documentElement.classList.toggle("dark");
  try {
    localStorage.setItem("dt-theme", isDark ? "dark" : "light");
  } catch {}
}

export function getTheme(): "dark" | "light" {
  if (typeof document === "undefined") return "light";
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}
