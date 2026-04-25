"use client";

import type { KeyboardEvent } from "react";

import { createProject } from "./actions";
import { CollaboratorsTagsInput } from "./collaborators-tags";

export function CreateProjectForm() {
  // Stop accidental form submissions: pressing Enter inside a single-line text
  // input shouldn't post the form. The user must click "Start record". Textareas
  // (Enter = newline) and the submit button (Enter = submit) are unaffected.
  // CollaboratorsTagsInput handles its own Enter (commits a tag) before this.
  function handleKeyDown(e: KeyboardEvent<HTMLFormElement>) {
    if (e.key !== "Enter") return;
    const target = e.target as HTMLElement;
    const tag = target.tagName;
    if (tag === "TEXTAREA" || tag === "BUTTON") return;
    e.preventDefault();
  }

  return (
    <form className="space-y-6" action={createProject} onKeyDown={handleKeyDown}>
      <div>
        <label
          htmlFor="project-title"
          className="mb-2 block text-sm font-medium text-neutral-700"
        >
          Project Title
        </label>
        <input
          id="project-title"
          name="title"
          type="text"
          required
          autoComplete="off"
          placeholder="e.g. Summer demo sketch"
          className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-200"
        />
      </div>

      <div>
        <label
          htmlFor="project-type"
          className="mb-2 block text-sm font-medium text-neutral-700"
        >
          Project Type
        </label>
        <select
          id="project-type"
          name="type"
          defaultValue="song"
          className="w-full appearance-none rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-900 focus:border-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-200"
        >
          <option value="song">Song</option>
          <option value="beat">Beat</option>
          <option value="demo">Demo</option>
          <option value="other">Other</option>
        </select>
      </div>

      <div>
        <label
          htmlFor="description"
          className="mb-2 block text-sm font-medium text-neutral-700"
        >
          Description
        </label>
        <textarea
          id="description"
          name="description"
          rows={5}
          placeholder="What are you building together?"
          className="w-full resize-y rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-200"
        />
      </div>

      <div>
        <label
          htmlFor="owner-name"
          className="mb-2 block text-sm font-medium text-neutral-700"
        >
          Your name
        </label>
        <input
          id="owner-name"
          name="ownerName"
          type="text"
          required
          autoComplete="off"
          placeholder="The name to credit you under"
          className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-200"
        />
        <p className="mt-2 text-sm text-neutral-500">
          You&apos;ll be added to the record automatically — no need to list
          yourself below.
        </p>
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-neutral-700">
          Other collaborators
        </label>
        <CollaboratorsTagsInput />
      </div>

      <div className="pt-2">
        <button
          type="submit"
          className="rounded-full bg-black px-8 py-3 text-sm font-medium text-white transition hover:opacity-80"
        >
          Start record
        </button>
      </div>
    </form>
  );
}
