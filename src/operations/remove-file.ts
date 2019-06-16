import { basename } from 'path';

import { FileOperation } from './file';

export class RemoveFileOperation extends FileOperation {
  async execute() {
    const file = await this.chooseFile();
    console.log(`removing file ${basename(file)}`);
    await this.git.rm(file);
    await this.git.commit(`remove file ${basename(file)}`);
  }
}
