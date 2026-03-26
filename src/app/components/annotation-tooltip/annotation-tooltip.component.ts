import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-annotation-tooltip',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './annotation-tooltip.component.html',
  styleUrls: ['./annotation-tooltip.component.scss'],
})
export class AnnotationTooltipComponent {
  @Input() note = '';
  @Input() color = '';
  @Input() x = 0;
  @Input() y = 0;
  @Input() visible = false;
}
