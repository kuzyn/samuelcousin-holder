
var _A = {
    c : 320,
    // Compile page title from current site title and parameter data.
    getTitle : function(data) 
        {
            var $data = $(data),
                T = $('.site-title').data('sitetitle'),
                P = $data ? $data.find('.page-permalink').text() : "";
            if (P) {T += " / " + P;} else {T += " / Home";}
            return T;
        },
    // Function to scroll from current position to an element 
    // with variable duration
    scrollTo : function(target) 
        {
            var targetTop = typeof target === 'object' ? $(target).offset().top: target,
                de = Math.abs($(document).scrollTop() - targetTop) * 0.16 + 160;
            $('html, body').animate({
                scrollTop: targetTop
            },
            de, "easeInOutQuart");
        },
    // Re-calculate the width of the container.
    resizeContainer : function() 
        {
            var w = $(window).width(),
                n = parseInt(w / this.c, 10);
            $('#outer-container').width(n * this.c); // Should be like that to get container dynamically
        },
    // Return the path and query component of a url. Required to avoid cross-site
    // mumbo-jumbo due to e.g. www.myhost.com / myhost.com differences and such,
    // leading to dynamic content not loading ;'(
    pathOf : function(url) 
        {
            var urlObj = purl(url);
            return urlObj.attr('query').length ? urlObj.attr('path') + "?" + urlObj.attr('query') : urlObj.attr('path');
        },
    //
    // Update page and complete the content transition.
    updatePage : function(data, script, title, currentid) 
        {
            var h = 0,
                wrapper = $('#page-wrapper'),
                offset = wrapper.offset(),
                oldcontent = wrapper.find('.page-content'),
                newcontent = $('<div class="page-content" style="display: none;"></div>').append(data);

            // We only use the first image in each gallery for imagesloaded.
            // This should eventually be moved to the gallery.
            var images = $();
            newcontent.find('.gallery').each(function() 
            {
                images = images.add( $(this).find('.gallery-image').eq(0) );
            });

            // Imagesloaded is defined in jquery.Freetile.js
            images.imagesLoaded(function() {
                // Set real height.
                wrapper.css({
                    height: wrapper.height() + 'px'
                });

                // Attach new data to document
                wrapper.append(newcontent);

                // Show new content if it is not empty.
                // Also fade it if old content is not empty.
                if (newcontent.is(':not(:empty)')) {
                    if (oldcontent.is(':not(:empty)')) {
                        newcontent.fadeIn({
                            delay: 200,
                            easing: "linear"
                        });
                    } else {
                        newcontent.show();
                    }
                    // Scroll to content top with variable transition delay
                    _A.scrollTo($('#page-wrapper'));
                }

                // Apply style to old content
                oldcontent.css({
                    position: 'absolute',
                    left: '0px',
                    top: '0px',
                    // explicitly set width to prevent slideup jumping
                    // http://jqueryfordesigners.com/slidedown-animation-jump-revisited/
                    width: oldcontent.width() 
                });

                // Fade old content out and remove
                oldcontent.fadeOut({
                    delay: 200,
                    easing: "linear",
                    complete: function() {
                        $(this).remove();
                    }
                });

                //Re-init gallery/ies
                newcontent.find('.gallery.auto').each(function() {
                    var $this = $(this);
                    if ($this.find('.gallery-image').length > 1) {
                        if (isTouch())
                        {
                            $this.TouchGallery();
                        }
                        else
                        {
                            $this.FadeGallery();
                        }
                    }
                });
                newcontent.find('.gallery.touch').each(function() {
                    var $this = $(this);
                    if ($this.find('.gallery-image').length > 1) {
                        $this.TouchGallery();
                    }
                });
                newcontent.find('.gallery.fade').each(function() {
                    var $this = $(this);
                    if ($this.find('.gallery-image').length > 1) {
                        $this.FadeGallery();
                    }
                });

                // Columnize
                newcontent.find('.page-description').columnizePageContent();                

                // Evaluate the script parameter
                // (which represents any scripts found in the new content).
                var func = new Function(script);
                    func();

                // Get height of new div
                h = newcontent.outerHeight(true);
                if (h <= 30) h = 0;

                // Animate to new height.
                // Don't forget to re-set height to auto
                // after the animation completes.
                wrapper.animate({
                    height: h + 'px'
                },
                500, 'easeInOutQuart',
                function() {
                    wrapper.css({
                        height: 'auto'
                    });
                });

                // Show close button
                newcontent.find('.page-close').show();

                // Change document title
                if (title) document.title = title;

                // Fade ajax loader out
                $('#ajax-loader').fadeOut(400);
                $('#title-loader').fadeOut(400);

                // Justify if needed.
                newcontent.sweet_justice();

                // Remove faded class from all snapshots
                $('.snapshot').removeClass('faded');

                // Fade current snapshot
                if ($('#' + currentid).length) $('#' + currentid).addClass('faded');
            });
        }
};

