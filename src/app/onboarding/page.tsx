"use client";

import { db, firebaseApp } from "@/lib/firebase";
import { getAuth } from "firebase/auth";
import {
  addDoc,
  collection,
  doc,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { useRouter } from "next/navigation";
import { useState } from "react";

// Usa inicialização centralizada de Firebase do módulo lib/firebase
// Evita duplicação e possíveis diferenças de env

export default function OnboardingPage() {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleCreate = async () => {
    if (!name.trim()) return;

    setLoading(true);
    try {
      if (!firebaseApp || !db)
        throw new Error("Firebase não inicializado corretamente");
      const auth = getAuth(firebaseApp);
      const user = auth.currentUser;
      if (!user) throw new Error("Usuário não autenticado.");

      // Cria nova organização
      const orgRef = await addDoc(collection(db, "orgs"), {
        name,
        ownerId: user.uid,
        members: [user.uid],
        createdAt: serverTimestamp(),
      });

      // Atualiza o usuário com o orgId
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, {
        orgId: orgRef.id,
        role: "OWNER",
        updatedAt: serverTimestamp(),
      });

      router.push("/");
    } catch (err) {
      console.error("Erro ao criar organização:", err);
      alert("Erro ao criar organização. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center h-screen bg-linear-to-br from-purple-100 to-purple-300">
      <div className="bg-white rounded-xl shadow-lg p-10 w-[450px]">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">
          Crie sua primeira Organização
        </h1>
        <p className="text-gray-500 mb-6">
          Dê um nome à sua agência, estúdio ou marca para começar.
        </p>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ex: Agência Estelar"
          className="w-full border rounded-lg px-4 py-2 mb-4 focus:ring-2 focus:ring-purple-500 outline-none"
        />
        <button
          onClick={handleCreate}
          disabled={loading}
          className="w-full bg-purple-600 hover:bg-purple-700 text-white rounded-lg py-2 font-semibold transition-all"
        >
          {loading ? "Criando..." : "Criar Organização"}
        </button>
      </div>
    </div>
  );
}
