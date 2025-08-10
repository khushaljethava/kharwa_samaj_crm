"use client";
import * as React from "react";
import { ChevronDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";

type SelectContextValue = {
  value?: string;
  setValue?: (v: string, label?: string) => void;
  onValueChange?: (val: string) => void;
  selectedLabel?: string;
  registerItem?: (value: string, label: string) => void;
  getLabelForValue?: (value: string) => string | undefined;
  open: boolean;
  setOpen: (o: boolean) => void;
  rootRef: React.RefObject<HTMLDivElement>;
  query: string;
  setQuery: (q: string) => void;
};

const SelectContext = React.createContext<SelectContextValue | null>(null);

export function Select({ value, defaultValue, onValueChange, children }: {
  value?: string;
  defaultValue?: string;
  onValueChange?: (val: string) => void;
  children: React.ReactNode;
}) {
  const [internalValue, setInternalValue] = React.useState<string | undefined>(
    defaultValue,
  );
  const [selectedLabel, setSelectedLabel] = React.useState<string | undefined>(
    undefined,
  );
  const controlled = value !== undefined;
  const currentValue = controlled ? value : internalValue;
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const rootRef = React.useRef<HTMLDivElement>(null);
  const itemsRef = React.useRef<Map<string, string>>(new Map());

  const registerItem = React.useCallback((val: string, label: string) => {
    itemsRef.current.set(val, label);
  }, []);

  const getLabelForValue = React.useCallback((val: string) => {
    return itemsRef.current.get(val);
  }, []);

  const setValue = React.useCallback(
    (v: string, label?: string) => {
      if (!controlled) setInternalValue(v);
      if (label) setSelectedLabel(label);
      onValueChange?.(v);
    },
    [controlled, onValueChange],
  );

  React.useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!rootRef.current) return;
      if (rootRef.current.contains(e.target as Node)) return;
      setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const ctx: SelectContextValue = {
    value: currentValue,
    setValue,
    onValueChange,
    selectedLabel,
    registerItem,
    getLabelForValue,
    open,
    setOpen,
    rootRef,
    query,
    setQuery,
  };

  return (
    <SelectContext.Provider value={ctx}>
      <div ref={rootRef} className="relative" data-slot="select" data-value={currentValue}>
        {children}
      </div>
    </SelectContext.Provider>
  );
}

export function SelectTrigger({ className, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const ctx = React.useContext(SelectContext)!;
  const label = ctx.selectedLabel || (ctx.value ? ctx.getLabelForValue?.(ctx.value) : undefined);
  return (
    <button
      type="button"
      aria-haspopup="listbox"
      aria-expanded={ctx.open}
      onClick={() => ctx.setOpen(!ctx.open)}
      onKeyDown={(e) => {
        if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          ctx.setOpen(true);
        }
        if (e.key === "Escape") ctx.setOpen(false);
      }}
      className={cn(
        "flex h-10 w-full items-center justify-between rounded-md border bg-background px-3 text-sm shadow-sm",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        className,
      )}
      {...props}
    >
      <span className={cn("truncate", !label && "text-muted-foreground")}>{label || (props.children as React.ReactNode) }</span>
      <ChevronDown className="ml-2 h-4 w-4 opacity-60" />
    </button>
  );
}

export function SelectValue({ placeholder }: { placeholder?: string }) {
  const ctx = React.useContext(SelectContext)!;
  const label = ctx.selectedLabel || (ctx.value ? ctx.getLabelForValue?.(ctx.value) : undefined);
  return <span className={cn("truncate", !label && "text-muted-foreground")}>{label || placeholder}</span>;
}

export function SelectContent({ className, children, searchable = true }: React.HTMLAttributes<HTMLDivElement> & { searchable?: boolean }) {
  const ctx = React.useContext(SelectContext)!;
  if (!ctx.open) return null;
  const childArray = React.Children.toArray(children) as Array<React.ReactElement<unknown>>;
  const filteredChildren = !searchable || !ctx.query
    ? childArray
    : childArray.filter((child) => {
        const val = child.props?.value as string | undefined;
        const label = (ctx.getLabelForValue?.(val || "") || "").toLowerCase();
        return label.includes(ctx.query.toLowerCase());
      });
  return (
    <div
      role="listbox"
      className={cn(
        "absolute z-50 mt-1 max-h-64 w-full overflow-auto rounded-md border bg-background p-1 shadow-md",
        className,
      )}
    >
      {searchable && (
        <div className="flex items-center gap-2 rounded-md border bg-background px-2 py-1.5 text-sm">
          <Search className="h-4 w-4 opacity-60" />
          <input
            autoFocus
            placeholder="Search..."
            value={ctx.query}
            onChange={(e) => ctx.setQuery(e.target.value)}
            className="w-full bg-transparent outline-none"
          />
        </div>
      )}
      <div className="mt-1 space-y-0.5">
        {filteredChildren}
        {filteredChildren.length === 0 && (
          <div className="px-2 py-1.5 text-sm text-muted-foreground">No results</div>
        )}
      </div>
    </div>
  );
}

export function SelectItem({ value, children, onClick, searchText, ...rest }: { value: string; children: React.ReactNode; onClick?: () => void; searchText?: string; [key: string]: unknown; }) {
  const ctx = React.useContext(SelectContext)!;
  const label = (typeof children === "string" ? children : searchText) || String(children ?? value);
  const registerItem = ctx.registerItem;
  React.useEffect(() => {
    registerItem?.(value, String(label));
  }, [value, label, registerItem]);
  const selected = ctx.value === value;
  return (
    <div
      role="option"
      data-value={value}
      aria-selected={selected}
      className={cn(
        "cursor-pointer rounded px-2 py-1.5 text-sm hover:bg-muted",
        selected && "bg-muted",
      )}
      onClick={() => {
        ctx.setValue?.(value, String(label));
        ctx.setOpen(false);
        onClick?.();
      }}
      {...rest}
    >
      {children}
    </div>
  );
}


