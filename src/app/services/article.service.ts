import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, map } from 'rxjs';
import { Article } from '../models/article.model';
import { StorageService } from './storage.service';

const STORAGE_KEY = 'articles';

@Injectable({ providedIn: 'root' })
export class ArticleService {
  private articles$ = new BehaviorSubject<Article[]>([]);

  constructor(private storage: StorageService) {
    const saved = this.storage.get<Article[]>(STORAGE_KEY) ?? [];
    this.articles$.next(saved);
  }

  getAll(): Observable<Article[]> {
    return this.articles$.asObservable();
  }

  getById(id: string): Observable<Article | undefined> {
    return this.articles$.pipe(
      map((articles) => articles.find((a) => a.id === id)),
    );
  }

  create(title: string, content: string): Article {
    const article: Article = {
      id: crypto.randomUUID(),
      title,
      content,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    const updated = [...this.articles$.value, article];
    this.persist(updated);
    return article;
  }

  update(
    id: string,
    changes: Partial<Pick<Article, 'title' | 'content'>>,
  ): void {
    const updated = this.articles$.value.map((a) =>
      a.id === id ? { ...a, ...changes, updatedAt: Date.now() } : a,
    );
    this.persist(updated);
  }

  delete(id: string): void {
    const updated = this.articles$.value.filter((a) => a.id !== id);
    this.persist(updated);
  }

  private persist(articles: Article[]): void {
    this.articles$.next(articles);
    this.storage.set(STORAGE_KEY, articles);
  }
}
