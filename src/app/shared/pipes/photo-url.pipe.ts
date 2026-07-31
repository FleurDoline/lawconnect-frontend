import { Pipe, PipeTransform } from '@angular/core';
import { environment } from '../../../environments/environment';

@Pipe({
  name: 'photoUrl',
  standalone: true
})
export class PhotoUrlPipe implements PipeTransform {
  private readonly photoBaseUrl = environment.apiUrl.replace('/api/v1', '');

  transform(photo: string | null | undefined, fallback: string = '/images/images.jpeg'): string {
    if (!photo || photo === 'string') {
      return fallback;
    }

    // Si la valeur est déjà une URL complète (http/https), on ne la préfixe pas
    if (photo.startsWith('http://') || photo.startsWith('https://')) {
      return photo;
    }

    return this.photoBaseUrl + photo;
  }
}