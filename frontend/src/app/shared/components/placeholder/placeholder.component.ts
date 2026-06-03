import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-placeholder',
  standalone: true,
  template: `
    <section class="placeholder">
      <h2>{{ title }}</h2>
      <p>{{ description }}</p>
      <div class="coming-soon">Coming soon</div>
    </section>
  `,
  styles: [
    `
      .placeholder {
        background: #ffffff;
        border-radius: 12px;
        padding: 28px;
        box-shadow: 0 2px 8px rgba(15, 23, 42, 0.04);
      }
      h2 {
        margin: 0 0 8px;
        color: #0f172a;
      }
      p {
        color: #475569;
        margin: 0 0 20px;
      }
      .coming-soon {
        display: inline-block;
        padding: 6px 12px;
        border-radius: 999px;
        background: #e0e7ff;
        color: #3730a3;
        font-size: 0.8rem;
        font-weight: 600;
      }
    `
  ]
})
export class PlaceholderComponent {
  @Input() title = 'Page';
  @Input() description = '';
}
