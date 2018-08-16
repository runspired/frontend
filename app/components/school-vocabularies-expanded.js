/* eslint ember/order-in-components: 0 */
import { inject as service } from '@ember/service';
import Component from '@ember/component';
import { computed } from '@ember/object';
import { isPresent } from '@ember/utils';
const { notEmpty } = computed;

export default Component.extend({
  store: service(),
  school: null,
  canUpdateVocabulary: false,
  canUpdateTerm: false,
  canDeleteVocabulary: false,
  canDeleteTerm: false,
  canCreateVocabulary: false,
  canCreateTerm: false,
  tagName: 'section',
  classNames: ['school-vocabularies-expanded'],
  managedVocabularyId: null,
  managedTermId: null,
  managedVocabulary: null,
  managedTerm: null,
  isManaging: notEmpty('managedVocabulary'),
  showCollapsible: computed('isManaging', 'school.vocabularies.length', function(){
    const isManaging = this.get('isManaging');
    const school = this.get('school');
    const competencyIds = school.hasMany('vocabularies').ids();
    return competencyIds.length && ! isManaging;
  }),
  didReceiveAttrs(){
    this._super(...arguments);
    const managedVocabularyId = this.get('managedVocabularyId');
    const managedTermId = this.get('managedTermId');
    if(isPresent(managedVocabularyId)){
      this.get('school.vocabularies').then(vocabularies => {
        let managedVocabulary = vocabularies.findBy('id', managedVocabularyId);
        this.set('managedVocabulary', managedVocabulary);
        if(isPresent(managedTermId)){
          managedVocabulary.get('terms').then(terms => {
            let managedTerm = terms.findBy('id', managedTermId);
            this.set('managedTerm', managedTerm);
          });
        } else {
          this.set('managedTerm', null);
        }
      });
    } else {
      this.set('managedVocabulary', null);
    }
  },
  actions: {
    collapse(){
      const collapse = this.get('collapse');
      const setSchoolManagedVocabulary = this.get('setSchoolManagedVocabulary');
      const setSchoolManagedVocabularyTerm = this.get('setSchoolManagedVocabularyTerm');
      this.get('school.vocabularies').then(vocabularies => {
        if(vocabularies.get('length')){
          collapse();
          setSchoolManagedVocabulary(null);
          setSchoolManagedVocabularyTerm(null);
        }
      });
    },
    cancel(){
      const setSchoolManagedVocabulary = this.get('setSchoolManagedVocabulary');
      setSchoolManagedVocabulary(null);
      this.set('bufferedTerms', []);
    },
  }
});
