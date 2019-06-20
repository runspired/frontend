import Component from '@ember/component';
import ArrayProxy from '@ember/array/proxy';
import { computed } from '@ember/object';
import { gt } from '@ember/object/computed';
import { inject as service } from '@ember/service';
import { Promise } from 'rsvp';
import PromiseProxyMixin from '@ember/object/promise-proxy-mixin';

export default Component.extend({
  currentUser: service(),
  store: service(),

  classNameBindings: [':unassigned-students-summary', ':small-component', 'alert'],
  tagName: 'div',

  schoolId: null,
  schools: null,

  alert: gt('unassignedStudentsProxy.length', 0),

  selectedSchool: computed('currentUser', 'schoolId', async function() {
    const schools = this.schools;
    const currentUser = this.currentUser;
    const schoolId = this.schoolId;

    if (schoolId) {
      return schools.findBy('id', schoolId);
    }
    const user = await currentUser.get('model');
    const school = await user.get('school');
    const defaultSchool = schools.findBy('id', school.get('id'));
    if (defaultSchool) {
      return defaultSchool;
    }

    return schools.get('firstObject');
  }),

  unassignedStudents: computed('selectedSchool', function() {
    return new Promise(resolve => {
      this.selectedSchool.then(school => {
        this.store.query('user', {
          filters: {
            roles: [4],
            school: school.get('id'),
            cohorts: null,
            enabled: true
          }
        }).then(students => {
          resolve(students);
        });
      });
    });
  }),

  //temporary solution until the classNameBindings can be promise aware
  unassignedStudentsProxy: computed('unassignedStudents', function() {
    let ap = ArrayProxy.extend(PromiseProxyMixin);
    return ap.create({
      promise: this.unassignedStudents
    });
  }),

  actions: {
    changeSelectedSchool(schoolId) {
      this.set('schoolId', schoolId);
    }
  }
});
