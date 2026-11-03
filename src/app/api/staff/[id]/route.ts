import { NextRequest, NextResponse } from "next/server";
import { getStore } from "@/lib/store";
import { errorResponse } from "@/lib/http";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const store = getStore();
    await store.deleteStaff(id);
    return NextResponse.json({ ok: true, deleted: id });
  } catch (err) {
    return errorResponse(err);
  }
}
