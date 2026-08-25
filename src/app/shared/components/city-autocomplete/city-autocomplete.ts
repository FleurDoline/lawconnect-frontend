import { Component, EventEmitter, Input, Output, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, Subscription, of } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap, catchError, tap } from 'rxjs/operators';
import { CityService } from '../../../core/services/city.service';
import { City } from '../..//../core/models/city.model';

interface CityQuery {
  query: string;
  token: number;
}

@Component({
  selector: 'app-city-autocomplete',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './city-autocomplete.html',
  styleUrls: ['./city-autocomplete.scss']
})
export class CityAutocompleteComponent implements OnDestroy {
  @Input() placeholder = 'Ville';
  @Input() set initialValue(value: string) {
    this.query = value ?? '';
  }
  @Output() citySelected = new EventEmitter<City>();

  query = '';
  suggestions: City[] = [];
  showDropdown = false;

  private search$ = new Subject<CityQuery>();
  private inputToken = 0;
  private sub: Subscription;

  constructor(
    private cityService: CityService,
    private cdr: ChangeDetectorRef
  ) {
    this.sub = this.search$.pipe(
      debounceTime(250),

      distinctUntilChanged(
        (a, b) => a.query === b.query && a.token === b.token
      ),

      switchMap(({ query }) =>
        this.cityService.searchCities(query).pipe(
          tap(results => console.log('[City] success', results)),

          catchError(err => {
            console.error(err);
            return of([] as City[]);
          })
        )
      )
    ).subscribe(results => {
      this.suggestions = this.query.trim().length === 0
        ? results.slice(0, 7)
        : results;

      this.showDropdown = this.suggestions.length > 0;

      this.cdr.detectChanges();
    });
  }

  onInput(value: string): void {
    this.query = value;
    this.search$.next({ query: value, token: this.inputToken });
  }

  onFocus(): void {
    this.inputToken++;
    this.search$.next({ query: this.query, token: this.inputToken });
  }

  selectCity(city: City): void {
    this.query = city.cityName;
    this.showDropdown = false;
    this.citySelected.emit(city);
  }

  onBlur(): void {
    setTimeout(() => (this.showDropdown = false), 150);
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }
}