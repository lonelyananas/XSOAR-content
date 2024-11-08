var INTERNAL_MODULES_BRANDS = ['Scripts', 'Builtin', 'testmodule'];

var failedInstances = [];
var all = getModules();
var countFailed = 0;
var countSuccess = 0;
var instances = [];

Object.keys(all).forEach(function(m) {
    var isShouldBeTesting = all[m].defaultIgnored !== 'true' && INTERNAL_MODULES_BRANDS.indexOf(all[m].brand) === -1;
    if (all[m].state === 'active' && isShouldBeTesting) {
        var cmd = m.replace(/\s/g,'_') + '-test-module';
        var firstRest = executeCommand("addEntries", {"entries": JSON.stringify([{
            Type: entryTypes.note,
            Contents: 'testing **' + m + '**',
            HumanReadable: 'testing **' + m + '**',
            ContentsFormat: formats.markdown
        }])});

        var res =  executeCommand(cmd, {});
        var content = res[0].Contents
        var result = content.includes("Test button cannot be used") && (all[m].brand === "ServiceNow v2" || all[m].brand === "ServiceNow CMDB");
        if (result === true) {
            cmd = all[m].brand === "ServiceNow v2" ? "servicenow-oauth-test" : "servicenow-cmdb-oauth-test"
            res =  executeCommand(cmd, {});
        }
        executeCommand("addEntries", {"entries": JSON.stringify([{
            Type: entryTypes.note,
            Contents: 'done testing **' + m + '**:\n' + res[0].Contents,
            HumanReadable: 'done testing **' + m + '**:\n' + res[0].Contents,
            ContentsFormat: formats.markdown
        }])});
        if (res[0].Type === entryTypes.error) {
            countFailed++;
        }
        else {
            countSuccess++;
        }

        if (res[0].Type === entryTypes.error) {
            failedInstances.push({instance: m, brand: all[m].brand, category: all[m].category, information: res[0].Contents, status: 'failure' });
        }
        else {
            instances.push({instance: m, brand: all[m].brand, category: all[m].category, information: 'succeed', status: 'success' });
        }

    } else if (all[m].state === 'error' && isShouldBeTesting) {
            var errorMessage = 'The instance is in an error state, potentially due to an issue with the engine.';
            executeCommand("addEntries", {"entries": JSON.stringify([{
                Type: entryTypes.note,
                Contents: 'done testing **' + m + '**:\n' + errorMessage,
                HumanReadable: 'done testing **' + m + '**:\n' + errorMessage,
                ContentsFormat: formats.markdown
            }])});
            countFailed++;
            failedInstances.push({instance: m, brand: all[m].brand, category: all[m].category, information: errorMessage, status: 'failure' });
    }
});

var hr;
var success = countSuccess.toString();
var failed = countFailed.toString();
var total = (countSuccess + countFailed).toString();
// When no failed instances were found, the script returns a list with an empty dict because several scripts
// expect the output to be [{}].
if (countFailed === 0) {
    failedInstances.push({})
    hr = '### All active instances are available! ✅';
} else {
    hr = 'Total instances: ' + total +'\n';
    hr += 'Successed Instances: ' + success +'\n';
    hr += 'Failed Instances: ' + failed +'\n';
    hr += tableToMarkdown('Failed Instances:', failedInstances, ['instance', 'brand', 'category', 'information']);
}

return {
    Type: entryTypes.note,
    Contents: failedInstances,
    ContentsFormat: formats.markdown,
    HumanReadable: hr,
    EntryContext: {
        'FailedInstances': failedInstances,
        'SuccessInstances': instances,
        'InstancesCount':{
            'FailedCount': failed,
            'SuccessCount': success,
            'TotalCount': total
        }
    }
};
