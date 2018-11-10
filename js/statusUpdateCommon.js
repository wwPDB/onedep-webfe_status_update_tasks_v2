/*
 * File:  statusUpdateCommon.js
 * Date:  20-Dec-2013  J. Westbrook
 *
 *
 * Updates:
 *   15-Jan-2014  jdw add current status display
 *   04-Mar-2014  jdw add merge coordinate form
 *   20-May-2014  jdw export author release status on status update op
 *   27-Jul-2014  jdw update format of error messages -
 *   19-Jan-2015  jdw modify getEntryInfo() to work with async: false  -
 *   19-Mar-2015  jdw manage experimental methods along with other server data
 *                    and provide this on link to communication module.
 *    7-May-2015  jdw add reload form support
 *    2-Aug-2015  jdw add support for process site  -  status-process-site-update-form
 *   21-Oct-2015  jdw add addtional em specific update functionality
 *   22-Feb-2016  jdw update em status form on request completion
 *   12-Feb-2018  ep  hide em form unless EMDB in requested accession codes
 *   23-May-2018  ep  Update selectors to use .val() instead of deprecated attributes
 *   11-Jun-2018  ep  Add displayReportContent that will display on error or hide content
 *
 */
//
// Globals -
//
var sessionId = '';
var entryId = '';
var pdbId = '';
var emdbId = '';
var combId = '';
var structTitle = '';
var experimentalMethods = '';
var annotatorId = '';
var statusCode = '';
var authRelCode = '';
var initialDepositDate = '';
var holdCoordinatesDate = '';
var coordinatesDate = '';
var approvalType = '';
var processSite = '';
var reqacctypes = '';
//
var em_current_status = '';
var em_deposition_date = '';
var em_deposition_site = '';
var em_obsoleted_date = '';
var em_details = '';
var em_last_update = '';
var em_map_hold_date = '';
var em_map_release_date = '';
var em_header_release_date = '';
var em_replace_existing_entry_flag = '';
var em_title = '';
//
var standaloneMode = true;
var standaloneModeFirst = true;
//
var successFlag = 'false';
var errorFlag = '';
var errotText = '';
//
var pagePath = '';
//
// Application task URLS
statusMiscReportsUrl = '/service/status_update_tasks_v2/misc_reports';
statusCodeUpdateUrl = '/service/status_update_tasks_v2/status_code_update';
statusReloadUrl = '/service/status_update_tasks_v2/status_reload';
setIdcodeUrl = '/service/status_update_tasks_v2/set_idcode';
statusCreateFilesUrl = '/service/status_update_tasks_v2/create_files';
statusMergeXyzUrl = '/service/status_update_tasks_v2/mergexyzcalc';
processSiteUpdateUrl = '/service/status_update_tasks_v2/process_site_update';
//
setIdcodeEmUrl = '/service/status_update_tasks_v2/set_idcode_em';
statusCodeUpdateEmUrl = '/service/status_update_tasks_v2/status_code_update_em';

var newSessionServiceUrl = '/service/status_update_tasks_v2/newsession';
//var getSessionInfoServiceUrl = '/service/status_update_tasks_v2/getsessioninfo';

/*window.log = function(){
  log.history = log.history || [];   // store logs to an array for reference
  log.history.push(arguments);
  if(this.console){
    console.log( Array.prototype.slice.call(arguments) );
  }
};*/

(function() {
    var b, d, c = this,
        a = c.console;
    c.log = b = function() {
        d.push(arguments);
        a && a.log[a.firebug ? "apply" : "call"](a, Array.prototype.slice.call(arguments))
    };
    c.logargs = function(e) {
        b(e, arguments.callee.caller.arguments)
    };
    b.history = d = []
})();
String.prototype.startsWith = function(str) {
    return this.indexOf(str) == 0;
};

function logContext(message) {
    //log("log: " + message + " (  entry id " + entryId + " session id " + sessionId + " annotator id " + annotatorId + ")");
    console.log("log: " + message );
}

function newSession(context) {
    var retObj;
    clearServiceContext();
    var serviceData = getServiceContext();
    logContext("Calling newsession ");
    $.ajax({
        url: newSessionServiceUrl,
        async: false,
        data: serviceData,
        type: 'post',
        success: function(jsonObj) {
            retObj = jsonObj;
        }
    });
    //
    assignContext(retObj);
    logContext("After newsession ");
    appendContextToMenuUrls();
}

function getEntryInfoOrg() {
    var entryInfoUrl = '/service/status_update_tasks_v2/entryinfo';
    var serviceData = getServiceContext();
    $.ajax({
        url: entryInfoUrl,
        async: false,
        data: serviceData,
        dataType: 'json',
        type: 'post',
        success: function(jsonObj) {
            assignContext(jsonObj);
            renderContext();
        },
        beforeSubmit: function(arr, $form, options) {
            // Reset any existing state --
        }

    });

    //
    //logContext("After getEntryInfo ");
}


