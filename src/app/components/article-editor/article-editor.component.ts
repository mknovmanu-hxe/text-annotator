import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ArticleService } from '../../services/article.service';

@Component({
  selector: 'app-article-editor',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './article-editor.component.html',
  styleUrls: ['./article-editor.component.scss'],
})
export class ArticleEditorComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private articleService = inject(ArticleService);

  articleId: string | null = null;
  title = '';
  content = '';
  isEdit = false;

  ngOnInit(): void {
    this.articleId = this.route.snapshot.paramMap.get('id');
    if (this.articleId) {
      this.isEdit = true;
      this.articleService
        .getById(this.articleId)
        .subscribe((article) => {
          if (article) {
            this.title = article.title;
            this.content = article.content;
          } else {
            this.router.navigate(['/']);
          }
        })
        .unsubscribe(); // берём только текущее значение
    }
  }

  save(): void {
    if (!this.title.trim() || !this.content.trim()) return;

    if (this.isEdit && this.articleId) {
      this.articleService.update(this.articleId, {
        title: this.title.trim(),
        content: this.content.trim(),
      });
    } else {
      this.articleService.create(this.title.trim(), this.content.trim());
    }
    this.router.navigate(['/']);
  }

  cancel(): void {
    this.router.navigate(['/']);
  }
}
