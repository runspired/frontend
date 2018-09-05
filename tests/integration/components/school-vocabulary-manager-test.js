import EmberObject from '@ember/object';
import RSVP from 'rsvp';
import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { render } from '@ember/test-helpers';
import hbs from 'htmlbars-inline-precompile';

const { resolve } = RSVP;

module('Integration | Component | school vocabulary manager', function(hooks) {
  setupRenderingTest(hooks);

  test('it renders', async function(assert) {
    assert.expect(4);
    let vocabulary = EmberObject.create({
      title: 'fake vocab',
      terms: resolve([
        { title: 'first', isTopLevel: true, isNew: false, isDeleted: false, active: false },
        { title: 'second', isTopLevel: true, isNew: false, isDeleted: false, active: true },
      ])
    });

    this.set('vocabulary', vocabulary);
    this.actions.nothing = parseInt;
    await render(hbs`{{school-vocabulary-manager
      vocabulary=vocabulary
      manageTerm=(action 'nothing')
      manageVocabulary=(action 'nothing')
    }}`);

    const all = '.breadcrumbs span:eq(0)';
    const vocab = '.breadcrumbs span:eq(1)';

    assert.equal(this.$(all).text().trim(), 'All Vocabularies');
    assert.equal(this.$(vocab).text().trim(), vocabulary.title);
    assert.equal(this.$('.terms ul li:eq(0)').text().trim(), 'first (inactive)');
    assert.equal(this.$('.terms ul li:eq(1)').text().trim(), 'second');
  });
});
