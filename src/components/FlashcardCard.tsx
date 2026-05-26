import React, { useState } from "react";
import { Flashcard } from "../lib/types";

interface Props {
  card: Flashcard;
  onUpdate?: (patch: Partial<Flashcard>) => void;
  onDelete?: () => void;
}

export function FlashcardCard({ card, onUpdate, onDelete }: Props) {
  const [editing, setEditing] = useState(false);
  const [front, setFront] = useState(card.front);
  const [back, setBack] = useState(card.back);
  const [course, setCourse] = useState(card.course ?? "");
  const [tags, setTags] = useState(card.tags.join(", "));

  function handleSave() {
    if (!front.trim() || !back.trim()) return;
    onUpdate?.({
      front: front.trim(),
      back: back.trim(),
      course: course.trim() || undefined,
      tags: tags.split(",").map((t) => t.trim()).filter(Boolean)
    });
    setEditing(false);
  }

  function handleCancel() {
    setFront(card.front);
    setBack(card.back);
    setCourse(card.course ?? "");
    setTags(card.tags.join(", "));
    setEditing(false);
  }

  return (
    <article className="item-card flashcard">
      <div className="item-header">
        <div style={{ flex: 1 }}>
          {editing ? (
            <div className="edit-form">
              <label>Front (question or term)
                <input value={front} onChange={(e) => setFront(e.target.value)} />
              </label>
              <label>Back (answer or definition)
                <textarea value={back} onChange={(e) => setBack(e.target.value)} />
              </label>
              <div className="edit-row">
                <label>Course
                  <input value={course} onChange={(e) => setCourse(e.target.value)} />
                </label>
                <label>Tags
                  <input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="exam, ch8" />
                </label>
              </div>
              <div className="edit-actions">
                <button onClick={handleSave} disabled={!front.trim() || !back.trim()}>Save</button>
                <button className="secondary" onClick={handleCancel}>Cancel</button>
              </div>
            </div>
          ) : (
            <>
              <div className="flashcard-front"><strong>{card.front}</strong></div>
              <p className="flashcard-back">{card.back}</p>
              <div className="pill-row">
                <span>{card.course || "Unassigned"}</span>
                {card.tags.map((t) => <span key={t}>{t}</span>)}
              </div>
            </>
          )}
        </div>
        {!editing && (onUpdate || onDelete) ? (
          <div className="item-actions">
            {onUpdate ? <button className="secondary small" onClick={() => setEditing(true)}>Edit</button> : null}
            {onDelete ? <button className="danger small" onClick={onDelete}>Delete</button> : null}
          </div>
        ) : null}
      </div>
    </article>
  );
}
