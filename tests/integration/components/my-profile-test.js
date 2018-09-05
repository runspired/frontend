import EmberObject from '@ember/object';
import RSVP from 'rsvp';
import Service from '@ember/service';
import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { render, settled } from '@ember/test-helpers';
import hbs from 'htmlbars-inline-precompile';
import moment from 'moment';
import { openDatepicker } from 'ember-pikaday/helpers/pikaday';

const { resolve } = RSVP;

module('Integration | Component | my profile', function(hooks) {
  setupRenderingTest(hooks);

  test('it renders', async function(assert) {
    const user = EmberObject.create({
      fullName: 'test name',
      isStudent: true,
      school: resolve(EmberObject.create({title: 'test school'})),
      primaryCohort: resolve(EmberObject.create({title: 'test cohort'})),
      secondaryCohorts: resolve([
        EmberObject.create({title: 'second cohort'}),
        EmberObject.create({title: 'a third cohort'}),
      ]),
    });

    this.set('user', user);
    this.set('nothing', parseInt);

    await render(
      hbs`{{my-profile user=user toggleShowCreateNewToken=(action nothing) toggleShowInvalidateTokens=(action nothing)}}`
    );

    assert.equal(this.$('.name').text().trim(), 'test name');
    assert.equal(this.$('.is-student').text().trim(), 'Student');

    assert.equal(this.$('[data-test-info] div:eq(0)').text().replace(/[\n]+/g, '').replace(/\s\s/g, '').trim(), 'Primary School:test school');
    assert.equal(this.$('[data-test-info] div:eq(1)').text().replace(/[\n]+/g, '').replace(/\s\s/g, '').trim(), 'Primary Cohort:test cohort');
    assert.equal(this.$('[data-test-info] div:eq(2) li:eq(0)').text().trim(), 'a third cohort');
    assert.equal(this.$('[data-test-info] div:eq(2) li:eq(1)').text().trim(), 'second cohort');

  });

  test('it renders all no', async function(assert) {
    const user = EmberObject.create({
      fullName: 'test name',
      isStudent: false,
      roles: resolve([]),
      userSyncIgnore: false,
      school: resolve(),
      primaryCohort: resolve(),
      secondaryCohorts: resolve([]),
    });

    this.set('user', user);
    this.set('nothing', parseInt);

    await render(
      hbs`{{my-profile user=user toggleShowCreateNewToken=(action nothing) toggleShowInvalidateTokens=(action nothing)}}`
    );

    assert.equal(this.$('.name').text().trim(), 'test name');
    assert.equal(this.$('.is-student').text().trim(), '');

    assert.equal(this.$('[data-test-info] div:eq(0)').text().replace(/[\n]+/g, '').replace(/\s\s/g, '').trim(), 'Primary School:Unassigned');
    assert.equal(this.$('[data-test-info] div:eq(1)').text().replace(/[\n]+/g, '').replace(/\s\s/g, '').trim(), 'Primary Cohort:Unassigned');

    assert.equal(this.$('[data-test-info] div:eq(2)').text().replace(/[\n]+/g, '').replace(/\s\s/g, '').trim(), 'Secondary Cohorts:Unassigned');
  });

  test('generates token when asked with good expiration date', async function(assert) {
    assert.expect(5);
    const go = '.bigadd:eq(0)';
    const newToken = '.new-token-result input';
    let ajaxMock = Service.extend({
      request(url){
        assert.ok(url.search(/\/auth\/token\?ttl=P14D/) === 0, `URL ${url} matches request pattern.`);
        let hours = parseInt(url.substring(22, 24), 10);
        let minutes = parseInt(url.substring(25, 27), 10);
        let seconds = parseInt(url.substring(28, 30), 10);

        assert.ok(hours < 24);
        assert.ok(minutes < 60);
        assert.ok(seconds < 60);

        return {
          jwt: 'new token'
        };
      }
    });
    this.owner.register('service:commonAjax', ajaxMock);
    this.ajax = this.owner.lookup('service:ajax');
    this.set('nothing', parseInt);
    await render(
      hbs`{{my-profile toggleShowCreateNewToken=(action nothing) showCreateNewToken=true toggleShowInvalidateTokens=(action nothing)}}`
    );

    this.$(go).click();

    return settled().then(()=> {
      assert.equal(this.$(newToken).val().trim(), 'new token');
    });
  });

  test('clear and reset from new token screen', async function(assert) {
    assert.expect(4);
    const cancel = '.bigcancel:eq(0)';
    const go = '.bigadd:eq(0)';
    const newToken = '.new-token-result input';
    const newTokenButton = 'button.new-token';
    const newTokenForm = '.new-token-form';
    let ajaxMock = Service.extend({
      request(){
        return {
          jwt: 'new token'
        };
      }
    });
    this.owner.register('service:commonAjax', ajaxMock);
    this.ajax = this.owner.lookup('service:ajax');
    this.set('toggle', ()=> {
      assert.ok(true);
    });
    await render(hbs`{{my-profile toggleShowCreateNewToken=(action toggle) showCreateNewToken=true}}`);
    await this.$(go).click();
    await settled();

    assert.equal(this.$(newToken).val().trim(), 'new token');
    assert.equal(this.$(newTokenForm).length, 0);
    await this.$(cancel).click();
    await this.$(newTokenButton).click();
    await settled();
    assert.equal(this.$(newTokenForm).length, 1);
  });

  test('clicking button fires show token event', async function(assert) {
    const newTokenButton = 'button.new-token';

    assert.expect(1);
    this.set('toggle', ()=> {
      assert.ok(true);
    });
    this.set('nothing', parseInt);
    await render(
      hbs`{{my-profile toggleShowCreateNewToken=(action toggle) toggleShowInvalidateTokens=(action nothing)}}`
    );

    this.$(newTokenButton).click();
  });

  test('Setting date changes request length', async function(assert) {
    assert.expect(4);
    const go = '.bigadd:eq(0)';
    const datePicker = '.new-token-form input:eq(0)';
    let ajaxMock = Service.extend({
      request(url){
        assert.ok(url.search(/\/auth\/token\?ttl=P41D/) === 0, `URL ${url} matches request pattern.`);
        let hours = parseInt(url.substring(22, 24), 10);
        let minutes = parseInt(url.substring(25, 27), 10);
        let seconds = parseInt(url.substring(28, 30), 10);

        assert.ok(hours < 24);
        assert.ok(minutes < 60);
        assert.ok(seconds < 60);
        return {
          jwt: 'new token'
        };
      }
    });
    this.owner.register('service:commonAjax', ajaxMock);
    this.ajax = this.owner.lookup('service:ajax');
    this.set('nothing', parseInt);
    await render(
      hbs`{{my-profile toggleShowCreateNewToken=(action nothing) showCreateNewToken=true toggleShowInvalidateTokens=(action nothing)}}`
    );
    let m = moment().add(41, 'days');
    let interactor = openDatepicker(this.$(datePicker));
    interactor.selectDate(m.toDate());
    this.$(go).click();

    return settled();
  });

  test('clicking button fires invalidate tokens event', async function(assert) {
    const invalidateTokensButton = 'button.invalidate-tokens';

    assert.expect(1);
    this.set('toggle', ()=> {
      assert.ok(true);
    });
    this.set('nothing', parseInt);
    await render(
      hbs`{{my-profile toggleShowCreateNewToken=(action nothing) toggleShowInvalidateTokens=(action toggle)}}`
    );

    this.$(invalidateTokensButton).click();
  });

  test('invalidate tokens when asked', async function(assert) {
    assert.expect(5);
    const go = '.done:eq(0)';
    let ajaxMock = Service.extend({
      request(url){
        assert.equal(url, '/auth/invalidatetokens');
        return {
          jwt: 'new token'
        };
      }
    });
    this.owner.register('service:commonAjax', ajaxMock);
    this.ajax = this.owner.lookup('service:ajax');
    let sessionMock = Service.extend({
      authenticate(how, obj){
        assert.equal(how, 'authenticator:ilios-jwt');
        assert.ok(obj.jwt);
        assert.equal(obj.jwt, 'new token');
      }
    });
    this.owner.register('service:session', sessionMock);
    this.session = this.owner.lookup('service:session');

    let flashMock = Service.extend({
      success(what){
        assert.equal(what, 'general.successfullyInvalidatedTokens');
      }
    });
    this.owner.register('service:flashMessages', flashMock);
    this.flashMessages = this.owner.lookup('service:flashMessages');
    this.set('nothing', parseInt);
    await render(
      hbs`{{my-profile showInvalidateTokens=true toggleShowCreateNewToken=(action nothing) toggleShowInvalidateTokens=(action nothing)}}`
    );

    this.$(go).click();
    return settled();
  });
});
