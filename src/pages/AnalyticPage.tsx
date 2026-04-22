import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import {
  ArrowDownTrayIcon,
  CheckIcon,
  EnvelopeIcon,
  PencilIcon,
  PlusIcon,
  TrashIcon,
  UserGroupIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import API from "../api/axios";
import Layout from "../components/Layout";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import EmptyState from "../components/ui/EmptyState";
import Input from "../components/ui/Input";
import Skeleton from "../components/ui/Skeleton";
import Tooltip from "../components/ui/Tooltip";
import { useDebouncedValue } from "../hooks/useDebouncedValue";

interface Client {
  _id: string;
  name: string;
  email?: string;
  createdAt?: string;
}

interface Stats {
  totalClients: number;
  totalNotes: number;
  recentClients: number;
}

const listVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: (index: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: index * 0.04, duration: 0.25 },
  }),
  exit: { opacity: 0, y: 12, transition: { duration: 0.2 } },
};

const AddClients = () => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const debouncedSearch = useDebouncedValue(search, 300);

  const statsQuery = useQuery({
    queryKey: ["clients", "stats"],
    queryFn: async () => (await API.get("/clients/stats")).data as Stats,
  });

  const clientsQuery = useQuery({
    queryKey: ["clients", { page, search: debouncedSearch }],
    queryFn: async () => {
      const res = await API.get(`/clients?page=${page}&limit=8&search=${debouncedSearch}`);
      return res.data as { clients: Client[]; pages: number };
    },
    placeholderData: (previous) => previous,
  });

  const addClientMutation = useMutation({
    mutationFn: async () =>
      (await API.post("/clients", { name: newName.trim(), email: newEmail.trim() })).data as Client,
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ["clients"] });
      const key = ["clients", { page, search: debouncedSearch }];
      const previous = queryClient.getQueryData<{ clients: Client[]; pages: number }>(key);

      if (previous) {
        const optimisticClient: Client = {
          _id: `tmp-${Date.now()}`,
          name: newName.trim(),
          email: newEmail.trim(),
          createdAt: new Date().toISOString(),
        };
        queryClient.setQueryData(key, {
          ...previous,
          clients: [optimisticClient, ...previous.clients].slice(0, 8),
        });
      }
      return { previous, key };
    },
    onError: (_error, _vars, context) => {
      if (context?.previous && context?.key) {
        queryClient.setQueryData(context.key, context.previous);
      }
      toast.error("Could not add client");
    },
    onSuccess: () => {
      toast.success("Client added");
      setNewName("");
      setNewEmail("");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      queryClient.invalidateQueries({ queryKey: ["clients", "stats"] });
    },
  });

  const deleteClientMutation = useMutation({
    mutationFn: async (clientId: string) => API.delete(`/clients/${clientId}`),
    onMutate: async (clientId) => {
      await queryClient.cancelQueries({ queryKey: ["clients"] });
      const key = ["clients", { page, search: debouncedSearch }];
      const previous = queryClient.getQueryData<{ clients: Client[]; pages: number }>(key);

      if (previous) {
        queryClient.setQueryData(key, {
          ...previous,
          clients: previous.clients.filter((client) => client._id !== clientId),
        });
      }
      return { previous, key };
    },
    onError: (_error, _vars, context) => {
      if (context?.previous && context?.key) {
        queryClient.setQueryData(context.key, context.previous);
      }
      toast.error("Could not delete client");
    },
    onSuccess: () => toast.success("Client deleted"),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      queryClient.invalidateQueries({ queryKey: ["clients", "stats"] });
    },
  });

  const updateClientMutation = useMutation({
    mutationFn: async ({ id, name, email }: { id: string; name: string; email: string }) =>
      (await API.put(`/clients/${id}`, { name, email })).data as Client,
    onMutate: async (payload) => {
      await queryClient.cancelQueries({ queryKey: ["clients"] });
      const key = ["clients", { page, search: debouncedSearch }];
      const previous = queryClient.getQueryData<{ clients: Client[]; pages: number }>(key);

      if (previous) {
        queryClient.setQueryData(key, {
          ...previous,
          clients: previous.clients.map((client) =>
            client._id === payload.id ? { ...client, name: payload.name, email: payload.email } : client
          ),
        });
      }
      return { previous, key };
    },
    onError: (_error, _vars, context) => {
      if (context?.previous && context?.key) {
        queryClient.setQueryData(context.key, context.previous);
      }
      toast.error("Could not update client");
    },
    onSuccess: () => {
      toast.success("Client updated");
      setEditingId(null);
      setEditName("");
      setEditEmail("");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      queryClient.invalidateQueries({ queryKey: ["clients", "stats"] });
    },
  });

  const clients = clientsQuery.data?.clients ?? [];
  const totalPages = clientsQuery.data?.pages ?? 1;

  const summaryCards = useMemo(
    () => [
      { label: "Total clients", value: statsQuery.data?.totalClients ?? 0 },
      { label: "New this week", value: statsQuery.data?.recentClients ?? 0 },
      { label: "Total notes", value: statsQuery.data?.totalNotes ?? 0 },
    ],
    [statsQuery.data]
  );

  const requestDelete = (clientId: string) => {
    setPendingDeleteId(clientId);
    setConfirmOpen(true);
  };

  const confirmDelete = () => {
    if (!pendingDeleteId) return;
    deleteClientMutation.mutate(pendingDeleteId);
    setConfirmOpen(false);
    setPendingDeleteId(null);
  };

  const startEdit = (client: Client) => {
    setEditingId(client._id);
    setEditName(client.name);
    setEditEmail(client.email || "");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName("");
    setEditEmail("");
  };

  const handleUpdate = () => {
    if (!editingId || !editName.trim() || !editEmail.trim()) {
      toast.error("Name and email are required");
      return;
    }
    updateClientMutation.mutate({
      id: editingId,
      name: editName.trim(),
      email: editEmail.trim(),
    });
  };

  const exportClients = async () => {
    try {
      const first = await API.get("/clients?page=1&limit=500&search=");
      const records = (first.data.clients || []) as Client[];
      if (!records.length) {
        toast("No clients to export");
        return;
      }

      const csvHeader = "Name,Email,Created\n";
      const csvRows = records
        .map((c) => `${JSON.stringify(c.name)},${JSON.stringify(c.email || "")},${new Date(c.createdAt || "").toLocaleDateString()}`)
        .join("\n");
      const blob = new Blob([csvHeader + csvRows], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `clients-${new Date().toISOString().slice(0, 10)}.csv`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success("CSV exported");
    } catch (error) {
      toast.error("CSV export failed");
    }
  };

  return (
    <Layout>
      <div className="space-y-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-[rgb(var(--text-2))]">Client intake</p>
            <h1 className="text-3xl font-semibold text-[rgb(var(--text-1))] dark:text-white">Clients</h1>
            <p className="mt-1 text-sm text-[rgb(var(--text-2))] dark:text-gray-300">
              Capture new clients fast and keep your pipeline tidy.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge tone="neutral">Page {page}</Badge>
            <Button variant="secondary" onClick={exportClients}>
              <ArrowDownTrayIcon className="h-4 w-4" />
              Export CSV
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {statsQuery.isLoading
            ? Array.from({ length: 3 }).map((_, idx) => <Skeleton key={idx} className="h-28 w-full" />)
            : summaryCards.map((card) => (
                <Card key={card.label} className="p-5">
                  <p className="text-xs uppercase tracking-[0.2em] text-[rgb(var(--text-2))]">{card.label}</p>
                  <p className="mt-3 text-2xl font-semibold text-[rgb(var(--text-1))]">{card.value}</p>
                </Card>
              ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.1fr_1.4fr]">
          <Card className="p-6">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-2xl bg-[rgba(56,116,255,0.15)] text-[rgb(var(--brand-2))]">
                <UserGroupIcon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-[rgb(var(--text-1))]">Add a new client</p>
                <p className="text-xs text-[rgb(var(--text-2))]">We will save this to your master list.</p>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              <Input value={newName} onChange={(event) => setNewName(event.target.value)} placeholder="Client name" />
              <div className="relative">
                <EnvelopeIcon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[rgb(var(--text-2))]" />
                <Input
                  value={newEmail}
                  onChange={(event) => setNewEmail(event.target.value)}
                  placeholder="Client email"
                  className="pl-10"
                />
              </div>
              <Button
                onClick={() => addClientMutation.mutate()}
                disabled={!newName.trim() || !newEmail.trim() || addClientMutation.isPending}
                className="w-full justify-center"
              >
                <PlusIcon className="h-4 w-4" />
                {addClientMutation.isPending ? "Saving..." : "Add client"}
              </Button>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-[rgb(var(--text-1))]">Client directory</p>
                <p className="text-xs text-[rgb(var(--text-2))]">Search, review, and remove clients.</p>
              </div>
              <Input
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setPage(1);
                }}
                placeholder="Search clients..."
                className="sm:max-w-[220px]"
              />
            </div>

            <div className="mt-6 space-y-3">
              {clientsQuery.isLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 4 }).map((_, index) => (
                    <Skeleton key={index} className="h-20 w-full" />
                  ))}
                </div>
              ) : clients.length === 0 ? (
                <EmptyState title="No clients yet" description="Add your first client to get started." />
              ) : (
                <AnimatePresence>
                  {clients.map((client, index) => (
                    <motion.div key={client._id} custom={index} variants={listVariants} initial="hidden" animate="visible" exit="exit">
                      {editingId === client._id ? (
                        <div className="rounded-2xl border border-[rgb(var(--stroke-1))] bg-[rgb(var(--surface-2))] px-4 py-3">
                          <div className="space-y-3">
                            <Input value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="Client name" className="text-sm" />
                            <div className="relative">
                              <EnvelopeIcon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[rgb(var(--text-2))]" />
                              <Input value={editEmail} onChange={(e) => setEditEmail(e.target.value)} placeholder="Client email" className="pl-10 text-sm" />
                            </div>
                            <div className="flex items-center justify-end gap-2">
                              <Button size="sm" variant="ghost" onClick={cancelEdit} disabled={updateClientMutation.isPending}>
                                <XMarkIcon className="h-4 w-4" />
                                Cancel
                              </Button>
                              <Button size="sm" onClick={handleUpdate} disabled={!editName.trim() || !editEmail.trim() || updateClientMutation.isPending}>
                                <CheckIcon className="h-4 w-4" />
                                {updateClientMutation.isPending ? "Saving..." : "Save"}
                              </Button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="rounded-2xl border border-[rgb(var(--stroke-1))] bg-[rgb(var(--surface-2))] px-4 py-3">
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <div>
                              <p className="text-sm font-semibold text-[rgb(var(--text-1))]">{client.name}</p>
                              <p className="text-xs text-[rgb(var(--text-2))]">{client.email || "No email on file"}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              {client.createdAt && (
                                <Badge tone="neutral">{new Date(client.createdAt).toLocaleDateString()}</Badge>
                              )}
                              <Tooltip label="Edit client">
                                <Button size="icon" variant="ghost" onClick={() => startEdit(client)} aria-label="Edit client">
                                  <PencilIcon className="h-4 w-4 text-[rgb(var(--text-2))]" />
                                </Button>
                              </Tooltip>
                              <Tooltip label="Delete client">
                                <Button size="icon" variant="ghost" onClick={() => requestDelete(client._id)} aria-label="Delete client">
                                  <TrashIcon className="h-4 w-4 text-[rgb(var(--danger))]" />
                                </Button>
                              </Tooltip>
                            </div>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <Button variant="ghost" onClick={() => setPage((prev) => Math.max(1, prev - 1))} disabled={page === 1}>
                Previous
              </Button>
              <Badge tone="neutral">{page}</Badge>
              <Badge tone="neutral">of {totalPages}</Badge>
              <Button variant="ghost" onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))} disabled={page === totalPages}>
                Next
              </Button>
            </div>
          </Card>
        </div>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        title="Delete client"
        description="This action permanently removes the client and their notes."
        confirmLabel="Delete client"
        onClose={() => setConfirmOpen(false)}
        onConfirm={confirmDelete}
      />
    </Layout>
  );
};

export default AddClients;
