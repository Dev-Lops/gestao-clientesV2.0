"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Edit,
  Lightbulb,
  Plus,
  Target,
  Trash2,
  TrendingUp,
  Users,
  X,
} from "lucide-react";
import { useState } from "react";

interface Strategy {
  id: string;
  title: string;
  description?: string;
  type: "objective" | "action-plan" | "target-audience" | "kpi";
  content: string;
  createdAt: Date;
}

interface StrategyManagerProps {
  clientId: string;
  initialStrategies?: Strategy[];
}

export function StrategyManager({
  clientId,
  initialStrategies = [],
}: StrategyManagerProps) {
  const [strategies, setStrategies] = useState<Strategy[]>(initialStrategies);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStrategy, setEditingStrategy] = useState<Strategy | null>(null);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    type: "objective" as Strategy["type"],
    content: "",
  });

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      type: "objective",
      content: "",
    });
    setEditingStrategy(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (editingStrategy) {
      setStrategies((prev) =>
        prev.map((s) =>
          s.id === editingStrategy.id
            ? { ...s, ...formData, createdAt: s.createdAt }
            : s,
        ),
      );
    } else {
      const newStrategy: Strategy = {
        id: Date.now().toString(),
        ...formData,
        createdAt: new Date(),
      };
      setStrategies((prev) => [newStrategy, ...prev]);
    }

    setIsModalOpen(false);
    resetForm();
  };

  const handleEdit = (strategy: Strategy) => {
    setEditingStrategy(strategy);
    setFormData({
      title: strategy.title,
      description: strategy.description || "",
      type: strategy.type,
      content: strategy.content,
    });
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Tem certeza que deseja deletar esta estratégia?")) {
      setStrategies((prev) => prev.filter((s) => s.id !== id));
    }
  };

  const getIconForType = (type: Strategy["type"]) => {
    switch (type) {
      case "objective":
        return <Lightbulb className="h-5 w-5" />;
      case "action-plan":
        return <Target className="h-5 w-5" />;
      case "target-audience":
        return <Users className="h-5 w-5" />;
      case "kpi":
        return <TrendingUp className="h-5 w-5" />;
    }
  };

  const getTitleForType = (type: Strategy["type"]) => {
    switch (type) {
      case "objective":
        return "Objetivos";
      case "action-plan":
        return "Plano de Ação";
      case "target-audience":
        return "Público-Alvo";
      case "kpi":
        return "Indicadores (KPIs)";
    }
  };

  const getStrategiesByType = (type: Strategy["type"]) => {
    return strategies.filter((s) => s.type === type);
  };

  return (
    <>
      <div className="relative bg-linear-to-br from-slate-50 via-blue-50/30 to-slate-100 dark:from-slate-950 dark:via-blue-950/20 dark:to-slate-900">
        {/* Animated background blobs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 -left-4 w-96 h-96 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob" />
          <div className="absolute top-0 -right-4 w-96 h-96 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-2000" />
          <div className="absolute -bottom-8 left-20 w-96 h-96 bg-pink-400 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-4000" />
        </div>

        <div className="relative space-y-6 p-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold text-slate-900 dark:text-white">
                Estratégia
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                Planejamento estratégico e objetivos
              </p>
            </div>
            <Button
              className="gap-2 bg-linear-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0 shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200"
              onClick={() => {
                resetForm();
                setIsModalOpen(true);
              }}
            >
              <Plus className="h-4 w-4" />
              Novo Documento
            </Button>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {(
              [
                "objective",
                "action-plan",
                "target-audience",
                "kpi",
              ] as Strategy["type"][]
            ).map((type) => {
              const typeStrategies = getStrategiesByType(type);
              return (
                <Card key={type}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      {getIconForType(type)}
                      {getTitleForType(type)}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {typeStrategies.length === 0 ? (
                      <div className="text-center py-8 text-slate-500">
                        <p className="text-sm">Nenhum item cadastrado</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {typeStrategies.map((strategy) => (
                          <div
                            key={strategy.id}
                            className="p-4 border rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <h4 className="font-medium text-slate-900 truncate">
                                  {strategy.title}
                                </h4>
                                {strategy.description && (
                                  <p className="text-sm text-slate-600 mt-1">
                                    {strategy.description}
                                  </p>
                                )}
                                <p className="text-sm text-slate-500 mt-2 line-clamp-2">
                                  {strategy.content}
                                </p>
                              </div>
                              <div className="flex gap-1">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleEdit(strategy)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleDelete(strategy.id)}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {isModalOpen && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
            onClick={() => setIsModalOpen(false)}
          >
            <div
              className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-auto m-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-semibold">
                      {editingStrategy
                        ? "Editar Estratégia"
                        : "Nova Estratégia"}
                    </h2>
                    <p className="text-sm text-slate-500 mt-1">
                      Adicione objetivos, planos de ação, definição de
                      público-alvo ou KPIs.
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsModalOpen(false)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="type">Tipo</Label>
                    <Select
                      value={formData.type}
                      onValueChange={(value) =>
                        setFormData({
                          ...formData,
                          type: value as Strategy["type"],
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="objective">Objetivo</SelectItem>
                        <SelectItem value="action-plan">
                          Plano de Ação
                        </SelectItem>
                        <SelectItem value="target-audience">
                          Público-Alvo
                        </SelectItem>
                        <SelectItem value="kpi">KPI</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="title">Título</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) =>
                        setFormData({ ...formData, title: e.target.value })
                      }
                      required
                      placeholder="Ex: Aumentar engagement em 50%"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Descrição (opcional)</Label>
                    <Input
                      id="description"
                      value={formData.description}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          description: e.target.value,
                        })
                      }
                      placeholder="Breve descrição"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="content">Conteúdo Detalhado</Label>
                    <Textarea
                      id="content"
                      value={formData.content}
                      onChange={(e) =>
                        setFormData({ ...formData, content: e.target.value })
                      }
                      required
                      rows={6}
                      placeholder="Descreva em detalhes a estratégia, métricas, prazos, etc."
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsModalOpen(false)}
                    >
                      Cancelar
                    </Button>
                    <Button
                      type="submit"
                      className="bg-linear-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0"
                    >
                      {editingStrategy ? "Atualizar" : "Criar"}
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
