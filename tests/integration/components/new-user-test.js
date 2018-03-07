import Service from '@ember/service';
import EmberObject from '@ember/object';
import RSVP from 'rsvp';
import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { render, settled } from '@ember/test-helpers';
import hbs from 'htmlbars-inline-precompile';
import initializer from "ilios/instance-initializers/ember-i18n";

const { resolve } = RSVP;

const mockSchools = [
  {id: 2, title: 'second', cohorts: resolve([])},
  {id: 1, title: 'first', cohorts: resolve([])},
  {id: 3, title: 'third', cohorts: resolve([])},
];
const mockUser = EmberObject.create({
  schools: resolve(mockSchools),
  school: resolve(EmberObject.create(mockSchools[0]))
});

const currentUserMock = Service.extend({
  model: resolve(mockUser)
});

module('Integration | Component | new user', function(hooks) {
  setupRenderingTest(hooks);

  hooks.beforeEach(function() {
    this.setup = function() {
      initializer.initialize(this);
    };
  });

  hooks.beforeEach(function() {
    this.owner.register('service:current-user', currentUserMock);
  });


  test('it renders', async function(assert) {
    this.set('close', () => {});

    let storeMock = Service.extend({
      query(what, {filters}){

        assert.equal('cohort', what);
        assert.equal(filters.schools[0], 2);
        return resolve([]);
      }
    });
    this.owner.register('service:store', storeMock);

    await render(hbs`{{new-user close=(action close)}}`);

    return settled().then(() => {
      let content = this.$().text().trim();
      assert.notEqual(content.search(/New User/), -1);
      assert.notEqual(content.search(/First Name/), -1);
      assert.notEqual(content.search(/Last Name/), -1);
      assert.notEqual(content.search(/Middle Name/), -1);
      assert.notEqual(content.search(/Campus ID/), -1);
      assert.notEqual(content.search(/Other ID/), -1);
      assert.notEqual(content.search(/Email/), -1);
      assert.notEqual(content.search(/Phone/), -1);
      assert.notEqual(content.search(/Username/), -1);
      assert.notEqual(content.search(/Password/), -1);
      assert.notEqual(content.search(/Primary School/), -1);

      const schools = 'select:eq(0) option';
      let options = this.$(schools);
      assert.equal(options.length, mockSchools.length);
      assert.equal(options.eq(0).text().trim(), 'first');
      assert.equal(options.eq(1).text().trim(), 'second');
      assert.equal(options.eq(2).text().trim(), 'third');
    });
  });

  test('errors do not show up initially', async function(assert) {

    let storeMock = Service.extend({
      query(what, {filters}){

        assert.equal('cohort', what);
        assert.equal(filters.schools[0], 2);
        return resolve([]);
      }
    });
    this.owner.register('service:store', storeMock);
    this.set('close', () => {
      assert.ok(false); //shouldn't be called
    });
    await render(hbs`{{new-user close=(action close)}}`);

    return settled().then(() => {
      assert.equal(this.$('.messagee').length, 0);

    });
  });

  test('errors show up', async function(assert) {
    let storeMock = Service.extend({
      query(what, {filters}){

        assert.equal('cohort', what);
        assert.equal(filters.schools[0], 2);
        return resolve([]);
      }
    });
    this.owner.register('service:store', storeMock);
    this.set('close', () => {
      assert.ok(false); //shouldn't be called
    });
    await render(hbs`{{new-user close=(action close)}}`);

    return settled().then(() => {
      this.$('.done').click();
      return settled().then(() => {
        let boxes = this.$('.item');
        assert.ok(boxes.eq(0).text().search(/blank/) > -1);
        assert.ok(boxes.eq(2).text().search(/blank/) > -1);
        assert.ok(boxes.eq(5).text().search(/blank/) > -1);
        assert.ok(boxes.eq(7).text().search(/blank/) > -1);
        assert.ok(boxes.eq(8).text().search(/blank/) > -1);
      });

    });
  });

  test('create new user', async function(assert) {
    assert.expect(21);
    let facultyRole = EmberObject.create({
      id: 3,
      title: 'Faculty'
    });
    let studentRole = EmberObject.create({
      id: 4,
      title: 'Student'
    });
    let createRecordCalled = 0;
    let storeMock = Service.extend({
      query(what, {filters}){
        assert.equal('cohort', what, 'we are lookign for cohorts');
        assert.equal(filters.schools[0], 2, 'in the correct school');
        return resolve([]);
      },
      findAll(what){
        assert.equal(what, 'user-role');
        return resolve([facultyRole, studentRole]);
      },
      createRecord(what, properties){
        createRecordCalled++;

        if (createRecordCalled === 1) {
          const {firstName, middleName, lastName, campusId, otherId, phone, email} = properties;
          assert.equal(what, 'user', 'creating a user record');
          assert.equal(firstName, 'first', 'with the correct firstName');
          assert.equal(middleName, 'middle', 'with the correct middleName');
          assert.equal(lastName, 'last', 'with the correct lastName');
          assert.equal(campusId, 'campusid', 'with the correct campusId');
          assert.equal(otherId, 'otherid', 'with the correct otherId');
          assert.equal(phone, 'phone', 'with the correct phone');
          assert.equal(email, 'test@test.com', 'with the correct email');

          return new EmberObject({
            save(){
              const roles = this.get('roles');
              assert.equal(roles.length, 1, 'Only one new role was added');
              assert.ok(roles.includes(facultyRole), 'The faculty role was added');
              assert.ok(true, 'save gets called');

              return EmberObject.create({
                id: '13'
              });
            }
          });
        }

        if (createRecordCalled === 2) {
          const {user, username, password} = properties;
          assert.equal(what, 'authentication', 'creating an authentication record');
          assert.equal(username, 'user123', 'with the correct username');
          assert.equal(password, 'password123', 'with the correct password');
          assert.equal(user.get('id'), '13', 'with the correct userId');

          return new EmberObject({
            save(){
              assert.ok(true, 'save gets called');
            }
          });
        }

        assert.ok(false, 'create record called too many times');

      },
    });
    this.owner.register('service:store', storeMock);
    let flashmessagesMock = Service.extend({
      success(message){
        assert.equal(message, 'general.saved', 'success message is displayed');
      }
    });
    this.owner.register('service:flashMessages', flashmessagesMock);

    this.set('nothing', parseInt);
    this.set('transitionToUser', (userId)=>{
      assert.equal(userId, 13);
    });
    await render(hbs`{{new-user close=(action nothing) transitionToUser=(action transitionToUser)}}`);
    const firstName = '.item:eq(0) input';
    const middleName = '.item:eq(1) input';
    const lastName = '.item:eq(2) input';
    const campusId = '.item:eq(3) input';
    const otherId = '.item:eq(4) input';
    const email = '.item:eq(5) input';
    const phone = '.item:eq(6) input';
    const username = '.item:eq(7) input';
    const password = '.item:eq(8) input';

    return settled().then(() => {
      this.$(firstName).val('first').trigger('input');
      this.$(middleName).val('middle').trigger('input');
      this.$(lastName).val('last').trigger('input');
      this.$(campusId).val('campusid').trigger('input');
      this.$(otherId).val('otherid').trigger('input');
      this.$(phone).val('phone').trigger('input');
      this.$(email).val('test@test.com').trigger('input');
      this.$(username).val('user123').trigger('input');
      this.$(password).val('password123').trigger('input');

      this.$('.done').click();
      return settled();

    });
  });
});
