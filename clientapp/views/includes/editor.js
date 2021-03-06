var HumanView = require('human-view');
var templates = require('templates');
var RequirementView = require('./requirement');
var _ = require('underscore');
var Editor = require('editor');
var UndoManager = require('backbone-undo');
var query = require('query-param-getter');

module.exports = HumanView.extend({
  template: templates.includes.editor,
  initialize: function (opts) {
    this.mode = opts.mode;
    this.requirements = opts.requirements || this.collection;
    this.notes = opts.notes;
    var undoManager = this.undoManager = new UndoManager();
    undoManager.changeUndoType("remove", {
      "undo": function (collection, before, after, options) {
        if ("index" in options) {
          options.at = options.index;
        }
        collection.add(before.attributes, options);
      }
    });
    undoManager.changeUndoType("change", {
      "condition": function (model) {
        var changed = model.changedAttributes();
        return !(Object.keys(changed).length === 1 && changed.hasOwnProperty('_id'));
      }
    });
    undoManager.register(this.requirements);
    undoManager.register(this.notes);
    undoManager.startTracking();
  },
  render: function () {
    this.renderAndBind({showControls: this.mode === "edit"});
    this.editor = new Editor({
      columns: query('columns') || 5,
      canvas: this.$('canvas')[0],
      mode: this.mode,
      requirements: this.requirements,
      notes: this.notes,
      showProgress: window.app.currentUser.loggedIn
    });
    this.editor.render();

    this.editor.on('delete', function (model) {
      if (model.badgeId)
        this.requirements.remove(model);
      else
        this.notes.remove(model);
    }, this);

    this.listenTo(this.editor, 'click', function (model) {
      if (model.badgeId)
        app.router.navigateTo('/badge/' + model.badgeId);
      else
        app.router.navigateTo('/note/' + model._id);
    });

    return this;
  },
  remove: function () {
    this.editor.remove();
    this.$el.remove();
    this.stopListening();
    return this;
  },
  events: {
    'click [data-toggle]': 'toggle',
    'click .js-editor-delete': 'deleteMode',
    'click .js-editor-undo': 'undo'
  },
  deleteMode: function (evt) {
    var active = $(evt.currentTarget).hasClass('active');
    this.editor.enableDelete(active);
    this.editor.refresh();
    evt.preventDefault();
  },
  toggle: function (evt) {
    var btn = $(evt.currentTarget);
    btn.toggleClass('active');
  },
  undo: function (evt) {
    this.undoManager.undo();
    this.editor.refresh();
    evt.preventDefault();
  }
});
