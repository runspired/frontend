import Component from '@glimmer/component';
import { inject as service } from '@ember/service';
import { all } from 'rsvp';
import { tracked } from '@glimmer/tracking';
import { dropTask, restartableTask } from 'ember-concurrency';

export default class SchoolSessionAttributesComponent extends Component {
  @service store;
  @tracked showSessionAttendanceRequiredConfig;
  @tracked showSessionSupplementalConfig;
  @tracked showSessionSpecialAttireRequiredConfig;
  @tracked showSessionSpecialEquipmentRequiredConfig;

  @restartableTask
  *load(element, [school]) {
    const schoolConfigs = yield school.configurations;
    this.showSessionAttendanceRequiredConfig = schoolConfigs.findBy(
      'name',
      'showSessionAttendanceRequired'
    );
    this.showSessionSupplementalConfig = schoolConfigs.findBy('name', 'showSessionSupplemental');
    this.showSessionSpecialAttireRequiredConfig = schoolConfigs.findBy(
      'name',
      'showSessionSpecialAttireRequired'
    );
    this.showSessionSpecialEquipmentRequiredConfig = schoolConfigs.findBy(
      'name',
      'showSessionSpecialEquipmentRequired'
    );
  }

  get showSessionAttendanceRequired() {
    return JSON.parse(this.showSessionAttendanceRequiredConfig?.value ?? null);
  }
  get showSessionSupplemental() {
    return JSON.parse(this.showSessionSupplementalConfig?.value ?? null);
  }
  get showSessionSpecialAttireRequired() {
    return JSON.parse(this.showSessionSpecialAttireRequiredConfig?.value ?? null);
  }
  get showSessionSpecialEquipmentRequired() {
    return JSON.parse(this.showSessionSpecialEquipmentRequiredConfig?.value ?? null);
  }

  @dropTask
  *save(newValues) {
    const names = [
      'showSessionAttendanceRequired',
      'showSessionSupplemental',
      'showSessionSpecialAttireRequired',
      'showSessionSpecialEquipmentRequired',
    ];
    const toSave = [];
    for (let i = 0; i < names.length; i++) {
      const name = names[i];
      const config = yield this.args.school.setConfigValue(name, newValues[name]);
      if (config) {
        toSave.pushObject(config);
      }
    }
    try {
      yield all(toSave.invoke('save'));
    } finally {
      this.args.manage(false);
    }
  }
}
