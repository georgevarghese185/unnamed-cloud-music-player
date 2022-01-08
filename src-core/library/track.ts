export type Identifier = {
  name: string;
  value: string;
};

export type Track<SourceMetadata = any> = {
  id: number;
  name: string;
  identifiers: Identifier[];
  source: {
    name: string;
    meta: SourceMetadata;
  };
};
