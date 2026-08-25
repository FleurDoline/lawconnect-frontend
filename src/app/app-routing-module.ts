import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { Home } from './module/landing/pages/home/home';
import { LoginComponent } from './module/auth/pages/login/login';
import { SignupComponent } from './module/auth/pages/signup/signup';
import { DashboardComponent } from './module/avocat/pages/dashboard/dashboard';
import { ListeAvocatsComponent } from './module/avocat/pages/list/list';
import { ClientDashboardComponent } from './module/client/pages/dashboard/dashboard';
import { BesoinAvocatComponent } from './module/client/pages/besoin-avocat/besoin-avocat';
import { ConsultationsComponent } from './module/client/pages/consultation/consultations';
import { AvocatProfileComponent } from './module/avocat/pages/profile/profile';

const routes: Routes = [
  { path: '', component: Home },
  { path: 'home', component: Home },
  { path: 'avocat', component: ListeAvocatsComponent },
  { path: 'auth/login', component: LoginComponent },
  { path: 'auth/inscription', component: SignupComponent },
  { path: 'avocat/dashboard', component: DashboardComponent },
  {
    path: 'avocat/parametre/profil',
    loadComponent: () => import('./module/avocat/pages/parametre/profil/profil').then(m => m.AvocatParametreProfilComponent)
  },
  {
    path: 'avocat/rendez-vous',
    loadComponent: () => import('./module/avocat/pages/rendez-vous/rendez-vous').then(m => m.RendezVousComponent)
  },
  { path: 'client/dashboard', component: ClientDashboardComponent },
  { path: 'client/besoin-avocat/:id', component: BesoinAvocatComponent },
  {
    path: 'domaines',
    loadComponent: () => import('./module/landing/pages/domaines/domaines').then(m => m.DomainesPage)
  },
  {
  path: 'bibliotheque',
  loadComponent: () => import('./module/landing/pages/bibliotheque/bibliotheque').then(m => m.BibliothequePage)
},
  {
    path: 'avocat/paiement',
    loadComponent: () => import('./module/avocat/pages/paiement/paiement').then(m => m.PaiementComponent)
  },
  {
    path: 'admin/dashboard',
    loadComponent: () => import('./module/admin/pages/dashboard/dashboard').then(m => m.AdminDashboardComponent)
  },
  {
    path: 'avocat/:id',
    loadComponent: () => import('./module/avocat/pages/profile/profile').then(m => m.AvocatProfileComponent)
  },
  {
    path: 'auth/verify-otp',
    loadComponent: () => import('./module/auth/pages/verify-otp/verify-otp').then(m => m.VerifyOtpComponent)
  },
  { path: 'client/consultations', component: ConsultationsComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }