import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { SharedModule } from '../shared/shared.module';

import { CommunityPageComponent } from './community-page.component';
import { CommunityPageSubCollectionListComponent } from './sub-collection-list/community-page-sub-collection-list.component';
import { CommunityPageRoutingModule } from './community-page-routing.module';
import { CommunityPageSubCommunityListComponent } from './sub-community-list/community-page-sub-community-list.component';
import { CreateCommunityPageComponent } from './create-community-page/create-community-page.component';
import { DeleteCommunityPageComponent } from './delete-community-page/delete-community-page.component';
import { StatisticsModule } from '../statistics/statistics.module';
import { CommunityFormModule } from './community-form/community-form.module';
import { ContextMenuModule } from '../shared/context-menu/context-menu.module';
import { ThemedCommunityPageComponent } from './themed-community-page.component';
import { ComcolModule } from '../shared/comcol/comcol.module';

const DECLARATIONS = [CommunityPageComponent,
  ThemedCommunityPageComponent,
  CommunityPageSubCollectionListComponent,
  CommunityPageSubCommunityListComponent,
  CreateCommunityPageComponent,
  DeleteCommunityPageComponent];

@NgModule({
  imports: [
    CommonModule,
    SharedModule,
    CommunityPageRoutingModule,
    StatisticsModule.forRoot(),
    CommunityFormModule,
    ComcolModule,
    ContextMenuModule.withEntryComponents(),
  ],
  declarations: [
    ...DECLARATIONS
  ],
  exports: [
    ...DECLARATIONS
  ]
})

export class CommunityPageModule {

}
