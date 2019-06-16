export interface FileOperation {
  execute(): Promise<void>;
}

export { AddFileOperation } from './add-file';
export { EditFileOperation } from './edit-file';
export { RemoveFileOperation } from './remove-file';
