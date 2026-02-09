type TypingIndicatorProps = {
  users: Array<{ userId: string; userName: string }>;
};

export function TypingIndicator({ users }: TypingIndicatorProps) {
  if (users.length === 0) return null;

  const names = users.map((u) => u.userName).join(", ");
  const text = users.length === 1 ? "está digitando" : "estão digitando";

  return (
    <div className="flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground">
      <span>{names} {text}</span>
      <div className="flex gap-1">
        <span className="animate-bounce" style={{ animationDelay: "0ms" }}>●</span>
        <span className="animate-bounce" style={{ animationDelay: "150ms" }}>●</span>
        <span className="animate-bounce" style={{ animationDelay: "300ms" }}>●</span>
      </div>
    </div>
  );
}