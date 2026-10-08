import { Bell, CheckCheck } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { listNotifications, markNotificationRead } from "@/lib/community.functions";

export function NotificationsMenu() {
  const qc = useQueryClient();
  const query = useQuery({
    queryKey: ["notifications"],
    queryFn: () => listNotifications(),
    refetchInterval: 60000,
  });
  const unread = (query.data ?? []).filter((n) => !n.read_at).length;
  const mark = useMutation({
    mutationFn: () => markNotificationRead({ data: { all: true } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label="Notificações">
          <Bell className="size-5" />
          {unread > 0 && <span className="absolute right-1 top-1 size-2 rounded-full bg-brand" />}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b border-border p-3">
          <p className="font-semibold">Notificações</p>
          {unread > 0 && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => mark.mutate()}
              aria-label="Marcar todas como lidas"
            >
              <CheckCheck className="size-4" />
            </Button>
          )}
        </div>
        <div className="max-h-80 overflow-y-auto p-2">
          {(query.data ?? []).map((n) => (
            <Link
              key={n.id}
              to={n.link || "/"}
              onClick={() => {
                if (!n.read_at) {
                  void markNotificationRead({ data: { id: n.id } }).then(() =>
                    qc.invalidateQueries({ queryKey: ["notifications"] }),
                  );
                }
              }}
              className={`block rounded-md p-2 hover:bg-accent ${n.read_at ? "" : "bg-accent/40"}`}
            >
              <p className="text-sm font-medium">{n.title}</p>
              <p className="line-clamp-2 text-xs text-muted-foreground">{n.message}</p>
            </Link>
          ))}
          {!query.isLoading && !query.data?.length && (
            <p className="p-4 text-center text-sm text-muted-foreground">
              Nenhuma novidade por enquanto.
            </p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
