import { Injectable } from '@angular/core';

import { ConfigService } from './config.service';
import { RequestService } from '../data/request.service';
import { HALEndpointService } from '../shared/hal-endpoint.service';
import { RemoteDataBuildService } from '../cache/builders/remote-data-build.service';
import { Store } from '@ngrx/store';
import { CoreState } from '../core-state.model';
import { ObjectCacheService } from '../cache/object-cache.service';
import { NotificationsService } from '../../shared/notifications/notifications.service';
import { HttpClient } from '@angular/common/http';
import { DefaultChangeAnalyzer } from '../data/default-change-analyzer.service';
import { ConfigObject } from './models/config.model';
import { dataService } from '../cache/builders/build-decorators';
import { SUBMISSION_DEFINITION_TYPE } from './models/config-type';
import { SubmissionFormsModel } from './models/config-submission-forms.model';
import { RemoteData } from '../data/remote-data';
import { Observable } from 'rxjs';
import { FollowLinkConfig } from '../../shared/utils/follow-link-config.model';
import { FindListOptions } from '../data/find-list-options.model';
import { PaginatedList } from '../data/paginated-list.model';

@Injectable()
@dataService(SUBMISSION_DEFINITION_TYPE)
export class SubmissionDefinitionsConfigService extends ConfigService {
  constructor(
    protected requestService: RequestService,
    protected rdbService: RemoteDataBuildService,
    protected store: Store<CoreState>,
    protected objectCache: ObjectCacheService,
    protected halService: HALEndpointService,
    protected notificationsService: NotificationsService,
    protected http: HttpClient,
    protected comparator: DefaultChangeAnalyzer<SubmissionFormsModel>
  ) {
    super(requestService, rdbService, null, objectCache, halService, notificationsService, http, comparator, 'submissiondefinitions');
  }

  findAll(options: FindListOptions = {}, reRequestOnStale = true, ...linksToFollow: FollowLinkConfig<ConfigObject>[]): Observable<RemoteData<PaginatedList<ConfigObject>>> {
    return super.findAll(options, reRequestOnStale, ...linksToFollow);
  }
}
