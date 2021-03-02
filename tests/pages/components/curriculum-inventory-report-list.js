import { clickable, create, collection, text } from 'ember-cli-page-object';
import item from './curriculum-inventory-report-list-item';

const definition = {
  scope: '[data-test-curriculum-inventory-report-list]',
  headers: {
    scope: 'table thead',
    name: text('th', { at: 0 }),
    program: text('th', { at: 1 }),
    year: text('th', { at: 2 }),
    startDate: text('th', { at: 3 }),
    endDate: text('th', { at: 4 }),
    status: text('th', { at: 5 }),
    actions: text('th', { at: 6 }),
    clickOnName: clickable('th', { at: 0 }),
    clickOnYear: clickable('th', { at: 2 }),
  },
  reports: collection({
    itemScope: '[data-test-curriculum-inventory-report-list-item]',
    item,
  }),
  confirmRemoval: {
    scope: '[data-test-confirm-removal]',
    confirm: clickable('[data-test-confirm]'),
    cancel: clickable('[data-test-cancel]'),
  },
  emptyList: {
    scope: '[data-test-empty-list]',
    text: text(),
  },
};

export default definition;
export const component = create(definition);
