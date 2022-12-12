import { Component } from '@angular/core';
import { FooterComponent as BaseComponent } from '../../../../app/footer/footer.component';

@Component({
  selector: 'ds-footer',
  styleUrls: ['./footer.component.scss'],
  templateUrl: './footer.component.html'
})

/**
 * Component to render the news section on the footer
 */
export class FooterComponent extends BaseComponent {}
