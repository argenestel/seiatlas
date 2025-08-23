import { NextRequest, NextResponse } from "next/server";
import solc from "solc";
import path from "path";
import fs from "fs";

export async function POST(req: NextRequest) {
  const { code, filename } = await req.json();

  const input = {
    language: "Solidity",
    sources: {
      [filename || "contract.sol"]: {
        content: code,
      },
    },
    settings: {
      outputSelection: {
        "*": {
          "*": ["*"],
        },
      },
    },
  };

  const findImports = (importPath: string) => {
    try {
      // Support relative imports (inline) and node_modules (OpenZeppelin)
      if (importPath.startsWith(".")) {
        return { contents: "" }; // no filesystem for user code yet
      }
      const resolved = path.join(process.cwd(), "node_modules", importPath);
      if (fs.existsSync(resolved)) {
        const contents = fs.readFileSync(resolved, "utf8");
        return { contents };
      }
      // Try with .sol default
      if (fs.existsSync(resolved + ".sol")) {
        const contents = fs.readFileSync(resolved + ".sol", "utf8");
        return { contents };
      }
      return { error: `File not found: ${importPath}` };
    } catch (e: any) {
      return { error: String(e?.message || e) };
    }
  };

  const output = JSON.parse(solc.compile(JSON.stringify(input), { import: findImports }));

  if (output.errors && output.errors.some((e: any) => e.severity === "error")) {
    return NextResponse.json({ errors: output.errors }, { status: 400 });
  }

  const sourceKey = filename || "contract.sol";
  const contractName = Object.keys(output.contracts[sourceKey])[0];
  const contract = output.contracts[sourceKey][contractName];

  return NextResponse.json({
    abi: contract.abi,
    bytecode: contract.evm.bytecode.object,
  });
}
