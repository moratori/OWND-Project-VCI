import path from "path";
import fs from "fs/promises";
import { IssuerMetadata } from "../oid4vci/types/protocol.types.js";
import { issuerMetadataValidator } from "../oid4vci/types/validator.js";

export const readLocalJsonResource = async (
  dirname: string,
  filename: string,
) => {
  const metadataPath = path.join(dirname, filename);
  const fileContents = await fs.readFile(metadataPath, "utf-8");
  return JSON.parse(fileContents);
};

export const readLocalIssuerMetadata = async (
  dirname: string,
  filename: string,
): Promise<IssuerMetadata> => {
  const rawMetadata = await readLocalJsonResource(dirname, filename);

  return issuerMetadataValidator(rawMetadata);
};

let cachedIssuerMetadata: IssuerMetadata | undefined;

export const getIssuerMetadata = async (
  dirname: string,
  filename: string,
): Promise<IssuerMetadata> => {
  if (!cachedIssuerMetadata) {
    cachedIssuerMetadata = await readLocalIssuerMetadata(dirname, filename);
  }
  return cachedIssuerMetadata;
};
