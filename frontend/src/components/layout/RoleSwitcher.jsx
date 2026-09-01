import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { useUser } from "@/context/UserContext";
import { WORKSHEET } from "@/constants/testIds";

export const RoleSwitcher = () => {
  const { users, currentUser, currentUserId, setCurrentUser, loading } = useUser();
  if (loading || !users.length) return null;

  const grouped = { admin: [], manager: [], member: [] };
  users.forEach((u) => grouped[u.role]?.push(u));

  return (
    <div className="flex items-center gap-2">
      <span className="hidden sm:inline text-xs uppercase tracking-wide text-teal-100/80">Acting as</span>
      <Select value={currentUserId} onValueChange={setCurrentUser}>
        <SelectTrigger
          data-testid={WORKSHEET.roleSwitcher}
          className="h-9 w-[220px] bg-teal-950/40 border-teal-400/30 text-white focus:ring-teal-300"
        >
          <SelectValue placeholder="Select user">
            {currentUser ? `${currentUser.name} · ${currentUser.role}` : "Select user"}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {Object.entries(grouped).map(([role, list]) => (
            list.length > 0 && (
              <div key={role}>
                <div className="px-2 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  {role}
                </div>
                {list.map((u) => (
                  <SelectItem key={u.id} value={u.id} data-testid={`worksheet-role-option-${u.id}`}>
                    {u.name}
                  </SelectItem>
                ))}
              </div>
            )
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};
