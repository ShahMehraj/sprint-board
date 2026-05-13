import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import TaskCard from './TaskCard';

const STATUS_LABELS = {
  todo: 'To Do',
  in_progress: 'In Progress',
  review: 'Review',
  done: 'Done',
};

export default function Column({ status, tasks, onAddTask, onTaskClick }) {
  const { setNodeRef } = useDroppable({ id: status });

  return (
    <div className="column">
      <div className="column-header">
        <h2>{STATUS_LABELS[status]}</h2>
        <span className="count">{tasks.length}</span>
      </div>
      <div className="column-body" ref={setNodeRef}>
        <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} onClick={onTaskClick} />
          ))}
        </SortableContext>
        <button className="add-task-btn" onClick={() => onAddTask(status)}>
          + Add task
        </button>
      </div>
    </div>
  );
}
