import { useEffect, useMemo, useState } from "react";
import { apiRequest } from "../lib/api";
import { ProjectPanel } from "../components/ProjectPanel";
import { TaskPanel } from "../components/TaskPanel";
import { StatCard } from "../components/StatCard";

export function DashboardPage({ user, onLogout }) {
  const [dashboard, setDashboard] = useState(null);
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [selectedProject, setSelectedProject] = useState(null);
  const [message, setMessage] = useState("");
  const [projectForm, setProjectForm] = useState({ name: "", description: "" });
  const [taskForm, setTaskForm] = useState({
    projectId: "",
    title: "",
    description: "",
    assignedTo: "",
    priority: "MEDIUM",
    dueDate: ""
  });
  const [addMemberUserId, setAddMemberUserId] = useState("");

  const fetchInitialData = async () => {
    const requests = [
      apiRequest("/api/dashboard"),
      apiRequest("/api/projects"),
      apiRequest("/api/tasks"),
      user.role === "ADMIN" ? apiRequest("/api/projects/members") : Promise.resolve([])
    ];
    const [dashboardData, projectsData, tasksData, usersData] = await Promise.all(requests);

    setDashboard(dashboardData);
    setProjects(projectsData);
    setTasks(tasksData);
    setUsers(usersData);
    if (!selectedProjectId && projectsData[0]) {
      setSelectedProjectId(projectsData[0].id);
    }
  };

  useEffect(() => {
    fetchInitialData().catch((error) => setMessage(error.message));
  }, []);

  useEffect(() => {
    if (!selectedProjectId) {
      return;
    }

    apiRequest(`/api/projects/${selectedProjectId}`)
      .then(setSelectedProject)
      .catch((error) => setMessage(error.message));
  }, [selectedProjectId]);

  const statusMap = useMemo(() => {
    const base = { TODO: 0, IN_PROGRESS: 0, DONE: 0 };
    for (const row of dashboard?.statusBreakdown || []) {
      base[row.status] = row.count;
    }
    return base;
  }, [dashboard]);

  const refreshAll = async () => {
    await fetchInitialData();
    if (selectedProjectId) {
      const project = await apiRequest(`/api/projects/${selectedProjectId}`);
      setSelectedProject(project);
    }
  };

  const handleCreateProject = async () => {
    try {
      await apiRequest("/api/projects", {
        method: "POST",
        body: JSON.stringify(projectForm)
      });
      setProjectForm({ name: "", description: "" });
      setMessage("Project created successfully.");
      await refreshAll();
    } catch (error) {
      setMessage(error.message);
    }
  };

  const handleAddMember = async () => {
    if (!selectedProjectId || !addMemberUserId) {
      return;
    }

    try {
      await apiRequest(`/api/projects/${selectedProjectId}/members`, {
        method: "POST",
        body: JSON.stringify({ userId: addMemberUserId })
      });
      setAddMemberUserId("");
      setMessage("Member added to project.");
      await refreshAll();
    } catch (error) {
      setMessage(error.message);
    }
  };

  const handleCreateTask = async () => {
    try {
      await apiRequest("/api/tasks", {
        method: "POST",
        body: JSON.stringify(taskForm)
      });
      setTaskForm({
        projectId: "",
        title: "",
        description: "",
        assignedTo: "",
        priority: "MEDIUM",
        dueDate: ""
      });
      setMessage("Task created successfully.");
      await refreshAll();
    } catch (error) {
      setMessage(error.message);
    }
  };

  const handleStatusChange = async (taskId, status) => {
    try {
      await apiRequest(`/api/tasks/${taskId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status })
      });
      await refreshAll();
    } catch (error) {
      setMessage(error.message);
    }
  };

  return (
    <main className="dashboard-shell">
      <section className="hero-banner">
        <div>
          <p className="eyebrow">Role-based team execution</p>
          <h1>{user.role === "ADMIN" ? "Admin control center" : "Member dashboard"}</h1>
          <p>
            Welcome, {user.name}. Track work across projects, spot overdue tasks, and keep
            delivery moving.
          </p>
        </div>
        <button className="ghost-button dark" onClick={onLogout}>
          Logout
        </button>
      </section>

      {message ? <div className="toast">{message}</div> : null}

      <section className="stats-grid">
        <StatCard label="Total tasks" value={dashboard?.summary?.total_tasks || 0} />
        <StatCard label="Open tasks" value={dashboard?.summary?.open_tasks || 0} tone="amber" />
        <StatCard label="Completed" value={dashboard?.summary?.completed_tasks || 0} tone="green" />
        <StatCard label="Overdue" value={dashboard?.summary?.overdue_tasks || 0} tone="rose" />
      </section>

      <section className="panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Overview</p>
            <h3>Status breakdown</h3>
          </div>
        </div>
        <div className="pill-row">
          <span className="pill">TODO: {statusMap.TODO}</span>
          <span className="pill">IN PROGRESS: {statusMap.IN_PROGRESS}</span>
          <span className="pill">DONE: {statusMap.DONE}</span>
        </div>
      </section>

      <ProjectPanel
        projects={projects}
        selectedProjectId={selectedProjectId}
        onSelectProject={setSelectedProjectId}
        selectedProject={selectedProject}
        users={users}
        addMemberUserId={addMemberUserId}
        setAddMemberUserId={setAddMemberUserId}
        onAddMember={user.role === "ADMIN" ? handleAddMember : null}
        createForm={projectForm}
        setCreateForm={setProjectForm}
        onCreateProject={user.role === "ADMIN" ? handleCreateProject : null}
      />

      <TaskPanel
        tasks={tasks}
        user={user}
        projects={projects}
        users={selectedProject?.members || users}
        taskForm={taskForm}
        setTaskForm={setTaskForm}
        onCreateTask={handleCreateTask}
        onStatusChange={handleStatusChange}
      />

      <section className="panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Focus list</p>
            <h3>Upcoming work</h3>
          </div>
        </div>
        <div className="task-table">
          {(dashboard?.spotlightTasks || []).map((task) => (
            <div key={task.id} className="task-row compact">
              <strong>{task.title}</strong>
              <span>{task.project_name}</span>
              <span>{task.status}</span>
              <span>{task.due_date || "No date"}</span>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
