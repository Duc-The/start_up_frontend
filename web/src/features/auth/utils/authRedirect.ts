export function authDestination(roles: string[], requested?: unknown) {
  const home = roles.includes("ADMIN")
    ? "/admin"
    : roles.includes("PARTNER")
      ? "/partner"
      : "/"
  if (
    typeof requested !== "string" ||
    !requested.startsWith("/") ||
    requested.startsWith("//") ||
    requested.includes("\\") ||
    /^\/(login|register)(?:[/?#]|$)/.test(requested)
  )
    return home
  if (requested.startsWith("/admin") && !roles.includes("ADMIN")) return home
  if (
    /^\/(partner|management)/.test(requested) &&
    !roles.some((r) => ["ADMIN", "PARTNER"].includes(r))
  )
    return home
  return requested
}
