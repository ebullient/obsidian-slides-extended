
```javascript
export class CounterService {
  count$ = new BehaviorSubject(1000);

  double$ = this.count$.pipe(map((count) => count * 2));
  triple$ = this.count$.pipe(map((count) => count * 3));

  combined$ = combineLatest([this.double$, this.triple$]).pipe(
    map(([double, triple]) => double + triple)
  );

  over9000$ = this.combined$.pipe(map((combined) => combined > 9000));

  message$ = this.over9000$.pipe(
    map((over9000) => (over9000 ? "It's over 9000!" : "It's under 9000."))
  );
}
```
