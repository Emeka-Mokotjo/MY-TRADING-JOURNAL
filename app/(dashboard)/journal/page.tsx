"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/utils/supabase/client";
import { useAuth } from "@/components/auth-provider";
import { Edit2, Trash2, X, Search } from "lucide-react";
import toast from "react-hot-toast";
import { format, startOfWeek, endOfWeek, isWithinInterval, isSameMonth } from "date-fns";

const FILTERS = [
  { id: "all", label: "All Entries" },
  { id: "today", label: "Today" },
  { id: "this_week", label: "This Week" },
  { id: "this_month", label: "This Month" },
];

const SORT_OPTIONS = [
  { id: "newest", label: "Newest first" },
  { id: "oldest", label: "Oldest first" },
];

export default function JournalPage() {
  const { user } = useAuth();
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [journals, setJournals] = useState<any[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingDate, setEditingDate] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [viewingEntry, setViewingEntry] = useState<any | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState("newest");

  const todayStr = new Date().toISOString().split('T')[0];

  const fetchJournals = useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('journals')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: false });

    if (error) {
      console.error("Failed to fetch journals", error);
      toast.error("Unable to load journal history");
      setLoading(false);
      return;
    }

    if (data) {
      setJournals(data);
      const todayEntry = data.find(j => j.date === todayStr);
      if (!editingId) {
        setContent(todayEntry?.content || "");
      }
    }
    setLoading(false);
  }, [user, editingId, todayStr]);

  useEffect(() => {
    fetchJournals();
  }, [fetchJournals]);

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('journal-history')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'journals',
        filter: `user_id=eq.${user.id}`,
      }, () => {
        fetchJournals();
      })
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [fetchJournals, user]);

  const todayEntry = useMemo(
    () => journals.find((journal) => journal.date === todayStr),
    [journals, todayStr]
  );

  const resetEditor = () => {
    setEditingId(null);
    setEditingDate(null);
    setContent(todayEntry?.content || "");
  };

  const handleSaveEntry = async () => {
    if (!user) return;
    if (!content.trim()) {
      toast.error("Journal cannot be empty");
      return;
    }

    setSaving(true);

    if (editingId) {
      const { error } = await supabase
        .from('journals')
        .update({ content })
        .eq('id', editingId)
        .eq('user_id', user.id);

      if (error) {
        toast.error("Failed to update journal");
      } else {
        toast.success("Journal updated");
        setEditingId(null);
        setEditingDate(null);
      }
    } else {
      const { error } = await supabase
        .from('journals')
        .upsert({
          user_id: user.id,
          date: todayStr,
          content,
        }, { onConflict: 'user_id,date' });

      if (error) {
        toast.error(error.message);
      } else {
        toast.success("Journal entry saved");
      }
    }

    await fetchJournals();
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!user) return;

    const { error } = await supabase
      .from('journals')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      toast.error("Failed to delete journal");
    } else {
      toast.success("Journal deleted");
      setDeletingId(null);
      if (editingId === id) {
        resetEditor();
      }
      await fetchJournals();
    }
  };

  const handleEditEntry = (journal: any) => {
    setEditingId(journal.id);
    setEditingDate(journal.date);
    setContent(journal.content);
  };

  const handleViewEntry = (journal: any) => {
    setViewingEntry(journal);
  };

  const filteredJournals = useMemo(() => {
    const lowerQuery = searchQuery.toLowerCase();
    const now = new Date();
    const weekStart = startOfWeek(now, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(now, { weekStartsOn: 1 });

    return journals
      .filter((journal) => {
        const matchesSearch =
          journal.content.toLowerCase().includes(lowerQuery) ||
          journal.date.includes(lowerQuery);

        if (!matchesSearch) return false;

        if (selectedFilter === 'today') {
          return journal.date === todayStr;
        }

        if (selectedFilter === 'this_week') {
          return isWithinInterval(new Date(journal.date), { start: weekStart, end: weekEnd });
        }

        if (selectedFilter === 'this_month') {
          return isSameMonth(new Date(journal.date), now);
        }

        return true;
      })
      .sort((a, b) => {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();

        if (sortOrder === 'oldest') {
          return dateA - dateB;
        }
        return dateB - dateA;
      });
  }, [journals, searchQuery, selectedFilter, sortOrder, todayStr]);

  if (loading) {
    return <div className="p-8 text-gray-400">Loading journal...</div>;
  }

  return (
    <div className="space-y-10 pb-12">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Trading Journal</h1>
          <p className="text-gray-400 mt-2">Track your emotions, mindset, and daily trading reflections.</p>
        </div>
        <div className="rounded-3xl border border-border bg-card/80 px-5 py-4 text-right shadow-sm">
          <p className="text-sm text-gray-400">Today</p>
          <p className="text-lg font-semibold text-primary">{format(new Date(), 'EEEE, MMM d')}</p>
        </div>
      </div>

      <Card className="min-h-[420px] flex flex-col overflow-hidden border border-border bg-card/80 shadow-xl">
        <CardHeader>
          <CardTitle>Journal Entry</CardTitle>
          <CardDescription>Capture your daily reflection, emotional triggers, and trading discipline.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {editingId && (
            <div className="rounded-2xl border border-blue-500/20 bg-blue-500/10 px-4 py-3 text-sm text-blue-200">
              Editing entry from <span className="font-semibold text-white">{format(new Date(editingDate || todayStr), 'MMMM do, yyyy')}</span>. Save to update it.
            </div>
          )}
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="min-h-[280px] w-full resize-none rounded-3xl border border-border bg-background/90 p-5 text-sm leading-6 text-foreground shadow-inner shadow-black/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50"
            placeholder="Start your trading reflection..."
          />
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center">
            <div className="text-sm text-gray-400">Your journal content is stored securely and updates instantly.</div>
            <div className="flex flex-wrap gap-3">
              <Button variant="outline" onClick={resetEditor} disabled={saving}>
                Clear
              </Button>
              <Button size="lg" onClick={handleSaveEntry} disabled={saving}>
                {saving ? 'Saving...' : editingId ? 'Save Changes' : "Save Today's Entry"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <section className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font-bold text-foreground">Journal History</h2>
            <p className="text-gray-400">Review previous trading reflections and emotional patterns.</p>
          </div>
          <div className="grid w-full gap-3 sm:grid-cols-2 md:w-auto md:grid-cols-3">
            <div className="relative rounded-2xl border border-border bg-background/70 px-4 py-3 focus-within:ring-2 focus-within:ring-blue-500/40">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search journal content"
                className="w-full border-none bg-transparent pl-10 text-sm text-foreground outline-none placeholder:text-gray-500"
              />
            </div>
            <select
              value={selectedFilter}
              onChange={(e) => setSelectedFilter(e.target.value)}
              className="rounded-2xl border border-border bg-background/70 px-4 py-3 text-sm text-foreground outline-none"
            >
              {FILTERS.map((filter) => (
                <option key={filter.id} value={filter.id}>{filter.label}</option>
              ))}
            </select>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="rounded-2xl border border-border bg-background/70 px-4 py-3 text-sm text-foreground outline-none"
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.id} value={option.id}>{option.label}</option>
              ))}
            </select>
          </div>
        </div>

        {journals.length === 0 ? (
          <Card className="border border-border bg-card/80 p-10 text-center text-gray-400">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-white/5 text-2xl text-blue-300">
              📝
            </div>
            <p className="text-lg font-semibold text-foreground">No journal entries yet.</p>
            <p className="mt-2 text-sm text-gray-500">Your reflections and trading thoughts will appear here.</p>
          </Card>
        ) : filteredJournals.length === 0 ? (
          <Card className="border border-border bg-card/80 p-10 text-center text-gray-400">
            <p className="text-lg font-semibold text-foreground">No matching entries found.</p>
            <p className="mt-2 text-sm text-gray-500">Try adjusting your search or filters.</p>
          </Card>
        ) : (
          <div className="grid gap-4 xl:grid-cols-2">
            {filteredJournals.map((journal) => (
              <Card key={journal.id} className="border border-border bg-card/80 transition hover:-translate-y-0.5 hover:shadow-xl">
                <CardContent className="space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm text-gray-400">{format(new Date(journal.date), 'MMMM do, yyyy')}</p>
                      <h3 className="mt-2 text-lg font-semibold text-foreground">{journal.content.slice(0, 120) || 'Untitled entry'}</h3>
                    </div>
                    <span className="rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-xs text-blue-200">
                      {format(new Date(journal.created_at), 'PP')}
                    </span>
                  </div>
                  <p className="text-sm leading-6 text-gray-400 line-clamp-3 whitespace-pre-wrap">{journal.content}</p>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleViewEntry(journal)}>
                        View Full Entry
                      </Button>
                      <Button variant="secondary" size="sm" onClick={() => handleEditEntry(journal)}>
                        Edit
                      </Button>
                    </div>
                    <Button variant="destructive" size="sm" onClick={() => setDeletingId(journal.id)}>
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      {viewingEntry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4 backdrop-blur-sm">
          <Card className="w-full max-w-3xl overflow-hidden border border-border bg-card/90 shadow-2xl">
            <CardHeader className="flex items-start justify-between gap-4 p-6">
              <div>
                <CardTitle>Journal Entry</CardTitle>
                <CardDescription>{format(new Date(viewingEntry.date), 'MMMM do, yyyy')}</CardDescription>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setViewingEntry(null)}>
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-6 border-t border-border p-6">
              <div className="rounded-3xl border border-border bg-background/70 p-6 text-sm leading-7 text-gray-200 whitespace-pre-wrap">
                {viewingEntry.content}
              </div>
              <div className="flex flex-col gap-1 text-xs text-gray-400">
                <span>Created: {format(new Date(viewingEntry.created_at), 'PP p')}</span>
                <span>Journal date: {format(new Date(viewingEntry.date), 'PP')}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {deletingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4 backdrop-blur-sm">
          <Card className="w-full max-w-sm border border-border bg-card/90 shadow-2xl">
            <CardHeader>
              <CardTitle>Delete Journal</CardTitle>
              <CardDescription>Are you sure you want to delete this journal entry?</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 p-6">
              <div className="text-sm text-gray-300">This will remove the entry permanently from your history.</div>
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => setDeletingId(null)}>
                  Cancel
                </Button>
                <Button variant="destructive" className="flex-1" onClick={() => handleDelete(deletingId)}>
                  Delete Entry
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
