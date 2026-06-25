import path from "path";
import SftpClient from "ssh2-sftp-client";

export type SftpFileEntry = {
  name: string;
  type: string;
  size: number;
  modifyTime: number;
  accessTime: number;
};

type SftpConfig = {
  host: string;
  port: number;
  username: string;
  password: string;
  readyTimeout: number;
  connectTimeout: number;
};

const normalizeRemotePath = (remotePath: string) => remotePath.replace(/\\/g, "/").replace(/\/+$/, "") || "/";

export class ReusableSftpClientService {
  private client = new SftpClient();

  constructor(private readonly config: SftpConfig) {}

  async connect() {
    await this.client.connect({
      host: this.config.host,
      port: this.config.port,
      username: this.config.username,
      password: this.config.password,
      readyTimeout: this.config.readyTimeout,
      timeout: this.config.connectTimeout,
    });
  }

  async list(remotePath: string): Promise<SftpFileEntry[]> {
    const normalizedPath = normalizeRemotePath(remotePath);
    const entries = await this.client.list(normalizedPath);

    return entries.map((entry) => ({
      name: entry.name,
      type: entry.type,
      size: entry.size,
      modifyTime: entry.modifyTime,
      accessTime: entry.accessTime,
    }));
  }

  async download(remotePath: string, localPath: string) {
    await this.client.fastGet(remotePath, localPath);
  }

  buildRemoteFilePath(remoteDirectory: string, fileName: string) {
    const normalizedDirectory = normalizeRemotePath(remoteDirectory);
    return normalizedDirectory === "/" ? `/${fileName}` : path.posix.join(normalizedDirectory, fileName);
  }

  async disconnect() {
    if (!this.client) {
      return;
    }

    try {
      await this.client.end();
    } catch (error) {
      console.warn("[patentamientos-import] no se pudo cerrar la conexion SFTP", error);
    }
  }
}
