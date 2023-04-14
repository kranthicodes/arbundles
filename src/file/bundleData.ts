import { file } from "tmp-promise";
import { longTo32ByteArray } from "../utils.js";
import type { Signer } from "../signing/index.js";
import FileBundle from "./FileBundle.js";
import type FileDataItem from "./FileDataItem.js";
import { createWriteStream } from "fs";

export async function bundleAndSignData(dataItems: FileDataItem[], signer: Signer, dir?: string): Promise<FileBundle> {
  const headerFile = await file({ dir });
  const headerStream = createWriteStream(headerFile.path);
  const files = new Array(dataItems.length);

  headerStream.write(longTo32ByteArray(dataItems.length));
  for (const [index, item] of dataItems.entries()) {
    const dataItem = item as FileDataItem;
    if (!dataItem.isSigned()) {
      await dataItem.sign(signer);
    }

    files[index] = dataItem.filename;
    headerStream.write(Buffer.concat([longTo32ByteArray(await dataItem.size()), dataItem.rawId]));
  }

  await new Promise((resolve) => headerStream.end(resolve));

  headerStream.close();

  return new FileBundle(headerFile.path, files);
}
