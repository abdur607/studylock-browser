import { TabGroup } from "../lib/types";

export function TabGroupCard({ group, onRestore, onDelete, onRename }: { group: TabGroup; onRestore: () => void; onDelete: () => void; onRename: (name: string) => void }) {
  return (
    <article className="item-card">
      <div className="split">
        <div>
          <strong>{group.name}</strong>
          <p>{group.courseName} {group.task ? `· ${group.task}` : ""}</p>
        </div>
        <div className="row-actions">
          <button onClick={onRestore}>Restore</button>
          <button className="secondary" onClick={() => {
            const name = window.prompt("Rename tab group", group.name);
            if (name) onRename(name);
          }}>Rename</button>
          <button className="danger" onClick={onDelete}>Delete</button>
        </div>
      </div>
      <p>{group.tabs.length} saved tabs</p>
    </article>
  );
}
