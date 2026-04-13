import { Copy, Check } from "lucide-react";
import { useState, lazy, Suspense } from "react";

const SyntaxHighlighter = lazy(() =>
  import("react-syntax-highlighter/dist/esm/prism-light").then((mod) => ({
    default: mod.default,
  }))
);

const loadTheme = () =>
  import("react-syntax-highlighter/dist/esm/styles/prism").then(
    (mod) => mod.oneDark
  );

interface CodeBlockProps {
  className?: string;
  children?: React.ReactNode;
}

export default function CodeBlock({ className, children }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);
  const [theme, setTheme] = useState<Record<string, any> | null>(null);
  const match = /language-(\w+)/.exec(className || "");
  const code = String(children).replace(/\n$/, "");

  if (match && !theme) {
    loadTheme().then(setTheme);
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!match) {
    return (
      <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">
        {children}
      </code>
    );
  }

  return (
    <div className="relative group rounded-lg overflow-hidden my-2">
      <div className="flex items-center justify-between bg-[#282c34] px-4 py-1.5 text-xs text-gray-400">
        <span>{match[1]}</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 hover:text-white transition-colors"
        >
          {copied ? <Check size={12} /> : <Copy size={12} />}
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>
      <Suspense
        fallback={
          <pre className="bg-[#282c34] text-gray-300 p-4 text-xs font-mono overflow-x-auto">
            {code}
          </pre>
        }
      >
        {theme && (
          <SyntaxHighlighter
            style={theme}
            language={match[1]}
            PreTag="div"
            customStyle={{ margin: 0, borderRadius: 0, fontSize: "0.75rem" }}
          >
            {code}
          </SyntaxHighlighter>
        )}
      </Suspense>
    </div>
  );
}
