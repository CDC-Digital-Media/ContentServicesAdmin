/* File Created: March 28, 2014 */


function loadThumbnailUtility() {

    var _total = 0;
    var _pageSize = 100;
    var _media = [];
    var _rootUrl = APIRoot + "/adminapi/v1/resources/media/?status=published&sort=datePublished";
    var currentIndex = 0;

    function getUrl() {
        if ($(".mediaTypes").val() !== "") {
            return _rootUrl + "&mediaType=" + $(".mediaTypes").val();
        }
        else {
            return _rootUrl;
        }
    }


    $('#content').load("Templates/thumbnailUtil.htm", function () {

        var $root = $(".thumbnailUtil");

        var mediaTypePicker = $root.find(".mediaTypes").mediaTypePicker();

        $root.find(".btnGet").click(function () {

            getCount(function () {
                getPagedSets(buildThumbDiv);
            });

        });

        var buildThumbDiv = function (resultSet) {

            _media = resultSet;
            var $itm = _media[0];

            var $wrapperDiv = $("<div style='border:1px solid grey; padding:10px; margin:5px; height:150px;'></div>");
            var $thumbDiv = $("<div style='float:left; height:150px;'>&nbsp;</div>");
            $wrapperDiv.append($thumbDiv);

            var $infoDiv = $("<div style='margin-left:200px;'>");
            $infoDiv.append($("<div>" + $itm.id + ": <a href='#' mediaId='" + $itm.mediaId + "' mediaType='" + $itm.mediaType + "'>" + $itm.title + "</a></div>"));
            $infoDiv.find('a').click(function () {
                editMedia($(this).attr('mediaId'), $(this).attr('mediaType').toLowerCase());
            });

            if ($itm.sourceUrl !== '') {
                $infoDiv.append($("<div>" + $itm.sourceUrl + "</div>"));
            }
            else {
                $infoDiv.append($("<div style='color:red;'>No Source URL provided</div>"));
            }

            if ($itm.targetUrl !== '') {
                $infoDiv.append($("<div>" + $itm.targetUrl + "</div>"));
            }
            else {
                $infoDiv.append($("<div style='color:red;'>No Target URL provided</div>"));
            }

            if ($itm.mediaType == 'Collection') {
                $infoDiv.append($("<div style='color:red;'>" + $itm.mediaType + "</div>"));
            }
            else {
                $infoDiv.append($("<div>" + $itm.mediaType + "</div>"));
            }

            $wrapperDiv.append($infoDiv);
            $root.find(".thumbs").append($wrapperDiv);
            $(window).scrollTop($(document).height());

            var doNext = function () {
                _media.shift();
                if (_media.length > 0) {

                	setTimeout(function () {
                		buildThumbDiv(_media);
                	},100);
                    
                }
                else {
                    $("[index='" + (eval(currentIndex) + 1) + "']").click();
                }
            };

            if ($itm.mediaType != 'Collection' && $itm.mediaType != 'Podcast' && $itm.mediaType != 'Podcast Series' && $itm.sourceUrl !== '') {

                $thumbDiv.showSpinner();

                	var thumbGen = $thumbDiv.thumbnailGen({
                		media: $itm,
                		autoRun: false
                	});

                	thumbGen.thumbNailExists(function (found) {

                		var src = APIRoot + "/adminapi/v1/resources/media/" + $itm.id + "/thumbnail/?nochache=true&unq=" + getUniqueInt();

                		if (!found) {
                			thumbGen.createThumbnail(function () {
                				var $img = $("<img style='border:1px solid #ddd; width:155px; height:84px; clear:both;' src='" + src + "'>");
                				$thumbDiv.append($img);                				
                				$thumbDiv.hideSpinner();
                				doNext();
                			})
                		}
                		else {
                			var $img = $("<img style='border:1px solid #ddd; width:155px; height:84px; clear:both;' src='" + src +"'>");
                			$thumbDiv.append($img);                				
                			$thumbDiv.hideSpinner();
                			doNext();                			
                		}
                	});

            

            }
            else {
                doNext();
            }

        };

        var getPagedSets = function (callback) {


            this.handleCallback = function (resultSet) {
                var func = callback;
                if (typeof func === 'function') { func(resultSet); }
            };

            var getPage = function (idx) {
                var index = idx;
                currentIndex = idx;

                $root.find(".thumbs").empty();

                var url = getUrl() + "&max=" + _pageSize + "&pageNum=" + index;

                $.ajax({
                    url: url,
                    dataType: 'jsonp'
                }).done(function (response) {
                    handleCallback(response.results);

                }).fail(function (xhr, ajaxOptions, thrownError) {
                    console.debug(xhr.status);
                    console.debug(xhr.responseText);
                    console.debug(thrownError);
                });
            };

            $root.find(".thumbs").empty();
            $root.find(".buttonRow").empty();

            for (var i = 0; i < (_total / _pageSize); i++) {
                var $btn = $("<input type='button' class='btn btn-small btnGet' index='" + (i + 1) + "' value='" + (i + 1) + "' style='margin-right:2px; margin-bottom:2px;'/>");
                var idx = i + 1;
                $btn.off().click(function () {                    
                    $root.find(".btn-primary").removeClass("btn-primary");
                    $(this).addClass("btn-primary");
                    getPage($(this).attr("index"));
                });
                $root.find(".buttonRow").append($btn);
            }

        };


        var getCount = function (callback) {
            var url = getUrl() + "&max=1";

            this.handleCallback = function () {
                var func = callback;
                if (typeof func === 'function') { func(); }
            };

            $.ajax({
                url: url,
                dataType: 'jsonp'
            }).done(function (response) {
                _total = response.meta.pagination.total;
                handleCallback();

            }).fail(function (xhr, ajaxOptions, thrownError) {
                console.debug(xhr.status);
                console.debug(xhr.responseText);
                console.debug(thrownError);
            });

        };

        function getUniqueInt() {
        	var d = new Date();
        	var n = d.getMilliseconds();
        	return n;
        }


    });
}