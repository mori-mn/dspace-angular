import { map } from 'rxjs/operators';
import { Component, Inject, Input, OnInit, PLATFORM_ID } from '@angular/core';
import { Router } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';

import { combineLatest as combineLatestObservable, Observable, of } from 'rxjs';
import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import { Angulartics2GoogleAnalytics } from 'angulartics2';

import { MetadataService } from '../core/metadata/metadata.service';
import { HostWindowState } from '../shared/search/host-window.reducer';
import { NativeWindowRef, NativeWindowService } from '../core/services/window.service';
import { AuthService } from '../core/auth/auth.service';
import { CSSVariableService } from '../shared/sass-helper/sass-helper.service';
import { MenuService } from '../shared/menu/menu.service';
import { HostWindowService } from '../shared/host-window.service';
import { ThemeConfig } from '../../config/theme.model';
import { Angulartics2DSpace } from '../statistics/angulartics/dspace-provider';
import { environment } from '../../environments/environment';
import { slideSidebarPadding } from '../shared/animations/slide';
import { MenuID } from '../shared/menu/menu-id.model';
import { getPageInternalServerErrorRoute } from '../app-routing-paths';

@Component({
  selector: 'ds-root',
  templateUrl: './root.component.html',
  styleUrls: ['./root.component.scss'],
  animations: [slideSidebarPadding],
})
export class RootComponent implements OnInit {
  sidebarVisible: Observable<boolean>;
  slideSidebarOver: Observable<boolean>;
  collapsedSidebarWidth: Observable<string>;
  totalSidebarWidth: Observable<string>;
  theme: Observable<ThemeConfig> = of({} as any);
  notificationOptions;
  models;
  /**
   * Whether or not to show a full screen loader
   */
  @Input() shouldShowFullscreenLoader: boolean;

  /**
   * Whether or not to show a loader across the router outlet
   */
  @Input() shouldShowRouteLoader: boolean;

  /**
   * In order to show sharing component only in csr
   */
  browserPlatform = false;

  constructor(
    @Inject(NativeWindowService) private _window: NativeWindowRef,
    private translate: TranslateService,
    private store: Store<HostWindowState>,
    private metadata: MetadataService,
    private angulartics2GoogleAnalytics: Angulartics2GoogleAnalytics,
    private angulartics2DSpace: Angulartics2DSpace,
    private authService: AuthService,
    private router: Router,
    private cssService: CSSVariableService,
    private menuService: MenuService,
    private windowService: HostWindowService,
    @Inject(PLATFORM_ID) platformId: any
  ) {
    this.notificationOptions = environment.notifications;
    this.browserPlatform = isPlatformBrowser(platformId);
  }

  ngOnInit() {
    this.sidebarVisible = this.menuService.isMenuVisible(MenuID.ADMIN);
    this.collapsedSidebarWidth = this.cssService.getVariable('collapsedSidebarWidth');
    this.totalSidebarWidth = this.cssService.getVariable('totalSidebarWidth');
    const sidebarCollapsed = this.menuService.isMenuCollapsed(MenuID.ADMIN);
    this.slideSidebarOver = combineLatestObservable([sidebarCollapsed, this.windowService.isXsOrSm()])
      .pipe(
        map(([collapsed, mobile]) => collapsed || mobile)
      );

    if (this.router.url === getPageInternalServerErrorRoute()) {
      this.shouldShowRouteLoader = false;
    }
  }
}
