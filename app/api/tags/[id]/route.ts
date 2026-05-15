import { itemRoute } from "@/lib/server/crud-route";
import { deleteTag, getTag, updateTag } from "@/lib/server/data/tags";
import { updateTagSchema } from "@/lib/validations/supporting";

export const { GET, PATCH, DELETE } = itemRoute({
  get: getTag,
  update: updateTag,
  remove: deleteTag,
  updateSchema: updateTagSchema,
});
