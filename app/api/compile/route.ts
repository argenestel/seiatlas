import { NextRequest, NextResponse } from "next/server";
import solc from "solc";

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

  const output = JSON.parse(solc.compile(JSON.stringify(input)));

  if (output.errors) {
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