$(document).ready(function() {

    // Useful references
    // ___________________________________________________
    _A.$title = $('#title');                         // The title
    _A.$tags = $('#tags');                          // The navigation menu wrapper
    _A.$tag = $('.tag');                            // The navigation menu tags
    _A.$options = $('.options');                   // The options div
    _A.$container = $('#snapshot-container');      // The snapshots container
    _A.$footer = $('#footer');                     // The footer
    _A.c = $('#outer-container').data('size-step') || _A.c;
        History = window.History,                  // Reference to History.js
        enableHistory = !$('#outer-container').hasClass('no-history');  // Whether to enable History.

    jQuery.fx.interval = 22;

    jQuery.easing.def = 'easeOutQuint';

    // Fix png for IE.
    $('.sort-option').pngFix();

    // Hide snapshots.
    $('.snapshot').addClass('invis1');

    // Add current class to tag.
    _A.$tag.addClass('active').filter('#snapshot').addClass('current');

    // Disable selection on some elements.
    $('.noselect').disableSelection();

    //Fade out options after some delay...
    _A.$options.show().data('fadeout', setTimeout(function() {
        _A.$options.fadeTo(400, 0.2)
    },
    2600));

    // Show/hide options
    _A.$tags.mouseenter(function() {
        clearTimeout(_A.$options.data('fadeout'));
        _A.$options.fadeTo(400, 1);
    });

    _A.$tags.mouseleave(function() {
        _A.$options.data('fadeout', setTimeout(function() {
            _A.$options.fadeTo(400, 0.2);
        },
        800));
    });

    //
    // Interaction
    // __________________________________________________

    // Clicking tags
    _A.$tags.delegate('.tag', 'click', function(e) {
        $this = $(this);
        _id = this.id;

        // Show/hide tag 'nests'
        $('.nest:not(.' + _id + '-nest)').slideUp(240);
        $('.parent-is-' + _id).each(function() {
            var $this = $(this);
            if ($this.children().length > 1) $this.slideDown(240);
        });

        // Highlight tags
        _A.$tag.removeClass('active').removeClass('current');
        $('.' + _id + '-tag').addClass('active');
        $this.addClass('current');

        // This controls which snapshot elements fade in and out and which are animated.
        // First compile the selector of the elements to be revealed.
        var elementSelector = "." + _id;
        // Take care of hidden categories (the ones with a thumbnail).
        if (!$this.hasClass('base')) 
        {
            elementSelector += ':not( .hidden.leaf )';
        }
        else
        {
            elementSelector += ':not(#s-' + _id + ')';
        }
            

        // Hide the others.
        $('.snapshot').not(elementSelector).addClass("nosort").fadeOut(400);
        // Show the relevant ones.
        $(elementSelector).removeClass("nosort").not(":visible").addClass("noanim").fadeIn(400);

        // If hiddenbase, hide the corresponding snapshot
        // if ($this.hasClass('base')) $('#s-'+_id).stop().addClass("nosort").fadeOut(400);

        // Pack, animate and finalize.
        _A.$container.freetile("layout", {
            animate: true,
            selector: '.snapshot:not(.nosort)'
        });
        $('.snapshot').removeClass("noanim");
    });

    //Clicking on hidden categories snapshots
    _A.$container.delegate('.base', 'click', function(e) {
        e.preventDefault();
        var idString = this.id,
            id = idString.substring(2);
        _A.$tags.find('#' + id).trigger('click');
        _A.scrollTo(_A.$tags);
    });

    _A.$container.delegate('.snapshot', 'mouseenter', function() {
        $(this).find("img").stop(true, true).animate({
            opacity: 0.8
        },
        200);
    });

    _A.$container.delegate('.snapshot', 'mouseleave', function() {
        $(this).find("img").stop(true, true).animate({
            opacity: 1
        },
        400);
    });

    // Scroll to top
    $('.goto-top').click(function(e) {
        e.preventDefault();
        _A.scrollTo(0);
        return false;
    });

    //
    // Sorting
    // __________________________________________________

    // Save original element order into a new invisible div and Sort using TinySort
    // http://tinysort.sjeiti.com/
    $('.snapshot').each(function(_i) {
        $(this).prepend("<div class=\"projectCat invis1\">" + _i + "</div>");
    });

    // Initial sorting.
    // To specify a sorting method, edit _shared.txt in your
    // /content directory and choose between "date", "shuffle"
    // and "category".
    var sortingMode = _A.$container.attr('sorting');
    $('.sort-option').removeClass('current');
    if (sortingMode == "date") {
        $('#sbd').addClass('current');
        $('.snapshot').tsort('.projectDate', {
            order: 'desc'
        });
    } else if (sortingMode == "shuffle") {
        $('#sbr').addClass('current');
        $('.snapshot:not(#control)').tsort("", {
            order: "rand"
        });
    } else {
        $('#sbc').addClass('current');
    }
    // In the end prepend featured items.
    _A.$container.prepend($('.featured'));

    $('.sort-option').click(function() {
        $('.sort-option').removeClass('current');
        $(this).addClass('current');
    });
    
    // Different Sorting Functionality
    // 1. Date
    $('#sbd').click(function() {

        $('.snapshot:not(#control)').tsort('.projectDate', {
            order: 'desc'
        });
        _A.$container.prepend($('.featured'));
        _A.$container.freetile("layout");
    });
    // 2. Original
    $('#sbc').click(function() {
        $('.snapshot:not(#control)').tsort('.projectCat', {
            order: 'asc'
        });
        _A.$container.prepend($('.featured'));
        _A.$container.freetile("layout");
    });
    // 3. Shuffle. Fun.
    $('#sbr').click(function() {
        $('.snapshot:not(#control)').tsort("", {
            order: "rand"
        });
        _A.$container.prepend($('.featured'));
        _A.$container.freetile("layout");
    });

    // Keyboard sorting functionality: C: Category, D: Date, S: Shuffle
    bindEvent(document, "keyup", function(event) {
        // handle cursor keys
        if (event.keyCode == 67) 
        {
            $('#sbc').trigger('click');
        } 
        else if (event.keyCode == 68) 
        {
            $('#sbd').trigger('click');
        } 
        else if (event.keyCode == 83) 
        {
            $('#sbr').trigger('click');
        }
        if (event.keyCode == 67 || event.keyCode == 68 || event.keyCode == 83)
        {
            clearTimeout(_A.$options.data('fadeout'));
            _A.$options.fadeTo(400, 1);
            _A.$options.data('fadeout', setTimeout(function() {
                _A.$options.fadeTo(400, 0.2);
            },
            800));
        }
        if (event.stopPropagation) event.stopPropagation();
    },false);

    //
    // Packing
    // __________________________________________________

    var SnapshotsSelector = '.snapshot:not(.nosort, .hidden.leaf)';

    $(SnapshotsSelector).find('.projectThumb').imagesLoaded(function() {
        // Fade in container
        $('#outer-container').css({opacity: 0.0, visibility: "visible"}).animate({opacity: 1.0}, 600, function() {

            // Change each snapshot's width to match the image it contains, if one exists.
            $('.snapshot').each(function() {
                var $this = $(this),
                    $image = $this.find('.projectThumb');
                if ($image) {
                    // Only toggle (show/hide) images if they are actually invisible (display:none).
                    var toggle = false;
                    if ($(this).is(':not(:visible)')) toggle = true;
                    if (toggle) $this.show();
                    var width = $image.width();
                    // Only resize if the width has a meaningful value.
                    if (width > 0) {
                        $this.width(width);
                    }
                    if (toggle) $this.hide();
                }
            });

            // Layout project snapshots using Freetile
            _A.$container.freetile({
                selector: SnapshotsSelector,
                animate: true,
                elementDelay: 36,
                callback: function(vars) {
                    // Sequential fade in effect. Be aware: the display property is used here to enable animation
                    // because the removeClass() alone won't animate display changes. But display should be
                    // unset at the object level in the end to enable the object to show/hide (eg for filtering)
                    $(SnapshotsSelector).each(function(i) {
                        var $this = $(this);

                        setTimeout(function() {
                            $this.fadeIn(360).removeClass('invis1').css('display', '');
                        },
                        600 + 40 * i);

                        // Fade in footer
                        _A.$footer.fadeIn(500);
                    });
                },
                animationOptions: {
                    duration: 380,
                    easing: 'easeInOutExpo'
                }
            });
        });
    });

    $(window).resize(function() {
        var $this = $(this);
        clearTimeout($this.data("rsz"));
        $this.data("rsz", setTimeout(function() {
            _A.resizeContainer();
        },
        200));
    });

    // Resize container according to column width.
    _A.resizeContainer();

    // Justify if needed.
    $('.sweet-justice').sweet_justice();

    //
    // Gallery init.
    // don't init gallery if it consists of a single photo
    // ___________________________________________________

    $('.gallery.auto').imagesLoaded(function() {
        $('.gallery.auto').each(function() {
            var $this = $(this);
            if ($this.find('.gallery-image').length > 1) {
                if (isTouch())
                {
                    $this.TouchGallery();
                }
                else
                {
                    $this.FadeGallery();
                }
            }
        });
    });

    $('.gallery.touch').imagesLoaded(function() {
        $('.gallery.touch').each(function() {
            var $this = $(this);
            if ($this.find('.gallery-image').length > 1) {
                $this.TouchGallery();
            }
        });
    });

    $('.gallery.fade').imagesLoaded(function() {
        $('.gallery.fade').each(function() {
            var $this = $(this);
            if ($this.find('.gallery-image').length > 1) {
                $this.FadeGallery();
            }
        });
    });

    // Columnize page content (if any). This
    // needs to be called last so that the width of the container
    // is already set. Also the container needs to be visible!
    $('.page-description').columnizePageContent();

    //
    // Set up History API if desired and available.
    // __________________________________________________

    if (enableHistory && History && History.enabled) {
        // Prepare Initial State.
        History.replaceState({
            state: $('.page-content').html(),
            currentid: $('.faded').attr('id')
        },
        document.title, "");

        // Setup snapshot clicking delegate.
        // Clicking on snapshot fetches content using ajax and pushes the new
        // state to history if it is supported.
        _A.$container.delegate('.snapshot.leaf:not(.no-history, .external-link)', 'click',
        function(e) {
            // Variables
            var $this = $(this),
                link = _A.pathOf($this.find('.snapshot-link').attr('href'));

            // Prevent default event (following link)
            e.preventDefault();

            if (!$this.hasClass('faded')) {

                // If the link is not empty
                if (link) {
                    // Insert ajax loader and fade in.
                    $('#ajax-loader').appendTo($this).fadeIn(260);

                    // Get the new data and push history state.
                    $.get(link, {},
                    function(data) {

                        // Script tags inside the appended content
                        // need special treatment as per
                        // http://stackoverflow.com/questions/2699320/jquery-script-tags-in-the-html-are-parsed-out-by-jquery-and-not-executed
                        // Also see:
                        // http://jsfiddle.net/J2qRz/2/
                        var dom = $(data),
                            scripts = dom.filter('script'),
                            scriptcontent = '';
                        for (i=0;i<scripts.length;i++) {
                            var s = scripts[i];
                            if (s.id == 'page-script') {
                                scriptcontent = s.text || s.textContent || s.innerHTML || '';
                                break;
                            }
                        }

                        History.pushState({
                            'state'     : $(data).find('.page-content').html(),
                            'script'    : scriptcontent,
                            'currentid' : $this.attr('id')
                        },
                        _A.getTitle(data), link);
                    },
                    'html');
                }
            }
        });

        // Setup title clicking only if it links to a page
        // (has "dynamic-link" class).
        $('#title-link.dynamic-link').click(function(e) {

            var link = _A.pathOf($(this).attr('href')),
                cur = _A.pathOf(window.location);

            // Prevent default event (following link)
            e.preventDefault();

            if (link != cur)
            {
                // Needed for 0-length strings otherwise returning to home
                // will not function.
                if (link.length == 0) link = "/";

                // Show title loader 
                $('#title-loader').fadeIn(240);

                // Get the new data and push history state.
                $.get(link, {},
                function(data) {
                    History.pushState({
                        state: $(data).find('.page-content').html(),
                        currentid: ''
                    },
                    _A.getTitle(data), link);
                },
                'html');
            }
        });

        // Setup menu item clicking.
        $('#top-menu a.page-link').click(function(e) {

            var link = _A.pathOf($(this).attr('href')),
                cur = _A.pathOf(window.location);

            // Prevent default event (following link)
            e.preventDefault();

            if (link != cur)
            {
                // Show title loader 
                $('#title-loader').fadeIn(240);

                // Get the new data and push history state.
                $.get(link, {},
                function(data) {
                    History.pushState({
                        state: $(data).find('.page-content').html(),
                        currentid: ''
                    },
                    _A.getTitle(data), link);
                },
                'html');
            }
        });

        // Initially show close button
        $('.page-close').show();

        // Setup close button clicking delegate.
        $('#page-wrapper').delegate('.page-close', 'click',
        function(e) {

            var $this = $(this),
                link = $this.parent().attr('href');

            // Prevent default event (following link)
            e.preventDefault();

            // Scroll to top
            $('html, body').animate({
                scrollTop: 0
            },
            400, "easeInOutQuart");

            History.pushState({
                state: '',
                currentid: ''
            },
            _A.getTitle(), link);
        });

        //
        // History.js StateChange Event.
        // __________________________________________________

        History.Adapter.bind(window, 'statechange',
        function() 
        {
            var State = History.getState();
            _A.updatePage(State.data.state || "", State.data.script || "", State.title, State.data.currentid);
        });
    }

    // Finally, set up google analytics event tracking
    if (typeof(_gaq) != 'undefined')
    {
        // Track downloads
        $('a[rel="download"]').click(function() { _gaq.push(['_trackEvent', 'Downloads', 'Download', $(this).html() ]); });
        // Track links
        $('a[rel="link"]').click(function() { _gaq.push(['_trackEvent', 'Links', 'Link: '+$(this).html(), $(this).attr('href') ]); });
        // If Google Analytics exists, track AJAX requests
        // http://stackoverflow.com/questions/8539897/using-google-analytics-to-track-ajax-requests
        History.Adapter.bind(window, 'statechange', 
        function() 
        {
            var State = History.getState();
            _gaq.push(['_trackPageview', State.url]); 
        });
    }
});

