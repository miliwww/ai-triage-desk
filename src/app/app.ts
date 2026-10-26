import { Component, DestroyRef, ElementRef, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { Store } from './core/store';
import { I18n, LANGS, Lang } from './core/i18n';
import { DEMO_NOW_ISO, fmtDateTime } from './core/format';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  readonly store = inject(Store);
  readonly i18n = inject(I18n);
  readonly langs = LANGS;
  private readonly router = inject(Router);
  private readonly element = inject<ElementRef<HTMLElement>>(ElementRef);
  readonly keyword = signal('');
  readonly resetArmed = signal(false);
  private resetTimer?: ReturnType<typeof setTimeout>;
  readonly demoClock = fmtDateTime(DEMO_NOW_ISO);

  constructor() {
    inject(DestroyRef).onDestroy(() => {
      if (this.resetTimer) clearTimeout(this.resetTimer);
    });
  }

  retry(): void {
    void this.store.init();
  }

  focusMain(event: Event): void {
    event.preventDefault();
    const main = this.element.nativeElement.querySelector<HTMLElement>('main');
    main?.focus();
    main?.scrollIntoView({ block: 'start' });
  }

  search(): void {
    const q = this.keyword().trim();
    this.router.navigate(['/tickets'], { queryParams: q ? { q } : {} });
  }

  onSearch(value: string): void {
    this.keyword.set(value);
  }

  setLang(value: string): void {
    this.i18n.setLang(value as Lang);
  }

  reset(): void {
    if (!this.resetArmed()) {
      this.resetArmed.set(true);
      this.store.toast.set({ msg: this.i18n.t('shell.resetWarn'), error: false });
      if (this.resetTimer) clearTimeout(this.resetTimer);
      this.resetTimer = setTimeout(() => this.resetArmed.set(false), 4000);
      return;
    }
    this.resetArmed.set(false);
    this.store.resetDemo();
    this.store.toast.set({ msg: this.i18n.t('shell.resetDone'), error: false });
  }
}
