import { useEffect, useMemo, useState } from "react";
import { useUser } from "@/context/UserContext";
import { createWorkItem, deleteWorkItem, getOptions, getWorkItems, updateWorkItem } from "@/services/api";
import { WorkSheetToolbar } from "@/components/work-sheet/WorkSheetToolbar";
import { WorkSheetTable } from "@/components/work-sheet/WorkSheetTable";
import { RoleSwitcher } from "@/components/layout/RoleSwitcher";
import { toast } from "@/components/ui/sonner";
import { WORKSHEET } from "@/constants/testIds";

const emptyFilters = { search: "", status: "", deliverable_type: "", work_category: "", month: "" };

export default function WorkSheetPage() {
  const { currentUser, users, loading: userLoading } = useUser();
  const [items, setItems] = useState([]);
  const [options, setOptions] = useState({});
  const [filters, setFilters] = useState(emptyFilters);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getOptions().then(setOptions);
  }, []);

  const fetchItems = () => {
    if (!currentUser) return;
    setLoading(true);
    const params = Object.fromEntries(Object.entries(filters).filter(([, v]) => v));
    getWorkItems(currentUser.id, params)
      .then(setItems)
      .catch(() => toast.error("Could not load work items"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser, filters]);

  const handleAddRow = async () => {
    try {
      const created = await createWorkItem(currentUser.id, {
        work_date: new Date().toISOString().slice(0, 10),
        deliverable_name: "",
        deliverable_type: options.deliverable_types?.[0] || "",
        work_category: "Core",
        status: "Not Started",
      });
      setItems((prev) => [created, ...prev]);
      toast.success("Row added");
    } catch (e) {
      toast.error(e.response?.data?.detail || "Could not add row");
    }
  };

  const handleUpdate = async (id, patch) => {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...patch } : it)));
    try {
      const updated = await updateWorkItem(currentUser.id, id, patch);
      setItems((prev) => prev.map((it) => (it.id === id ? updated : it)));
    } catch (e) {
      toast.error(e.response?.data?.detail || "Update failed");
      fetchItems();
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteWorkItem(currentUser.id, id);
      setItems((prev) => prev.filter((it) => it.id !== id));
      toast.success("Row deleted");
    } catch (e) {
      toast.error(e.response?.data?.detail || "Delete failed");
    }
  };

  const myRowsCount = useMemo(
    () => (currentUser ? items.filter((i) => i.creator_id === currentUser.id).length : 0),
    [items, currentUser]
  );

  if (userLoading || !currentUser) {
    return <div className="flex h-screen items-center justify-center text-muted-foreground">Loading work sheet...</div>;
  }

  return (
    <div className="flex h-screen flex-col bg-background">
      <header className="flex items-center justify-between bg-gradient-to-r from-teal-800 to-teal-700 px-5 py-3 text-white shadow-sm">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">WorkSheet</h1>
          <p className="text-xs text-teal-100/80">Spreadsheet-first work tracking</p>
        </div>
        <div className="flex items-center gap-4">
          <span data-testid={WORKSHEET.myRowsCount} className="hidden md:inline text-xs text-teal-100/80">
            {currentUser.role === "member" ? `${myRowsCount} of my rows` : `${items.length} total rows`}
          </span>
          <RoleSwitcher />
        </div>
      </header>

      <WorkSheetToolbar
        filters={filters}
        setFilters={setFilters}
        options={options}
        onAddRow={handleAddRow}
        canAdd={true}
        resultCount={items.length}
      />

      {loading ? (
        <div data-testid={WORKSHEET.loadingState} className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
          Loading rows...
        </div>
      ) : (
        <WorkSheetTable
          items={items}
          currentUser={currentUser}
          users={users}
          options={options}
          onUpdate={handleUpdate}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
}
