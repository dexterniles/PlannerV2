import { itemRoute } from "@/lib/server/crud-route";
import { deleteNote, getNote, updateNote } from "@/lib/server/data/notes";
import { updateNoteSchema } from "@/lib/validations/notes";

export const { GET, PATCH, DELETE } = itemRoute({
  get: getNote,
  update: updateNote,
  remove: deleteNote,
  updateSchema: updateNoteSchema,
});
