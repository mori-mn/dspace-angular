import { CommunityDataService } from '../../data/community-data.service';
import { Injectable } from '@angular/core';
import { Community } from '../community.model';
import { FollowLinkConfig } from '../../../shared/utils/follow-link-config.model';
import { EditDsoResolver } from './edit-dso.resolver';

/**
 * This class represents a resolver that requests a specific Community before the route is activated
 */
@Injectable()
export class EditCommunityResolver extends EditDsoResolver<Community> {
  constructor(
    protected communitydataService: CommunityDataService,
  ) {
    super(communitydataService);
  }

  getFollowLinks(): FollowLinkConfig<Community>[] {
    return [];
  }
}
