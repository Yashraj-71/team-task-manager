export function ProjectPanel({
  projects,
  selectedProjectId,
  onSelectProject,
  onCreateProject,
  createForm,
  setCreateForm,
  users,
  addMemberUserId,
  setAddMemberUserId,
  onAddMember,
  selectedProject
}) {
  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Projects</p>
          <h3>Project workspace</h3>
        </div>
      </div>

      <div className="project-grid">
        <div className="project-list">
          {projects.map((project) => (
            <button
              key={project.id}
              className={selectedProjectId === project.id ? "project-item active" : "project-item"}
              onClick={() => onSelectProject(project.id)}
            >
              <strong>{project.name}</strong>
              <span>{project.task_count} tasks</span>
              <span>{project.member_count} members</span>
            </button>
          ))}
        </div>

        <div className="project-detail">
          {selectedProject ? (
            <>
              <div className="card">
                <h4>{selectedProject.name}</h4>
                <p>{selectedProject.description || "No project description yet."}</p>
                <p className="muted">Owner: {selectedProject.owner_name}</p>
              </div>

              <div className="card">
                <h4>Team members</h4>
                <div className="pill-row">
                  {selectedProject.members?.map((member) => (
                    <span key={member.id} className="pill">
                      {member.name} ({member.role})
                    </span>
                  ))}
                </div>

                {onAddMember ? (
                  <div className="inline-form">
                    <select
                      value={addMemberUserId}
                      onChange={(event) => setAddMemberUserId(event.target.value)}
                    >
                      <option value="">Select a user</option>
                      {users.map((user) => (
                        <option key={user.id} value={user.id}>
                          {user.name} ({user.role})
                        </option>
                      ))}
                    </select>
                    <button onClick={onAddMember}>Add member</button>
                  </div>
                ) : null}
              </div>
            </>
          ) : (
            <div className="card">
              <p>Select a project to view team details.</p>
            </div>
          )}

          {onCreateProject ? (
            <div className="card">
              <h4>Create project</h4>
              <div className="stack">
                <input
                  placeholder="Website revamp"
                  value={createForm.name}
                  onChange={(event) => setCreateForm({ ...createForm, name: event.target.value })}
                />
                <textarea
                  rows="3"
                  placeholder="Project description"
                  value={createForm.description}
                  onChange={(event) =>
                    setCreateForm({ ...createForm, description: event.target.value })
                  }
                />
                <button onClick={onCreateProject}>Create project</button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