function getEntryInfo() {
    var entryInfoUrl = '/service/status_update_tasks_v2/entryinfo';
    var serviceData = getServiceContext();
    $.ajax({
        url: entryInfoUrl,
        //        async: false,
        data: serviceData,
        dataType: 'json',
        type: 'post',
        beforeSubmit: function(arr, $form, options) {
            // Reset any existing state --
        }
    }).done(function(jsonObj) {
        assignContext(jsonObj);
        renderContext();
        logContext("After done in getEntryInfo  - statusCode " + statusCode);
        appendContextToMenuUrls();
        updateStatusForm();
        if (em_current_status.length > 0) {
            updateStatusFormEm();
             if ($("#status-update-em-dialog").length > 0) {
                 $("#subheader").html(getSubHeaderEm());
             }
        }
    });
    //
    //logContext("After getEntryInfo ");
}

function getSubHeader() {
    //    var myText = entryId + '<br /><h5>';
    var myText = '<span class="pull-right">' + entryId + '</span> <br /><h5>';
    if (statusCode.length > 0) {
        myText += '&nbsp;&nbsp;&nbsp;&nbsp;Status: ' + statusCode
    }

    if (authRelCode.length > 0) {
        myText += '&nbsp;&nbsp; Author status: ' + authRelCode
    }

    if (initialDepositDate.length > 0) {
        myText += '&nbsp;&nbsp; Deposited: ' + initialDepositDate
    }

    if (annotatorId.length > 0) {
        myText += '<br />&nbsp;&nbsp; Annotator: ' + annotatorId
    }

    if (approvalType.length > 0) {
        myText += '&nbsp;&nbsp; Approval type: ' + approvalType
    }
    myText += '</h5>'
    logContext("After getSubHeader() myText " + myText);
    return myText
}

function getSubHeaderEm() {
    //    var myText = entryId + '<br /><h5>';
    var myText = '<span class="pull-right">' + entryId + '</span> <br /><h5>';

    if (emdbId.length > 0) {
        myText += '&nbsp;&nbsp;&nbsp;&nbsp;EMDB ID: ' + emdbId
    }

    if (em_current_status.length > 0) {
        myText += '&nbsp;&nbsp;&nbsp;&nbsp;EM Status: ' + em_current_status
    }

    if (authRelCode.length > 0) {
        myText += '&nbsp;&nbsp; Author status: ' + authRelCode
    }

    /*
    if (initialDepositDate.length > 0) {
        myText += '&nbsp;&nbsp; Deposited: ' + initialDepositDate
    }

    if (annotatorId.length > 0) {
        myText += '<br />&nbsp;&nbsp; Annotator: ' + annotatorId
    }

    if (approvalType.length > 0) {
        myText += '&nbsp;&nbsp; Approval type: ' + approvalType
    }
    */
    myText += '</h5>'
    logContext("After getSubHeaderEm() myText " + myText);
    return myText
}

function renderContext() {
    /*
         Load some cosmetic details in the top of page  --
     */
    if (structTitle.length > 0) {
        $('#my_title').remove();
        $('.page-header').append('<h5 id="my_title"> Title: ' + structTitle + '</h5>');
    } else {
        $('#my_title').hide();
    }

    if (combId.length > 0) {
        $('title').html("Stat: " + combId);
    } else if (pdbId.length > 0 && entryId.length > 0) {
        $('title').html("Stat: " + pdbId + '/' + entryId);
    } else if (entryId.length > 0) {
        $('title').html("Stat: " + entryId);
    } else {
        $('title').html("Status");
    }

    //$("#subheader").html(getSubHeader());
}

function updateStatusForm() {
    logContext("+updateStatusForm - statusCode " + statusCode);
    if (statusCode.length > 0) {
        $('#status-code').val(statusCode);
        //$("#status-code option[value=" + statusCode + "]").attr("selected", "selected");
    }
    if (authRelCode.length > 0) {
        $('#auth-status-code').val(authRelCode);
        //$("#auth-status-code option[value=" + authRelCode + "]").attr("selected", "selected");
    }
    if (approvalType.length > 0) {
        $('#approval-type').val(approvalType);
        //$("#approval-type option[value=" + approvalType + "]").attr("selected", "selected");
    }

    if (annotatorId.length > 0) {
        $('#annotator-initials').val(annotatorId);
    }
    if (holdCoordinatesDate.length > 0) {
        $('#auth-status-hold-date').val(holdCoordinatesDate);
    }

    if (processSite.length > 0) {
        //$("#process-site option[value=" + processSite + "]").attr("selected", "selected");
	$("#process-site").val(processSite);
    }

}

