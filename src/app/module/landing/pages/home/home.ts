import { Component } from '@angular/core';
import { Navbar } from '../../components/navbar/navbar';
import { HeroComponent } from '../../components/hero/hero';
import { HowItWorks } from '../../components/how-it-works/how-it-works';
import { Domain } from '../../components/domain/domain';
import { FeaturedLawyers } from '../../components/featured-lawyers/featured-lawyers';
import {LibraryComponent} from "../../components/library/library";
import { FooterComponent } from '../../components/footer/footer';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [Navbar, HeroComponent, HowItWorks, Domain, FeaturedLawyers, LibraryComponent, FooterComponent],
  templateUrl: './home.html',
  styleUrl: './home.scss'
})
export class Home {}