"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { ArrowLeft, FloppyDisk, Trash } from "@phosphor-icons/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useAuth } from "@/components/FirebaseAuthProvider";

export default function EditGroupPage() {
  const { isSignedIn, isLoaded, user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const groupId = searchParams.get("groupId") as string;

  const group = useQuery(
    api.groups.getGroupById,
    groupId ? { id: groupId as Id<"groups"> } : "skip"
  );

  const updateGroup = useMutation(api.groups.updateGroup);
  const deleteGroup = useMutation(api.groups.deleteGroup);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (group) {
      setName(group.name);
      setDescription(group.description || "");
    }
  }, [group]);

  // Redirect to home page if user is not signed in
  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.replace("/");
    }
  }, [isLoaded, isSignedIn, router]);

  const handleSave = async () => {
    if (!groupId || !name.trim()) return;

    setIsSubmitting(true);
    try {
      await updateGroup({
        id: groupId as Id<"groups">,
        name: name.trim(),
        description: description.trim() || undefined,
      });
      router.back();
    } catch (error) {
      console.error("Failed to update group:", error);
      alert("Grup guncellenirken bir hata olustu.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!groupId || !confirm("Bu grubu silmek istediginizden emin misiniz? Bu islem geri alinamaz.")) return;

    setIsSubmitting(true);
    try {
      await deleteGroup({ id: groupId as Id<"groups"> });
      router.push("/contacts"); // Or wherever the groups list is
    } catch (error) {
      console.error("Failed to delete group:", error);
      alert("Grup silinirken bir hata olustu.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isLoaded || (isLoaded && !isSignedIn) || group === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
        <div className="text-center">
          <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)] p-4">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <ArrowLeft size={24} className="text-gray-800 dark:text-gray-200" />
          </button>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
            Grubu Duzenle
          </h1>
        </div>

        {/* Form */}
        <div className="space-y-4 bg-white dark:bg-[var(--card-background)] p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Grup Adi
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              placeholder="Grup adi girin"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Aciklama (Opsiyonel)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all resize-none h-24"
              placeholder="Grup hakkinda kisa bir aciklama..."
            />
          </div>

          <div className="pt-4 flex gap-3">
            <button
              onClick={handleDelete}
              disabled={isSubmitting}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 font-medium hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors disabled:opacity-50"
            >
              <Trash size={20} />
              Sil
            </button>
            <button
              onClick={handleSave}
              disabled={isSubmitting || !name.trim()}
              className="flex-[2] flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 shadow-lg shadow-blue-500/30"
            >
              <FloppyDisk size={20} />
              {isSubmitting ? "Kaydediliyor..." : "Kaydet"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