function updateStatusFormEm() {
    /*
    var em_current_status = '';
    var em_deposition_date = '';
    var em_deposition_site = '';
    var em_details = '';
    var em_last_update = '';
    var em_map_release_date = '';
    var em_replace_existing_entry_flag = '';
    var em_title = '';
     */
    logContext("+updateStatusFormEm - em_current_status " + em_current_status);

    if (em_current_status.length > 0) {
        //$("#em_current_status option[value=" + em_current_status + "]").attr("selected", "selected");
        $("#em_current_status").val(em_current_status);

    }

    if (em_replace_existing_entry_flag.length > 0) {
        //$("#em_replace_existing_entry_flag option[value=" + em_replace_existing_entry_flag + "]").attr("selected", "selected");
	$("#em_replace_existing_entry_flag").val(em_replace_existing_entry_flag);
    }

    if (em_map_release_date.length > 0) {
        $('#em_map_release_date').val(em_map_release_date);
    }

    if (em_header_release_date.length > 0) {
        $('#em_header_release_date').val(em_header_release_date);
    }

    if (em_deposition_date.length > 0) {
        $('#em_deposition_date').val(em_deposition_date);
    }

    if (em_obsoleted_date.length > 0) {
        $('#em_obsoleted_date').val(em_obsoleted_date);
    }

    if (em_last_update.length > 0) {
        $('#em_last_update').val(em_last_update);
    }

    if (em_map_hold_date.length > 0) {
        $('#em_map_hold_date').val(em_map_hold_date);
    }

    if (em_title.length > 0) {
        $('#em_title').val(em_title);
    }

    if (em_details.length > 0) {
        $('#em_details').val(em_details);
    }

    if (em_deposition_site.length > 0) {
        //$("#em_deposition_site option[value=" + em_deposition_site + "]").attr("selected", "selected");
	$("#em_deposition_site").val(em_deposition_site);
    }

    if (approvalType.length > 0) {
        $('#approval-type').val(approvalType);
        //$("#approval-type option[value=" + approvalType + "]").attr("selected", "selected");
    }

    if (annotatorId.length > 0) {
        $('#annotator-initials').val(annotatorId);
    }

    if (processSite.length > 0) {
        //$("#process-site option[value=" + processSite + "]").attr("selected", "selected");
	$("#process-site").val(processSite);
    }


}


function getCurrentContext() {
    if ((typeof startupFromService != 'undefined') && startupFromService) {
        sessionId = startupSessionId;
        entryId = startupEntryId;
        annotatorId = startupAnnotatorId;
        statusCode = startupStatusCode;
        authRelCode = startupAuthRelCode;
        //
        initialDepositDate = startupInitialDepositDate;
        holdCoordinatesDate = startupHoldCoordinatesDate;
        coordinatesDate = startupCoordinatesDate;
        pdbId = startupPdbId;
        emdbId = startupEmdbId;
        //
	reqacctypes = startupAccTypes
	//
        standaloneMode = false;
    } else {
        var myUrl = $(location).attr('href');
        pagePath = $.url(myUrl).attr('relative');
        params = $.url(myUrl).param();
        if ("sessionid" in params) {
            sessionId = params.sessionid;
        }
        if ("entryid" in params) {
            entryId = params.entryid;
            standaloneMode = false;
        } else {
            standaloneMode = true;
        }
        if ("annotatorid" in params) {
            annotatorId = params.annotatorid;
            standaloneMode = false;
        } else {
            standaloneMode = true;
        }
        if ("statuscode" in params) {
            statusCode = params.statuscode;
            standaloneMode = false;
        } else {
            standaloneMode = true;
        }

        if ("authrelcode" in params) {
            authRelCode = params.authrelcode;
        }

        if ("initialdepositdate" in params) {
            initialDepositDate = params.initialdepositdate;
        }

        if ("holdcoordinatesdate" in params) {
            holdCoordinatesDate = params.holdcoordinatesdate;
        }

        if ("coordinatesdate" in params) {
            coordinatesDate = params.coordinatesdate;
        }

        if ("expmethod" in params) {
            experimentalMethods = params.expmethod;
        }

        if ("reqacctypes" in params) {
            reqacctypes = params.reqacctypes;
        }

        logContext("After getCurrentContext() sessionId " + sessionId + " entryId " +  entryId + " annotatorId " + annotatorId );
        logContext("After getCurrentContext() experimentalMethods " +  experimentalMethods);
    }
}



