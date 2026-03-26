export interface Annotation {
  id: string;
  articleId: string;
  startOffset: number;
  endOffset: number;
  color: string;
  note: string;
  createdAt: number;
}
