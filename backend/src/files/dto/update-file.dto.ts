export class File {
  id: number;
  fileName: string;
  fileExtension: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

export class ConvertedFile {
  id: number;
  fileId: number;
  fileName: string;
  createdAt: Date;
}
