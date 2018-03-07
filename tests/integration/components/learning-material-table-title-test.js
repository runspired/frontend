import EmberObject from '@ember/object';
import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { render } from '@ember/test-helpers';
import hbs from 'htmlbars-inline-precompile';

module('Integration | Component | learning material table title', function(hooks) {
  setupRenderingTest(hooks);

  test('it renders with a type icon', async function(assert) {
    const row = EmberObject.create({
      learningMaterial: EmberObject.create({
        type: 'file',
        mimetype: 'application/pdf'
      })
    });
    const i = 'i';
    this.set('row', row);
    await render(hbs`{{learning-material-table-title value='test' row=row}}`);

    assert.equal(this.$().text().trim(), 'test');
    assert.ok(this.$(i).hasClass('fa-file-pdf-o'));
  });
});
