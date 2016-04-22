import destroyApp from '../../../helpers/destroy-app';
import moment from 'moment';
import {
  module,
  test
} from 'qunit';
import startApp from 'ilios/tests/helpers/start-app';
import {c as testgroup} from 'ilios/tests/helpers/test-groups';
import setupAuthentication from 'ilios/tests/helpers/setup-authentication';
import { openDatepicker } from 'ember-pikaday/helpers/pikaday';

var application;
var fixtures = {};
var url = '/courses/1/sessions/1';

module('Acceptance: Session - Offerings' + testgroup, {
  beforeEach: function() {
    application = startApp();
    fixtures.users =  [];

    fixtures.users.pushObject(setupAuthentication(application, {id: 4136, directedCourses: [1]}));
    server.create('school', {
      courses: [1],
      instructorGroups: [1,2],
      sessionTypes: [1],

    });
    server.create('program', {
      programYears: [1],
    });
    server.create('programYear', {
      cohort: 1
    });
    server.create('cohort', {
      courses: [1],
      learnerGroups: [1,2],
      programYear: 1
    });
    server.create('course', {
      sessions: [1],
      cohorts: [1],
      school: 1,
      directors: [4136]
    });
    server.create('sessionType', {
      school: 1
    });

    //users 2, 3
    fixtures.users.pushObjects(server.createList('user', 2, {
      instructorGroups: [1],
      learnerGroups: [1],
    }));
    //users 4,5
    fixtures.users.pushObjects(server.createList('user', 2, {
      instructorGroups: [2],
      learnerGroups: [2],
    }));
    //users 6,7
    fixtures.users.pushObjects(server.createList('user', 2, {
      instructedOfferings: [1],
      instructorGroups: [1]
    }));
    //users 8,9
    fixtures.users.pushObjects(server.createList('user', 2, {
      instructedOfferings: [1, 2],
    }));

    fixtures.instructorGroups = [];
    fixtures.instructorGroups.pushObject(server.create('instructorGroup', {
      users: [2,3,6,7],
      offerings: [1],
      school: 1
    }));
    fixtures.instructorGroups.pushObject(server.create('instructorGroup', {
      users: [4,5],
      offerings: [1, 2, 3],
      school: 1
    }));
    fixtures.learnerGroups = [];
    fixtures.learnerGroups.pushObject(server.create('learnerGroup', {
      users: [2,3],
      offerings: [1],
      cohort: 1,
    }));
    fixtures.learnerGroups.pushObject(server.create('learnerGroup', {
      users: [4,5],
      offerings: [1, 2, 3],
      cohort: 1,
    }));
    fixtures.offerings = [];
    let today = moment().hour(9);
    fixtures.today = today;
    fixtures.offerings.pushObject(server.create('offering', {
      session: 1,
      instructors: [6,7,8,9],
      instructorGroups: [1, 2],
      learnerGroups: [1, 2],
      startDate: today.format(),
      endDate: today.clone().add(1, 'hour').format(),
    }));
    fixtures.offerings.pushObject(server.create('offering', {
      session: 1,
      instructors: [8,9],
      instructorGroups: [2],
      learnerGroups: [2],
      startDate:today.clone().add(1, 'day').format(),
      endDate: today.clone().add(1, 'day').add(1, 'hour').format(),
    }));
    fixtures.offerings.pushObject(server.create('offering', {
      session: 1,
      instructorGroups: [2],
      learnerGroups: [2],
      instructors: [],
      startDate: today.clone().add(2, 'days').format(),
      endDate: today.clone().add(3, 'days').add(1, 'hour').format(),
    }));
    fixtures.session = server.create('session', {
      course: 1,
      offerings: [1, 2, 3],
    });
  },

  afterEach: function() {
    destroyApp(application);
  }
});

test('basics', function(assert) {
  assert.expect(2);
  visit(url);
  andThen(function() {
    let container = find('.session-offerings');
    let offeringTitle = 'Offerings (' + fixtures.offerings.length + ')';
    assert.equal(getElementText(find('.detail-title', container)), getText(offeringTitle));
    let dateBlocks = find('.offering-block', container);

    assert.equal(dateBlocks.length, fixtures.offerings.length, 'Date blocks count equals offerings fixtures count');
  });
});

