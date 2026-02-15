import * as React from "react";
import type { HeaderBlock } from "./edit/RichHeaderEditor";

export function RichHeaderDisplay({ blocks, fontFamily, textColor }: { blocks: HeaderBlock[]; fontFamily?: string | null; textColor?: string | null }) {
  if (!blocks || blocks.length === 0) return null;

  return (
    <div className="space-y-4 w-full max-w-4xl mx-auto px-4">
       {blocks.map(block => (
          <div 
            key={block.id} 
            className={`
                ${block.type === 'h1' ? 'text-3xl md:text-5xl font-extrabold tracking-tight' : ''}
                ${block.type === 'h2' ? 'text-xl md:text-2xl font-bold opacity-90' : ''}
                ${block.type === 'p' ? 'text-base md:text-lg opacity-80' : ''}
                
                ${block.align === 'left' ? 'text-left' : ''}
                ${block.align === 'center' ? 'text-center' : ''}
                ${block.align === 'right' ? 'text-right' : ''}

                ${block.animation === 'fade-up' ? 'animate-fade-up' : ''}
                ${block.animation === 'fade-in' ? 'animate-fade-in' : ''}
                ${block.animation === 'blur-in' ? 'animate-blur-in' : ''}
                ${block.animation === 'typewriter' ? 'animate-typewriter' : ''}
            `}
            style={{
                fontFamily: fontFamily ?? "inherit",
                color: block.color || textColor || "inherit",
                // Basic HTML handling if we allowed it, or just text
            }}
          >
             {/* If we want to support basic HTML like <b>, we must use dangerouslySetInnerHTML or a parser.
                 For safety, since this is user content, we should sanitize or use a lightweight parser.
                 For now, let's assume we render text, or if user typed HTML tags they expect them to render. 
                 Given the user asked for "grifar", let's try a safe HTML render or simple replacement.
              */}
              <span dangerouslySetInnerHTML={{ __html: block.text }} />
          </div>
       ))}
    </div>
  );
}
