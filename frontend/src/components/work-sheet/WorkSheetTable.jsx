import { Table, TableBody, TableHead, TableHeader, TableRow } from "../ui/table";
import { Checkbox } from "../ui/checkbox";
import { WorkSheetRow } from "./WorkSheetRow";
import { DraftWorkSheetRow } from "./DraftWorkSheetRow";
import { WORKSHEET } from "@/constants/testIds";

const COLUMNS = ["Date", "Project", "Deliverable Link", "Stage", "Deliverable", "Type", "Category", "Version", "Time (min)", "Creator", "Reviewer", "Remarks", "Status"];

export const WorkSheetTable = ({ items, currentUser, users, options, projects, deliverables, onUpdate, onDelete, onCreate, selectedIds, onToggleSelect, onToggleSelectAll }) => {
  const allSelected = items.length > 0 && selectedIds.length === items.length;
  const totalCols = COLUMNS.length + (currentUser.role === "admin" ? 3 : 2); // #, checkbox, cols, (delete for admin)

  return (
    <div className="flex-1 overflow-auto sheet-mode">
      <Table data-testid={WORKSHEET.table}>
        <TableHeader>
          <TableRow>
            <TableHead className="row-num-head">#</TableHead>
            <TableHead className="checkbox-cell">
              <Checkbox
                data-testid="worksheet-select-all-checkbox"
                checked={allSelected}
                onCheckedChange={onToggleSelectAll}
                disabled={items.length === 0}
              />
            </TableHead>
            {COLUMNS.map((c) => (
              <TableHead key={c}>{c}</TableHead>
            ))}
            {currentUser.role === "admin" && <TableHead className="w-10" />}
          </TableRow>
        </TableHeader>
        <TableBody>
          {/* Inline draft row — always shown; typing into any field creates the row */}
          <DraftWorkSheetRow
            currentUser={currentUser}
            users={users}
            options={options}
            projects={projects}
            deliverables={deliverables}
            onCreate={onCreate}
          />
          {items.length === 0 ? (
            <TableRow>
              <td colSpan={totalCols} data-testid={WORKSHEET.emptyState} className="py-16 text-center">
                <p className="text-sm font-medium text-slate-700">No work items yet</p>
                <p className="text-xs text-slate-500">Start typing in the top row above to add your first entry.</p>
              </td>
            </TableRow>
          ) : (
            items.map((item, idx) => (
              <WorkSheetRow
                key={item.id}
                item={item}
                index={idx + 1}
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
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
};
