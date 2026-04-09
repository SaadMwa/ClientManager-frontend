import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
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
    transition: { delay: index * 0.04, duration: 0.35 },
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
  const debouncedSearch = useDebouncedValue(search, 400);

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
    mutationFn: async () => API.post("/clients", { name: newName, email: newEmail }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      queryClient.invalidateQueries({ queryKey: ["clients", "stats"] });
      setNewName("");
      setNewEmail("");
    },
  });
  

  const deleteClientMutation = useMutation({
    mutationFn: async (clientId: string) => API.delete(`/clients/${clientId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      queryClient.invalidateQueries({ queryKey: ["clients", "stats"] });
    },
  });

  const updateClientMutation = useMutation({
    mutationFn: async ({ id, name, email }: { id: string; name: string; email: string }) =>
      API.put(`/clients/${id}`, { name, email }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      setEditingId(null);
      setEditName("");
      setEditEmail("");
    },
  });

  const clients = clientsQuery.data?.clients ?? [];
  const totalPages = clientsQuery.data?.pages ?? 1;

  const summaryCards = useMemo(
    () => [
      {
        label: "Total clients",
        value: statsQuery.data?.totalClients ?? 0,
      },
      {
        label: "New this week",
        value: statsQuery.data?.recentClients ?? 0,
      },
      {
        label: "Total notes",
        value: statsQuery.data?.totalNotes ?? 0,
      },
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
    if (!editingId || !editName.trim()) return;
    updateClientMutation.mutate({
      id: editingId,
      name: editName.trim(),
      email: editEmail.trim(),
    });
  };

  return (
    <Layout>
      <div className="space-y-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-[rgb(var(--text-2))]">
              Client intake
            </p>
            <h1 className="text-3xl font-semibold text-[rgb(var(--text-1))] dark:text-white">
              Add clients
            </h1>
            <p className="mt-1 text-sm text-[rgb(var(--text-2))] dark:text-gray-300">
              Capture new clients fast and keep your pipeline tidy.
            </p>
          </div>
          <Badge tone="neutral">Page {page}</Badge>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {statsQuery.isLoading ? (
            <>
              <Skeleton className="h-28 w-full" />
              <Skeleton className="h-28 w-full" />
              <Skeleton className="h-28 w-full" />
            </>
          ) : (
            summaryCards.map((card) => (
              <Card key={card.label} className="p-5">
                <p className="text-xs uppercase tracking-[0.2em] text-[rgb(var(--text-2))] dark:text-gray-400">
                  {card.label}
                </p>
                <p className="mt-3 text-2xl font-semibold text-[rgb(var(--text-1))] dark:text-white">
                  {card.value}
                </p>
              </Card>
            ))
          )}
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.1fr_1.4fr]">
          <Card className="p-6">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-2xl bg-[rgba(56,116,255,0.15)] text-[rgb(var(--brand-2))]">
                <UserGroupIcon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-[rgb(var(--text-1))] dark:text-white">
                  Add a new client
                </p>
                <p className="text-xs text-[rgb(var(--text-2))] dark:text-gray-400">
                  We will save this to your master list.
                </p>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              <Input
                value={newName}
                onChange={(event) => setNewName(event.target.value)}
                placeholder="Client name"
              />
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
                disabled={!newName.trim() || addClientMutation.isPending}
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
                <p className="text-sm font-semibold text-[rgb(var(--text-1))] dark:text-white">
                  Client directory
                </p>
                <p className="text-xs text-[rgb(var(--text-2))] dark:text-gray-400">
                  Search, review, and remove clients.
                </p>
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
                <EmptyState
                  title="No clients yet"
                  description="Add your first client to get started."
                />
              ) : (
                <AnimatePresence>
                  {clients.map((client, index) => (
                    <motion.div
                      key={client._id}
                      custom={index}
                      variants={listVariants}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                    >
                      {editingId === client._id ? (
                        <div className="rounded-2xl border border-[rgb(var(--stroke-1))] bg-[rgb(var(--surface-2))] px-4 py-3 dark:border-gray-700 dark:bg-gray-800">
                          <div className="space-y-3">
                            <Input
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                              placeholder="Client name"
                              className="text-sm"
                            />
                            <div className="relative">
                              <EnvelopeIcon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[rgb(var(--text-2))]" />
                              <Input
                                value={editEmail}
                                onChange={(e) => setEditEmail(e.target.value)}
                                placeholder="Client email"
                                className="pl-10 text-sm"
                              />
                            </div>
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={cancelEdit}
                                disabled={updateClientMutation.isPending}
                              >
                                <XMarkIcon className="h-4 w-4" />
                                Cancel
                              </Button>
                              <Button
                                size="sm"
                                onClick={handleUpdate}
                                disabled={!editName.trim() || updateClientMutation.isPending}
                              >
                                <CheckIcon className="h-4 w-4" />
                                {updateClientMutation.isPending ? "Saving..." : "Save"}
                              </Button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="rounded-2xl border border-[rgb(var(--stroke-1))] bg-[rgb(var(--surface-2))] px-4 py-3 dark:border-gray-700 dark:bg-gray-800">
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <div>
                              <p className="text-sm font-semibold text-[rgb(var(--text-1))] dark:text-white">
                                {client.name}
                              </p>
                              <p className="text-xs text-[rgb(var(--text-2))] dark:text-gray-400">
                                {client.email || "No email on file"}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              {client.createdAt && (
                                <Badge tone="neutral">
                                  {new Date(client.createdAt).toLocaleDateString()}
                                </Badge>
                              )}
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => startEdit(client)}
                                aria-label="Edit client"
                              >
                                <PencilIcon className="h-4 w-4 text-[rgb(var(--text-2))]" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => requestDelete(client._id)}
                                aria-label="Delete client"
                              >
                                <TrashIcon className="h-4 w-4 text-[rgb(var(--danger))]" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-3 dark:rounded-2xl dark:border dark:border-gray-700 dark:bg-gray-800 dark:p-3">
              <Button
                variant="ghost"
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                disabled={page === 1}
              >
                Previous
              </Button>
              <Badge tone="neutral">{page}</Badge>
              <Badge tone="neutral">of {totalPages}</Badge>
              <Button
                variant="ghost"
                onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={page === totalPages}
              >
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
