"use strict";  //ignore jslint
(function ($) {
    var PLUGIN_NAME = "mediaFilterGrid";
    
    // plugin signature ///////////////////////
    $[PLUGIN_NAME] = 
    {
        url: '',
        defaults : {},
        callback: ''
    };
    
    // main funtion //////////////////////////
    $.fn[PLUGIN_NAME] = function (options) {
        
        $[PLUGIN_NAME].defaults.target = this;
        options = $.extend({}, $[PLUGIN_NAME].defaults, options);


        function handleCallback() {                
            if (typeof options.callback === 'function') {                
                options.callback();
            }
        }

        var oTable;

        var _totalPages = 0;
        var _pageNum = 1;
        var _pageSize = 10;
        var _sortIndex = '';
        var _sortDirection = '';
        var _sortProperty = '';
        var _search = '';
        var _addCollectionControls = false;
//        var _collectionValues = [];

        function refreshMediaTable() {
            $().showSpinner();
            $(options.target).empty();
            $(options.target).load("Templates/mediaFilterGrid.htm", function () {
                buildMediaTable();
            });
        }


        function buildMediaTable() {

            var getSort = function () {
                if (_sortProperty === '') { return [[7, "desc"]]; }
                var strSort = _sortDirection === '-' ? "desc" : "asc";
                return [[_sortIndex, strSort]];
            };

            var url;

            var getUrl = function () {

                if(url){return url;}
                url = options.url;

                //have we stored paging parameters?
                if(_ctx.Filter.PageData){
                    _pageSize = _ctx.Filter.PageData._pageSize;
                    _pageNum = _ctx.Filter.PageData._pageNum;
                    _sortDirection = _ctx.Filter.PageData._sortDirection;
                    _sortProperty = _ctx.Filter.PageData._sortProperty;
                    _sortIndex = _ctx.Filter.PageData._sortIndex;
                    _ctx.setPageData(null);
                }


                if (_sortProperty !== '') {
                    url += "&sort=";
                    url += _sortDirection;
                    url += _sortProperty;
                }

                if (_search !== '') url += "&q=" + _search;

                url += "&max=" + _pageSize + "&pagenum=" + _pageNum + "&callback=?";

                // debugger code
                if ($(".urlDebugWindow").length === 0) {
                    var $div = $("<div class='urlDebugWindow'></div>");
                    $div.css({
                        "color": "#cccccc",
                        "border": "1px dashed #cccccc",
                        "padding": "10px",
                        "background-color": "white",
                        "font-size": "smaller",
                        "clear" : "both"
                    });

                    $("body").append($div);
                }
                var $url = $("<div>" + url + "</div>");
                $(".urlDebugWindow").append($url);
                ///////////////

                return url;
            };

            var processResponse = function (response) {

                //_ctx.setPageData(response.meta.pagination);

                $(".dataTables_paginate").hide();
                $(".pagination").pager({
                    count: response.meta.pagination.total,
                    displayCount: response.results.length,
                    totalPages: response.meta.pagination.totalPages,
                    currentPageNum: _pageNum,
                    pagingHandler: function (newPageNumber) {
                        _pageNum = newPageNumber;
                        refreshMediaTable();
                        return false;
                    }
                });

                var dtData = {
                    aaData: []
                };

                dtData.iTotalRecords = response.meta.pagination.total;
                dtData.iTotalDisplayRecords = response.meta.pagination.count;
                dtData.sEcho = response.meta.pagination.count;

                for (var i = 0; i < response.results.length; i++) {
                    var itm = response.results[i];

                    var jItm = {
                        mediaId: itm.mediaId,
                        mediaType: itm.mediaType,
                        title: itm.title,
                        sourceUrl: itm.sourceUrl,
                        status: itm.status,
                        modified: itm.dateModified,
                        language: itm.language,
                        alternateImages: itm.alternateImages
                    };

                    dtData.aaData.push(jItm);
                }

                return dtData;
            };

            var bindDatatable = function () {

                oTable = $("#mediaFilterGrid").dataTable({
                    "bServerSide": true,
                    "sAjaxSource": getUrl(),
                    "aaSorting": getSort(),
                    "fnInitComplete": function (oSettings, json) {

                        setTimeout(function () {
                            $("#mediaFilterGrid img").each(function () {
                                if ($(this).width() < 100) {
                                    $(this).replaceWith("<div style='color:#990000; font-size: x-small;'>No&nbsp;Thumb</div>")
                                }
                                else {                                	
                                	$(this).width(155);
                                	$(this).height(84);
                                	$(this).show();
                                	
                                }
                            })
                        }, 1000);

                       
                        setupButtonEvents();
                        handleCallback();
                        $().hideSpinner();
                    },
                    "fnServerData": function (sSource, aoData, fnCallback, oSettings) {
                        oSettings.jqXHR = $.ajax({
                            'url': getUrl(),
                            'dataType': 'jsonp',
                            'data': ''
                        }).done(function (response) {
                            var tmpData = processResponse(response);
                            if(response.meta.pagination.count==0){
                                $("#mediaFilterGrid").replaceWith("<div style='clear:both; font-style:italic; border-top:1px solid black; border-bottom:1px solid black; padding:10px; margin:15px 0 15px 0;'>No results we found matching your search criteria.</div>");
                            }
                            else{
                                fnCallback(tmpData);
                            }
                            $().hideSpinner();
                        }).fail(function (xhr, ajaxOptions, thrownError) {
                            alert("error");
                        });
                    },
                    "aoColumns": [
                            { "mDataProp": "mediaId" },
                            { "mDataProp": "mediaId" },
                            { "mDataProp": "mediaType" },
                            { "mDataProp": "title" },
                            { "mDataProp": "sourceUrl" },
                            { "mDataProp": "mediaId" },
                            { "mDataProp": "status" },
                            { "mDataProp": "modified" },
                            { "mDataProp": "language" },
                            { "mDataProp": "mediaId" }
                        ],
                    "aoColumnDefs": [
                        {
                            "mRender": function (data, type, row) {
                                var out = "";

                                switch (row.mediaType.toLowerCase()) {
                                	case "feed":
                                	case "feed - proxy":
                                	case "feed - import":
                                	case "feed":
                                    case "badge":
                                    case "button":
                                    case "html":
                                    case "image":
                                    case "infographic":
                                	case "video":
									case "widget":
                                    case "pdf":

                                        var isAlt = false;

                                        $(row.alternateImages).each(function () {
                                            if (this.type.toUpperCase() === 'STOREFRONTTHUMBNAIL') {
                                                var altImgUrl = APIRoot + "/adminapi/v1/resources/links/" + this.id;
                                                out = "<img src='" + altImgUrl + "' style='border:1px solid #999; display:none; width:155px; height:84px;'>";
                                                isAlt = true;
                                            }
                                        });

                                        if (!isAlt) {
                                        	out = "<img src='" + APIRoot + "/adminapi/v1/resources/media/" + data + "/thumbnail/?nochache=true' style='border:1px solid #999; display:none;'>";
                                        }

                                        break;                                                                      
                                }

                                

                                return out;
                            },
                            "aTargets": [0]
                        },
                        {
                            "mRender": function (data, type, row) {                                                              
                                var out;
                                if(data === null){
                                    if(row.mediaType === 'Collection'){
                                        out = "<i>Not applicable for this media type</i>";
                                    }
                                    else{
                                        out = "<i>No URL provided</i>";
                                    }
                                }
                                else{
                                	//out = "<a href='#' onclick='javascript:showPopUp(\"" + data + "\"); return false;' class='source_url'>" + data + "</a>";
                                	out = "<a href='" + data + "' class='source_url' target='_new'>" + data + "</a>";
                                }
                                return out;
                            },
                            "aTargets": [4]
                        },
                        {
                            "mRender": function (data, type, row) {
                                var mtype = row.mediaType.toLowerCase();
                                if (mtype == 'html'
                                    || mtype == 'ecard'
                                    || mtype == 'video'
                                    || mtype == 'infographic'
                                    || mtype == 'button'
                                    || mtype == 'badge'
                                    ) {
                                    return  "<a href='#' class='btn btn-small btn-default span1' onclick='javascript:showPreview(\"" + row.mediaId + "\"); return false;'>Preview</a>";                                    
                                }
                                else{
                                    return "";
                                }
                                
                            },
                            "aTargets": [5]
                        },
                        {
                            "mRender": function (data, type, row) {
                                var d = new Date(data);
                                var modifiedDate = d.getDate();
                                var modifiedMonth = d.getMonth() + 1;
                                var modifiedYear = d.getFullYear();

                                return modifiedMonth + "/" + modifiedDate + "/" + modifiedYear;
                            },
                            "aTargets": [7]
                        },
                        {
                            "mRender": function (data, type, row) {
                                var $out = $("<div>");
                                var $a;

                                if(_ctx.SelectedCollection.Id !== ''){
                                    if(row.mediaId != _ctx.SelectedCollection.Id){
                                        
                                        if($.inArray( eval(row.mediaId), _ctx.SelectedCollection.aValues )==-1){
                                            $a = $('<a class="btn btn-small btn-primary btnAdd span1" mediaId="' + row.mediaId + '" style="color: white;" href="#"><i class="glyphicon glyphicon-plus"></i> Add</a>');                                            
                                        }else{
                                            $a = $('<a class="btn btn-small btn-warning btnRemove span1" mediaId="' +row.mediaId + '" style="color: white;" href="#">Remove</a>');                                            
                                        }
                                    }
                                }
                                else if (_ctx.SelectedFeed.Id !== '') {
                                    if (row.mediaId != _ctx.SelectedFeed.Id) {                                        
                                        $a = $('<a class="btn btn-small btn-primary btnFeedItemSelect span1" mediaId="' + row.mediaId + '" style="color: white;" href="#"><i class="glyphicon glyphicon-plus"></i> Select Media</a>');                                        
                                    }
                                }
                                else{
                                    
                                    $a = $('<a class="btn btn-small btn-primary btnEdit span1" mediaId="' + row.mediaId + '" mediaType="'+ row.mediaType +'" style="color: white;" href="#">Edit</a>');
                                    
                                }

                                $out.append($a);
                                return $out.html();
                            },
                            "aTargets": [9]
                        },
                        { "sClass": "center", "aTargets": [9] },
                        { 'bSortable': false, 'aTargets': [5, 9] }

                    ]
                });

                $("[name='mediaFilterGrid_length']")
                    .unbind()
                    .val(_pageSize)
                    .change(function () {
                        _pageNum = 1;
                        _pageSize = $(this).val();
                        refreshMediaTable();
                    });

                $("#mediaFilterGrid th").unbind('click.DT');
                $("#mediaFilterGrid th").not(".sorting_disabled").click(function () {
                    _pageNum = 1;
                    if ($(this).hasClass('sorting_asc') || $(this).hasClass('sorting_desc')) {
                        _sortDirection = $(this).hasClass('sorting_desc') ? '' : '-';
                    }
                    else {
                        _sortDirection = '';
                    }
                    _sortProperty = $(this).attr('sort');
                    _sortIndex = $('#mediaFilterGrid th').filter(
                        function () {
                            return $(this).attr('sort') == _sortProperty;
                        }).index();
                    refreshMediaTable();
                });


                $("#mediaFilterGrid_info").hide();
                $("#mediaFilterGrid_filter").hide();


            };

            bindDatatable();            
        }

        var setupButtonEvents = function () {

        	$('#toCsv').off().on('click', function () {
        		$("#mediaFilterGrid").toCSV(this);
        	});

            $("#mediaFilterGrid .btnEdit").click(function(){
                _ctx.setPageData({
                    "_pageSize" : _pageSize,
                    "_pageNum" : _pageNum,
                    "_sortDirection" : _sortDirection,
                    "_sortProperty" :_sortProperty,
                    "_sortIndex" : _sortIndex
                });

                var mediaId = $(this).attr('mediaId');
                var mediaType = $(this).attr('mediaType');
                editMedia(mediaId, mediaType.toLowerCase());                                        
                return false;
            });

            $("#mediaFilterGrid .btnAdd").click(function(){
                var mediaId = $(this).attr('mediaId');
                var btn = $(this);
                $().showSpinner();
                CDC.Admin.Collection.addMedia(_ctx.SelectedCollection.Id, mediaId, function(){swapToRemove(btn); $().hideSpinner();});
                return false;
            });

            $("#mediaFilterGrid .btnRemove").click(function(){
                var mediaId = $(this).attr('mediaId');
                var btn = $(this);
                $().showSpinner();
                CDC.Admin.Collection.removeMedia(_ctx.SelectedCollection.Id, mediaId, function(){swapToAdd(btn); $().hideSpinner();});
                return false;
            });

            $("#mediaFilterGrid .btnFeedItemSelect").click(function () {
                var mediaId = $(this).attr('mediaId');                                               
                //document.location = urlRoot + "/Capture/Capture.htm?feedItemSource=" + mediaId;
                document.location = urlRoot + "/Feeds/Feeds.htm?view=detail&id=" + _ctx.SelectedFeed.Id + "&selectedMediaId=" + mediaId;
                return false;
            });

        };

        this.refresh = function(aValues) {
            refreshMediaTable();
        };

        var swapToAdd = function(btn){
            var mediaId = $(btn).attr("mediaId");
            var $a = $('<a class="btn btn-small btn-primary btnAdd span1" mediaId="' + mediaId + '" style="color: white;" href="#" onclick="CDC.Admin.Collection.addMedia('+ _ctx.SelectedCollection.Id +', '+ mediaId +', swapToRemove(this));"><i class="glyphicon glyphicon-plus"></i> Add</a>');
            $(btn).parent().empty().append($a);
        };

        var swapToRemove = function(btn){
            var mediaId = $(btn).attr("mediaId");
            var $a = $('<a class="btn btn-small btn-warning btnRemove span1" mediaId="' + mediaId + '" style="color: white;" href="#" onclick="CDC.Admin.Collection.removeMedia('+ _ctx.SelectedCollection.Id +', '+ mediaId +', swapToAdd(this));">Remove</a>');
            $(btn).parent().empty().append($a);
        };

        refreshMediaTable();

        return this;

    };
    
})(jQuery);