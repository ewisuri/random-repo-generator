import { promises as fs } from 'fs';
import { SimpleGit } from 'simple-git/promise';
import { join as joinPath } from 'path';

export abstract class FileOperation {
  constructor(
    protected git: SimpleGit,
    protected directory: string,
  ) {}

  public abstract execute(): Promise<void>;

  protected async chooseFile() {
    const files = (await fs.readdir(this.directory)).filter(f => f != '.git');
    const index = Math.floor(Math.random() * files.length);
    return joinPath(this.directory, files[index]);
  }
}