test('single day offering dates', function(assert) {
  assert.expect(8);
  visit(url);
  andThen(function() {
    let dateBlocks = find('.session-offerings .offering-block');

    //the first two offerings are single date offerings
    for(let i = 0; i < 2; i++){
      let block = dateBlocks.eq(i);
      let offering = fixtures.offerings[i];
      assert.equal(getElementText(find('.offering-block-date-dayofweek', block)), getText(moment(offering.startDate).format('dddd')));
      assert.equal(getElementText(find('.offering-block-date-dayofmonth', block)), getText(moment(offering.startDate).format('MMMM Do')));
      assert.equal(getElementText(find('.offering-block-time-time-starttime', block)), getText('Starts:' + moment(offering.startDate).format('LT')));
      assert.equal(getElementText(find('.offering-block-time-time-endtime', block)), getText('Ends:' + moment(offering.endDate).format('LT')));
    }
  });
});

test('multiday offering dates', function(assert) {
  assert.expect(1);
  visit(url);
  andThen(function() {
    let dateBlocks = find('.session-offerings .offering-block');

    //the third offering is multiday
    for(let i = 2; i < 3; i++){
      let block = dateBlocks.eq(i);
      let offering = fixtures.offerings[i];
      let expectedText = 'Multiday' +
        'Starts' + moment(offering.startDate).format('dddd MMMM Do [@] LT') +
        'Ends' + moment(offering.endDate).format('dddd MMMM Do [@] LT');
      assert.equal(getElementText(find('.multiday-offering-block-time-time', block)), getText(expectedText));
    }
  });
});

test('learner groups', function(assert) {
  assert.expect(7);
  visit(url);
  andThen(function() {
    let container = find('.session-offerings');
    let dateBlocks = find('.offering-block', container);
    for(let i = 0; i < fixtures.offerings.length; i++){
      let learnerGroups = find('.offering-block-time-offering-learner_groups li', dateBlocks.eq(i));
      let offeringLearnerGroups = fixtures.offerings[i].learnerGroups;
      assert.equal(learnerGroups.length, offeringLearnerGroups.length);
      for(let i = 0; i < offeringLearnerGroups.length; i++){
        let learnerGroup = fixtures.learnerGroups[offeringLearnerGroups[i] - 1];
        assert.equal(getElementText(learnerGroups.eq(i)), getText(learnerGroup.title));
      }
    }
  });
});

test('instructors', function(assert) {
  assert.expect(17);
  visit(url);
  andThen(function() {
    let container = find('.session-offerings');
    let dateBlocks = find('.offering-block', container);
    var extractInstructorsFromOffering = function(offeringId){
      let offering = fixtures.offerings[offeringId];
      let arr = [];
      offering.instructors.forEach(function(id){
        arr.push(id);
      });
      offering.instructorGroups.forEach(function(groupId){
        let instructorGroup = fixtures.instructorGroups[groupId -1];
        instructorGroup.users.forEach(function(id){
          arr.push(id);
        });
      });

      return arr.uniq().sort();
    };
    for(let i = 0; i < fixtures.offerings.length; i++){
      let instructors = find('.offering-block-time-offering-instructors li', dateBlocks.eq(i));
      let offeringInstructors = extractInstructorsFromOffering(i);
      assert.equal(instructors.length, offeringInstructors.length);
      for(let i = 0; i < offeringInstructors.length; i++){
        let instructor = fixtures.users[offeringInstructors[i] - 1];
        const middleInitial = instructor.middleName.charAt(0).toUpperCase();
        const instructorTitle = `${instructor.firstName} ${middleInitial}. ${instructor.lastName}`;
        assert.equal(getElementText(instructors.eq(i)), getText(instructorTitle));
      }
    }
  });
});

test('confirm removal message', function(assert) {
  assert.expect(2);
  visit(url);
  andThen(function() {
    let offering = find('.offering-block-time-offering:eq(0)');
    click('.offering-block-time-offering-actions .remove', offering).then(function(){
      assert.ok(offering.hasClass('offering-confirm-removal'));
      assert.equal(getElementText(find('.confirm-message', offering)), getText('Are you sure you want to delete this offering with 2 learner groups? This action cannot be undone. Yes Cancel'));
    });
  });
});

