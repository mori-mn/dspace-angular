import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../shared/shared.module';
import { LookupRoutingModule } from './lookup-by-id-routing.module';
import { ObjectNotFoundComponent } from './objectnotfound/objectnotfound.component';
import { ObjectGoneComponent } from './objectgone/objectgone.component';
import { DsoRedirectDataService } from '../core/data/dso-redirect-data.service';
import { ThemedObjectNotFoundComponent } from './objectnotfound/themed-objectnotfound.component';
import { ThemedObjectGoneComponent } from './objectgone/themed-objectgone.component';

@NgModule({
  imports: [
    LookupRoutingModule,
    CommonModule,
    SharedModule,
  ],
  declarations: [
    ObjectNotFoundComponent,
    ObjectGoneComponent,
    ThemedObjectNotFoundComponent,
    ThemedObjectGoneComponent
  ],
  providers: [
    DsoRedirectDataService
  ]
})
export class LookupIdModule {

}
