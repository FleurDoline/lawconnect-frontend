import { Component, EventEmitter, Input, Output, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, Subscription, of } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { CityService } from '../../../core/services/city.service';
import { City } from '../..//../core/models/city.model';

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

  private search$ = new Subject<string>();
  private sub: Subscription;

  constructor(private cityService: CityService) {
    this.sub = this.search$.pipe(
      debounceTime(250),
      distinctUntilChanged(),
      switchMap(q => q.trim().length > 0 ? this.cityService.searchCities(q) : of([]))
    ).subscribe(results => {
      this.suggestions = results;
      this.showDropdown = results.length > 0;
    });
  }

  onInput(value: string): void {
    this.query = value;
    this.search$.next(value);
  }

  selectCity(city: City): void {
    this.query = city.cityName;
    this.showDropdown = false;
    this.citySelected.emit(city);
  }

  onBlur(): void {
    // délai pour laisser le (click) sur une suggestion se déclencher avant de fermer
    setTimeout(() => (this.showDropdown = false), 150);
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }
}