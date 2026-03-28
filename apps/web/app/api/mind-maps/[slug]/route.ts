import { NextResponse } from "next/server";
import constitutionalOab from "../../../../../../docs/mind-maps/oab-direito-constitucional.json";

const mindMaps = {
  "oab-direito-constitucional": constitutionalOab
} as const;

export async function GET(_request: Request, context: { params: Promise<{ slug: string }> }) {
  const { slug } = await context.params;
  const map = mindMaps[slug as keyof typeof mindMaps];

  if (!map) {
    return NextResponse.json({ message: "Mapa mental não encontrado." }, { status: 404 });
  }

  return NextResponse.json(map, {
    headers: {
      "Cache-Control": "public, max-age=300"
    }
  });
}