function appendContextToMenuUrls() {
    // append the current session id to menu urls

    $("fieldset legend a, ul.nav li a").attr('href', function(index, href) {
        ret = href.split("?")[0];
        if (sessionId.length > 0 ) {
            ret += (/\?/.test(ret) ? '&' : '?') + 'sessionid=' + sessionId;
        }
        if (entryId.length > 0 ) {
            ret += (/\?/.test(ret) ? '&' : '?') + 'entryid=' + entryId;
        }

        if (annotatorId.length > 0 ) {
            ret += (/\?/.test(ret) ? '&' : '?') + 'annotatorid=' + annotatorId;
        }

        if (statusCode.length > 0) {
            ret += (/\?/.test(ret) ? '&' : '?') + 'statuscode=' + statusCode;
        }

        if (authRelCode.length > 0) {
            ret += (/\?/.test(ret) ? '&' : '?') + 'authrelcode=' + authRelCode;
        }

        if (initialDepositDate.length > 0) {
            ret += (/\?/.test(ret) ? '&' : '?') + 'initialdepositdate=' + initialDepositDate;
        }

        if (holdCoordinatesDate.length > 0) {
            ret += (/\?/.test(ret) ? '&' : '?') + 'holdcoordinatesdate=' + holdCoordinatesDate;
        }

        if (coordinatesDate.length > 0) {
            ret += (/\?/.test(ret) ? '&' : '?') + 'coordinatesdate=' + coordinatesDate;
        }

        if (experimentalMethods.length > 0) {
            ret += (/\?/.test(ret) ? '&' : '?') + 'expmethod=' + experimentalMethods;
        }

        if (reqacctypes.length > 0) {
            ret += (/\?/.test(ret) ? '&' : '?') + 'reqacctypes=' + reqacctypes;
        }

        return ret;
    });

    logContext('Update url context with pdbId  = ' + pdbId);
    logContext('Update url context with emdbId = ' + emdbId);
    logContext('Update url reqacctypes' + reqacctypes.indexOf('EMDB'));

    if (pdbId.length > 0  || standaloneModeFirst) {
        $("li.pdb-context").show();
    } else {
        $("li.pdb-context").hide();
    }

    if ((emdbId.length > 0 && reqacctypes.indexOf('EMDB') >= 0) || standaloneModeFirst) {
        $("li.em-context").show();
	logContext('Showing EM context');
    } else {
        $("li.em-context").hide();
	logContext('Hiding EM context ' + reqacctypes);
    }
    standaloneModeFirst = false;

}


function assignContext(jsonObj) {
    // Extract interesting attributes from input object --
    if ('sessionid' in jsonObj) {
        sessionId = jsonObj.sessionid;
    }
    if ('errorflag' in jsonObj) {
        errorFlag = jsonObj.errorflag;
    }
    if ('errortext' in jsonObj) {
        errorText = jsonObj.errortext;
    }

    if ('entryid' in jsonObj) {
        entryId = jsonObj.entryid;
    }
    if ('annotatorid' in jsonObj) {
        annotatorId = jsonObj.annotatorid;
    }

    if ('pdb_id' in jsonObj) {
        pdbId = jsonObj.pdb_id;
    }

    if ('comb_id' in jsonObj) {
        combId = jsonObj.comb_id;
    }

    if ('experimental_methods' in jsonObj) {
        experimentalMethods = jsonObj.experimental_methods;
    }

    if ('struct_title' in jsonObj) {
        structTitle = jsonObj.struct_title;
    }

    if ('statuscode' in jsonObj) {
        statusCode = jsonObj.statuscode;
    }
    if ("authrelcode" in jsonObj) {
        authRelCode = jsonObj.authrelcode;
    }

    if ("initialdepositdate" in jsonObj) {
        initialDepositDate = jsonObj.initialdepositdate;
    }

    if ("holdcoordinatesdate" in jsonObj) {
        holdCoordinatesDate = jsonObj.holdcoordinatesdate;
    }

    if ("coordinatesdate" in jsonObj) {
        coordinatesDate = jsonObj.coordinatesdate;
    }

    if ("annotator_initials" in jsonObj) {
        annotatorId = jsonObj.annotator_initials;
    }

    if ("approval_type" in jsonObj) {
        approvalType = jsonObj.approval_type;
    }

    if ("process_site" in jsonObj) {
        processSite = jsonObj.process_site;
    }

    if ("reqacctypes" in jsonObj) {
        reqacctypes = jsonObj.reqacctypes;
    }

    // em items --
    if ( 'em_current_status' in jsonObj) {
        em_current_status = jsonObj.em_current_status;
    }
    if ('em_deposition_date' in jsonObj) {
        em_deposition_date = jsonObj.em_deposition_date;
    }
    if ('em_deposition_site' in jsonObj) {
        em_deposition_site = jsonObj.em_deposition_site;
    }
    if ('em_details' in jsonObj) {
        em_details = jsonObj.em_details;
    }
    if ('em_last_update' in jsonObj) {
        em_last_update = jsonObj.em_last_update;
    }
    if ('em_map_hold_date' in jsonObj) {
        em_map_hold_date = jsonObj.em_map_hold_date;
    }
    if ('em_obsoleted_date' in jsonObj) {
        em_obsoleted_date = jsonObj.em_obsoleted_date;
    }
    if ('em_map_release_date' in jsonObj) {
        em_map_release_date = jsonObj.em_map_release_date;
    }
    if ('em_header_release_date' in jsonObj) {
        em_header_release_date = jsonObj.em_header_release_date;
    }
    if ('em_replace_existing_entry_flag' in jsonObj) {
        em_replace_existing_entry_flag = jsonObj.em_replace_existing_entry_flag;
    }
    if ('em_title' in jsonObj) {
        em_title= jsonObj.em_title;
    }
    if ('emdb_id' in jsonObj) {
        emdbId = jsonObj.emdb_id;
    }
}

function clearServiceContext() {
    sessionId = '';
    entryId = '';
    annotatorId = '';
    //
    statusCode = '';
    authRelCode = '';
    initialDepositDate = '';
    holdCoordinatesDate = '';
    coordinatesDate = '';
    experimentalMethods = '';
}

