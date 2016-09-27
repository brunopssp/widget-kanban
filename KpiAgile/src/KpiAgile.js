/*
This Sample Code is provided for the purpose of illustration only and is not intended to be used in a production environment.
THIS SAMPLE CODE AND ANY RELATED INFORMATION ARE PROVIDED "AS IS" WITHOUT WARRANTY OF ANY KIND, EITHER EXPRESSED OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE IMPLIED WARRANTIES OF MERCHANTABILITY AND/OR FITNESS FOR A PARTICULAR PURPOSE.
We grant You a nonexclusive, royalty-free right to use and modify the Sample Code and to reproduce and distribute the object code form of the Sample Code, provided that You agree: 
(i) to not use Our name, logo, or trademarks to market Your software product in which the Sample Code is embedded; 
(ii) to include a valid copyright notice on Your software product in which the Sample Code is embedded; and 
(iii) to indemnify, hold harmless, and defend Us and Our suppliers from and against any claims or lawsuits, including attorneys’ fees, that arise or result from the use or distribution of the Sample Code.
Please note: None of the conditions outlined in the disclaimer above will supercede the terms and conditions contained within the Premier Customer Services Description.
*/

var intCountDoneWI = new Array();
var intCountWI = new Array();
var nWIP = new Array();
var resultQueryLength = 0;
var settings = null;
var dtStartThroughput = new Date();
var dtEndThroughput = new Date(1969);
var client = null;

VSS.init({
    explicitNotifyLoaded: true,
    usePlatformStyles: true
});

VSS.require(["TFS/Dashboards/WidgetHelpers", "TFS/WorkItemTracking/RestClient", "TFS/Work/RestClient"],
    function(WidgetHelpers, TFS_Wit_WebApi, TFS_Team_WebApi) {
        WidgetHelpers.IncludeWidgetStyles();
        VSS.register("AgileMetric", function() {
            var getLeadTime = function(widgetSettings) {

                // Get a WIT client to make REST calls to VSTS
                client = TFS_Wit_WebApi.getClient();
                var projectId = VSS.getWebContext().project.id;
                var myTeam = TFS_Team_WebApi.getClient();
                settings = JSON.parse(widgetSettings.customSettings.data);
                if (!settings || !settings.metric) {
                    var customSettings = {
                        metric: "throughput"
                    };
                    settings = customSettings;
                }
                var $title = $('h2.title');
                $title.text(settings.title);


                if (WidgetHelpers.WidgetEvent.ConfigurationChange) {

                    var teamContext = {
                        project: VSS.getWebContext().project.name,
                        projectId: VSS.getWebContext().project.id,
                        team: VSS.getWebContext().team.name,
                        teamId: VSS.getWebContext().team.id
                    };
                    //recuperar area path 
                    return myTeam.getTeamFieldValues(teamContext).then(areaPath => {
                            //criar consulta
                            //nocture.dk/2016/01/02/lets-make-a-visual-studio-team-services-extension/
                            var Wiql = {
                                query: "SELECT [System.Id],[System.Title] " +
                                    "FROM WorkItems " +
                                    "WHERE [System.WorkItemType] in ('Product Backlog Item', 'Bug') " +
                                    "AND [System.State] <> 'New' " +
                                    "AND [System.State] <> 'Removed' " +
                                    "AND [System.CreatedDate] >= @Today - 180 " +
                                    "AND [System.AreaPath] under '" + areaPath.defaultValue + "'"
                            };

                            client.queryByWiql(Wiql).then(ResultQuery,
                                function(error) {
                                    $('#error').text("There is an error in query: " + error.message);
                                    return WidgetHelpers.WidgetStatusHelper.Failure(error.message);
                                });
                            return WidgetHelpers.WidgetStatusHelper.Success();
                        },
                        function(error) {
                            return WidgetHelpers.WidgetStatusHelper.Failure(error.message);
                        }
                    );
                }
            };
            return {
                load: function(widgetSettings) {
                    return getLeadTime(widgetSettings);
                },
                reload: function(widgetSettings) {
                    return getLeadTime(widgetSettings);
                }
            };
        });
        VSS.notifyLoadSucceeded();
    });

