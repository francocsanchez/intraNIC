import type { SftpFileEntry } from "./sftpClient.service";

export type LatestSftpFileSelection = {
  fileName: string;
  remotePath: string;
  modifyTime: number;
  size: number;
};

const DATE_IN_FILENAME_REGEX = /^Patent_Prendas(\d{8})(?:\D.*)?\.csv$/i;

const parseDateFromFileName = (fileName: string) => {
  const match = fileName.match(DATE_IN_FILENAME_REGEX);

  if (!match) {
    return null;
  }

  const rawDate = match[1];
  const year = Number(rawDate.slice(0, 4));
  const month = Number(rawDate.slice(4, 6));
  const day = Number(rawDate.slice(6, 8));
  const parsed = new Date(Date.UTC(year, month - 1, day));

  if (
    Number.isNaN(parsed.getTime())
    || parsed.getUTCFullYear() !== year
    || parsed.getUTCMonth() !== month - 1
    || parsed.getUTCDate() !== day
  ) {
    return null;
  }

  return parsed.getTime();
};

export class SftpFileDiscoveryService {
  static selectLatestByPrefix(
    files: SftpFileEntry[],
    remoteDirectory: string,
    prefix: string,
    buildRemotePath: (remoteDirectory: string, fileName: string) => string,
  ): LatestSftpFileSelection | null {
    const matchingFiles = files.filter(
      (file) => file.type !== "d" && file.name.toLowerCase().startsWith(prefix.toLowerCase()),
    );

    if (!matchingFiles.length) {
      return null;
    }

    const selected = [...matchingFiles].sort((left, right) => {
      const leftDate = parseDateFromFileName(left.name);
      const rightDate = parseDateFromFileName(right.name);

      if (leftDate !== null && rightDate !== null && leftDate !== rightDate) {
        return rightDate - leftDate;
      }

      if (leftDate !== null && rightDate === null) {
        return -1;
      }

      if (leftDate === null && rightDate !== null) {
        return 1;
      }

      if (right.modifyTime !== left.modifyTime) {
        return right.modifyTime - left.modifyTime;
      }

      return right.name.localeCompare(left.name);
    })[0];

    return {
      fileName: selected.name,
      remotePath: buildRemotePath(remoteDirectory, selected.name),
      modifyTime: selected.modifyTime,
      size: selected.size,
    };
  }
}
