import { useEffect, useState } from "react";
import { TableCell, TableRow } from "../ui/table";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Button } from "../ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { StatusBadge } from "./StatusBadge";
import { Trash2 } from "lucide-react";
import { WORKSHEET } from "@/constants/testIds";

const NONE_VALUE = "__none__";

export const WorkSheetRow = ({ item, currentUser, users, options, onUpdate, onDelete }) => {
  const isMember = currentUser.role === "member";
  const isElevated = !isMember;
  const [local, setLocal] = useState({
    deliverable_name: item.deliverable_name,
    version: item.version,
    time_taken_minutes: item.time_taken_minutes,
    remarks: item.remarks,
  });

  useEffect(() => {
    setLocal({
      deliverable_name: item.deliverable_name,
      version: item.version,
      time_taken_minutes: item.time_taken_minutes,
      remarks: item.remarks,
    });
  }, [item.updated_at]);

  const nameOf = (id) => users.find((u) => u.id === id)?.name || "Unassigned";
  const allowedStatuses = isMember ? options.member_forward_statuses : options.statuses;

  const commit = (field, value) => {
    if (item[field] === value) return;
    onUpdate(item.id, { [field]: value });
  };

  return (
    <TableRow data-testid={`worksheet-row-${item.id}`}>
      <TableCell>
        <Input
          data-testid={`${WORKSHEET.dateInput}-${item.id}`}
          type="date"
          value={item.work_date}
          onChange={(e) => onUpdate(item.id, { work_date: e.target.value })}
          className="h-8 w-[130px]"
        />
      </TableCell>
      <TableCell>
        {isElevated ? (
          <Input
            data-testid={`${WORKSHEET.deliverableInput}-${item.id}`}
            value={local.deliverable_name}
            onChange={(e) => setLocal((l) => ({ ...l, deliverable_name: e.target.value }))}
            onBlur={() => commit("deliverable_name", local.deliverable_name)}
            className="h-8 w-[180px]"
            placeholder="Deliverable name"
          />
        ) : (
          <span className="text-sm">{item.deliverable_name || "—"}</span>
        )}
      </TableCell>
      <TableCell>
        {isElevated ? (
          <Select value={item.deliverable_type || undefined} onValueChange={(v) => onUpdate(item.id, { deliverable_type: v })}>
            <SelectTrigger data-testid={`${WORKSHEET.typeSelect}-${item.id}`} className="h-8 w-[150px]">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              {options.deliverable_types?.map((t) => (
                <SelectItem key={t} value={t}>{t}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <span className="text-sm text-muted-foreground">{item.deliverable_type || "—"}</span>
        )}
      </TableCell>
      <TableCell>
        {isElevated ? (
          <Select value={item.work_category} onValueChange={(v) => onUpdate(item.id, { work_category: v })}>
            <SelectTrigger data-testid={`${WORKSHEET.categorySelect}-${item.id}`} className="h-8 w-[110px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {options.work_categories?.map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <span className="text-sm text-muted-foreground">{item.work_category}</span>
        )}
      </TableCell>
      <TableCell>
        <Input
          data-testid={`${WORKSHEET.versionInput}-${item.id}`}
          value={local.version}
          onChange={(e) => setLocal((l) => ({ ...l, version: e.target.value }))}
          onBlur={() => commit("version", local.version)}
          className="h-8 w-[80px]"
          placeholder="v1"
        />
      </TableCell>
      <TableCell>
        <Input
          data-testid={`${WORKSHEET.timeInput}-${item.id}`}
          type="number"
          min="0"
          step="5"
          value={local.time_taken_minutes}
          onChange={(e) => setLocal((l) => ({ ...l, time_taken_minutes: e.target.value }))}
          onBlur={() => commit("time_taken_minutes", Number(local.time_taken_minutes) || 0)}
          className="h-8 w-[80px]"
        />
      </TableCell>
      <TableCell>
        {isElevated ? (
          <Select value={item.creator_id || undefined} onValueChange={(v) => onUpdate(item.id, { creator_id: v })}>
            <SelectTrigger data-testid={`${WORKSHEET.creatorSelect}-${item.id}`} className="h-8 w-[140px]">
              <SelectValue placeholder="Creator" />
            </SelectTrigger>
            <SelectContent>
              {users.filter((u) => u.role !== "admin").map((u) => (
                <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <span className="text-sm">{nameOf(item.creator_id)}</span>
        )}
      </TableCell>
      <TableCell>
        {isElevated ? (
          <Select
            value={item.reviewer_id || NONE_VALUE}
            onValueChange={(v) => onUpdate(item.id, { reviewer_id: v === NONE_VALUE ? null : v })}
          >
            <SelectTrigger data-testid={`${WORKSHEET.reviewerSelect}-${item.id}`} className="h-8 w-[140px]">
              <SelectValue placeholder="Reviewer" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NONE_VALUE}>Unassigned</SelectItem>
              {users.filter((u) => u.role !== "member").map((u) => (
                <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <span className="text-sm text-muted-foreground">{item.reviewer_id ? nameOf(item.reviewer_id) : "Unassigned"}</span>
        )}
      </TableCell>
      <TableCell>
        <Textarea
          data-testid={`${WORKSHEET.remarksInput}-${item.id}`}
          value={local.remarks}
          onChange={(e) => setLocal((l) => ({ ...l, remarks: e.target.value }))}
          onBlur={() => commit("remarks", local.remarks)}
          className="min-h-[32px] h-8 w-[200px] resize-none py-1.5"
          rows={1}
        />
      </TableCell>
      <TableCell>
        <Select value={item.status} onValueChange={(v) => onUpdate(item.id, { status: v })}>
          <SelectTrigger data-testid={`${WORKSHEET.statusSelect}-${item.id}`} className="h-8 w-[170px] border-none bg-transparent shadow-none p-0">
            <SelectValue>
              <StatusBadge status={item.status} />
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {options.statuses?.map((s) => (
              <SelectItem key={s} value={s} disabled={!allowedStatuses?.includes(s)}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </TableCell>
      {currentUser.role === "admin" && (
        <TableCell>
          <Button
            data-testid={`${WORKSHEET.deleteRowBtn}-${item.id}`}
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-rose-600 hover:bg-rose-50 hover:text-rose-700"
            onClick={() => onDelete(item.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </TableCell>
      )}
    </TableRow>
  );
};
