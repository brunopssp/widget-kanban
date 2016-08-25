"use strict";

/*
This Sample Code is provided for the purpose of illustration only and is not intended to be used in a production environment.
THIS SAMPLE CODE AND ANY RELATED INFORMATION ARE PROVIDED "AS IS" WITHOUT WARRANTY OF ANY KIND, EITHER EXPRESSED OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE IMPLIED WARRANTIES OF MERCHANTABILITY AND/OR FITNESS FOR A PARTICULAR PURPOSE.
We grant You a nonexclusive, royalty-free right to use and modify the Sample Code and to reproduce and distribute the object code form of the Sample Code, provided that You agree: 
(i) to not use Our name, logo, or trademarks to market Your software product in which the Sample Code is embedded; 
(ii) to include a valid copyright notice on Your software product in which the Sample Code is embedded; and 
(iii) to indemnify, hold harmless, and defend Us and Our suppliers from and against any claims or lawsuits, including attorneys’ fees, that arise or result from the use or distribution of the Sample Code.
Please note: None of the conditions outlined in the disclaimer above will supercede the terms and conditions contained within the Premier Customer Services Description.
*/
var intCountWI = new Array();
var intWIP = new Array();
var intTotalPaginas = new Array();
var resultQueryLength = 0;
var settings = null;
var dtStartThroughput = new Date();
var dtEndThroughput = new Date(1969);
var client = null;
var fieldName = "System.BoardColumn";
var strStartStage = "1.Cópia e Ajustes";
var strLastStage = "5.Disponibilizado Para Homologação UAT";

VSS.init({
    explicitNotifyLoaded: true,
    usePlatformStyles: true
});

VSS.require(["TFS/Dashboards/WidgetHelpers", "TFS/WorkItemTracking/RestClient"], function (WidgetHelpers, TFS_Wit_WebApi) {
    WidgetHelpers.IncludeWidgetStyles();
    VSS.register("LeadTimeMetric", function () {
        var getLeadTime = function getLeadTime(widgetSettings) {

            // Get a WIT client to make REST calls to VSTS
            client = TFS_Wit_WebApi.getClient();
            var projectId = VSS.getWebContext().project.id;
            settings = JSON.parse(widgetSettings.customSettings.data);
            if (!settings || !settings.queryPath) {
                $('#query-info-container').empty().text("0");
                $('#footer').empty().text("Please configure a query path");
                return WidgetHelpers.WidgetStatusHelper.Success();
            }
            if (WidgetHelpers.WidgetEvent.ConfigurationChange) {
                $('#error').empty();
                $('h2.title').text("");
                $('#query-info-container').empty().text("");
                $('#widget').css({ 'background-color': 'rgb(255, 255, 255)', 'text-align': 'center' });
                $("<img></img>").attr("src", "img/loadingAnimation.gif").appendTo($('#query-info-container'));
                $('#footer').empty().text("");

                //Get a tfs query to get it's id
                return client.getQuery(projectId, settings.queryPath).then(function (query) {
                    //Get query result
                    client.queryById(query.id).then(ResultQuery, function (error) {
                        $('#error').text("There is an error in query " + settings.queryPath.substr(15) + ": " + error.message);
                        return WidgetHelpers.WidgetStatusHelper.Failure(error.message);
                    });
                    return WidgetHelpers.WidgetStatusHelper.Success();
                }, function (error) {
                    return WidgetHelpers.WidgetStatusHelper.Failure(error.message);
                });
            }
        };

        return {
            load: function load(widgetSettings) {
                return getLeadTime(widgetSettings);
            },
            reload: function reload(widgetSettings) {
                return getLeadTime(widgetSettings);
            }
        };
    });
    VSS.notifyLoadSucceeded();
});

function ResultQuery(resultQuery) {

    //ForEach workItem in query, get the respective Revision
    if (resultQuery.queryType == 1) {
        //flat query
        resultQueryLength = resultQuery.workItems.length;
        if (resultQueryLength > 0) {
            resultQuery.workItems.forEach(function (workItem) {
                client.getRevisions(workItem.id).then(ProcessRevisions);
            });
        }
    } else {
        resultQueryLength = resultQuery.workItemRelations.length;
        if (resultQueryLength > 0) {
            resultQuery.workItemRelations.forEach(function (workItem) {
                client.getRevisions(workItem.target.id).then(ProcessRevisions);
            });
        }
    }
    if (resultQueryLength == 0) {
        $('#error').empty();
        $('h2.title').text(settings.queryPath.substr(15));
        $('#query-info-container').empty().text("-");
        $('#footer').empty().text("This query does not return any work items");
        return WidgetHelpers.WidgetStatusHelper.Success();
    }
}

