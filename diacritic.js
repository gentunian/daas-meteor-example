  Diacritics = new Mongo.Collection('diacritics');
  DiacriticsAPI = new Mongo.Collection('diacriticsAPI');

  if (Meteor.isClient) {
    Template.popover.helpers({
      chars: function () {
        var data = Template.currentData();
        return _.map(data.output, function(a, b) { return {data: a, index: (b+1)}; });
      }
    });

    Template.popover.events({
      "click button": function (e, tmpl) {
        Session.set('char', $(e.currentTarget).html());
        $('.popover-example').remove();
        $('input').focus();
      },
      "mouseover button": function (e, tmpl) {
        Session.set('char', $(e.currentTarget).html());
      },
      "focus button": function (e, tmpl) {
        Session.set('char', $(e.currentTarget).html());
        
      },
      "keydown button": function (e, tmpl) {

      }
    });

    Template.textInput.events({
      "keyup input, click input": function (e, tmpl) {
        var inputValue = $(e.currentTarget).val();
        var charAtCaret = inputValue[e.currentTarget.selectionStart -1];
        var chr = charAtCaret.toLowerCase();
        var query = Diacritics.findOne({input: chr});

        $('.popover-example').remove();
        if (query) {
          $('input').popover({
            animation: true,
            html: true,
            trigger: 'manual',
            placement: 'bottom',
            content: Blaze.renderWithData(Template.popover, query, $('.form-group').get(0)),
          });
        }
      }
    });

    Meteor.startup(function () {
      Tracker.autorun(function() {
        var chr = Session.get('char');
        if (chr !== undefined) {
          var selStart = $('input').get(0).selectionStart;
          var value = $('input').val();
          value = value.substr(0, selStart-1)+chr+value.substr(selStart);
          $('input').val(value);
          $('input').get(0).selectionStart = selStart;
          $('input').get(0).selectionEnd = selStart;
        }
      });
    });
  }

  if (Meteor.isServer) {
    var _http = {
      status_ok: 200
    };
    var API_URL = 'http://diacritic.braincandy.com.ar/api';

    Meteor.startup(function () {

      // CACHE THE API YAYY!
      HTTP.get(API_URL, function (a, b) {
        if (b.statusCode == _http.status_ok) {
          var docAPI = {
            date: new Date(b.headers.date),
            name: 'API Info',
          };
          docAPI = _.extend(docAPI, b.data);
          DiacriticsAPI.upsert({chars_url: b.data.chars_url}, docAPI);
          HTTP.get(b.data.chars_url, function (err, result) {
            _.each(result.data, function (value) {
              var url = b.data.char_url.replace('{chr}', value).replace('{?mode}', '?mode=full');
              HTTP.get(url, function (err, result) {
                if (result.statusCode == _http.status_ok) {
                  Diacritics.upsert({input: value}, result.data);
                }
              });
            });
          });
        }
      });
    });
  }
