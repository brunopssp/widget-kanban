/*
This Sample Code is provided for the purpose of illustration only and is not intended to be used in a production environment.
THIS SAMPLE CODE AND ANY RELATED INFORMATION ARE PROVIDED "AS IS" WITHOUT WARRANTY OF ANY KIND, EITHER EXPRESSED OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE IMPLIED WARRANTIES OF MERCHANTABILITY AND/OR FITNESS FOR A PARTICULAR PURPOSE.
We grant You a nonexclusive, royalty-free right to use and modify the Sample Code and to reproduce and distribute the object code form of the Sample Code, provided that You agree: 
(i) to not use Our name, logo, or trademarks to market Your software product in which the Sample Code is embedded; 
(ii) to include a valid copyright notice on Your software product in which the Sample Code is embedded; and 
(iii) to indemnify, hold harmless, and defend Us and Our suppliers from and against any claims or lawsuits, including attorneys’ fees, that arise or result from the use or distribution of the Sample Code.
Please note: None of the conditions outlined in the disclaimer above will supercede the terms and conditions contained within the Premier Customer Services Description.
*/
//var queryDropdown = ("#query-path-dropdown");
var optionsMetric = ("input[type='radio'][name='radio']:checked");
var title = ("input[type='text'][name='title']");

var settings = null;

VSS.init({
    explicitNotifyLoaded: true,
    usePlatformStyles: true
});

VSS.require(["TFS/Dashboards/WidgetHelpers", "TFS/WorkItemTracking/RestClient", "TFS/WorkItemTracking/Contracts"],
    function(WidgetHelpers, TFS_Wit_WebApi, TFS_contracts) {
        VSS.register("AgileMetric.Configuration", function() {
            return {
                load: function(widgetSettings, widgetConfigurationContext) {
                    settings = JSON.parse(widgetSettings.customSettings.data);
                    if (settings && settings.metric && settings.title) {
                        $(title).val(settings.title);

                        if (settings.metric == "throughput")
                            $("input[name=radio]")[0].checked = true;
                        else if (settings.metric == "leadtime")
                            $("input[name=radio]")[1].checked = true;
                    } else {
                        $("input[name=radio]")[0].checked = true;
                    }

                    //Enable Live Preview
                    $("#name-input input").on("keyup", function() {
                        var customSettings = {
                            data: JSON.stringify({
                                title: $(title).val(),
                                metric: $(optionsMetric, "#optionsMetric").val()
                            })
                        };
                        var eventName = WidgetHelpers.WidgetEvent.ConfigurationChange;
                        var eventArgs = WidgetHelpers.WidgetEvent.Args(customSettings);
                        widgetConfigurationContext.notify(eventName, eventArgs);
                    });
                    $("#optionsMetric input").on("change", function() {
                        var customSettings = {
                            data: JSON.stringify({
                                title: $(title).val(),
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
                onSave: function() {
                    var customSettings = {
                        data: JSON.stringify({
                            title: $(title).val(),
                            metric: $(optionsMetric, "#optionsMetric").val()
                        })
                    };
                    return WidgetHelpers.WidgetConfigurationSave.Valid(customSettings);
                }
            }
        });
        VSS.notifyLoadSucceeded();
    }
);