import React, { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Send, Paperclip } from "lucide-react";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useTheme } from "@/context/theme-context";

export function MessageInput() {
  const [message, setMessage] = useState("");
  const { theme } = useTheme();

  return (
    <div className="border-t border-border px-4 py-4 bg-background">
      <form
        className="relative flex flex-col gap-2 border rounded-lg p-2 focus-within:ring-1 focus-within:ring-ring transition-all"
        onSubmit={(e) => {
          e.preventDefault();
          if (!message.trim()) return;
          // TODO: enviar mensagem para API
          console.log("Enviando:", message);
          setMessage("");
        }}
      >
        <Textarea
          rows={1}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Escreva uma resposta..."
          className="resize-none border-0 shadow-none focus-visible:ring-0 p-0 min-h-[40px] max-h-[200px]"
          style={{ height: "auto" }}
          onInput={(e) => {
            const target = e.target as HTMLTextAreaElement;
            target.style.height = "auto";
            target.style.height = `${target.scrollHeight}px`;
          }}
        />

        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center gap-1">
            {/* Document Attachment */}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              title="Anexar documento"
            >
              <Paperclip className="h-5 w-5" />
            </Button>
          </div>

          <Button type="submit" size="sm" className="gap-2">
            <Send className="h-4 w-4" />
            Enviar
          </Button>
        </div>
      </form>
    </div>
  );
}
