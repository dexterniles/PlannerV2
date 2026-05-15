import { and, eq } from "drizzle-orm";

import { assertOwns, type OwnableKind } from "@/lib/auth/ownership";
import { db } from "@/lib/db/client";
import { taggings } from "@/lib/db/schema";
import type { AttachTaggingInput } from "@/lib/validations/supporting";

export async function attachTagging(
  userId: string,
  input: AttachTaggingInput,
) {
  await assertOwns(userId, "tag", input.tagId);
  await assertOwns(userId, input.taggableType as OwnableKind, input.taggableId);

  const [row] = await db
    .insert(taggings)
    .values({
      tagId: input.tagId,
      taggableType: input.taggableType,
      taggableId: input.taggableId,
    })
    .onConflictDoNothing()
    .returning();
  return row ?? { ok: true };
}

export async function detachTagging(
  userId: string,
  input: AttachTaggingInput,
) {
  await assertOwns(userId, "tag", input.tagId);
  await db
    .delete(taggings)
    .where(
      and(
        eq(taggings.tagId, input.tagId),
        eq(taggings.taggableType, input.taggableType),
        eq(taggings.taggableId, input.taggableId),
      ),
    );
  return { ok: true };
}
