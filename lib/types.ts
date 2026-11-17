export type User = {
  id: string;
  name: string;
  email: string;
};

export type DocumentListItem = {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
};

export type DocumentRecord = DocumentListItem & {
  owner_id: string;
  content: unknown;
};

export type SharePerson = {
  id: string;
  name: string;
  email: string;
};

export type HomeDocument = DocumentListItem & {
  kind: "owned" | "shared";
  ownerName: string | null;
};
