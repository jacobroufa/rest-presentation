var restSlides = {
      urlRoot: '/rest-presentation/api/slides',
      slidesEl: '.reveal .slides',
      init: function ()
      {
        // initialize the collection
        this.slides = new Slides();

        // get slides
        this.slides.fetch().done( function()
        {
          Reveal.initialize({
            controls: true,
            progress: true,
            history: true,
            keyboard: true,
            touch: true,
            center: true,
            transition: 'none'
          });

          // show the links for edit/add/delete
          Reveal.addEventListener( 'ready', function()
          {
            new SlideLinksView({
              el: '.reveal'
            }).render();
          });
        });
      }
    },

    Slide = Backbone.Model.extend({
      urlRoot: restSlides.urlRoot,
      defaults: {
        'first_title': null,
        'title': null,
        'subtitle': null,
        'body': null,
        'byline': null
      }
    }),
    
    Slides = Backbone.Collection.extend({
      url: restSlides.urlRoot,
      model: Slide,
      initialize: function()
      {
        this.listenTo( this, 'add', this.addSlide );
      },
      addSlide: function( slide )
      {
        new SlideView({
          model: slide
        }).render().appendNode();
      }
    }),
    
    SlideView = Backbone.View.extend({
      initialize: function()
      {
        // make sure we update the slides when the changes happen...
        this.listenTo( this.model, "change", this.render );
        this.listenTo( this.model, "remove", this.removeNode );
      },
      tagName: 'section',
      attributes: function()
      {
        return {
          'data-slideid': this.model.id
        };
      },
      template: _.template( $( '#slideFormTemplate' ).html() ),
      render: function()
      {
        this.$el.html( this.template( this.model.attributes ) );

        return this;
      },
      appendNode: function()
      {
        // render is a no-op (creates html but doesnt put it anywhere) so append it using this method
        $( restSlides.slidesEl ).append( this.el );
      },
      removeNode: function()
      {
        this.remove();
        this.unbind();
      }
    }),
    
    SlideLinksView = Backbone.View.extend({
      events: {
        'click .editLink': 'editSlide',
        'click .deleteLink': 'deleteSlide',
        'click .addLink': 'addSlide'
      },
      template: _.template( $( '#slideLinksTemplate' ).html() ),
      render: function()
      {
        this.$el.append( this.template() );
        return this;
      },
      getSlideId: function()
      {
        var slide = Reveal.getCurrentSlide();
        
        return $( slide ).data( 'slideid' );
      },
      getSlide: function()
      {
        return restSlides.slides.get( this.getSlideId() );
      },
      editSlide: function()
      {
        new SlideFormView({
          model: this.getSlide()
        }).render();
      },
      deleteSlide: function()
      {
        var slide = this.getSlide();

        slide.destroy();

        Reveal.layout();
        Reveal.prev();
      },
      addSlide: function()
      {
        new SlideFormView({
          model: new Slide()
        }).render();
      }
    }),
    
    SlideFormView = Backbone.View.extend({
      initialize: function()
      {
        if ( !this.model.isNew() )
        {
          this.model.fetch({
            id: this.id
          });
        }
      },
      events: {
        'submit .editSlide': 'submitSlide',
        'click .closeForm': 'closeForm',
      },
      el: '.formOverlay',
      template: _.template( $( '#editFormTemplate' ).html() ),
      render: function()
      {
        this.$el.show().html( this.template( this.model.attributes ) );

        return this;
      },
      closeForm: function()
      {
        this.$el.empty().hide();

        this.unbind();

        this.stopListening();
      },
      submitSlide: function( e )
      {
        e.preventDefault();

        this.model.set( this.$( '.editSlide' ).serializeObject() );

        if ( this.model.isNew() )
        {
          restSlides.slides.create( this.model, {
            wait: true,
            success: function( res )
            {
              var lastSlide = document.querySelectorAll( '.reveal .slides>section' ).length;

              Reveal.slide( lastSlide );
            }
          });
        }
        else
        {
          this.model.save();
        }

        this.closeForm();
      }
    });

// found this neat function at http://stackoverflow.com/a/1186309
$.fn.serializeObject = function()
{
    var o = {};
    var a = this.serializeArray();
    $.each(a, function() {
        if (o[this.name] !== undefined) {
            if (!o[this.name].push) {
                o[this.name] = [o[this.name]];
            }
            o[this.name].push(this.value || '');
        } else {
            o[this.name] = this.value || '';
        }
    });
    return o;
};

