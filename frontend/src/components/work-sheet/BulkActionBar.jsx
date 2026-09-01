import { useState } from "react";
import { Button } from "../ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Trash2, X } from "lucide-react";

export const BulkActionBar = ({ selectedCount, currentUser, options, onApplyStatus, onDelete, onClear }) => {
  const [status, setStatus] = useState("");
  const allowedStatuses = currentUser.role === "member" ? options.member_forward_statuses : options.statuses;

  return (
    <div data-testid="worksheet-bulk-action-bar" className="flex items-center gap-2 border-b border-teal-200 bg-teal-50 px-4 py-2.5">
      <span className="text-sm font-medium text-teal-800">{selectedCount} selected</span>

      <Select value={status} onValueChange={setStatus}>
        <SelectTrigger data-testid="worksheet-bulk-status-select" className="h-8 w-[180px] bg-white">
          <SelectValue placeholder="Set status to..." />
        </SelectTrigger>
        <SelectContent>
          {allowedStatuses?.map((s) => (
            <SelectItem key={s} value={s}>{s}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Button
        data-testid="worksheet-bulk-apply-btn"
        size="sm"
        className="h-8 bg-teal-700 hover:bg-teal-800"
        disabled={!status}
        onClick={() => onApplyStatus(status)}
      >
        Apply
      </Button>

      {currentUser.role === "admin" && (
        <Button
          data-testid="worksheet-bulk-delete-btn"
          size="sm"
          variant="ghost"
          className="h-8 text-rose-600 hover:bg-rose-50 hover:text-rose-700"
          onClick={onDelete}
        >
          <Trash2 className="mr-1 h-3.5 w-3.5" /> Delete selected
        </Button>
      )}

      <Button data-testid="worksheet-bulk-clear-btn" size="sm" variant="ghost" className="ml-auto h-8" onClick={onClear}>
        <X className="mr-1 h-3.5 w-3.5" /> Clear selection
      </Button>
    </div>
  );
};
