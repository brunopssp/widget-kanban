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
var queryDropdown = "#query-path-dropdown";
var optionsMetric = "input[type='radio'][name='radio']:checked";

var settings = null;

VSS.init({
    explicitNotifyLoaded: true,
    usePlatformStyles: true
});

VSS.require(["TFS/Dashboards/WidgetHelpers", "TFS/WorkItemTracking/RestClient", "TFS/WorkItemTracking/Contracts"], function (WidgetHelpers, TFS_Wit_WebApi, TFS_contracts) {
    VSS.register("AgileMetric.Configuration", function () {
        return {
            load: function load(widgetSettings, widgetConfigurationContext) {
                settings = JSON.parse(widgetSettings.customSettings.data);
                if (settings && settings.queryPath && settings.metric) {
                    $(queryDropdown).val(settings.queryPath);
                    if (settings.metric == "throughput") $("input[name=radio]")[0].checked = true;
                    // else if (settings.metric == "cycletime")
                    //     $("input[name=radio]")[1].checked = true;
                    else if (settings.metric == "leadtime") $("input[name=radio]")[1].checked = true;
                } else {
                    $("input[name=radio]")[0].checked = true;
                }

                TFS_Wit_WebApi.getClient().getQuery(VSS.getWebContext().project.id, "Shared Queries", TFS_contracts.QueryExpand.None, 2).then(getListQueries);

                //Enable Live Preview
                $(queryDropdown).on("change", function () {
                    var customSettings = {
                        data: JSON.stringify({
                            queryPath: $(queryDropdown).val(),
                            metric: $(optionsMetric, "#optionsMetric").val()
                        })
                    };
                    var eventName = WidgetHelpers.WidgetEvent.ConfigurationChange;
                    var eventArgs = WidgetHelpers.WidgetEvent.Args(customSettings);
                    widgetConfigurationContext.notify(eventName, eventArgs);
                });
                $("#optionsMetric input").on("change", function () {
                    var customSettings = {
                        data: JSON.stringify({
                            queryPath: $(queryDropdown).val(),
                            metric: $(optionsMetric, "#optionsMetric").val()
                        })
                    };
                    var eventName = WidgetHelpers.WidgetEvent.ConfigurationChange;
                    var eventArgs = WidgetHelpers.WidgetEvent.Args(customSettings);
                    widgetConfigurationContext.notify(eventName, eventArgs);
                });
                //^^^^^^
                return WidgetHelpers.WidgetStatusHelper.Success();
            },
            onSave: function onSave() {
                var customSettings = {
                    data: JSON.stringify({
                        queryPath: $(queryDropdown).val(),
                        metric: $(optionsMetric, "#optionsMetric").val()
                    })
                };
                return WidgetHelpers.WidgetConfigurationSave.Valid(customSettings);
            }
        };
    });
    VSS.notifyLoadSucceeded();
});

function getListQueries(queries) {
    //Get query result
    queries.children.forEach(function (rootFolderQuery) {
        if (rootFolderQuery.hasChildren == true) {
            rootFolderQuery.children.forEach(function (subFolderQuery) {
                if (subFolderQuery.hasChildren == undefined) {
                    fillDropDownList(subFolderQuery);
                }
            });
        }
        if (rootFolderQuery.hasChildren == undefined) {
            fillDropDownList(rootFolderQuery);
        }
    });
}

function fillDropDownList(rootFolderQuery) {
    //Set results to DropDownList
    $("<option>" + rootFolderQuery.path + "</option>").attr("value", rootFolderQuery.path).appendTo($(queryDropdown));
}
//# sourceMappingURL=Configuration.js.map