test('remove offering', function(assert) {
  assert.expect(2);
  visit(url);
  andThen(function() {

    let offerings = find('.offering-block-time-offering');
    assert.equal(offerings.length, 3);
    let offering = find('.offering-block-time-offering').eq(0);
    click('.offering-block-time-offering-actions .remove', offering).then(function(){
      click('.confirm-message .remove', offering).then(function(){
        assert.equal(find('.offering-block-time-offering').length, 2);
      });
    });
  });
});

test('cancel remove offering', function(assert) {
  assert.expect(2);
  visit(url);
  andThen(function() {
    let offerings = find('.offering-block-time-offering');
    assert.equal(offerings.length, 3);
    let offering = find('.offering-block-time-offering').eq(0);
    click('.offering-block-time-offering-actions .remove', offering).then(function(){
      click('.cancel', offering).then(function(){
        assert.equal(find('.offering-block-time-offering').length, 3);
      });
    });
  });
});

test('users can create a new offering or small groups (single and multi-day)', function(assert) {
  assert.expect(23);

  const expandButton = '.session-offerings .expand-button';
  const multiDayButton = '.session-offerings .single-multi-day .switch-label';
  const offeringButton = '.session-offerings .second-button';

  const startDateInput = '.offering-startdate-picker input';
  const endDateInput = '.offering-enddate input';
  const startTimes = '.starttime select';
  const endTimes = '.endtime select';
  const location = '.room input';
  const learnerGroupOne = '.selectable li:first';
  const learnerGroupTwo = '.selectable li:last';
  const searchBox = '.search-box:last input';
  const searchBoxOption = '.livesearch-user-name:first';
  const createButton = '.done';

  const dayOfWeek = '.offering-block-date-dayofweek:first';
  const dayOfMonth = '.offering-block-date-dayofmonth:first';
  const startTime = '.offering-block-time-time-starttime:first';
  const endTime = '.offering-block-time-time-endtime:first';
  const learnerGroup1 = '.offering-block-time-offering-learner_groups ul li:eq(0)';
  const learnerGroup2 = '.offering-block-time-offering-learner_groups ul li:eq(1)';
  const learnerGroup3 = '.offering-block-time-offering-learner_groups ul li:eq(2)';
  const learnerGroup4 = '.offering-block-time-offering-learner_groups ul li:eq(3)';
  const room = '.offering-block-time-offering-location:first';
  const instructor = '.offering-block-time-offering-instructors ul li:eq(0)';

  const multiDayDesc = '.multiday-offering-block-time-time-description:first';
  const multiDayStarts = '.multiday-offering-block-time-time-starts:first';
  const multiDayEnds = '.multiday-offering-block-time-time-ends:first';

  visit(url);
  click(expandButton);
  click(offeringButton);
  andThen(() => {
    let container = find('.session-offerings');

    let startDateInteractor = openDatepicker(find(startDateInput, container));
    startDateInteractor.selectDate(new Date(2011, 8, 11));

    let startBoxes = find(startTimes, container);
    pickOption(startBoxes[0], '2', assert);
    pickOption(startBoxes[1], '15', assert);

    let endBoxes = find(endTimes, container);
    pickOption(endBoxes[0], '3', assert);
    pickOption(endBoxes[1], '23', assert);
    pickOption(endBoxes[2], 'pm', assert);

  });

  fillIn(location, 'Rm. 111');
  click(learnerGroupOne);
  click(learnerGroupTwo);
  fillIn(searchBox, 'guy');
  click(searchBoxOption);
  click(createButton);
  andThen(() => {
    assert.equal(find(dayOfWeek).text(), 'Sunday', 'day of the week is correct');
    assert.equal(find(dayOfMonth).text(), 'September 11th', 'day of month is correct');
    assert.equal(find(startTime).text().trim(), 'Starts: 2:15 AM', 'start time is correct');
    assert.equal(find(endTime).text().trim(), 'Ends: 3:23 PM', 'end time is correct');
    assert.equal(find(learnerGroup1).text(), 'learner group 0', 'correct learner group is picked');
    assert.equal(find(learnerGroup2).text(), 'learner group 1', 'correct learner group is picked');
    assert.equal(find(room).text(), 'Rm. 111', 'location/room is correct');
    assert.equal(find(instructor).text(), '0 guy M. Mc0son', 'instructor is correct');
  });

  click(expandButton);
  click(multiDayButton);
  andThen(() => {
    let container = find('.session-offerings');

    let startDateInteractor = openDatepicker(find(startDateInput, container));
    startDateInteractor.selectDate(new Date(2011, 8, 11));

    let endDateInteractor = openDatepicker(find(endDateInput, container));
    endDateInteractor.selectDate(new Date(2011, 10, 11));

    let startBoxes = find(startTimes, container);
    pickOption(startBoxes[0], '2', assert);
    pickOption(startBoxes[1], '15', assert);

    let endBoxes = find(endTimes, container);
    pickOption(endBoxes[0], '3', assert);
    pickOption(endBoxes[1], '23', assert);
    pickOption(endBoxes[2], 'pm', assert);
  });

  click(learnerGroupOne);
  click(learnerGroupTwo);
  click(createButton);
  andThen(() => {
    assert.equal(find(multiDayDesc).text().trim(), 'Multiday', 'multi-day statement is correct');
    assert.equal(find(multiDayStarts).text().trim(), 'Starts Sunday September 11th @ 2:15 AM', 'multi-day statement is correct');
    assert.equal(find(multiDayEnds).text().trim(), 'Ends Friday November 11th @ 3:23 PM', 'multi-day statement is correct');
    assert.equal(find(learnerGroup3).text(), 'learner group 0', 'learner group is correct');
    assert.equal(find(learnerGroup4).text(), 'learner group 1', 'learner group is correct');
  });
});

