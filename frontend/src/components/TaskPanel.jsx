const statusOptions = ["TODO", "IN_PROGRESS", "DONE"];

export function TaskPanel({
  tasks,
  user,
  projects,
  users,
  taskForm,
  setTaskForm,
  onCreateTask,
  onStatusChange
}) {
  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Tasks</p>
          <h3>Assignments and progress</h3>
        </div>
      </div>

      {user.role === "ADMIN" ? (
        <div className="card">
          <h4>Create task</h4>
          <div className="task-form-grid">
            <select
              value={taskForm.projectId}
              onChange={(event) => setTaskForm({ ...taskForm, projectId: event.target.value })}
            >
              <option value="">Select project</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>

            <input
              placeholder="Task title"
              value={taskForm.title}
              onChange={(event) => setTaskForm({ ...taskForm, title: event.target.value })}
            />

            <select
              value={taskForm.assignedTo}
              onChange={(event) => setTaskForm({ ...taskForm, assignedTo: event.target.value })}
            >
              <option value="">Assign teammate</option>
              {users.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name}
                </option>
              ))}
            </select>

            <select
              value={taskForm.priority}
              onChange={(event) => setTaskForm({ ...taskForm, priority: event.target.value })}
            >
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
            </select>

            <input
              type="date"
              value={taskForm.dueDate}
              onChange={(event) => setTaskForm({ ...taskForm, dueDate: event.target.value })}
            />

            <textarea
              rows="3"
              placeholder="Task description"
              value={taskForm.description}
              onChange={(event) => setTaskForm({ ...taskForm, description: event.target.value })}
            />

            <button onClick={onCreateTask}>Create task</button>
          </div>
        </div>
      ) : null}

      <div className="task-table">
        <div className="task-table-head">
          <span>Task</span>
          <span>Project</span>
          <span>Assignee</span>
          <span>Due</span>
          <span>Status</span>
        </div>

        {tasks.map((task) => (
          <div key={task.id} className="task-row">
            <div>
              <strong>{task.title}</strong>
              <p>{task.priority} priority</p>
            </div>
            <span>{task.project_name}</span>
            <span>{task.assigned_to_name || "Unassigned"}</span>
            <span>{task.due_date || "No date"}</span>
            <select
              value={task.status}
              disabled={user.role !== "ADMIN" && Number(task.assigned_to) !== Number(user.id)}
              onChange={(event) => onStatusChange(task.id, event.target.value)}
            >
              {statusOptions.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>
    </section>
  );
}
