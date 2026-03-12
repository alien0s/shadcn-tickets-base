export type SubjectCardTone = {
  text: string;
  border: string;
  background: string;
};

function normalizeSubject(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

export function getSubjectColorClasses(subject: string): SubjectCardTone {
  const normalized = normalizeSubject(subject);
  if (normalized.includes("historia")) return { text: "text-[#A14A17]", border: "border-[#F3D3BA]", background: "bg-[#FDF1E7]" };
  if (normalized.includes("matematica")) return { text: "text-[#B0296D]", border: "border-[#F1C8DC]", background: "bg-[#FCECF3]" };
  if (normalized.includes("portugues")) return { text: "text-[#1D5EAE]", border: "border-[#BFDDFB]", background: "bg-[#E9F3FF]" };
  if (normalized.includes("biologia")) return { text: "text-[#1E7C4F]", border: "border-[#BDECCF]", background: "bg-[#EAF8EF]" };
  return { text: "text-[#334155]", border: "border-[#CBD5E1]", background: "bg-[#F1F5F9]" };
}