test('users can edit existing offerings (single & multi-day)', function(assert) {
  assert.expect(27);

  const editButton = '.offering-detail-box i:first';
  const multiDayButton = '.ismultiday .switch-label';
  const startDateInput = '.startdate input';
  const endDateInput = '.enddate input';
  const startTimes = '.starttime select';
  const endTimes = '.endtime select';
  const location = '.room input';

  const selectedLearnerGroup = '.selected-subgroup-style:first';
  const removeInstructorFirst = '.session-offerings .removable-list li:first i';
  const removeInstructorLast = '.session-offerings .removable-list li:last i';

  const learnerGroupOne = '.selectable li:first';
  const searchBox = '.search-box:last input';
  const searchBoxOption = '.live-search li:contains("instructor group 0")';
  const createButton = '.done';

  const dayOfWeek = '.offering-block-date-dayofweek:first';
  const dayOfMonth = '.offering-block-date-dayofmonth:first';
  const startTime = '.offering-block-time-time-starttime:first';
  const endTime = '.offering-block-time-time-endtime:first';
  const learnerGroup1 = '.offering-block-time-offering-learner_groups ul li:eq(0)';
  const learnerGroup2 = '.offering-block-time-offering-learner_groups ul li:eq(1)';
  const room = '.offering-block-time-offering-location:first';
  const instructor1 = '.offering-block-time-offering-instructors ul li:eq(0)';
  const instructor2 = '.offering-block-time-offering-instructors ul li:eq(1)';
  const instructor3 = '.offering-block-time-offering-instructors ul li:eq(2)';
  const instructor4 = '.offering-block-time-offering-instructors ul li:eq(3)';
  const instructor5 = '.offering-block-time-offering-instructors ul li:eq(4)';

  const multiDayDesc = '.multiday-offering-block-time-time-description:first';
  const multiDayStarts = '.multiday-offering-block-time-time-starts:first';
  const multiDayEnds = '.multiday-offering-block-time-time-ends:first';

  visit(url);
  click(editButton);
  andThen(() => {
    let container = find('.session-offerings');

    let interactor = openDatepicker(find(startDateInput, container));
    interactor.selectDate(new Date(2011, 9, 5));

    let startBoxes = find(startTimes, container);
    pickOption(startBoxes[0], '11', assert);
    pickOption(startBoxes[1], '45', assert);

    let endBoxes = find(endTimes, container);
    pickOption(endBoxes[0], '5', assert);
    pickOption(endBoxes[1], '55', assert);
    pickOption(endBoxes[2], 'pm', assert);
  });

  fillIn(location, 'Rm. 111');
  click(selectedLearnerGroup);
  click(removeInstructorFirst);
  click(removeInstructorLast);
  click(createButton);
  andThen(() => {
    assert.equal(find(dayOfWeek).text(), 'Wednesday', 'day of the week is correct');
    assert.equal(find(dayOfMonth).text(), 'October 5th', 'day of month is correct');
    assert.equal(find(startTime).text().trim(), 'Starts: 11:45 AM', 'start time is correct');
    assert.equal(find(endTime).text().trim(), 'Ends: 5:55 PM', 'end time is correct');
    assert.equal(find(learnerGroup1).text(), 'learner group 1', 'correct learner group is picked');
    assert.equal(find(room).text(), 'Rm. 111', 'location/room is correct');
    assert.equal(find(instructor1).text(), '3 guy M. Mc3son', 'instructor is correct');
    assert.equal(find(instructor2).text(), '4 guy M. Mc4son', 'instructor is correct');
    assert.equal(find(instructor3).text(), '5 guy M. Mc5son', 'instructor is correct');
    assert.equal(find(instructor4).text(), '6 guy M. Mc6son', 'instructor is correct');
    assert.equal(find(instructor5).text(), '7 guy M. Mc7son', 'instructor is correct');
  });

  click(editButton);
  click(multiDayButton);
  andThen(() => {
    let container = find('.session-offerings');

    let interactor = openDatepicker(find(endDateInput, container).eq(0));
    interactor.selectDate(new Date(2011, 11, 25));

    let endBoxes = find(endTimes, container);
    pickOption(endBoxes[0], '7', assert);
    pickOption(endBoxes[1], '30', assert);
  });

  click(learnerGroupOne);
  click(removeInstructorFirst);
  click(removeInstructorFirst);
  click(removeInstructorFirst);
  click(removeInstructorFirst);
  fillIn(searchBox, 'group');
  click(searchBoxOption);
  click(createButton);
  andThen(() => {

    assert.equal(find(multiDayDesc).text().trim(), 'Multiday', 'multi-day statement is correct');
    assert.equal(find(multiDayStarts).text().trim(), 'Starts Wednesday October 5th @ 11:45 AM', 'multi-day statement is correct');
    assert.equal(find(multiDayEnds).text().trim(), 'Ends Sunday December 25th @ 7:30 PM', 'multi-day statement is correct');
    assert.equal(find(learnerGroup1).text(), 'learner group 1', 'learner group is correct');
    assert.equal(find(learnerGroup2).text(), 'learner group 0', 'learner group is correct');
    assert.equal(find(instructor1).text(), '1 guy M. Mc1son', 'instructor is correct');
    assert.equal(find(instructor2).text(), '2 guy M. Mc2son', 'instructor is correct');
    assert.equal(find(instructor3).text(), '5 guy M. Mc5son', 'instructor is correct');
    assert.equal(find(instructor4).text(), '6 guy M. Mc6son', 'instructor is correct');
  });
});


