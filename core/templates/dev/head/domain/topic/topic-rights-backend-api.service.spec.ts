// Copyright 2018 The Oppia Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Unit tests for TopicRightsBackendApiService.
 */

// TODO(#7222): Remove the following block of unnnecessary imports once
// the code corresponding to the spec is upgraded to Angular 8.
import { UpgradedServices } from 'services/UpgradedServices';
// ^^^ This block is to be removed.

require('domain/topic/topic-rights-backend-api.service.ts');
require('services/csrf-token.service.ts');

describe('Topic rights backend API service', function() {
  var TopicRightsBackendApiService = null;
  var $rootScope = null;
  var $scope = null;
  var $httpBackend = null;
  var CsrfService = null;

  beforeEach(angular.mock.module('oppia'));
  beforeEach(
    angular.mock.module('oppia', GLOBALS.TRANSLATOR_PROVIDER_FOR_TESTS));
  beforeEach(angular.mock.module('oppia', function($provide) {
    var ugs = new UpgradedServices();
    for (let [key, value] of Object.entries(ugs.upgradedServices)) {
      $provide.value(key, value);
    }
  }));

  beforeEach(angular.mock.inject(function($injector, $q) {
    TopicRightsBackendApiService = $injector.get(
      'TopicRightsBackendApiService');
    CsrfService = $injector.get('CsrfTokenService');
    $rootScope = $injector.get('$rootScope');
    $scope = $rootScope.$new();
    $httpBackend = $injector.get('$httpBackend');

    spyOn(CsrfService, 'getTokenAsync').and.callFake(function() {
      var deferred = $q.defer();
      deferred.resolve('sample-csrf-token');
      return deferred.promise;
    });
  }));

  afterEach(function() {
    $httpBackend.verifyNoOutstandingExpectation();
    $httpBackend.verifyNoOutstandingRequest();
  });

  it('should successfully publish and unpublish a topic', function() {
    var successHandler = jasmine.createSpy('success');
    var failHandler = jasmine.createSpy('fail');

    $httpBackend.expect(
      'PUT', '/rightshandler/change_topic_status/0').respond(200);
    TopicRightsBackendApiService.publishTopic('0').then(
      successHandler, failHandler);
    $httpBackend.flush();
    $rootScope.$digest();

    expect(successHandler).toHaveBeenCalled();
    expect(failHandler).not.toHaveBeenCalled();

    $httpBackend.expect(
      'PUT', '/rightshandler/change_topic_status/0').respond(200);
    TopicRightsBackendApiService.unpublishTopic('0').then(
      successHandler, failHandler);
    $httpBackend.flush();
    $rootScope.$digest();

    expect(successHandler).toHaveBeenCalled();
    expect(failHandler).not.toHaveBeenCalled();
  });

  it('should call the provided fail handler on HTTP failure', function() {
    var successHandler = jasmine.createSpy('success');
    var failHandler = jasmine.createSpy('fail');

    $httpBackend.expect(
      'PUT', '/rightshandler/change_topic_status/0').respond(
      404, 'Topic doesn\'t not exist.');
    TopicRightsBackendApiService.publishTopic('0').then(
      successHandler, failHandler);
    $httpBackend.flush();
    $rootScope.$digest();

    expect(successHandler).not.toHaveBeenCalled();
    expect(failHandler).toHaveBeenCalled();
  });

  it('should report an uncached topic rights after caching it', function() {
    var successHandler = jasmine.createSpy('success');
    var failHandler = jasmine.createSpy('fail');

    $httpBackend.expect(
      'GET', '/rightshandler/get_topic_rights/0').respond(200, {
      topic_id: 0,
      topic_is_published: true,
      manager_ids: ['user_id']
    });
    // The topic should not currently be cached.
    expect(TopicRightsBackendApiService.isCached('0')).toBe(false);

    // A new topic should be fetched from the backend. Also,
    // the returned topic should match the expected topic object.
    TopicRightsBackendApiService.loadTopicRights('0').then(
      successHandler, failHandler);

    $httpBackend.flush();
    $rootScope.$digest();

    expect(successHandler).toHaveBeenCalled();
    expect(failHandler).not.toHaveBeenCalled();
    // It should now be cached.
    expect(TopicRightsBackendApiService.isCached('0')).toBe(true);
  });

  it('should report a cached topic rights after caching it', function() {
    var successHandler = jasmine.createSpy('success');
    var failHandler = jasmine.createSpy('fail');

    // The topic should not currently be cached.
    expect(TopicRightsBackendApiService.isCached('0')).toBe(false);

    // Cache a topic rights object.
    TopicRightsBackendApiService.cacheTopicRights('0', {
      topic_id: 0,
      topic_is_published: true,
      manager_ids: ['user_id']
    });

    // It should now be cached.
    expect(TopicRightsBackendApiService.isCached('0')).toBe(true);

    // A new topic should not have been fetched from the backend. Also,
    // the returned topic should match the expected topic object.
    TopicRightsBackendApiService.loadTopicRights('0').then(
      successHandler, failHandler);

    // http://brianmcd.com/2014/03/27/
    // a-tip-for-angular-unit-tests-with-promises.html
    $rootScope.$digest();

    expect(successHandler).toHaveBeenCalledWith({
      topic_id: 0,
      topic_is_published: true,
      manager_ids: ['user_id']
    });
    expect(failHandler).not.toHaveBeenCalled();
  });
});
