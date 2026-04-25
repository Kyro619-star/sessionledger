"use client";

import { useMemo, useRef, useState } from "react";

const inputBase =
  "w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-200";

function normalizeName(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

type Tag = {
  key: string; // normalized lowercase
  label: string; // display
};

export function CollaboratorsTagsInput() {
  const [tags, setTags] = useState<Tag[]>([]);
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLInputElement | null>(null);

  const serialized = useMemo(
    () => tags.map((t) => t.label).join(", "),
    [tags],
  );

  function addTag(raw: string) {
    const cleaned = normalizeName(raw);
    if (!cleaned) return;
    const key = cleaned.toLowerCase();

    setTags((prev) => {
      if (prev.some((t) => t.key === key)) return prev;
      return [...prev, { key, label: cleaned }];
    });
  }

  function removeTag(key: string) {
    setTags((prev) => prev.filter((t) => t.key !== key));
  }

  function commitValue() {
    addTag(value);
    setValue("");
  }

  return (
    <div>
      {/* Hidden input submitted to Server Action (comma-separated string). */}
      <input type="hidden" name="collaborators" value={serialized} />

      <div
        className={`${inputBase} flex min-h-[3rem] flex-wrap items-center gap-2 px-3 py-2`}
        onMouseDown={(e) => {
          // Keep focus on the input when clicking container.
          e.preventDefault();
          inputRef.current?.focus();
        }}
      >
        {tags.map((t) => (
          <span
            key={t.key}
            className="inline-flex items-center gap-1 rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1 text-xs font-medium text-neutral-800"
          >
            {t.label}
            <button
              type="button"
              onClick={() => removeTag(t.key)}
              className="ml-0.5 inline-flex h-4 w-4 items-center justify-center rounded-full text-neutral-500 transition hover:bg-neutral-200 hover:text-neutral-900"
              aria-label={`Remove ${t.label}`}
            >
              ×
            </button>
          </span>
        ))}

        <input
          ref={inputRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === "Tab" || e.key === ",") {
              // Confirm current token as a tag.
              if (value.trim()) {
                e.preventDefault();
                commitValue();
              } else if (e.key === "Enter") {
                // Prevent accidental form submit when empty.
                e.preventDefault();
              }
              return;
            }

            if (e.key === "Backspace" && value === "" && tags.length > 0) {
              // Remove last tag when input is empty.
              e.preventDefault();
              setTags((prev) => prev.slice(0, -1));
            }
          }}
          onBlur={() => {
            // If user clicks away, commit what's typed (if any).
            if (value.trim()) commitValue();
          }}
          placeholder={tags.length === 0 ? "Add a collaborator…" : ""}
          className="min-w-[12ch] flex-1 bg-transparent px-1 py-1 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none"
          autoComplete="off"
        />
      </div>

      <p className="mt-2 text-sm text-neutral-600">
        Add the other people who worked on this with you. Press Enter after each
        name.
      </p>
    </div>
  );
}