test('users can create recurring small groups', function(assert) {
  assert.expect(29);

  const expandButton = '.session-offerings .expand-button';
  const makeRecurringButton = '.make-recurring-slider .switch-label';
  const makeRecurringInput = '.make-recurring-input';

  const startDateInput = '.offering-startdate-picker input';
  const startTimes = '.starttime select';
  const endTimes = '.endtime select';
  const learnerGroupOne = '.selectable li:first';
  const learnerGroupTwo = '.selectable li:last';
  const createButton = '.done';

  const daysOfWeek = '.offering-block-date-dayofweek';
  const daysOfMonth = '.offering-block-date-dayofmonth';
  const startsTime = '.offering-block-time-time-starttime';
  const endsTime = '.offering-block-time-time-endtime';
  const learnerGroups = '.offering-block-time-offering-learner_groups ul li';

  visit(url);
  click(expandButton);
  andThen(() => {
    let container = find('.session-offerings');

    let startDateInteractor = openDatepicker(find(startDateInput, container));
    startDateInteractor.selectDate(new Date(2015, 4, 22));

    let startBoxes = find(startTimes, container);
    pickOption(startBoxes[0], '2', assert);
    pickOption(startBoxes[1], '15', assert);

    let endBoxes = find(endTimes, container);
    pickOption(endBoxes[0], '3', assert);
    pickOption(endBoxes[1], '23', assert);
    pickOption(endBoxes[2], 'pm', assert);
  });

  click(makeRecurringButton);
  fillIn(makeRecurringInput, '4');
  click(learnerGroupOne);
  click(learnerGroupTwo);

  click(createButton);
  andThen(() => {
    assert.equal(find(daysOfWeek).eq(0).text(), 'Friday', 'first day of the week is correct');
    assert.equal(find(daysOfWeek).eq(1).text(), 'Friday', 'second day of the week is correct');
    assert.equal(find(daysOfWeek).eq(2).text(), 'Friday', 'third day of the week is correct');
    assert.equal(find(daysOfWeek).eq(3).text(), 'Friday', 'fourth day of the week is correct');

    assert.equal(find(daysOfMonth).eq(0).text(), 'May 22nd', 'first day of month is correct');
    assert.equal(find(daysOfMonth).eq(1).text(), 'May 29th', 'second day of month is correct');
    assert.equal(find(daysOfMonth).eq(2).text(), 'June 5th', 'third day of month is correct');
    assert.equal(find(daysOfMonth).eq(3).text(), 'June 12th', 'fourth day of month is correct');

    assert.equal(find(startsTime).eq(0).text().trim(), 'Starts: 2:15 AM', 'first start time is correct');
    assert.equal(find(startsTime).eq(1).text().trim(), 'Starts: 2:15 AM', 'second start time is correct');
    assert.equal(find(startsTime).eq(2).text().trim(), 'Starts: 2:15 AM', 'third start time is correct');
    assert.equal(find(startsTime).eq(3).text().trim(), 'Starts: 2:15 AM', 'fourth start time is correct');

    assert.equal(find(endsTime).eq(0).text().trim(), 'Ends: 3:23 PM', 'first end time is correct');
    assert.equal(find(endsTime).eq(1).text().trim(), 'Ends: 3:23 PM', 'second end time is correct');
    assert.equal(find(endsTime).eq(2).text().trim(), 'Ends: 3:23 PM', 'third end time is correct');
    assert.equal(find(endsTime).eq(3).text().trim(), 'Ends: 3:23 PM', 'fourth end time is correct');

    assert.equal(find(learnerGroups).eq(0).text(), 'learner group 0', 'first correct learner group is picked');
    assert.equal(find(learnerGroups).eq(1).text(), 'learner group 1', 'first correct learner group is picked');
    assert.equal(find(learnerGroups).eq(2).text(), 'learner group 0', 'second correct learner group is picked');
    assert.equal(find(learnerGroups).eq(3).text(), 'learner group 1', 'second correct learner group is picked');
    assert.equal(find(learnerGroups).eq(4).text(), 'learner group 0', 'third correct learner group is picked');
    assert.equal(find(learnerGroups).eq(5).text(), 'learner group 1', 'third correct learner group is picked');
    assert.equal(find(learnerGroups).eq(6).text(), 'learner group 0', 'fourth correct learner group is picked');
    assert.equal(find(learnerGroups).eq(7).text(), 'learner group 1', 'fourth correct learner group is picked');
  });
});

