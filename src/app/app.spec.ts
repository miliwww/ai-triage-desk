import { TestBed } from '@angular/core/testing';
import { App } from './app';
import { provideRouter, Router } from '@angular/router';
import { Store } from './core/store';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideRouter([])],
    })
      .compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('renders the branded workspace and real navigation', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.brand')?.textContent).toContain('AlphaESS');
    expect(compiled.querySelector('a[routerLink="/tickets"]')).toBeTruthy();
    expect(compiled.querySelector('main#main-content')).toBeTruthy();
  });

  it('requires a second click before resetting the demo', () => {
    const fixture = TestBed.createComponent(App);
    const reset = vi.spyOn(TestBed.inject(Store), 'resetDemo');
    fixture.componentInstance.reset();
    expect(reset).not.toHaveBeenCalled();
    fixture.componentInstance.reset();
    expect(reset).toHaveBeenCalledOnce();
  });

  it('sends a trimmed global search to the ticket list', () => {
    const fixture = TestBed.createComponent(App);
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    fixture.componentInstance.keyword.set('  WO-0047  ');
    fixture.componentInstance.search();
    expect(navigate).toHaveBeenCalledWith(['/tickets'], { queryParams: { q: 'WO-0047' } });
  });
});
