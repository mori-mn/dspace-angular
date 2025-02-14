import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';

import { Store } from '@ngrx/store';
import { dataService } from '../cache/builders/build-decorators';
import { RemoteDataBuildService } from '../cache/builders/remote-data-build.service';
import { DataService } from '../data/data.service';
import { RequestService } from '../data/request.service';
import { HALEndpointService } from '../shared/hal-endpoint.service';
import { NotificationsService } from '../../shared/notifications/notifications.service';
import { ObjectCacheService } from '../cache/object-cache.service';
import { DSOChangeAnalyzer } from '../data/dso-change-analyzer.service';
import { WorkspaceItem } from './models/workspaceitem.model';
import { Observable } from 'rxjs';
import { RemoteData } from '../data/remote-data';
import { PostRequest } from '../data/request.models';
import { FollowLinkConfig } from '../../shared/utils/follow-link-config.model';
import { RequestParam } from '../cache/models/request-param.model';
import { CoreState } from '../core-state.model';
import { FindListOptions } from '../data/find-list-options.model';
import { HttpOptions } from '../dspace-rest/dspace-rest.service';
import { find, map } from 'rxjs/operators';
import { hasValue } from '../../shared/empty.util';

/**
 * A service that provides methods to make REST requests with workspaceitems endpoint.
 */
@Injectable()
@dataService(WorkspaceItem.type)
export class WorkspaceitemDataService extends DataService<WorkspaceItem> {
  protected linkPath = 'workspaceitems';
  protected searchByItemLinkPath = 'item';

  constructor(
    protected comparator: DSOChangeAnalyzer<WorkspaceItem>,
    protected halService: HALEndpointService,
    protected http: HttpClient,
    protected notificationsService: NotificationsService,
    protected requestService: RequestService,
    protected rdbService: RemoteDataBuildService,
    protected objectCache: ObjectCacheService,
    protected store: Store<CoreState>) {
    super();
  }

  /**
   * Return the WorkspaceItem object found through the UUID of an item
   *
   * @param uuid           The uuid of the item
   * @param useCachedVersionIfAvailable If this is true, the request will only be sent if there's
   *                                    no valid cached version. Defaults to true
   * @param reRequestOnStale            Whether or not the request should automatically be re-
   *                                    requested after the response becomes stale
   * @param options        The {@link FindListOptions} object
   * @param linksToFollow  List of {@link FollowLinkConfig} that indicate which {@link HALLink}s should be automatically resolved
   */
  public findByItem(uuid: string, useCachedVersionIfAvailable = false, reRequestOnStale = true, options: FindListOptions = {}, ...linksToFollow: FollowLinkConfig<WorkspaceItem>[]): Observable<RemoteData<WorkspaceItem>> {
    const findListOptions = new FindListOptions();
    findListOptions.searchParams = [new RequestParam('uuid', encodeURIComponent(uuid))];
    const href$ = this.getSearchByHref(this.searchByItemLinkPath, findListOptions, ...linksToFollow);
    return this.findByHref(href$, useCachedVersionIfAvailable, reRequestOnStale, ...linksToFollow);
  }

  /**
   * Import an external source entry into a collection
   * @param externalSourceEntryHref
   * @param collectionId
   */
  public importExternalSourceEntry(externalSourceEntryHref: string, collectionId: string): Observable<RemoteData<WorkspaceItem>> {
    const options: HttpOptions = Object.create({});
    let headers = new HttpHeaders();
    headers = headers.append('Content-Type', 'text/uri-list');
    options.headers = headers;

    const requestId = this.requestService.generateRequestId();
    const href$ = this.halService.getEndpoint(this.linkPath).pipe(map((href) => `${href}?owningCollection=${collectionId}`));

    href$.pipe(
      find((href: string) => hasValue(href)),
      map((href: string) => {
        const request = new PostRequest(requestId, href, externalSourceEntryHref, options);
        this.requestService.send(request);
      })
    ).subscribe();

    return this.rdbService.buildFromRequestUUID(requestId);
  }

}