test('users can create recurring single offerings', function(assert) {
  assert.expect(29);

  const expandButton = '.session-offerings .expand-button';
  const makeRecurringButton = '.make-recurring-slider .switch-label';
  const makeRecurringInput = '.make-recurring-input ';
  const offeringButton = '.second-button';

  const startDateInput = '.offering-startdate-picker input';
  const startTimes = '.starttime select';
  const endTimes = '.endtime select';
  const learnerGroupOne = '.selectable li:first';
  const learnerGroupTwo = '.selectable li:last';
  const createButton = '.done';

  const daysOfWeek = '.offering-block-date-dayofweek';
  const daysOfMonth = '.offering-block-date-dayofmonth';
  const startsTime = '.offering-block-time-time-starttime';
  const endsTime = '.offering-block-time-time-endtime';
  const learnerGroups = '.offering-block-time-offering-learner_groups ul li';

  visit(url);
  click(expandButton);
  click(offeringButton);
  andThen(() => {
    let container = find('.session-offerings');

    let startDateInteractor = openDatepicker(find(startDateInput, container));
    startDateInteractor.selectDate(new Date(2015, 4, 22));

    let startBoxes = find(startTimes, container);
    pickOption(startBoxes[0], '2', assert);
    pickOption(startBoxes[1], '15', assert);

    let endBoxes = find(endTimes, container);
    pickOption(endBoxes[0], '3', assert);
    pickOption(endBoxes[1], '23', assert);
    pickOption(endBoxes[2], 'pm', assert);
  });

  click(makeRecurringButton);
  fillIn(makeRecurringInput, '4');
  click(learnerGroupOne);
  click(learnerGroupTwo);

  click(createButton);
  andThen(() => {
    assert.equal(find(daysOfWeek).eq(0).text(), 'Friday', 'first day of the week is correct');
    assert.equal(find(daysOfWeek).eq(1).text(), 'Friday', 'second day of the week is correct');
    assert.equal(find(daysOfWeek).eq(2).text(), 'Friday', 'third day of the week is correct');
    assert.equal(find(daysOfWeek).eq(3).text(), 'Friday', 'fourth day of the week is correct');

    assert.equal(find(daysOfMonth).eq(0).text(), 'May 22nd', 'first day of month is correct');
    assert.equal(find(daysOfMonth).eq(1).text(), 'May 29th', 'second day of month is correct');
    assert.equal(find(daysOfMonth).eq(2).text(), 'June 5th', 'third day of month is correct');
    assert.equal(find(daysOfMonth).eq(3).text(), 'June 12th', 'fourth day of month is correct');

    assert.equal(find(startsTime).eq(0).text().trim(), 'Starts: 2:15 AM', 'first start time is correct');
    assert.equal(find(startsTime).eq(1).text().trim(), 'Starts: 2:15 AM', 'second start time is correct');
    assert.equal(find(startsTime).eq(2).text().trim(), 'Starts: 2:15 AM', 'third start time is correct');
    assert.equal(find(startsTime).eq(3).text().trim(), 'Starts: 2:15 AM', 'fourth start time is correct');

    assert.equal(find(endsTime).eq(0).text().trim(), 'Ends: 3:23 PM', 'first end time is correct');
    assert.equal(find(endsTime).eq(1).text().trim(), 'Ends: 3:23 PM', 'second end time is correct');
    assert.equal(find(endsTime).eq(2).text().trim(), 'Ends: 3:23 PM', 'third end time is correct');
    assert.equal(find(endsTime).eq(3).text().trim(), 'Ends: 3:23 PM', 'fourth end time is correct');

    assert.equal(find(learnerGroups).eq(0).text(), 'learner group 0', 'first correct learner group is picked');
    assert.equal(find(learnerGroups).eq(1).text(), 'learner group 1', 'first correct learner group is picked');
    assert.equal(find(learnerGroups).eq(2).text(), 'learner group 0', 'second correct learner group is picked');
    assert.equal(find(learnerGroups).eq(3).text(), 'learner group 1', 'second correct learner group is picked');
    assert.equal(find(learnerGroups).eq(4).text(), 'learner group 0', 'third correct learner group is picked');
    assert.equal(find(learnerGroups).eq(5).text(), 'learner group 1', 'third correct learner group is picked');
    assert.equal(find(learnerGroups).eq(6).text(), 'learner group 0', 'fourth correct learner group is picked');
    assert.equal(find(learnerGroups).eq(7).text(), 'learner group 1', 'fourth correct learner group is picked');

  });
});

