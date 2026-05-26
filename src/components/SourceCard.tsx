import React, { useState } from "react";
import { createCitationDraft } from "../lib/citationHelper";
import { SavedSource, SourceType } from "../lib/types";

interface Props {
  source: SavedSource;
  onUpdate?: (patch: Partial<SavedSource>) => void;
  onDelete?: () => void;
}

export function SourceCard({ source, onUpdate, onDelete }: Props) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(source.title);
  const [course, setCourse] = useState(source.course ?? "");
  const [sourceType, setSourceType] = useState<SourceType>(source.sourceType);
  const [assignment, setAssignment] = useState(source.assignment ?? "");
  const [author, setAuthor] = useState(source.author ?? "");
  const [publisher, setPublisher] = useState(source.publisher ?? "");
  const [publishedDate, setPublishedDate] = useState(source.publishedDate ?? "");
  const [note, setNote] = useState(source.note ?? "");
  const [tags, setTags] = useState(source.tags.join(", "));

  function handleSave() {
    const newTitle = title.trim() || source.title;
    const newCitationDraft = createCitationDraft(newTitle, source.domain, source.url, {
      publisher: publisher.trim() || undefined,
      author: author.trim() || undefined,
      publishedDate: publishedDate.trim() || undefined
    }, new Date(source.accessedAt));
    onUpdate?.({
      title: newTitle,
      course: course.trim() || undefined,
      sourceType,
      assignment: assignment.trim() || undefined,
      author: author.trim() || undefined,
      publisher: publisher.trim() || undefined,
      publishedDate: publishedDate.trim() || undefined,
      note: note.trim() || undefined,
      tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
      citationDraft: newCitationDraft
    });
    setEditing(false);
  }

  function handleCancel() {
    setTitle(source.title);
    setCourse(source.course ?? "");
    setSourceType(source.sourceType);
    setAssignment(source.assignment ?? "");
    setAuthor(source.author ?? "");
    setPublisher(source.publisher ?? "");
    setPublishedDate(source.publishedDate ?? "");
    setNote(source.note ?? "");
    setTags(source.tags.join(", "));
    setEditing(false);
  }

  return (
    <article className="item-card">
      <div className="item-header">
        <div style={{ flex: 1, minWidth: 0 }}>
          <strong>{source.title}</strong>
          <div className="pill-row">
            <span>{source.sourceType}</span>
            {source.course ? <span>{source.course}</span> : null}
            {source.assignment ? <span>{source.assignment}</span> : null}
            {source.tags.map((t) => <span key={t}>{t}</span>)}
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

      <a href={source.url} target="_blank" rel="noreferrer" className="source-link">{source.domain}</a>

      {editing ? (
        <div className="edit-form">
          <label>Title
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Page title" />
          </label>
          <div className="edit-row">
            <label>Source type
              <select value={sourceType} onChange={(e) => setSourceType(e.target.value as SourceType)}>
                <option value="webpage">Webpage</option>
                <option value="article">Article</option>
                <option value="video">Video</option>
                <option value="pdf">PDF</option>
                <option value="textbook">Textbook</option>
                <option value="other">Other</option>
              </select>
            </label>
            <label>Course
              <input value={course} onChange={(e) => setCourse(e.target.value)} placeholder="e.g. Chemistry" />
            </label>
          </div>
          <label>Assignment / project
            <input value={assignment} onChange={(e) => setAssignment(e.target.value)} placeholder="e.g. Chemistry Final" />
          </label>
          <div className="edit-row">
            <label>Author
              <input value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="First Last" />
            </label>
            <label>Publisher
              <input value={publisher} onChange={(e) => setPublisher(e.target.value)} placeholder="Publisher name" />
            </label>
          </div>
          <label>Published date
            <input value={publishedDate} onChange={(e) => setPublishedDate(e.target.value)} placeholder="2024 or Jan 2024" />
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
        <>
          {source.note ? <p className="item-note">{source.note}</p> : null}
          {source.author || source.publisher || source.publishedDate ? (
            <p className="item-meta">
              {[source.author, source.publisher, source.publishedDate].filter(Boolean).join(" · ")}
            </p>
          ) : null}
          <p className="citation-draft">
            <strong>Citation draft — verify before submitting:</strong> {source.citationDraft}
          </p>
        </>
      )}
    </article>
  );
}
