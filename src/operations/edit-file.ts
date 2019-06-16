import { promises as fs } from 'fs';
import { loremIpsum } from 'lorem-ipsum';
import { basename } from 'path';

import { FileOperation } from './file';

interface Block {
  start: number;
  end: number;
}

export class EditFileOperation extends FileOperation {
  async execute() {
    const file = await this.chooseFile();
    console.log(`editing file '${basename(file)}'`);
    let lines = (await fs.readFile(file)).toString().split(/\r?\n/);
    const blocks = this.getBlocks(lines.length);
    this.editBlocks(lines, blocks);
    await fs.writeFile(file, lines.join('\n'));
    await this.git.add(file);
    await this.git.commit(`edit file ${basename(file)}`);
  }

  private editBlocks(lines: string[], blocks: Block[]) {
    blocks.forEach(block => {
      for (let i = block.start; i < block.end; i++) {
        lines[i] = loremIpsum({ count: 1, units: 'sentence' });
      }
    });
  }

  private getBlocks(lineCount: number) {
    const blocks: Block[] = [];

    do {
      const start = Math.floor(Math.random() * lineCount);
      const end = start + Math.floor(Math.random() * lineCount - start);
      blocks.push({ start, end });
    } while (blocks[blocks.length-1].end + 1 < lineCount);

    return blocks;
  }
}
