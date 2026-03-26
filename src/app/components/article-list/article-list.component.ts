import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ArticleService } from '../../services/article.service';
import { AnnotationService } from '../../services/annotation.service';

@Component({
  selector: 'app-article-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './article-list.component.html',
  styleUrls: ['./article-list.component.scss'],
})
export class ArticleListComponent {
  private articleService = inject(ArticleService);
  private annotationService = inject(AnnotationService);
  private router = inject(Router);

  articles$ = this.articleService.getAll();

  createArticle(): void {
    this.router.navigate(['/editor']);
  }

  viewArticle(id: string): void {
    this.router.navigate(['/view', id]);
  }

  editArticle(id: string, event: Event): void {
    event.stopPropagation();
    this.router.navigate(['/editor', id]);
  }

  deleteArticle(id: string, event: Event): void {
    event.stopPropagation();
    if (confirm('Удалить статью?')) {
      this.annotationService.removeByArticleId(id);
      this.articleService.delete(id);
    }
  }
}
