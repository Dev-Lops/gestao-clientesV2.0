"use client";

import { deleteMemberAction } from "@/app/(app)/admin/members/actions";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface DeleteMemberButtonProps {
  memberId: string;
  displayName: string;
  onSuccess?: () => void;
}

export function DeleteMemberButton({
  memberId,
  displayName,
  onSuccess,
}: DeleteMemberButtonProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  async function handleDelete() {
    setIsDeleting(true);
    try {
      const formData = new FormData();
      formData.append("member_id", memberId);
      await deleteMemberAction(formData);
      toast.success(`${displayName} foi removido com sucesso`);
      setShowConfirm(false);

      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erro ao remover membro",
      );
    } finally {
      setIsDeleting(false);
    }
  }

  if (showConfirm) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs text-red-600 font-medium">Confirmar?</span>
        <Button
          size="sm"
          variant="destructive"
          onClick={handleDelete}
          disabled={isDeleting}
          className="rounded-full"
        >
          {isDeleting ? "Removendo..." : "Sim"}
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setShowConfirm(false)}
          disabled={isDeleting}
          className="rounded-full"
        >
          Não
        </Button>
      </div>
    );
  }

  return (
    <Button
      size="sm"
      variant="destructive"
      onClick={() => setShowConfirm(true)}
      className="rounded-full"
    >
      <Trash2 className="h-4 w-4" />
    </Button>
  );
}
