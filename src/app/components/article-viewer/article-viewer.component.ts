import {
  Component,
  OnInit,
  OnDestroy,
  inject,
  ElementRef,
  ViewChild,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil, combineLatest } from 'rxjs';
import { Article } from '../../models/article.model';
import { Annotation } from '../../models/annotation.model';
import { ArticleService } from '../../services/article.service';
import { AnnotationService } from '../../services/annotation.service';
import { AnnotationTooltipComponent } from '../annotation-tooltip/annotation-tooltip.component';

interface TextSegment {
  text: string;
  annotation: Annotation | null;
}

@Component({
  selector: 'app-article-viewer',
  standalone: true,
  imports: [CommonModule, FormsModule, AnnotationTooltipComponent],
  templateUrl: './article-viewer.component.html',
  styleUrls: ['./article-viewer.component.scss'],
})
export class ArticleViewerComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private articleService = inject(ArticleService);
  private annotationService = inject(AnnotationService);
  private cdr = inject(ChangeDetectorRef);
  private destroy$ = new Subject<void>();

  @ViewChild('contentContainer', { static: false })
  contentContainer!: ElementRef<HTMLDivElement>;

  article: Article | null = null;
  annotations: Annotation[] = [];
  segments: TextSegment[] = [];

  // Annotation creation panel
  showAnnotationPanel = false;
  selectionStart = 0;
  selectionEnd = 0;
  selectedText = '';
  annotationNote = '';
  annotationColor = '#4361ee';

  // Tooltip
  tooltipVisible = false;
  tooltipNote = '';
  tooltipColor = '';
  tooltipX = 0;
  tooltipY = 0;

  readonly colors = [
    '#4361ee',
    '#f72585',
    '#4cc9f0',
    '#f77f00',
    '#06d6a0',
    '#9b5de5',
    '#e63946',
    '#2a9d8f',
  ];

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.router.navigate(['/']);
      return;
    }

    combineLatest([
      this.articleService.getById(id),
      this.annotationService.getByArticleId(id),
    ])
      .pipe(takeUntil(this.destroy$))
      .subscribe(([article, annotations]) => {
        if (!article) {
          this.router.navigate(['/']);
          return;
        }
        this.article = article;
        this.annotations = annotations;
        this.buildSegments();
        this.cdr.markForCheck();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  goBack(): void {
    this.router.navigate(['/']);
  }

  editArticle(): void {
    if (this.article) {
      this.router.navigate(['/editor', this.article.id]);
    }
  }

  /** Построение сегментов текста (обычные + аннотированные) */
  private buildSegments(): void {
    if (!this.article) {
      this.segments = [];
      return;
    }

    const content = this.article.content;
    const sorted = [...this.annotations].sort(
      (a, b) => a.startOffset - b.startOffset,
    );
    const segments: TextSegment[] = [];
    let cursor = 0;

    for (const ann of sorted) {
      // Валидация
      if (ann.startOffset >= ann.endOffset) continue;
      if (ann.startOffset >= content.length) continue;

      const start = Math.max(ann.startOffset, cursor);
      const end = Math.min(ann.endOffset, content.length);

      if (start > end) continue;

      // Текст до аннотации
      if (cursor < start) {
        segments.push({ text: content.slice(cursor, start), annotation: null });
      }

      // Аннотированный текст
      segments.push({ text: content.slice(start, end), annotation: ann });
      cursor = end;
    }

    // Остаток текста
    if (cursor < content.length) {
      segments.push({ text: content.slice(cursor), annotation: null });
    }

    this.segments = segments;
  }

  /** Обработка выделения текста */
  onTextSelected(): void {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || !this.article) {
      return;
    }

    const range = selection.getRangeAt(0);
    const container = this.contentContainer?.nativeElement;
    if (
      !container ||
      !container.contains(range.startContainer) ||
      !container.contains(range.endContainer)
    ) {
      return;
    }

    // Вычисление абсолютных оффсетов в тексте
    const offsets = this.calculateOffsets(container, range);
    if (!offsets || offsets.start === offsets.end) return;

    this.selectionStart = offsets.start;
    this.selectionEnd = offsets.end;
    this.selectedText = this.article.content.slice(offsets.start, offsets.end);
    this.annotationNote = '';
    this.showAnnotationPanel = true;
  }

  /** Рассчитываем символьные оффсеты в plain-text по DOM-у */
  private calculateOffsets(
    container: HTMLElement,
    range: Range,
  ): { start: number; end: number } | null {
    const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
    let offset = 0;
    let startOffset: number | null = null;
    let endOffset: number | null = null;

    let node: Node | null;
    while ((node = walker.nextNode())) {
      if (node === range.startContainer) {
        startOffset = offset + range.startOffset;
      }
      if (node === range.endContainer) {
        endOffset = offset + range.endOffset;
        break;
      }
      offset += node.textContent?.length ?? 0;
    }

    if (startOffset !== null && endOffset !== null && startOffset < endOffset) {
      return { start: startOffset, end: endOffset };
    }
    return null;
  }

  selectColor(color: string): void {
    this.annotationColor = color;
  }

  saveAnnotation(): void {
    if (!this.article || !this.annotationNote.trim()) return;

    this.annotationService.add({
      articleId: this.article.id,
      startOffset: this.selectionStart,
      endOffset: this.selectionEnd,
      color: this.annotationColor,
      note: this.annotationNote.trim(),
    });

    this.showAnnotationPanel = false;
    window.getSelection()?.removeAllRanges();
  }

  cancelAnnotation(): void {
    this.showAnnotationPanel = false;
    window.getSelection()?.removeAllRanges();
  }

  removeAnnotation(id: string, event: Event): void {
    event.stopPropagation();
    this.annotationService.remove(id);
  }

  /** Показать тултип при наведении на аннотированный текст */
  onAnnotationMouseEnter(event: MouseEvent, annotation: Annotation): void {
    const target = event.target as HTMLElement;
    const rect = target.getBoundingClientRect();
    this.tooltipX = rect.left + rect.width / 2;
    this.tooltipY = rect.top;
    this.tooltipNote = annotation.note;
    this.tooltipColor = annotation.color;
    this.tooltipVisible = true;
  }

  onAnnotationMouseLeave(): void {
    this.tooltipVisible = false;
  }
}
