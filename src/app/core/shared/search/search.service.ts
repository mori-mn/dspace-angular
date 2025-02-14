/* eslint-disable max-classes-per-file */
import { combineLatest as observableCombineLatest, Observable, of as observableOf } from 'rxjs';
import { Injectable, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { map, switchMap, take } from 'rxjs/operators';
import { followLink, FollowLinkConfig } from '../../../shared/utils/follow-link-config.model';
import { LinkService } from '../../cache/builders/link.service';
import { PaginatedList } from '../../data/paginated-list.model';
import { ResponseParsingService } from '../../data/parsing.service';
import { RemoteData } from '../../data/remote-data';
import { GetRequest} from '../../data/request.models';
import { RestRequest } from '../../data/rest-request.model';
import { RequestService } from '../../data/request.service';
import { DSpaceObject } from '../dspace-object.model';
import { GenericConstructor } from '../generic-constructor';
import { HALEndpointService } from '../hal-endpoint.service';
import { URLCombiner } from '../../url-combiner/url-combiner';
import { hasValue, hasValueOperator, isEmpty, isNotEmpty } from '../../../shared/empty.util';
import { SearchOptions } from '../../../shared/search/models/search-options.model';
import { SearchFilterConfig } from '../../../shared/search/models/search-filter-config.model';
import { SearchResponseParsingService } from '../../data/search-response-parsing.service';
import { SearchObjects } from '../../../shared/search/models/search-objects.model';
import { FacetValueResponseParsingService } from '../../data/facet-value-response-parsing.service';
import { FacetConfigResponseParsingService } from '../../data/facet-config-response-parsing.service';
import { PaginatedSearchOptions } from '../../../shared/search/models/paginated-search-options.model';
import { Community } from '../community.model';
import { CommunityDataService } from '../../data/community-data.service';
import { ViewMode } from '../view-mode.model';
import { DSpaceObjectDataService } from '../../data/dspace-object-data.service';
import { RemoteDataBuildService } from '../../cache/builders/remote-data-build.service';
import { getFirstCompletedRemoteData, getFirstSucceededRemoteData, getRemoteDataPayload } from '../operators';
import { RouteService } from '../../services/route.service';
import { SearchResult } from '../../../shared/search/models/search-result.model';
import { ListableObject } from '../../../shared/object-collection/shared/listable-object.model';
import { getSearchResultFor } from '../../../shared/search/search-result-element-decorator';
import { FacetConfigResponse } from '../../../shared/search/models/facet-config-response.model';
import { FacetValues } from '../../../shared/search/models/facet-values.model';
import { SearchConfig } from './search-filters/search-config.model';
import { PaginationService } from '../../pagination/pagination.service';
import { SearchConfigurationService } from './search-configuration.service';
import { PaginationComponentOptions } from '../../../shared/pagination/pagination-component-options.model';
import { DataService } from '../../data/data.service';
import { Store } from '@ngrx/store';
import { CoreState } from '../../core-state.model';
import { ObjectCacheService } from '../../cache/object-cache.service';
import { NotificationsService } from '../../../shared/notifications/notifications.service';
import { HttpClient } from '@angular/common/http';
import { DSOChangeAnalyzer } from '../../data/dso-change-analyzer.service';

/**
 * A class that lets us delegate some methods to DataService
 */
class DataServiceImpl extends DataService<any> {
  protected linkPath = 'discover';

  constructor(
    protected requestService: RequestService,
    protected rdbService: RemoteDataBuildService,
    protected store: Store<CoreState>,
    protected objectCache: ObjectCacheService,
    protected halService: HALEndpointService,
    protected notificationsService: NotificationsService,
    protected http: HttpClient,
    protected comparator: DSOChangeAnalyzer<any>) {
    super();
  }

  /**
   * Adds the embed options to the link for the request
   * @param href            The href the params are to be added to
   * @param args            params for the query string
   * @param linksToFollow   links we want to embed in query string if shouldEmbed is true
   */
  public addEmbedParams(href: string, args: string[], ...linksToFollow: FollowLinkConfig<any>[]) {
    return super.addEmbedParams(href, args, ...linksToFollow);
  }
}

/**
 * Service that performs all general actions that have to do with the search page
 */
@Injectable()
export class SearchService implements OnDestroy {

  /**
   * Endpoint link path for retrieving search configurations
   */
  private configurationLinkPath = 'discover/search';

  /**
   * Endpoint link path for retrieving general search results
   */
  private searchLinkPath = 'discover/search/objects';

  /**
   * Endpoint link path for retrieving facet config incl values
   */
  private facetLinkPathPrefix = 'discover/facets/';

  /**
   * Endpoint link path for retrieving configured facets with their respective values
   */
  private searchFacetLinkPath = 'discover/search/facets/';

  /**
   * The ResponseParsingService constructor name
   */
  private parser: GenericConstructor<ResponseParsingService> = SearchResponseParsingService;

  /**
   * The RestRequest constructor name
   */
  private request: GenericConstructor<RestRequest> = GetRequest;

  /**
   * Subscription to unsubscribe from
   */
  private sub;

  /**
   * Instance of DataServiceImpl that lets us delegate some methods to DataService
   */
  private searchDataService: DataServiceImpl;

  constructor(private router: Router,
              private routeService: RouteService,
              protected requestService: RequestService,
              private rdb: RemoteDataBuildService,
              private linkService: LinkService,
              private halService: HALEndpointService,
              private communityService: CommunityDataService,
              private dspaceObjectService: DSpaceObjectDataService,
              private paginationService: PaginationService,
              private searchConfigurationService: SearchConfigurationService
  ) {
    this.searchDataService = new DataServiceImpl(
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined
    );
  }

  /**
   * Method to set service options
   * @param {GenericConstructor<ResponseParsingService>} parser The ResponseParsingService constructor name
   * @param {boolean} request The RestRequest constructor name
   */
  setServiceOptions(parser: GenericConstructor<ResponseParsingService>, request: GenericConstructor<RestRequest>) {
    if (parser) {
      this.parser = parser;
    }
    if (request) {
      this.request = request;
    }
  }

  getEndpoint(searchOptions?: PaginatedSearchOptions): Observable<string> {
    return this.halService.getEndpoint(this.searchLinkPath).pipe(
      map((url: string) => {
        if (hasValue(searchOptions)) {
          return (searchOptions as PaginatedSearchOptions).toRestUrl(url);
        } else {
          return url;
        }
      })
    );
  }

  /**
   * Method to retrieve a paginated list of search results from the server
   * @param {PaginatedSearchOptions} searchOptions The configuration necessary to perform this search
   * @param responseMsToLive The amount of milliseconds for the response to live in cache
   * @param useCachedVersionIfAvailable If this is true, the request will only be sent if there's
   * no valid cached version. Defaults to true
   * @param reRequestOnStale Whether or not the request should automatically be re-requested after
   * the response becomes stale
   * @param linksToFollow List of {@link FollowLinkConfig} that indicate which {@link HALLink}s should be automatically resolved
   * @returns {Observable<RemoteData<SearchObjects<T>>>} Emits a paginated list with all search results found
   */
  search<T extends DSpaceObject>(searchOptions?: PaginatedSearchOptions, responseMsToLive?: number, useCachedVersionIfAvailable = true, reRequestOnStale = true, ...linksToFollow: FollowLinkConfig<T>[]): Observable<RemoteData<SearchObjects<T>>> {
    const href$ = this.getEndpoint(searchOptions);

    href$.pipe(
      take(1),
      map((href: string) => {
        const args = this.searchDataService.addEmbedParams(href, [], ...linksToFollow);
        if (isNotEmpty(args)) {
          return new URLCombiner(href, `?${args.join('&')}`).toString();
        } else {
          return href;
        }
      })
    ).subscribe((url: string) => {
      const request = new this.request(this.requestService.generateRequestId(), url);
      request.href = request.href + this.formatEmbeddedKeysQueryParams(searchOptions.forcedEmbeddedKeys);

      const getResponseParserFn: () => GenericConstructor<ResponseParsingService> = () => {
        return this.parser;
      };

      Object.assign(request, {
        responseMsToLive: hasValue(responseMsToLive) ? responseMsToLive : request.responseMsToLive,
        getResponseParser: getResponseParserFn,
        searchOptions: searchOptions
      });

      this.requestService.send(request, useCachedVersionIfAvailable);
    });

    const sqr$ = href$.pipe(
      switchMap((href: string) => this.rdb.buildFromHref<SearchObjects<T>>(href))
    );

    return this.directlyAttachIndexableObjects(sqr$, useCachedVersionIfAvailable, reRequestOnStale, ...linksToFollow);
  }

  /**
   * Method to retrieve request entries for search results from the server
   * @param {PaginatedSearchOptions} searchOptions The configuration necessary to perform this search
   * @returns {Observable<RemoteData<SearchObjects<T>>>} Emits a paginated list with all search results found
   */
  searchEntries<T extends DSpaceObject>(searchOptions?: PaginatedSearchOptions): Observable<RemoteData<SearchObjects<T>>> {
    const href$ = this.getEndpoint(searchOptions);

    const sqr$ = href$.pipe(
      switchMap((href: string) => this.rdb.buildFromHref<SearchObjects<T>>(href))
    );

    return this.directlyAttachIndexableObjects(sqr$);
  }

  /**
   * Method to directly attach the indexableObjects to search results, instead of using RemoteData.
   * For compatibility with the way the search was written originally
   *
   * @param sqr$:                       a SearchObjects RemotaData Observable without its
   *                                    indexableObjects attached
   * @param useCachedVersionIfAvailable If this is true, the request will only be sent if there's
   *                                    no valid cached version. Defaults to true
   * @param reRequestOnStale            Whether or not the request should automatically be re-
   *                                    requested after the response becomes stale
   * @param linksToFollow               List of {@link FollowLinkConfig} that indicate which
   *                                    {@link HALLink}s should be automatically resolved
   * @protected
   */
  protected directlyAttachIndexableObjects<T extends DSpaceObject>(sqr$: Observable<RemoteData<SearchObjects<T>>>, useCachedVersionIfAvailable = true, reRequestOnStale = true, ...linksToFollow: FollowLinkConfig<T>[]): Observable<RemoteData<SearchObjects<T>>> {
    return sqr$.pipe(
      switchMap((resultsRd: RemoteData<SearchObjects<T>>) => {
        if (hasValue(resultsRd.payload) && isNotEmpty(resultsRd.payload.page)) {
          // retrieve the indexableObjects for all search results on the page
          const searchResult$Array: Observable<SearchResult<T>>[] = resultsRd.payload.page.map((result: SearchResult<T>) =>
            this.dspaceObjectService.findByHref(result._links.indexableObject.href, useCachedVersionIfAvailable, reRequestOnStale, ...linksToFollow as any).pipe(
              getFirstCompletedRemoteData(),
              getRemoteDataPayload(),
              hasValueOperator(),
              map((indexableObject: DSpaceObject) => {
                // determine the constructor of the search result (ItemSearchResult,
                // CollectionSearchResult, etc) based on the kind of the indeaxbleObject it
                // contains. Recreate the result with that constructor
                const constructor: GenericConstructor<ListableObject> = indexableObject.constructor as GenericConstructor<ListableObject>;
                const resultConstructor = getSearchResultFor(constructor);

                // Attach the payload directly to the indexableObject property on the result
                return Object.assign(new resultConstructor(), result, {
                  indexableObject
                }) as SearchResult<T>;
              }),
            )
          );

          // Swap the original page in the remoteData with the new one, now that the results have the
          // correct types, and all indexableObjects are directly attached.
          return observableCombineLatest(searchResult$Array).pipe(
            map((page: SearchResult<T>[]) => {

              const payload = Object.assign(new SearchObjects(), resultsRd.payload, {
                page
              }) as SearchObjects<T>;

              return new RemoteData(
                resultsRd.timeCompleted,
                resultsRd.msToLive,
                resultsRd.lastUpdated,
                resultsRd.state,
                resultsRd.errorMessage,
                payload,
                resultsRd.statusCode,
              );
            })
          );
        }
        // If we don't have a payload, or the page is empty, simply pass on the unmodified
        // RemoteData object
        return [resultsRd];
      })
    );
  }

  private getConfigUrl(url: string, scope?: string, configurationName?: string) {
    const args: string[] = [];

    if (isNotEmpty(scope)) {
      args.push(`scope=${scope}`);
    }

    if (isNotEmpty(configurationName)) {
      args.push(`configuration=${configurationName}`);
    }

    if (isNotEmpty(args)) {
      url = new URLCombiner(url, `?${args.join('&')}`).toString();
    }

    return url;
  }

  private formatEmbeddedKeysQueryParams(keys: string[]): string {
    let params = '';
    if (hasValue(keys)) {
      keys.forEach((key: string) => (params = params + '&embed=' + key));
    }
    return params;
  }

  /**
   * Request the filter configuration for a given scope or the whole repository
   * @param {link}   link the link to use for the request
   * @param {string} scope UUID of the object for which config the filter config is requested, when no scope is provided the configuration for the whole repository is loaded
   * @param {string} configurationName the name of the configuration
   * @returns {Observable<RemoteData<SearchFilterConfig[]>>} The found filter configuration
   */
  private getFilterConfigByLink(link: string, scope?: string, configurationName?: string): Observable<RemoteData<SearchFilterConfig[]>> {
    const href$ = this.halService.getEndpoint(link).pipe(
      map((url: string) => {
        const args: string[] = [];

        if (isNotEmpty(scope)) {
          args.push(`scope=${scope}`);
        }

        if (isNotEmpty(configurationName)) {
          args.push(`configuration=${configurationName}`);
        }

        if (isNotEmpty(args)) {
          url = new URLCombiner(url, `?${args.join('&')}`).toString();
        }

        return url;
      }),
    );

    href$.pipe(take(1)).subscribe((url: string) => {
      let request = new this.request(this.requestService.generateRequestId(), url);
      request = Object.assign(request, {
        getResponseParser(): GenericConstructor<ResponseParsingService> {
          return FacetConfigResponseParsingService;
        }
      });
      this.requestService.send(request, true);
    });

    return this.rdb.buildFromHref(href$).pipe(
      map((rd: RemoteData<FacetConfigResponse>) => {
        if (rd.hasSucceeded) {
          let filters: SearchFilterConfig[];
          if (isNotEmpty(rd.payload.filters)) {
            filters = rd.payload.filters
              .map((filter: any) => Object.assign(new SearchFilterConfig(), filter));
          } else {
            filters = [];
          }

          return new RemoteData(
            rd.timeCompleted,
            rd.msToLive,
            rd.lastUpdated,
            rd.state,
            rd.errorMessage,
            filters,
            rd.statusCode,
          );
        } else {
          return rd as any as RemoteData<SearchFilterConfig[]>;
        }
      })
    );
  }


  /**
   * Request the filter configuration for a given scope or the whole repository
   * @param {string} scope UUID of the object for which config the filter config is requested, when no scope is provided the configuration for the whole repository is loaded
   * @param {string} configurationName the name of the configuration
   * @returns {Observable<RemoteData<SearchFilterConfig[]>>} The found filter configuration
   */
  getConfig(scope?: string, configurationName?: string): Observable<RemoteData<SearchFilterConfig[]>> {
    return this.getFilterConfigByLink(this.facetLinkPathPrefix, scope, configurationName);
  }

  /**
   * Method to request a single page of filter values for a given value
   * @param {SearchFilterConfig} filterConfig The filter config for which we want to request filter values
   * @param {number} valuePage The page number of the filter values
   * @param {SearchOptions} searchOptions The search configuration for the current search
   * @param {string} filterQuery The optional query used to filter out filter values
   * @param useCachedVersionIfAvailable If this is true, the request will only be sent if there's
   *                                    no valid cached version. Defaults to true
   * @returns {Observable<RemoteData<PaginatedList<FacetValue>>>} Emits the given page of facet values
   */
  getFacetValuesFor(filterConfig: SearchFilterConfig, valuePage: number, searchOptions?: SearchOptions, filterQuery?: string, useCachedVersionIfAvailable = true): Observable<RemoteData<FacetValues>> {
    let href;
    const args: string[] = [`page=${valuePage - 1}`, `size=${filterConfig.pageSize}`];
    if (hasValue(filterQuery)) {
      args.push(`prefix=${filterQuery}`);
    }
    if (hasValue(searchOptions)) {
      href = searchOptions.toRestUrl(filterConfig._links.self.href, args);
    } else {
      href = new URLCombiner(filterConfig._links.self.href, `?${args.join('&')}`).toString();
    }

    let request = new this.request(this.requestService.generateRequestId(), href);
    request = Object.assign(request, {
      getResponseParser(): GenericConstructor<ResponseParsingService> {
        return FacetValueResponseParsingService;
      }
    });
    this.requestService.send(request, useCachedVersionIfAvailable);

    return this.rdb.buildFromHref(href);
  }

  /**
   * Request the filter configuration for a given scope or the whole repository
   * @param {string} scope UUID of the object for which config the filter config is requested, when no scope is provided the configuration for the whole repository is loaded
   * @param {string} configurationName the name of the configuration
   * @returns {Observable<RemoteData<SearchFilterConfig[]>>} The found filter configuration
   */
  searchFacets(scope?: string, configurationName?: string): Observable<RemoteData<SearchFilterConfig[]>> {
    return this.getFilterConfigByLink(this.searchFacetLinkPath, scope, configurationName);
  }

  /**
   * Request a list of DSpaceObjects that can be used as a scope, based on the current scope
   * @param {string} scopeId UUID of the current scope, if the scope is empty, the repository wide scopes will be returned
   * @returns {Observable<DSpaceObject[]>} Emits a list of DSpaceObjects which represent possible scopes
   */
  getScopes(scopeId?: string): Observable<DSpaceObject[]> {

    if (isEmpty(scopeId)) {
      const top: Observable<Community[]> = this.communityService.findTop({ elementsPerPage: 9999 }).pipe(
        getFirstSucceededRemoteData(),
        map(
          (communities: RemoteData<PaginatedList<Community>>) => communities.payload.page
        )
      );
      return top;
    }

    const scopeObject: Observable<RemoteData<DSpaceObject>> = this.dspaceObjectService.findById(scopeId).pipe(getFirstSucceededRemoteData());
    const scopeList: Observable<DSpaceObject[]> = scopeObject.pipe(
      switchMap((dsoRD: RemoteData<DSpaceObject>) => {
          if ((dsoRD.payload as any).type === Community.type.value) {
            const community: Community = dsoRD.payload as Community;
            this.linkService.resolveLinks(community, followLink('subcommunities'), followLink('collections'));
            return observableCombineLatest([
              community.subcommunities.pipe(getFirstCompletedRemoteData()),
              community.collections.pipe(getFirstCompletedRemoteData())
            ]).pipe(
              map(([subCommunities, collections]) => {
                /*if this is a community, we also need to show the direct children*/
                return [community, ...subCommunities.payload.page, ...collections.payload.page];
              })
            );
          } else {
            return observableOf([dsoRD.payload]);
          }
        }
      ));

    return scopeList;

  }

  /**
   * Requests the current view mode based on the current URL
   * @returns {Observable<ViewMode>} The current view mode
   */
  getViewMode(): Observable<ViewMode> {
    return this.routeService.getQueryParamMap().pipe(map((params) => {
      if (isNotEmpty(params.get('view')) && hasValue(params.get('view'))) {
        return params.get('view');
      } else {
        return ViewMode.ListElement;
      }
    }));
  }

  /**
   * Changes the current view mode in the current URL
   * @param {ViewMode} viewMode Mode to switch to
   * @param {string[]} searchLinkParts
   */
  setViewMode(viewMode: ViewMode, searchLinkParts?: string[]) {
    this.paginationService.getCurrentPagination(this.searchConfigurationService.paginationID, new PaginationComponentOptions()).pipe(take(1))
      .subscribe((config) => {
        let pageParams = { page: 1 };
        const queryParams = { view: viewMode };
        if (viewMode === ViewMode.DetailedListElement) {
          pageParams = Object.assign(pageParams, { pageSize: 1 });
        } else if (config.pageSize === 1) {
          pageParams = Object.assign(pageParams, { pageSize: 10 });
        }
        this.paginationService.updateRouteWithUrl(this.searchConfigurationService.paginationID, hasValue(searchLinkParts) ? searchLinkParts : [this.getSearchLink()], pageParams, queryParams);
      });
  }

  /**
   * Request the search configuration for a given scope or the whole repository
   * @param {string} scope UUID of the object for which config the filter config is requested, when no scope is provided the configuration for the whole repository is loaded
   * @param {string} configurationName the name of the configuration
   * @returns {Observable<RemoteData<SearchConfig[]>>} The found configuration
   */
  getSearchConfigurationFor(scope?: string, configurationName?: string): Observable<RemoteData<SearchConfig>> {
    const href$ = this.halService.getEndpoint(this.configurationLinkPath).pipe(
      map((url: string) => this.getConfigUrl(url, scope, configurationName)),
    );

    href$.pipe(take(1)).subscribe((url: string) => {
      const request = new this.request(this.requestService.generateRequestId(), url);
      this.requestService.send(request, true);
    });

    return this.rdb.buildFromHref(href$);
  }

  /**
   * @returns {string} The base path to the search page
   */
  getSearchLink(): string {
    return '/search';
  }

  /**
   * Unsubscribe from the subscription
   */
  ngOnDestroy(): void {
    if (this.sub !== undefined) {
      this.sub.unsubscribe();
    }
  }
}
