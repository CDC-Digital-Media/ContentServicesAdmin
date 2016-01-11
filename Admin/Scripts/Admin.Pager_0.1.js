"use strict"; //ignore jslint

(function ($) {
    var PLUGIN_NAME = 'pager';

    // plugin signature ///////////////////////
    $[PLUGIN_NAME] = {
        defaults: {
            count: '',
            displayCount: '',
            totalPages: '',            
            currentPageNum: 1,
            pagingHandler: ''
        }
    };

    // main funtion //////////////////////////
    $.fn[PLUGIN_NAME] = function (options) {

        $[PLUGIN_NAME].defaults.target = this;
        options = $.extend({}, $[PLUGIN_NAME].defaults, options);

        var currentPageNumber = options.currentPageNum;          

        function performPaging(pageNumber) {      
            
            if (typeof options.pagingHandler === 'function'){
                options.pagingHandler(pageNumber);
            }
            else{
                var pageIndex = pageNumber - 1;
                $(".grid-pager input").val(pageIndex).trigger("change");
            }

        }

        function main() {            
            buildOutPaging();
        }

        function buildOutPaging(data) {
            $(options.target).empty();                        
            var pgHolder = [];

            // build paging element
            pgHolder.push('<div class="form-inline">');
            if (isIE()) {
            	pgHolder.push('<div class="pagination_total form-group">Total Items (' + options.count + ') </div>');
            } else {
            	pgHolder.push('<div class="pagination_total form-group"><a href="#" id="toCsv"><img src="../Images/excelIcon.png"></a><br>Total Items (' + options.count + ') </div>');
            }
            
            pgHolder.push('<ul class="pagination form-group">');
            
            if (currentPageNumber == 1) { pgHolder.push('<li class="disabled"><a href="javascript:void(0);">Prev</a></li>'); }
            else { pgHolder.push('<li><a class="pgPrev" href="javascript:void(0);">Prev</a></li>'); }
            

            if (options.totalPages <= 6) {
                for (i=0; i< options.totalPages; i++)
                {                
                    pgHolder.push('<li><a class="pg_' + (i+1) + '" href="javascript:void(0);">' + (i+1) + '</a></li>');                                
                }
            }
            else {

                var showStartEllipse = false;
                var showEndEllipse = false;
                var startPosition, endPostion;

                if (currentPageNumber <= 4) {
                    startPosition = 1;
                    endPostion = 5;                    
                    showEndEllipse = options.totalPages > 7;
                }
                else if (currentPageNumber >= options.totalPages - 4)                
                {
                    startPosition = options.totalPages - 5;
                    endPostion = options.totalPages;
                    showStartEllipse = currentPageNumber > 3;
                }
                else {
                    startPosition = currentPageNumber - 2;
                    endPostion = currentPageNumber + 2;
                    showStartEllipse = true;
                    showEndEllipse = true;
                }                

                if (showStartEllipse) {
                    pgHolder.push('<li><a class="pg_1" href="javascript:void(0);">1</a></li>');
                    pgHolder.push('<li class="elipsis"><a href="#">...</a></li>');
                }

                for (var i=startPosition; i<=endPostion; i++) {
                    pgHolder.push('<li><a class="pg_' + i + '" href="javascript:void(0);">' + i + '</a></li>');
                }

                if (showEndEllipse) {
                    pgHolder.push('<li class="elipsis"><a href="#">...</a></li>');
                    pgHolder.push('<li><a class="pg_' + options.totalPages + '" href="javascript:void(0);">' + options.totalPages + '</a></li>');
                }

            }

            if (currentPageNumber == options.totalPages) { pgHolder.push('<li class="disabled"><a href="javascript:void(0);">Next</a></li>'); }
            else { pgHolder.push('<li><a class="pgNext" href="javascript:void(0);">Next</a></li>'); }

            pgHolder.push('</ul>');
            pgHolder.push('</div>');
            $(options.target).append(pgHolder.join(''));


            /// apply event handlers
            var $pageElem = $(options.target).find("a[class='pg_" + currentPageNumber + "']");
            
            if ($pageElem != null) {
                $pageElem.parent().attr("class", "active");
            }

            $('#toCsv').off().on('click', function () {            	
            	$(".searchResults").toCSV(this);
            });
        	

            $(options.target).find("a[class*='pg']:not(.pgPrev, .pgNext)").each(function (index) {
                $(this).on("click", function () {
                    // clear class
                    $("a[class*='pg_']").parent().attr("class", "");
                                        
                    // set the class on the selected anchor
                    $(this).parent().attr("class", "active");                                   

                    currentPageNumber = eval($(this).text());
                    performPaging(currentPageNumber);
                });
            });


            $(options.target).find(".pgPrev").click(function() {
                    currentPageNumber = (eval(currentPageNumber) - 1);
                    performPaging(currentPageNumber);
                });
            $(options.target).find(".pgNext").click(function() {
                    currentPageNumber = (eval(currentPageNumber) + 1);
                    performPaging(currentPageNumber);
                });
            
            $(options.target).find(".elipsis").unbind();
            $(options.target).find(".elipsis a").unbind();            
            $(options.target).find(".elipsis").next().find('a').css('border-width', '1px');
        
        }


        main();
        return  $(options.target);

    };

})(jQuery);