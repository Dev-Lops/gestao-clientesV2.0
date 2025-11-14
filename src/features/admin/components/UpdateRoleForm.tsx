"use client";

import { updateMemberRoleAction } from "@/app/(app)/admin/members/actions";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { toast } from "sonner";

interface UpdateRoleFormProps {
  memberId: string;
  currentRole: string;
  onSuccess?: () => void;
}

export function UpdateRoleForm({
  memberId,
  currentRole,
  onSuccess,
}: UpdateRoleFormProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [selectedRole, setSelectedRole] = useState(currentRole);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (selectedRole === currentRole) {
      toast.info("Nenhuma mudança detectada");
      return;
    }

    setIsUpdating(true);
    try {
      const formData = new FormData();
      formData.append("member_id", memberId);
      formData.append("role", selectedRole);

      await updateMemberRoleAction(formData);
      toast.success("Papel atualizado com sucesso!");

      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erro ao atualizar papel",
      );
      // Reverte a seleção em caso de erro
      setSelectedRole(currentRole);
    } finally {
      setIsUpdating(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2">
      <Select
        value={selectedRole}
        onValueChange={setSelectedRole}
        disabled={isUpdating}
      >
        <SelectTrigger
          className={cn(
            "h-10 min-w-[130px] rounded-full bg-white shadow-sm",
            "disabled:opacity-50 disabled:cursor-not-allowed",
          )}
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="OWNER">Proprietário</SelectItem>
          <SelectItem value="STAFF">Equipe</SelectItem>
          <SelectItem value="CLIENT">Cliente</SelectItem>
        </SelectContent>
      </Select>
      <Button
        type="submit"
        size="sm"
        variant="outline"
        disabled={isUpdating || selectedRole === currentRole}
        className="rounded-full border-slate-300 hover:bg-slate-100 transition-all"
      >
        {isUpdating ? "Atualizando..." : "Atualizar"}
      </Button>
    </form>
  );
}
