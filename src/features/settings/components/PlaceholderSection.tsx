export function PlaceholderSection({ title }: { title: string }) {
  return (
    <div className="flex flex-col gap-3 p-6 border border-dashed border-border rounded-xl bg-muted/20">
      <p className="text-sm font-semibold text-foreground">{title}</p>
      <p className="text-sm text-muted-foreground">Conteudo em breve.</p>
    </div>
  );
}