// After the page has finished loading scroll to 
// content top if not empty and if scrollTop is less
// than content top.
$(window).load(function() {
    if ($('.page-content').length) {
        setTimeout(function() {
            var wrapper = $('#page-wrapper');
            if ($(document).scrollTop() < wrapper.offset().top) {
                _A.scrollTo(wrapper);
            }
            
        }, 1200);
    }
});


// ______________________________________________
//
// End of document.ready(). Helper scripts follow.
// ______________________________________________


// Columnize page content
$.fn.columnizePageContent = function() {
    var pageDesc = $(this);
    var noColumns = parseInt(pageDesc.attr('columns'), 10);
    pageDesc.find('h2').addClass('dontend');
    if (noColumns <= 0) {
        pageDesc.columnize({ width: _A.c - 20 });
    } else {
        pageDesc.columnize({ columns: noColumns });
    }
}
// Disable selection
// http://stackoverflow.com/questions/2700000/how-to-disable-text-selection-using-jquery
$.fn.disableSelection = function() {
    return this.each(function() {
        $(this).attr('unselectable', 'on')
        .css({
            '-moz-user-select': 'none',
            '-webkit-user-select': 'none',
            'user-select': 'none'
        })
        .each(function() {
            this.onselectstart = function() {
                return false;
            };
        });
    });
};