function ProcessRevisions(revisions) {

    if (revisions[revisions.length - 1].fields["System.State"] == "New") {
        EndProcess();
        return;
    }
    //Count WIP
    if (revisions[revisions.length - 1].fields[fieldName] != strLastStage && revisions.some(function (s) {
        return s.key == "Microsoft.VSTS.Scheduling.OriginalEstimate";
    })) {
        intWIP.push(revisions[revisions.length - 1].fields["Microsoft.VSTS.Scheduling.OriginalEstimate"]);
        EndProcess();
        return;
    }

    //Validations
    if (!revisions.some(function (s) {
        return s.Fields[fieldName] == strStartStage || s.Fields[fieldName] == strStartStage.remove(0, 2);
    })) //Valida se o PBI passou pelo stage Inicial
        {
            EndProcess();
            return;
        }
    if (!revisions.some(function (s) {
        return s.Fields[fieldName] == strLastStage || s.Fields[fieldName] == strLastStage.remove(0, 2);
    })) //Valida se o PBI chegou no stage Final
        {
            EndProcess();
            return;
        }
    if (revisions[revisions.length].fields[fieldName] == strStartStage || revisions[revisions.length].fields[fieldName] == strStartStage.remove(0, 2)) //Valida se o PBI voltou ao stage inicial
        {
            EndProcess();
            return;
        }
    //Validations^^^^^^^^

    var RevApproved = revisions.find(function (workItemRevision) {
        return workItemRevision.fields[fieldName] == strStartStage || workItemRevision.fields[fieldName] == strStartStage.remove(0, 2);
    });

    var RevDone = revisions.find(function (workItemRevision) {
        return workItemRevision.fields[fieldName] == strLastStage || workItemRevision.fields[fieldName] == strLastStage.remove(0, 2);
    });

    var dateApproved = RevApproved != null && RevApproved.fields != undefined ? new Date(RevApproved.fields["System.ChangedDate"]) : new Date();
    var dateDone = RevDone != null && RevDone.fields != undefined ? new Date(RevDone.fields["System.ChangedDate"]) : new Date();

    //Throughput - Range date
    if (dtStartThroughput > dateApproved) {
        dtStartThroughput = dateApproved;
    }
    if (dtEndThroughput < dateDone) {
        dtEndThroughput = dateDone;
    }
    intTotalPaginas.push(revisions[revisions.length].fields["Microsoft.VSTS.Scheduling.OriginalEstimate"]);
    EndProcess();
}

function EndProcess() {
    intCountWI.push(1);
    ShowResult();
    return;
}

function ShowResult() {
    if (intCountWI.length >= resultQueryLength) {
        var tsIntervaloTotal = DaysBetween(dtStartThroughput, dtEndThroughput);

        $('#error').empty();
        $('h2.title').text(settings.queryPath.substr(15));
        $('#widget').css({ 'color': 'white', 'background-color': 'rgb(0, 156, 204)', 'text-align': 'left' });

        var sumWIP = 0;
        intWIP.forEach(function (item) {
            sumWIP += item;
        });
        var sumPag = 0;
        intTotalPaginas.forEach(function (item) {
            sumPag += item;
        });
        var throughput = sumPag / tsIntervaloTotal;
        if (settings.metric == "throughput") {
            $('#query-info-container').empty().html(Math.round(throughput * 10) / 10);
            $('#footer').empty().text("(Throughput) Items by Day");
        } else if (settings.metric == "leadtime") {
            var leadTime = sumWIP / throughput; //---"WIP * CycleTime" ou "WIP / Throughput
            $('#query-info-container').empty().html(Math.round(leadTime * 10) / 10);
            $('#footer').empty().text("(Lead Time) Estimate in Days");
        }
    }
}

function DaysBetween(date1, date2) {
    //Get 1 day in milliseconds
    var one_day = 1000 * 60 * 60 * 24;

    // Convert both dates to milliseconds
    var date1_ms = date1.getTime();
    var date2_ms = date2.getTime(); //

    // Calculate the difference in milliseconds
    var difference_ms = date2_ms - date1_ms;

    // Convert back to days and return
    return Math.round(difference_ms / one_day);
}
//# sourceMappingURL=KpiAgile.Migracao.js.map