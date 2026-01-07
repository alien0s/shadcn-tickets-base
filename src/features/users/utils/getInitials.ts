export function getInitials(name: string) {
  const [first = "", second = ""] = name.split(" ");
  return `${first[0] || ""}${second[0] || ""}`.toUpperCase();
}
