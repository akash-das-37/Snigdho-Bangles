import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import { BangleDesign } from "@/types";

function updateDesignInFile(fileContent: string, item: BangleDesign): string {
  const escapedId = item.id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const blockRegex = new RegExp(`(\\{\\s*id:\\s*["']${escapedId}["'][\\s\\S]*?\\n\\s*\\},?)`, "m");

  const match = fileContent.match(blockRegex);
  if (!match) {
    const serialized =
      JSON.stringify(item, null, 4)
        .split("\n")
        .map((line) => "  " + line)
        .join("\n") + ",\n";

    if (fileContent.includes("INITIAL_BANGLE_DESIGNS: BangleDesign[] = [")) {
      return fileContent.replace(
        "INITIAL_BANGLE_DESIGNS: BangleDesign[] = [",
        `INITIAL_BANGLE_DESIGNS: BangleDesign[] = [\n${serialized}`
      );
    }
    if (fileContent.includes("const bangleDesigns = [")) {
      return fileContent.replace(
        "const bangleDesigns = [",
        `const bangleDesigns = [\n${serialized}`
      );
    }
    return fileContent;
  }

  let block = match[1];

  if (typeof item.price === "number") {
    block = block.replace(/price:\s*\d+(\.\d+)?/, `price: ${item.price}`);
  }
  if (item.name) {
    block = block.replace(/name:\s*["'][^"']*["']/, `name: ${JSON.stringify(item.name)}`);
  }
  if (item.category) {
    block = block.replace(/category:\s*["'][^"']*["']/, `category: ${JSON.stringify(item.category)}`);
  }
  if (item.description) {
    block = block.replace(
      /description:\s*["'][^"']*["']/,
      `description: ${JSON.stringify(item.description)}`
    );
  }
  if (typeof item.inStock === "boolean") {
    block = block.replace(/inStock:\s*(true|false)/, `inStock: ${item.inStock}`);
  }
  if (item.material) {
    block = block.replace(/material:\s*["'][^"']*["']/, `material: ${JSON.stringify(item.material)}`);
  }
  if (item.packCount) {
    block = block.replace(
      /packCount:\s*["'][^"']*["']/,
      `packCount: ${JSON.stringify(item.packCount)}`
    );
  }
  if (item.dispatchTime) {
    block = block.replace(
      /dispatchTime:\s*["'][^"']*["']/,
      `dispatchTime: ${JSON.stringify(item.dispatchTime)}`
    );
  }
  if (item.image) {
    block = block.replace(/image:\s*["'][^"']*["']/, () => `image: ${JSON.stringify(item.image)}`);
  }
  if (Array.isArray(item.sizes) && item.sizes.length > 0) {
    block = block.replace(
      /sizes:\s*\[[^\]]*\]/,
      () => `sizes: ${JSON.stringify(item.sizes)}`
    );
  }

  return fileContent.replace(match[1], block);
}

function deleteDesignFromFile(fileContent: string, itemId: string): string {
  const escapedId = itemId.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const blockRegex = new RegExp(`\\s*\\{\\s*id:\\s*["']${escapedId}["'][\\s\\S]*?\\n\\s*\\},?`, "m");
  return fileContent.replace(blockRegex, "");
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, item, itemId } = body as {
      action: "update" | "add" | "delete";
      item?: BangleDesign;
      itemId?: string;
    };

    const targetId = item?.id || itemId;
    if (!targetId && action !== "add") {
      return NextResponse.json({ success: false, message: "Missing design ID" }, { status: 400 });
    }

    const banglesTsPath = path.join(process.cwd(), "src", "data", "bangles.ts");
    const seedScriptPath = path.join(process.cwd(), "scripts", "seed-firestore.mjs");

    const updatedFiles: string[] = [];

    try {
      let banglesContent = await fs.readFile(banglesTsPath, "utf-8");
      if (action === "delete" && targetId) {
        banglesContent = deleteDesignFromFile(banglesContent, targetId);
      } else if (item) {
        banglesContent = updateDesignInFile(banglesContent, item);
      }
      await fs.writeFile(banglesTsPath, banglesContent, "utf-8");
      updatedFiles.push("src/data/bangles.ts");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn("Could not update src/data/bangles.ts directly:", msg);
    }

    try {
      let seedContent = await fs.readFile(seedScriptPath, "utf-8");
      if (action === "delete" && targetId) {
        seedContent = deleteDesignFromFile(seedContent, targetId);
      } else if (item) {
        seedContent = updateDesignInFile(seedContent, item);
      }
      await fs.writeFile(seedScriptPath, seedContent, "utf-8");
      updatedFiles.push("scripts/seed-firestore.mjs");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn("Could not update scripts/seed-firestore.mjs directly:", msg);
    }

    return NextResponse.json({
      success: true,
      message: `Catalog files updated successfully! (${updatedFiles.join(", ") || "Cloud storage mode"})`,
      updatedFiles,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to update catalog files";
    console.error("Error in catalog update API route:", error);
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}
