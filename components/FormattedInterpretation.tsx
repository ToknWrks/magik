// components/FormattedInterpretation.tsx
import React from 'react';

function parseInline(text: string): React.ReactNode[] {
  // Process **bold italic** before *yellow* to avoid overlap
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={i} className="font-bold italic text-gray-900 dark:text-gray-100">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith('*') && part.endsWith('*')) {
      return (
        <span key={i} className="text-amber-600 dark:text-amber-400 font-medium">
          {part.slice(1, -1)}
        </span>
      );
    }
    return part;
  });
}

export default function FormattedInterpretation({ text }: { text: string }) {
  return (
    <div className="space-y-2">
      {text.split('\n').map((line, i) => {
        if (!line.trim()) return <br key={i} />;
        return (
          <p key={i} className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
            {parseInline(line)}
          </p>
        );
      })}
    </div>
  );
}
