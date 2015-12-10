"use strict"; //ignore jslint
_ctx.setNavTarget("Campaign");

$(function () {

    $(".head").header({
        selectedValue: _ctx.NavTarget,
        webFolder: getWebFolder()
    });

    $("#content").empty().load("Templates/AddCampaign.htm", function () {
        //load roles.  or create roles plugin.
//        $('#campIntervalFrom').datepicker();
//        $('#campIntervalTo').datepicker();
    });

    

});