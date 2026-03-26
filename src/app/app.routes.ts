import { Routes } from '@angular/router';
import { ArticleListComponent } from './components/article-list/article-list.component';
import { ArticleEditorComponent } from './components/article-editor/article-editor.component';
import { ArticleViewerComponent } from './components/article-viewer/article-viewer.component';

export const routes: Routes = [
  { path: '', component: ArticleListComponent },
  { path: 'editor', component: ArticleEditorComponent },
  { path: 'editor/:id', component: ArticleEditorComponent },
  { path: 'view/:id', component: ArticleViewerComponent },
  { path: '**', redirectTo: '' },
];
