"use strict"; //ignore jslint

(function ($) {
    var PLUGIN_NAME = 'header';

    // plugin signature ///////////////////////
    $[PLUGIN_NAME] = {
        defaults: {
            selectedValue: '',
            navigationHandler: '',
            webFolder: '',
            callback: ''
        }
    };

    // main funtion //////////////////////////
    $.fn[PLUGIN_NAME] = function (options) {

        $[PLUGIN_NAME].defaults.target = this;
        options = $.extend({}, $[PLUGIN_NAME].defaults, options);

        function handleNavigationClick() {
            var func = options.navigationHandler;
            if (typeof func === 'function') {
                func();
            }
            return false;
        }

        function handleCallback() {
            var func = options.callback;
            if (typeof func === 'function') {
                func();
            }
            return false;
        }

        function main() {

            $(options.target).load(urlRoot + "/Templates/Header.htm", function () {
            	$(options.target).find(".navbar a").hide();
            	setupNav(options.selectedValue);

            	$('.topNavBar').affix({ offset: 62 });

                $(options.target).find("a:not('.dropdown-toggle')").click(function() {

                    _ctx.setSelectedMediaId("");
                    _ctx.setSelectedCollection('', '', []);
                    _ctx.setSelectedFeed('', '', '');
                    _ctx.clearFilterParms();

                    var current = location.pathname.substring(location.pathname.lastIndexOf('/') + 1);                    
                    var hrefTarget = this.toString().substring(this.toString().lastIndexOf('/') + 1);
                    hrefTarget = hrefTarget.split("?")[0];

                    if ("Capture.htm" == hrefTarget) {
                        var view = $(this).attr("captureView");
                        _ctx.setMediaType(view);
                        handleNavigationClick();
                        $('[data-toggle="dropdown"]').parent().removeClass('open');                                               
                        if(current === hrefTarget){
                            return false;
                        }
                    }

                    return true;
                });

                $.ajax({
                    type: "POST",
                    url: urlRoot + "/Secure.aspx/GetVersionNumber",                    
                    contentType: "application/json; charset=utf-8",
                    dataType: "json",
                    success: function(response) {
                        var version  = response.d;
                        $(".versionNumber").html(version);
                    },
                    error: function (xhr, ajaxOptions, thrownError) {
                        console.debug(xhr.status);
                        console.debug(thrownError);
                        console.debug(xhr.responseText);
                    }
                });


                handleCallback();

            });

        }

        function setupNav(navTarget) {
            // map links to website root.
            $(options.target).find("a").each(function() {
                if (options.webFolder && options.webFolder !== '') {
                    this.href = "/" + options.webFolder + "/" + this.pathname + this.search;
                }
                
            });

            $(options.target).find("a").removeClass("active");
            $(options.target).find("a[navTarget]").each(function () {
                if (navTarget == $(this).attr("navTarget")) {
                    $(this).addClass("active");
                }
            });

            $(options.target).find("a").click(function(){
                _ctx.setPageData(null);
            });
        }

        function setUser(userInfo) {
            $(".adminWelcome .hed_userName").html("Welcome, " + userInfo.name);
            $(options.target).find(".navbar a#home").show();
            //$(options.target).find(".navbar a").show();
            if (CDC.Admin.Auth.canSearch()) {
        	    $(options.target).find(".aSearch").show();
        	}
            if (CDC.Admin.Auth.canAddContent()) {
        	    $(options.target).find("li.capture a").show();
        	}
            if (CDC.Admin.Auth.canAdministerVocab()) {
        	    $(options.target).find("li.vocab a").show();
        	}
            if (CDC.Admin.Auth.canManageCollections()) {
        	    $(options.target).find("li.collections a").show();
        	}
            if (CDC.Admin.Auth.canManageFeeds()) {
        	    $(options.target).find("li.feeds a").show();
        	}
            if (CDC.Admin.Auth.canManagePodcasts()) {
        	    $(options.target).find("li.podcasts a").show();
        	}
            if (CDC.Admin.Auth.canManageAuthorization()) {
        	    $(options.target).find("li.authorization a").show();
        	}
            if (CDC.Admin.Auth.canUseUtilities()) {
        	    $(options.target).find("li.utilities a").show();
        	}
            if (CDC.Admin.Auth.canUseData()) {
        	    $(options.target).find("li.data a").show();
        	}
        }

        function setUnauthorized(msg) {
        	$(".adminWelcome").html(msg);
        	$(options.target).find(".navbar a#home").show();
        }

        this.initialize = function () {
            main();            
        };

        this.setUser = function (userInfo) {
            setUser(userInfo);
        };

        this.setUnauthorized = function (msg) {
        	setUnauthorized(msg);
        };


        this.setSelected = function (navTarget) {
            setupNav(navTarget);
        };

        main();

        return this;

    };

})(jQuery);