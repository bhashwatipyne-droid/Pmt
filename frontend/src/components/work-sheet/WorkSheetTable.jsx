import { Table, TableBody, TableHead, TableHeader, TableRow } from "../ui/table";
import { Checkbox } from "../ui/checkbox";
import { WorkSheetRow } from "./WorkSheetRow";
import { WORKSHEET } from "@/constants/testIds";

const COLUMNS = ["Date", "Project", "Deliverable Link", "Stage", "Deliverable", "Type", "Category", "Version", "Time (min)", "Creator", "Reviewer", "Remarks", "Status"];

export const WorkSheetTable = ({ items, currentUser, users, options, projects, deliverables, onUpdate, onDelete, selectedIds, onToggleSelect, onToggleSelectAll }) => {
  if (!items.length) {
    return (
      <div data-testid={WORKSHEET.emptyState} className="flex flex-col items-center justify-center gap-2 py-20 text-center">
        <p className="text-sm font-medium text-foreground">No work items yet</p>
        <p className="text-xs text-muted-foreground">Add a row to start tracking work.</p>
      </div>
    );
  }

  const allSelected = items.length > 0 && selectedIds.length === items.length;

  return (
    <div className="flex-1 overflow-auto">
      <Table data-testid={WORKSHEET.table}>
        <TableHeader className="sticky top-0 bg-card z-10">
          <TableRow>
            <TableHead className="w-10">
              <Checkbox
                data-testid="worksheet-select-all-checkbox"
                checked={allSelected}
                onCheckedChange={onToggleSelectAll}
              />
            </TableHead>
            {COLUMNS.map((c) => (
              <TableHead key={c}>{c}</TableHead>
            ))}
            {currentUser.role === "admin" && <TableHead className="w-10" />}
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => (
            <WorkSheetRow
              key={item.id}
              item={item}
              currentUser={currentUser}
              users={users}
              options={options}
              projects={projects}
              deliverables={deliverables}
              onUpdate={onUpdate}
              onDelete={onDelete}
              selected={selectedIds.includes(item.id)}
              onToggleSelect={onToggleSelect}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
