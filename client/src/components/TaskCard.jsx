import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const PRIORITY_LABELS = { urgent: 'URG', high: 'HIGH', medium: 'MED', low: 'LOW' };

export default function TaskCard({ task, onClick }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    data: { task },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`task-card${isDragging ? ' dragging' : ''}`}
      onClick={() => onClick?.(task)}
    >
      <div className="task-card-title">{task.title}</div>
      <div className="task-card-meta">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <span className={`priority-badge ${task.priority}`}>
            {PRIORITY_LABELS[task.priority]}
          </span>
          {task.story_points && <span className="story-points">{task.story_points} pts</span>}
        </div>
        {task.assignee_name && (
          <div
            className="assignee-avatar"
            style={{ background: task.avatar_color || '#6366f1' }}
            title={task.assignee_name}
          >
            {task.assignee_name.slice(0, 2).toUpperCase()}
          </div>
        )}
      </div>
    </div>
  );
}
