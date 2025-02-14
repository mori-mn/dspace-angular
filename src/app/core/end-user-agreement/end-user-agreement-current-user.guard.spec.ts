import { EndUserAgreementCurrentUserGuard } from './end-user-agreement-current-user.guard';
import { EndUserAgreementService } from './end-user-agreement.service';
import { Router, UrlTree } from '@angular/router';
import { of, of as observableOf } from 'rxjs';

describe('EndUserAgreementGuard', () => {
  let guard: EndUserAgreementCurrentUserGuard;

  let endUserAgreementService: EndUserAgreementService;
  let router: Router;

  beforeEach(() => {
    endUserAgreementService = jasmine.createSpyObj('endUserAgreementService', {
      hasCurrentUserAcceptedAgreement: observableOf(true),
      isUserAgreementEnabled: of(true),
    });
    router = jasmine.createSpyObj('router', {
      navigateByUrl: {},
      parseUrl: new UrlTree(),
      createUrlTree: new UrlTree()
    });

    guard = new EndUserAgreementCurrentUserGuard(endUserAgreementService, router);
  });

  describe('canActivate', () => {
    describe('when the user has accepted the agreement', () => {
      it('should return true', (done) => {
        guard.canActivate(undefined, Object.assign({ url: 'redirect' })).subscribe((result) => {
          expect(result).toEqual(true);
          done();
        });
      });
    });

    describe('when the user hasn\'t accepted the agreement', () => {
      beforeEach(() => {
        (endUserAgreementService.hasCurrentUserAcceptedAgreement as jasmine.Spy).and.returnValue(observableOf(false));
      });

      it('should return a UrlTree', (done) => {
        guard.canActivate(undefined, Object.assign({ url: 'redirect' })).subscribe((result) => {
          expect(result).toEqual(jasmine.any(UrlTree));
          done();
        });
      });
    });
  });
});