function getServiceContext() {
    // data that must be provided to any service request -
    var sc = {};
    sc.sessionid = sessionId;
    sc.entryid = entryId;
    sc.annotatorid = annotatorId;
    sc.useversion = 1;
    return sc;
}

function hideCommunicationFrame() {
    $('#status-communication-frame').addClass('displaynone');
    $('#full-page').show();
}

function progressStart() {
    $("#loading").fadeIn('slow').spin("large", "black");
}

function progressEnd() {
    $("#loading").fadeOut('fast').spin(false);
}

function updateCompletionStatus(jsonObj, statusId) {
    var errFlag = jsonObj.errorflag;
    var statusText = jsonObj.statustext;
    if (errFlag) {
        $(statusId + ' div.op-status').html('<p class="text-danger">' + statusText + '</p>');
        $(statusId + ' div.op-status').addClass('error-status');
    } else {
        $(statusId + ' div.op-status').html('<p class="text-success">' + statusText + '</p>');
        $(statusId + ' div.op-status').removeClass('error-status');
    }
    $(statusId + ' div.op-status').show();
}

// --------------------------------------------------------------------------------------------------------------
//   Appication specific options

function updateDownloadOptions(jsonObj) {
    var url;
    var el;
    var fn;
    var arr;
    var htmlS;
    if ("logfiles" in jsonObj) {
        arr = jsonObj.logfiles;
        htmlS = "";
        for (var i = 0; i < arr.length; i++) {
            fn = arr[i];
            url = "/sessions/" + sessionId + "/" + fn;
            el = '<span> &nbsp; <a href="' + url + '">' + fn + '</a> </span>'
            logContext("log file " + i + " " + el);
            htmlS += el;
        }
        if (arr.length > 0) {
            $("#download-logfiles").html(htmlS);
            $("#download-logfiles-label").html("Log files:");
            $("#download-logfiles").show();
            $("#download-logfiles-label").show();
        }
    }

}

function updateReportContent(jsonObj, contentId) {
    var retHtml = jsonObj.htmlcontent;
    var errFlag = jsonObj.errorflag;
    logContext('Updating report content  = ' + contentId);
    if (!errFlag) {
        logContext('Updating report content  with = ' + retHtml);
        logContext('Selection container ' + $(contentId).length);
        logContext('Selection report div ' + $(contentId + ' div.report-content').length);
        $(contentId + ' div.report-content').append(retHtml);
        $(contentId + ' div.report-content').show();
    }
}

function displayReportContent(jsonObj, contentId) {
    // Like updateReportContent - but display if errFlag is true - which indicates XML conversion failed. Does not append - replaces text.
    var retHtml = jsonObj.htmlcontent;
    var errFlag = jsonObj.errorflag;
    logContext('Updating report content  = ' + contentId);
    logContext('Updating report error  = ' + errFlag);
    if (errFlag) {
        logContext('Updating report content  with = ' + retHtml);
        logContext('Selection container ' + $(contentId).length);
        logContext('Selection report div ' + $(contentId + ' div.report-content').length);
        $(contentId + ' div.report-content').html(retHtml);
        $(contentId + ' div.report-content').show();
    } else {
	$(contentId + ' div.report-content').hide();
    }
}

function updateLinkContent(jsonObj, contentId) {
    var retHtml = jsonObj.htmllinkcontent;
    var errFlag = jsonObj.errorflag;
    logContext('Updating link content id = ' + contentId);
    if (retHtml.length > 0) {
        logContext('Updating link content  with = ' + retHtml);
        logContext('Selection container ' + $(contentId).length);
        logContext('Selection link div ' + $(contentId + ' div.op-links').length);
        $(contentId + ' div.op-links ').html(retHtml);
        $(contentId + ' div.op-links ').show();
    }
}

function handleCLoseWindow() {
    var inFormOrLink;
    $('a').on('click', function() {
        inFormOrLink = true;
    });
    $('form').on('submit', function() {
        inFormOrLink = true;
    });

    $(window).bind('beforeunload', function(eventObject) {
        var returnValue = undefined;
        if (!inFormOrLink) {
            returnValue = "Do you really want to close?";
        }
        eventObject.returnValue = returnValue;
        return returnValue;
    });
}

// --------------------------------------------------------------------------------------------------------------
//

