import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import PermissionChecker from 'ilios/classes/permission-checker';
import { use } from 'ember-could-get-used-to-this';
import { dropTask } from 'ember-concurrency';
import ResolveAsyncValue from 'ilios-common/classes/resolve-async-value';
import { action } from '@ember/object';
import { inject as service } from '@ember/service';
import { all, map } from 'rsvp';

export default class LearnerGroupsListItemComponent extends Component {
  @service iliosConfig;
  @service dataLoader;
  @tracked showRemoveConfirmation = false;
  @tracked showCopyConfirmation = false;
  @tracked areCoursesLoaded = false;

  @use school = new ResolveAsyncValue(() => [
    this.args.learnerGroup.get('cohort.programYear.program.school'),
  ]);

  @use canDeletePermission = new PermissionChecker(() => [
    'canDeleteLearnerGroup',
    this.args.learnerGroup,
  ]);
  @use hasLearnersInGroupOrSubgroups = new ResolveAsyncValue(() => [
    this.args.learnerGroup.hasLearnersInGroupOrSubgroups,
    true,
  ]);
  @use canCreatePermission = new PermissionChecker(() => ['canCreateLearnerGroup', this.school]);
  @use academicYearCrossesCalendarYearBoundaries = new ResolveAsyncValue(() => [
    this.iliosConfig.itemFromConfig('academicYearCrossesCalendarYearBoundaries'),
    false,
  ]);

  @use courses = new ResolveAsyncValue(() => [this.getCoursesForGroup(this.args.learnerGroup)]);

  get canDelete() {
    return this.canDeletePermission && !this.hasLearnersInGroupOrSubgroups;
  }

  get canCreate() {
    return this.school && this.canCreatePermission;
  }

  async getCoursesForGroup(learnerGroup) {
    const offerings = (await learnerGroup.offerings).toArray();
    const ilms = (await learnerGroup.ilmSessions).toArray();
    const arr = [].concat(offerings, ilms);

    const sessions = await Promise.all(arr.mapBy('session'));
    const filteredSessions = sessions.filter(Boolean).uniq();
    const courses = await Promise.all(filteredSessions.mapBy('course'));
    const children = (await learnerGroup.children).toArray();
    const childCourses = await map(children, async (child) => {
      return await this.getCoursesForGroup(child);
    });

    return [].concat(courses, childCourses.flat()).uniq();
  }

  @dropTask
  *remove() {
    const descendants = yield this.args.learnerGroup.allDescendants;
    yield all([...descendants.invoke('destroyRecord'), this.args.learnerGroup.destroyRecord()]);
  }

  @action
  copyWithLearners() {
    this.args.copyGroup(true, this.args.learnerGroup);
  }

  @action
  copyWithoutLearners() {
    this.args.copyGroup(false, this.args.learnerGroup);
  }

  @action
  showCopy() {
    this.showCopyConfirmation = true;
    this.showRemoveConfirmation = false;
  }

  @dropTask
  *showRemove() {
    yield this.dataLoader.loadCoursesForLearnerGroup(this.args.learnerGroup.id);
    this.areCoursesLoaded = true;
    this.showRemoveConfirmation = true;
    this.showCopyConfirmation = false;
  }
}
