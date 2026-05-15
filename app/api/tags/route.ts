import { collectionRoute } from "@/lib/server/crud-route";
import { createTag, listTags } from "@/lib/server/data/tags";
import { createTagSchema } from "@/lib/validations/supporting";

export const { GET, POST } = collectionRoute({
  list: (userId) => listTags(userId),
  create: createTag,
  createSchema: createTagSchema,
});
