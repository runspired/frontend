import LiveSearchItemMixin from 'ilios/mixins/live-search-item';
import { module, test } from 'qunit';
import Ember from 'ember';

module('LiveSearchItemMixin');

// Replace this with your real tests.
test('it works', function(assert) {
  var LiveSearchItemObject = Ember.Object.extend(LiveSearchItemMixin);
  var subject = LiveSearchItemObject.create();
  assert.ok(subject);
});
