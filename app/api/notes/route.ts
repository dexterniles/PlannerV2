import { collectionRoute } from "@/lib/server/crud-route";
import { createNote, listNotes } from "@/lib/server/data/notes";
import { createNoteSchema } from "@/lib/validations/notes";

export const { GET, POST } = collectionRoute({
  list: (userId, request) => {
    const standalone =
      new URL(request.url).searchParams.get("standalone") === "1";
    return listNotes(userId, standalone);
  },
  create: createNote,
  createSchema: createNoteSchema,
});
