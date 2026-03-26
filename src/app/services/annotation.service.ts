import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, map } from 'rxjs';
import { Annotation } from '../models/annotation.model';
import { StorageService } from './storage.service';

const STORAGE_KEY = 'annotations';

@Injectable({ providedIn: 'root' })
export class AnnotationService {
  private annotations$ = new BehaviorSubject<Annotation[]>([]);

  constructor(private storage: StorageService) {
    const saved = this.storage.get<Annotation[]>(STORAGE_KEY) ?? [];
    this.annotations$.next(saved);
  }

  getByArticleId(articleId: string): Observable<Annotation[]> {
    return this.annotations$.pipe(
      map((all) =>
        all
          .filter((a) => a.articleId === articleId)
          .sort((a, b) => a.startOffset - b.startOffset),
      ),
    );
  }

  add(annotation: Omit<Annotation, 'id' | 'createdAt'>): Annotation {
    const full: Annotation = {
      ...annotation,
      id: crypto.randomUUID(),
      createdAt: Date.now(),
    };

    // Проверяем пересечения и удаляем конфликтующие
    const existing = this.annotations$.value.filter(
      (a) => a.articleId === annotation.articleId,
    );
    const nonConflicting = existing.filter(
      (a) => a.endOffset <= full.startOffset || a.startOffset >= full.endOffset,
    );
    const otherArticles = this.annotations$.value.filter(
      (a) => a.articleId !== annotation.articleId,
    );

    const updated = [...otherArticles, ...nonConflicting, full];
    this.persist(updated);
    return full;
  }

  remove(id: string): void {
    const updated = this.annotations$.value.filter((a) => a.id !== id);
    this.persist(updated);
  }

  removeByArticleId(articleId: string): void {
    const updated = this.annotations$.value.filter(
      (a) => a.articleId !== articleId,
    );
    this.persist(updated);
  }

  private persist(annotations: Annotation[]): void {
    this.annotations$.next(annotations);
    this.storage.set(STORAGE_KEY, annotations);
  }
}
