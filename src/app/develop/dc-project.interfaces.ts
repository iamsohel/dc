import {
  IAsset,
  TObjectId,
} from '../core/interfaces/common.interface';

export interface IDCProject extends IAsset {
  packageName?: string;
  packageVersion?: string;
}

export interface IDCProjectUpdate {
  name: string;
  description?: string;
}

export interface IDCProjectCreate {
  name: string;
  description?: string;
}

export interface IDCProjectFile {
  type: IDCProjectFile.Type;
  name: string;
  modified: string; //datetime
}

export namespace IDCProjectFile {
  export enum Type {
    FILE = 'FILE',
    DIR = 'DIR',
  }

  export interface Content {
    content: string;
    contentType: string;
    lastModified: string; //datetime
  }
}

export namespace IDCProject {
  export enum Status {
    IDLE = 'IDLE',
    BUILDING = 'BUILDING',
    INTERACTIVE = 'INTERACTIVE',
  }
}

export interface IDCProjectSession {
  id: string;
  authToken: string;
  dcProjectId: TObjectId;
  created: string;
  url: string;
}

export interface IDCProjectSessionCreate {
  useGPU: boolean;
}

export namespace IDCProjectSession {
  export enum Status {
    RUNNING = 'RUNNING',
    COMPLETED = 'COMPLETED',
    QUEUED = 'QUEUED',
    SUBMITTED = 'SUBMITTED',
    FAILED = 'FAILED',
  }
}

export interface IOpenedDCProjectFile {
  file: IDCProjectFile;
  content: string;
  editorMode: string;
  isEditing: boolean;
  hasChanges: boolean;
}
