import { NgModule } from '@angular/core';
import { BrowserModule, provideClientHydration } from '@angular/platform-browser';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http'; // Import HTTP_INTERCEPTORS
import { AppRoutingModule } from './app-routing-module';
import { App } from './app';
import { AuthInterceptor } from './core/interceptors/auth.interceptors'; // Import your interceptor

@NgModule({
  declarations: [
    App
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule // Add this instead of provideHttpClient()
  ],
  providers: [
  
    provideClientHydration(),
    // Remove provideHttpClient() from here
    
    // Add the interceptor provider
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true // IMPORTANT: This must be true
    }
  ],
  bootstrap: [App]
})
export class AppModule { }