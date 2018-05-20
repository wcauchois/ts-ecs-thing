/// <reference types="node" />

import {Stats} from 'fs';

declare module 'fs/promises' {
  export interface FileHandle {
    stat(): Promise<Stats>;
    readFile(options: {encoding: string}): string;
  }

  /**
   * Open a file, returning a FileHandle.
   * @param path Path to the file to open
   * @param mode File mode
   */
  export function open(path: string, mode: string): Promise<FileHandle>;
}