test('recurring start date is default day and cannot be changes', function(assert) {
  assert.expect(14);

  const expandButton = '.session-offerings .expand-button';
  const makeRecurringButton = '.make-recurring-slider .switch-label';
  const offeringButton = '.second-button';

  const startDateInput = '.offering-startdate-picker input';
  const recurringInputs = '.make-recurring-days input';

  visit(url);
  click(expandButton);
  click(offeringButton);
  andThen(() => {
    let container = find('.session-offerings');

    let startDateInteractor = openDatepicker(find(startDateInput, container));
    startDateInteractor.selectDate(new Date(2015, 4, 22));

  });

  click(makeRecurringButton);

  andThen(() => {
    let inputs = find(recurringInputs);
    assert.ok(!inputs.eq(0).prop('disabled'));
    assert.ok(!inputs.eq(0).prop('checked'));
    assert.ok(!inputs.eq(1).prop('disabled'));
    assert.ok(!inputs.eq(1).prop('checked'));
    assert.ok(!inputs.eq(2).prop('disabled'));
    assert.ok(!inputs.eq(2).prop('checked'));
    assert.ok(!inputs.eq(3).prop('disabled'));
    assert.ok(!inputs.eq(3).prop('checked'));
    assert.ok(!inputs.eq(4).prop('disabled'));
    assert.ok(!inputs.eq(4).prop('checked'));
    assert.ok(inputs.eq(5).prop('disabled'));
    assert.ok(inputs.eq(5).prop('checked'));
    assert.ok(!inputs.eq(6).prop('disabled'));
    assert.ok(!inputs.eq(6).prop('checked'));
  });
});
