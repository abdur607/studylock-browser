import React, { useState } from "react";
import { getDomainFromUrl } from "../lib/domainUtils";
import { HighlightNote } from "../lib/types";

interface Props {
  highlight: HighlightNote;
  onUpdate?: (patch: Partial<HighlightNote>) => void;
  onDelete?: () => void;
}

export function HighlightCard({ highlight, onUpdate, onDelete }: Props) {
  const [editing, setEditing] = useState(false);
  const [note, setNote] = useState(highlight.note ?? "");
  const [course, setCourse] = useState(highlight.course ?? "");
  const [tags, setTags] = useState(highlight.tags.join(", "));

  function handleSave() {
    onUpdate?.({
      note: note.trim() || undefined,
      course: course.trim() || undefined,
      tags: tags.split(",").map((t) => t.trim()).filter(Boolean)
    });
    setEditing(false);
  }

  function handleCancel() {
    setNote(highlight.note ?? "");
    setCourse(highlight.course ?? "");
    setTags(highlight.tags.join(", "));
    setEditing(false);
  }

  return (
    <article className="item-card">
      <div className="item-header">
        <div style={{ flex: 1, minWidth: 0 }}>
          <strong>{highlight.pageTitle}</strong>
          <div className="pill-row">
            {highlight.course ? <span>{highlight.course}</span> : null}
            {highlight.tags.map((t) => <span key={t}>{t}</span>)}
          </div>
        </div>
        {onUpdate || onDelete ? (
          <div className="item-actions">
            {onUpdate ? (
              <button className="secondary small" onClick={() => setEditing(!editing)}>
                {editing ? "Cancel" : "Edit"}
              </button>
            ) : null}
            {onDelete ? <button className="danger small" onClick={onDelete}>Delete</button> : null}
          </div>
        ) : null}
      </div>

      <a href={highlight.url} target="_blank" rel="noreferrer" className="source-link">{getDomainFromUrl(highlight.url)}</a>

      <blockquote className="highlight-quote">{highlight.selectedText}</blockquote>

      {editing ? (
        <div className="edit-form">
          <label>Course
            <input value={course} onChange={(e) => setCourse(e.target.value)} placeholder="e.g. Chemistry" />
          </label>
          <label>Note
            <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Optional note" />
          </label>
          <label>Tags (comma-separated)
            <input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="exam, chapter 8" />
          </label>
          <div className="edit-actions">
            <button onClick={handleSave}>Save changes</button>
            <button className="secondary" onClick={handleCancel}>Cancel</button>
          </div>
        </div>
      ) : (
        highlight.note ? <p className="item-note">{highlight.note}</p> : null
      )}
    </article>
  );
}