$(document).ready(function() {
    getCurrentContext();
    if (sessionId.length == 0) {
        newSession('request session');
        logContext('Assigning new session id  = ' + sessionId);
    }
    //
    // This condition is not going to support both entry points -
    //
    if (!standaloneMode && entryId.length > 0) {
        getEntryInfo();
        appendContextToMenuUrls();
        updateStatusForm();
    }

    renderContext();

    //
    var myDate1 = new Date();
    var myDate2 = new Date();
    var dayOfMonth = myDate2.getDate();
    myDate2.setDate(dayOfMonth + 500);
    $(".form_date").datetimepicker({
        //      format: 'yyyy-mm-dd',
        //	startDate: '+0d',
        startDate: myDate1,
        //      endDate: '+1y',
        endDate: myDate2,
        weekStart: 1,
        //        todayBtn:  1,
        autoclose: 1,
        //        todayHighlight: 1,
        startView: 2,
        minView: 2,
        forceParse: 0
    });


    if ($("#status-identifier-dialog").length > 0) {
         $("#subheader").html(getSubHeader());
        if (standaloneMode) {
            //
            $("#status-identifier-dialog").removeClass("displaynone");
            $("#status-update-dialog").addClass("displaynone");
            $("#status-create-files-dialog").addClass("displaynone");
            $("#status-reload-files-dialog").addClass("displaynone");
            $("#status-misc-report-dialog").addClass("displaynone");
            $("#process-site-update-dialog").addClass("displaynone");
            $('#status-set-idcode-form div.op-status').hide();

            $('#status-set-idcode-form').ajaxForm({
                url: setIdcodeUrl,
                dataType: 'json',
                success: function(jsonObj) {
                    logContext("Setting Id Code Operation completed");
                    if (jsonObj.errorflag) {
                        progressEnd();
                        $('#status-set-idcode-form div.op-status').html(jsonObj.statustext);
                        $('#status-set-idcode-form div.op-status').show();
                        $('#status-set-idcode-button').show();
                    } else {
                        updateCompletionStatus(jsonObj, '#status-set-idcode-form');
                        updateLinkContent(jsonObj, '#status-set-idcode-form');
                        updateReportContent(jsonObj, '#status-report-container');
                        $('#status-report-container  div.status-misc-content').show();
                        $("#status-identifier-dialog").addClass("displaynone");
                        assignContext(jsonObj);
                        getEntryInfo();
                        progressEnd();
                        //
                        appendContextToMenuUrls();
                        // jdw today  - already called on completion of getEntryInfo()
                        // updateStatusForm();
                        $("#status-update-dialog").removeClass("displaynone");
                        $("#status-create-files-dialog").removeClass("displaynone");
                        $("#status-reload-files-dialog").removeClass("displaynone");
                        $("#status-misc-report-dialog").removeClass("displaynone");
                        $("#process-site-update-dialog").removeClass("displaynone");
                        progressEnd();
                    }
                },
                beforeSubmit: function(arr, $form, options) {
                    $('#status-set-idcode-form div.op-status').hide();
                    $('#status-set-idcode-form div.op-links').hide();
                    $('#status-report-container  div.report-content').hide();

                    progressStart();
                    $('#status-set-idcode-button').hide();
                    arr.push({
                        "name": "sessionid",
                        "value": sessionId
                    });
                }
            });
        } else {
            $("#status-identifier-dialog").addClass("displaynone");
            $("#status-update-dialog").removeClass("displaynone");
            $("#status-create-files-dialog").removeClass("displaynone");
            $("#status-reload-files-dialog").removeClass("displaynone");
            $("#status-misc-report-dialog").removeClass("displaynone");
            $("#process-site-update-dialog").removeClass("displaynone");
        }
    }

    if ($("#status-update-dialog").length > 0) {
        $("#subheader").html(getSubHeader());
        // status code update form
        $('#status-code-form').ajaxForm({
            url: statusCodeUpdateUrl,
            dataType: 'json',
            success: function(jsonObj) {
                logContext("Operation completed");
                progressEnd();
                updateCompletionStatus(jsonObj, '#status-code-form');
                updateLinkContent(jsonObj, '#status-code-form');
                updateReportContent(jsonObj, '#status-report-container');
                $('#status-report-container  div.report-content').show();
                $('#status-code-button').show();
                //JDW added
                assignContext(jsonObj);
                $("#subheader").html(getSubHeader());

            },
            beforeSubmit: function(formdata, $form, options) {
                formdata.push({
                    "name": "sessionid",
                    "value": sessionId
                });
                formdata.push({
                    "name": "entryid",
                    "value": entryId
                });
                formdata.push({
                    "name": "idcode",
                    "value": entryId
                });
                formdata.push({
                    "name": "idcode1",
                    "value": entryId
                });
                formdata.push({
                    "name": "initialdepositdate",
                    "value": initialDepositDate
                });
                formdata.push({
                    "name": "holdcoordinatesdate",
                    "value": holdCoordinatesDate
                });
                formdata.push({
                    "name": "coordinatesdate",
                    "value": coordinatesDate
                });
                formdata.push({
                    "name": "authrelcode",
                    "value": authRelCode
                });

                $('#status-code-form div.op-status').hide();
                $('#status-code-form div.op-links').hide();
                $('#status-report-container  div.report-content').hide();
                progressStart();
                $('#status-code-button').hide();

            }
        });

    }

    if ($("#status-misc-report-dialog").length > 0) {
         $("#subheader").html(getSubHeader());
        $('#status-misc-report-form').ajaxForm({
            url: statusMiscReportsUrl,
            dataType: 'json',
            success: function(jsonObj) {
                logContext("Operation completed");
                progressEnd();
                updateCompletionStatus(jsonObj, '#status-misc-report-form');
                updateLinkContent(jsonObj, '#status-misc-report-form');
                updateReportContent(jsonObj, '#status-report-container');
                $('#status-report-container  div.report-content').show();
                $('#status-misc-report-button').show();

            },
            beforeSubmit: function(formdata, $form, options) {
                formdata.push({
                    "name": "sessionid",
                    "value": sessionId
                });
                formdata.push({
                    "name": "entryid",
                    "value": entryId
                });
                formdata.push({
                    "name": "idcode",
                    "value": entryId
                });
                formdata.push({
                    "name": "idcode1",
                    "value": entryId
                });


                $('#status-misc-report-form div.op-status').hide();
                $('#status-misc-report-form div.op-links').hide();
                $('#status-report-container  div.report-content').hide();
                $('#status-misc-report-button').hide();
                progressStart();
            }
        });
    }

    if ($("#status-create-files-dialog").length > 0) {
        $('#status-create-files-form').ajaxForm({
            url: statusCreateFilesUrl,
            dataType: 'json',
            success: function(jsonObj) {
                logContext("Operation completed");
                progressEnd();
                updateCompletionStatus(jsonObj, '#status-create-files-form');
                updateLinkContent(jsonObj, '#status-create-files-form');
                updateReportContent(jsonObj, '#status-report-container');
                $('#status-report-container  div.report-content').show();
                $('#status-create-files-button').show();

            },
            beforeSubmit: function(formdata, $form, options) {
                formdata.push({
                    "name": "sessionid",
                    "value": sessionId
                });
                formdata.push({
                    "name": "entryid",
                    "value": entryId
                });
                formdata.push({
                    "name": "idcode",
                    "value": entryId
                });
                $('#status-create-files-form div.op-status').hide();
                $('#status-create-files-form div.op-links').hide();
                $('#status-report-container  div.report-content').hide();
                $('#status-create-files-button').hide();
                progressStart();
            }
        });
    }

   if ($("#status-reload-files-dialog").length > 0) {
        $('#status-reload-files-form').ajaxForm({
            url: statusReloadUrl,
            dataType: 'json',
            success: function(jsonObj) {
                logContext("Operation completed");
                progressEnd();
                updateCompletionStatus(jsonObj, '#status-reload-files-form');
                $('#status-reload-files-button').show();

            },
            beforeSubmit: function(formdata, $form, options) {
                formdata.push({
                    "name": "sessionid",
                    "value": sessionId
                });
                formdata.push({
                    "name": "entryid",
                    "value": entryId
                });
                formdata.push({
                    "name": "idcode",
                    "value": entryId
                });
                $('#status-reload-files-form div.op-status').hide();
                $('#status-reload-files-button').hide();
                progressStart();
            }
        });
    }

 if ($("#process-site-update-dialog").length > 0) {
        $('#process-site-update-form').ajaxForm({
            url: processSiteUpdateUrl,
            dataType: 'json',
            success: function(jsonObj) {
                logContext("Operation completed");
                progressEnd();
                updateCompletionStatus(jsonObj, '#process-site-update-form');
                $('#process-site-update-button').show();

            },
            beforeSubmit: function(formdata, $form, options) {
                formdata.push({
                    "name": "sessionid",
                    "value": sessionId
                });
                formdata.push({
                    "name": "entryid",
                    "value": entryId
                });
                formdata.push({
                    "name": "idcode",
                    "value": entryId
                });
                $('#process-site-update-form div.op-status').hide();
                $('#process-site-update-button').hide();
                progressStart();
            }
        });
    }

    // Coordinate merge and other task operations
    if ($("#task-dialog").length > 0) {
        if (entryId.length > 0) {
            $("#task-alt-dialog").html("Annotating entry: " + entryId);
            $("#task-alt-dialog").show();
            $("#task-dialog").show();
            $('#merge-xyz-task-form').ajaxForm({
                url: statusMergeXyzUrl,
                dataType: 'json',
                success: function(jsonObj, statusText, xhr, $form) {
                    var formId = "#" + $form.attr('id');
                    logContext("Operation completed");
                    progressEnd();
                    updateCompletionStatus(jsonObj, formId);
                    updateLinkContent(jsonObj, formId);
                    $(formId + ' fieldset input.my-task-form-submit ').show();
                },
                beforeSubmit: function(formdata, $form, options) {
                    formdata.push({
                        "name": "sessionid",
                        "value": sessionId
                    });
                    formdata.push({
                        "name": "entryid",
                        "value": entryId
                    });
                    var formId = "#" + $form.attr('id');
                    $(formId + ' fieldset div.my-task-form-status').hide();
                    $(formId + ' fieldset div.my-task-form-links ').hide();
                    $(formId + ' fieldset input.my-task-form-submit ').hide();
                    progressStart();
                }
            });
        } else {
            $("#task-dialog").hide();
            $("#task-alt-dialog").html("No active entry");
            $("#task-alt-dialog").show();
        }
    }


    //communication  operations
    if ($("#status-communication-dialog").length > 0) {
        $('#status-communication-button').click(function() {
            var serviceData = getServiceContext();
            url = "/service/messaging/new_session/wf?filesource=archive&embed=true&identifier=" + entryId +  '&annotator=' + annotatorId +
                 '&expmethod=' + experimentalMethods;
            $("#page-top").html('');
            $("#page-top").hide();
            $("#status-communication-frame").attr("src", url).removeClass("displaynone");
            $("#status-communication-frame").height(800);
        });

    }

    // communication  operations
    if ($("#status-communication-instant-dialog").length > 0) {
        var serviceData = getServiceContext();
        url = "/service/messaging/new_session/wf?filesource=archive&embed=true&identifier=" + entryId + '&annotator=' + annotatorId +
                     '&expmethod=' + experimentalMethods;
        logContext('communication instant url = ' + url);
        $("#page-top").html('');
        $("#page-top").hide();
        $("#status-communication-frame").attr("src", url).removeClass("displaynone");
        $("#status-communication-frame").height(800);
        logContext('communication instant done for ' + entryId);
    }

    // em status update  operations
    if ($("#status-identifier-em-dialog").length > 0) {
        if (standaloneMode) {
            //
            $("#status-identifier-em-dialog").removeClass("displaynone");
            $("#status-update-em-dialog").addClass("displaynone");
            $('#status-set-idcode-em-form div.op-status').hide();

            $('#status-set-idcode-em-form').ajaxForm({
                url: setIdcodeEmUrl,
                dataType: 'json',
                success: function(jsonObj) {
                    logContext("Setting Id Code Operation completed");
                    if (jsonObj.errorflag) {
                        progressEnd();
                        $('#status-set-idcode-em-form div.op-status').html(jsonObj.statustext);
                        $('#status-set-idcode-em-form div.op-status').show();
                        $('#status-set-idcode-em-button').show();
                    } else {
                        updateCompletionStatus(jsonObj, '#status-set-idcode-em-form');
                        updateLinkContent(jsonObj, '#status-set-idcode-em-form');
                        //updateReportContent(jsonObj, '#status-report-container');
                        //$('#status-report-container  div.status-misc-content').show();
                        $("#status-identifier-em-dialog").addClass("displaynone");
                        assignContext(jsonObj);
                        getEntryInfo();
                        progressEnd();
                        //
                        appendContextToMenuUrls();
                        // jdw today  - already called on completion of getEntryInfo()
                        // updateStatusForm();
                        $("#status-update-em-dialog").removeClass("displaynone");
                        progressEnd();
                    }
                },
                beforeSubmit: function(arr, $form, options) {
                    $('#status-set-idcode-em-form div.op-status').hide();
                    $('#status-set-idcode-em-form div.op-links').hide();

                    progressStart();
                    $('#status-set-idcode-em-button').hide();
                    arr.push({
                        "name": "sessionid",
                        "value": sessionId
                    });
                }
            });
        } else {
            $("#status-identifier-em-dialog").addClass("displaynone");
            $("#status-update-em-dialog").removeClass("displaynone");
        }
    }

    if ($("#status-update-em-dialog").length > 0) {
        $("#subheader").html(getSubHeaderEm());
        <!-- status code update form -->
        $('#status-code-em-form').ajaxForm({
            url: statusCodeUpdateEmUrl,
            dataType: 'json',
            success: function(jsonObj) {
                logContext("Operation completed");
                progressEnd();
                updateCompletionStatus(jsonObj, '#status-code-em-form');
                updateLinkContent(jsonObj, '#status-code-em-form');
		displayReportContent(jsonObj, '#status-update-container');
                $('#status-code-em-button').show();
                assignContext(jsonObj);
                $("#subheader").html(getSubHeaderEm());
                // add this dynamic update
                updateStatusFormEm();
            },
            beforeSubmit: function(formdata, $form, options) {
                formdata.push({
                    "name": "sessionid",
                    "value": sessionId
                });
                formdata.push({
                    "name": "entryid",
                    "value": entryId
                });
                formdata.push({
                    "name": "idcode",
                    "value": entryId
                });
                formdata.push({
                    "name": "idcode1",
                    "value": entryId
                });
                formdata.push({
                    "name": "initialdepositdate",
                    "value": initialDepositDate
                });
                formdata.push({
                    "name": "holdcoordinatesdate",
                    "value": holdCoordinatesDate
                });
                formdata.push({
                    "name": "coordinatesdate",
                    "value": coordinatesDate
                });
                formdata.push({
                    "name": "authrelcode",
                    "value": authRelCode
                });

                $('#status-code-em-form div.op-status').hide();
                $('#status-code-em-form div.op-links').hide();
                progressStart();
                $('#status-code-em-button').hide();

            }
        });

    }
    <!-- make the nav item for the current page active -->

    $('.nav a[href="' + pagePath + '"]').parent().addClass('active');
    handleCLoseWindow();

}); // end-ready
