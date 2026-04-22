import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import {
  ArrowPathIcon,
  CheckCircleIcon,
  ClockIcon,
  CurrencyDollarIcon,
  MagnifyingGlassIcon,
  PencilSquareIcon,
  PlusIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import API from "../api/axios";
import Layout from "../components/Layout";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import EmptyState from "../components/ui/EmptyState";
import Input from "../components/ui/Input";
import Modal from "../components/ui/Modal";
import Select from "../components/ui/Select";
import Skeleton from "../components/ui/Skeleton";
import Tooltip from "../components/ui/Tooltip";
import { useDebouncedValue } from "../hooks/useDebouncedValue";

interface Project {
  _id: string;
  name: string;
  clientId: {
    _id: string;
    name: string;
  };
  estimatedHours: number;
  agreedPrice: number;
  status: "active" | "completed";
  createdAt: string;
}

interface Client {
  _id: string;
  name: string;
}

interface ProjectFormValues {
  name: string;
  clientId: string;
  estimatedHours: number;
  agreedPrice: number;
}

const listVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: (index: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: index * 0.04, duration: 0.35 },
  }),
  exit: { opacity: 0, y: 12, transition: { duration: 0.2 } },
};

const Projects = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const debouncedSearch = useDebouncedValue(search, 300);

  const form = useForm<ProjectFormValues>({
    defaultValues: {
      name: "",
      clientId: "",
      estimatedHours: 0,
      agreedPrice: 0,
    },
  });

  const projectsQuery = useQuery({
    queryKey: ["projects"],
    queryFn: async () => (await API.get("/projects")).data as Project[],
  });

  const clientsQuery = useQuery({
    queryKey: ["clients", { limit: 100 }],
    queryFn: async () => {
      const res = await API.get("/clients?limit=100");
      return (res.data.clients || res.data) as Client[];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (payload: ProjectFormValues) => {
      if (editingProject) {
        return (await API.put(`/projects/${editingProject._id}`, payload)).data as Project;
      }
      return (await API.post("/projects", payload)).data as Project;
    },
    onMutate: async (payload) => {
      await queryClient.cancelQueries({ queryKey: ["projects"] });
      const previous = queryClient.getQueryData<Project[]>(["projects"]);

      if (editingProject && previous) {
        queryClient.setQueryData(
          ["projects"],
          previous.map((project) =>
            project._id === editingProject._id ? { ...project, ...payload } : project
          )
        );
      }
      return { previous };
    },
    onSuccess: () => {
      toast.success(editingProject ? "Project updated" : "Project created");
      setIsFormOpen(false);
      setEditingProject(null);
      form.reset({ name: "", clientId: "", estimatedHours: 0, agreedPrice: 0 });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
    onError: (_error, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["projects"], context.previous);
      }
      toast.error("Failed to save project");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => API.delete(`/projects/${id}`),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ["projects"] });
      const previous = queryClient.getQueryData<Project[]>(["projects"]);
      if (previous) {
        queryClient.setQueryData(
          ["projects"],
          previous.filter((project) => project._id !== id)
        );
      }
      return { previous };
    },
    onSuccess: () => {
      toast.success("Project deleted");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
    onError: (_error, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["projects"], context.previous);
      }
      toast.error("Failed to delete project");
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async (project: Project) => {
      const newStatus = project.status === "active" ? "completed" : "active";
      return (
        await API.put(`/projects/${project._id}`, {
          ...project,
          status: newStatus,
        })
      ).data as Project;
    },
    onMutate: async (project) => {
      await queryClient.cancelQueries({ queryKey: ["projects"] });
      const previous = queryClient.getQueryData<Project[]>(["projects"]);
      const newStatus = project.status === "active" ? "completed" : "active";
      if (previous) {
        queryClient.setQueryData(
          ["projects"],
          previous.map((item) =>
            item._id === project._id ? { ...item, status: newStatus } : item
          )
        );
      }
      return { previous };
    },
    onSuccess: () => {
      toast.success("Project status updated");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
    onError: (_error, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["projects"], context.previous);
      }
      toast.error("Failed to update status");
    },
  });

  const projects = projectsQuery.data ?? [];
  const clients = clientsQuery.data ?? [];

  const filteredProjects = useMemo(() => {
    const term = debouncedSearch.trim().toLowerCase();
    if (!term) return projects;
    return projects.filter(
      (project) =>
        project.name.toLowerCase().includes(term) ||
        project.clientId?.name?.toLowerCase().includes(term)
    );
  }, [projects, debouncedSearch]);

  const stats = useMemo(() => {
    const total = projects.length;
    const active = projects.filter((p) => p.status === "active").length;
    const completed = projects.filter((p) => p.status === "completed").length;
    return { total, active, completed };
  }, [projects]);

  const totals = useMemo(() => {
    const hours = projects.reduce((sum, p) => sum + (p.estimatedHours || 0), 0);
    const value = projects.reduce((sum, p) => sum + (p.agreedPrice || 0), 0);
    return { hours, value };
  }, [projects]);

  const openCreate = () => {
    setEditingProject(null);
    form.reset({ name: "", clientId: "", estimatedHours: 0, agreedPrice: 0 });
    setIsFormOpen(true);
  };

  const openEdit = (project: Project) => {
    setEditingProject(project);
    form.reset({
      name: project.name,
      clientId: project.clientId?._id ?? "",
      estimatedHours: project.estimatedHours,
      agreedPrice: project.agreedPrice,
    });
    setIsFormOpen(true);
  };

  const requestDelete = (id: string) => {
    setPendingDeleteId(id);
    setConfirmOpen(true);
  };

  const confirmDelete = () => {
    if (!pendingDeleteId) return;
    deleteMutation.mutate(pendingDeleteId);
    setConfirmOpen(false);
    setPendingDeleteId(null);
  };

  return (
    <Layout>
      <div className="space-y-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-[rgb(var(--text-2))]">
              Portfolio
            </p>
            <h1 className="text-3xl font-semibold">Projects</h1>
            <p className="mt-1 text-sm text-[rgb(var(--text-2))]">
              Track your delivery, budgets, and client momentum in one place.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="secondary" onClick={() => projectsQuery.refetch()}>
              <ArrowPathIcon className="h-4 w-4" />
              Refresh
            </Button>
            <Button onClick={openCreate}>
              <PlusIcon className="h-4 w-4" />
              New Project
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-5">
          {[
            { label: "total", value: stats.total },
            { label: "active", value: stats.active },
            { label: "completed", value: stats.completed },
          ].map((item) => (
            <Card key={item.label} className="p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-[rgb(var(--text-2))]">
                {item.label}
              </p>
              <p className="mt-3 text-2xl font-semibold">{item.value}</p>
            </Card>
          ))}
          <Card className="p-4">
            <div className="flex items-center justify-between text-xs uppercase tracking-[0.2em] text-[rgb(var(--text-2))]">
              Total hours
              <ClockIcon className="h-4 w-4 text-[rgb(var(--brand-2))]" />
            </div>
            <p className="mt-3 text-2xl font-semibold">{totals.hours}</p>
          </Card>
          <Card className="p-4">
            <div className="flex items-center justify-between text-xs uppercase tracking-[0.2em] text-[rgb(var(--text-2))]">
              Total value
              <CurrencyDollarIcon className="h-4 w-4 text-[rgb(var(--brand-2))]" />
            </div>
            <p className="mt-3 text-2xl font-semibold">
              ${totals.value.toLocaleString()}
            </p>
          </Card>
        </div>

        <Card className="p-4 md:p-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="relative flex-1">
              <MagnifyingGlassIcon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[rgb(var(--text-2))]" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search projects or clients..."
                className="pl-10"
              />
            </div>
            <div className="flex items-center gap-2">
              <Badge tone="neutral">{filteredProjects.length} results</Badge>
              <Button
                variant={view === "grid" ? "primary" : "outline"}
                size="sm"
                onClick={() => setView("grid")}
              >
                Grid
              </Button>
              <Button
                variant={view === "list" ? "primary" : "outline"}
                size="sm"
                onClick={() => setView("list")}
              >
                List
              </Button>
            </div>
          </div>
        </Card>

        {projectsQuery.isLoading ? (
          <div className={view === "grid" ? "grid gap-4 md:grid-cols-2" : "space-y-3"}>
            {Array.from({ length: 6 }).map((_, index) => (
              <Skeleton key={index} className="h-32 w-full" />
            ))}
          </div>
        ) : filteredProjects.length === 0 ? (
          <EmptyState
            title="No projects yet"
            description="Create your first project and start tracking delivery, pricing, and status."
            action={<Button onClick={openCreate}>Create project</Button>}
          />
        ) : (
          <div className={view === "grid" ? "grid gap-4 md:grid-cols-2" : "space-y-3"}>
            <AnimatePresence>
              {filteredProjects.map((project, index) => (
                <motion.div
                  key={project._id}
                  custom={index}
                  variants={listVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                >
                  <Card className="flex h-full flex-col gap-4 p-5 transition hover:-translate-y-1 hover:shadow-xl">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="text-lg font-semibold">{project.name}</h3>
                        <p className="text-sm text-[rgb(var(--text-2))]">
                          Client: {project.clientId?.name || "Unknown"}
                        </p>
                      </div>
                      <Badge tone={project.status === "completed" ? "success" : "warning"}>
                        {project.status}
                      </Badge>
                    </div>
                    <div className="grid gap-3 text-sm text-[rgb(var(--text-2))] md:grid-cols-2">
                      <div>
                        <p className="text-xs uppercase tracking-[0.2em]">Hours</p>
                        <p className="mt-1 text-base font-semibold text-[rgb(var(--text-1))]">
                          {project.estimatedHours} hrs
                        </p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-[0.2em]">Agreed</p>
                        <p className="mt-1 text-base font-semibold text-[rgb(var(--text-1))]">
                          ${project.agreedPrice.toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="mt-auto flex flex-wrap items-center gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => toggleMutation.mutate(project)}
                      >
                        <CheckCircleIcon className="h-4 w-4" />
                        {project.status === "active" ? "Mark complete" : "Reopen"}
                      </Button>
                      <Tooltip label="Edit project">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => openEdit(project)}
                          aria-label="Edit project"
                        >
                          <PencilSquareIcon className="h-4 w-4" />
                        </Button>
                      </Tooltip>
                      <Tooltip label="Delete project">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => requestDelete(project._id)}
                          aria-label="Delete project"
                        >
                          <TrashIcon className="h-4 w-4 text-[rgb(var(--danger))]" />
                        </Button>
                      </Tooltip>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      <Modal
        open={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={editingProject ? "Edit project" : "Create project"}
      >
        <form
          onSubmit={form.handleSubmit((values) => saveMutation.mutate(values))}
          className="space-y-4"
        >
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-[0.2em] text-[rgb(var(--text-2))]">
              Client
            </label>
            <Select {...form.register("clientId", { required: true })}>
              <option value="">Select client</option>
              {clients.map((client) => (
                <option key={client._id} value={client._id}>
                  {client.name}
                </option>
              ))}
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-[0.2em] text-[rgb(var(--text-2))]">
              Project name
            </label>
            <Input
              {...form.register("name", { required: true })}
              placeholder="Revamp onboarding flow"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-[0.2em] text-[rgb(var(--text-2))]">
                Estimated hours
              </label>
              <Input
                type="number"
                min={0}
                step={0.5}
                {...form.register("estimatedHours", { valueAsNumber: true })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-[0.2em] text-[rgb(var(--text-2))]">
                Agreed price
              </label>
              <Input
                type="number"
                min={0}
                {...form.register("agreedPrice", { valueAsNumber: true })}
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-4">
            <p className="text-xs text-[rgb(var(--text-2))]">
              Keep pricing and hours aligned for accurate analytics.
            </p>
            <div className="flex gap-3">
              <Button variant="ghost" type="button" onClick={() => setIsFormOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={saveMutation.isPending}>
                {saveMutation.isPending ? "Saving..." : "Save project"}
              </Button>
            </div>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={confirmOpen}
        title="Delete project"
        description="This action cannot be undone. The project, its pricing, and status history will be removed."
        confirmLabel="Delete project"
        onClose={() => setConfirmOpen(false)}
        onConfirm={confirmDelete}
      />
    </Layout>
  );
};

export default Projects;