// http://stackoverflow.com/questions/1251416/png-transparency-problems-in-ie8
$.fn.pngFix = function() {
    if (!$.browser.msie || $.browser.version >= 9) {
        return $(this);
    }

    return $(this).each(function() {
        var img = $(this),
        src = img.attr('src');

        img.attr('src', '/images/general/transparent.gif')
        .css('filter', "progid:DXImageTransform.Microsoft.AlphaImageLoader(enabled='true',sizingMethod='crop',src='" + src + "')");
    });
};

// Function to get the Min value in Array
Array.min = function(array) {
    return Math.min.apply(Math, array);
};

// Filter really visible elements, taking visibility in to account as well
jQuery.extend( 
    jQuery.expr[ ":" ], 
    { 
        reallyvisible : function (a) { 
            return !(jQuery(a).is(':hidden') || jQuery(a).parents(':hidden').length) &&
                   (jQuery(a).css('visibility') == 'visible'); 
        }
    }
);

// jQuery URL Parser plugin
// https://github.com/allmarkedup/jQuery-URL-Parser/tree/no-jquery
var purl = (function(f) {
    var h = {
        a: "href",
        img: "src",
        form: "action",
        base: "href",
        script: "src",
        iframe: "src",
        link: "href"
    },
    i = ["source", "protocol", "authority", "userInfo", "user", "password", "host", "port", "relative", "path", "directory", "file", "query", "fragment"],
    e = {
        anchor: "fragment"
    },
    a = {
        strict: /^(?:([^:\/?#]+):)?(?:\/\/((?:(([^:@]*):?([^:@]*))?@)?([^:\/?#]*)(?::(\d*))?))?((((?:[^?#\/]*\/)*)([^?#]*))(?:\?([^#]*))?(?:#(.*))?)/,
        loose: /^(?:(?![^:@]+:[^:@\/]*@)([^:\/?#.]+):)?(?:\/\/)?((?:(([^:@]*):?([^:@]*))?@)?([^:\/?#]*)(?::(\d*))?)(((\/(?:[^?#](?![^?#\/]*\.[^?#\/.]+(?:[?#]|$)))*\/?)?([^?#\/]*))(?:\?([^#]*))?(?:#(.*))?)/
    },
    c = /(?:^|&|;)([^&=;]*)=?([^&;]*)/g,
    b = /(?:^|&|;)([^&=;]*)=?([^&;]*)/g;
    function g(j, m) {
        var o = decodeURI(j),
        l = a[m || false ? "strict": "loose"].exec(o),
        n = {
            attr: {},
            param: {},
            seg: {}
        },
        k = 14;
        while (k--) {
            n.attr[i[k]] = l[k] || ""
        }
        n.param.query = {};
        n.param.fragment = {};
        n.attr.query.replace(c,
        function(q, p, r) {
            if (p) {
                n.param.query[p] = r
            }
        });
        n.attr.fragment.replace(b,
        function(q, p, r) {
            if (p) {
                n.param.fragment[p] = r
            }
        });
        n.seg.path = n.attr.path.replace(/^\/+|\/+$/g, "").split("/");
        n.seg.fragment = n.attr.fragment.replace(/^\/+|\/+$/g, "").split("/");
        n.attr.base = n.attr.host ? n.attr.protocol + "://" + n.attr.host + (n.attr.port ? ":" + n.attr.port: "") : "";
        return n
    }
    function d(k) {
        var j = k.tagName;
        if (j !== f) {
            return h[j.toLowerCase()]
        }
        return j
    }
    return (function(j, k) {
        if (arguments.length === 1 && j === true) {
            k = true;
            j = f
        }
        k = k || false;
        j = j || window.location.toString();
        return {
            data: g(j, k),
            attr: function(l) {
                l = e[l] || l;
                return l !== f ? this.data.attr[l] : this.data.attr
            },
            param: function(l) {
                return l !== f ? this.data.param.query[l] : this.data.param.query
            },
            fparam: function(l) {
                return l !== f ? this.data.param.fragment[l] : this.data.param.fragment
            },
            segment: function(l) {
                if (l === f) {
                    return this.data.seg.path
                } else {
                    l = l < 0 ? this.data.seg.path.length + l: l - 1;
                    return this.data.seg.path[l]
                }
            },
            fsegment: function(l) {
                if (l === f) {
                    return this.data.seg.fragment
                } else {
                    l = l < 0 ? this.data.seg.fragment.length + l: l - 1;
                    return this.data.seg.fragment[l]
                }
            }
        }
    });
})( jQuery );

/**
* IE Lameness follows...
*/
function bindEvent(el, eventName, eventHandler) {
  if (el.addEventListener){
    el.addEventListener(eventName, eventHandler, false); 
  } else if (el.attachEvent){
    el.attachEvent('on'+eventName, eventHandler);
  }
}
/**
* Check for touch support
* http://stackoverflow.com/questions/4817029/whats-the-best-way-to-detect-a-touch-screen-device-using-javascript
*/
function isTouch() {
  return !!('ontouchstart' in window);
}
/**
* hoverIntent is similar to jQuery's built-in "hover" function except that
* instead of firing the onMouseOver event immediately, hoverIntent checks
* to see if the user's mouse has slowed down (beneath the sensitivity
* threshold) before firing the onMouseOver event.
* 
* hoverIntent r6 // 2011.02.26 // jQuery 1.5.1+
* <http://cherne.net/brian/resources/jquery.hoverIntent.html>
* 
* hoverIntent is currently available for use in all personal or commercial 
* projects under both MIT and GPL licenses. This means that you can choose 
* the license that best suits your project, and use it accordingly.
* 
* // basic usage (just like .hover) receives onMouseOver and onMouseOut functions
* $("ul li").hoverIntent( showNav , hideNav );
* 
* // advanced usage receives configuration object only
* $("ul li").hoverIntent({
*   sensitivity: 7, // number = sensitivity threshold (must be 1 or higher)
*   interval: 100,   // number = milliseconds of polling interval
*   over: showNav,  // function = onMouseOver callback (required)
*   timeout: 0,   // number = milliseconds delay before onMouseOut function call
*   out: hideNav    // function = onMouseOut callback (required)
* });
* 
* @param  f  onMouseOver function || An object with configuration options
* @param  g  onMouseOut function  || Nothing (use configuration options object)
* @author    Brian Cherne brian(at)cherne(dot)net
*/
(function($) {
    $.fn.hoverIntent = function(f,g) {
        // default configuration options
        var cfg = {
            sensitivity: 7,
            interval: 100,
            timeout: 0
        };
        // override configuration options with user supplied object
        cfg = $.extend(cfg, g ? { over: f, out: g } : f );

        // instantiate variables
        // cX, cY = current X and Y position of mouse, updated by mousemove event
        // pX, pY = previous X and Y position of mouse, set by mouseover and polling interval
        var cX, cY, pX, pY;

        // A private function for getting mouse position
        var track = function(ev) {
            cX = ev.pageX;
            cY = ev.pageY;
        };

        // A private function for comparing current and previous mouse position
        var compare = function(ev,ob) {
            ob.hoverIntent_t = clearTimeout(ob.hoverIntent_t);
            // compare mouse positions to see if they've crossed the threshold
            if ( ( Math.abs(pX-cX) + Math.abs(pY-cY) ) < cfg.sensitivity ) {
                $(ob).unbind("mousemove",track);
                // set hoverIntent state to true (so mouseOut can be called)
                ob.hoverIntent_s = 1;
                return cfg.over.apply(ob,[ev]);
            } else {
                // set previous coordinates for next time
                pX = cX; pY = cY;
                // use self-calling timeout, guarantees intervals are spaced out properly (avoids JavaScript timer bugs)
                ob.hoverIntent_t = setTimeout( function(){compare(ev, ob);} , cfg.interval );
            }
        };

        // A private function for delaying the mouseOut function
        var delay = function(ev,ob) {
            ob.hoverIntent_t = clearTimeout(ob.hoverIntent_t);
            ob.hoverIntent_s = 0;
            return cfg.out.apply(ob,[ev]);
        };

        // A private function for handling mouse 'hovering'
        var handleHover = function(e) {
            // copy objects to be passed into t (required for event object to be passed in IE)
            var ev = jQuery.extend({},e);
            var ob = this;

            // cancel hoverIntent timer if it exists
            if (ob.hoverIntent_t) { ob.hoverIntent_t = clearTimeout(ob.hoverIntent_t); }

            // if e.type == "mouseenter"
            if (e.type == "mouseenter") {
                // set "previous" X and Y position based on initial entry point
                pX = ev.pageX; pY = ev.pageY;
                // update "current" X and Y position based on mousemove
                $(ob).bind("mousemove",track);
                // start polling interval (self-calling timeout) to compare mouse coordinates over time
                if (ob.hoverIntent_s != 1) { ob.hoverIntent_t = setTimeout( function(){compare(ev,ob);} , cfg.interval );}

            // else e.type == "mouseleave"
            } else {
                // unbind expensive mousemove event
                $(ob).unbind("mousemove",track);
                // if hoverIntent state is true, then call the mouseOut function after the specified delay
                if (ob.hoverIntent_s == 1) { ob.hoverIntent_t = setTimeout( function(){delay(ev,ob);} , cfg.timeout );}
            }
        };

        // bind the function to the two event listeners
        return this.bind('mouseenter',handleHover).bind('mouseleave',handleHover);
    };
})(jQuery);

// Touch-friendly Gallery Script
// ___________________________________________________________

// For use in the Assemblage Plus Template
// by Yannis Chatzikonstantinou
// http://yconst.com/web/assemblage-plus/

(function( $ ){
    
    $.fn.TouchGallery = function() {
        var currentImage = 0,
            container = $(this),
            imageHolder = '',
            imageWrapper = '',
            galleryImages = container.find('.gallery-image'),
            maxCount = galleryImages.length,
            prevButton = '',
            nextButton = '',
            caption = '',
            interval = container.data('slideinterval') || 0,
            intervalTimeout = '',
            controlsFadeTimeout = '',
            touchData = {},
            next = function() 
            {
                gotoImage(currentImage + 1, true);
            },
            previous = function() 
            {
                gotoImage(currentImage - 1, true);
            },
            gotoImage = function(num, animateTransition) 
            {
                updateContainers(num, animateTransition);
            },
            updateContainers = function(num, animateTransition) 
            {
                var target = num + 1;

                if (animateTransition)
                {
                    imageHolder.stop(true, true).animate({
                      marginLeft: (target * imageWrapper.width()) * -1 + "px"
                    }, { duration: 360, queue: false, complete: function() {
                        if (num < 0)
                        {
                            imageHolder.css({
                                marginLeft: ((maxCount - 2) * imageWrapper.width()) * -1 + "px"
                            });
                        }
                        else if (num > maxCount - 3)
                        {
                            imageHolder.css({
                                marginLeft: (imageWrapper.width()) * -1 + "px"
                            });
                        }
                    }});
                    imageWrapper.stop(true, true).animate({
                      height: getTotalHeight(target) + "px"
                    }, { duration: 360, queue: false });
                }
                else
                {
                    if (num < 0)
                    {
                        imageHolder.css({
                            marginLeft: (maxCount - 3) * imageWrapper.width() * -1 + "px"
                        });
                    }
                    else if (num > maxCount - 3)
                    {
                        imageHolder.css({
                            marginLeft: imageWrapper.width() * -1 + "px"
                        });
                    }
                    else
                    {
                        imageHolder.css({
                            marginLeft: (target) * imageWrapper.width() * -1 + "px"
                        });
                    }
                    imageWrapper.css({height: getTotalHeight(target) + "px"});
                }

                if (num < 0)
                {
                    currentImage = maxCount - 3;
                }
                else if (num > maxCount - 3)
                {
                    currentImage = 0;
                }
                else
                {
                    currentImage = num;
                }

                if (caption) 
                {
                    var counterContent = (currentImage + 1) + " / " + (maxCount - 2),
                        titleContent = galleryImages.eq(currentImage + 1).data('title'),
                        descriptionContent = galleryImages.eq(currentImage + 1).data('description');
                    captionContent = counterContent;
                    if (titleContent) captionContent += " &mdash; " + titleContent
                    if (descriptionContent) captionContent += " &mdash; " + descriptionContent
                    caption.find('div').html(captionContent);
                }
            },
            getTotalHeight = function(num)
            {
                return imageWrapper.find('img')[num].height;
            },
            fadeControls = function(out)
            {
                if (!out)
                {
                    prevButton.stop(true, true).fadeIn(300).animate({'left' : '0'}, {'duration': 300, 'queue': false});
                    nextButton.stop(true, true).fadeIn(300).animate({'right' : '0'}, {'duration': 300, 'queue': false});
                }
                else
                {
                    prevButton.stop(true, true).fadeOut(500).animate({'left' : '-20px'}, {'duration': 500, 'queue': false});
                    nextButton.stop(true, true).fadeOut(500).animate({'right' : '-20px'}, {'duration': 500, 'queue': false});
                }
            },
            toggleTransition = function(on)
            {
                if (on && interval > 0)
                {
                    intervalTimeout = setInterval(function() {nextButton.trigger('click');}, interval * 1000);
                }
                else
                {
                    clearTimeout(intervalTimeout);
                }
            };
        // Insert first image in the end, last image at beginning and renew imagesGallery variable.
        container.append(galleryImages.first().clone());
        container.prepend(galleryImages.eq(maxCount - 1).clone());
        galleryImages = container.find('.gallery-image');
        maxCount+=2;
        //Wrap images with necessary wrappers.
        if (!container.find('.image-wrapper').length) galleryImages.wrapAll("<div class='image-wrapper'><div class='image-holder'></div></div>");
        // Initialize wrapper variables.
        imageHolder = container.find('.image-holder');
        imageWrapper = container.find('.image-wrapper');
        // Set outer wrapper width.
        imageHolder.width(1000000);
        // Set images width and float.
        galleryImages.width(imageWrapper.width());
        galleryImages.find('img').css({ 'max-width' : '100%', 'height' : 'auto'});
        galleryImages.css({ 'float' : 'left', 'margin' : '0px' });
        
        container.addClass('dynamic-gallery');
        
        // Setup prev/next and counter.
        if (!container.find('.prev').length) container.prepend('<div class="gallery-controls"><a class="prev"></a><a class="next"></a></div>');
        container.append('<div class="gallery-caption"><div></div></div>');
        caption = container.find('.gallery-caption');
        prevButton = container.find('.prev');
        nextButton = container.find('.next');

        gotoImage(0, false);
        toggleTransition(true);

        // Setup next/prev functions
        nextButton.click(function(e) {
            e.preventDefault();
            e.stopPropagation();
            next();
            this.blur();
            touchData.touched = false;
            return false;
        });
        prevButton.click(function(e) {
            e.preventDefault();
            e.stopPropagation();
            previous();
            this.blur();
            touchData.touched = false;
            return false;
        });
        galleryImages.click(function(e) {
            e.preventDefault();
            e.stopPropagation();
            if (!touchData.touched)
            {
                next();
                this.blur();
            }
            else
            {
                touchData.touched = false;
            }
            return false;
        });
        // Fade controls in/out
        container.hoverIntent(
            function() {
                clearTimeout(controlsFadeTimeout);
                toggleTransition(false);
                fadeControls();
            },
            function() {
                controlsFadeTimeout = setTimeout(function() {fadeControls(true);}, 800);
                toggleTransition(true);
        });
        controlsFadeTimeout = setTimeout(function() {fadeControls(true);}, 1200);

        // Bind to window resize. Debounced style.
        $(window).resize(function() {
            clearTimeout(imageWrapper.data("resize-event"));
            imageWrapper.data("resize-event", setTimeout(function() {
                galleryImages.css('width', imageWrapper.width());
                imageWrapper.css('height', getTotalHeight(currentImage + 1) + "px");
                imageHolder.css('marginLeft', ((currentImage + 1) * imageWrapper.width()) * -1 + "px");
            }, 200) );
        });
        // Set up keyboard navigation.
        bindEvent(document, "keydown" ,function(event) {
            // handle cursor keys
            if (event.keyCode == 37) {
                // add pressed class to left
                prevButton.addClass('pressed');
            } else if (event.keyCode == 39) {
                // add pressed class to right
                nextButton.addClass('pressed');
            }
            if (event.stopPropagation) event.stopPropagation();
        },false);
        bindEvent(document, "keyup", function(event) {
            // handle cursor keys
            if (event.keyCode == 37) {
                // go left
                previous();
                // remove pressed class from left
                prevButton.removeClass('pressed');
            } else if (event.keyCode == 39) {
                // go right
                next();
                // remove pressed class from right
                nextButton.removeClass('pressed');
            }
            if (event.stopPropagation) event.stopPropagation();
        },false);

        // Setup touch events
        container
            .bind( "touchstart", function( e ){
                // UA is needed to determine whether to return true or false during touchmove (only iOS handles true gracefully)
                touchData.iOS = /iPhone|iPad|iPod/.test( navigator.platform ) && navigator.userAgent.indexOf( "AppleWebKit" ) > -1;
                var touches = e.touches || e.originalEvent.touches
                touchData.origin = { 
                    x : touches[ 0 ].pageX,
                    y: touches[ 0 ].pageY
                };
                toggleTransition(false);
                touchData.touchDragging = true;
            } )
            .bind( "touchmove", function( e ){
                var touches = e.touches || e.originalEvent.touches
                if (touchData.touchDragging && touches[ 0 ] && touches[ 0 ].pageX)
                {
                    if( !touchData.iOS )
                    {
                        e.preventDefault();
                        touchData.deltaY = touches[ 0 ].pageY - touchData.origin.y;
                        window.scrollBy( 0, -touchData.deltaY );
                    } 
                    touchData.deltaX = touches[ 0 ].pageX - touchData.origin.x;
                    imageHolder.css({ marginLeft: ((currentImage + 1) * imageWrapper.width() * -1 + touchData.deltaX) + "px" });
                }
            } )
            .bind( "touchend", function( e ){
                if (touchData.deltaX < -40)
                {
                    fadeControls(true);                    
                    next();
                }
                else if (touchData.deltaX > 40)
                {
                    fadeControls(true);      
                    previous();
                }
                else
                {
                    gotoImage(currentImage, true);
                }

                touchData.deltaX = 0;
                touchData.touchDragging = false;
                touchData.touched = true; // Needed to avoid click action.
                toggleTransition(true);
                return false;
            } );
    }
})( jQuery );

// Alternative (Light) Gallery Script with Fading
// Has no touch support!
// ___________________________________________________________

// For use in the Assemblage Plus Template
// by Yannis Chatzikonstantinou
// http://yconst.com/web/assemblage-plus/

(function( $ ){
    
    $.fn.FadeGallery = function() {
        var currentImage = 0,
            container = $(this),
            imageWrapper = '',
            galleryImages = container.find('.gallery-image'),
            maxCount = galleryImages.length,
            prevButton = '',
            nextButton = '',
            interval = container.data('slideinterval') || 0,
            intervalTimeout = '',
            controlsFadeTimeout = '',
            caption = '',
            next = function() 
            {
                gotoImage(currentImage + 1, true);
            },
            previous = function() 
            {
                gotoImage(currentImage - 1, true);
            },
            gotoImage = function(num, animate) 
            {
                if(num >= maxCount) {
                  num = 0;
                } else if(num < 0) { 
                  num = maxCount - 1;
                }
                updateContainers(num, animate);
            },
            updateContainers = function(num, animate) 
            {
                var f = animate ? 'animate' : 'css';
                    
                $(galleryImages[currentImage]).stop(true, true).fadeOut(360);
                $(galleryImages[num]).stop(true, true).fadeIn(360);

                imageWrapper[f]({
                  height: getTotalHeight(num) + "px"
                }, { duration: 360, queue: false });

                currentImage = num;
                
                if (caption) 
                {
                    var counterContent = (currentImage + 1) + " / " + maxCount,
                        titleContent = galleryImages.eq(currentImage + 1).data('title'),
                        descriptionContent = galleryImages.eq(currentImage).data('description');
                    captionContent = counterContent;
                    if (titleContent) captionContent += " &mdash; " + titleContent
                    if (descriptionContent) captionContent += " &mdash; " + descriptionContent
                    caption.find('div').html(captionContent);
                }
            },
            getTotalHeight = function(num)
            {
                return imageWrapper.find('img')[num].height;
            },
            fadeControls = function(out)
            {
                if (!out)
                {
                    prevButton.stop(true, true).fadeIn(300).animate({'left' : '0'}, {'duration': 300, 'queue': false});
                    nextButton.stop(true, true).fadeIn(300).animate({'right' : '0'}, {'duration': 300, 'queue': false});
                }
                else
                {
                    prevButton.stop(true, true).fadeOut(500).animate({'left' : '-20px'}, {'duration': 500, 'queue': false});
                    nextButton.stop(true, true).fadeOut(500).animate({'right' : '-20px'}, {'duration': 500, 'queue': false});
                }
            },
            toggleTransition = function(on)
            {
                if (on && interval > 0)
                {
                    intervalTimeout = setInterval(function() {nextButton.trigger('click');}, interval * 1000);
                }
                else
                {
                    clearTimeout(intervalTimeout);
                }
            };
        //Wrap images with necessary wrappers.
        if (!container.find('.image-wrapper').length) galleryImages.wrapAll("<div class='image-wrapper'></div>");
        // Initialize wrapper variables.
        imageWrapper = container.find('.image-wrapper');
        imageWrapper.css('position', 'relative');
        // Set images width and float.
        galleryImages.width(imageWrapper.width());
        galleryImages.find('img').css({ 'max-width' : '100%', 'height' : 'auto'});
        galleryImages.css({ 
            'position' : 'absolute', 
            'width' : '100%',
            'left' : '0px',
            'top' : '0px',
            'margin' : '0px' 
        });
        
        container.addClass('dynamic-gallery');
        galleryImages.hide();
        
        // Setup prev/next.
        if (!container.find('.prev').length) container.prepend('<div class="gallery-controls"><a class="prev"></a><a class="next"></a></div>');
        container.append('<div class="gallery-caption"><div></div></div>');
        caption = container.find('.gallery-caption');
        prevButton = container.find('.prev');
        nextButton = container.find('.next');
        
        gotoImage(0, false);
        toggleTransition(true);

        // write next/prev functions
        nextButton.click(function(e) {
            e.preventDefault();
            e.stopPropagation();
            next();
            this.blur();
            return false;
        });
        prevButton.click(function(e) {
            e.preventDefault();
            e.stopPropagation();
            previous();
            this.blur();
            return false;
        });
        galleryImages.click(function(e) {
            e.preventDefault();
            e.stopPropagation();
            next();
            this.blur();
            return false;
        });
        // Bind to window resize. Debounced style.
        $(window).resize(function() {
            clearTimeout(imageWrapper.data("resize-event"));
            imageWrapper.data("resize-event", setTimeout(function() {
                galleryImages.css({'width' : imageWrapper.width()});
                imageWrapper.css({height: getTotalHeight(currentImage) + "px"});
            }, 200) );
        });
        // Fade controls in/out
        container.hoverIntent(
            function() {
                clearTimeout(controlsFadeTimeout);
                toggleTransition(false);
                fadeControls();
            },
            function() {
                controlsFadeTimeout = setTimeout(function() {fadeControls(true);}, 800);
                toggleTransition(true);
        });
        controlsFadeTimeout = setTimeout(function() {fadeControls(true);}, 1200);

        // Set up keyboard navigation.
        bindEvent(document, "keydown", function(event) {
            // handle cursor keys
            if (event.keyCode == 37) {
                // add pressed class to left
                prevButton.addClass('pressed');
            } else if (event.keyCode == 39) {
                // add pressed class to right
                nextButton.addClass('pressed');
            }
            if (event.stopPropagation) event.stopPropagation();
        },false);
        bindEvent(document, "keyup", function(event) {
            // handle cursor keys
            if (event.keyCode == 37) {
                // go left
                previous();
                // remove pressed class from left
                prevButton.removeClass('pressed');
            } else if (event.keyCode == 39) {
                // go right
                next();
                // remove pressed class from right
                nextButton.removeClass('pressed');
            }
            if (event.stopPropagation) event.stopPropagation();
        },false);
    }
})( jQuery );