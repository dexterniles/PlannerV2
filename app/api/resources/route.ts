import { HttpError } from "@/lib/server/api-response";
import { collectionRoute } from "@/lib/server/crud-route";
import { createResource, listResources } from "@/lib/server/data/resources";
import { createResourceSchema } from "@/lib/validations/supporting";

export const { GET, POST } = collectionRoute({
  list: (userId, request) => {
    const sp = new URL(request.url).searchParams;
    const parentType = sp.get("parentType");
    const parentId = sp.get("parentId");
    if (!parentType || !parentId) {
      throw new HttpError("validation", "parentType and parentId required");
    }
    return listResources(userId, parentType, parentId);
  },
  create: createResource,
  createSchema: createResourceSchema,
});
