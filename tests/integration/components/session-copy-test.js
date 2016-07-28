import { moduleForComponent, test } from 'ember-qunit';
import hbs from 'htmlbars-inline-precompile';
import moment from 'moment';
import Ember from 'ember';
import wait from 'ember-test-helpers/wait';

const { Service, RSVP, Object } = Ember;
const { resolve } = RSVP;

moduleForComponent('session-copy', 'Integration | Component | session copy', {
  integration: true
});

test('it renders', function(assert) {
  let lastYear = parseInt(moment().subtract(1, 'year').format('YYYY'));
  let thisYear = lastYear + 1;
  let nextYear = thisYear + 1;

  let school = Object.create({
    id: 1
  });

  let course1 = Object.create({
    id: 1,
    title: 'old course',
    school: school
  });

  let course2 = Object.create({
    id: 1,
    title: 'old course 2',
    school: school
  });

  let session = Object.create({
    id: 1,
    title: 'old session',
    course: course1
  });

  let storeMock = Service.extend({
    query(what, {limit, filters}){
      assert.equal(what, 'course');
      assert.equal(filters.school, 1);
      assert.equal(filters.year, thisYear);
      assert.equal(limit, 10000);

      return [course1, course2];
    },
    findAll(what){
      assert.ok(what === 'academicYear');

      return [lastYear, thisYear, nextYear].map(year => {
        return Object.create({
          id: year,
          title: year
        });
      });
    }
  });
  this.register('service:store', storeMock);


  this.set('session', session);

  this.render(hbs`{{session-copy session=session}}`);

  const yearSelect = '.year-select select';
  const courseSelect = '.course-select select';
  const save = '.done';

  return wait().then(()=>{
    assert.equal(this.$(`${yearSelect} option`).length, 2);
    for (let i=0; i<2; i++){
      assert.equal(this.$(`${yearSelect} option:eq(${i})`).text().trim(), `${thisYear + i} - ${thisYear + 1 + i}`);
    }
    assert.equal(this.$(`${courseSelect} option`).length, 2);
    assert.equal(this.$(`${courseSelect} option:eq(0)`).text().trim(), course1.get('title'));
    assert.equal(this.$(`${courseSelect} option:eq(1)`).text().trim(), course2.get('title'));
    assert.ok(this.$(save).not(':disabled'));

  })

});

test('copy session', function(assert) {
  assert.expect(16);

  let thisYear = parseInt(moment().format('YYYY'));

  let school = Object.create({
    id: 1
  });

  let course = Object.create({
    id: 1,
    title: 'old course',
    school: school
  });
  let lm = Object.create();
  let learningMaterial = Object.create({
    notes: 'soem notes',
    required: false,
    publicNotes: true,
    learningMaterial: resolve(lm),
  });
  let objectives = [Object.create()];
  let meshDescriptors = [Object.create()];
  let terms = [Object.create()];

  let session = Object.create({
    id: 1,
    title: 'old session',
    course,
    attireRequired: true,
    equipmentRequired: false,
    supplemental: true,
    sessionType: resolve(Object.create()),
    sessionDescription: resolve(Object.create({
      id: 13,
      description: 'test description'
    })),
    objectives: resolve(objectives),
    meshDescriptors: resolve(meshDescriptors),
    terms: resolve(terms),
    learningMaterials: resolve([learningMaterial]),
  });

  let storeMock = Service.extend({
    query(){
      return [course];
    },
    findAll(){
      return [thisYear].map(year => {
        return Object.create({
          id: year,
          title: year
        });
      });
    },
    createRecord(what, props){
      if (what === 'session') {
        assert.equal(session.attireRequired, props.attireRequired);
        assert.equal(session.equipmentRequired, props.equipmentRequired);
        assert.equal(session.supplemental, props.supplemental);
        assert.equal(session.title, props.title);

        return Object.create({
          id: 14,
          save(){
            assert.equal(objectives, this.get('objectives'));
            assert.equal(meshDescriptors, this.get('meshDescriptors'));
            assert.equal(terms, this.get('terms'));
          }
        });
      }
      if (what === 'sessionLearningMaterial') {
        assert.equal(learningMaterial.get('notes'), props.notes);
        assert.equal(learningMaterial.get('required'), props.required);
        assert.equal(learningMaterial.get('publicNotes'), props.publicNotes);

        return Object.create({
          save(){
            assert.equal(this.get('session.id'), 14);
            assert.equal(this.get('learningMaterial.id'), lm.get('id'));
          }
        });
      }
      if (what === 'sessionDescription') {
        assert.equal('test description', props.description);

        return Object.create({
          save(){
            assert.equal(this.get('session.id'), 14);
          }
        });
      }

      assert.ok(false, 'Unexpected call to createdRecord for a ' + what);

    }
  });
  this.register('service:store', storeMock);
  let flashmessagesMock = Ember.Service.extend({
    success(message){
      assert.equal(message, 'sessions.copySuccess');
    }
  });
  this.register('service:flashMessages', flashmessagesMock);


  this.set('session', session);
  this.set('visit', (newSession) => {
    assert.equal(newSession.id, 14);
  });
  this.render(hbs`{{session-copy session=session visit=(action visit)}}`);

  return wait().then(()=>{
    this.$('.done').click();
  });
});

test('errors do not show up initially and save cannot be clicked', function(assert) {
  let storeMock = Service.extend({
    query(){
      return [];
    },
    findAll(){
      return [];
    }
  });
  this.register('service:store', storeMock);


  let school = Object.create({
    id: 1
  });

  let course = Object.create({
    id: 1,
    title: 'old course',
    school: school
  });

  let session = Object.create({
    id: 1,
    title: 'old session',
    course
  });

  this.set('session', session);

  this.render(hbs`{{session-copy session=session}}`);
  const save = '.done';

  return wait().then(() => {
    assert.equal(this.$('.messagee').length, 0);
    assert.ok(this.$(save).is(':disabled'));
  });
});

test('changing the year looks for new matching courses', function(assert) {
  assert.expect(6);
  let count = 0;
  let thisYear = parseInt(moment().format('YYYY'));
  let nextYear = thisYear + 1;

  let school = Object.create({
    id: 1
  });

  let course = Object.create({
    id: 1,
    title: 'old course',
    school: school
  });

  let session = Object.create({
    id: 1,
    title: 'old session',
    course
  });

  let storeMock = Service.extend({
    query(what, {filters}){

      assert.ok(what === 'course');
      assert.ok(filters.school, 1);
      switch(count){
      case 0:
        assert.ok(filters.year, thisYear);
        break;
      case 1:
        assert.ok(filters.year, nextYear);
        break;
      default:
        assert.ok(false, 'should not be called again');
      }

      count++;
      return [];
    },
    findAll(){
      return [thisYear, nextYear].map(year => {
        return Object.create({
          id: year,
          title: year
        });
      });
    }
  });
  this.register('service:store', storeMock);
  this.set('session', session);

  this.render(hbs`{{session-copy session=session}}`);
  const yearSelect = '.year-select select';

  return wait().then(()=>{
    this.$(yearSelect).val(nextYear).change();
  });
});
