var Backbone = require('backbone');
var Achievement = require('./models/achievement');
var Achievements = require('./models/achievements');
var Requirements = require('./models/requirements');
var LandingView = require('./views/pages/landing');
var BadgePage = require('./views/pages/badge');
var PathwayPage = require('./views/pages/pathway');
var PledgedPage = require('./views/pages/pledged');
var query = require('query-param-getter');

var cache;

module.exports = Backbone.Router.extend({

  initialize: function (opts) {
    window.app.currentUser.on('change:loggedIn', function () {
      app.history.loadUrl();
    });
    this.listing = new Achievements({
      pageSize: 8
    });
    this.listing.fetch({reset: true});
  },

  routes: {
    '': 'landing',
    'badge/:id': 'showBadge',
    'pathway/:id': 'showPathway',
    'pledged/:id': 'showEditor',
    '*url': 'nope'
  },

  landing: function () {
    app.renderPage(new LandingView({
      model: window.app,
      collection: this.listing
    }));
  },

  showBadge: function (id) {
    var badge = cache || new Achievement({
      type: 'badge',
      title: 'A Very Long Badge Title ' + id,
      creator: 'None',
      tags: ['service', 'barista', 'coffeelover', 'fake'],
      favorite: !!query('fav'),
      earned: !!query('earned')
    });
    app.renderPage(new BadgePage({model: badge}));
  },

  showPathway: function (id) {
    id = parseInt(id);
    var pathway = cache || new Achievement({
      id: id,
      type: 'pathway',
      title: 'A Very Long Pathway Title ' + id,
      creator: 'None',
      favorite: !!query('fav')
    });
    var requirements = new Requirements(null, {
      parentId: pathway.id
    });
    requirements.fetch();
    app.renderPage(new PathwayPage({model: pathway, collection: requirements}));
  },

  showEditor: function (id) {
    id = parseInt(id);
    cache = cache || {};
    var pathway = cache.pathway || new Achievement({
      id: id,
      type: 'pathway',
      title: 'A Very Long Pathway Title ' + id,
      creator: 'None',
      favorite: !!query('fav')
    });
    var requirements;
    if (cache.requirements) {
      requirements = cache.requirements;
    }
    else {
      requirements = new Requirements(null, {
        parentId: pathway.id
      });
      requirements.fetch();
    }
    var backpack = new Achievements({
      pageSize: 4
    });
    var wishlist = new Achievements({
      pageSize: 4
    });
    backpack.fetch();
    wishlist.fetch();
    app.renderPage(new PledgedPage({
      model: pathway,
      collection: requirements,
      addSources: {
        backpack: backpack,
        wishlist: wishlist
      }
    }));
  },

  nope: function () {
    if (app.currentPage) app.currentPage.remove();
    alert('404! Try again.');
  },

  navigateTo: function (url, data) {
    cache = data || undefined;
    this.navigate(url, {trigger: true});
  }
});