export type Track<SourceMetadata = any> = {
  id: number;
  name: string;
  source: {
    name: string;
    meta: SourceMetadata;
  };
};
