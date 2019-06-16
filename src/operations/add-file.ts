import { promises as fs } from 'fs';
import { loremIpsum } from 'lorem-ipsum';
import { basename, join as joinPath } from 'path';

import { FileOperation } from './file';

export class AddFileOperation extends FileOperation {

  async execute() {
    const fname = await this.getNewFileName();
    console.log(`adding file ${basename(fname)}`);
    const paragraphCount = Math.floor(Math.random() * 10) + 1;
    await fs.writeFile(fname, loremIpsum({ count: paragraphCount, units: 'paragraphs' }));
    await this.git.add(fname);
    await this.git.commit(`add file ${basename(fname)}`);
  }

  private async getNewFileName() {
    while (true) {
      const filename = joinPath(this.directory, loremIpsum({ count: 1, units: 'word' }));
      try {
        await fs.access(filename);
      } catch {
        return filename;
      }
    }
  }
}
