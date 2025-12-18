import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useEnterSubmit } from "@/lib/hooks/use-enter-submit";
import { cn } from "@/lib/utils";
import { useRef, useEffect } from "react";
import { Send } from 'lucide-react';

interface ChatInputProps {
  input: string;
  setInput: (value: string) => void;
  onSubmit: (value: string) => Promise<void>;
  isLoading: boolean;
}

export function ChatInput({ input, setInput, onSubmit, isLoading }: ChatInputProps) {
  const { formRef, onKeyDown } = useEnterSubmit();
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = `${inputRef.current.scrollHeight}px`;
    }
  }, [input]);

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        if (!input?.trim()) {
          return;
        }
        setInput("");
        await onSubmit(input);
      }}
      ref={formRef}
      className="relative"
    >
      <Textarea
        ref={inputRef}
        tabIndex={0}
        rows={1}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={onKeyDown}
        placeholder="Ask about Pakistan's constitution, election laws, or parliamentary proceedings..."
        spellCheck={false}
        className="min-h-[60px] w-full resize-none pr-12 text-base md:text-sm"
      />
      <div className="absolute right-2 top-2">
        <Button
          type="submit"
          size="icon"
          disabled={isLoading || input === ""}
        >
          <Send className="size-4" />
          <span className="sr-only">Send message</span>
        </Button>
      </div>
    </form>
  );
}

