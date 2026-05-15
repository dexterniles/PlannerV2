import { and, desc, eq } from "drizzle-orm";

import { db } from "@/lib/db/client";
import { notes } from "@/lib/db/schema";
import { HttpError } from "@/lib/server/api-response";
import type {
  CreateNoteInput,
  UpdateNoteInput,
} from "@/lib/validations/notes";

const dateStr = (d: Date | null | undefined) =>
  d == null ? null : d.toISOString().slice(0, 10);

const cols = {
  id: notes.id,
  parentType: notes.parentType,
  parentId: notes.parentId,
  title: notes.title,
  content: notes.content,
  sessionDate: notes.sessionDate,
  createdAt: notes.createdAt,
  updatedAt: notes.updatedAt,
};

export async function listNotes(userId: string, standaloneOnly = false) {
  const conds = [eq(notes.userId, userId)];
  if (standaloneOnly) conds.push(eq(notes.parentType, "standalone"));
  return db
    .select(cols)
    .from(notes)
    .where(and(...conds))
    .orderBy(desc(notes.updatedAt));
}

export async function getNote(userId: string, id: string) {
  const [row] = await db
    .select(cols)
    .from(notes)
    .where(and(eq(notes.id, id), eq(notes.userId, userId)))
    .limit(1);
  if (!row) throw new HttpError("not_found", "Note not found");
  return row;
}

export async function createNote(userId: string, input: CreateNoteInput) {
  const [row] = await db
    .insert(notes)
    .values({
      userId,
      parentType: input.parentType,
      parentId: input.parentId ?? userId,
      title: input.title ?? null,
      content: input.content,
      sessionDate: dateStr(input.sessionDate),
    })
    .returning(cols);
  return row;
}

export async function updateNote(
  userId: string,
  id: string,
  input: UpdateNoteInput,
) {
  await getNote(userId, id);
  const { sessionDate, ...rest } = input;
  const [row] = await db
    .update(notes)
    .set({
      ...rest,
      ...(sessionDate !== undefined
        ? { sessionDate: dateStr(sessionDate) }
        : {}),
      updatedAt: new Date(),
    })
    .where(and(eq(notes.id, id), eq(notes.userId, userId)))
    .returning(cols);
  return row;
}

export async function deleteNote(userId: string, id: string) {
  await getNote(userId, id);
  await db.delete(notes).where(and(eq(notes.id, id), eq(notes.userId, userId)));
}
