$(function () {

    _ctx.setNavTarget("Home");

    var header;

    loadConfigValues(function () {

        header = $(".head").header({
            selectedValue: _ctx.NavTarget,
            navigationHandler: '',
            webFolder: getWebFolder(),
            callback: setupUserLogin
        });

        _ctx.clearFilterParms();

    	// load page to test url        
        $(".validateHolder").captureHTML({ mediaId: '', mediaType: 'HTML', testOnly: true, templatePath: 'Capture/' });

    });


    var setupUserLogin = function () {
    	if (eval(formAuthentication)) {
    		$("#userLogin").show();    		
    	}
    	else {
    		$("#userLogin").hide();
    		CDC.Admin.User.getNetworkUser(function (user) {
    			if (user != null) {
    				header.setUser(user);
    			}
    			else {
    				header.setUnauthorized('Contact <a href="mailto:senderEmail14@email?Subject=Admin%20Access" target="_top">senderEmail14@email</a> for access.');
    			}

    		})
    	}
    }
    
});