function ResultQuery(resultQuery) {

    //Clean the variables for each save time
    intCountDoneWI = new Array();
    intCountWI = new Array();
    nWIP = new Array();

    //ForEach workItem in query, get the respective Revision
    if (resultQuery.queryType == 1) { //flat query
        resultQueryLength = resultQuery.workItems.length;
        if (resultQueryLength > 0) {
            resultQuery.workItems.forEach(workItem => {
                client.getRevisions(workItem.id).then(ProcessRevisions);
            });
        }
    } else {
        resultQueryLength = resultQuery.workItemRelations.length;
        if (resultQueryLength > 0) {
            resultQuery.workItemRelations.forEach(workItem => {
                client.getRevisions(workItem.target.id).then(ProcessRevisions);
            });
        }
    }
    if (resultQueryLength == 0) {
        formatError();
        return WidgetHelpers.WidgetStatusHelper.Success();
    }
}

function ProcessRevisions(revisions) {

    //Count WIP
    if (revisions[revisions.length - 1].fields["System.State"] != "Done") {
        nWIP.push(1);
        EndProcess();
        return;
    }

    //Validations
    if (!revisions.some(s => s.fields["System.State"] == "Approved")) //Verify if PBI was approved
    {
        EndProcess();
        return;
    }
    if (!revisions.some(s => s.fields["System.State"] == "Done")) //Verify if PBI wasn't Done
    {
        EndProcess();
        return;
    }
    if (revisions[revisions.length - 1].fields["System.State"] == "Approved") //Verify if PBI return to initial state
    {
        EndProcess();
        return;
    }
    //Validations^^^^^^^^

    var RevApproved = revisions.find(workItemRevision => {
        return workItemRevision.fields["System.State"] == "Approved";
    });

    var RevDone = revisions.find(workItemRevision => {
        return workItemRevision.fields["System.State"] == "Done";
    });

    var dateApproved = (RevApproved != null && RevApproved.fields != undefined) ? new Date(RevApproved.fields["System.ChangedDate"]) : new Date();
    var dateDone = (RevDone != null && RevDone.fields != undefined) ? new Date(RevDone.fields["System.ChangedDate"]) : new Date();

    //Throughput - Range date
    if (dtStartThroughput > dateApproved) {
        dtStartThroughput = dateApproved;
    }
    if (dtEndThroughput < dateDone) {
        dtEndThroughput = dateDone;
    }
    intCountDoneWI.push(1);
    EndProcess();
}

function ShowResult() {
    if (intCountWI.length >= resultQueryLength) {

        if (intCountDoneWI.length <= 0) {
            formatError();
            return;
        }
        var tsIntervaloTotal = DaysBetween(dtStartThroughput, dtEndThroughput)

        if (settings.metric == "throughput") {
            var throughputPerWeek = (intCountDoneWI.length / (tsIntervaloTotal / 7));
            $('#query-info-container').empty().html(Math.round(throughputPerWeek * 10) / 10);
            $('#footer').empty().html("(Throughput) <br /> Items by Week");
        } else if (settings.metric == "leadtime") {
            var leadTime = (nWIP.length / (intCountDoneWI.length / tsIntervaloTotal)); //---"WIP * CycleTime" ou "WIP / Throughput
            $('#query-info-container').empty().html(Math.round(leadTime * 10) / 10);
            $('#footer').empty().html("(Lead Time) <br /> Estimate in Days");
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

function EndProcess() {
    intCountWI.push(1);
    ShowResult();
    return;
}

function formatError() {
    $('#error').empty();
    $('h2.title').text("Minha consulta");
    $('#query-info-container').empty().text("-");
    $('#footer').empty().text("This query does not return any Done work item");
    $('#widget').css({ 'color': 'white', 'background-color': 'rgb(0, 156, 204)', 'text-align': 'left' });
}