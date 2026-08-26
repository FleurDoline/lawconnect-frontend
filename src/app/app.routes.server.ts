import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  {
    path: 'avocat',
    renderMode: RenderMode.Server
  },
  {
    path: 'avocat/dashboard',
    renderMode: RenderMode.Server
  },
  {
    path: 'avocat/:id',
    renderMode: RenderMode.Server
  },
  {
    path: 'client/besoin-avocat/:id',
    renderMode: RenderMode.Server
  },
  {
    path: '**',
    renderMode: RenderMode.Prerender
  }
];